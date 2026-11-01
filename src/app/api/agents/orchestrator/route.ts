/* ════════════════════════════════════════════════════════
   API Route: /api/agents/orchestrator
   POST: Central Orchestrator message dispatcher
   GET: Conversation messages retrieval
   ════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import {
  processOrchestratorMessage,
  getConversationMessages,
} from "@/modules/agents/orchestrator";

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
      targetAgentId: body.targetAgentId,
      userRole: body.userRole || "ADMIN",
      city: body.city || "mumbai",
      wardId: body.wardId,
      workspaceState: body.workspaceState,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[API Orchestrator] Execution failed:", err);
    return NextResponse.json(
      {
        error: err?.message || "Internal server error during orchestration",
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversationId");

    if (!conversationId) {
      return NextResponse.json(
        { error: "Missing conversationId parameter" },
        { status: 400 }
      );
    }

    const limit = parseInt(searchParams.get("limit") || "30", 10);
    const messages = await getConversationMessages(conversationId, limit);

    return NextResponse.json({
      conversationId,
      messages,
      count: messages.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to fetch messages" },
      { status: 500 }
    );
  }
}
