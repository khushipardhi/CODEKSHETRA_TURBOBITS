/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Connector Health Monitor
   Tracks uptime, latency, consecutive failures, and circuit state.
   ════════════════════════════════════════════════════════ */

import { query } from "@/lib/db";

export interface SourceHealthRecord {
  sourceId: string;
  sourceName: string;
  datasetType: string;
  coverage: string;
  status: "HEALTHY" | "DEGRADED" | "OFFLINE";
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  consecutiveFailures: number;
  lastLatencyMs: number | null;
  lastErrorMessage: string | null;
  cacheTtlSeconds: number;
  fallbackStrategy: string;
  mode: "LIVE_API" | "CACHED_FEED" | "SPATIAL_VECTOR";
  updatedAt: string;
  // Phase 6 Operational Data-Quality Additions
  dataTimestamp?: string | null;
  cacheTimestamp?: string | null;
  expectedUpdateIntervalSeconds?: number;
  dataCompletenessPercent?: number;
  stateClassification?: "LIVE" | "CACHED" | "HISTORICAL" | "SIMULATED";
  isStale?: boolean;
  freshnessPolicySeconds?: number;
}

class HealthMonitor {
  private inMemoryHealth: Map<string, SourceHealthRecord> = new Map();
  private lastDbSync: number = 0;
  private readonly dbSyncThrottleMs = 30000; // sync to TiDB at most once every 30s

  constructor() {
    this.initSource(
      "open_meteo_weather",
      "Open-Meteo Weather Forecast API",
      "Surface Telemetry & Rain Radar",
      "Mumbai, Pune, Nagpur",
      900,
      "Retains last known observation; marked with timestamp age",
      "LIVE_API"
    );
    this.initSource(
      "open_meteo_air_quality",
      "Open-Meteo Air Quality API",
      "Aerosol, PM2.5, PM10 & AQI",
      "Mumbai, Pune, Nagpur",
      900,
      "Retains last CPCB/CAMS model run; flags stale when >2h",
      "LIVE_API"
    );
    this.initSource(
      "open_meteo_flood",
      "Open-Meteo River Discharge API",
      "GloFAS River Basin Discharge",
      "Regional Maharashtra Basins (Mutha, Mula, Nag, Mithi)",
      1800,
      "Hydrological persistence fallback with baseline flow reference",
      "LIVE_API"
    );
    this.initSource(
      "open_meteo_marine",
      "Open-Meteo Coastal Marine Surge API",
      "Arabian Sea Wave & Surge Gauges",
      "Mumbai Coastal Zone & Harbor",
      1800,
      "Tide table astronomical fallback when live marine gauge is offline",
      "LIVE_API"
    );
    this.initSource(
      "sachet_alerts",
      "NDMA SACHET Disaster Alerts Feed",
      "Common Alerting Protocol (CAP) Warnings",
      "State-level (Maharashtra / Mumbai / Pune / Nagpur)",
      300,
      "Local incident correlation and manual EOC override",
      "CACHED_FEED"
    );
    this.initSource(
      "usgs_earthquakes",
      "USGS Global Earthquake Feed",
      "Global & Regional Seismology (M2.5+)",
      "Western India & Maharashtra Seismic Belt",
      600,
      "Regional seismological network cache (24h lookback)",
      "CACHED_FEED"
    );
    this.initSource(
      "mumbai_flood_vector",
      "Mumbai Spatial Hydrology Adapter",
      "Copernicus 30m DEM & SWD Drainage Gates",
      "Mumbai Island & Suburban Only",
      86400,
      "Curated elevation and sluice gate vector geometry",
      "SPATIAL_VECTOR"
    );
  }

  private initSource(
    sourceId: string,
    sourceName: string,
    datasetType: string,
    coverage: string,
    cacheTtlSeconds: number,
    fallbackStrategy: string,
    mode: "LIVE_API" | "CACHED_FEED" | "SPATIAL_VECTOR"
  ) {
    this.inMemoryHealth.set(sourceId, {
      sourceId,
      sourceName,
      datasetType,
      coverage,
      status: "HEALTHY",
      lastSuccessAt: null,
      lastFailureAt: null,
      consecutiveFailures: 0,
      lastLatencyMs: null,
      lastErrorMessage: null,
      cacheTtlSeconds,
      fallbackStrategy,
      mode,
      updatedAt: new Date().toISOString(),
    });
  }

