/* ════════════════════════════════════════════════════════
   API Route: /api/agents/health
   GET: Ping all tools, APIs, and keys and return live health status
   ════════════════════════════════════════════════════════ */

import { NextResponse } from "next/server";
import { checkToolHealth } from "@/modules/agents/health-monitor";

export async function GET() {
  try {
    const health = await checkToolHealth();
    const healthyCount = health.filter((h) => h.status === "HEALTHY").length;

    return NextResponse.json({
      tools: health,
      summary: {
        total: health.length,
        healthy: healthyCount,
        degraded: health.filter((h) => h.status === "DEGRADED").length,
        unreachable: health.filter((h) => h.status === "UNREACHABLE").length,
        overallStatus: healthyCount === health.length ? "OPTIMAL" : healthyCount > 5 ? "DEGRADED" : "CRITICAL",
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("[API Health] Failed:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to check tool health" },
      { status: 500 }
    );
  }
}
