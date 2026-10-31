/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Admin Routing Override API
   POST /api/admin/routing/override
   Allows authorized city administrators to approve or override department assignments
   with full reason recording and immutable audit preservation.
   ════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { recordRoutingOverride } from "@/modules/routing/decision-record";
import { isDepartmentConfiguredForCity, CitySlug } from "@/modules/routing/registry";
import { query } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const overrideDepartment =
      body.overrideDepartment || body.newPrimaryDepartment;
    const {
      incidentId,
      actorId = "admin_supervisor",
      actorName = "City Operations Administrator",
      reason,
      city,
    } = body as {
      incidentId: string;
      overrideDepartment?: string;
      newPrimaryDepartment?: string;
      actorId?: string;
      actorName?: string;
      reason: string;
      city?: string;
    };

    if (!incidentId || !overrideDepartment || !reason) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "incidentId, overrideDepartment, and reason are required.",
          },
        },
        { status: 400 }
      );
    }

    // Determine target city
    let targetCity = city?.toLowerCase() as CitySlug | undefined;
    if (!targetCity) {
      const inc = await query<{ city: string }>(
        `SELECT city FROM incidents WHERE id = ? LIMIT 1`,
        [incidentId]
      );
      if (inc && inc.length > 0) {
        targetCity = inc[0].city.toLowerCase() as CitySlug;
      }
    }

    // Validate that department exists for target city
    if (targetCity && !isDepartmentConfiguredForCity(targetCity, overrideDepartment)) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_DEPARTMENT",
            message: `Department '${overrideDepartment}' is not registered in ${targetCity.toUpperCase()}`,
          },
        },
        { status: 400 }
      );
    }

    // Record the override
    await recordRoutingOverride({
      incidentId,
      overrideDepartment,
      actorId,
      actorName,
      reason,
    });

    console.log(
      `[AdminRouting] Incident ${incidentId} overridden to ${overrideDepartment} by ${actorName}: ${reason}`
    );

    return NextResponse.json({
      success: true,
      incidentId,
      overrideDepartment,
      actorName,
      reason,
      timestamp: new Date().toISOString(),
      message: `Routing successfully updated to ${overrideDepartment}. Audit trail preserved.`,
    });
  } catch (err) {
    console.error("[API] /admin/routing/override error:", err);
    return NextResponse.json(
      {
        error: {
          code: "OVERRIDE_FAILED",
          message: "Failed to record administrative routing override.",
        },
      },
      { status: 500 }
    );
  }
}