  /** Record a successful API call with latency */
  async recordSuccess(sourceId: string, latencyMs: number): Promise<void> {
    const record = this.inMemoryHealth.get(sourceId);
    if (!record) return;

    record.status = "HEALTHY";
    record.lastSuccessAt = new Date().toISOString();
    record.consecutiveFailures = 0;
    record.lastLatencyMs = latencyMs;
    record.lastErrorMessage = null;
    record.updatedAt = new Date().toISOString();

    await this.conditionalDbSync();
  }

  /** Record a failure or timeout */
  async recordFailure(sourceId: string, errorMessage: string, latencyMs?: number): Promise<void> {
    const record = this.inMemoryHealth.get(sourceId);
    if (!record) return;

    record.consecutiveFailures++;
    record.lastFailureAt = new Date().toISOString();
    if (latencyMs !== undefined) record.lastLatencyMs = latencyMs;
    record.lastErrorMessage = errorMessage.slice(0, 450);
    record.updatedAt = new Date().toISOString();

    // Circuit breaker state
    if (record.consecutiveFailures >= 3) {
      record.status = "OFFLINE";
    } else if (record.consecutiveFailures > 0) {
      record.status = "DEGRADED";
    }

    await this.conditionalDbSync();
  }

  /** Check if a connector is currently considered offline */
  isSourceOffline(sourceId: string): boolean {
    const record = this.inMemoryHealth.get(sourceId);
    return record?.status === "OFFLINE";
  }

  /** Static catalog of source metadata with Phase 6 freshness policies */
  private static readonly METADATA_CATALOG: Record<string, Partial<SourceHealthRecord>> = {
    open_meteo_weather: {
      datasetType: "Surface Telemetry & Rain Radar",
      coverage: "Mumbai, Pune, Nagpur",
      cacheTtlSeconds: 900,
      expectedUpdateIntervalSeconds: 900, // 15 mins
      freshnessPolicySeconds: 1800, // Stale if > 30 mins
      fallbackStrategy: "Retains last known observation; marked with timestamp age",
      mode: "LIVE_API",
      dataCompletenessPercent: 100,
      stateClassification: "LIVE",
    },
    open_meteo_air_quality: {
      datasetType: "Aerosol, PM2.5, PM10 & AQI",
      coverage: "Mumbai, Pune, Nagpur",
      cacheTtlSeconds: 900,
      expectedUpdateIntervalSeconds: 900, // 15 mins
      freshnessPolicySeconds: 7200, // Stale if > 2 hours
      fallbackStrategy: "Retains last CPCB/CAMS model run; flags stale when >2h",
      mode: "LIVE_API",
      dataCompletenessPercent: 100,
      stateClassification: "LIVE",
    },
    open_meteo_flood: {
      datasetType: "GloFAS River Basin Discharge",
      coverage: "Regional Maharashtra Basins (Mutha, Mula, Nag, Mithi)",
      cacheTtlSeconds: 1800,
      expectedUpdateIntervalSeconds: 1800, // 30 mins
      freshnessPolicySeconds: 10800, // Stale if > 3 hours
      fallbackStrategy: "Hydrological persistence fallback with baseline flow reference",
      mode: "LIVE_API",
      dataCompletenessPercent: 95,
      stateClassification: "LIVE",
    },
    open_meteo_marine: {
      datasetType: "Arabian Sea Wave & Surge Gauges",
      coverage: "Mumbai Coastal Zone & Harbor",
      cacheTtlSeconds: 1800,
      expectedUpdateIntervalSeconds: 1800, // 30 mins
      freshnessPolicySeconds: 3600, // Stale if > 1 hour
      fallbackStrategy: "Tide table astronomical fallback when live marine gauge is offline",
      mode: "LIVE_API",
      dataCompletenessPercent: 100,
      stateClassification: "LIVE",
    },
    sachet_alerts: {
      datasetType: "Common Alerting Protocol (CAP) Warnings",
      coverage: "State-level (Maharashtra / Mumbai / Pune / Nagpur)",
      cacheTtlSeconds: 300,
      expectedUpdateIntervalSeconds: 300, // 5 mins
      freshnessPolicySeconds: 1800, // Stale if > 30 mins
      fallbackStrategy: "Local incident correlation and manual EOC override",
      mode: "CACHED_FEED",
      dataCompletenessPercent: 90,
      stateClassification: "CACHED",
    },
    usgs_earthquakes: {
      datasetType: "Global & Regional Seismology (M2.5+)",
      coverage: "Western India & Maharashtra Seismic Belt",
      cacheTtlSeconds: 600,
      expectedUpdateIntervalSeconds: 600, // 10 mins
      freshnessPolicySeconds: 3600, // Stale if > 1 hour
      fallbackStrategy: "Regional seismological network cache (24h lookback)",
      mode: "CACHED_FEED",
      dataCompletenessPercent: 100,
      stateClassification: "CACHED",
    },
    mumbai_flood_vector: {
      datasetType: "Copernicus 30m DEM & SWD Drainage Gates",
      coverage: "Mumbai Island & Suburban Only",
      cacheTtlSeconds: 86400,
      expectedUpdateIntervalSeconds: 86400, // 24 hours
      freshnessPolicySeconds: 2592000, // 30 days
      fallbackStrategy: "Curated elevation and sluice gate vector geometry",
      mode: "SPATIAL_VECTOR",
      dataCompletenessPercent: 100,
      stateClassification: "SIMULATED",
    },
  };

