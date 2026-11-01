/* ════════════════════════════════════════════════════════
   API Route: /api/agents/approvals
   GET: List approval queue items
   PATCH: Approve or reject an item
   ════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { getApprovalItems, resolveApproval } from "@/modules/agents/task-manager";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "ALL";

    const items = await getApprovalItems(status);

    return NextResponse.json({
      items,
      count: items.length,
      statusFilter: status,
    });
  } catch (err: any) {
    console.error("[API Approvals] GET Failed:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to fetch approvals" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { approvalId, decision, reviewedBy, notes } = body;

    if (!approvalId || !decision) {
      return NextResponse.json(
        { error: "Missing 'approvalId' or 'decision' field" },
        { status: 400 }
      );
    }

    if (!["APPROVED", "REJECTED"].includes(decision)) {
      return NextResponse.json(
        { error: "Decision must be either 'APPROVED' or 'REJECTED'" },
        { status: 400 }
      );
    }

    const updated = await resolveApproval(
      approvalId,
      decision,
      reviewedBy || "admin",
      notes
    );

    if (!updated) {
      return NextResponse.json(
        { error: "Approval item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      approval: updated,
      message: `Proposal ${decision === "APPROVED" ? "approved and authorized for dispatch" : "rejected"}`,
    });
  } catch (err: any) {
    console.error("[API Approvals] PATCH Failed:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to resolve approval" },
      { status: 500 }
    );
  }
}
