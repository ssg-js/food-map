/* Only local offline/help assets are cached. API responses and Google content never enter CacheStorage. */
const CACHE = "food-map-offline-v1";
const ASSETS = ["/offline.html", "/icons/icon-192.png", "/icons/icon-512.png", "/icons/maskable-512.png", "/icons/apple-touch-icon.png"];
self.addEventListener("install", (event) => { event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS))); });
self.addEventListener("activate", (event) => { event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith("food-map-offline-") && key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;
  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request).catch(() => caches.match("/offline.html").then((response) => response || new Response("인터넷 연결을 확인해주세요.", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } }))));
  } else if (ASSETS.includes(url.pathname)) {
    event.respondWith(caches.match(event.request).then((response) => response || fetch(event.request)));
  }
});
