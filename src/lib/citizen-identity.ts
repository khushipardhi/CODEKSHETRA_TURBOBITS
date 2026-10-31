/* ════════════════════════════════════════════════════════
   Citizen Identity — Server-side utility
   Extracts citizen identity from incoming requests.
   Supports: guest ID (cookie/header), authenticated user (future)
   ════════════════════════════════════════════════════════ */

import { NextRequest } from "next/server";
import { cookies } from "next/headers";

export interface CitizenIdentity {
  citizenId: string;
  isGuest: boolean;
  isAuthenticated: boolean;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Extract citizen identity from a Next.js API request.
 * Priority:
 * 1. Authenticated session (Google OAuth via NextAuth)
 * 2. Guest ID from httpOnly cookie (guest_token)
 * 3. Guest ID from x-guest-id header (fallback)
 * 4. null if no identity found
 */
export async function getCitizenIdentity(request: NextRequest): Promise<CitizenIdentity | null> {
  // 1. Check authenticated session (Google OAuth)
  try {
    const { auth } = await import("@/auth");
    const session = await auth();
    if (session?.user) {
      const googleId = (session.user as Record<string, unknown>).googleId as string | undefined;
      if (googleId) {
        // Try to link guest reports on first authenticated request
        const headerGuestId = request.headers.get("x-guest-id");
        const cookieGuestId = (await cookies()).get("guest_token")?.value;
        const guestId = headerGuestId || cookieGuestId;
        if (guestId) {
          linkGuestToGoogle(`guest_${guestId}`, googleId).catch(() => {});
        }

        return {
          citizenId: `google_${googleId}`,
          isGuest: false,
          isAuthenticated: true,
        };
      }
    }
  } catch {
    // Auth module not configured or session check failed — fall through
  }

  // 2. Check httpOnly cookie
  const cookieStore = await cookies();
  const cookieGuestId = cookieStore.get("guest_token")?.value;
  if (cookieGuestId && UUID_REGEX.test(cookieGuestId)) {
    return { citizenId: `guest_${cookieGuestId}`, isGuest: true, isAuthenticated: false };
  }

  // 3. Check x-guest-id header (for cases where cookie isn't set yet)
  const headerGuestId = request.headers.get("x-guest-id");
  if (headerGuestId && UUID_REGEX.test(headerGuestId)) {
    return { citizenId: `guest_${headerGuestId}`, isGuest: true, isAuthenticated: false };
  }

  // 4. No identity found
  return null;
}

/**
 * Link guest reports to a Google account.
 * Updates incident citizen_id from guest_xxx to google_xxx.
 * Called once on first authenticated request where a guest cookie exists.
 */
async function linkGuestToGoogle(guestCitizenId: string, googleId: string): Promise<void> {
  try {
    const { execute } = await import("@/lib/db");
    const googleCitizenId = `google_${googleId}`;

    // Update incidents owned by the guest
    await execute(
      `UPDATE incidents SET citizen_id = ? WHERE citizen_id = ?`,
      [googleCitizenId, guestCitizenId]
    );

    // Update notifications
    await execute(
      `UPDATE notifications SET recipient_id = ? WHERE recipient_type = 'citizen' AND recipient_id = ?`,
      [googleCitizenId, guestCitizenId]
    );

    // Update push subscriptions
    await execute(
      `UPDATE push_subscriptions SET citizen_id = ? WHERE citizen_id = ?`,
      [googleCitizenId, guestCitizenId]
    );

    console.log(`[Auth] Linked guest ${guestCitizenId} → ${googleCitizenId}`);
  } catch (err) {
    console.warn("[Auth] Failed to link guest to Google:", err);
  }
}

/**
 * Require citizen identity — returns identity or throws.
 * Use in API routes where identity is mandatory.
 */
export async function requireCitizenIdentity(request: NextRequest): Promise<CitizenIdentity> {
  const identity = await getCitizenIdentity(request);
  if (!identity) {
    throw new Error("CITIZEN_IDENTITY_REQUIRED");
  }
  return identity;
}

/**
 * Check if a request is from an admin.
 * Phase 5+ will implement proper admin auth.
 * For now, check for admin header/cookie.
 */
export function isAdminRequest(request: NextRequest): boolean {
  // TODO: Implement proper admin authentication in Phase 5
  const adminHeader = request.headers.get("x-admin-token");
  return adminHeader === "admin"; // Placeholder — will be replaced with real auth
}
