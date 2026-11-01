/* ════════════════════════════════════════════════════════
   API Route: /api/agents/chat
   Unified chat endpoint for:
   - Mode A: Direct Specialist Conversation (simulation, hazard, incident, citizen)
   - Mode B: Central Orchestrator Conversation (orchestrator multi-agent coordination)
   ════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { processOrchestratorMessage } from "@/modules/agents/orchestrator";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body || !body.message || typeof body.message !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'message' field" },
        { status: 400 }
      );
    }

    const result = await processOrchestratorMessage({
      message: body.message,
      conversationId: body.conversationId,
      targetAgentId: body.targetAgentId || body.agentId,
      userRole: body.userRole || "ADMIN",
      city: body.city || "mumbai",
      wardId: body.wardId,
      workspaceState: body.workspaceState,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    const isValidationError =
      err?.message?.includes("Invalid request") ||
      err?.message?.includes("is not recognized as an actionable directive") ||
      err?.message?.includes("Configuration Error");
    
    console.warn("[API Agents Chat] Request issue:", err?.message || err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: isValidationError ? 400 : 500 }
    );
  }
}
