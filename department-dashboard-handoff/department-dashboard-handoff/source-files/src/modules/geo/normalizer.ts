/* ════════════════════════════════════════════════════════
   Geo Engine — Normalizer
   Maps varying GeoJSON property schemas into uniform
   GeoFacility and GeoZone types.
   ════════════════════════════════════════════════════════ */

import type { RawFeature, LoadedDataset } from "./loader";
import type { GeoFacility, GeoZone } from "./types";

/**
 * Normalize a Point dataset into GeoFacility[].
 * All 9 point datasets share the same property schema:
 *   id, name, department, department_id, facility_type, zone,
 *   division, address, locality, pincode, contact_number,
 *   emergency_number, jurisdiction_area, handling_categories
 *
 * But we still read defensively — if a field is missing, we use fallbacks.
 */
export function normalizeFacilities(dataset: LoadedDataset): GeoFacility[] {
  const facilities: GeoFacility[] = [];

  for (const feature of dataset.data.features) {
    if (feature.geometry?.type !== "Point") continue;

    const coords = feature.geometry.coordinates as [number, number];
    if (!coords || coords.length < 2) continue;

    const p = feature.properties || {};

    const facility: GeoFacility = {
      id: str(p.id) || str(feature.id) || `${dataset.key}-${facilities.length}`,
      name: str(p.name) || "Unknown Facility",
      departmentType: mapDepartmentCode(p.department_id as number, str(p.department)),
      departmentName: str(p.department) || dataset.key,
      facilityType: str(p.facility_type) || "Unknown",
      // GeoJSON uses [longitude, latitude]
      longitude: coords[0],
      latitude: coords[1],
      address: str(p.address),
      zone: str(p.zone) || str(p.circle_division) || str(p.jurisdiction),
      division: str(p.division) || str(p.circle_division),
      locality: str(p.locality),
      pincode: str(p.pincode),
      contactNumber: str(p.contact_number) || str(p.phone) || str(p.emergency_helpline),
      emergencyNumber: str(p.emergency_number) || str(p.emergency_helpline) || str(p.phone),
      jurisdictionArea: str(p.jurisdiction_area) || str(p.jurisdiction),
      handlingCategories: strArr(p.handling_categories),
      sourceFile: dataset.filename,
      metadata: extractMetadata(p),
    };

    facilities.push(facility);
  }

  return facilities;
}

/**
 * Normalize the zonal boundaries dataset into GeoZone[].
 * Only the `nagpur_nmc_zonal_boundaries` dataset uses Polygon geometry.
 */
export function normalizeZones(dataset: LoadedDataset): GeoZone[] {
  const zones: GeoZone[] = [];

  for (const feature of dataset.data.features) {
    if (feature.geometry?.type !== "Polygon") continue;

    // Polygon coordinates: [ring[]] where ring = [[lng, lat], ...]
    const rings = feature.geometry.coordinates as [number, number][][];
    if (!rings || rings.length === 0) continue;

    // Use the outer ring (first ring)
    const polygon = rings[0];
    if (!polygon || polygon.length < 3) continue;

    const p = feature.properties || {};

    const zone: GeoZone = {
      id: str(p.id) || str(feature.id) || `zone-${zones.length}`,
      zoneNumber: num(p.zone_number) || zones.length + 1,
      zoneName: str(p.zone_name) || `Zone ${zones.length + 1}`,
      zoneMarathi: str(p.zone_marathi),
      sectorOrientation: str(p.sector_orientation),
      areaSqKm: num(p.area_sq_km_approx) || 0,
      polygon,
      officeId: str(p.zonal_office_id),
      officeAddress: str(p.zonal_office_address),
      officeCoordinates: p.zonal_office_coordinates
        ? (p.zonal_office_coordinates as [number, number])
        : undefined,
      officeContact: str(p.zonal_office_contact),
      keyLocalities: strArr(p.key_localities),
    };

    zones.push(zone);
  }

  return zones;
}

// ─── Helpers ─────────────────────────────────────────

function str(v: unknown): string | undefined {
  if (v === null || v === undefined) return undefined;
  const s = String(v).trim();
  return s.length > 0 ? s : undefined;
}

function num(v: unknown): number | undefined {
  if (v === null || v === undefined) return undefined;
  const n = Number(v);
  return isNaN(n) ? undefined : n;
}

function strArr(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String);
  return [];
}

/** Extract metadata — everything not in the standard mapped fields */
const STANDARD_KEYS = new Set([
  "id", "name", "department", "department_id", "facility_type", "zone",
  "division", "address", "locality", "pincode", "contact_number",
  "emergency_number", "jurisdiction_area", "handling_categories",
  "zone_number", "zone_name", "zone_marathi", "sector_orientation",
  "area_sq_km_approx", "zonal_office_id", "zonal_office_address",
  "zonal_office_coordinates", "zonal_office_contact", "key_localities",
]);

function extractMetadata(props: Record<string, unknown>): Record<string, unknown> {
  const meta: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(props)) {
    if (!STANDARD_KEYS.has(key)) {
      meta[key] = val;
    }
  }
  return meta;
}

/**
 * Map GeoJSON department_id → AI department code.
 * This bridges the GeoJSON file numbering to the codes used in department-routing.ts.
 */
function mapDepartmentCode(deptId: number | undefined, deptName: string | undefined): string {
  // By department_id (from GeoJSON metadata)
  if (deptId !== undefined) {
    const byId: Record<number, string> = {
      1: "police",
      2: "traffic_management",
      3: "road_maintenance",
      4: "water_supply",
      5: "waste_management",
      6: "electricity",
      7: "environment",
      9: "fire_brigade",
    };
    if (byId[deptId]) return byId[deptId];
  }

  // Fallback: match by name substring
  const lower = (deptName || "").toLowerCase();
  if (lower.includes("police")) return "police";
  if (lower.includes("fire")) return "fire_brigade";
  if (lower.includes("transport")) return "traffic_management";
  if (lower.includes("pwd") || lower.includes("public works")) return "road_maintenance";
  if (lower.includes("water")) return "water_supply";
  if (lower.includes("waste") || lower.includes("solid")) return "waste_management";
  if (lower.includes("electri")) return "electricity";
  if (lower.includes("garden") || lower.includes("environment")) return "environment";
  if (lower.includes("zonal")) return "municipal_corp";

  return "municipal_corp";
}
