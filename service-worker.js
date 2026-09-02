// Minimal service worker: enables "Add to Home Screen" / installable app behavior
// and lets the dashboard shell load instantly, while data.json is always fetched fresh from the network.
const CACHE_NAME = "rcps-incident-dashboard-v1";
const SHELL_FILES = ["./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  // Always go to network for data.json so the dashboard reflects the latest refresh.
  if (url.pathname.endsWith("data.json")) {
    event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
    return;
  }
  // App shell: cache-first for speed, falling back to network.
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
