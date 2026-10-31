/* ════════════════════════════════════════════════════════
   Geo Engine — Router (main orchestrator)
   AI decides WHAT → Geo Engine decides WHERE.

   Input:  citizen coordinates + required department codes
   Output: nearest facilities per department + zone match

   1. Load & cache all GeoJSON datasets
   2. Resolve zone via point-in-polygon
   3. Map department codes → dataset keys
   4. For each dataset: normalize → calculate distance → sort → top 3
   5. Generate Google Maps directions URLs
   ════════════════════════════════════════════════════════ */

import { loadAllDatasets, getDataset } from "./loader";
import { normalizeFacilities, normalizeZones } from "./normalizer";
import { haversineDistance, classifyDistance, buildDirectionsUrl } from "./distance";
import { findZone } from "./jurisdiction";
import { resolveDatasets, getDeptDisplayName } from "./dept-mapping";
import type {
  GeoFacility,
  GeoZone,
  GeoRoutingResult,
  DepartmentRouting,
  FacilityRecommendation,
} from "./types";

// ─── Normalized data caches ──────────────────────────
let facilityCache: Map<string, GeoFacility[]> | null = null;
let zoneCache: GeoZone[] | null = null;

/** Initialize or return cached normalized data */
function ensureNormalized(): {
  facilities: Map<string, GeoFacility[]>;
  zones: GeoZone[];
} {
  if (facilityCache && zoneCache) {
    return { facilities: facilityCache, zones: zoneCache };
  }

  const datasets = loadAllDatasets();
  facilityCache = new Map();
  zoneCache = [];

  for (const [key, dataset] of datasets) {
    if (dataset.geometryType === "Polygon") {
      // Zone boundaries
      const zones = normalizeZones(dataset);
      zoneCache.push(...zones);
      console.log(`[GeoRouter] Normalized ${zones.length} zones from ${key}`);
    } else {
      // Point facilities
      const facilities = normalizeFacilities(dataset);
      facilityCache.set(key, facilities);
      console.log(`[GeoRouter] Normalized ${facilities.length} facilities from ${key}`);
    }
  }

  console.log(
    `[GeoRouter] Total: ${[...facilityCache.values()].reduce((s, f) => s + f.length, 0)} facilities + ${zoneCache.length} zones`
  );

  return { facilities: facilityCache, zones: zoneCache };
}

/** Maximum number of facilities to return per department */
const MAX_RESULTS_PER_DEPT = 3;

/**
 * Main routing function.
 *
 * @param latitude  - Citizen's latitude
 * @param longitude - Citizen's longitude
 * @param requiredDepartments - Department codes from AI analysis
 * @returns Full geo routing result with nearest facilities + directions
 */
export function routeIncident(params: {
  latitude: number;
  longitude: number;
  requiredDepartments: string[];
}): GeoRoutingResult {
  const startTime = Date.now();
  const { latitude, longitude, requiredDepartments } = params;
  const { facilities, zones } = ensureNormalized();

  // 1. Zone jurisdiction check
  const matchedZone = findZone(latitude, longitude, zones);

  // 2. Resolve which datasets to search
  const datasetKeys = resolveDatasets(requiredDepartments);

  // 3. For each department code, find nearest facilities
  const recommendations: DepartmentRouting[] = [];

  for (const deptCode of requiredDepartments) {
    // Get dataset keys for this specific department
    const deptDatasets = resolveDatasets([deptCode]);

    // Collect all facilities from relevant datasets
    const candidateFacilities: GeoFacility[] = [];
    for (const dsKey of deptDatasets) {
      const dsFacilities = facilities.get(dsKey);
      if (dsFacilities) {
        candidateFacilities.push(...dsFacilities);
      }
    }

    if (candidateFacilities.length === 0) continue;

    // Calculate distances and sort
    const withDistance: FacilityRecommendation[] = candidateFacilities.map((facility) => {
      const distanceKm = haversineDistance(
        latitude,
        longitude,
        facility.latitude,
        facility.longitude
      );
      const { band, label } = classifyDistance(distanceKm);

      return {
        facility,
        distanceKm: Math.round(distanceKm * 100) / 100, // round to 2 decimal places
        distanceBand: band,
        distanceLabel: label,
        directionsUrl: buildDirectionsUrl(
          latitude,
          longitude,
          facility.latitude,
          facility.longitude
        ),
      };
    });

    // Sort by distance ascending
    withDistance.sort((a, b) => a.distanceKm - b.distanceKm);

    // Take top N
    const topFacilities = withDistance.slice(0, MAX_RESULTS_PER_DEPT);

    recommendations.push({
      departmentType: deptCode,
      departmentName: getDeptDisplayName(deptCode),
      facilities: topFacilities,
    });
  }

  return {
    userLocation: { latitude, longitude },
    matchedZone: matchedZone
      ? {
          zoneId: matchedZone.id,
          zoneName: matchedZone.zoneName,
          zoneNumber: matchedZone.zoneNumber,
        }
      : null,
    requestedServices: requiredDepartments,
    recommendations,
    processingTimeMs: Date.now() - startTime,
  };
}

/** Get all loaded zones (for admin map or debugging) */
export function getAllZones(): GeoZone[] {
  const { zones } = ensureNormalized();
  return zones;
}

/** Get all facilities for a specific dataset key */
export function getFacilitiesByDataset(datasetKey: string): GeoFacility[] {
  const { facilities } = ensureNormalized();
  return facilities.get(datasetKey) || [];
}

/** Get all facilities across all datasets */
export function getAllFacilities(): GeoFacility[] {
  const { facilities } = ensureNormalized();
  const all: GeoFacility[] = [];
  for (const facs of facilities.values()) {
    all.push(...facs);
  }
  return all;
}
