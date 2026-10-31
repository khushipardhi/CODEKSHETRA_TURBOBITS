/* ════════════════════════════════════════════════════════
   Geo Engine — Haversine Distance Calculator
   Proper lat/lng distance using the Haversine formula.
   Returns distance in km + classified band.
   ════════════════════════════════════════════════════════ */

import { DISTANCE_BANDS, type DistanceBand } from "./types";

const EARTH_RADIUS_KM = 6371;

/** Convert degrees to radians */
function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Calculate the great-circle distance between two points
 * using the Haversine formula.
 * @returns Distance in kilometers
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}

/**
 * Classify a distance into a named band.
 * Bands are configurable in types.ts.
 */
export function classifyDistance(km: number): {
  band: DistanceBand;
  label: string;
} {
  for (const config of DISTANCE_BANDS) {
    if (km <= config.maxKm) {
      return { band: config.band, label: config.label };
    }
  }
  // Fallback — should not happen since last band is Infinity
  return { band: "extended", label: "Extended" };
}

/**
 * Generate a Google Maps directions URL.
 * Opens Google Maps with driving directions from user to facility.
 */
export function buildDirectionsUrl(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): string {
  return `https://www.google.com/maps/dir/${fromLat},${fromLng}/${toLat},${toLng}`;
}
