/* ════════════════════════════════════════════════════════
   API Route: /api/agents/autonomous-monitor
   GET: Retrieve current operational status, agent states & live events
   POST: Trigger on-demand autonomous monitoring cycle
   ════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { runAutonomousOperationsCycle } from "@/modules/agents/autonomous-monitor";
import { env } from "@/lib/env";

/**
 * Validates request authorization if CRON_SECRET is configured.
 * - Allows dashboard UI calls (no Vercel Cron headers, browser origin / internal)
 * - If invoked by Vercel Cron or external schedulers, verifies Authorization: Bearer <CRON_SECRET> or ?key=<CRON_SECRET>
 */
function isAuthorized(req: NextRequest): boolean {
  const cronSecret = env.cronSecret;
  if (!cronSecret) return true; // If not configured in environment, allow transparent operation

  const authHeader = req.headers.get("authorization");
  const isVercelCron = req.headers.get("x-vercel-cron") === "1" || req.headers.get("user-agent")?.includes("vercel-cron");
  const { searchParams } = new URL(req.url);
  const queryKey = searchParams.get("key");

  // If request contains Bearer token or key parameter, validate strictly
  if (authHeader) {
    return authHeader === `Bearer ${cronSecret}`;
  }
  if (queryKey) {
    return queryKey === cronSecret;
  }

  // If request is flagged as Vercel Cron, it must provide matching secret
  if (isVercelCron) {
    return false;
  }

  // Standard internal dashboard browser requests (GET/POST) are permitted
  return true;
}

export async function GET(req: NextRequest) {
  try {
    if (!isAuthorized(req)) {
      return NextResponse.json({ error: "Unauthorized: Invalid CRON_SECRET" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const city = (searchParams.get("city") || "mumbai") as "mumbai" | "pune" | "nagpur";

    const state = await runAutonomousOperationsCycle(city);

    return NextResponse.json({
      success: true,
      ...state,
    });
  } catch (err: any) {
    console.error("[API Autonomous Monitor] Error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to retrieve autonomous monitor state" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!isAuthorized(req)) {
      return NextResponse.json({ error: "Unauthorized: Invalid CRON_SECRET" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const city = (body.city || "mumbai") as "mumbai" | "pune" | "nagpur";

    const result = await runAutonomousOperationsCycle(city);

    return NextResponse.json({
      success: true,
      message: "Autonomous operations cycle completed successfully.",
      ...result,
    });
  } catch (err: any) {
    console.error("[API Autonomous Monitor POST] Error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to execute autonomous operations cycle" },
      { status: 500 }
    );
  }
}
