/* ════════════════════════════════════════════════════════
   Admin Departments API — /api/admin/departments
   Returns live workload & incident statistics for all 17 departments
   ════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { DEPARTMENTS } from "@/modules/ai/department-routing";
import { getAllFacilities } from "@/modules/geo/router";

interface DeptDbStat {
  dept_code: string;
  total: number;
  active: number;
  resolved: number;
  critical: number;
}

export async function GET(request: NextRequest) {
  try {
    const city = request.nextUrl.searchParams.get("city") || request.headers.get("x-city");
    const isAll = !city || city === "all";

    // 1. Fetch incident stats grouped by department code from TiDB
    const statsRows = await query<DeptDbStat>(
      `SELECT 
         id.department_code as dept_code,
         COUNT(i.id) as total,
         SUM(CASE WHEN i.status NOT IN ('RESOLVED', 'CLOSED') THEN 1 ELSE 0 END) as active,
         SUM(CASE WHEN i.status IN ('RESOLVED', 'CLOSED') THEN 1 ELSE 0 END) as resolved,
         SUM(CASE WHEN i.severity = 'CRITICAL' OR i.is_emergency = 1 THEN 1 ELSE 0 END) as critical
       FROM incident_departments id
       JOIN incidents i ON id.incident_id = i.id
       ${isAll ? "" : "WHERE i.city = ?"}
       GROUP BY id.department_code`,
      isAll ? [] : [city]
    ).catch(() => []);

    const statsMap = new Map<string, DeptDbStat>();
    for (const r of statsRows) {
      if (r.dept_code) {
        statsMap.set(r.dept_code.toLowerCase(), r);
      }
    }

    // 2. Count GeoJSON facilities per department for this city
    let facilities: any[] = [];
    try {
      facilities = getAllFacilities(isAll ? undefined : city);
    } catch {
      facilities = [];
    }

    const facilityCounts = new Map<string, number>();
    for (const f of facilities) {
      const type = (f.departmentType || "").toLowerCase();
      facilityCounts.set(type, (facilityCounts.get(type) || 0) + 1);
    }

    // 3. Map with the 17 official department taxonomies
    const departments = DEPARTMENTS.map((d) => {
      const codeKey = d.code.toLowerCase();
      const s = statsMap.get(codeKey) || { total: 0, active: 0, resolved: 0, critical: 0 };
      const facilityCount = facilityCounts.get(codeKey) || 0;

      return {
        code: d.code,
        name: d.name,
        nameMarathi: d.nameMarathi,
        icon: d.icon,
        description: d.description,
        scope: d.scope,
        priorityBand: d.priorityBand,
        slaHours: d.slaHours,
        status: "ACTIVE",
        activeIncidents: Number(s.active) || 0,
        resolvedIncidents: Number(s.resolved) || 0,
        totalIncidents: Number(s.total) || 0,
        criticalCount: Number(s.critical) || 0,
        facilitiesCount: facilityCount,
      };
    });

    return NextResponse.json({
      success: true,
      departments,
      totalDepartments: DEPARTMENTS.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[API] /admin/departments GET error:", err);
    return NextResponse.json(
      { error: { code: "DEPARTMENTS_FAILED", message: "Failed to load departments" } },
      { status: 500 }
    );
  }
}
