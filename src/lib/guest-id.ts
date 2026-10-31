/* ════════════════════════════════════════════════════════
   Guest ID — Client-side utility
   Generates and persists a stable anonymous citizen ID
   Stored in localStorage + registered via server cookie
   ════════════════════════════════════════════════════════ */

"use client";

const STORAGE_KEY = "nagpur_guest_id";

let cachedGuestId: string | null = null;

/**
 * Get or create a persistent guest ID for this browser.
 * The ID is stored in localStorage and also registered as a
 * server-side httpOnly cookie via /api/citizen/register-guest.
 */
export async function getOrCreateGuestId(): Promise<string> {
  // Return cached value if available
  if (cachedGuestId) return cachedGuestId;

  // Check localStorage first
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && isValidUUID(stored)) {
      cachedGuestId = stored;
      // Ensure server cookie is set (non-blocking)
      registerGuestCookie(stored).catch(() => {});
      return stored;
    }
  }

  // Generate new guest ID and register with server
  try {
    const res = await fetch("/api/citizen/register-guest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (res.ok) {
      const data = await res.json();
      if (data.guestId && isValidUUID(data.guestId)) {
        cachedGuestId = data.guestId;
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEY, data.guestId);
        }
        return data.guestId;
      }
    }
  } catch {
    // Server unavailable — generate client-side
  }

  // Fallback: generate locally (cookie won't be set until next register call)
  const localId = crypto.randomUUID();
  cachedGuestId = localId;
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, localId);
  }
  // Try to register in background
  registerGuestCookie(localId).catch(() => {});
  return localId;
}

/**
 * Get the current guest ID synchronously (may return null if not yet initialized).
 * Use getOrCreateGuestId() for guaranteed value.
 */
export function getGuestIdSync(): string | null {
  if (cachedGuestId) return cachedGuestId;
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && isValidUUID(stored)) {
      cachedGuestId = stored;
      return stored;
    }
  }
  return null;
}

/**
 * Create fetch headers that include the guest ID for API calls.
 * Always use this for citizen API requests.
 */
export function citizenHeaders(extra?: Record<string, string>): Record<string, string> {
  const guestId = getGuestIdSync();
  return {
    "Content-Type": "application/json",
    ...(guestId ? { "x-guest-id": guestId } : {}),
    ...extra,
  };
}

/** Register the guest ID as an httpOnly cookie on the server */
async function registerGuestCookie(guestId: string): Promise<void> {
  await fetch("/api/citizen/register-guest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ guestId }),
  });
}

function isValidUUID(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}
