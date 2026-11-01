/* ════════════════════════════════════════════════════════
   GeoNexus — Mumbai Hazard Dataset Loader
   Type-safe, cached access to integrated GeoNexus Mumbai
   Data Package assets (GeoJSON + CSV).

   All datasets sourced from GeoNexus_Mumbai_Data_Package
   via Gemini Spark research pipeline. BMC / IMD / INCOIS /
   CPCB / OSM / Copernicus provenance.
   ════════════════════════════════════════════════════════ */

import { readFile } from "fs/promises";
import path from "path";
import type { FeatureCollection, Feature, Point, LineString, Polygon, MultiPolygon } from "geojson";

// ─── Dataset Registry ────────────────────────────────────

export type MumbaiDatasetId =
  | "aws-stations"
  | "pumping-stations"
  | "drainage-nullahs"
  | "flood-hotspots"
  | "aqi-stations"
  | "hospitals"
  | "underpasses"
  | "coastal-outfalls"
  | "electrical-substations"
  | "flood-inundation-zones"
  | "river-channels"
  | "waterbodies"
  | "arterial-roads";

export type MumbaiCsvDatasetId =
  | "tidal-series"
  | "historical-rainfall"
  | "tidal-benchmarks"
  | "flood-vulnerability-index"
  | "cyclone-tracks"
  | "boundary-layer-height"
  | "ward-population"
  | "nwp-forecast"
  | "pumping-stations-csv"
  | "aws-stations-csv";

export interface DatasetMetadata {
  id: string;
  name: string;
  description: string;
  source: string;
  crs: string;
  targetScenarios: string[];
  featureCount?: number;
  recordCount?: number;
}

export const GEOJSON_DATASET_REGISTRY: Record<MumbaiDatasetId, DatasetMetadata> = {
  "aws-stations": {
    id: "aws-stations",
    name: "BMC Automatic Weather Stations",
    description: "60 BMC AWS rainfall observation stations across Mumbai",
    source: "BMC Disaster Management Cell",
    crs: "EPSG:4326",
    targetScenarios: ["monsoon_waterlogging", "precipitation_accumulation", "drainage_siltation"],
  },
  "pumping-stations": {
    id: "pumping-stations",
    name: "BRIMSTOWAD Stormwater Pumping Stations",
    description: "8 major stormwater pumping stations under BRIMSTOWAD scheme",
    source: "BMC Storm Water Drainage Dept",
    crs: "EPSG:4326",
    targetScenarios: ["monsoon_waterlogging", "drainage_siltation", "coastal_surge"],
  },
  "drainage-nullahs": {
    id: "drainage-nullahs",
    name: "Major Drainage Nullahs",
    description: "18 primary drainage corridors and nullahs across Mumbai",
    source: "BMC SWD Department",
    crs: "EPSG:4326",
    targetScenarios: ["drainage_siltation", "monsoon_waterlogging"],
  },
  "flood-hotspots": {
    id: "flood-hotspots",
    name: "Chronic Waterlogging Hotspots",
    description: "BMC-identified chronic flood and waterlogging locations",
    source: "BMC Disaster Management Cell",
    crs: "EPSG:4326",
    targetScenarios: ["monsoon_waterlogging", "precipitation_accumulation", "drainage_siltation"],
  },
  "aqi-stations": {
    id: "aqi-stations",
    name: "CPCB CAAQM Air Quality Stations",
    description: "22 continuous ambient air quality monitoring stations",
    source: "CPCB / MPCB",
    crs: "EPSG:4326",
    targetScenarios: ["air_stagnation"],
  },
  "hospitals": {
    id: "hospitals",
    name: "Critical Hospitals & Emergency Facilities",
    description: "35 major hospitals and emergency medical facilities",
    source: "BMC Health Department",
    crs: "EPSG:4326",
    targetScenarios: ["all"],
  },
  "underpasses": {
    id: "underpasses",
    name: "Transport Subways & Underpasses",
    description: "Railway and road underpasses prone to waterlogging",
    source: "BMC Roads Department / Indian Railways",
    crs: "EPSG:4326",
    targetScenarios: ["monsoon_waterlogging", "drainage_siltation"],
  },
  "coastal-outfalls": {
    id: "coastal-outfalls",
    name: "Coastal Stormwater Outfalls",
    description: "Stormwater outfall locations along Mumbai coastline",
    source: "BMC SWD Department",
    crs: "EPSG:4326",
    targetScenarios: ["coastal_surge", "drainage_siltation"],
  },
  "electrical-substations": {
    id: "electrical-substations",
    name: "Electrical Receiving Substations",
    description: "Major power substations and receiving stations",
    source: "BEST / Adani / Tata Power",
    crs: "EPSG:4326",
    targetScenarios: ["all"],
  },
  "flood-inundation-zones": {
    id: "flood-inundation-zones",
    name: "Historical Flood Inundation Zones",
    description: "Mapped flood extent zones from historical events (2005, 2017, 2020, 2024)",
    source: "BMC / MCGM Disaster Cell",
    crs: "EPSG:4326",
    targetScenarios: ["monsoon_waterlogging", "precipitation_accumulation"],
  },
  "river-channels": {
    id: "river-channels",
    name: "Primary River Channels",
    description: "Mithi, Dahisar, Poisar, Oshiwara and other river channels",
    source: "OSM / BMC",
    crs: "EPSG:4326",
    targetScenarios: ["monsoon_waterlogging", "drainage_siltation"],
  },
  "waterbodies": {
    id: "waterbodies",
    name: "Lakes, Creeks & Waterbodies",
    description: "Vihar, Powai, Tulsi lakes and tidal creeks",
    source: "OSM / BMC",
    crs: "EPSG:4326",
    targetScenarios: ["monsoon_waterlogging", "coastal_surge"],
  },
  "arterial-roads": {
    id: "arterial-roads",
    name: "Arterial Road Network",
    description: "Major arterial roads including Western Express Highway, Eastern Express Highway, LBS Marg, SV Road",
    source: "OSM / MMRDA",
    crs: "EPSG:4326",
    targetScenarios: ["all"],
  },
};

