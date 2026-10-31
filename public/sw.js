/* ════════════════════════════════════════════════════════
   Service Worker — Web Push Notifications
   Handles background push events, shows notifications
   with sound badge, click-to-open behavior
   ════════════════════════════════════════════════════════ */

/// <reference lib="webworker" />

const sw = /** @type {ServiceWorkerGlobalScope} */ (/** @type {unknown} */ (self));

sw.addEventListener("push", function (event) {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "Nagpur Connect", body: event.data.text() };
  }

  const title = payload.title || "Nagpur Connect";
  const options = {
    body: payload.body || payload.message || "",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag: payload.tag || "nagpur-connect-" + Date.now(),
    data: {
      url: payload.url || "/dashboard",
      incidentId: payload.incidentId || null,
    },
    vibrate: [200, 100, 200],
    requireInteraction: payload.priority === "critical",
  };

  event.waitUntil(sw.registration.showNotification(title, options));
});

sw.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const url = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    sw.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
      // Focus existing tab if open
      for (const client of clientList) {
        if (client.url.includes("/dashboard") && "focus" in client) {
          return client.focus();
        }
      }
      // Otherwise open new tab
      if (sw.clients.openWindow) {
        return sw.clients.openWindow(url);
      }
    })
  );
});

// Activate immediately
sw.addEventListener("activate", function (event) {
  event.waitUntil(sw.clients.claim());
});
