const CACHE = 'thankyou-v226';
const AUDIO = 'thankyou-audio-v1';

const ASSETS = [
  './',
  './index.html',
  './main.css',
  './app.js',
  './strokes.js',
  './manifest.json',
  './presets.json',
  './panel-1.html',
  './panel-2.html',
  './panel-3.html',
  './panel-3-no.html',
  './panel-4.html',
  './icons/icon.svg',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
  './icons/icon-192-maskable.png',
  './icons/icon-512-maskable.png',
  './icons/favicon-48x48.png',
  './icons/apple-touch-icon.png',
  './icons/1790678998862.jpg',
  './icons/1790835034553.jpg',
  './icons/44173_0c6eff.png'
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(c) {
      return c.addAll(ASSETS.map(function(u) {
        return new Request(u, { cache: 'reload' });
      }));
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE && k !== AUDIO; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

function cacheKey(req) {
  var u = new URL(req.url);
  return u.origin + u.pathname;
}

function networkFirst(e, navFallback) {
  var key = cacheKey(e.request);
  var controller = new AbortController();
  var abortTimer = setTimeout(function() { controller.abort(); }, 20000);
  var net = fetch(e.request, { cache: 'no-cache', signal: controller.signal });
  var timer;
  var timeout = new Promise(function(_, reject) { timer = setTimeout(reject, 4000); });
  function store(r) {
    return caches.open(CACHE).then(function(c) { return c.put(key, r); });
  }
  return Promise.race([net, timeout])
    .then(function(r) {
      clearTimeout(timer); clearTimeout(abortTimer);
      if (!r.ok) throw new Error('bad status: ' + r.status);
      e.waitUntil(store(r.clone()));
      return r;
    })
    .catch(function() {
      clearTimeout(timer);
      e.waitUntil(net.then(function(r) {
        clearTimeout(abortTimer);
        if (r && r.ok) return store(r.clone());
      }).catch(function() { clearTimeout(abortTimer); }));
      return caches.match(key).then(function(hit) {
        if (hit) return hit;
        if (navFallback && e.request.mode === 'navigate') {
          return caches.match(new URL('./index.html', self.location).href)
            .then(function(idx) { return idx || net; });
        }
        return net;
      });
    });
}

self.addEventListener('fetch', function(e) {
  if (e.request.method !== 'GET') return;
  if (new URL(e.request.url).origin !== self.location.origin) return;

  var url = new URL(e.request.url);

  /* presets.json — network-first (see networkFirst). */
  if (url.pathname.endsWith('/presets.json')) {
    e.respondWith(networkFirst(e, false));
    return;
  }

  /* HTML, CSS, JS, and directory roots — network-first, with a
     fallback to the cached index.html for navigations. */
  if (url.pathname.endsWith('.html') ||
      url.pathname.endsWith('.css') ||
      url.pathname.endsWith('.js') ||
      url.pathname.endsWith('/')) {
    e.respondWith(networkFirst(e, true));
    return;
  }

  /* Cache-on-first-use for audio. The ambient tracks are 17-minute
     files (~16MB each) and the app is fully usable before either
     downloads, so they are kept out of the precache list to keep
     install fast and robust.

     MP3s are stored in AUDIO, not CACHE. AUDIO is NOT versioned —
     it is deliberately untouched by the version bump and by the
     activate cleanup, so a deploy that only changes JS/CSS/HTML
     does not force the ~50MB ambient pool to re-download. The
     tradeoff is that a change to an MP3 file itself would not be
     picked up automatically; if a track is ever re-encoded, bump
     AUDIO's own suffix (v1 → v2) and the old cache will be swept
     by the next activate.

     The first request for a given .mp3 streams from the network and
     is written into AUDIO in the background; subsequent requests
     hit the cache. A partial or failed download leaves no cache
     entry, so the next request retries from the network.

     The netRes.ok guard is load-bearing: a 404 or 5xx response
     streams through to the caller (so loadAudioBuffer's !r.ok throw
     fires and returns null) without being cached. Caching an error
     response would poison every future session until the cache was
     manually cleared.

     The write is wrapped in e.waitUntil so the worker is kept alive
     until the 16MB payload finishes streaming into the cache — on a
     slow link this can take far longer than the response itself, and
     an unwrapped floating promise would be cut short when the worker
     process is stopped, leaving the track uncached and forcing a
     full re-download on the next visit. The try/catch fallback is a
     best-effort escape hatch for the spec case where the event's
     dispatch flag is already unset; in that state no mechanism
     keeps the worker alive and the pending write may or may not
     complete. It is NOT equivalent to the e.waitUntil path and
     should not be treated as a second caching strategy.

     .mp3 and .m4a requests are issued by app.js without a query string, so
     ignoreSearch is not required here. */
  if (/\.(mp3|m4a)$/.test(url.pathname)) {
    e.respondWith(
      caches.open(AUDIO).then(function(c) {
        return c.match(e.request).then(function(r) {
          if (r) return r;
          return fetch(e.request).then(function(netRes) {
            if (netRes && netRes.ok) {
              var copy = netRes.clone();
              try {
                e.waitUntil(c.put(e.request, copy));
              } catch (err) {
                c.put(e.request, copy);
              }
            }
            return netRes;
          });
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