export const CSV_DATASET_REGISTRY: Record<MumbaiCsvDatasetId, DatasetMetadata> = {
  "tidal-series": {
    id: "tidal-series",
    name: "Monsoon Spring Tide Series",
    description: "15-minute interval tidal height observations during monsoon spring tide windows",
    source: "INCOIS / Survey of India",
    crs: "N/A",
    targetScenarios: ["coastal_surge"],
  },
  "historical-rainfall": {
    id: "historical-rainfall",
    name: "Historical Extreme Rainfall Events",
    description: "Major rainfall events with date, duration, accumulated precipitation, and return period",
    source: "IMD Colaba / Santacruz",
    crs: "N/A",
    targetScenarios: ["monsoon_waterlogging", "precipitation_accumulation"],
  },
  "tidal-benchmarks": {
    id: "tidal-benchmarks",
    name: "Apollo Bunder Tidal Benchmarks",
    description: "INCOIS permanent tidal benchmarks including HAT, MHWS, MSL, LAT",
    source: "INCOIS",
    crs: "N/A",
    targetScenarios: ["coastal_surge"],
  },
  "flood-vulnerability-index": {
    id: "flood-vulnerability-index",
    name: "Ward Flood Vulnerability Index",
    description: "Composite vulnerability scores per BMC ward including exposure, sensitivity, and adaptive capacity",
    source: "MCGM / Academic Research",
    crs: "N/A",
    targetScenarios: ["monsoon_waterlogging", "precipitation_accumulation", "drainage_siltation"],
  },
  "cyclone-tracks": {
    id: "cyclone-tracks",
    name: "Arabian Sea Cyclone Tracks",
    description: "Historical cyclone tracks affecting Mumbai with wind speeds and landfall proximity",
    source: "IMD / JTWC",
    crs: "N/A",
    targetScenarios: ["coastal_surge", "wind_gust"],
  },
  "boundary-layer-height": {
    id: "boundary-layer-height",
    name: "ERA5 Boundary Layer Height Series",
    description: "ECMWF ERA5 planetary boundary layer height time-series for Mumbai",
    source: "ECMWF Copernicus CDS",
    crs: "N/A",
    targetScenarios: ["air_stagnation"],
  },
  "ward-population": {
    id: "ward-population",
    name: "Ward Population Density",
    description: "Census 2011 population projections to 2025 with day/night population estimates",
    source: "Census of India / BMC",
    crs: "N/A",
    targetScenarios: ["all"],
  },
  "nwp-forecast": {
    id: "nwp-forecast",
    name: "NWP Forecast Profile",
    description: "Open-Meteo numerical weather prediction hourly profile for Mumbai",
    source: "Open-Meteo (ECMWF/GFS/ICON)",
    crs: "N/A",
    targetScenarios: ["monsoon_waterlogging", "wind_gust", "heat_island"],
  },
  "pumping-stations-csv": {
    id: "pumping-stations-csv",
    name: "Pumping Stations (Tabular)",
    description: "BRIMSTOWAD pumping station specifications with capacity and coordinates",
    source: "BMC SWD Department",
    crs: "N/A",
    targetScenarios: ["monsoon_waterlogging", "drainage_siltation"],
  },
  "aws-stations-csv": {
    id: "aws-stations-csv",
    name: "AWS Stations (Tabular)",
    description: "BMC AWS network station metadata with coordinates and zone assignments",
    source: "BMC Disaster Management Cell",
    crs: "N/A",
    targetScenarios: ["monsoon_waterlogging", "precipitation_accumulation"],
  },
};

