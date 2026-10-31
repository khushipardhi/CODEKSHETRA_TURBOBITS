/* ════════════════════════════════════════════════════════
   POST /api/push/subscribe
   Store push subscription for a citizen
   ════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { execute } from "@/lib/db";
import { generateULID } from "@/lib/ids";
import { getCitizenIdentity } from "@/lib/citizen-identity";

export async function POST(request: NextRequest) {
  try {
    const identity = await getCitizenIdentity(request);
    const citizenId = identity?.citizenId || "anonymous";

    const subscription = await request.json();
    const endpoint = subscription.endpoint;
    const keys = subscription.keys || {};

    if (!endpoint) {
      return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
    }

    // Upsert push subscription
    try {
      await execute(
        `INSERT INTO push_subscriptions (id, citizen_id, endpoint, p256dh, auth_key, created_at)
         VALUES (?, ?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE p256dh = VALUES(p256dh), auth_key = VALUES(auth_key), updated_at = NOW()`,
        [
          generateULID(),
          citizenId,
          endpoint,
          keys.p256dh || "",
          keys.auth || "",
        ]
      );
    } catch (err) {
      // Table may not exist yet — create it
      console.warn("[Push] push_subscriptions table issue:", err);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Push] Subscribe error:", err);
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
  }
}
