const CACHE_NAME = "care-manuals-pwa-v4";

const CORE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json"
];

const STATIC_ASSETS = [
  "./apple-touch-icon.png",
  "./icon-192.png",
  "./icon-512.png",
  "./care_logo_orange.png",
  "./the_lotus_flower_logo.jpg"
];

// Install: pre-cache core + static
self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.allSettled(
        [...CORE_ASSETS, ...STATIC_ASSETS].map(url =>
          cache.add(url).catch(() => {})
        )
      )
    )
  );
});

// Activate: delete ALL old caches immediately
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch strategy
self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);

  // PDFs and images: cache-first (large files, rarely change)
  if (url.pathname.endsWith(".pdf") ||
      url.pathname.endsWith(".png") ||
      url.pathname.endsWith(".jpg") ||
      url.pathname.endsWith(".jpeg")) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          if (response.ok) {
            var clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        });
      }).catch(() => caches.match(event.request))
    );
    return;
  }

  // HTML, JS, CSS, manifest: network-first (always fetch latest)
  event.respondWith(
    fetch(event.request).then(response => {
      if (response.ok) {
        var clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
      }
      return response;
    }).catch(() => caches.match(event.request))
  );
});