  /** Record observation data details and actual timestamp */
  recordObservationData(sourceId: string, dataTimestamp: string, completenessPercent: number = 100): void {
    const record = this.inMemoryHealth.get(sourceId);
    if (!record) return;
    record.dataTimestamp = dataTimestamp;
    record.dataCompletenessPercent = completenessPercent;
    record.stateClassification = "LIVE";
    record.updatedAt = new Date().toISOString();
  }

  /** Record cache write event */
  recordCacheWrite(sourceId: string): void {
    const record = this.inMemoryHealth.get(sourceId);
    if (!record) return;
    record.cacheTimestamp = new Date().toISOString();
  }

  /** Check freshness against source-specific policy */
  checkFreshness(sourceId: string): { isStale: boolean; ageSeconds: number; maxAllowedAgeSeconds: number; message: string } {
    const record = this.inMemoryHealth.get(sourceId);
    const meta = HealthMonitor.METADATA_CATALOG[sourceId] || {};
    const maxAge = record?.freshnessPolicySeconds || meta.freshnessPolicySeconds || 1800;
    const refTime = record?.dataTimestamp || record?.lastSuccessAt;

    if (!refTime) {
      return { isStale: true, ageSeconds: 999999, maxAllowedAgeSeconds: maxAge, message: "No observation record available." };
    }

    const ageSeconds = Math.max(0, Math.floor((Date.now() - new Date(refTime).getTime()) / 1000));
    const isStale = ageSeconds > maxAge;

    return {
      isStale,
      ageSeconds,
      maxAllowedAgeSeconds: maxAge,
      message: isStale
        ? `Feed is stale: age ${Math.round(ageSeconds / 60)}m exceeds threshold of ${Math.round(maxAge / 60)}m.`
        : `Feed is fresh: age ${Math.round(ageSeconds / 60)}m is within ${Math.round(maxAge / 60)}m policy.`,
    };
  }

  /** Get all source health statuses enriched with operational quality metrics */
  getAllHealth(): SourceHealthRecord[] {
    const now = Date.now();
    return Array.from(this.inMemoryHealth.values()).map((record) => {
      const meta = HealthMonitor.METADATA_CATALOG[record.sourceId] || {};
      const freshnessPolicySeconds = record.freshnessPolicySeconds || meta.freshnessPolicySeconds || 1800;
      const refTime = record.dataTimestamp || record.lastSuccessAt;
      const ageSeconds = refTime ? Math.max(0, Math.floor((now - new Date(refTime).getTime()) / 1000)) : null;
      const isStale = ageSeconds !== null ? ageSeconds > freshnessPolicySeconds : false;

      return {
        sourceId: record.sourceId,
        sourceName: record.sourceName,
        datasetType: record.datasetType || meta.datasetType || "Sensor Feed",
        coverage: record.coverage || meta.coverage || "Regional",
        status: record.status,
        lastSuccessAt: record.lastSuccessAt,
        lastFailureAt: record.lastFailureAt,
        consecutiveFailures: record.consecutiveFailures,
        lastLatencyMs: record.lastLatencyMs,
        lastErrorMessage: record.lastErrorMessage,
        cacheTtlSeconds: record.cacheTtlSeconds || meta.cacheTtlSeconds || 900,
        expectedUpdateIntervalSeconds: record.expectedUpdateIntervalSeconds || meta.expectedUpdateIntervalSeconds || 900,
        freshnessPolicySeconds,
        dataCompletenessPercent: record.dataCompletenessPercent || meta.dataCompletenessPercent || 100,
        fallbackStrategy: record.fallbackStrategy || meta.fallbackStrategy || "In-memory caching",
        mode: (record.mode || meta.mode || "LIVE_API") as SourceHealthRecord["mode"],
        stateClassification: (record.stateClassification || meta.stateClassification || "LIVE") as SourceHealthRecord["stateClassification"],
        dataTimestamp: record.dataTimestamp || record.lastSuccessAt,
        cacheTimestamp: record.cacheTimestamp,
        isStale,
        updatedAt: record.updatedAt,
      };
    });
  }

