const CACHE = 'thankyou-v31';

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
  './icons/44173_0c6eff.png',
  './icons/VID-20260929-WA0002.mp4',
  './Sound/cave-water-drop-echo-a053fcdf.mp3'
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
          return caches.match(e.request).then(function(r) {
            if (r) return r;
            if (e.request.mode === 'navigate') {
              return caches.match('./index.html');
            }
          });
        })
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(function(r) {
      return r || fetch(e.request);
    })
  );
});