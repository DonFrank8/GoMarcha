const CACHE_VERSION = "marcha-beta-v6";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

const SHELL_PATHS = new Set([
  "/",
  "/index.html",
  "/app.js",
  "/style.css",
  "/manifest.json"
]);

const PRE_CACHE_ASSETS = [
  "/",
  "/index.html",
  "/style.css",
  "/manifest.json",
  "./assets/favicon.png",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/apple-touch-icon.png",
  "./assets/logo.png",
  "./assets/logo-schrift.png"
];

function canCacheResponse(response) {
  return Boolean(response) && response.ok && response.type !== "opaque";
}

function isShellRequest(request, requestUrl) {
  const normalizedPath = requestUrl.pathname === "" ? "/" : requestUrl.pathname;
  return request.mode === "navigate" || SHELL_PATHS.has(normalizedPath);
}

async function networkFirstForShell(request) {
  const cache = await caches.open(STATIC_CACHE);
  try {
    const networkResponse = await fetch(request, { cache: "no-store" });
    if (canCacheResponse(networkResponse)) {
      await cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (_error) {
    const cachedResponse = await cache.match(request);
    if (cachedResponse) return cachedResponse;
    const fallback = await cache.match("/index.html");
    if (fallback) return fallback;
    return new Response("Offline", { status: 503, statusText: "Offline" });
  }
}

async function staleWhileRevalidateRuntime(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cachedResponse = await cache.match(request);

  const networkFetch = fetch(request)
    .then(async (networkResponse) => {
      if (canCacheResponse(networkResponse)) {
        await cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => null);

  if (cachedResponse) {
    networkFetch.catch(() => null);
    return cachedResponse;
  }

  const freshResponse = await networkFetch;
  if (freshResponse) return freshResponse;

  return new Response("Offline", { status: 503, statusText: "Offline" });
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      await cache.addAll(PRE_CACHE_ASSETS);
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== RUNTIME_CACHE)
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const requestUrl = new URL(request.url);
  if (requestUrl.origin !== self.location.origin) return;
  if (!/^https?:/.test(requestUrl.protocol)) return;

  if (isShellRequest(request, requestUrl)) {
    event.respondWith(networkFirstForShell(request));
    return;
  }

  event.respondWith(staleWhileRevalidateRuntime(request));
});