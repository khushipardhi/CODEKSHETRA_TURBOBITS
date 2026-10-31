/* ════════════════════════════════════════════════════════
   Geo Engine — Point-in-Polygon Jurisdiction
   Ray-casting algorithm for NMC zone boundary check.
   Determines which administrative zone a coordinate falls in.
   ════════════════════════════════════════════════════════ */

import type { GeoZone } from "./types";

/**
 * Ray-casting algorithm for point-in-polygon test.
 * Counts how many times a ray from the point crosses polygon edges.
 * Odd crossings = inside, even = outside.
 *
 * @param lat - Test point latitude
 * @param lng - Test point longitude
 * @param polygon - Array of [longitude, latitude] pairs forming the polygon ring
 */
export function isPointInPolygon(
  lat: number,
  lng: number,
  polygon: [number, number][]
): boolean {
  let inside = false;
  const n = polygon.length;

  for (let i = 0, j = n - 1; i < n; j = i++) {
    // GeoJSON coordinates are [lng, lat]
    const xi = polygon[i][1]; // lat
    const yi = polygon[i][0]; // lng
    const xj = polygon[j][1]; // lat
    const yj = polygon[j][0]; // lng

    const intersect =
      yi > lng !== yj > lng &&
      lat < ((xj - xi) * (lng - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Find which NMC zone a coordinate falls inside.
 * Tests against all zone polygons.
 *
 * @returns The matched zone, or null if outside all zones
 */
export function findZone(
  lat: number,
  lng: number,
  zones: GeoZone[]
): GeoZone | null {
  for (const zone of zones) {
    if (isPointInPolygon(lat, lng, zone.polygon)) {
      return zone;
    }
  }
  return null;
}
