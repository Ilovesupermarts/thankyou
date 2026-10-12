const CACHE = 'thankyou-v99';

const ASSETS = [
  './',
  './index.html',
  './main.css',
  './app.js',
  './manifest.json',
  './presets.json',
  './quotes.json',
  './panel-1.html',
  './panel-2.html',
  './panel-3.html',
  './panel-3-no.html',
  './panel-4.html',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './icons/1790678998862.jpg',
  './icons/1790835034553.jpg',
  './icons/44173_0c6eff.png'
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(c) { return c.addAll(ASSETS); })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  var url = new URL(e.request.url);

  /* presets.json and quotes.json — network-first with cache fallback.
     The ignoreSearch flag matters: even though app.js no longer
     appends a ?v= cache-buster to these URLs, a future change that
     reintroduces one would break the offline fallback without it.
     caches.match() matches by full URL including the search string,
     and the precache installed the bare URL. */
  if (url.pathname.endsWith('/presets.json') ||
      url.pathname.endsWith('/quotes.json')) {
    e.respondWith(
      fetch(e.request)
        .then(function(r) {
          var copy = r.clone();
          caches.open(CACHE).then(function(c) { c.put(e.request, copy); });
          return r;
        })
        .catch(function() {
          return caches.match(e.request, { ignoreSearch: true });
        })
    );
    return;
  }

  /* HTML, CSS, JS, and directory roots — network-first with cached
     fallback. Same ignoreSearch reasoning as above. The navigation
     fallback to ./index.html also uses ignoreSearch so a query
     string on a navigation request still resolves. */
  if (url.pathname.endsWith('.html') ||
      url.pathname.endsWith('.css') ||
      url.pathname.endsWith('.js') ||
      url.pathname.endsWith('/')) {
    e.respondWith(
      fetch(e.request)
        .then(function(r) {
          var copy = r.clone();
          caches.open(CACHE).then(function(c) { c.put(e.request, copy); });
          return r;
        })
        .catch(function() {
          return caches.match(e.request, { ignoreSearch: true }).then(function(r) {
            if (r) return r;
            if (e.request.mode === 'navigate') {
              return caches.match('./index.html', { ignoreSearch: true });
            }
          });
        })
    );
    return;
  }

  /* Cache-on-first-use for audio. The ambient tracks are 17-minute
     files (~16MB each) and the app is fully usable before either
     downloads, so they are kept out of the precache list to keep
     install fast and robust. The first request for a given .mp3
     streams from the network and is written into the cache in the
     background; subsequent requests hit the cache. A partial or
     failed download leaves no cache entry, so the next request
     retries from the network.

     The netRes.ok guard is load-bearing: a 404 or 5xx response
     streams through to the caller (so loadAudioBuffer's !r.ok throw
     fires and returns null) without being cached. Caching an error
     response would poison every future session until the cache was
     manually cleared.

     .mp3 requests are issued by app.js without a query string, so
     ignoreSearch is not required here. */
  if (url.pathname.endsWith('.mp3')) {
    e.respondWith(
      caches.match(e.request).then(function(r) {
        if (r) return r;
        return fetch(e.request).then(function(netRes) {
          if (netRes && netRes.ok) {
            var copy = netRes.clone();
            caches.open(CACHE).then(function(c) { c.put(e.request, copy); });
          }
          return netRes;
        });
      })
    );
    return;
  }

  /* Everything else — cache-first with network fallback. Icons and
     images fall here, and neither is issued with a query string, so
     ignoreSearch is left off. */
  e.respondWith(
    caches.match(e.request).then(function(r) {
      return r || fetch(e.request);
    })
  );
});