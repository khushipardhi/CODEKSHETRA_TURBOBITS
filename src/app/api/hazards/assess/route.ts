/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence API — /api/hazards/assess
   Evaluates explainable risk score and factor weights for real-time
   telemetry or controlled simulation scenarios.
   ════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { isValidCity, DEFAULT_CITY } from "@/lib/city-context";
import { assessCityRisk } from "@/modules/hazards/assessment-engine";
import { fetchCityWeather, fetchCityMarineSurge, fetchCityRiverDischarge } from "@/modules/hazards/connectors/open-meteo";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const cityParam = body.city || DEFAULT_CITY;

    if (!isValidCity(cityParam)) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_CITY", message: `City '${cityParam}' is not supported.` } },
        { status: 400 }
      );
    }

    const citySlug = cityParam as "mumbai" | "pune" | "nagpur";
    const weather = await fetchCityWeather(citySlug);
    const marine = await fetchCityMarineSurge(citySlug);
    const river = await fetchCityRiverDischarge(citySlug);

    const assessment = assessCityRisk({
      city: citySlug,
      latitude: body.coordinates?.lat,
      longitude: body.coordinates?.lon,
      weather,
      marine,
      riverDischarge: river,
      simulationScenario: body.simulationScenario,
    });

    return NextResponse.json({
      success: true,
      data: assessment,
      meta: {
        city: citySlug,
        isSimulation: assessment.isSimulation,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("[API /api/hazards/assess] Error:", err);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: (err as Error).message } },
      { status: 500 }
    );
  }
}
