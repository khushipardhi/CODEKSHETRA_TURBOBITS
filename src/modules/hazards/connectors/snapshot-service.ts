/* ═══════════════════════════════════════════════════════════════════════
   Sentinel City Intelligence — Observation Snapshot Service
   Generates validated, server-side EnvironmentalObservationSnapshot
   adhering to Phase 1 data contracts and persists to TiDB.
   ═══════════════════════════════════════════════════════════════════════ */

import { generateULID } from "@/lib/ids";
import { execute } from "@/lib/db";
import { CITIES } from "@/lib/city-context";
import {
  EnvironmentalObservationSnapshot,
  createValidatedParameter,
  createUnavailableParameter,
} from "../contracts";
import {
  fetchCityWeather,
  fetchCityAirQuality,
  fetchCityMarineSurge,
  fetchCityRiverDischarge,
} from "./open-meteo";

export async function captureEnvironmentalSnapshot(
  citySlug: "mumbai" | "pune" | "nagpur",
  customCoords?: [number, number],
  locationLabel?: string
): Promise<EnvironmentalObservationSnapshot> {
  const city = CITIES[citySlug] || CITIES["nagpur"];
  const reqLat = customCoords ? customCoords[0] : city.center[0];
  const reqLon = customCoords ? customCoords[1] : city.center[1];

  const requestedAt = new Date().toISOString();

  // Fetch in parallel
  const [weather, aqi, marine, river] = await Promise.all([
    fetchCityWeather(citySlug, customCoords),
    fetchCityAirQuality(citySlug, customCoords),
    fetchCityMarineSurge(citySlug, customCoords),
    fetchCityRiverDischarge(citySlug, customCoords),
  ]);

  const retrievedAt = new Date().toISOString();
  const snapshotId = generateULID();

  const parameters: EnvironmentalObservationSnapshot["parameters"] = {
    temperature: createValidatedParameter(
      "temperature",
      "Temperature",
      weather.temperatureCelsius,
      "°C",
      weather.isStale
    ),
    apparent_temperature: createValidatedParameter(
      "apparent_temperature",
      "Apparent Temperature (Feels Like)",
      weather.apparentTemperatureCelsius,
      "°C",
      weather.isStale
    ),
    humidity: createValidatedParameter(
      "humidity",
      "Relative Humidity",
      weather.relativeHumidity,
      "%",
      weather.isStale
    ),
    rainfall_rate: createValidatedParameter(
      "rainfall_rate",
      "Instantaneous Rain Rate",
      weather.rainfallRateMmH,
      "mm/h",
      weather.isStale
    ),
    precipitation_24h_forecast: createValidatedParameter(
      "precipitation_24h_forecast",
      "Next 24 Hours Accumulated Precipitation",
      weather.forecast24hTotalMm,
      "mm",
      weather.isStale
    ),
    wind_speed: createValidatedParameter(
      "wind_speed",
      "Wind Speed (10m)",
      weather.windSpeedKmh,
      "km/h",
      weather.isStale
    ),
    wind_gusts: createValidatedParameter(
      "wind_gusts",
      "Wind Gusts (10m)",
      weather.windGustsKmh,
      "km/h",
      weather.isStale
    ),
    us_aqi: createValidatedParameter(
      "us_aqi",
      "US Air Quality Index",
      aqi.usAqi,
      "AQI",
      aqi.isStale
    ),
    pm25: createValidatedParameter(
      "pm25",
      "PM2.5 Fine Particulate",
      aqi.pm25,
      "µg/m³",
      aqi.isStale
    ),
    pm10: createValidatedParameter(
      "pm10",
      "PM10 Coarse Particulate",
      aqi.pm10,
      "µg/m³",
      aqi.isStale
    ),
  };

  if (marine) {
    parameters["coastal_wave_height"] = createValidatedParameter(
      "coastal_wave_height",
      "Coastal Wave Height",
      marine.waveHeightMeters,
      "m",
      marine.isStale
    );
  }

  if (river) {
    parameters["river_discharge"] = createValidatedParameter(
      "river_discharge",
      "River Discharge Runoff",
      river.riverDischargeM3s,
      "m³/s",
      river.isStale
    );
  }

  const isStale = Boolean(weather.isStale || aqi.isStale);
  const validationErrors: string[] = [];
  if (weather.isUnavailable) validationErrors.push("Weather provider offline or timed out");
  if (aqi.isUnavailable) validationErrors.push("Air quality provider offline or timed out");

  const snapshot: EnvironmentalObservationSnapshot = {
    snapshotId,
    city: citySlug,
    sourceLocation: locationLabel || `${city.name} Central`,
    requestedCoordinates: { lat: reqLat, lon: reqLon },
    effectiveCoordinates: {
      lat: weather.effectiveCoords ? weather.effectiveCoords[0] : reqLat,
      lon: weather.effectiveCoords ? weather.effectiveCoords[1] : reqLon,
    },
    spatialResolution: "~11 km ECMWF Grid Model Resolution",
    temporalResolution: "Hourly with 15-Minute Radar Rain Rate",
    provider: "Open-Meteo Multi-Hazard Pipeline",
    endpointOrProduct: "/v1/forecast & /v1/air-quality",
    modelIdentifier: "ECMWF IFS / CAMS Atmosphere / GloFAS",
    dataType: "MODEL_NOWCAST",
    sourceUrl: "https://open-meteo.com",
    providerAttribution: "Open-Meteo High-Resolution Environmental APIs",
    license: "Attribution 4.0 International (CC BY 4.0)",
    timestamps: {
      requestedAt,
      retrievedAt,
      validAt: weather.observedAt,
    },
    cacheExpiry: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    staleness: {
      isStale,
      ageSeconds: Math.floor((Date.now() - new Date(weather.observedAt).getTime()) / 1000),
    },
    parameters,
    validationErrors,
  };

  // Best-effort asynchronous database archive to TiDB hazard_observations
  try {
    const obsId = snapshotId.slice(0, 26);
    await execute(
      `INSERT INTO hazard_observations (
        id, city, hazard_type, source_id, source_name, observation_type,
        latitude, longitude, observed_at, valid_until, metric_value, metric_unit,
        confidence, raw_payload
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE observed_at = VALUES(observed_at)`,
      [
        obsId,
        citySlug,
        weather.rainfallRateMmH > 5 ? "waterlogging" : "rainfall",
        "open_meteo_pipeline",
        "Open-Meteo Multi-Hazard API",
        "FORECAST",
        reqLat,
        reqLon,
        weather.observedAt.slice(0, 19).replace("T", " "),
        new Date(Date.now() + 3600 * 1000).toISOString().slice(0, 19).replace("T", " "),
        weather.rainfallRateMmH,
        "mm/h",
        isStale ? 0.75 : 0.95,
        JSON.stringify(snapshot),
      ]
    );
  } catch (dbErr) {
    // Non-fatal persistence warning
    console.warn("[SnapshotService] DB observation archive non-fatal note:", (dbErr as Error).message);
  }

  return snapshot;
}
