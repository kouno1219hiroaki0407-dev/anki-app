const CACHE_NAME = "anki-cache-v1";
const urlsToCache = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./db.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "https://unpkg.com/dexie@3.2.4/dist/dexie.min.js"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});