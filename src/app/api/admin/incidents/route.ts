/* ════════════════════════════════════════════════════════
   GET /api/admin/incidents
   Admin incident list — all incidents, filterable + paginated
   Query params: status, severity, search, page, limit
   ════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

interface IncidentListRow {
  id: string;
  public_reference: string;
  category_slug: string | null;
  subcategory_slug: string | null;
  status: string;
  severity: string | null;
  priority_score: number | null;
  title: string | null;
  citizen_summary: string | null;
  location_text: string | null;
  latitude: number | null;
  longitude: number | null;
  is_emergency: number;
  created_at: string;
  confirmed_at: string | null;
}

interface CountRow {
  cnt: number;
}

interface DeptRow {
  incident_id: string;
  department_code: string;
  department_name: string;
  status: string;
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const statusFilter = url.searchParams.get("status") || "";
    const severityFilter = url.searchParams.get("severity") || "";
    const search = url.searchParams.get("search") || "";
    const cityFilter = url.searchParams.get("city") || request.headers.get("x-city") || "";
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10)));
    const offset = (page - 1) * limit;

    // Build WHERE clauses
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (cityFilter && cityFilter !== "ALL" && cityFilter !== "all") {
      conditions.push("i.city = ?");
      params.push(cityFilter);
    }
    if (statusFilter && statusFilter !== "ALL") {
      conditions.push("i.status = ?");
      params.push(statusFilter);
    }
    if (severityFilter && severityFilter !== "ALL") {
      conditions.push("i.severity = ?");
      params.push(severityFilter);
    }
    if (search) {
      conditions.push("(i.public_reference LIKE ? OR i.title LIKE ? OR i.citizen_summary LIKE ?)");
      const like = `%${search}%`;
      params.push(like, like, like);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Count total
    const countRows = await query<CountRow>(
      `SELECT COUNT(*) AS cnt FROM incidents i ${whereClause}`,
      params
    );
    const total = Number(countRows[0]?.cnt || 0);

    // Fetch page — LIMIT/OFFSET inlined (TiDB execute() doesn't support params in LIMIT)
    const incidents = await query<IncidentListRow>(
      `SELECT i.id, i.public_reference, i.category_slug, i.subcategory_slug,
              i.status, i.severity, i.priority_score, i.title, i.citizen_summary,
              i.location_text, i.latitude, i.longitude, i.is_emergency,
              i.created_at, i.confirmed_at
       FROM incidents i
       ${whereClause}
       ORDER BY i.created_at DESC
       LIMIT ${limit} OFFSET ${offset}`,
      params
    );

    // Batch-fetch departments for all incidents on this page
    let deptMap = new Map<string, { code: string; name: string; status: string }[]>();
    if (incidents.length > 0) {
      const ids = incidents.map((i) => i.id);
      const placeholders = ids.map(() => "?").join(",");
      const deptRows = await query<DeptRow>(
        `SELECT incident_id, department_code, department_name, status
         FROM incident_departments
         WHERE incident_id IN (${placeholders})`,
        ids
      );
      for (const d of deptRows) {
        if (!deptMap.has(d.incident_id)) deptMap.set(d.incident_id, []);
        deptMap.get(d.incident_id)!.push({
          code: d.department_code,
          name: d.department_name,
          status: d.status,
        });
      }
    }

    return NextResponse.json({
      success: true,
      incidents: incidents.map((i) => ({
        id: i.id,
        publicReference: i.public_reference,
        category: i.category_slug,
        subcategory: i.subcategory_slug,
        status: i.status,
        severity: i.severity,
        priorityScore: i.priority_score,
        title: i.title,
        citizenSummary: i.citizen_summary,
        locationText: i.location_text,
        latitude: i.latitude,
        longitude: i.longitude,
        isEmergency: !!i.is_emergency,
        createdAt: i.created_at,
        confirmedAt: i.confirmed_at,
        departments: deptMap.get(i.id) || [],
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("[API] /admin/incidents error:", err);
    return NextResponse.json(
      { error: { code: "FETCH_FAILED", message: "Failed to fetch incidents." } },
      { status: 500 }
    );
  }
}
