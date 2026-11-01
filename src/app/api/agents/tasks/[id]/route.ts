/* ════════════════════════════════════════════════════════
   API Route: /api/agents/tasks/[id]
   GET: Get single task detail with execution trace
   ════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { getTaskById } from "@/modules/agents/task-manager";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const task = await getTaskById(id);

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ task });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to fetch task" },
      { status: 500 }
    );
  }
}
