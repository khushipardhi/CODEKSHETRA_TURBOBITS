/* ════════════════════════════════════════════════════════
   Geo Engine — Type definitions
   Normalized facility + zone + routing result models
   ════════════════════════════════════════════════════════ */

/** A normalized point facility (police station, fire station, PWD office, etc.) */
export interface GeoFacility {
  id: string;
  name: string;
  /** AI department code mapped from GeoJSON department_id */
  departmentType: string;
  /** Raw department name from GeoJSON */
  departmentName: string;
  facilityType: string;
  latitude: number;
  longitude: number;
  address?: string;
  zone?: string;
  division?: string;
  locality?: string;
  pincode?: string;
  contactNumber?: string;
  emergencyNumber?: string;
  jurisdictionArea?: string;
  handlingCategories: string[];
  /** Source GeoJSON filename (without path) */
  sourceFile: string;
  /** Any extra properties not mapped above */
  metadata: Record<string, unknown>;
}

/** An NMC administrative zone polygon */
export interface GeoZone {
  id: string;
  zoneNumber: number;
  zoneName: string;
  zoneMarathi?: string;
  sectorOrientation?: string;
  areaSqKm: number;
  /** Polygon ring: array of [longitude, latitude] pairs */
  polygon: [number, number][];
  officeId?: string;
  officeAddress?: string;
  officeCoordinates?: [number, number];
  officeContact?: string;
  keyLocalities: string[];
}

/** Distance classification bands — configurable */
export type DistanceBand = "very_nearby" | "nearby" | "moderate" | "far" | "extended";

export interface DistanceBandConfig {
  maxKm: number;
  label: string;
  band: DistanceBand;
}

export const DISTANCE_BANDS: DistanceBandConfig[] = [
  { maxKm: 1, label: "Very Nearby", band: "very_nearby" },
  { maxKm: 3, label: "Nearby", band: "nearby" },
  { maxKm: 5, label: "Moderate", band: "moderate" },
  { maxKm: 7, label: "Far", band: "far" },
  { maxKm: Infinity, label: "Extended", band: "extended" },
];

/** A single facility recommendation with distance */
export interface FacilityRecommendation {
  facility: GeoFacility;
  distanceKm: number;
  distanceBand: DistanceBand;
  distanceLabel: string;
  directionsUrl: string;
}

/** Per-department routing result */
export interface DepartmentRouting {
  departmentType: string;
  departmentName: string;
  facilities: FacilityRecommendation[];
}

/** Full geo routing result */
export interface GeoRoutingResult {
  userLocation: {
    latitude: number;
    longitude: number;
  };
  matchedZone: {
    zoneId: string;
    zoneName: string;
    zoneNumber: number;
  } | null;
  requestedServices: string[];
  recommendations: DepartmentRouting[];
  processingTimeMs: number;
}
