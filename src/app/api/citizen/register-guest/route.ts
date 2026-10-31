/* ════════════════════════════════════════════════════════
   POST /api/citizen/register-guest
   Registers a guest citizen identity.
   Sets httpOnly cookie for server-side identification.
   Idempotent: if guest ID provided, validates and sets cookie.
   ════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  try {
    let guestId: string;

    // Check if the client already has a guest ID
    const body = await request.json().catch(() => ({}));
    if (body.guestId && typeof body.guestId === "string" && UUID_REGEX.test(body.guestId)) {
      guestId = body.guestId;
    } else {
      // Check if there's already a cookie
      const existingCookie = request.cookies.get("guest_token")?.value;
      if (existingCookie && UUID_REGEX.test(existingCookie)) {
        guestId = existingCookie;
      } else {
        // Generate new guest ID
        guestId = crypto.randomUUID();
      }
    }

    // Set httpOnly cookie (secure in production)
    const isProduction = process.env.NODE_ENV === "production";
    const response = NextResponse.json({
      success: true,
      guestId,
    });

    response.cookies.set("guest_token", guestId, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      // 1 year expiry — guest identity should be long-lived
      maxAge: 365 * 24 * 60 * 60,
    });

    return response;
  } catch (err) {
    console.error("[API] /citizen/register-guest error:", err);
    return NextResponse.json(
      { error: { code: "REGISTRATION_FAILED", message: "Failed to register guest" } },
      { status: 500 }
    );
  }
}
