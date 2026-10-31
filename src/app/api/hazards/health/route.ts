/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence API — /api/hazards/health
   Operational telemetry, circuit breaker states, and cache analytics.
   ════════════════════════════════════════════════════════ */

import { NextResponse } from "next/server";
import { healthMonitor } from "@/modules/hazards/health-monitor";
import { hazardCache } from "@/modules/hazards/cache";
import { query } from "@/lib/db";
import { fetchCityWeather, fetchCityAirQuality } from "@/modules/hazards/connectors/open-meteo";

export async function GET() {
  try {
    const connectors = healthMonitor.getAllHealth();
    const cacheStats = hazardCache.getStats();

    // Query TiDB for real persisted observation statistics
    const obsStats = await query<{
      source_id: string;
      latest_obs: string | null;
      obs_count: number;
    }>(
      `SELECT 
        source_id, 
        MAX(observed_at) AS latest_obs, 
        COUNT(*) AS obs_count 
       FROM hazard_observations 
       GROUP BY source_id`
    ).catch(() => []);

    const obsMap = new Map(obsStats.map(s => [s.source_id, s]));

    const now = Date.now();
    const enrichedConnectors = connectors.map((c) => {
      const dbStat = obsMap.get(c.sourceId);
      const latestObs = dbStat?.latest_obs || c.lastSuccessAt;
      const dataAgeMinutes = latestObs
        ? Math.max(0, Math.floor((now - new Date(latestObs).getTime()) / 60000))
        : null;

      return {
        ...c,
        latestObservationAt: latestObs,
        observationCount: Number(dbStat?.obs_count || 0),
        dataAgeMinutes,
        isStale: dataAgeMinutes !== null ? dataAgeMinutes > Math.floor(c.cacheTtlSeconds / 60) * 4 : false,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        system: "Sentinel City Intelligence Engine",
        status: enrichedConnectors.some(c => c.status === "OFFLINE") ? "DEGRADED" : "HEALTHY",
        connectors: enrichedConnectors,
        cache: cacheStats,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("[API /api/hazards/health] Error:", err);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: (err as Error).message } },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    // Active health probe: probe Open-Meteo weather and air quality for quick verification
    const results = await Promise.allSettled([
      fetchCityWeather("mumbai"),
      fetchCityAirQuality("mumbai"),
    ]);

    const connectors = healthMonitor.getAllHealth();

    return NextResponse.json({
      success: true,
      message: "Active health probes executed successfully",
      probes: results.map((r, i) => ({
        target: i === 0 ? "open_meteo_weather" : "open_meteo_air_quality",
        status: r.status === "fulfilled" ? "SUCCESS" : "FAILED",
        error: r.status === "rejected" ? (r.reason as Error)?.message : null,
      })),
      connectors,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: { code: "PROBE_FAILED", message: (err as Error).message } },
      { status: 500 }
    );
  }
}