// ─── File Resolution ─────────────────────────────────────

const DATA_BASE_DIR = path.join(process.cwd(), "data", "mumbai", "hazard-datasets");

function resolveGeoJsonPath(id: MumbaiDatasetId): string {
  return path.join(DATA_BASE_DIR, `${id}.geojson`);
}

function resolveCsvPath(id: MumbaiCsvDatasetId): string {
  // Handle the -csv suffix datasets mapping to differently named files
  const fileMap: Record<string, string> = {
    "pumping-stations-csv": "pumping-stations.csv",
    "aws-stations-csv": "aws-stations.csv",
  };
  const filename = fileMap[id] || `${id}.csv`;
  return path.join(DATA_BASE_DIR, filename);
}

// ─── Cache Layer ─────────────────────────────────────────

const geojsonCache = new Map<string, { data: FeatureCollection; loadedAt: number }>();
const csvCache = new Map<string, { data: CsvRecord[]; loadedAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function isCacheValid(loadedAt: number): boolean {
  return Date.now() - loadedAt < CACHE_TTL_MS;
}

// ─── GeoJSON Loader ──────────────────────────────────────

export async function loadGeoJsonDataset(id: MumbaiDatasetId): Promise<FeatureCollection> {
  const cached = geojsonCache.get(id);
  if (cached && isCacheValid(cached.loadedAt)) {
    return cached.data;
  }

  const filePath = resolveGeoJsonPath(id);
  const raw = await readFile(filePath, "utf-8");
  const parsed = JSON.parse(raw) as FeatureCollection;

  // Basic validation
  if (!parsed.type || parsed.type !== "FeatureCollection") {
    throw new Error(`[MumbaiDatasets] Invalid GeoJSON: ${id} — expected FeatureCollection`);
  }
  if (!Array.isArray(parsed.features)) {
    throw new Error(`[MumbaiDatasets] Invalid GeoJSON: ${id} — missing features array`);
  }

  geojsonCache.set(id, { data: parsed, loadedAt: Date.now() });
  return parsed;
}

export async function loadGeoJsonWithMetadata(id: MumbaiDatasetId): Promise<{
  data: FeatureCollection;
  metadata: DatasetMetadata;
  featureCount: number;
}> {
  const data = await loadGeoJsonDataset(id);
  const metadata = { ...GEOJSON_DATASET_REGISTRY[id], featureCount: data.features.length };
  return { data, metadata, featureCount: data.features.length };
}

// ─── CSV Loader ──────────────────────────────────────────

export type CsvRecord = Record<string, string>;

export async function loadCsvDataset(id: MumbaiCsvDatasetId): Promise<CsvRecord[]> {
  const cached = csvCache.get(id);
  if (cached && isCacheValid(cached.loadedAt)) {
    return cached.data;
  }

  const filePath = resolveCsvPath(id);
  const raw = await readFile(filePath, "utf-8");
  const lines = raw.trim().split("\n");

  if (lines.length < 2) {
    throw new Error(`[MumbaiDatasets] CSV ${id} has no data rows`);
  }

  const headers = parseCsvLine(lines[0]);
  const records: CsvRecord[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const record: CsvRecord = {};
    for (let j = 0; j < headers.length; j++) {
      record[headers[j].trim()] = (values[j] || "").trim();
    }
    records.push(record);
  }

  csvCache.set(id, { data: records, loadedAt: Date.now() });
  return records;
}

export async function loadCsvWithMetadata(id: MumbaiCsvDatasetId): Promise<{
  data: CsvRecord[];
  metadata: DatasetMetadata;
  recordCount: number;
  columns: string[];
}> {
  const data = await loadCsvDataset(id);
  const columns = data.length > 0 ? Object.keys(data[0]) : [];
  const metadata = { ...CSV_DATASET_REGISTRY[id], recordCount: data.length };
  return { data, metadata, recordCount: data.length, columns };
}

// ─── CSV Line Parser (handles quoted fields) ─────────────

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

// ─── Bulk Loaders ────────────────────────────────────────

export async function loadAllGeoJsonDatasets(): Promise<
  Record<MumbaiDatasetId, { data: FeatureCollection; metadata: DatasetMetadata }>
> {
  const ids = Object.keys(GEOJSON_DATASET_REGISTRY) as MumbaiDatasetId[];
  const entries = await Promise.all(
    ids.map(async (id) => {
      try {
        const result = await loadGeoJsonWithMetadata(id);
        return [id, { data: result.data, metadata: result.metadata }] as const;
      } catch (err) {
        console.warn(`[MumbaiDatasets] Failed to load ${id}:`, err);
        return null;
      }
    })
  );

  const result = {} as Record<MumbaiDatasetId, { data: FeatureCollection; metadata: DatasetMetadata }>;
  for (const entry of entries) {
    if (entry) {
      result[entry[0]] = entry[1];
    }
  }
  return result;
}

export async function getDatasetInventory(): Promise<{
  geojson: Array<DatasetMetadata & { featureCount: number }>;
  csv: Array<DatasetMetadata & { recordCount: number; columns: string[] }>;
}> {
  const geojsonIds = Object.keys(GEOJSON_DATASET_REGISTRY) as MumbaiDatasetId[];
  const csvIds = Object.keys(CSV_DATASET_REGISTRY) as MumbaiCsvDatasetId[];

  const geojson = await Promise.all(
    geojsonIds.map(async (id) => {
      try {
        const result = await loadGeoJsonWithMetadata(id);
        return { ...result.metadata, featureCount: result.featureCount };
      } catch {
        return { ...GEOJSON_DATASET_REGISTRY[id], featureCount: 0 };
      }
    })
  );

  const csv = await Promise.all(
    csvIds.map(async (id) => {
      try {
        const result = await loadCsvWithMetadata(id);
        return { ...result.metadata, recordCount: result.recordCount, columns: result.columns };
      } catch {
        return { ...CSV_DATASET_REGISTRY[id], recordCount: 0, columns: [] };
      }
    })
  );

  return { geojson, csv };
}

// ─── Scenario-specific Data Bundles ──────────────────────

export async function loadMonsoonWaterloggingBundle() {
  const [awsStations, floodHotspots, drainageNullahs, pumpingStations, underpasses, historicalRainfall, floodVulnerability] =
    await Promise.all([
      loadGeoJsonDataset("aws-stations"),
      loadGeoJsonDataset("flood-hotspots"),
      loadGeoJsonDataset("drainage-nullahs"),
      loadGeoJsonDataset("pumping-stations"),
      loadGeoJsonDataset("underpasses"),
      loadCsvDataset("historical-rainfall"),
      loadCsvDataset("flood-vulnerability-index"),
    ]);

  return { awsStations, floodHotspots, drainageNullahs, pumpingStations, underpasses, historicalRainfall, floodVulnerability };
}

export async function loadCoastalSurgeBundle() {
  const [coastalOutfalls, pumpingStations, tidalSeries, tidalBenchmarks, cycloneTracks] =
    await Promise.all([
      loadGeoJsonDataset("coastal-outfalls"),
      loadGeoJsonDataset("pumping-stations"),
      loadCsvDataset("tidal-series"),
      loadCsvDataset("tidal-benchmarks"),
      loadCsvDataset("cyclone-tracks"),
    ]);

  return { coastalOutfalls, pumpingStations, tidalSeries, tidalBenchmarks, cycloneTracks };
}

export async function loadAirQualityBundle() {
  const [aqiStations, boundaryLayerHeight] = await Promise.all([
    loadGeoJsonDataset("aqi-stations"),
    loadCsvDataset("boundary-layer-height"),
  ]);

  return { aqiStations, boundaryLayerHeight };
}

export async function loadInfrastructureBundle() {
  const [hospitals, electricalSubstations, underpasses, arterialRoads] = await Promise.all([
    loadGeoJsonDataset("hospitals"),
    loadGeoJsonDataset("electrical-substations"),
    loadGeoJsonDataset("underpasses"),
    loadGeoJsonDataset("arterial-roads"),
  ]);

  return { hospitals, electricalSubstations, underpasses, arterialRoads };
}

export async function loadHydrologyBundle() {
  const [riverChannels, waterbodies, drainageNullahs, floodInundationZones] = await Promise.all([
    loadGeoJsonDataset("river-channels"),
    loadGeoJsonDataset("waterbodies"),
    loadGeoJsonDataset("drainage-nullahs"),
    loadGeoJsonDataset("flood-inundation-zones"),
  ]);

  return { riverChannels, waterbodies, drainageNullahs, floodInundationZones };
}
