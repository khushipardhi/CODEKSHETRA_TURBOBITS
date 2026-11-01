/* ════════════════════════════════════════════════════════
   GeoNexus — Dataset API Route
   GET /api/geo/datasets          → inventory of all datasets
   GET /api/geo/datasets?id=X     → specific GeoJSON dataset
   GET /api/geo/datasets?csv=X    → specific CSV dataset
   GET /api/geo/datasets?bundle=X → scenario data bundle
   ════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import {
  loadGeoJsonWithMetadata,
  loadCsvWithMetadata,
  getDatasetInventory,
  loadMonsoonWaterloggingBundle,
  loadCoastalSurgeBundle,
  loadAirQualityBundle,
  loadInfrastructureBundle,
  loadHydrologyBundle,
  GEOJSON_DATASET_REGISTRY,
  CSV_DATASET_REGISTRY,
  type MumbaiDatasetId,
  type MumbaiCsvDatasetId,
} from "@/modules/data/mumbai-datasets";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const geojsonId = searchParams.get("id");
    const csvId = searchParams.get("csv");
    const bundle = searchParams.get("bundle");

    // Return specific GeoJSON dataset
    if (geojsonId) {
      if (!(geojsonId in GEOJSON_DATASET_REGISTRY)) {
        return NextResponse.json(
          { error: `Unknown GeoJSON dataset: ${geojsonId}`, available: Object.keys(GEOJSON_DATASET_REGISTRY) },
          { status: 404 }
        );
      }
      const result = await loadGeoJsonWithMetadata(geojsonId as MumbaiDatasetId);
      return NextResponse.json(result, {
        headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=600" },
      });
    }

    // Return specific CSV dataset
    if (csvId) {
      if (!(csvId in CSV_DATASET_REGISTRY)) {
        return NextResponse.json(
          { error: `Unknown CSV dataset: ${csvId}`, available: Object.keys(CSV_DATASET_REGISTRY) },
          { status: 404 }
        );
      }
      const result = await loadCsvWithMetadata(csvId as MumbaiCsvDatasetId);
      return NextResponse.json(result, {
        headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=600" },
      });
    }

    // Return scenario-specific data bundle
    if (bundle) {
      let bundleData;
      switch (bundle) {
        case "monsoon":
        case "monsoon-waterlogging":
          bundleData = await loadMonsoonWaterloggingBundle();
          break;
        case "coastal":
        case "coastal-surge":
          bundleData = await loadCoastalSurgeBundle();
          break;
        case "air-quality":
          bundleData = await loadAirQualityBundle();
          break;
        case "infrastructure":
          bundleData = await loadInfrastructureBundle();
          break;
        case "hydrology":
          bundleData = await loadHydrologyBundle();
          break;
        default:
          return NextResponse.json(
            { error: `Unknown bundle: ${bundle}`, available: ["monsoon", "coastal", "air-quality", "infrastructure", "hydrology"] },
            { status: 404 }
          );
      }
      return NextResponse.json({ bundle, data: bundleData }, {
        headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=600" },
      });
    }

    // Default: return inventory
    const inventory = await getDatasetInventory();
    return NextResponse.json({
      totalDatasets: inventory.geojson.length + inventory.csv.length,
      geojson: inventory.geojson,
      csv: inventory.csv,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[API /geo/datasets]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
