var CACHE_NAME = "leihlokal-cache-v1";
var urlsToCache = [
  "index.html",
  "global.css",
  "build/bundle.css",
  "build/bundle.js",
  "favicon.png",
  "#/rentals",
  "#/items",
  "#/customers",
  "#/settings",
];

function shouldCache(request) {
  return (
    request.method === "GET" &&
    !request.url.includes(":6984") &&
    !request.url.includes(":5984") &&
    !request.url.includes('db.leihlokal-ka.de') &&
    request.url.indexOf("chrome-extension") !== 0
  );
}

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
  if (shouldCache(event.request)) {
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
