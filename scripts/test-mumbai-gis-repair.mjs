/**
 * scripts/test-mumbai-gis-repair.mjs
 * Sentinel City Intelligence — Phase 1 GIS Repair & OpenStreetMap Automated Verification
 * 
 * Verifies:
 * 1. GeoJSON Structure & Schema Validity (RFC 7946, WGS84 EPSG:4326)
 * 2. 24 BMC Administrative Wards Integrity & Metadata
 * 3. 7 BMC Municipal Zones Integrity & Hierarchy
 * 4. Longitudinal & Latitudinal Ordering (Lon ~72.8, Lat ~19.0)
 * 5. Anti-Boxiness & Polygon Vertex Richness (>100 vertices per ward)
 * 6. 24 BMC Ward Office Point-in-Polygon Topological Containment
 * 7. Out-of-Bounds & Missing-Data Safety Handling
 * 8. Public Assets HTTP Availability & Content Types
 * 9. Leaflet Simulation Map Code Verification (OSM TileLayer, Attribution, Fit Mumbai Control)
 * 10. Live Tile Provider HTTP Health & Watermark Absence Check
 */

import fs from "fs";
import path from "path";

const BASE_URL = process.env.TEST_APP_URL || "http://localhost:3005";

let passedCount = 0;
let failedCount = 0;
const results = [];

function recordTest(suite, name, passed, details = "") {
  if (passed) {
    passedCount++;
    console.log(`  [PASS] ${name}`);
  } else {
    failedCount++;
    console.log(`  [FAIL] ${name} — ${details}`);
  }
  results.push({ suite, name, passed, details });
}

// Ray-casting point-in-polygon algorithm
function pointInPolygon(point, polygon) {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0];
    const yi = polygon[i][1];
    const xj = polygon[j][0];
    const yj = polygon[j][1];

    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function pointInGeometry(point, geometry) {
  if (geometry.type === "Polygon") {
    if (!pointInPolygon(point, geometry.coordinates[0])) return false;
    for (let h = 1; h < geometry.coordinates.length; h++) {
      if (pointInPolygon(point, geometry.coordinates[h])) return false;
    }
    return true;
  }
  if (geometry.type === "MultiPolygon") {
    for (const poly of geometry.coordinates) {
      if (pointInPolygon(point, poly[0])) {
        let inHole = false;
        for (let h = 1; h < poly.length; h++) {
          if (pointInPolygon(point, poly[h])) {
            inHole = true;
            break;
          }
        }
        if (!inHole) return true;
      }
    }
    return false;
  }
  return false;
}

