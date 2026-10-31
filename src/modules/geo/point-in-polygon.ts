/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Point-in-Polygon & Spatial Boundary Resolver
   Pure TypeScript ray-casting algorithm for client and server boundary resolution.
   Zero external C++ / native dependencies.
   ════════════════════════════════════════════════════════ */

import type { Feature, FeatureCollection, Geometry } from "geojson";

/**
 * Standard ray-casting test for point in polygon ring.
 * Point: [lon, lat]
 * Ring: array of [lon, lat]
 */
export function pointInPolygonRing(point: [number, number], ring: [number, number][]): boolean {
  const [lon, lat] = point;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    const intersect = ((yi > lat) !== (yj > lat)) && (lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Checks if a point [lon, lat] is contained inside a GeoJSON Geometry (Polygon or MultiPolygon).
 */
export function pointInGeometry(point: [number, number], geometry: Geometry | null | undefined): boolean {
  if (!geometry) return false;
  if (geometry.type === "Polygon") {
    const coords = (geometry as any).coordinates;
    if (Array.isArray(coords) && coords.length > 0) {
      return pointInPolygonRing(point, coords[0]);
    }
  }
  if (geometry.type === "MultiPolygon") {
    const coords = (geometry as any).coordinates;
    if (Array.isArray(coords)) {
      for (const poly of coords) {
        if (Array.isArray(poly) && poly.length > 0) {
          if (pointInPolygonRing(point, poly[0])) return true;
        }
      }
    }
  }
  return false;
}

export interface ResolvedBoundary {
  id: string;
  name: string;
  code: string;
  parentZone?: string;
  populationEst?: number;
  areaSqKm?: number;
  properties: Record<string, any>;
  feature: Feature;
}

/**
 * Resolves coordinates [lat, lon] to an administrative boundary in a FeatureCollection.
 * Returns null if coordinates fall outside all boundaries.
 */
export function resolveBoundary(
  lat: number,
  lon: number,
  fc: FeatureCollection | null | undefined
): ResolvedBoundary | null {
  if (!fc || !Array.isArray(fc.features)) return null;

  for (const feature of fc.features) {
    if (!feature.geometry) continue;
    // Note: GeoJSON uses [longitude, latitude]
    if (pointInGeometry([lon, lat], feature.geometry)) {
      const p = feature.properties || {};
      const id = String(p.ward_id || p.wardId || p.zone_id || p.id || p.zone_number || "");
      const name = String(p.name || p.wardName || p.zone_name || `Boundary ${id}`);
      const code = String(p.shortCode || p.zone_code || p.zoneCode || id);
      const parentZone = p.zone_name || p.zoneName || p.sector_orientation || undefined;
      const populationEst = p.population_est || p.population || undefined;
      const areaSqKm = p.area_sq_km || p.area_sq_km_approx || undefined;

      return {
        id,
        name,
        code,
        parentZone,
        populationEst: typeof populationEst === "number" ? populationEst : undefined,
        areaSqKm: typeof areaSqKm === "number" ? areaSqKm : undefined,
        properties: p,
        feature,
      };
    }
  }

  return null;
}
