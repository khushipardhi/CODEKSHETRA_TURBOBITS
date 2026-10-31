/* ════════════════════════════════════════════════════════
   Browser Notifications — Client-side utility
   Requests permission, shows native browser notifications
   with sound, tracks shown IDs to prevent duplicates
   ════════════════════════════════════════════════════════ */

const NOTIFICATION_SOUND_URL = "/notification.wav";

/** Track which notification IDs have already been shown */
const shownIds = new Set<string>();

/** Play notification sound */
function playSound(): void {
  try {
    const audio = new Audio(NOTIFICATION_SOUND_URL);
    audio.volume = 0.5;
    audio.play().catch(() => {
      // Autoplay blocked — user hasn't interacted yet
    });
  } catch {
    // Audio not supported
  }
}

/** Request browser notification permission */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";

  try {
    return await Notification.requestPermission();
  } catch {
    return "denied";
  }
}

/** Get current permission state */
export function getNotificationPermission(): NotificationPermission {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }
  return Notification.permission;
}

/** Show a browser notification with sound (deduplicates by ID) */
export function showBrowserNotification(opts: {
  id: string;
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  onClick?: () => void;
}): void {
  // Skip if SSR, no support, no permission, or already shown
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  if (shownIds.has(opts.id)) return;

  shownIds.add(opts.id);

  // Play sound
  playSound();

  // Show native notification
  try {
    const notif = new Notification(opts.title, {
      body: opts.body,
      icon: opts.icon || "/icons/icon-192.png",
      tag: opts.tag || opts.id,
      badge: "/icons/icon-192.png",
      requireInteraction: false,
    });

    if (opts.onClick) {
      notif.onclick = () => {
        window.focus();
        opts.onClick?.();
        notif.close();
      };
    }

    // Auto-close after 8 seconds
    setTimeout(() => notif.close(), 8_000);
  } catch {
    // Notification creation failed (e.g., mobile restrictions)
  }
}

/**
 * Check for new notifications and show browser alerts.
 * Call this after polling /api/notifications.
 * Pass only UNREAD notifications.
 */
export function showNewNotifications(
  notifications: Array<{ id: string; title: string; message: string; isRead: boolean }>,
  onClick?: (id: string) => void
): void {
  for (const n of notifications) {
    if (n.isRead) continue;
    showBrowserNotification({
      id: n.id,
      title: n.title,
      body: n.message,
      onClick: onClick ? () => onClick(n.id) : undefined,
    });
  }
}

// ─── VAPID Push Subscription ─────────────────────────

const VAPID_PUBLIC_KEY = "BJ0sCzV6gYOOVWQAX8qA019mevAv2YpZOh9OXXLi_x7pB0q-0tJBftrTkSkBJKwd391aQ6s07cZXd1cXei7ezks";

/** Convert VAPID key from base64 to Uint8Array (for service worker) */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Register service worker and subscribe to VAPID push.
 * Returns the PushSubscription or null if unavailable.
 */
export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;

    // Check existing subscription
    let subscription = await registration.pushManager.getSubscription();
    if (subscription) return subscription;

    // Subscribe
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer,
    });

    // Send subscription to server
    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(subscription.toJSON()),
    }).catch(() => {});

    return subscription;
  } catch (err) {
    console.warn("[Push] Subscription failed:", err);
    return null;
  }
}
