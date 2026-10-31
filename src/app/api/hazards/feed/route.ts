/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence API — /api/hazards/feed
   Returns active alerts, live telemetry, and candidate events for a city.
   ════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { isValidCity, DEFAULT_CITY } from "@/lib/city-context";
import { syncCityHazards } from "@/modules/hazards/correlator";
import { fetchCityWeather, fetchCityAirQuality, fetchCityMarineSurge } from "@/modules/hazards/connectors/open-meteo";
import { hazardCache } from "@/modules/hazards/cache";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const cityParam = searchParams.get("city") || req.headers.get("x-city") || DEFAULT_CITY;

    if (!isValidCity(cityParam)) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_CITY", message: `City '${cityParam}' is not supported.` } },
        { status: 400 }
      );
    }

    const citySlug = cityParam as "mumbai" | "pune" | "nagpur";

    // 1. Check in-memory TTL cache (30s SLA)
    const cacheKey = `hazard_feed_${citySlug}`;
    const cachedData = hazardCache.get<any>(cacheKey);
    if (cachedData) {
      return NextResponse.json({
        success: true,
        data: cachedData,
        meta: {
          city: citySlug,
          timestamp: new Date().toISOString(),
          cached: true,
        },
      });
    }

    // 2. Synchronize hazards and calculate assessment
    const syncedState = await syncCityHazards(citySlug);
    const weather = await fetchCityWeather(citySlug);
    const aqi = await fetchCityAirQuality(citySlug);
    const marine = await fetchCityMarineSurge(citySlug);

    const payloadData = {
      city: citySlug,
      activeAlerts: syncedState.activeAlerts,
      activeEvents: syncedState.activeEvents,
      assessment: syncedState.latestAssessment,
      currentTelemetry: {
        weather,
        airQuality: aqi,
        marine,
      },
      observationsCount: syncedState.observationsCount,
    };

    // Cache feed data for 30s
    hazardCache.set(cacheKey, payloadData, 30);

    return NextResponse.json({
      success: true,
      data: payloadData,
      meta: {
        city: citySlug,
        timestamp: new Date().toISOString(),
        cached: false,
      },
    });
  } catch (err) {
    console.error("[API /api/hazards/feed] Error:", err);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: (err as Error).message } },
      { status: 500 }
    );
  }
}
