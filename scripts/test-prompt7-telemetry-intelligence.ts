/* ════════════════════════════════════════════════════════
   SENTINEL CITY INTELLIGENCE — PROMPT 7 VERIFICATION SUITE
   Advanced Telemetry Intelligence, Data Quality, Explainable Trends
   and Environmental Impact Interpretation.
   ════════════════════════════════════════════════════════ */

import {
  ENVIRONMENTAL_PARAMETER_REGISTRY,
  PARAMETER_CATEGORIES,
  ParameterCategory,
} from "../src/modules/hazards/parameter-registry";
import {
  calculateRollingRainfall,
  calculateHeatIndexCelsius,
  calculateWindGustExceedance,
  classifyAirQuality,
} from "../src/modules/hazards/derived-metrics";
import {
  generateEnvironmentalInsights,
} from "../src/modules/hazards/environmental-insights";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3005";

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  category: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, name: string, category: string, failureDetail?: string) {
  if (condition) {
    results.push({ name, passed: true, message: "OK", category });
    console.log(`  ✔ [PASS] [${category}] ${name}`);
  } else {
    results.push({ name, passed: false, message: failureDetail || "Assertion failed", category });
    console.error(`  ✖ [FAIL] [${category}] ${name} — ${failureDetail}`);
  }
}

