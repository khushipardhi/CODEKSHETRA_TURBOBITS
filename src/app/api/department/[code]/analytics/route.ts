/* ════════════════════════════════════════════════════════
   GET /api/department/[code]/analytics
   Department analytics & SLA metrics from TiDB
   ════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

interface StatsRow {
  total: number;
  active: number;
  pending: number;
  resolved: number;
  critical: number;
}

interface SeverityRow {
  severity: string;
  count: number;
}

interface WeeklyRow {
  week_label: string;
  count: number;
}

interface AvgRow {
  avg_hours: number;
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
    const cityClause = isAll ? "" : "AND i.city = ?";

    // 1. Basic stats
    const statsRows = await query<StatsRow>(
      `SELECT
        COALESCE(COUNT(*), 0) AS total,
        COALESCE(SUM(CASE WHEN id.status IN ('IN_PROGRESS','ASSIGNED') THEN 1 ELSE 0 END), 0) AS active,
        COALESCE(SUM(CASE WHEN id.status = 'ROUTED' THEN 1 ELSE 0 END), 0) AS pending,
        COALESCE(SUM(CASE WHEN id.status = 'RESOLVED' THEN 1 ELSE 0 END), 0) AS resolved,
        COALESCE(SUM(CASE WHEN i.severity = 'CRITICAL' AND id.status NOT IN ('RESOLVED','CLOSED') THEN 1 ELSE 0 END), 0) AS critical
      FROM incident_departments id
      JOIN incidents i ON i.id = id.incident_id
      WHERE id.department_code = ? ${cityClause}`,
      queryParams
    );
    const stats = statsRows[0] || { total: 0, active: 0, pending: 0, resolved: 0, critical: 0 };
    const total = Number(stats.total);
    const resolved = Number(stats.resolved);
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

    // 2. Average response time (hours between creation and first status change)
    let avgResponseHours = 0;
    try {
      const avgRows = await query<AvgRow>(
        `SELECT COALESCE(AVG(TIMESTAMPDIFF(HOUR, i.created_at, COALESCE(id.updated_at, i.updated_at))), 0) AS avg_hours
        FROM incident_departments id
        JOIN incidents i ON i.id = id.incident_id
        WHERE id.department_code = ? AND id.status != 'ROUTED' ${cityClause}`,
        queryParams
      );
      avgResponseHours = Math.round(Number(avgRows[0]?.avg_hours || 0));
    } catch {
      // Non-critical — updated_at column may not exist
    }

    // 3. SLA compliance (resolved within 48 hours = compliant)
    let slaCompliancePercent = 0;
    try {
      const slaTotal = total > 0 ? total : 1;
      const slaRows = await query<{ compliant: number }>(
        `SELECT COALESCE(COUNT(*), 0) AS compliant
        FROM incident_departments id
        JOIN incidents i ON i.id = id.incident_id
        WHERE id.department_code = ? AND id.status = 'RESOLVED'
          AND TIMESTAMPDIFF(HOUR, i.created_at, COALESCE(id.updated_at, i.updated_at)) <= 48 ${cityClause}`,
        queryParams
      );
      const compliant = Number(slaRows[0]?.compliant || 0);
      slaCompliancePercent = Math.round((compliant / slaTotal) * 100);
    } catch {
      slaCompliancePercent = resolutionRate; // Fallback
    }

    // 4. Severity breakdown
    const severityRows = await query<SeverityRow>(
      `SELECT COALESCE(i.severity, 'UNKNOWN') AS severity, COUNT(*) AS count
       FROM incident_departments id
       JOIN incidents i ON i.id = id.incident_id
       WHERE id.department_code = ? ${cityClause}
       GROUP BY i.severity
       ORDER BY count DESC`,
      queryParams
    );

    // 5. Weekly volume (last 8 weeks)
    let weeklyVolume: { week: string; count: number }[] = [];
    try {
      const weeklyRows = await query<WeeklyRow>(
        `SELECT
          DATE_FORMAT(i.created_at, '%b %d') AS week_label,
          COUNT(*) AS count
        FROM incident_departments id
        JOIN incidents i ON i.id = id.incident_id
        WHERE id.department_code = ? ${cityClause}
          AND i.created_at >= DATE_SUB(NOW(), INTERVAL 56 DAY)
        GROUP BY YEARWEEK(i.created_at, 1), week_label
        ORDER BY MIN(i.created_at) ASC
        LIMIT 8`,
        queryParams
      );
      weeklyVolume = weeklyRows.map((w) => ({
        week: w.week_label,
        count: Number(w.count),
      }));
    } catch {
      // Non-critical
    }

    // If no weekly data, create placeholder weeks
    if (weeklyVolume.length === 0) {
      const now = new Date();
      for (let i = 7; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 7 * 24 * 3600 * 1000);
        weeklyVolume.push({
          week: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          count: 0,
        });
      }
    }

    return NextResponse.json({
      success: true,
      departmentCode: code,
      analytics: {
        avgResponseHours,
        slaCompliancePercent,
        resolutionRate,
        totalIncidents: total,
        resolvedCount: resolved,
        pendingCount: Number(stats.pending),
        activeCount: Number(stats.active),
        criticalCount: Number(stats.critical),
        weeklyVolume,
        severityBreakdown: severityRows.map((s) => ({
          severity: s.severity || "UNKNOWN",
          count: Number(s.count),
        })),
      },
    });
  } catch (err) {
    console.error("[API] /department/[code]/analytics error:", err);
    return NextResponse.json(
      { error: { code: "ANALYTICS_FAILED", message: "Failed to fetch analytics." } },
      { status: 500 }
    );
  }
}
