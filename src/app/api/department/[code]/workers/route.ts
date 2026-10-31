/* ════════════════════════════════════════════════════════
   GET /api/department/[code]/workers
   Worker/Station roster from GeoJSON data
   ════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { resolveDatasets } from "@/modules/geo/dept-mapping";
import { getDataset } from "@/modules/geo/loader";
import { normalizeFacilities } from "@/modules/geo/normalizer";
import { DEPARTMENT_REGISTRY } from "@/lib/department-registry";

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

    const city = _request.nextUrl.searchParams.get("city") || _request.headers.get("x-city") || "nagpur";
    const dept = DEPARTMENT_REGISTRY[code];
    const datasetKeys = resolveDatasets([code], city);

    const workers: {
      id: string;
      name: string;
      role: string;
      station: string;
      zone: string;
      contact: string;
      status: string;
    }[] = [];

    for (const key of datasetKeys) {
      const dataset = getDataset(key, city);
      if (!dataset) continue;

      const facilities = normalizeFacilities(dataset);
      for (const fac of facilities) {
        workers.push({
          id: fac.id,
          name: fac.name,
          role: fac.facilityType || "Station",
          station: fac.address || fac.locality || city,
          zone: fac.zone || "",
          contact: fac.contactNumber || fac.emergencyNumber || "",
          status: "Active",
        });
      }
    }

    return NextResponse.json({
      success: true,
      departmentCode: code,
      departmentName: dept?.name || code,
      workers,
      totalWorkers: workers.length,
    });
  } catch (err) {
    console.error("[API] /department/[code]/workers error:", err);
    return NextResponse.json(
      { error: { code: "WORKERS_FAILED", message: "Failed to fetch workers." } },
      { status: 500 }
    );
  }
}
