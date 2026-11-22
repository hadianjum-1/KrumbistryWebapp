// KRUMBISTRY POS Service Worker
// Multi-Device Offline PWA Shell Cache

const CACHE_NAME = "krumbistry-pos-v1";
const STATIC_ASSETS = [
  "/pos",
  "/pos/login",
  "/pos/dashboard",
  "/pos/sales",
  "/pos/register",
  "/pos/sync",
  "/pos/settings",
  "/pos-manifest.json",
  "/logo-dark.png",
  "/logo-light.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn("Service worker cache.addAll non-fatal warning:", err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // SECURITY: Never cache administrative endpoints or sensitive auth responses
  if (
    url.pathname.startsWith("/api/admin") ||
    url.pathname.startsWith("/api/pos/auth") ||
    url.pathname.startsWith("/admin")
  ) {
    return; // Pass through directly to network
  }

  // Network-first for POS API calls (like products, sync, etc.)
  if (url.pathname.startsWith("/api/pos")) {
    return; // Handled dynamically by app with IndexedDB fallback
  }

  // Cache-first / stale-while-revalidate for static assets & POS app shell
  if (event.request.method === "GET") {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            if (
              networkResponse &&
              networkResponse.status === 200 &&
              networkResponse.type === "basic"
            ) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
  }
});
