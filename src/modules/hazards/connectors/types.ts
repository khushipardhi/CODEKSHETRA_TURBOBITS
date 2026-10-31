/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Connector Interfaces & Types
   ════════════════════════════════════════════════════════ */

export interface NormalizedObservation {
  id?: string;
  city: string;
  hazardType: "rainfall" | "flood" | "waterlogging" | "coastal_surge" | "river_flood" | "air_quality" | "heatwave" | "fire" | "earthquake";
  sourceId: string;
  sourceName: string;
  observationType: "LIVE_SENSOR" | "FORECAST" | "SATELLITE" | "SIMULATION";
  latitude: number | null;
  longitude: number | null;
  observedAt: string; // ISO 8601 UTC
  validUntil: string | null;
  metricValue: number | null;
  metricUnit: string | null;
  confidence: number;
  rawPayload: Record<string, unknown>;
}

export interface CityWeatherTelemetry {
  city: string;
  temperatureCelsius: number | null;
  relativeHumidity: number | null;
  apparentTemperatureCelsius: number | null;
  precipitationMm: number | null;
  rainMm: number | null;
  rainfallRateMmH: number; // estimated current intensity (0 if clear, null if unavailable)
  windSpeedKmh: number | null;
  windGustsKmh: number | null;
  windDirectionDegrees?: number | null;
  weatherCode: number;
  weatherDescription: string;
  forecast24hTotalMm: number;
  maxHourlyRainMm: number;
  precipitationProbabilityMax?: number | null;
  observedAt: string;
  cached: boolean;
  isStale?: boolean;
  isUnavailable?: boolean;
  quality?: "VALIDATED" | "PROVISIONAL" | "STALE" | "UNAVAILABLE";
  requestedCoords?: [number, number];
  effectiveCoords?: [number, number];
  hourlyForecast?: Array<{
    time: string;
    precipitationMm: number;
    rainProbabilityPercent: number;
    temperatureCelsius: number;
    windSpeedKmh: number;
  }>;
  dailyForecast?: Array<{
    date: string;
    tempMaxCelsius: number;
    tempMinCelsius: number;
    rainSumMm: number;
    precipitationProbabilityMax: number;
    weatherCode: number;
  }>;
  providerAttribution?: string;
  license?: string;
}

export interface CityAirQualityTelemetry {
  city: string;
  usAqi: number | null;
  pm25: number | null;
  pm10: number | null;
  carbonMonoxide?: number | null;
  nitrogenDioxide?: number | null;
  sulphurDioxide?: number | null;
  uvIndex?: number | null;
  category: "GOOD" | "MODERATE" | "UNHEALTHY_SENSITIVE" | "UNHEALTHY" | "VERY_UNHEALTHY" | "HAZARDOUS" | "UNAVAILABLE";
  observedAt: string;
  cached: boolean;
  isStale?: boolean;
  isUnavailable?: boolean;
  quality?: "VALIDATED" | "PROVISIONAL" | "STALE" | "UNAVAILABLE";
  providerAttribution?: string;
}

export interface CityMarineTelemetry {
  city: string;
  waveHeightMeters: number | null;
  wavePeriodSeconds: number | null;
  surgeRisk: "LOW" | "MODERATE" | "HIGH" | "SEVERE" | "UNAVAILABLE";
  observedAt: string;
  cached: boolean;
  isStale?: boolean;
  isUnavailable?: boolean;
  quality?: "VALIDATED" | "PROVISIONAL" | "STALE" | "UNAVAILABLE";
  providerAttribution?: string;
}

export interface CityRiverFloodTelemetry {
  city: string;
  riverDischargeM3s: number | null;
  dischargeAnomalous: boolean;
  observedAt: string;
  cached: boolean;
  isStale?: boolean;
  isUnavailable?: boolean;
  quality?: "VALIDATED" | "PROVISIONAL" | "STALE" | "UNAVAILABLE";
  providerAttribution?: string;
}

export interface SachetCapAlert {
  alertId: string;
  identifier: string;
  sender: string;
  sent: string;
  status: string;
  msgType: string;
  scope: string;
  category: string;
  event: string;
  urgency: string;
  severity: "Minor" | "Moderate" | "Severe" | "Extreme" | "Unknown";
  certainty: string;
  headline: string;
  description: string;
  instruction: string;
  areaDesc: string;
  polygon?: Array<[number, number]>;
  circle?: { lat: number; lon: number; radiusKm: number };
  effective: string;
  expires: string;
}
