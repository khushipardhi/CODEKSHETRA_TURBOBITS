/* ════════════════════════════════════════════════════════
   Service Worker — Web Push Notifications & PWA Cache
   Handles background push events, offline caching,
   with sound badge, click-to-open behavior
   ════════════════════════════════════════════════════════ */

/// <reference lib="webworker" />

const sw = /** @type {ServiceWorkerGlobalScope} */ (/** @type {unknown} */ (self));

const CACHE_NAME = "agentone-pwa-v1";
const PRECACHE_ASSETS = [
  "/",
  "/manifest.json",
  "/favicon.png",
  "/apple-touch-icon.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

// Precache essential assets on install & activate immediately
sw.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(PRECACHE_ASSETS).catch(function (err) {
        console.warn("[SW] Precache warning:", err);
      });
    })
  );
  sw.skipWaiting();
});

// Activate immediately & clean stale caches
sw.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.map(function (key) {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(function () {
      return sw.clients.claim();
    })
  );
});

// Fetch event listener: network-first with cache fallback
sw.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  // Only handle same-origin requests
  if (url.origin !== location.origin) return;

  // Skip API routes and dynamic Next.js data to ensure live telemetry
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/_next/data/")) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(function (networkResponse) {
        // Cache static assets (images, icons, fonts)
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          (url.pathname.startsWith("/icons/") ||
           url.pathname.endsWith(".png") ||
           url.pathname.endsWith(".svg") ||
           url.pathname.endsWith(".ico") ||
           url.pathname === "/manifest.json")
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(function () {
        return caches.match(event.request).then(function (cachedResponse) {
          if (cachedResponse) return cachedResponse;
          if (event.request.mode === "navigate") {
            return caches.match("/");
          }
        });
      })
  );
});

sw.addEventListener("push", function (event) {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "AGENTONE CivicOS", body: event.data.text() };
  }

  const title = payload.title || "AGENTONE CivicOS";
  const options = {
    body: payload.body || payload.message || "",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag: payload.tag || "agentone-notification-" + Date.now(),
    data: {
      url: payload.url || "/admin/mumbai/agents",
      incidentId: payload.incidentId || null,
    },
    vibrate: [200, 100, 200],
    requireInteraction: payload.priority === "critical",
  };

  event.waitUntil(sw.registration.showNotification(title, options));
});

sw.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const url = event.notification.data?.url || "/admin/mumbai/agents";

  event.waitUntil(
    sw.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
      for (const client of clientList) {
        if (client.url.includes(url) && "focus" in client) {
          return client.focus();
        }
      }
      if (sw.clients.openWindow) {
        return sw.clients.openWindow(url);
      }
    })
  );
});
