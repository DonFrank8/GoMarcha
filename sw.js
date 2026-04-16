const CACHE_VERSION = "marcha-pwa-v1";
const CORE_CACHE = `${CACHE_VERSION}-core`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

const CORE_ASSETS = [
  "/",
  "/index.html",
  "/app.js",
  "/style.css",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/assets/marcha-logo-icon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CORE_CACHE).then((cache) => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CORE_CACHE && key !== RUNTIME_CACHE)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

function isHttpRequest(request) {
  return request.method === "GET" && request.url.startsWith("http");
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (!isHttpRequest(request)) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (!response || response.status !== 200 || response.type === "opaque") return response;
        const responseClone = response.clone();
        caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, responseClone));
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        if (request.mode === "navigate") {
          const fallbackPage = await caches.match("/index.html");
          if (fallbackPage) return fallbackPage;
        }
        return new Response("Offline", {
          status: 503,
          statusText: "Offline"
        });
      })
  );
});
