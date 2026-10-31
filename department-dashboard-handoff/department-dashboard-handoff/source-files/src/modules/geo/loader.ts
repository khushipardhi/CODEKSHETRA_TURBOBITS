/* ════════════════════════════════════════════════════════
   Geo Engine — GeoJSON Loader
   Reads all .geojson files from data/geodata/
   Parses once → caches in memory
   Auto-detects Point vs Polygon geometry
   ════════════════════════════════════════════════════════ */

import fs from "fs";
import path from "path";

/** Raw GeoJSON FeatureCollection */
export interface RawGeoJSON {
  type: "FeatureCollection";
  name?: string;
  metadata?: Record<string, unknown>;
  features: RawFeature[];
}

export interface RawFeature {
  type: "Feature";
  id?: string;
  geometry: {
    type: "Point" | "Polygon" | "MultiPolygon";
    coordinates: unknown;
  };
  properties: Record<string, unknown>;
}

/** Loaded dataset with filename + parsed JSON */
export interface LoadedDataset {
  filename: string;
  /** Filename without extension, used as dataset key */
  key: string;
  data: RawGeoJSON;
  geometryType: "Point" | "Polygon" | "Mixed";
  featureCount: number;
}

// ─── In-memory cache ─────────────────────────────────
let cache: Map<string, LoadedDataset> | null = null;
let cacheLoadedAt: number | null = null;

/** Resolve the geodata directory path */
function getGeodataDir(): string {
  return path.resolve(process.cwd(), "data", "geodata");
}

/**
 * Load all GeoJSON files from data/geodata/.
 * Parses once and caches in memory.
 * Returns a Map keyed by dataset name (filename without extension).
 */
export function loadAllDatasets(): Map<string, LoadedDataset> {
  if (cache) return cache;

  const dir = getGeodataDir();
  const datasets = new Map<string, LoadedDataset>();

  if (!fs.existsSync(dir)) {
    console.warn(`[GeoLoader] Directory not found: ${dir}`);
    cache = datasets;
    return datasets;
  }

  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".geojson"));
  console.log(`[GeoLoader] Found ${files.length} GeoJSON files in ${dir}`);

  for (const filename of files) {
    try {
      const filePath = path.join(dir, filename);
      const raw = fs.readFileSync(filePath, "utf-8");
      const data = JSON.parse(raw) as RawGeoJSON;

      if (data.type !== "FeatureCollection" || !Array.isArray(data.features)) {
        console.warn(`[GeoLoader] Skipping ${filename}: not a valid FeatureCollection`);
        continue;
      }

      // Detect geometry type
      const types = new Set(data.features.map((f) => f.geometry?.type).filter(Boolean));
      let geometryType: "Point" | "Polygon" | "Mixed" = "Point";
      if (types.has("Polygon") || types.has("MultiPolygon")) {
        geometryType = types.has("Point") ? "Mixed" : "Polygon";
      }

      const key = filename.replace(/\.geojson$/, "");

      datasets.set(key, {
        filename,
        key,
        data,
        geometryType,
        featureCount: data.features.length,
      });

      console.log(
        `[GeoLoader]   ✓ ${key}: ${data.features.length} features (${geometryType})`
      );
    } catch (err) {
      console.error(
        `[GeoLoader] Failed to load ${filename}:`,
        err instanceof Error ? err.message : err
      );
    }
  }

  cache = datasets;
  cacheLoadedAt = Date.now();
  console.log(`[GeoLoader] Loaded ${datasets.size} datasets into memory cache`);

  return datasets;
}

/** Get a specific dataset by key (filename without extension) */
export function getDataset(key: string): LoadedDataset | undefined {
  return loadAllDatasets().get(key);
}

/** Get all dataset keys */
export function getDatasetKeys(): string[] {
  return [...loadAllDatasets().keys()];
}

/** Get cache stats */
export function getCacheStats(): {
  loaded: boolean;
  datasetCount: number;
  totalFeatures: number;
  loadedAt: number | null;
} {
  const datasets = cache || new Map();
  let totalFeatures = 0;
  for (const ds of datasets.values()) {
    totalFeatures += ds.featureCount;
  }
  return {
    loaded: cache !== null,
    datasetCount: datasets.size,
    totalFeatures,
    loadedAt: cacheLoadedAt,
  };
}

/** Force reload (for development/testing) */
export function reloadCache(): Map<string, LoadedDataset> {
  cache = null;
  cacheLoadedAt = null;
  return loadAllDatasets();
}
