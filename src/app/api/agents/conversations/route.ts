/* ════════════════════════════════════════════════════════
   API Route: /api/agents/conversations
   GET: List conversations filtered by agentId, or get messages
   POST: Create a new conversation session for an agent
   ════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import {
  getConversationsByAgent,
  getConversationMessages,
  getOrCreateConversation,
} from "@/modules/agents/orchestrator";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get("agentId") || "all";
    const conversationId = searchParams.get("conversationId");
    const limit = parseInt(searchParams.get("limit") || "25", 10);

    if (conversationId) {
      const messages = await getConversationMessages(conversationId, limit);
      return NextResponse.json({
        conversationId,
        messages,
        count: messages.length,
      });
    }

    const conversations = await getConversationsByAgent(agentId, limit);
    return NextResponse.json({
      agentId,
      conversations,
      count: conversations.length,
    });
  } catch (err: any) {
    console.error("[API Conversations] Error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const agentId = body.agentId || "orchestrator";
    const title = body.title || `New ${agentId.toUpperCase()} Session`;

    const conv = await getOrCreateConversation(
      undefined,
      body.userRole || "ADMIN",
      title,
      agentId
    );

    return NextResponse.json({
      success: true,
      conversation: conv,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to create conversation" },
      { status: 500 }
    );
  }
}