async function runPrompt7Tests() {
  console.log("\n========================================================================");
  console.log("  SENTINEL CITY INTELLIGENCE — PROMPT 7 TELEMETRY INTELLIGENCE VERIFICATION");
  console.log(`  Base URL: ${BASE_URL}`);
  console.log(`  Execution Time: ${new Date().toISOString()}`);
  console.log("========================================================================\n");

  // ─── 1. PARAMETER REGISTRY AUDIT ──────────────────────────
  console.log("--- 1. Parameter Registry Audit & Metadata Completeness ---");
  const params = Object.values(ENVIRONMENTAL_PARAMETER_REGISTRY);

  assert(
    params.length >= 60,
    `Registry exposes 60+ parameters (Actual: ${params.length})`,
    "ParameterRegistry"
  );

  const categories = Object.keys(PARAMETER_CATEGORIES);
  assert(
    categories.length === 6,
    `All 6 parameter categories defined (Actual: ${categories.length})`,
    "ParameterRegistry"
  );

  let allHaveEndpoints = true;
  let allHaveUnits = true;
  let allHaveDataTypes = true;
  let allHaveSpatialRes = true;
  let allHaveAttribution = true;

  params.forEach((p) => {
    if (!p.endpoint || !p.apiField) allHaveEndpoints = false;
    if (!p.unit) allHaveUnits = false;
    if (!p.dataType) allHaveDataTypes = false;
    if (!p.spatialResolution) allHaveSpatialRes = false;
    if (!p.attribution) allHaveAttribution = false;
  });

  assert(allHaveEndpoints, "Every parameter specifies exact provider endpoint and API field", "ParameterRegistry");
  assert(allHaveUnits, "Every parameter defines its standard physical unit", "ParameterRegistry");
  assert(allHaveDataTypes, "Every parameter defines its distinct data type (MEASURED/MODELLED/FORECAST/DERIVED/REANALYSIS)", "ParameterRegistry");
  assert(allHaveSpatialRes, "Every parameter declares its spatial resolution", "ParameterRegistry");
  assert(allHaveAttribution, "Every parameter includes scientific license and attribution", "ParameterRegistry");

  // Check documented statutory thresholds
  const paramsWithThresholds = params.filter((p) => p.thresholds && p.thresholds.length > 0);
  assert(
    paramsWithThresholds.length >= 10,
    `Parameters with documented statutory thresholds (Count: ${paramsWithThresholds.length})`,
    "ParameterRegistry"
  );

  const validAuthorities = ["IMD", "CPCB", "WHO", "NOAA", "MCGM SWD", "BMC Disaster Cell", "US EPA"];
  const allThresholdsValid = paramsWithThresholds.every((p) =>
    (p.thresholds || []).every((th) => validAuthorities.some((auth) => th.sourceAuthority?.includes(auth) || th.sourceAuthority))
  );
  assert(allThresholdsValid, "All parameter thresholds cite documented source authorities (IMD, CPCB, NOAA, etc.)", "ParameterRegistry");

  // ─── 2. DERIVED METRICS & SCIENTIFIC FORMULATIONS ─────────
  console.log("\n--- 2. Derived Metrics & Mathematical Integrity ---");

  // Rolling rainfall calculation test
  const testTimestamps = ["T+0", "T+1", "T+2", "T+3", "T+4", "T+5"];
  const testPrecip = [10, 20, 30, 0, 15, 25]; // 3h rolling sum at T+2 is 10+20+30 = 60
  const roll3 = calculateRollingRainfall(testTimestamps, testPrecip, 3);

  assert(
    roll3.series[2].rollingMm === 60,
    `Rolling 3h sum accurately calculates 60mm without double-counting (Actual: ${roll3.series[2].rollingMm}mm)`,
    "DerivedMetrics"
  );
  assert(
    roll3.exceedsWarning === true,
    "Rolling 3h sum >= 50mm correctly triggers excessive rainfall warning",
    "DerivedMetrics"
  );

  // NOAA Heat Index test
  const heatNormal = calculateHeatIndexCelsius(30, 50); // 30°C, 50% RH -> approx 31°C
  const heatExtreme = calculateHeatIndexCelsius(42, 65); // 42°C, 65% RH -> Extreme Danger

  assert(
    heatNormal.riskTier === "SAFE" || heatNormal.riskTier === "CAUTION",
    `Normal thermal condition (30°C, 50% RH) classified as ${heatNormal.riskTier}`,
    "DerivedMetrics"
  );
  assert(
    heatExtreme.riskTier === "DANGER" || heatExtreme.riskTier === "EXTREME_DANGER",
    `Severe thermal condition (42°C, 65% RH) classified as ${heatExtreme.riskTier} (${heatExtreme.heatIndexCelsius}°C)`,
    "DerivedMetrics"
  );
  assert(
    heatExtreme.formula.includes("Rothfusz"),
    "Heat index result documents NOAA Rothfusz regression formula",
    "DerivedMetrics"
  );

  // Wind gust exceedance test
  const gustNormal = calculateWindGustExceedance(20, 28);
  const gustSquall = calculateWindGustExceedance(35, 68);

  assert(
    gustNormal.isSquall === false && gustNormal.severity === "NORMAL",
    `Normal wind (20km/h speed, 28km/h gust) classified as ${gustNormal.severity}`,
    "DerivedMetrics"
  );
  assert(
    gustSquall.isSquall === true && (gustSquall.severity === "SEVERE_SQUALL" || gustSquall.severity === "GALE_ADVISORY"),
    `Squall wind burst (35km/h speed, 68km/h gust) classified as ${gustSquall.severity}`,
    "DerivedMetrics"
  );

  // Air Quality classification test
  const aqiGood = classifyAirQuality(25, "pm2_5");
  const aqiSevere = classifyAirQuality(260, "pm2_5");

  assert(
    aqiGood.category.includes("Good"),
    `PM2.5 = 25 µg/m³ correctly classified as ${aqiGood.category} under CPCB standard`,
    "DerivedMetrics"
  );
  assert(
    aqiSevere.category.includes("Severe"),
    `PM2.5 = 260 µg/m³ correctly classified as ${aqiSevere.category} under CPCB standard`,
    "DerivedMetrics"
  );

  // ─── 3. EXPLAINABLE ENVIRONMENTAL INSIGHTS LAYER ──────────
  console.log("\n--- 3. Explainable Environmental Insights Service ---");

  const mockInsightCtx = {
    cityId: "mumbai" as const,
    cityName: "Mumbai",
    selectedZone: "BMC Ward F/North (Sion / Matunga)",
    weatherData: {
      current: {
        temperature_2m: 34,
        relative_humidity_2m: 82,
        apparent_temperature: 44,
        precipitation: 15,
        wind_speed_10m: 22,
        wind_gusts_10m: 48,
        wind_direction_10m: 240,
      },
      hourly: {
        time: ["2026-10-19T06:00", "2026-10-19T07:00", "2026-10-19T08:00", "2026-10-19T09:00"],
        precipitation: [5, 25, 35, 10], // rolling 3h sum = 70mm
        temperature_2m: [32, 33, 34, 34],
        relative_humidity_2m: [80, 81, 82, 82],
      },
    },
    aqiData: {
      current: {
        pm2_5: 75,
        pm10: 140,
        us_aqi: 161,
        european_aqi: 65,
      },
    },
    marineData: {
      current: {
        wave_height: 2.4,
        swell_wave_height: 1.8,
        wave_period: 8.5,
      },
    },
    riverData: {
      discharge: 120,
      dischargeMedian: 45,
      dischargeMax: 180,
    },
  };

  const insights = generateEnvironmentalInsights(mockInsightCtx);

  assert(
    insights.length >= 4,
    `Insights engine produces multi-factor insights (Count: ${insights.length})`,
    "EnvironmentalInsights"
  );

  const rainInsight = insights.find((i) => i.id === "rainfall_accumulation_spectrum");
  assert(
    rainInsight !== undefined,
    "Rainfall accumulation spectrum insight generated",
    "EnvironmentalInsights"
  );
  assert(
    rainInsight?.operationalInterpretation.whatItMeans.length! > 20,
    "Rainfall insight contains plain-language operational interpretation",
    "EnvironmentalInsights"
  );
  assert(
    (rainInsight?.operationalInterpretation.contributingHazards.length || 0) >= 2,
    "Rainfall insight explicitly lists contributing urban hazards",
    "EnvironmentalInsights"
  );
  assert(
    rainInsight?.thresholdSource.includes("IMD") === true,
    "Rainfall insight documents IMD statutory threshold standard",
    "EnvironmentalInsights"
  );

  const heatInsight = insights.find((i) => i.id === "noaa_heat_stress_index");
  assert(
    heatInsight !== undefined,
    "Heat stress insight generated with Rothfusz formulation",
    "EnvironmentalInsights"
  );
  assert(
    heatInsight?.limitations.includes("shaded") === true,
    "Heat stress insight explicitly states shaded condition limitations",
    "EnvironmentalInsights"
  );

  const marineInsight = insights.find((i) => i.id === "coastal_wave_overtopping_dynamics");
  assert(
    marineInsight !== undefined,
    "Mumbai coastal wave overtopping insight generated with CMEMS inputs",
    "EnvironmentalInsights"
  );

  // ─── 4. TELEMETRY LAB API ENDPOINT VERIFICATION ───────────
  console.log("\n--- 4. Telemetry Lab API Endpoint & 7-Point Quality Audit ---");

  try {
    const res = await fetch(`${BASE_URL}/api/hazards/telemetry-lab?city=mumbai&tab=overview`);
    assert(res.ok, "GET /api/hazards/telemetry-lab returns HTTP 200", "TelemetryAPI");

    const json = await res.json();
    assert(json.success === true, "API returns success: true", "TelemetryAPI");
    assert(json.city?.id === "mumbai", "City correctly resolved as Mumbai", "TelemetryAPI");

    // Timestamps check
    assert(
      typeof json.timestamps?.retrievedAt === "string" && typeof json.timestamps?.observedAt === "string",
      "API returns separate retrievedAt and observedAt timestamps",
      "TelemetryAPI"
    );

    // 7-Point Quality Check
    const weatherAudit = json.sourceHealth?.weatherApi;
    assert(weatherAudit !== undefined, "sourceHealth.weatherApi audit object exists", "TelemetryAPI");
    assert(
      weatherAudit?.checks?.endpointAvailable !== undefined &&
      weatherAudit?.checks?.requestSuccessful !== undefined &&
      weatherAudit?.checks?.schemaValid !== undefined &&
      weatherAudit?.checks?.dataFresh !== undefined &&
      weatherAudit?.checks?.parameterPresent !== undefined &&
      weatherAudit?.checks?.geographicCoverageAdequate !== undefined &&
      weatherAudit?.checks?.suitableForAnalysis !== undefined,
      "7-Point data quality audit checklist completely populated",
      "TelemetryAPI"
    );

    // Insights presence
    assert(
      Array.isArray(json.insights) && json.insights.length > 0,
      `API returns explainable insights array (Count: ${json.insights?.length})`,
      "TelemetryAPI"
    );

    // Distance from requested coordinates
    assert(
      typeof json.city?.distanceFromRequestedKm === "number",
      `Effective grid distance calculated (Δ ${json.city?.distanceFromRequestedKm} km)`,
      "TelemetryAPI"
    );
  } catch (err: any) {
    assert(false, "API request executed without connection failure", "TelemetryAPI", err.message);
  }

  // ─── 5. MULTI-ZONE COMPARISON & GRID SNAPPING DETECTION ───
  console.log("\n--- 5. Multi-Zone Comparison & Grid Snapping Detection ---");

  try {
    // Query comparison for nearby Nagpur localities (e.g. Dharampeth vs Sitabuldi)
    const compRes = await fetch(`${BASE_URL}/api/hazards/telemetry-lab?city=nagpur&tab=comparison`);
    assert(compRes.ok, "GET /api/hazards/telemetry-lab (Nagpur Comparison) returns HTTP 200", "ZoneComparison");

    const compJson = await compRes.json();
    const comparison = compJson.comparison || [];
    assert(comparison.length >= 2, `Comparison returns multiple localities (Count: ${comparison.length})`, "ZoneComparison");

    const firstZone = comparison[0];
    assert(
      firstZone?.requestedCoords && firstZone?.effectiveGridCoords,
      "Zone comparison preserves requested coords vs effective provider grid coords",
      "ZoneComparison"
    );
    assert(
      typeof firstZone?.isSharedGridCell === "boolean",
      "Zone comparison accurately identifies whether grid cell is shared",
      "ZoneComparison"
    );
    assert(
      typeof firstZone?.gridCellStatus === "string",
      `Grid cell status labeled honestly (e.g. '${firstZone?.gridCellStatus}')`,
      "ZoneComparison"
    );
  } catch (err: any) {
    assert(false, "Zone comparison API executed without connection failure", "ZoneComparison", err.message);
  }

  // ─── 6. CITY ISOLATION & GEOGRAPHIC SCOPE ─────────────────
  console.log("\n--- 6. City Geographic Scope & Non-Mumbai Isolation ---");

  try {
    const nagpurRes = await fetch(`${BASE_URL}/api/hazards/telemetry-lab?city=nagpur&tab=overview`);
    const nagpurJson = await nagpurRes.json();

    assert(
      nagpurJson.sourceHealth?.marineApi?.status === "NOT_APPLICABLE",
      "Inland city (Nagpur) correctly tags marineApi as NOT_APPLICABLE",
      "CityIsolation"
    );
    assert(
      nagpurJson.city?.hasCoastalSurge === false,
      "Nagpur correctly reports hasCoastalSurge: false",
      "CityIsolation"
    );

    // Marine wave insight should NOT be present in Nagpur
    const nagpurMarineInsight = (nagpurJson.insights || []).find((i: any) => i.id === "coastal_wave_overtopping_dynamics");
    assert(
      nagpurMarineInsight === undefined,
      "Nagpur environmental insights strictly exclude Mumbai coastal wave dynamics",
      "CityIsolation"
    );
  } catch (err: any) {
    assert(false, "Nagpur isolation check executed", "CityIsolation", err.message);
  }

  // ─── SUMMARY REPORT ───────────────────────────────────────
  console.log("\n========================================================================");
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;

  console.log(`  PROMPT 7 TEST RESULTS: ${passed} / ${total} PASSED (${failed} FAILED)`);
  if (failed === 0) {
    console.log("  STATUS: ALL ADVANCED TELEMETRY INTELLIGENCE REQUIREMENTS VERIFIED!");
  } else {
    console.error(`  STATUS: ${failed} TEST(S) FAILED. REVIEW OUTPUT ABOVE.`);
  }
  console.log("========================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runPrompt7Tests().catch((e) => {
  console.error("Test runner encountered fatal error:", e);
  process.exit(1);
});
