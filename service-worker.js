// ╔══════════════════════════════════════════════════╗
// ║  CARE Manuals PWA — Service Worker v6           ║
// ║  Network-first with cache-busting               ║
// ║  Bypasses GitHub Pages CDN cache on mobile      ║
// ╚══════════════════════════════════════════════════╝

const APP_VERSION = "1.0.0";
const CACHE_NAME  = "care-manuals-v" + APP_VERSION;

// ── Install: skip waiting immediately ──
self.addEventListener("install", function(event) {
  self.skipWaiting();
});

// ── Activate: delete ALL old caches, claim all tabs ──
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

// ── Fetch: Network-first with forced revalidation ──
self.addEventListener("fetch", function(event) {
  if (event.request.method !== "GET") return;
  if (!event.request.url.startsWith("http")) return;

  event.respondWith(
    fetch(event.request, {
      // Force browser to bypass its own HTTP cache
      // This is the key fix for GitHub Pages CDN caching
      cache: "no-cache"
    })
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
      // Offline fallback — serve from SW cache
      return caches.match(event.request);
    })
  );
});

// ── Listen for skip-waiting message from page ──
self.addEventListener("message", function(event) {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
