// ╔══════════════════════════════════════════════════╗
// ║  CARE Manuals PWA — Service Worker v8           ║
// ║  Cache-busting that defeats GitHub Pages CDN    ║
// ╚══════════════════════════════════════════════════╝

const APP_VERSION = "1.0.0";
const CACHE_NAME  = "care-manuals-v" + APP_VERSION;

// Install: stay in waiting state until user clicks Update
self.addEventListener("install", function(event) {
  // Do NOT call self.skipWaiting() here
});

// Activate: delete old caches, claim tabs
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

// Fetch: Network-first with CDN cache-busting
self.addEventListener("fetch", function(event) {
  if (event.request.method !== "GET") return;
  if (!event.request.url.startsWith("http")) return;

  var requestUrl = new URL(event.request.url);

  // Skip external resources (fonts, CDNs etc)
  if (requestUrl.origin !== self.location.origin) return;

  event.respondWith(
    // Build a cache-busted URL to defeat GitHub Pages CDN
    (function() {
      var bustUrl = new URL(event.request.url);
      bustUrl.searchParams.set('_sw', APP_VERSION + '.' + Math.floor(Date.now() / 60000));
      var bustRequest = new Request(bustUrl.toString(), {
        method: event.request.method,
        headers: event.request.headers,
        mode: 'cors',
        credentials: 'same-origin',
        redirect: 'follow'
      });

      return fetch(bustRequest)
        .then(function(response) {
          if (response.ok) {
            var clone = response.clone();
            // Store under ORIGINAL url (without query param)
            caches.open(CACHE_NAME).then(function(c) {
              c.put(event.request, clone);
            });
          }
          return response;
        })
        .catch(function() {
          // Offline — serve from cache
          return caches.match(event.request);
        });
    })()
  );
});

// Only skipWaiting when user clicks "Update Now"
self.addEventListener("message", function(event) {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
