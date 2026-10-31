/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Phase 3 Verification Suite
   Comprehensive Automated Tests for Spatial Intelligence,
   Continuous Hazard Surfaces, Historical Playback & Simulation Engine.
   ════════════════════════════════════════════════════════ */

import fs from "fs";
import path from "path";

let passed = 0;
let failed = 0;
const results = [];

function assert(condition, testName, details = "") {
  if (condition) {
    passed++;
    results.push({ status: "PASS", name: testName, details });
    console.log(`  ✓ [PASS] ${testName}${details ? " — " + details : ""}`);
  } else {
    failed++;
    results.push({ status: "FAIL", name: testName, details });
    console.error(`  ✗ [FAIL] ${testName}${details ? " — " + details : ""}`);
  }
}

console.log("═══════════════════════════════════════════════════════════════");
console.log("   SENTINEL PHASE 3: SPATIAL INTELLIGENCE & SIMULATION TESTS   ");
console.log("═══════════════════════════════════════════════════════════════\n");

async function runTests() {
  // ─── 1. GIS & BOUNDARY FIDELITY AUDIT ───────────────────────
  console.log("▶ SUITE 1: GIS Datasets, CRS & Absence of Boxy Placeholders");
  
  const wardsPath = path.resolve("data", "mumbai", "mumbai_bmc_wards.geojson");
  assert(fs.existsSync(wardsPath), "Canonical 24 BMC wards GeoJSON exists on disk", wardsPath);

  const rawWards = JSON.parse(fs.readFileSync(wardsPath, "utf-8"));
  assert(rawWards.type === "FeatureCollection", "Wards dataset is valid GeoJSON FeatureCollection");
  assert(rawWards.features.length === 24, "Contains exactly 24 BMC administrative wards", `Found: ${rawWards.features.length}`);

  const requiredWardIds = [
    "A", "B", "C", "D", "E", "F/South", "F/North", "G/South", "G/North",
    "H/East", "H/West", "K/East", "K/West", "P/South", "P/North", "L",
    "M/East", "M/West", "N", "S", "T", "R/South", "R/Central", "R/North"
  ];

  const foundWardIds = rawWards.features.map(f => f.properties.wardId || f.properties.ward_id);
  const missingWards = requiredWardIds.filter(id => !foundWardIds.includes(id));
  assert(missingWards.length === 0, "All 24 canonical BMC ward IDs are present", missingWards.length === 0 ? "Complete" : `Missing: ${missingWards.join(", ")}`);

  // Verify non-rectangular geometry (no 4-corner bounding boxes)
  let boxyCount = 0;
  for (const f of rawWards.features) {
    const coords = f.geometry.type === "Polygon" ? f.geometry.coordinates[0] : f.geometry.coordinates[0][0];
    if (coords.length <= 5) {
      boxyCount++;
    }
  }
  assert(boxyCount === 0, "No BMC wards are boxy 4/5-point placeholder rectangles", `Detected ${boxyCount} bounding boxes`);

  // Verify CRS and coordinate bounds (WGS84 EPSG:4326 inside Mumbai)
  let allCoordsValid = true;
  for (const f of rawWards.features) {
    const coords = f.geometry.type === "Polygon" ? f.geometry.coordinates[0] : f.geometry.coordinates[0][0];
    for (const [lng, lat] of coords) {
      if (lng < 72.7 || lng > 73.1 || lat < 18.8 || lat > 19.4) {
        allCoordsValid = false;
        break;
      }
    }
  }
  assert(allCoordsValid, "All BMC ward boundary coordinates fall strictly within Mumbai bounds (WGS84)");

  // ─── 2. SPATIAL REFERENCE LAYERS VERIFICATION ───────────────
  console.log("\n▶ SUITE 2: Verified Physical Reference Layers");

  const drainagePath = path.resolve("data", "mumbai", "flood_spatial", "mumbai_public_drainage_network.geojson");
  assert(fs.existsSync(drainagePath), "Mithi River & drainage network GeoJSON exists");
  const drainage = JSON.parse(fs.readFileSync(drainagePath, "utf-8"));
  assert(drainage.features.length >= 20, "Drainage network contains substantial water corridors", `${drainage.features.length} features`);

  const hotspotsPath = path.resolve("data", "mumbai", "flood_spatial", "mumbai_flood_hotspots.geojson");
  assert(fs.existsSync(hotspotsPath), "Chronic flood hotspots GeoJSON exists");
  const hotspots = JSON.parse(fs.readFileSync(hotspotsPath, "utf-8"));
  assert(hotspots.features.length >= 30, "Flood hotspots contain verified historical chronic sites", `${hotspots.features.length} points`);

  const pumpsPath = path.resolve("data", "mumbai", "flood_spatial", "mumbai_drainage_structures.geojson");
  assert(fs.existsSync(pumpsPath), "Stormwater pumping structures GeoJSON exists");
  const pumps = JSON.parse(fs.readFileSync(pumpsPath, "utf-8"));
  assert(pumps.features.length >= 25, "Drainage structures include operational BMC outfall pump stations", `${pumps.features.length} stations`);

  // ─── 3. SCENARIO REGISTRY & TIER INTEGRITY ──────────────────
  console.log("\n▶ SUITE 3: Scenario Registry & Model Readiness Tiers via API");

  const metaRes = await fetch("http://localhost:3000/api/hazards/simulation");
  assert(metaRes.ok, "GET /api/hazards/simulation returns HTTP 200 OK");
  const metaData = await metaRes.json();

  assert(metaData.scenarios && metaData.scenarios.length === 7, "Scenario catalogue exposes all 7 multi-hazard scenarios", `Found: ${metaData.scenarios?.length}`);

  const scenarioIds = metaData.scenarios.map(s => s.id);
  const expectedScenarios = [
    "rainfall_waterlogging",
    "rainfall_accumulation",
    "coastal_monsoon_surge",
    "drainage_stress_blockage",
    "extreme_heat_stress",
    "cyclonic_wind_squall",
    "air_quality_stagnation"
  ];
  const missingExpected = expectedScenarios.filter(id => !scenarioIds.includes(id));
  assert(missingExpected.length === 0, "All 7 multi-hazard scenario definitions present", missingExpected.join(", ") || "Complete");

  // Verify Tier 1 / Tier 2 classification and honesty
  let validTiers = true;
  let falseDepthClaims = false;
  for (const sc of metaData.scenarios) {
    if (!["TIER_1_OBSERVED_FORECAST", "TIER_2_SCREENING_SIMULATION"].includes(sc.tier)) {
      validTiers = false;
    }
    const mentionsScreening = sc.limitations.some(l => 
      l.toLowerCase().includes("screening") || 
      l.toLowerCase().includes("hydrodynamic") ||
      l.toLowerCase().includes("uncalibrated") ||
      l.toLowerCase().includes("simplified")
    );
    if (!mentionsScreening) falseDepthClaims = true;
  }
  assert(validTiers, "All active scenarios strictly designated Tier 1 or Tier 2");
  assert(!falseDepthClaims, "All scenarios explicitly declare non-hydrodynamic screening limitations");

  // Verify historical events
  assert(metaData.historicalEvents && metaData.historicalEvents.length >= 2, "Historical events catalogue contains verified landmark downpours", `${metaData.historicalEvents?.length} events`);
  const july2005 = metaData.historicalEvents?.find(e => e.id === "historical_july2005");
  assert(july2005 && july2005.peakRainfall24h === 944, "26 July 2005 event documented with 944 mm peak rainfall");

  // ─── 4. NUMERICAL ENGINE & TIME-STEP SIMULATION ─────────────
  console.log("\n▶ SUITE 4: Deterministic Simulation Calculations via POST API");

  // Determinism test: 2 runs with identical parameters
  const run1Res = await fetch("http://localhost:3000/api/hazards/simulation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      scenarioId: "rainfall_waterlogging",
      timeStepHours: 2,
      parameters: { rainfallRateMmH: 60, drainageBlockagePct: 25, highTideMeters: 4.2 },
      baselineMode: "current_live"
    }),
  });
  const run1Json = await run1Res.json();
  const run1 = run1Json.data;

  const run2Res = await fetch("http://localhost:3000/api/hazards/simulation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      scenarioId: "rainfall_waterlogging",
      timeStepHours: 2,
      parameters: { rainfallRateMmH: 60, drainageBlockagePct: 25, highTideMeters: 4.2 },
      baselineMode: "current_live"
    }),
  });
  const run2Json = await run2Res.json();
  const run2 = run2Json.data;

  assert(
    run1.rankedWards[0].wardId === run2.rankedWards[0].wardId &&
    run1.rankedWards[0].metricValue === run2.rankedWards[0].metricValue,
    "Simulation engine is strictly deterministic for identical inputs",
    `Top ward: ${run1.rankedWards[0].wardName} (Score ${run1.rankedWards[0].metricValue})`
  );

  // Time-step monotonicity test: cumulative rainfall must grow with duration
  const earlyRes = await fetch("http://localhost:3000/api/hazards/simulation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      scenarioId: "rainfall_accumulation",
      timeStepHours: 1,
      parameters: { rainfallRateMmH: 50 },
      baselineMode: "current_live"
    }),
  });
  const earlyJson = await earlyRes.json();
  const runEarly = earlyJson.data;

  const lateRes = await fetch("http://localhost:3000/api/hazards/simulation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      scenarioId: "rainfall_accumulation",
      timeStepHours: 4,
      parameters: { rainfallRateMmH: 50 },
      baselineMode: "current_live"
    }),
  });
  const lateJson = await lateRes.json();
  const runLate = lateJson.data;

  assert(
    runLate.rankedWards[0].metricValue > runEarly.rankedWards[0].metricValue,
    "Rainfall accumulation increases monotonically over simulated time-steps",
    `1h: ${runEarly.rankedWards[0].metricValue} mm vs 4h: ${runLate.rankedWards[0].metricValue} mm`
  );

  // High-Tide Sluice Gate Lockout test (tide >= 4.5m)
  const lowTideRes = await fetch("http://localhost:3000/api/hazards/simulation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      scenarioId: "coastal_monsoon_surge",
      timeStepHours: 2,
      parameters: { rainfallRateMmH: 70, highTideMeters: 3.2, stormSurgeMeters: 0.2 },
      baselineMode: "current_live"
    }),
  });
  const lowTideJson = await lowTideRes.json();
  const lowTideRun = lowTideJson.data;

  const highTideRes = await fetch("http://localhost:3000/api/hazards/simulation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      scenarioId: "coastal_monsoon_surge",
      timeStepHours: 2,
      parameters: { rainfallRateMmH: 70, highTideMeters: 4.6, stormSurgeMeters: 0.3 },
      baselineMode: "current_live"
    }),
  });
  const highTideJson = await highTideRes.json();
  const highTideRun = highTideJson.data;

  // Coastal wards (A, G/South, F/South) must experience severe surge/lockout penalty
  const coastalWardLow = lowTideRun?.rankedWards?.find(w => w.wardId === "A")?.metricValue ?? 0;
  const coastalWardHigh = highTideRun?.rankedWards?.find(w => w.wardId === "A")?.metricValue ?? 0;

  assert(
    coastalWardHigh > coastalWardLow * 1.5,
    "4.5m High Tide triggers sluice gate lockout and coastal gravity drainage penalty in Ward A",
    `Low tide score: ${coastalWardLow} -> High tide lockout score: ${coastalWardHigh}`
  );

  // Continuous hazard surface isobands generation test
  assert(
    run1.continuousSurface && 
    run1.continuousSurface.isobandsGeoJSON &&
    run1.continuousSurface.isobandsGeoJSON.features.length > 0,
    "Continuous hazard surface generates valid polygon isobands",
    `${run1.continuousSurface.isobandsGeoJSON.features.length} isoband polygons generated`
  );

  // ─── 5. LIVE HTTP ENDPOINT INTEGRATION ──────────────────────
  console.log("\n▶ SUITE 5: Live API Routes & Web Endpoints");

  try {
    const wardRes = await fetch("http://localhost:3000/api/hazards/simulation?wardId=L");
    assert(wardRes.ok, "GET /api/hazards/simulation?wardId=L returns HTTP 200 OK");
    const wardData = await wardRes.json();
    assert(wardData.ward && wardData.ward.name.includes("Kurla"), "Ward L resolves to Kurla / Sakinaka");

    const postDrainageRes = await fetch("http://localhost:3000/api/hazards/simulation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scenarioId: "drainage_stress_blockage",
        timeStepHours: 3,
        parameters: { rainfallRateMmH: 50, drainageBlockagePct: 40 },
      }),
    });
    assert(postDrainageRes.ok, "POST /api/hazards/simulation for drainage blockage returns HTTP 200 OK");
    const postDrainageData = await postDrainageRes.json();
    assert(postDrainageData.success && postDrainageData.data.rankedWards.length === 24, "Drainage simulation evaluates all 24 wards");

    // Test Admin Page routes
    const pageRes = await fetch("http://localhost:3000/admin/simulation");
    assert(pageRes.ok, "GET /admin/simulation returns HTTP 200 OK");

    const cityPageRes = await fetch("http://localhost:3000/admin/mumbai/simulation");
    assert(cityPageRes.ok, "GET /admin/mumbai/simulation returns HTTP 200 OK");

  } catch (err) {
    assert(false, "Live HTTP integration calls succeeded without network error", err.message);
  }

  // ─── SUMMARY ────────────────────────────────────────────────
  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log(`PHASE 3 TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log("═══════════════════════════════════════════════════════════════");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error("Fatal test execution error:", err);
  process.exit(1);
});
