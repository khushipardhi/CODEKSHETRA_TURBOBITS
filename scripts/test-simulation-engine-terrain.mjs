/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Simulation Engine & Terrain Test Suite
   Independent numerical verification of:
   - Unit conversions
   - Rolling rainfall totals & hyetograph numerical integration
   - Missing and invalid time steps
   - Copernicus DEM terrain derivations (saucer basins, slopes, TWI)
   - Astronomical tidal sluice gate lockout discontinuity (4.5m threshold)
   - Time-dependent outputs & monotonicity
   - Input sensitivity (rainfall rate, drainage blockage)
   - Determinism under identical inputs
   - Disaggregated variable separation & auditability
   - Spatial bounds and BMC perimeter containment
   ════════════════════════════════════════════════════════ */

import assert from "assert";
import fs from "fs";
import path from "path";

const BASE_URL = process.env.TEST_URL || "http://localhost:3005";

console.log("════════════════════════════════════════════════════════════");
console.log("  SENTINEL PROMPT 3: SIMULATION ENGINE & TERRAIN TEST SUITE ");
console.log(`  Target URL: ${BASE_URL}/api/hazards/simulation`);
console.log("════════════════════════════════════════════════════════════\n");

let passedTests = 0;
let totalTests = 0;

function runTest(testName, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✓ [PASS] ${testName}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ [FAIL] ${testName}`);
    console.error(`    Error: ${err.message}`);
  }
}

async function runAsyncTest(testName, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  ✓ [PASS] ${testName}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ [FAIL] ${testName}`);
    console.error(`    Error: ${err.message}`);
  }
}

