/* ════════════════════════════════════════════════════════
   API Route: /api/agents/tasks
   GET: Query agent tasks with filtering
   ════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { getRecentTasks, getTaskById, getChildTasks } from "@/modules/agents/task-manager";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get("taskId");
    const parentId = searchParams.get("parentId");
    const agentId = searchParams.get("agentId") || undefined;
    const status = searchParams.get("status") || undefined;
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    if (taskId) {
      const task = await getTaskById(taskId);
      if (!task) {
        return NextResponse.json({ error: "Task not found" }, { status: 404 });
      }
      const children = await getChildTasks(taskId);
      return NextResponse.json({ task, children });
    }

    if (parentId) {
      const children = await getChildTasks(parentId);
      return NextResponse.json({ parentId, children, count: children.length });
    }

    const tasks = await getRecentTasks({ agentId, status, limit });

    return NextResponse.json({
      tasks,
      count: tasks.length,
      filters: { agentId, status, limit },
    });
  } catch (err: any) {
    console.error("[API Tasks] Failed:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to query tasks" },
      { status: 500 }
    );
  }
}
