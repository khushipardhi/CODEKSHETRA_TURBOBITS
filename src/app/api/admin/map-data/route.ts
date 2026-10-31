/* ════════════════════════════════════════════════════════
   GET /api/admin/map-data
   Returns all data needed for the admin map:
   - Real incidents with coordinates (from TiDB) — Latest first
   - All GeoJSON facilities (from Geo Engine)
   - Zone boundaries
   ════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getAllFacilities, getAllZones } from "@/modules/geo/router";

interface IncidentRow {
  id: string;
  public_reference: string;
  title: string | null;
  citizen_summary: string | null;
  location_text: string | null;
  severity: string | null;
  status: string;
  category_slug: string | null;
  latitude: number;
  longitude: number;
  is_emergency: number;
  created_at: string;
}

interface DeptRow {
  incident_id: string;
  department_name: string;
}

function deriveTitle(i: IncidentRow): string {
  if (i.title && i.title.trim() && !i.title.toLowerCase().includes("untitled")) {
    return i.title.trim();
  }
  if (i.citizen_summary && i.citizen_summary.trim()) {
    const s = i.citizen_summary.trim();
    return s.length > 65 ? s.slice(0, 62) + "..." : s;
  }
  if (i.category_slug) {
    return i.category_slug
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  }
  return "Civic Report";
}

export async function GET(request: NextRequest) {
  try {
    const city = request.nextUrl.searchParams.get("city") || request.headers.get("x-city") || "nagpur";
    const isAll = city === "all";

    // Fetch incidents that have coordinates — filtered by city
    const incidents = await query<IncidentRow>(
      `SELECT id, public_reference, title, citizen_summary, location_text,
              severity, status, category_slug, latitude, longitude, is_emergency, created_at
       FROM incidents
       WHERE latitude IS NOT NULL AND longitude IS NOT NULL
       ${isAll ? "" : "AND city = ?"}
       ORDER BY created_at DESC
       LIMIT 200`,
      isAll ? [] : [city]
    );

    // Batch fetch departments for those incidents
    let deptMap = new Map<string, string[]>();
    if (incidents.length > 0) {
      const ids = incidents.map((i) => i.id);
      const placeholders = ids.map(() => "?").join(",");
      const depts = await query<DeptRow>(
        `SELECT incident_id, department_name FROM incident_departments WHERE incident_id IN (${placeholders})`,
        ids
      );
      for (const d of depts) {
        if (!deptMap.has(d.incident_id)) deptMap.set(d.incident_id, []);
        deptMap.get(d.incident_id)!.push(d.department_name);
      }
    }

    // Get facilities & zones from the Geo Engine for the requested city
    const facilities = getAllFacilities(isAll ? undefined : city);
    const zones = getAllZones(isAll ? undefined : city);


    return NextResponse.json({
      success: true,
      incidents: incidents.map((i) => ({
        id: i.id,
        publicReference: i.public_reference,
        title: deriveTitle(i),
        summary: i.citizen_summary || i.title || "Civic report",
        locationText: i.location_text || `${Number(i.latitude).toFixed(4)}, ${Number(i.longitude).toFixed(4)}`,
        severity: i.severity || "MEDIUM",
        status: i.status,
        category: i.category_slug ? i.category_slug.replace(/_/g, " ") : "Incident",
        latitude: Number(i.latitude),
        longitude: Number(i.longitude),
        isEmergency: !!i.is_emergency,
        createdAt: i.created_at,
        departments: deptMap.get(i.id) || [],
      })),
      facilities: facilities.map((f) => ({
        id: f.id,
        name: f.name,
        departmentType: f.departmentType,
        departmentName: f.departmentName,
        facilityType: f.facilityType,
        latitude: f.latitude,
        longitude: f.longitude,
        address: f.address,
        zone: f.zone,
        contactNumber: f.contactNumber,
        emergencyNumber: f.emergencyNumber,
      })),
      zones: zones.map((z) => ({
        id: z.id,
        zoneName: z.zoneName,
        zoneNumber: z.zoneNumber,
        areaSqKm: z.areaSqKm,
        polygon: z.polygon,
        keyLocalities: z.keyLocalities,
      })),
      summary: {
        incidentCount: incidents.length,
        facilityCount: facilities.length,
        zoneCount: zones.length,
      },
    });
  } catch (err) {
    console.error("[API] /admin/map-data error:", err);
    return NextResponse.json(
      { error: { code: "FETCH_FAILED", message: "Failed to fetch map data." } },
      { status: 500 }
    );
  }
}
