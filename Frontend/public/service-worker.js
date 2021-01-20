var CACHE_NAME = "leihlokal-cache-v1";
var urlsToCache = [
  "index.html",
  "global.css",
  "build/bundle.css",
  "build/bundle.js",
  "favicon.png",
];

self.addEventListener("install", function (event) {
  event.waitUntil(async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(urlsToCache);
  });
});

// delete old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(async () => {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames
        .filter((cacheName) => cacheName !== CACHE_NAME)
        .forEach((cacheName) => caches.delete(cacheName))
    );
  });
});

self.addEventListener("fetch", (event) => {
  if (event.request.method === "GET") {
    event.respondWith(
      (async function () {
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(event.request);
        const networkResponsePromise = fetch(event.request);

        event.waitUntil(
          (async function () {
            const networkResponse = await networkResponsePromise;
            await cache.put(event.request, networkResponse.clone());
          })()
        );

        // Returned the cached response if we have one, otherwise return the network response.
        return cachedResponse || networkResponsePromise;
      })()
    );
  }
});
