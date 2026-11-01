/* ════════════════════════════════════════════════════════
   API Route: /api/agents/metrics
   GET: Aggregated control room metrics and task throughput
   ════════════════════════════════════════════════════════ */

import { NextResponse } from "next/server";
import { getControlRoomMetrics } from "@/modules/agents/health-monitor";

export async function GET() {
  try {
    const metrics = await getControlRoomMetrics();
    return NextResponse.json({
      metrics,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("[API Metrics] Failed:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to aggregate metrics" },
      { status: 500 }
    );
  }
}
