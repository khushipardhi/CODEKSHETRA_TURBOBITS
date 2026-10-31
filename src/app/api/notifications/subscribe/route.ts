import { NextRequest, NextResponse } from "next/server";
import { execute } from "@/lib/db";
import { getCitizenIdentity } from "@/lib/citizen-identity";
import { generateULID } from "@/lib/ids";

export async function POST(request: NextRequest) {
  try {
    const identity = await getCitizenIdentity(request);
    if (!identity) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }

    const body = await request.json();
    const { endpoint, keys } = body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json({ error: { code: "BAD_REQUEST", message: "Invalid subscription data" } }, { status: 400 });
    }

    await execute(
      `INSERT INTO push_subscriptions (id, citizen_id, endpoint, p256dh, auth_key)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE citizen_id = VALUEQ(citizen_id), p256dh = VALUES(p256dh), auth_key = VALUES(auth_key)`,
      [generateULID(), identity.citizenId, endpoint, keys.p256dh, keys.auth]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[API] /notifications/subscribe error:", err);
    return NextResponse.json({ error: { code: "SUBSCRIBE_FAILED", message: "Failed to subscribe" } }, { status: 500 });
  }
}