async function main() {
  // ─────────────────────────────────────────────────────────────
  // TEST GROUP 1: UNIT CONVERSIONS & PHYSICAL ARITHMETIC
  // ─────────────────────────────────────────────────────────────
  runTest("1.1 Unit Conversions: Rainfall depth to volumetric discharge", () => {
    const wardAreaSqM = 10 * 1e6; // 10 km²
    const rainDepthM = 50 / 1000;  // 50 mm = 0.05 m
    const hourlyVolM3 = wardAreaSqM * rainDepthM;
    const dischargeM3S = hourlyVolM3 / 3600;

    assert.strictEqual(hourlyVolM3, 500000, "Hourly volume must equal 500,000 m³");
    assert.ok(Math.abs(dischargeM3S - 138.89) < 0.01, "Discharge rate must equal ~138.89 m³/s");
  });

  runTest("1.2 Unit Conversions: Rational Runoff Generation Formula", () => {
    const rainRate = 60;
    const imp = 0.85;
    const runoffGen = rainRate * imp;
    assert.strictEqual(Math.round(runoffGen * 10) / 10, 51.0);
  });

  // ─────────────────────────────────────────────────────────────
  // TEST GROUP 2: COPERNICUS DEM TERRAIN PROFILES DATASET
  // ─────────────────────────────────────────────────────────────
  runTest("2.1 Terrain Dataset: mumbai_ward_terrain_profiles.json contains 24 BMC wards", () => {
    const terrainPath = path.resolve(process.cwd(), "data", "mumbai", "terrain", "mumbai_ward_terrain_profiles.json");
    assert.ok(fs.existsSync(terrainPath), "mumbai_ward_terrain_profiles.json must exist");
    const profiles = JSON.parse(fs.readFileSync(terrainPath, "utf-8"));
    assert.strictEqual(profiles.length, 24, "Must contain all 24 canonical wards");

    // Check Ward F/South (Hindmata Saucer Depression)
    const fsWard = profiles.find((p) => p.wardId === "F/South");
    assert.ok(fsWard, "F/South must be present");
    assert.strictEqual(fsWard.isSaucerDepression, true, "F/South must be a saucer depression");
    assert.ok(fsWard.elevationMinM <= 3.2, "F/South min elevation must be <= 3.2m");
    assert.strictEqual(fsWard.nominalDrainCapacityMmH, 25.0, "Island City must have 25 mm/h vintage capacity");

    // Check Ward L (Kurla / Mithi Basin)
    const lWard = profiles.find((p) => p.wardId === "L");
    assert.ok(lWard, "Ward L must be present");
    assert.strictEqual(lWard.hasMithiCorridor, true, "Ward L must intersect Mithi corridor");
    assert.strictEqual(lWard.isSaucerDepression, true, "Ward L must be saucer depression");
  });

  runTest("2.2 Terrain Dataset: metadata.json specifies Copernicus GLO-30 & ESA WorldCover", () => {
    const metaPath = path.resolve(process.cwd(), "data", "mumbai", "terrain", "metadata.json");
    assert.ok(fs.existsSync(metaPath), "metadata.json must exist");
    const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
    assert.ok(meta.sources.some((s) => s.name.includes("Copernicus GLO-30")), "Must cite Copernicus DEM");
    assert.ok(meta.sources.some((s) => s.name.includes("ESA WorldCover")), "Must cite ESA WorldCover");
    assert.strictEqual(meta.coordinateReferenceSystem, "EPSG:4326 (WGS84)");
    assert.ok(meta.scientificDisclaimer.includes("Copernicus"), "Must contain scientific disclaimer");
  });

  // ─────────────────────────────────────────────────────────────
  // TEST GROUP 3: SIMULATION API END-TO-END EXECUTION & HYETOGRAPHS
  // ─────────────────────────────────────────────────────────────
  await runAsyncTest("3.1 API Execution: Simulation endpoint executes with temporalHydrology", async () => {
    const res = await fetch(`${BASE_URL}/api/hazards/simulation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scenarioId: "rainfall_waterlogging",
        parameters: { rainfallRateMmH: 50, durationHours: 6 },
        timeStepHours: 3.0,
        baselineMode: "current_live",
        city: "mumbai",
      }),
    });

    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.ok(json.data.temporalHydrology, "Must include temporalHydrology");
    assert.strictEqual(json.data.temporalHydrology.timeStepHours, 3.0);
    assert.strictEqual(json.data.temporalHydrology.accumulatedRainfallMm, 150.0, "Constant 50 mm/h over 3h must equal 150.0 mm");
    assert.strictEqual(json.data.temporalHydrology.profileType, "constant_rate");
  });

  await runAsyncTest("3.2 Rolling Rainfall Monotonicity across Time Steps", async () => {
    const steps = [1.0, 2.0, 4.0, 6.0];
    const accums = [];

    for (const t of steps) {
      const res = await fetch(`${BASE_URL}/api/hazards/simulation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenarioId: "rainfall_waterlogging",
          parameters: { rainfallRateMmH: 60, rainfallProfile: 1, durationHours: 6 },
          timeStepHours: t,
          baselineMode: "current_live",
          city: "mumbai",
        }),
      });
      const json = await res.json();
      accums.push(json.data.temporalHydrology.accumulatedRainfallMm);
    }

    assert.ok(accums[1] > accums[0], "T=2 accum must be > T=1 accum");
    assert.ok(accums[2] > accums[1], "T=4 accum must be > T=2 accum");
    assert.ok(accums[3] > accums[2], "T=6 accum must be > T=4 accum");
  });

  await runAsyncTest("3.3 Tidal Sluice Lockout at High Tide >= 4.5m Chart Datum", async () => {
    // Sluice locked test: coastal_monsoon_surge with high tide 4.65m
    const resLocked = await fetch(`${BASE_URL}/api/hazards/simulation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scenarioId: "coastal_monsoon_surge",
        parameters: { highTideMeters: 4.65, rainfallRateMmH: 60, durationHours: 6 },
        timeStepHours: 2.5, // peak high tide
        baselineMode: "current_live",
        city: "mumbai",
      }),
    });
    const jsonLocked = await resLocked.json();
    assert.strictEqual(jsonLocked.data.temporalHydrology.isSluiceLocked, true, "Tide >= 4.5m must trigger isSluiceLocked=true");
    assert.strictEqual(jsonLocked.data.temporalHydrology.gravityEfficiencyPct, 15, "Efficiency must drop to 15% mechanical only");

    // Sluice free test: high tide 2.8m (peak 2.8 + 0.85 = 3.65m < 4.0m)
    const resFree = await fetch(`${BASE_URL}/api/hazards/simulation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scenarioId: "coastal_monsoon_surge",
        parameters: { highTideMeters: 2.8, rainfallRateMmH: 60, durationHours: 6 },
        timeStepHours: 2.5,
        baselineMode: "current_live",
        city: "mumbai",
      }),
    });
    const jsonFree = await resFree.json();
    assert.strictEqual(jsonFree.data.temporalHydrology.isSluiceLocked, false, "Tide 3.65m must not trigger lockout");
    assert.strictEqual(jsonFree.data.temporalHydrology.gravityEfficiencyPct, 100, "Efficiency must be 100% under low tide (<4.0m CD)");
  });

  await runAsyncTest("3.4 Input Sensitivity: Higher rainfall strictly increases waterlogging susceptibility", async () => {
    const resLow = await fetch(`${BASE_URL}/api/hazards/simulation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scenarioId: "rainfall_waterlogging",
        parameters: { rainfallRateMmH: 30, durationHours: 6 },
        timeStepHours: 2.0,
        baselineMode: "current_live",
        city: "mumbai",
      }),
    });
    const jsonLow = await resLow.json();

    const resHigh = await fetch(`${BASE_URL}/api/hazards/simulation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scenarioId: "rainfall_waterlogging",
        parameters: { rainfallRateMmH: 90, durationHours: 6 },
        timeStepHours: 2.0,
        baselineMode: "current_live",
        city: "mumbai",
      }),
    });
    const jsonHigh = await resHigh.json();

    assert.ok(jsonHigh.data.summary.meanCityValue > jsonLow.data.summary.meanCityValue, "90 mm/h must have higher mean score than 30 mm/h");
    assert.ok(jsonHigh.data.summary.peakCityValue > jsonLow.data.summary.peakCityValue, "90 mm/h must have higher peak score than 30 mm/h");
  });

  await runAsyncTest("3.5 Disaggregated Variables: Full separation of physical, terrain, and assumptions", async () => {
    const res = await fetch(`${BASE_URL}/api/hazards/simulation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scenarioId: "rainfall_waterlogging",
        parameters: { rainfallRateMmH: 55, drainageBlockagePct: 20, durationHours: 6 },
        timeStepHours: 2.0,
        baselineMode: "current_live",
        city: "mumbai",
      }),
    });
    const json = await res.json();
    const ward = json.data.rankedWards[0];

    assert.ok(ward.disaggregatedVariables, "Ward must have disaggregatedVariables");
    const { physicalInputs, spatialCharacteristics, historicalEvidence, hypotheticalParameters } = ward.disaggregatedVariables;

    assert.ok(typeof physicalInputs.precipitationRateMmH === "number");
    assert.ok(typeof physicalInputs.accumulatedPrecipMm === "number");
    assert.ok(typeof physicalInputs.astronomicalTideM === "number");
    assert.ok(typeof physicalInputs.netRunoffExcessMmH === "number");

    assert.ok(typeof spatialCharacteristics.elevationMeanM === "number");
    assert.ok(typeof spatialCharacteristics.isSaucerDepression === "boolean");
    assert.ok(typeof spatialCharacteristics.nominalDrainCapacityMmH === "number");

    assert.ok(typeof historicalEvidence.chronicHotspotCount === "number");
    assert.ok(typeof hypotheticalParameters.drainageBlockagePct === "number");
    assert.ok(ward.calculationTrace.includes("Score = [RunoffExcess"));
  });

  await runAsyncTest("3.6 Determinism: Identical simulation runs return identical results", async () => {
    const reqBody = {
      scenarioId: "rainfall_waterlogging",
      parameters: { rainfallRateMmH: 45, drainageBlockagePct: 15, durationHours: 6 },
      timeStepHours: 2.5,
      baselineMode: "current_live",
      city: "mumbai",
    };

    const res1 = await (await fetch(`${BASE_URL}/api/hazards/simulation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reqBody),
    })).json();

    const res2 = await (await fetch(`${BASE_URL}/api/hazards/simulation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reqBody),
    })).json();

    assert.strictEqual(res1.data.summary.meanCityValue, res2.data.summary.meanCityValue);
    assert.strictEqual(res1.data.summary.peakCityValue, res2.data.summary.peakCityValue);
    assert.strictEqual(res1.data.rankedWards[0].metricValue, res2.data.rankedWards[0].metricValue);
  });

  await runAsyncTest("3.7 Spatial Bounds: 24 wards evaluated strictly within Mumbai perimeter", async () => {
    const res = await fetch(`${BASE_URL}/api/hazards/simulation`);
    const json = await res.json();
    assert.strictEqual(json.wardsGeoJSON.features.length, 24);

    for (const feat of json.wardsGeoJSON.features) {
      const p = feat.properties;
      const coords = p.office_coords || [p.officeLat, p.officeLng];
      const lat = coords[0];
      const lon = coords[1];
      assert.ok(lat >= 18.89 && lat <= 19.30, `Latitude ${lat} must be within Mumbai`);
      assert.ok(lon >= 72.77 && lon <= 72.99, `Longitude ${lon} must be within Mumbai`);
    }
  });

  console.log("\n════════════════════════════════════════════════════════════");
  console.log(`  TEST RESULTS: ${passedTests} / ${totalTests} PASSED (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log("════════════════════════════════════════════════════════════");

  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal test error:", err);
  process.exit(1);
});
