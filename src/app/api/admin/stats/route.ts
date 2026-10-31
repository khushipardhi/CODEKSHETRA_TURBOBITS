/* ════════════════════════════════════════════════════════
   GET /api/admin/stats
   KPI aggregation from real TiDB data
   Returns: total, critical_active, in_progress,
            resolved_this_week, department workload
   ════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

interface KPIRow {
  total: number;
  critical_active: number;
  in_progress: number;
  resolved_this_week: number;
  today_count: number;
}

interface DeptWorkloadRow {
  department_code: string;
  department_name: string;
  active: number;
  pending: number;
  resolved: number;
}

export async function GET(request: NextRequest) {
  try {
    const city = request.nextUrl.searchParams.get("city") || request.headers.get("x-city");
    const isAll = !city || city === "all";

    // KPI aggregation — single query with status & severity breakdowns
    const kpiRows = await query<any>(
      `SELECT
        COUNT(*) AS total,
        COALESCE(SUM(CASE WHEN severity = 'CRITICAL' AND status NOT IN ('RESOLVED','CLOSED') THEN 1 ELSE 0 END), 0) AS critical_active,
        COALESCE(SUM(CASE WHEN status IN ('IN_PROGRESS','ASSIGNED') THEN 1 ELSE 0 END), 0) AS in_progress,
        COALESCE(SUM(CASE WHEN status = 'RESOLVED' AND resolved_at > DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END), 0) AS resolved_this_week,
        COALESCE(SUM(CASE WHEN created_at > DATE_SUB(NOW(), INTERVAL 1 DAY) THEN 1 ELSE 0 END), 0) AS today_count,
        COALESCE(SUM(CASE WHEN status IN ('DRAFT','CONFIRMED') THEN 1 ELSE 0 END), 0) AS awaiting_review_count,
        COALESCE(SUM(CASE WHEN status = 'ROUTED' THEN 1 ELSE 0 END), 0) AS routed_count,
        COALESCE(SUM(CASE WHEN status = 'RESOLVED' THEN 1 ELSE 0 END), 0) AS resolved_count,
        COALESCE(SUM(CASE WHEN status = 'CLOSED' THEN 1 ELSE 0 END), 0) AS closed_count,
        COALESCE(SUM(CASE WHEN severity = 'CRITICAL' THEN 1 ELSE 0 END), 0) AS sev_critical,
        COALESCE(SUM(CASE WHEN severity = 'HIGH' THEN 1 ELSE 0 END), 0) AS sev_high,
        COALESCE(SUM(CASE WHEN severity = 'MEDIUM' THEN 1 ELSE 0 END), 0) AS sev_medium,
        COALESCE(SUM(CASE WHEN severity = 'LOW' THEN 1 ELSE 0 END), 0) AS sev_low
      FROM incidents
      ${isAll ? "" : "WHERE city = ?"}`,
      isAll ? [] : [city]
    ).catch(() => [{
      total: 0,
      critical_active: 0,
      in_progress: 0,
      resolved_this_week: 0,
      today_count: 0,
      awaiting_review_count: 0,
      routed_count: 0,
      resolved_count: 0,
      closed_count: 0,
      sev_critical: 0,
      sev_high: 0,
      sev_medium: 0,
      sev_low: 0,
    }]);

    const kpi = kpiRows[0] || {
      total: 0,
      critical_active: 0,
      in_progress: 0,
      resolved_this_week: 0,
      today_count: 0,
      awaiting_review_count: 0,
      routed_count: 0,
      resolved_count: 0,
      closed_count: 0,
      sev_critical: 0,
      sev_high: 0,
      sev_medium: 0,
      sev_low: 0,
    };

    // Department workload — aggregated from incident_departments
    const deptRows = await query<DeptWorkloadRow>(
      isAll
        ? `SELECT
            department_code,
            MAX(department_name) AS department_name,
            COALESCE(SUM(CASE WHEN status IN ('IN_PROGRESS','ASSIGNED') THEN 1 ELSE 0 END), 0) AS active,
            COALESCE(SUM(CASE WHEN status = 'ROUTED' THEN 1 ELSE 0 END), 0) AS pending,
            COALESCE(SUM(CASE WHEN status = 'RESOLVED' THEN 1 ELSE 0 END), 0) AS resolved
          FROM incident_departments
          GROUP BY department_code
          ORDER BY active DESC, pending DESC
          LIMIT 10`
        : `SELECT
            id.department_code,
            MAX(id.department_name) AS department_name,
            COALESCE(SUM(CASE WHEN id.status IN ('IN_PROGRESS','ASSIGNED') THEN 1 ELSE 0 END), 0) AS active,
            COALESCE(SUM(CASE WHEN id.status = 'ROUTED' THEN 1 ELSE 0 END), 0) AS pending,
            COALESCE(SUM(CASE WHEN id.status = 'RESOLVED' THEN 1 ELSE 0 END), 0) AS resolved
          FROM incident_departments id
          JOIN incidents i ON i.id = id.incident_id
          WHERE i.city = ?
          GROUP BY id.department_code
          ORDER BY active DESC, pending DESC
          LIMIT 10`,
      isAll ? [] : [city]
    ).catch(() => []);

    // Department work awaiting action across the city
    const pendingDeptTasks = deptRows.reduce((acc, d) => acc + Number(d.pending), 0);

    return NextResponse.json({
      success: true,
      city: city || "all",
      timeWindow: "Operational Real-Time Rolling 7-Day Window",
      provenanceSource: "TiDB Serverless: incidents + incident_departments",
      evaluatedAt: new Date().toISOString(),
      kpi: {
        total: Number(kpi.total),
        criticalActive: Number(kpi.critical_active),
        inProgress: Number(kpi.in_progress),
        resolvedThisWeek: Number(kpi.resolved_this_week),
        todayCount: Number(kpi.today_count),
        awaitingReviewCount: Number(kpi.awaiting_review_count),
        departmentAwaitingActionCount: pendingDeptTasks,
        statusBreakdown: {
          draftConfirmed: Number(kpi.awaiting_review_count),
          routed: Number(kpi.routed_count),
          inProgress: Number(kpi.in_progress),
          resolved: Number(kpi.resolved_count),
          closed: Number(kpi.closed_count),
        },
        severityBreakdown: {
          critical: Number(kpi.sev_critical),
          high: Number(kpi.sev_high),
          medium: Number(kpi.sev_medium),
          low: Number(kpi.sev_low),
        },
      },
      departments: deptRows.map((d) => ({
        code: d.department_code,
        name: d.department_name,
        active: Number(d.active),
        pending: Number(d.pending),
        resolved: Number(d.resolved),
      })),
    });
  } catch (err) {
    console.error("[API] /admin/stats error:", err);
    return NextResponse.json(
      { error: { code: "STATS_FAILED", message: "Failed to fetch stats." } },
      { status: 500 }
    );
  }
}