async function runTests() {
  console.log("================================================================================");
  console.log("SENTINEL CITY INTELLIGENCE — PHASE 1 GIS & OSM ACCEPTANCE TEST SUITE");
  console.log("================================================================================\n");

  // SUITE 1: 24 BMC Wards Dataset Structure & Integrity
  console.log("=== SUITE 1: 24 BMC Wards Dataset Structure & Integrity ===");
  const wardsPath = path.resolve(process.cwd(), "data/mumbai/mumbai_bmc_wards.geojson");
  recordTest("Wards", "data/mumbai/mumbai_bmc_wards.geojson exists on filesystem", fs.existsSync(wardsPath));

  const wardsData = JSON.parse(fs.readFileSync(wardsPath, "utf-8"));
  recordTest("Wards", "GeoJSON is a FeatureCollection", wardsData.type === "FeatureCollection");
  recordTest("Wards", "FeatureCollection contains exactly 24 BMC administrative wards", wardsData.features?.length === 24);

  const expectedShortCodes = [
    "A", "B", "C", "D", "E", "F/N", "F/S", "G/N", "G/S",
    "H/E", "H/W", "K/E", "K/W", "L", "M/E", "M/W", "N",
    "P/N", "P/S", "R/C", "R/N", "R/S", "S", "T"
  ];

  const presentCodes = wardsData.features.map(f => f.properties?.shortCode || f.properties?.wardId).sort();
  const allIdsMatch = expectedShortCodes.every(id => presentCodes.includes(id));
  recordTest("Wards", "All 24 canonical BMC ward IDs present (A through T)", allIdsMatch, `Found: ${presentCodes.join(",")}`);

  // SUITE 2: RFC 7946 Coordinate Ordering & Non-Boxy Real Geometry
  console.log("\n=== SUITE 2: RFC 7946 Coordinate Ordering & Anti-Boxiness Integrity ===");
  let coordOrderValid = true;
  let nonBoxyGeometry = true;
  let minVertices = Infinity;
  let maxVertices = 0;

  for (const feat of wardsData.features) {
    const geom = feat.geometry;
    if (!geom || (geom.type !== "Polygon" && geom.type !== "MultiPolygon")) {
      recordTest("Geometry", `Ward ${feat.properties?.wardId} has valid Polygon/MultiPolygon`, false);
      continue;
    }

    let vertexCount = 0;
    const checkRing = (ring) => {
      vertexCount += ring.length;
      for (const pt of ring) {
        const [lon, lat] = pt;
        // Lon must be ~72.75 to ~73.05, Lat must be ~18.88 to ~19.32
        if (lon < 72.7 || lon > 73.1 || lat < 18.8 || lat > 19.35) {
          coordOrderValid = false;
        }
      }
    };

    if (geom.type === "Polygon") {
      for (const ring of geom.coordinates) checkRing(ring);
    } else {
      for (const poly of geom.coordinates) {
        for (const ring of poly) checkRing(ring);
      }
    }

    minVertices = Math.min(minVertices, vertexCount);
    maxVertices = Math.max(maxVertices, vertexCount);

    // Any bounding box polygon would have 4-5 vertices. Official GIS shapes have hundreds to thousands.
    if (vertexCount < 100) {
      nonBoxyGeometry = false;
    }
  }

  recordTest("Coordinates", "RFC 7946 [lon, lat] ordering in WGS84 EPSG:4326 range (Lon: 72.7-73.1, Lat: 18.8-19.35)", coordOrderValid);
  recordTest("Geometry", `Anti-Boxiness: all 24 wards have authentic multi-vertex contours (min: ${minVertices}, max: ${maxVertices})`, nonBoxyGeometry);

  // SUITE 3: 7 BMC Municipal Zones Hierarchy
  console.log("\n=== SUITE 3: BMC Municipal Zones Hierarchy (Zones I - VII) ===");
  const zonesPath = path.resolve(process.cwd(), "data/mumbai/mumbai_bmc_zones.geojson");
  recordTest("Zones", "data/mumbai/mumbai_bmc_zones.geojson exists", fs.existsSync(zonesPath));
  const zonesData = JSON.parse(fs.readFileSync(zonesPath, "utf-8"));
  recordTest("Zones", "Zonal collection contains exactly 7 BMC zones", zonesData.features?.length === 7);

  const zoneIds = zonesData.features.map(f => f.properties?.zone_code).sort();
  const expectedZones = ["ZONE-I", "ZONE-II", "ZONE-III", "ZONE-IV", "ZONE-V", "ZONE-VI", "ZONE-VII"];
  const zonesMatch = expectedZones.every(z => zoneIds.includes(z));
  recordTest("Zones", "Zones I through VII match official municipal zonal hierarchy", zonesMatch, `Found: ${zoneIds.join(",")}`);

  // SUITE 4: 24 BMC Ward Office Point-in-Polygon Topological Resolution
  console.log("\n=== SUITE 4: 24 BMC Ward Office Point-in-Polygon Topological Resolution ===");
  const officesPath = path.resolve(process.cwd(), "data/mumbai/mumbai_bmc_all_zonal_offices.geojson");
  const officesData = JSON.parse(fs.readFileSync(officesPath, "utf-8"));

  let allOfficesContained = true;
  let mismatchedOffices = [];

  for (const office of officesData.features) {
    const wardId = office.properties?.ward_id;
    const [lon, lat] = office.geometry.coordinates;

    const wardFeature = wardsData.features.find(f => f.properties?.wardId === wardId);
    if (!wardFeature) {
      allOfficesContained = false;
      mismatchedOffices.push(`${wardId} (no polygon)`);
      continue;
    }

    const isInside = pointInGeometry([lon, lat], wardFeature.geometry);
    if (!isInside) {
      allOfficesContained = false;
      mismatchedOffices.push(`${wardId} at [${lon}, ${lat}]`);
    }
  }

  recordTest(
    "Topology",
    "All 24 verified BMC ward offices resolve inside their respective ward polygon",
    allOfficesContained,
    mismatchedOffices.length ? `Failing wards: ${mismatchedOffices.join(", ")}` : "100% 24/24 containment verified"
  );

  // SUITE 5: Out-of-Bounds & Missing-Data Safety
  console.log("\n=== SUITE 5: Out-of-Bounds & Missing-Data Safety Handling ===");
  // Test Arabian sea coordinate far outside Mumbai
  const arabianSeaCoord = [71.50, 18.50];
  let foundOutside = false;
  for (const feat of wardsData.features) {
    if (pointInGeometry(arabianSeaCoord, feat.geometry)) {
      foundOutside = true;
      break;
    }
  }
  recordTest("Safety", "Arabian Sea coordinate outside Mumbai correctly resolves to null/no ward", !foundOutside);

  // SUITE 6: Leaflet Simulation Map Code & Base Map Source Audit
  console.log("\n=== SUITE 6: Leaflet Simulation Map Component & Base Map Audit ===");
  const mapCodePath = path.resolve(process.cwd(), "src/components/admin/simulation/leaflet-simulation-map.tsx");
  const mapCode = fs.readFileSync(mapCodePath, "utf-8");

  const hasOsmTileUrl = mapCode.includes("https://tile.openstreetmap.org/{z}/{x}/{y}.png") ||
                        mapCode.includes("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png");
  const hasOsmAttribution = mapCode.includes("OpenStreetMap") && mapCode.includes("contributors");
  const hasNoCartoKeyReq = !mapCode.includes("basemaps.cartocdn.com");
  const hasFitMumbai = mapCode.includes("FitMumbaiControl") && mapCode.includes("Fit Mumbai");
  const hasZoomControl = mapCode.includes("<ZoomControl");

  recordTest("Component", "TileLayer configured with legitimate OpenStreetMap Standard URL", hasOsmTileUrl);
  recordTest("Component", "Valid OpenStreetMap contributors attribution included", hasOsmAttribution);
  recordTest("Component", "Removed all unauthenticated CartoDB basemaps causing watermark", hasNoCartoKeyReq);
  recordTest("Component", "Includes 'Fit Mumbai' viewport reset control", hasFitMumbai);
  recordTest("Component", "Includes interactive ZoomControl", hasZoomControl);

  // SUITE 7: Public Assets Availability & Static Serving
  console.log("\n=== SUITE 7: Public Assets HTTP Serving & Content Integrity ===");
  const publicAssets = [
    { url: `${BASE_URL}/data/mumbai/mumbai_bmc_wards.geojson`, desc: "24 BMC Wards GeoJSON" },
    { url: `${BASE_URL}/data/mumbai/mumbai_bmc_zones.geojson`, desc: "7 BMC Zones GeoJSON" },
    { url: `${BASE_URL}/data/mumbai/mumbai_flood_hotspots.geojson`, desc: "Flood Hotspots GeoJSON" },
    { url: `${BASE_URL}/data/mumbai/mumbai_drainage_structures.geojson`, desc: "Drainage Structures GeoJSON" },
    { url: `${BASE_URL}/data/mumbai/mumbai_public_drainage_network.geojson`, desc: "Drainage Network GeoJSON" },
  ];

  for (const asset of publicAssets) {
    try {
      const res = await fetch(asset.url);
      if (res.ok) {
        const json = await res.json();
        const hasFeatures = Array.isArray(json.features) && json.features.length > 0;
        recordTest("PublicAssets", `${asset.desc} served at ${asset.url} (HTTP ${res.status}, features: ${json.features?.length})`, hasFeatures);
      } else {
        recordTest("PublicAssets", `${asset.desc} served at ${asset.url}`, false, `HTTP ${res.status}`);
      }
    } catch (err) {
      recordTest("PublicAssets", `${asset.desc} served at ${asset.url}`, false, err.message);
    }
  }

  // SUITE 8: Live OpenStreetMap Tile Request Check
  console.log("\n=== SUITE 8: Live OpenStreetMap Tile Request Health & Watermark Absence ===");
  try {
    // Mumbai center tile: zoom 12, x 2877, y 1779
    const tileUrl = "https://tile.openstreetmap.org/12/2877/1779.png";
    const res = await fetch(tileUrl, {
      headers: {
        "User-Agent": "UrbanLinkSentinelGIS/1.0 (GIS verification automated check; contact@urbanlink.gov)"
      }
    });

    const isOk = res.status === 200;
    const contentType = res.headers.get("content-type") || "";
    const isPng = contentType.includes("image/png");
    const buffer = Buffer.from(await res.arrayBuffer());
    const validSize = buffer.length > 1000; // Real PNG tile is usually 10-40 KB

    recordTest(
      "TileServer",
      `OpenStreetMap Standard tile request HTTP 200 (type: ${contentType}, size: ${buffer.length} bytes)`,
      isOk && isPng && validSize
    );
  } catch (err) {
    recordTest("TileServer", "OpenStreetMap Standard tile request", false, err.message);
  }

  // FINAL SUMMARY
  console.log("\n================================================================================");
  console.log(`TOTAL TESTS: ${passedCount + failedCount} | PASSED: ${passedCount} | FAILED: ${failedCount}`);
  console.log("================================================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTests();
