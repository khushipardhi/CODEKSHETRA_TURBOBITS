// scripts/test-phase5-telemetry-lab.mjs
// Comprehensive verification of Sentinel City Intelligence Phase 5 Telemetry Lab

import assert from "node:assert";

console.log("======================================================================");
console.log("  SENTINEL CITY INTELLIGENCE — PHASE 5 TELEMETRY LAB TEST SUITE");
console.log("======================================================================\n");

async function runTests() {
  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      console.log(`  [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  [FAIL] ${name}`);
      console.error(`         ${err.message}`);
    }
  }

  async function asyncTest(name, fn) {
    total++;
    try {
      await fn();
      console.log(`  [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  [FAIL] ${name}`);
      console.error(`         ${err.message}`);
    }
  }

  // -------------------------------------------------------------------------
  // 1. Parameter Registry & 8 Categories
  // -------------------------------------------------------------------------
  console.log("Section 1: Parameter Registry & 8 Categories");

  const registryModule = await import("../src/modules/hazards/parameter-registry.ts");
  const {
    PARAMETER_REGISTRY,
    PARAMETER_CATEGORIES,
    getParameterDefinition,
    getParametersByCategory,
    getParametersForCityAndCategory,
  } = registryModule;

  test("Parameter Registry contains 60+ parameters", () => {
    const keys = Object.keys(PARAMETER_REGISTRY);
    assert(keys.length >= 60, `Expected at least 60 parameters, found ${keys.length}`);
  });

  test("All 8 operational categories are declared in PARAMETER_CATEGORIES", () => {
    const requiredCats = [
      "weather_atmosphere",
      "rainfall_hydrology",
      "air_quality",
      "heat_exposure",
      "coastal_marine",
      "soil_land",
      "historical_archive",
      "derived_indicators",
    ];
    for (const cat of requiredCats) {
      assert(PARAMETER_CATEGORIES[cat], `Missing category: ${cat}`);
      assert(PARAMETER_CATEGORIES[cat].label, `Category ${cat} missing label`);
      assert(PARAMETER_CATEGORIES[cat].description, `Category ${cat} missing description`);
    }
  });

  test("Every parameter has valid classification, unit, and category", () => {
    for (const [key, param] of Object.entries(PARAMETER_REGISTRY)) {
      assert(param.id === key, `Key mismatch: ${key} vs ${param.id}`);
      assert(param.label, `Param ${key} missing label`);
      assert(param.unit !== undefined, `Param ${key} missing unit`);
      assert(param.category, `Param ${key} missing category`);
      assert(PARAMETER_CATEGORIES[param.category], `Param ${key} has invalid category ${param.category}`);
      assert(
        ["MEASURED", "MODELLED_CURRENT", "FORECAST", "HISTORICAL_REANALYSIS", "ARCHIVED_SNAPSHOT", "DERIVED"].includes(param.dataType),
        `Param ${key} has invalid dataType ${param.dataType}`
      );
    }
  });

  // -------------------------------------------------------------------------
  // 2. Plain-Language & Scientific Explanations
  // -------------------------------------------------------------------------
  console.log("\nSection 2: Plain-Language & Scientific Explanations");

  test("Distinguish Sustained Wind Speed (10m) vs Wind Gusts (10m)", () => {
    const windSpeed = getParameterDefinition("wind_speed_10m");
    const windGusts = getParameterDefinition("wind_gusts_10m");
    assert(windSpeed && windGusts, "Both wind speed and gusts must exist in registry");

    assert(windSpeed.whatItMeasures?.includes("airflow") || windSpeed.label.includes("Sustained"), "wind_speed must describe continuous airflow");
    assert(
      windGusts.whatItMeasures?.includes("burst") ||
      windGusts.whatItMeasures?.includes("surge") ||
      windGusts.description?.includes("instantaneous"),
      "wind_gusts must describe peak momentary bursts"
    );
    assert(windSpeed.plainLanguageMeaning !== windGusts.plainLanguageMeaning, "Explanations must not be identical");
  });

  test("Distinguish Rainfall Rate/Intensity vs 24h Cumulative Accumulation", () => {
    const rainRate = getParameterDefinition("precipitation");
    const rainAcc = getParameterDefinition("precipitation_acc_24h");
    assert(rainRate && rainAcc, "Both rain rate and accumulation must exist");

    assert(rainRate.unit === "mm/h" || rainRate.unit === "mm", "Rain rate unit check");
    assert(rainAcc.unit === "mm", "Rain accumulation unit check");
    assert(rainRate.whatItMeasures?.includes("rate") || rainRate.whatItMeasures?.includes("1-hour"), "Rain rate must describe hourly rate");
    assert(rainAcc.whatItMeasures?.includes("Cumulative") || rainAcc.whatItMeasures?.includes("24-hour"), "Accumulation must describe cumulative 24h depth");
    assert(rainRate.plainLanguageMeaning !== rainAcc.plainLanguageMeaning, "Explanations must differ");
  });

  test("Distinguish Mean Sea Level Pressure (MSLP) vs Surface Pressure", () => {
    const mslp = getParameterDefinition("pressure_msl");
    const surfacePress = getParameterDefinition("surface_pressure");
    assert(mslp && surfacePress, "Both MSLP and surface pressure must exist");

    assert(mslp.whatItMeasures?.includes("Sea Level") || mslp.whatItMeasures?.includes("reduced"), "MSLP must explain reduction to 0m ASL");
    assert(surfacePress.whatItMeasures?.includes("elevation") || surfacePress.whatItMeasures?.includes("ground"), "Surface pressure must describe ground elevation");
    assert(mslp.plainLanguageMeaning !== surfacePress.plainLanguageMeaning, "Explanations must differ");
  });

  test("Distinguish PM2.5 Physical Concentration vs US AQI Index", () => {
    const pm25 = getParameterDefinition("pm2_5");
    const aqi = getParameterDefinition("us_aqi");
    assert(pm25 && aqi, "Both PM2.5 and US AQI must exist");

    assert(pm25.unit === "µg/m³", "PM2.5 unit must be µg/m³");
    assert(aqi.unit === "AQI" || aqi.unit === "index", "US AQI unit check");
    assert(pm25.whatItMeasures?.includes("Physical mass") || pm25.whatItMeasures?.includes("microscopic"), "PM2.5 must describe physical mass density");
    assert(aqi.whatItMeasures?.includes("score") || aqi.whatItMeasures?.includes("dimensionless"), "AQI must describe dimensionless risk score");
    assert(pm25.plainLanguageMeaning !== aqi.plainLanguageMeaning, "Explanations must differ");
  });

  // -------------------------------------------------------------------------
  // 3. Geographic Support & City Isolation
  // -------------------------------------------------------------------------
  console.log("\nSection 3: Geographic Support & City Isolation");

  test("Mumbai supports coastal marine parameters; Pune and Nagpur reject them", () => {
    const mumbaiMarine = getParametersForCityAndCategory("mumbai", "coastal_marine");
    const puneMarine = getParametersForCityAndCategory("pune", "coastal_marine");
    const nagpurMarine = getParametersForCityAndCategory("nagpur", "coastal_marine");

    assert(mumbaiMarine.length > 0, `Mumbai must have coastal marine parameters, found ${mumbaiMarine.length}`);
    assert(puneMarine.length === 0, `Pune (inland plateau) must not support coastal marine parameters, found ${puneMarine.length}`);
    assert(nagpurMarine.length === 0, `Nagpur (central inland) must not support coastal marine parameters, found ${nagpurMarine.length}`);
  });

  test("All cities support weather, rainfall, air quality, heat, and soil parameters", () => {
    const cities = ["mumbai", "pune", "nagpur"];
    const sharedCats = ["weather_atmosphere", "rainfall_hydrology", "air_quality", "heat_exposure", "soil_land"];

    for (const city of cities) {
      for (const cat of sharedCats) {
        const params = getParametersForCityAndCategory(city, cat);
        assert(params.length > 0, `${city} must support parameters in category ${cat}`);
      }
    }
  });

  // -------------------------------------------------------------------------
  // 4. Historical ERA5 Reanalysis & Derived Indicators
  // -------------------------------------------------------------------------
  console.log("\nSection 4: Historical Reanalysis & Derived Indicators");

  test("Historical archive category includes ERA5 reanalysis parameters", () => {
    const historicalParams = getParametersByCategory("historical_archive");
    assert(historicalParams.length >= 4, `Expected at least 4 historical archive parameters, found ${historicalParams.length}`);

    const era5Temp = getParameterDefinition("era5_temperature_2m");
    assert(era5Temp, "era5_temperature_2m must exist");
    assert(era5Temp.model.includes("ERA5"), "Source model must specify ECMWF ERA5");
  });

  test("Derived indicators category includes verified composite metrics", () => {
    const derivedParams = getParametersByCategory("derived_indicators");
    assert(derivedParams.length >= 3, `Expected at least 3 derived indicators, found ${derivedParams.length}`);

    const heatIndex = getParameterDefinition("noaa_heat_index") || getParameterDefinition("derived_noaa_heat_index");
    assert(heatIndex, "noaa_heat_index must exist");
    assert(heatIndex.dataType === "DERIVED", "heat_index dataType must be DERIVED");
    assert(heatIndex.formula, "heat_index must disclose formula");
  });

  // -------------------------------------------------------------------------
  // 5. API Live Feeds & Honest Data Transparency (HTTP tests against localhost)
  // -------------------------------------------------------------------------
  console.log("\nSection 5: Live API Feeds & Transparency");

  await asyncTest("API /api/hazards/telemetry-lab returns valid overview for Mumbai", async () => {
    const res = await fetch("http://localhost:3000/api/hazards/telemetry-lab?city=mumbai&tab=overview");
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    const json = await res.json();
    assert(json.success, "Response success flag must be true");
    assert(json.city?.id === "mumbai", "City ID must match mumbai");
    assert(json.current, "Must return current observation readings");
    assert(json.current.weather?.temperature_2m !== undefined, "Must include weather temperature_2m");
    assert(json.current.weather?.precipitation !== undefined, "Must include weather precipitation");
    assert(json.timeSeries, "Must return timeSeries data");
    assert(json.timeSeries.timestamps && json.timeSeries.timestamps.length > 0, "Hourly timestamps series must not be empty");
    assert(json.timeSeries.weather, "Must return weather timeSeries");
  });

  await asyncTest("API /api/hazards/telemetry-lab returns honest zone comparison with grid cell snapping", async () => {
    const res = await fetch("http://localhost:3000/api/hazards/telemetry-lab?city=mumbai&tab=comparison");
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    const json = await res.json();
    assert(json.success, "Response success must be true");
    assert(json.comparison && json.comparison.length > 0, "Must return comparison zones");

    const firstZone = json.comparison[0];
    assert(firstZone.requestedCoords, "Must disclose requestedCoords");
    assert(firstZone.effectiveGridCoords, "Must disclose effectiveGridCoords");
    assert(firstZone.current, "Must disclose current observation values");
  });

  await asyncTest("API /api/hazards/telemetry-lab handles Pune inland city contract", async () => {
    const res = await fetch("http://localhost:3000/api/hazards/telemetry-lab?city=pune&tab=overview");
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    const json = await res.json();
    assert(json.success, "Response success must be true");
    assert(json.city?.id === "pune", "City ID must match pune");
  });

  console.log(`\n======================================================================`);
  console.log(`  PHASE 5 TEST RESULTS: ${passed}/${total} TESTS PASSED (${((passed/total)*100).toFixed(1)}%)`);
  console.log(`======================================================================\n`);

  if (passed !== total) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test runner encountered fatal error:", err);
  process.exit(1);
});
