/* ════════════════════════════════════════════════════════
   API Route: /api/agents/autonomous-monitor
   GET: Retrieve current operational status, agent states & live events
   POST: Trigger on-demand autonomous monitoring cycle
   ════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { runAutonomousOperationsCycle, getOperationalEvents } from "@/modules/agents/autonomous-monitor";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const city = (searchParams.get("city") || "mumbai") as "mumbai" | "pune" | "nagpur";
    const forceSync = searchParams.get("sync") === "true";

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
