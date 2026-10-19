// SMT-1 Service Worker v2 (Robust offline & safe chunk loading for Next.js)
const CACHE_NAME = "smt1-cache-v2";
const STATIC_ASSETS = [
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
];

// Install: pre-cache essential static assets (DO NOT pre-cache dynamic HTML `/` to avoid chunk hash mismatch)
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate: clean up ALL old caches (including v1)
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

// Fetch: smart strategy
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only handle GET requests
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Skip external third-party requests (e.g. telegram.org, vercel analytics)
  if (url.origin !== self.location.origin) return;

  // Strategy 1: HTML Navigation requests (pages) -> NETWORK FIRST with offline fallback
  // This prevents the dreaded stale chunk 404 / hydration crash on iOS
  if (request.mode === "navigate" || request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => {
          // If offline, serve cached version of this page or cached root
          const cached = await caches.match(request);
          if (cached) return cached;
          const rootCached = await caches.match("/");
          if (rootCached) return rootCached;
          return new Response("Вы находитесь оффлайн. Подключите интернет для обновления.", {
            headers: { "Content-Type": "text/html; charset=utf-8" },
          });
        })
    );
    return;
  }

  // Strategy 2: Next.js immutable static assets (_next/static/) -> CACHE FIRST with network fallback
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        });
      })
    );
    return;
  }

  // Strategy 3: Images & icons -> STALE WHILE REVALIDATE
  if (
    url.pathname.match(/\.(png|jpg|jpeg|svg|webp|ico|woff2?)$/) ||
    STATIC_ASSETS.includes(url.pathname)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request)
          .then((response) => {
            if (response && response.status === 200) {
              const copy = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            }
            return response;
          })
          .catch(() => cached);
        return cached || fetchPromise;
      })
    );
    return;
  }

  // Default: Network fetch
  event.respondWith(fetch(request));
});
