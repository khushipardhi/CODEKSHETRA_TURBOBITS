/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Phase 4 Verification Test Suite
   Advanced Hazard Surfaces, Terrain/Elevation Integration and Ward-Level Impact Analysis
   ════════════════════════════════════════════════════════ */

import fs from "fs";
import path from "path";

const BASE_URL = process.env.TEST_URL || "http://localhost:3000";

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${message}`);
  } else {
    failedTests++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

async function runPhase4Verification() {
  console.log("════════════════════════════════════════════════════════");
  console.log("  SENTINEL PHASE 4 AUTOMATED VERIFICATION SUITE");
  console.log("  Spatial Surfaces, Terrain Integration & Ward Impact");
  console.log(`  Target: ${BASE_URL}`);
  console.log("════════════════════════════════════════════════════════\n");

  // ─── SUITE 1: GEOGRAPHIC DATA SOURCES & CRS INTEGRITY ──────
  console.log("▶ SUITE 1: Spatial Data Sources & Coordinate Reference System Verification");
  try {
    const wardsPath = path.resolve(process.cwd(), "data", "mumbai", "mumbai_bmc_wards.geojson");
    assert(fs.existsSync(wardsPath), "mumbai_bmc_wards.geojson exists");
    const wardsGeo = JSON.parse(fs.readFileSync(wardsPath, "utf-8"));
    assert(wardsGeo.features.length === 24, "All 24 canonical BMC wards present");
    assert(
      wardsGeo.crs?.properties?.name === "urn:ogc:def:crs:OGC:1.3:CRS84" || !wardsGeo.crs,
      "Ward boundaries use standard EPSG:4326 / CRS84 coordinates"
    );

    const terrainPath = path.resolve(process.cwd(), "data", "mumbai", "terrain", "mumbai_ward_terrain_profiles.json");
    assert(fs.existsSync(terrainPath), "mumbai_ward_terrain_profiles.json exists");
    const terrainProfiles = JSON.parse(fs.readFileSync(terrainPath, "utf-8"));
    assert(terrainProfiles.length === 24, "All 24 ward terrain profiles calibrated");
    const wardL = terrainProfiles.find((t) => t.wardId === "L");
    assert(wardL && wardL.isSaucerDepression === true, "Ward L correctly calibrated as low-lying saucer depression");
    assert(wardL.elevationMinM < wardL.elevationMeanM, "Ward L elevationMinM is strictly less than elevationMeanM");
    assert(wardL.topographicWetnessIndex >= 14.0, "Ward L Topographic Wetness Index (TWI) reflects high convergence");

    const sinksPath = path.resolve(process.cwd(), "data", "mumbai", "flood_spatial", "mumbai_low_lying_areas.geojson");
    assert(fs.existsSync(sinksPath), "Copernicus DEM low-lying depression dataset exists");
    const sinksGeo = JSON.parse(fs.readFileSync(sinksPath, "utf-8"));
    assert(sinksGeo.features.length >= 10, "Documented Copernicus DEM saucer depressions present (>= 10 features)");

    const waterwaysPath = path.resolve(process.cwd(), "data", "mumbai", "flood_spatial", "mumbai_public_drainage_network.geojson");
    assert(fs.existsSync(waterwaysPath), "mumbai_public_drainage_network.geojson exists");
    const waterwaysGeo = JSON.parse(fs.readFileSync(waterwaysPath, "utf-8"));
    assert(waterwaysGeo.features.length >= 20, "Major stormwater drainage network lines present");
  } catch (err) {
    assert(false, `Suite 1 error: ${err.message}`);
  }

  // ─── SUITE 2: CONTINUOUS HAZARD SURFACE & LAND-CLIPPED GRID ─
  console.log("\n▶ SUITE 2: Continuous Hazard Surface & Land-Clipped Grid Alignment");
  let simData = null;
  try {
    const res = await fetch(`${BASE_URL}/api/hazards/simulation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scenarioId: "rainfall_waterlogging",
        timeStepHours: 2.0,
        parameters: {
          instantaneousRainfallRateMmH: 65,
          durationHours: 6,
          drainageBlockagePct: 15,
          astronomicalTideM: 4.8,
        },
      }),
    });
    assert(res.ok, "Simulation calculation API responded with HTTP 200");
    const json = await res.json();
    assert(json.success === true, "API returned success: true");
    simData = json.data;

    const surface = simData.continuousSurface;
    assert(!!surface, "Continuous hazard surface object present in simulation result");
    assert(surface.gridStats && surface.gridStats.totalCells >= 450, `Sub-ward continuous grid mesh generated (${surface.gridStats?.totalCells} cells)`);
    assert(surface.gridStats.verticalDatum === "EGM2008 (Mean Sea Level ASL)", "Elevation vertical datum explicitly documented as EGM2008");
    assert(surface.gridStats.crs === "EPSG:4326 (WGS84)", "Horizontal CRS explicitly documented as EPSG:4326");

    const features = surface.isobandsGeoJSON?.features || [];
    assert(features.length >= 450, `Isobands GeoJSON contains high-resolution polygon cells (${features.length} features)`);

    // Verify cell geometry and values
    let validPolys = 0;
    let validValues = 0;
    let depressionCells = 0;
    for (const feat of features) {
      if (feat.geometry?.type === "Polygon" && feat.geometry.coordinates?.[0]?.length === 5) {
        validPolys++;
      }
      const val = feat.properties?.interpolated_value;
      if (typeof val === "number" && !isNaN(val) && val >= 0 && val <= 100) {
        validValues++;
      }
      if (feat.properties?.is_depression) {
        depressionCells++;
      }
    }
    assert(validPolys === features.length, `All ${features.length} cells are closed 5-vertex polygons`);
    assert(validValues === features.length, `All ${features.length} cells have valid, finite numerical readings in range [0, 100]`);
    assert(depressionCells >= 50, `Saucer depression cells correctly flagged and georeferenced (${depressionCells} cells)`);
  } catch (err) {
    assert(false, `Suite 2 error: ${err.message}`);
  }

  // ─── SUITE 3: ELEVATION & TERRAIN INTEGRATION RESPONSIBILITY ──
  console.log("\n▶ SUITE 3: Responsible Terrain & Elevation Integration");
  try {
    const features = simData?.continuousSurface?.isobandsGeoJSON?.features || [];
    const depressionCells = features.filter((f) => f.properties.is_depression);
    const ridgeCells = features.filter((f) => !f.properties.is_depression && f.properties.elevation_m > 20);

    assert(depressionCells.length > 0, "Depression cells exist for comparison");
    assert(ridgeCells.length > 0, "Elevated ridge cells exist for comparison");

    const avgDepVal = depressionCells.reduce((sum, c) => sum + c.properties.interpolated_value, 0) / depressionCells.length;
    const avgRidgeVal = ridgeCells.reduce((sum, c) => sum + c.properties.interpolated_value, 0) / ridgeCells.length;

    assert(
      avgDepVal > avgRidgeVal,
      `Topographic pooling verified: Saucer depression mean (${avgDepVal.toFixed(1)}) exceeds elevated ridge mean (${avgRidgeVal.toFixed(1)})`
    );

    // Verify scientific limitation disclosure
    const limitations = simData?.auditTrail?.limitations || [];
    const hasDemDisclaimer = limitations.some((l) => l.toLowerCase().includes("30m") || l.toLowerCase().includes("copernicus"));
    assert(hasDemDisclaimer, "Audit trail discloses 30m DEM resolution limitation (insufficient for curb/street inundation without micro-catchment)");
  } catch (err) {
    assert(false, `Suite 3 error: ${err.message}`);
  }

  // ─── SUITE 4: UPGRADED WARD-LEVEL IMPACT ANALYSIS ─────────
  console.log("\n▶ SUITE 4: Upgraded Ward-Level Impact Analysis");
  try {
    const rankedWards = simData?.rankedWards || [];
    assert(rankedWards.length === 24, "All 24 canonical BMC wards evaluated and ranked");

    const topWard = rankedWards[0];
    assert(topWard.metricValue >= rankedWards[23].metricValue, "Wards sorted in descending severity order");

    // Check Ward L (Kurla) detailed metrics
    const wardL = rankedWards.find((w) => w.wardId === "L");
    assert(!!wardL, "Ward L (Kurla) present in evaluation results");
    assert(wardL.isThresholdExceeded === true, "Ward L threshold exceeded during heavy rainfall event");
    assert(wardL.terrainSummary !== undefined, "Ward L contains structured terrainSummary profile");
    assert(wardL.terrainSummary.demVerticalDatum === "EGM2008 (Mean Sea Level ASL)", "Ward terrain profile confirms EGM2008 vertical datum");
    assert(wardL.terrainSummary.demResolutionM === 30, "Ward terrain profile specifies 30m resolution mesh");

    // Check disaggregated variables
    const vars = wardL.disaggregatedVariables;
    assert(!!vars, "Ward L contains disaggregated model variables");
    assert(vars.physicalInputs?.precipitationRateMmH !== undefined, "Physical input precipitationRateMmH isolated");
    assert(vars.physicalInputs?.netRunoffExcessMmH !== undefined, "Net runoff excess over drainage capacity isolated");
    assert(vars.spatialCharacteristics?.elevationMeanM !== undefined, "Spatial terrain elevation isolated");
    assert(vars.historicalEvidence?.chronicHotspotCount > 0, "Historical incident hotspot count isolated");
    assert(vars.hypotheticalParameters?.simulatedDurationHours === 6, "Hypothetical scenario parameters isolated");
  } catch (err) {
    assert(false, `Suite 4 error: ${err.message}`);
  }

  // ─── SUITE 5: ASSET & POPULATION EXPOSURE CAREFUL CALCULATION
  console.log("\n▶ SUITE 5: Careful Asset and Bounded Population Exposure Calculation");
  try {
    const rankedWards = simData?.rankedWards || [];
    const wardL = rankedWards.find((w) => w.wardId === "L");
    const exposure = wardL.exposureBreakdown;

    assert(!!exposure, "Ward L contains granular 4-part exposureBreakdown");
    assert(exposure.totalWardPopulation === 900000, "Total ward population reflects BMC Census 2011 baseline (900,000)");
    assert(exposure.insideScreeningZoneEst === 900000, "Inside screening zone covers ward administrative advisory catchment");
    assert(
      exposure.intersectsDepressionZoneEst > 50000 && exposure.intersectsDepressionZoneEst < 400000,
      `Depression population (~${exposure.intersectsDepressionZoneEst.toLocaleString()}) is defensibly bounded by mapped saucer depression area`
    );
    assert(
      exposure.confirmedAffected === 0,
      "Confirmed affected is strictly 0 (remote hydrological screening does not confirm physical casualties or building ingress)"
    );
    assert(
      exposure.allocationMethodology.includes("Areal interpolation"),
      "Allocation methodology is explicitly documented in the record"
    );

    // Verify hospital spatial relationships
    const hospitals = wardL.potentiallyExposedHospitals || [];
    assert(hospitals.length > 0, `Ward L mapped emergency hospitals present (${hospitals.length} facilities)`);
    for (const h of hospitals) {
      assert(
        h.relationship === "LOCATED_IN_WARD" || h.relationship === "INTERSECTS_DEPRESSION_ZONE" || h.relationship === "PROXIMITY_SCREENING",
        `Hospital ${h.name} has valid spatial relationship: ${h.relationship}`
      );
      assert(h.elevationEstimateM !== undefined, `Hospital ${h.name} has DEM elevation estimate (~${h.elevationEstimateM}m ASL)`);
    }

    // Verify road spatial relationships
    const roads = wardL.potentiallyExposedRoads || [];
    assert(roads.length > 0, `Ward L arterial roads present (${roads.length} corridors)`);
    const hasDepressionRoad = roads.some((r) => r.intersectsDepression === true);
    assert(hasDepressionRoad, "Arterial roads traversing saucer depressions correctly tagged with intersectsDepression");
  } catch (err) {
    assert(false, `Suite 5 error: ${err.message}`);
  }

  // ─── SUITE 6: PHYSICAL HYDROLOGY & UNIT CONVERSIONS ────────
  console.log("\n▶ SUITE 6: Physical Hydrology & Unit Conversions");
  try {
    const hydro = simData?.temporalHydrology;
    assert(!!hydro, "Temporal hydrology state object present in output");
    assert(hydro.instantaneousRainfallRateMmH === 65, "Instantaneous rainfall rate reflects parameter (65 mm/h)");
    assert(hydro.accumulatedRainfallMm === 130, "Accumulated rainfall exactly equals integral: 65 mm/h * 2h = 130 mm");
    assert(typeof hydro.astronomicalTideM === "number", `Astronomical tide curve evaluated (${hydro.astronomicalTideM}m CD)`);
    assert(hydro.isSluiceLocked === true, "Tidal floodgate lockout triggered at tide >= 4.5m CD");
  } catch (err) {
    assert(false, `Suite 6 error: ${err.message}`);
  }

  // ─── SUITE 7: DETERMINISM & PARAMETER SENSITIVITY ──────────
  console.log("\n▶ SUITE 7: Determinism & Parameter Sensitivity");
  try {
    // 1. Determinism test
    const resA = await fetch(`${BASE_URL}/api/hazards/simulation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scenarioId: "rainfall_waterlogging",
        timeStepHours: 1.5,
        parameters: { instantaneousRainfallRateMmH: 50, durationHours: 6 },
      }),
    });
    const resB = await fetch(`${BASE_URL}/api/hazards/simulation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scenarioId: "rainfall_waterlogging",
        timeStepHours: 1.5,
        parameters: { instantaneousRainfallRateMmH: 50, durationHours: 6 },
      }),
    });
    const dataA = await resA.json();
    const dataB = await resB.json();

    assert(
      dataA.data.summary.peakCityValue === dataB.data.summary.peakCityValue,
      `Deterministic repeatability: Peak values identical (${dataA.data.summary.peakCityValue})`
    );
    assert(
      dataA.data.summary.meanCityValue === dataB.data.summary.meanCityValue,
      `Deterministic repeatability: Mean values identical (${dataA.data.summary.meanCityValue})`
    );

    // 2. Sensitivity test (higher rainfall -> higher severity)
    const resHeavy = await fetch(`${BASE_URL}/api/hazards/simulation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scenarioId: "rainfall_waterlogging",
        timeStepHours: 1.5,
        parameters: { instantaneousRainfallRateMmH: 110, durationHours: 6 },
      }),
    });
    const dataHeavy = await resHeavy.json();

    assert(
      dataHeavy.data.summary.meanCityValue > dataA.data.summary.meanCityValue,
      `Monotonic response: 110 mm/h rainfall produces higher city mean (${dataHeavy.data.summary.meanCityValue}) than 50 mm/h (${dataA.data.summary.meanCityValue})`
    );
    assert(
      dataHeavy.data.summary.peakCityValue >= dataA.data.summary.peakCityValue,
      `Peak severity scales with precipitation forcing (${dataHeavy.data.summary.peakCityValue} >= ${dataA.data.summary.peakCityValue})`
    );
  } catch (err) {
    assert(false, `Suite 7 error: ${err.message}`);
  }

  // ─── FINAL SUMMARY ─────────────────────────────────────────
  console.log("\n════════════════════════════════════════════════════════");
  console.log(`  TEST RESULTS: ${passedTests} PASSED, ${failedTests} FAILED (TOTAL: ${totalTests})`);
  console.log("════════════════════════════════════════════════════════\n");

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runPhase4Verification();
