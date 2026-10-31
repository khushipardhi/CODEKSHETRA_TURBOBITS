/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Department Tasks & Action Dispatch API
   GET  /api/department/[code]/tasks — Enriched with SLA, roles, dependencies, blocked states
   PATCH /api/department/[code]/tasks — Action transitions: ACKNOWLEDGE, ACCEPT, ASSIGN, BLOCK, UNBLOCK, RESOLVE, REJECT
   ════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { computeSlaStatus, OperationalPriority } from "@/modules/routing/sla";
import { updateDepartmentAction } from "@/modules/routing/coordination";

interface TaskRow {
  incident_id: string;
  public_reference: string;
  category_slug: string | null;
  subcategory_slug: string | null;
  title: string | null;
  citizen_summary: string | null;
  dept_status: string;
  role: string | null;
  depends_on_department: string | null;
  is_blocked: number | boolean | null;
  blocked_reason: string | null;
  routing_reason: string | null;
  assigned_worker_id: string | null;
  assigned_worker_name: string | null;
  action_notes: string | null;
  acknowledged_at: string | null;
  resolved_at: string | null;
  resolution_evidence_url: string | null;
  priority_score: number | null;
  severity: string | null;
  operational_priority: string | null;
  location_text: string | null;
  created_at: string;
  city: string;
  decision_explanation: string | null;
  matched_rule_id: string | null;
}

function deriveTitle(r: TaskRow): string {
  if (r.title && r.title.trim() && !r.title.toLowerCase().includes("untitled")) {
    return r.title.trim();
  }
  if (r.citizen_summary && r.citizen_summary.trim()) {
    const s = r.citizen_summary.trim();
    return s.length > 70 ? s.slice(0, 67) + "..." : s;
  }
  if (r.subcategory_slug) {
    return r.subcategory_slug
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  }
  return "Civic Task";
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    if (!code) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Department code is required" } },
        { status: 400 }
      );
    }

    const city = _request.nextUrl.searchParams.get("city") || _request.headers.get("x-city");
    const isAll = !city || city === "all";
    const queryParams = isAll ? [code] : [code, city.toLowerCase()];

    const rows = await query<TaskRow>(
      `SELECT
        id.incident_id,
        i.public_reference,
        i.category_slug,
        i.subcategory_slug,
        i.title,
        i.citizen_summary,
        i.city,
        id.status AS dept_status,
        COALESCE(id.role, 'PRIMARY') AS role,
        id.depends_on_department,
        id.is_blocked,
        id.blocked_reason,
        id.routing_reason,
        id.assigned_worker_id,
        id.assigned_worker_name,
        id.action_notes,
        id.acknowledged_at,
        id.resolved_at,
        id.resolution_evidence_url,
        COALESCE(i.priority_score, 0) AS priority_score,
        i.severity,
        COALESCE(i.operational_priority, 'MEDIUM') AS operational_priority,
        i.location_text,
        i.created_at,
        r.decision_explanation,
        r.matched_rule_id
      FROM incident_departments id
      JOIN incidents i ON i.id = id.incident_id
      LEFT JOIN routing_decision_records r ON r.incident_id = i.id
      WHERE id.department_code = ? ${isAll ? "" : "AND i.city = ?"}
      ORDER BY i.created_at DESC
      LIMIT 100`,
      queryParams
    );

    const tasks = await Promise.all(
      (rows || []).map(async (r) => {
        const sla = await computeSlaStatus({
          city: r.city || "nagpur",
          departmentCode: code,
          priority: (r.operational_priority as OperationalPriority) || "MEDIUM",
          createdAt: r.created_at,
          acknowledgedAt: r.acknowledged_at,
          resolvedAt: r.resolved_at,
        });

        return {
          id: r.incident_id,
          trackingId: r.public_reference,
          city: r.city,
          title: deriveTitle(r),
          status: r.dept_status,
          role: r.role || "PRIMARY",
          dependsOnDepartment: r.depends_on_department,
          isBlocked: !!r.is_blocked,
          blockedReason: r.blocked_reason,
          routingReason: r.routing_reason,
          decisionExplanation: r.decision_explanation,
          matchedRuleId: r.matched_rule_id,
          assignedWorkerId: r.assigned_worker_id,
          assignedWorkerName: r.assigned_worker_name,
          actionNotes: r.action_notes,
          priority: Number(r.priority_score),
          severity: r.severity || "UNKNOWN",
          operationalPriority: r.operational_priority || "MEDIUM",
          location: r.location_text || "",
          createdAt: r.created_at,
          acknowledgedAt: r.acknowledged_at,
          resolvedAt: r.resolved_at,
          resolutionEvidenceUrl: r.resolution_evidence_url,
          sla: {
            ackTargetMinutes: sla.ackTargetMinutes,
            resolutionTargetHours: sla.resolutionTargetHours,
            ackDueAt: sla.ackDueAt,
            resolutionDueAt: sla.resolutionDueAt,
            isAckOverdue: sla.isAckOverdue,
            isResolutionOverdue: sla.isResolutionOverdue,
            ackTimeRemainingMinutes: sla.ackTimeRemainingMinutes,
            resolutionTimeRemainingMinutes: sla.resolutionTimeRemainingMinutes,
            warningIndicator: sla.warningIndicator,
            escalationRequired: sla.escalationRequired,
            escalationRecipient: sla.escalationRecipient,
          },
        };
      })
    );

    // Compute status breakdown counts
    const statusCounts: Record<string, number> = {};
    for (const task of tasks) {
      statusCounts[task.status] = (statusCounts[task.status] || 0) + 1;
    }

    return NextResponse.json({
      success: true,
      departmentCode: code,
      tasks,
      statusCounts,
      totalTasks: tasks.length,
    });
  } catch (err) {
    console.error("[API] /department/[code]/tasks GET error:", err);
    return NextResponse.json(
      { error: { code: "FETCH_FAILED", message: "Failed to fetch department tasks." } },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body = await request.json();

    const {
      incidentId,
      action,
      notes,
      blockedReason,
      dependsOnDept,
      resolutionEvidenceUrl,
      workerId,
      workerName,
    } = body as {
      incidentId: string;
      action: "ACKNOWLEDGE" | "ACCEPT" | "ASSIGN" | "BLOCK" | "UNBLOCK" | "RESOLVE" | "REJECT";
      notes?: string;
      blockedReason?: string;
      dependsOnDept?: string;
      resolutionEvidenceUrl?: string;
      workerId?: string;
      workerName?: string;
    };

    if (!incidentId || !action) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "incidentId and action are required." } },
        { status: 400 }
      );
    }

    const result = await updateDepartmentAction({
      incidentId,
      departmentCode: code,
      action,
      notes,
      blockedReason,
      dependsOnDept,
      resolutionEvidenceUrl,
      workerId,
      workerName,
    });

    return NextResponse.json({
      success: true,
      incidentId,
      departmentCode: code,
      action,
      fromStatus: result.fromStatus,
      toStatus: result.toStatus,
      isAllResolved: result.isAllResolved,
      unblockedDepartments: result.unblockedDepartments,
      message: `Action ${action} executed successfully.`,
    });
  } catch (err: any) {
    console.error("[API] /department/[code]/tasks PATCH error:", err);
    return NextResponse.json(
      { error: { code: "ACTION_FAILED", message: err.message || "Failed to update department task." } },
      { status: 500 }
    );
  }
}
