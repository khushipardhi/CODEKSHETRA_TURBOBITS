/* ════════════════════════════════════════════════════════
   POST /api/geo/routing
   Geo routing: find nearest facilities for departments
   Input: coordinates + department codes from AI
   Output: nearest facilities + zone + directions URLs
   ════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { routeIncident } from "@/modules/geo/router";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { latitude, longitude, requiredDepartments, cityId } = body;

    if (
      typeof latitude !== "number" ||
      typeof longitude !== "number" ||
      !Array.isArray(requiredDepartments) ||
      requiredDepartments.length === 0
    ) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message:
              "latitude (number), longitude (number), and requiredDepartments (string[]) are required",
          },
        },
        { status: 400 }
      );
    }

    console.log(
      `[GeoAPI] Routing: [${latitude}, ${longitude}] → depts=[${requiredDepartments.join(",")}] city=${cityId || "nagpur"}`
    );

    const result = routeIncident({
      latitude,
      longitude,
      requiredDepartments,
      cityId: cityId || "nagpur",
    });

    console.log(
      `[GeoAPI] Result: zone=${result.matchedZone?.zoneName || "none"} ` +
        `recommendations=${result.recommendations.length} ` +
        `in ${result.processingTimeMs}ms`
    );

    return NextResponse.json({
      success: true,
      routing: result,
    });
  } catch (err) {
    console.error("[GeoAPI] /geo/routing error:", err);
    return NextResponse.json(
      {
        error: {
          code: "GEO_ROUTING_FAILED",
          message: "Failed to compute geo routing.",
        },
      },
      { status: 500 }
    );
  }
}
