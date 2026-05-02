// ╔══════════════════════════════════════════════════╗
// ║  CARE Manuals PWA — Service Worker v7           ║
// ║  Network-first + controlled update flow         ║
// ╚══════════════════════════════════════════════════╝

const APP_VERSION = "1.0.0";
const CACHE_NAME  = "care-manuals-v" + APP_VERSION;

// ── Install: do NOT skipWaiting here ──
// New SW waits until user clicks "Update Now"
self.addEventListener("install", function(event) {
  // Intentionally not calling self.skipWaiting()
  // This keeps the new SW in "waiting" state
  // so the page can detect it and show the update banner
});

// ── Activate: delete old caches, claim tabs ──
self.addEventListener("activate", function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// ── Fetch: Network-first, bypass HTTP cache ──
self.addEventListener("fetch", function(event) {
  if (event.request.method !== "GET") return;
  if (!event.request.url.startsWith("http")) return;

  event.respondWith(
    fetch(event.request, { cache: "no-cache" })
    .then(function(response) {
      if (response.ok) {
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(c) {
          c.put(event.request, clone);
        });
      }
      return response;
    })
    .catch(function() {
      return caches.match(event.request);
    })
  );
});

// ── Only skipWaiting when user clicks "Update Now" ──
self.addEventListener("message", function(event) {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
