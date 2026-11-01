/* ════════════════════════════════════════════════════════
   API Route: /api/agents/registry
   GET: List all registered agents and available tools
   ════════════════════════════════════════════════════════ */

import { NextResponse } from "next/server";
import { getAllAgents, getAllTools } from "@/modules/agents/registry";

export async function GET() {
  try {
    const [agents, tools] = await Promise.all([
      getAllAgents(),
      Promise.resolve(getAllTools()),
    ]);

    return NextResponse.json({
      agents,
      tools,
      count: agents.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("[API Registry] Failed:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to load agent registry" },
      { status: 500 }
    );
  }
}
