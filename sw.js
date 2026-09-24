const CACHE = 'thankyou-v2';

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './presets.json',
  './quotes.json',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
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

  if (url.pathname.endsWith('/presets.json') ||
      url.pathname.endsWith('/quotes.json')) {
    e.respondWith(
      fetch(e.request)
        .then(function(r) {
          var copy = r.clone();
          caches.open(CACHE).then(function(c) { c.put(e.request, copy); });
          return r;
        })
        .catch(function() { return caches.match(e.request); })
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(function(r) {
      return r || fetch(e.request);
    })
  );
});