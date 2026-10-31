/* ═══════════════════════════════════════════════════════════════════════
   Sentinel City Intelligence — Shared Environmental Observation Contract
   Phase 1 Server-Side Data Architecture
   
   Enforces strict provenance, coordinate resolution, temporal metadata,
   honesty indicators (no zero-filled fallback numbers), and typed distinctions
   between observed sensors, numerical model nowcasts, forecasts, and warnings.
   ═══════════════════════════════════════════════════════════════════════ */

export type ObservationDataType =
  | "OBSERVED"          // Direct physical sensor or station AWS/ARG reading
  | "MODEL_NOWCAST"      // High-resolution numerical model analysis (current hour)
  | "FORECAST"           // Projected meteorological prediction (+1h to +7d)
  | "REANALYSIS"         // Historical calibrated reanalysis (ERA5/CERRA)
  | "CAP_WARNING"        // Official emergency warning (NDMA SACHET / IMD CAP)
  | "STATIC_GEOGRAPHY"   // Validated GIS spatial boundary, contour, or DEM sink
  | "SCENARIO";          // Hydrodynamic simulation or what-if scenario

export type DataQualityStatus =
  | "VALIDATED"          // Received fresh, schema-validated, within physical bounds
  | "PROVISIONAL"        // Received fresh, but single-station or provisional feed
  | "STALE"              // Retained from cache beyond freshness TTL; feed unreachable
  | "UNAVAILABLE";       // Remote service failed/timed out; parameter is missing (NOT 0)

export interface Coordinates {
  lat: number;
  lon: number;
}

export interface EnvironmentalObservationParameter {
  key: string;                                   // e.g., "rainfall_rate", "precipitation_probability", "us_aqi", "wave_height"
  label: string;                                 // Human-readable: "Instantaneous Rain Rate", "PM2.5"
  value: number | string | null;                 // Explicitly null when unavailable; never fabricated
  unit: string;                                  // "mm/h", "°C", "%", "km/h", "m", "m³/s", "AQI"
  isUnavailable: boolean;                        // True if feed failed or parameter omitted
  quality: DataQualityStatus;                    // VALIDATED, PROVISIONAL, STALE, UNAVAILABLE
  note?: string;                                 // E.g. "Sensor offline", "Coarse 11km model cell"
}

export interface EnvironmentalObservationSnapshot {
  /** Stable snapshot ULID identifier */
  snapshotId: string;

  /** Target administrative municipality */
  city: "mumbai" | "pune" | "nagpur";

  /** Hyperlocal zone, ward, or locality label if resolved */
  sourceLocation: string;
  zoneOrWard?: string;

  /** Geographic precision: requested user/ward location vs effective grid cell */
  requestedCoordinates: Coordinates;
  effectiveCoordinates: Coordinates;
  spatialResolution: string;                     // e.g. "Station Point", "~11 km ECMWF Grid", "1 km WRF"
  temporalResolution: string;                    // e.g. "15-minute", "Hourly", "24-hour aggregate"

  /** Provenance and source metadata */
  provider: string;                              // e.g. "Open-Meteo", "NDMA SACHET", "IMD AWS"
  endpointOrProduct: string;                     // e.g. "/v1/forecast", "air-quality", "marine"
  modelIdentifier?: string;                      // e.g. "ECMWF IFS 0.25°", "Copernicus GEMS", "Seamless v4"
  dataType: ObservationDataType;
  sourceUrl: string;
  providerAttribution: string;
  license: string;                               // e.g. "CC-BY 4.0", "Open Government Data License India"

  /** Timestamps strictly tracking data life-cycle */
  timestamps: {
    requestedAt: string;                         // ISO UTC timestamp when our server dispatched request
    retrievedAt: string;                         // ISO UTC timestamp when response was parsed
    issuedAt?: string;                           // ISO UTC when provider generated this model run / warning
    validAt: string;                             // ISO UTC for which this observation or forecast is valid
  };

  /** Caching and staleness */
  cacheExpiry: string;                           // ISO UTC when in-memory cache expires
  staleness: {
    isStale: boolean;                            // True if served from stale fallback cache
    ageSeconds: number;                          // Seconds elapsed since observation validAt
  };

  /** Observation parameters payload */
  parameters: Record<string, EnvironmentalObservationParameter>;

  /** Validation errors or feed anomaly diagnostics */
  validationErrors: string[];
}

/**
 * Helper to build an honest unavailable parameter
 */
export function createUnavailableParameter(
  key: string,
  label: string,
  unit: string,
  reason: string = "Provider feed offline or parameter unavailable"
): EnvironmentalObservationParameter {
  return {
    key,
    label,
    value: null,
    unit,
    isUnavailable: true,
    quality: "UNAVAILABLE",
    note: reason,
  };
}

/**
 * Helper to build a validated parameter
 */
export function createValidatedParameter(
  key: string,
  label: string,
  value: number | string | null | undefined,
  unit: string,
  isStale: boolean = false
): EnvironmentalObservationParameter {
  if (value === null || value === undefined) {
    return createUnavailableParameter(key, label, unit, "Parameter omitted by remote source");
  }

  return {
    key,
    label,
    value,
    unit,
    isUnavailable: false,
    quality: isStale ? "STALE" : "VALIDATED",
  };
}