  /** Get health for a specific source */
  getHealth(sourceId: string): SourceHealthRecord | null {
    const record = this.inMemoryHealth.get(sourceId);
    if (!record) return null;
    const meta = HealthMonitor.METADATA_CATALOG[record.sourceId] || {};
    const freshnessPolicySeconds = record.freshnessPolicySeconds || meta.freshnessPolicySeconds || 1800;
    const refTime = record.dataTimestamp || record.lastSuccessAt;
    const ageSeconds = refTime ? Math.max(0, Math.floor((Date.now() - new Date(refTime).getTime()) / 1000)) : null;
    const isStale = ageSeconds !== null ? ageSeconds > freshnessPolicySeconds : false;

    return {
      sourceId: record.sourceId,
      sourceName: record.sourceName,
      datasetType: record.datasetType || meta.datasetType || "Sensor Feed",
      coverage: record.coverage || meta.coverage || "Regional",
      status: record.status,
      lastSuccessAt: record.lastSuccessAt,
      lastFailureAt: record.lastFailureAt,
      consecutiveFailures: record.consecutiveFailures,
      lastLatencyMs: record.lastLatencyMs,
      lastErrorMessage: record.lastErrorMessage,
      cacheTtlSeconds: record.cacheTtlSeconds || meta.cacheTtlSeconds || 900,
      expectedUpdateIntervalSeconds: record.expectedUpdateIntervalSeconds || meta.expectedUpdateIntervalSeconds || 900,
      freshnessPolicySeconds,
      dataCompletenessPercent: record.dataCompletenessPercent || meta.dataCompletenessPercent || 100,
      fallbackStrategy: record.fallbackStrategy || meta.fallbackStrategy || "In-memory caching",
      mode: (record.mode || meta.mode || "LIVE_API") as SourceHealthRecord["mode"],
      stateClassification: (record.stateClassification || meta.stateClassification || "LIVE") as SourceHealthRecord["stateClassification"],
      dataTimestamp: record.dataTimestamp || record.lastSuccessAt,
      cacheTimestamp: record.cacheTimestamp,
      isStale,
      updatedAt: record.updatedAt,
    };
  }

  /** Sync health state into TiDB hazard_source_health table (throttled) */
  private async conditionalDbSync(): Promise<void> {
    const now = Date.now();
    if (now - this.lastDbSync < this.dbSyncThrottleMs) return;
    this.lastDbSync = now;

    try {
      for (const record of this.inMemoryHealth.values()) {
        await query(
          `INSERT INTO hazard_source_health 
           (source_id, source_name, status, last_success_at, last_failure_at, consecutive_failures, last_latency_ms, last_error_message, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
           ON DUPLICATE KEY UPDATE 
             status = VALUES(status),
             last_success_at = VALUES(last_success_at),
             last_failure_at = VALUES(last_failure_at),
             consecutive_failures = VALUES(consecutive_failures),
             last_latency_ms = VALUES(last_latency_ms),
             last_error_message = VALUES(last_error_message),
             updated_at = NOW()`,
          [
            record.sourceId,
            record.sourceName,
            record.status,
            record.lastSuccessAt ? record.lastSuccessAt.slice(0, 19).replace("T", " ") : null,
            record.lastFailureAt ? record.lastFailureAt.slice(0, 19).replace("T", " ") : null,
            record.consecutiveFailures,
            record.lastLatencyMs,
            record.lastErrorMessage,
          ]
        );
      }
    } catch (err) {
      console.warn("[HealthMonitor] Background DB sync non-fatal warning:", (err as Error).message);
    }
  }
}

const globalHealthKey = Symbol.for("sentinel.hazard.health.v3");
const globalObj = globalThis as unknown as { [globalHealthKey]?: HealthMonitor };

export const healthMonitor = globalObj[globalHealthKey] || (globalObj[globalHealthKey] = new HealthMonitor());
