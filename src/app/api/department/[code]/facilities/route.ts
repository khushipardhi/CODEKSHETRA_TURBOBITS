/* ════════════════════════════════════════════════════════
   GET /api/department/[code]/facilities
   Returns GeoJSON-mapped facilities for a department
   Uses geo/loader + geo/normalizer + geo/dept-mapping
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

    const allFacilities: {
      id: string;
      name: string;
      facilityType: string;
      address: string;
      zone: string;
      contactNumber: string;
      emergencyNumber: string;
      handlingCategories: string[];
      latitude: number;
      longitude: number;
    }[] = [];

    // Unique categories from the department registry
    const categorySet = new Set<string>();

    for (const key of datasetKeys) {
      const dataset = getDataset(key, city);
      if (!dataset) continue;

      const facilities = normalizeFacilities(dataset);
      for (const fac of facilities) {
        allFacilities.push({
          id: fac.id,
          name: fac.name,
          facilityType: fac.facilityType,
          address: fac.address || "",
          zone: fac.zone || "",
          contactNumber: fac.contactNumber || "",
          emergencyNumber: fac.emergencyNumber || "",
          handlingCategories: fac.handlingCategories || [],
          latitude: fac.latitude,
          longitude: fac.longitude,
        });

        if (fac.handlingCategories) {
          for (const cat of fac.handlingCategories) {
            categorySet.add(cat);
          }
        }
      }
    }

    // Build category scopes from the department's own categories
    const categories = (dept?.categories || [...categorySet]).map((cat) => ({
      category: cat,
      subCategories: [],
    }));

    return NextResponse.json({
      success: true,
      departmentCode: code,
      departmentName: dept?.name || code,
      facilities: allFacilities,
      categories,
      totalFacilities: allFacilities.length,
      datasetsSearched: datasetKeys,
    });
  } catch (err) {
    console.error("[API] /department/[code]/facilities error:", err);
    return NextResponse.json(
      { error: { code: "FACILITIES_FAILED", message: "Failed to fetch department facilities." } },
      { status: 500 }
    );
  }
}
