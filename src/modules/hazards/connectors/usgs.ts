/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — USGS Earthquake Connector
   Regional seismic activity within 500km radius.
   ════════════════════════════════════════════════════════ */

import { CITIES } from "@/lib/city-context";
import { hazardCache } from "../cache";
import { healthMonitor } from "../health-monitor";

const FETCH_TIMEOUT_MS = 8000;

export interface EarthquakeEvent {
  id: string;
  magnitude: number;
  place: string;
  time: string;
  depthKm: number;
  distanceKm: number;
  latitude: number;
  longitude: number;
}

function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export async function fetchRegionalEarthquakes(citySlug: string): Promise<EarthquakeEvent[]> {
  const cacheKey = `earthquakes:${citySlug}`;
  const cached = hazardCache.get<EarthquakeEvent[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const city = CITIES[citySlug] || CITIES["nagpur"];
  const [lat, lon] = city.center;
  const sourceId = "usgs_earthquakes";
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const url = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&latitude=${lat}&longitude=${lon}&maxradiuskm=500&minmagnitude=2.5&limit=5`;

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "SentinelCityIntelligence/1.0" },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`USGS returned HTTP ${res.status}`);
    }

    const data = await res.json();
    const latency = Date.now() - startTime;
    await healthMonitor.recordSuccess(sourceId, latency);

    const features = data.features || [];
    const events: EarthquakeEvent[] = features.map((f: any) => {
      const coords = f.geometry?.coordinates || [0, 0, 0];
      const eqLon = coords[0];
      const eqLat = coords[1];
      const depth = coords[2] ?? 10;
      const dist = calculateHaversineDistance(lat, lon, eqLat, eqLon);

      return {
        id: f.id || String(Math.random()),
        magnitude: f.properties?.mag ?? 3.0,
        place: f.properties?.place || "Regional Epicenter",
        time: f.properties?.time ? new Date(f.properties.time).toISOString() : new Date().toISOString(),
        depthKm: depth,
        distanceKm: dist,
        latitude: eqLat,
        longitude: eqLon,
      };
    });

    // Cache for 15 minutes (900 seconds)
    hazardCache.set(cacheKey, events, 900);
    return events;
  } catch (err) {
    const latency = Date.now() - startTime;
    await healthMonitor.recordFailure(sourceId, (err as Error).message, latency);
    return [];
  }
}
