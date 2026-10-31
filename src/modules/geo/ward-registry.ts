/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Mumbai Ward Registry
   Canonical 24 BMC Administrative Wards Registry & GIS Spatial Index.
   
   Integrates:
   - 24 Official BMC Administrative Wards (A to T)
   - Parent Zonal Alignment (Zone I to Zone VII)
   - Verified Ward Office Coordinates, Addresses & Emergency Helplines
   - Hydrological Basins & Drainage Outfall Mappings
   - Historical Recurring Flood Hotspots
   - Point-in-Polygon Spatial Containment Lookup
   ════════════════════════════════════════════════════════ */

import fs from "fs";
import path from "path";

export interface WardTerrainProfile {
  elevationMeanM: number;
  elevationMinM: number;
  elevationMaxM: number;
  slopeMeanDeg: number;
  topographicWetnessIndex: number;
  isSaucerDepression: boolean;
  saucerDepressionCount: number;
  saucerDepressionAreaSqM: number;
  maxDepressionDepthM: number;
  coastalFrontageKm: number;
  hasMithiCorridor: boolean;
  waterwayLengthM: number;
  imperviousFraction: number;
  nominalDrainCapacityMmH: number;
  terrainClassification: string;
}

export interface BmcWardRecord {
  id: string;
  name: string;
  nameMr: string;
  zoneCode: string;
  zoneName: string;
  officeAddress: string;
  officeCoords: [number, number]; // [lat, lon]
  areaSqKm: number;
  populationEst: number;
  drainageBasin: string;
  isCoastal: boolean;
  elevationMeanM: number;
  keyLocalities: string[];
  floodHotspots: string[];
  pumpingStations: string[];
  geometry: any; // Full GeoJSON Polygon or MultiPolygon
  coordinates: any; // Coordinates structure
  terrain?: WardTerrainProfile;
}

/** Point-in-polygon ray-casting algorithm */
function pointInRing(point: [number, number], ring: [number, number][]): boolean {
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

function pointInGeometry(point: [number, number], geometry: any): boolean {
  if (!geometry) return false;
  if (geometry.type === "Polygon") {
    return pointInRing(point, geometry.coordinates[0]);
  }
  if (geometry.type === "MultiPolygon") {
    for (const poly of geometry.coordinates) {
      if (pointInRing(point, poly[0])) return true;
    }
  }
  return false;
}

class BmcWardRegistry {
  private wardsCache: Map<string, BmcWardRecord> = new Map();
  private geojsonCache: any = null;

  constructor() {
    this.loadRegistry();
  }

  private loadRegistry() {
    try {
      const filePath = path.resolve(process.cwd(), "data", "mumbai", "mumbai_bmc_wards.geojson");
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, "utf-8");
        this.geojsonCache = JSON.parse(raw);

        // Load terrain profile dataset if available
        const terrainMap = new Map<string, WardTerrainProfile>();
        const terrainPath = path.resolve(process.cwd(), "data", "mumbai", "terrain", "mumbai_ward_terrain_profiles.json");
        if (fs.existsSync(terrainPath)) {
          try {
            const rawTerrain = JSON.parse(fs.readFileSync(terrainPath, "utf-8"));
            for (const item of rawTerrain) {
              terrainMap.set(item.wardId, {
                elevationMeanM: item.elevationMeanM,
                elevationMinM: item.elevationMinM,
                elevationMaxM: item.elevationMaxM,
                slopeMeanDeg: item.slopeMeanDeg,
                topographicWetnessIndex: item.topographicWetnessIndex,
                isSaucerDepression: item.isSaucerDepression,
                saucerDepressionCount: item.saucerDepressionCount,
                saucerDepressionAreaSqM: item.saucerDepressionAreaSqM,
                maxDepressionDepthM: item.maxDepressionDepthM,
                coastalFrontageKm: item.coastalFrontageKm,
                hasMithiCorridor: item.hasMithiCorridor,
                waterwayLengthM: item.waterwayLengthM,
                imperviousFraction: item.imperviousFraction,
                nominalDrainCapacityMmH: item.nominalDrainCapacityMmH,
                terrainClassification: item.terrainClassification,
              });
            }
          } catch (tErr) {
            console.warn("[WardRegistry] Warning loading terrain profiles:", tErr);
          }
        }

        for (const feat of this.geojsonCache.features) {
          const p = feat.properties;
          const wardId = p.ward_id || p.wardId;
          const terrain = terrainMap.get(wardId);

          const record: BmcWardRecord = {
            id: wardId,
            name: p.name || p.wardName,
            nameMr: p.name_mr || "",
            zoneCode: p.zone_code || p.zoneCode,
            zoneName: p.zone_name || p.zoneName,
            officeAddress: p.office_address || "",
            officeCoords: p.office_coords || [19.076, 72.877],
            areaSqKm: p.area_sq_km || 0,
            populationEst: p.population_est || p.population || 0,
            drainageBasin: p.drainage_basin || p.drainageBasin || "",
            isCoastal: Boolean(p.is_coastal ?? p.isCoastal),
            elevationMeanM: terrain?.elevationMeanM ?? (p.elevation_mean_m ?? p.elevationMeanM ?? 7.0),
            keyLocalities: p.key_localities || [],
            floodHotspots: p.flood_hotspots || p.floodHotspots || [],
            pumpingStations: p.pumping_stations || p.pumpingStations || [],
            geometry: feat.geometry,
            coordinates: feat.geometry?.coordinates,
            terrain,
          };
          this.wardsCache.set(record.id, record);
        }
      }
    } catch (err) {
      console.error("[WardRegistry] Error loading wards GeoJSON:", err);
    }
  }

  /** Retrieve all 24 canonical BMC wards */
  getAllWards(): BmcWardRecord[] {
    return Array.from(this.wardsCache.values());
  }

  /** Retrieve a specific ward by its official identifier (e.g. 'A', 'F/South', 'K/East') */
  getWardById(id: string): BmcWardRecord | undefined {
    return this.wardsCache.get(id);
  }

  /** Retrieve all wards belonging to a parent zone code (e.g. 'ZONE-I') */
  getWardsByZone(zoneCode: string): BmcWardRecord[] {
    return this.getAllWards().filter((w) => w.zoneCode === zoneCode);
  }

  /** Find the containing ward for a coordinate [lat, lon] */
  findWardForCoordinate(lat: number, lon: number): BmcWardRecord | undefined {
    for (const ward of this.getAllWards()) {
      if (pointInGeometry([lon, lat], ward.geometry)) {
        return ward;
      }
    }
    return undefined;
  }

  /** Return the raw GeoJSON FeatureCollection for map rendering */
  getGeoJSON(): any {
    return this.geojsonCache;
  }
}

export const bmcWardRegistry = new BmcWardRegistry();
