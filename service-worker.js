// ╔══════════════════════════════════════════════════╗
// ║  CARE Manuals PWA — Service Worker v5           ║
// ║  Strategy: Network-first for all core assets    ║
// ║  Change APP_VERSION to bust cache on update     ║
// ╚══════════════════════════════════════════════════╝

const APP_VERSION = "1.0.0";
const CACHE_NAME  = "care-manuals-v" + APP_VERSION;

// ── Install: skip waiting immediately ──
self.addEventListener("install", event => {
  self.skipWaiting();
});

// ── Activate: delete ALL old caches, claim all tabs ──
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => {
          console.log("[SW] Deleting old cache:", k);
          return caches.delete(k);
        })
      )
    ).then(() => {
      console.log("[SW] Claiming clients, version:", APP_VERSION);
      return self.clients.claim();
    })
  );
});

// ── Fetch: Network-first for everything ──
// Try network → cache response → fallback to cache if offline
self.addEventListener("fetch", event => {
  // Skip non-GET and chrome-extension requests
  if (event.request.method !== "GET") return;
  if (!event.request.url.startsWith("http")) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Got network response — cache it and return
        if (response.ok) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, clone);
          });
        }
        return response;
      })
      .catch(() => {
        // Network failed — try cache (offline mode)
        return caches.match(event.request);
      })
  );
});

// ── Listen for skip-waiting message from page ──
self.addEventListener("message", event => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
