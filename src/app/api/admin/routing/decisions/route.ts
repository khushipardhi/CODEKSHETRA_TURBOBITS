/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Admin Operational Routing Decision Center
   GET /api/admin/routing/decisions
   Surfaces untriaged reports, pending routing reviews, overdue SLA tasks,
   blocked dependencies, and municipal configuration gaps.
   ════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { listPendingRoutingReviews } from "@/modules/routing/decision-record";
import { computeSlaStatus, OperationalPriority } from "@/modules/routing/sla";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city") || request.headers.get("x-city") || "all";
    const isAll = city === "all";

    // 1. Pending Reviews (Confidence REQUIRES_REVIEW or AWAITING_APPROVAL)
    const pendingReviews = await listPendingRoutingReviews(city);

    // 2. Active Tasks with SLA & Blocked status
    const taskRows = await query<any>(
      `SELECT
        id.id AS dept_task_id,
        id.incident_id,
        id.department_code,
        id.department_name,
        id.role,
        id.status AS dept_status,
        id.depends_on_department,
        id.is_blocked,
        id.blocked_reason,
        id.action_notes,
        id.acknowledged_at,
        id.resolved_at,
        id.created_at,
        i.public_reference,
        i.city,
        i.title,
        i.category_slug,
        i.subcategory_slug,
        i.severity,
        COALESCE(i.operational_priority, 'MEDIUM') AS operational_priority,
        i.location_text,
        i.sla_due_at,
        r.matched_rule_id,
        r.decision_explanation,
        r.confidence_status,
        r.assignment_mode,
        r.is_overridden,
        r.final_department
       FROM incident_departments id
       JOIN incidents i ON i.id = id.incident_id
       LEFT JOIN routing_decision_records r ON r.incident_id = i.id
       WHERE id.status NOT IN ('RESOLVED', 'CLOSED', 'REJECTED')
         ${isAll ? "" : "AND i.city = ?"}
       ORDER BY (id.is_blocked = 1) DESC, (id.acknowledged_at IS NULL) DESC, id.created_at ASC
       LIMIT 300`,
      isAll ? [] : [city.toLowerCase()]
    );

    const activeTasksWithSla = await Promise.all(
      (taskRows || []).map(async (row) => {
        const sla = await computeSlaStatus({
          city: row.city,
          departmentCode: row.department_code,
          priority: row.operational_priority as OperationalPriority,
          createdAt: row.created_at,
          acknowledgedAt: row.acknowledged_at,
          resolvedAt: row.resolved_at,
        });

        return {
          id: row.dept_task_id,
          incidentId: row.incident_id,
          publicReference: row.public_reference,
          city: row.city,
          title: row.title || "Civic Task",
          category: row.category_slug,
          subcategory: row.subcategory_slug,
          severity: row.severity,
          operationalPriority: row.operational_priority,
          departmentCode: row.department_code,
          departmentName: row.department_name,
          role: row.role || "PRIMARY",
          status: row.dept_status,
          dependsOnDepartment: row.depends_on_department,
          isBlocked: !!row.is_blocked,
          blockedReason: row.blocked_reason,
          actionNotes: row.action_notes,
          matchedRuleId: row.matched_rule_id,
          decisionExplanation: row.decision_explanation,
          confidenceStatus: row.confidence_status || "HIGH",
          isOverridden: !!row.is_overridden,
          createdAt: row.created_at,
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

    // Filter sub-lists
    const overdueTasks = activeTasksWithSla.filter(
      (t) => t.sla.isAckOverdue || t.sla.isResolutionOverdue
    );
    const blockedTasks = activeTasksWithSla.filter((t) => t.isBlocked);

    // 3. Configuration Gaps: Decisions where confidence was FALLBACK or missing department
    const gapRows = await query<any>(
      `SELECT * FROM routing_decision_records
       WHERE confidence_status = 'FALLBACK' OR missing_facts LIKE '%Configuration Gap%'
       ${isAll ? "" : "AND city = ?"}
       ORDER BY created_at DESC LIMIT 20`,
      isAll ? [] : [city.toLowerCase()]
    );

    const configurationGaps = (gapRows || []).map((r) => ({
      id: r.id,
      incidentId: r.incident_id,
      city: r.city,
      category: r.category,
      subcategory: r.subcategory,
      primaryDepartment: r.primary_department,
      explanation: r.decision_explanation,
      missingFacts: typeof r.missing_facts === "string" ? JSON.parse(r.missing_facts) : (r.missing_facts || []),
      createdAt: r.created_at,
    }));

    // 4. Operational Summary KPI Stats
    const totalDecisionsCount = await query<{ cnt: number }>(
      `SELECT COUNT(*) as cnt FROM routing_decision_records ${isAll ? "" : "WHERE city = ?"}`,
      isAll ? [] : [city.toLowerCase()]
    );
    const overridesCount = await query<{ cnt: number }>(
      `SELECT COUNT(*) as cnt FROM routing_decision_records WHERE is_overridden = 1 ${isAll ? "" : "AND city = ?"}`,
      isAll ? [] : [city.toLowerCase()]
    );

    return NextResponse.json({
      success: true,
      city,
      kpis: {
        totalRoutingDecisions: Number(totalDecisionsCount[0]?.cnt || 0),
        pendingReviewsCount: pendingReviews.length,
        activeTasksCount: activeTasksWithSla.length,
        overdueTasksCount: overdueTasks.length,
        blockedTasksCount: blockedTasks.length,
        configurationGapsCount: configurationGaps.length,
        overridesCount: Number(overridesCount[0]?.cnt || 0),
      },
      pendingReviews,
      overdueTasks,
      blockedTasks,
      configurationGaps,
      activeTasks: activeTasksWithSla,
    });
  } catch (err) {
    console.error("[API] /admin/routing/decisions error:", err);
    return NextResponse.json(
      { error: { code: "QUERY_FAILED", message: "Failed to retrieve routing operational decisions" } },
      { status: 500 }
    );
  }
}
