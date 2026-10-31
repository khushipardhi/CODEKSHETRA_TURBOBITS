/* ════════════════════════════════════════════════════════
   GET /api/department/[code]/stats
   Department-specific KPI aggregation from TiDB
   ════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

interface DeptKPIRow {
  total: number;
  active: number;
  pending: number;
  resolved: number;
  critical: number;
  today_count: number;
}

interface SeverityRow {
  severity: string;
  count: number;
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
    const queryParams = isAll ? [code] : [code, city];

    // KPI aggregation
    const kpiRows = await query<DeptKPIRow>(
      `SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN id.status IN ('IN_PROGRESS','ASSIGNED') THEN 1 ELSE 0 END) AS active,
        SUM(CASE WHEN id.status = 'ROUTED' THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN id.status = 'RESOLVED' THEN 1 ELSE 0 END) AS resolved,
        SUM(CASE WHEN i.severity = 'CRITICAL' AND id.status NOT IN ('RESOLVED','CLOSED') THEN 1 ELSE 0 END) AS critical,
        SUM(CASE WHEN i.created_at > DATE_SUB(NOW(), INTERVAL 1 DAY) THEN 1 ELSE 0 END) AS today_count
      FROM incident_departments id
      JOIN incidents i ON i.id = id.incident_id
      WHERE id.department_code = ? ${isAll ? "" : "AND i.city = ?"}`,
      queryParams
    );

    const kpi = kpiRows[0] || { total: 0, active: 0, pending: 0, resolved: 0, critical: 0, today_count: 0 };

    // Severity breakdown
    const severityRows = await query<SeverityRow>(
      `SELECT i.severity, COUNT(*) AS count
       FROM incident_departments id
       JOIN incidents i ON i.id = id.incident_id
       WHERE id.department_code = ? AND id.status NOT IN ('RESOLVED','CLOSED') ${isAll ? "" : "AND i.city = ?"}
       GROUP BY i.severity`,
      queryParams
    );

    // Resolution rate
    const total = Number(kpi.total);
    const resolved = Number(kpi.resolved);
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

    return NextResponse.json({
      success: true,
      departmentCode: code,
      kpi: {
        total: Number(kpi.total),
        active: Number(kpi.active),
        pending: Number(kpi.pending),
        resolved: Number(kpi.resolved),
        critical: Number(kpi.critical),
        todayCount: Number(kpi.today_count),
        resolutionRate,
      },
      severityBreakdown: severityRows.map((s) => ({
        severity: s.severity || "UNKNOWN",
        count: Number(s.count),
      })),
    });
  } catch (err) {
    console.error("[API] /department/[code]/stats error:", err);
    return NextResponse.json(
      { error: { code: "STATS_FAILED", message: "Failed to fetch department stats." } },
      { status: 500 }
    );
  }
}
