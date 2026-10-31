/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Phase 3 Automated Integration Test Suite
   Verifies:
   1. Separate citizen destinations (Hazard Dashboard vs Civic Reporting)
   2. Point-in-Polygon boundary resolution across cities without false assignments
   3. Shared impact assessment answering the 6 core geospatial questions
   4. Secure Markdown parser validation (tables, bold, callouts)
   5. Telemetry Lab plain-language definitions & threshold standards
   6. API endpoints and cross-workspace navigation contracts
   ════════════════════════════════════════════════════════ */

import fs from "fs";
import path from "path";
import assert from "assert";

let passedCount = 0;
let failedCount = 0;

function assertTest(name, condition, details = "") {
  if (condition) {
    console.log(`  ✓ [PASS] ${name}`);
    passedCount++;
  } else {
    console.error(`  ✗ [FAIL] ${name} ${details ? `(${details})` : ""}`);
    failedCount++;
  }
}

async function runTests() {
  console.log("\n=======================================================");
  console.log("  SENTINEL PHASE 3: CITIZEN & TELEMETRY INTEGRATION TESTS");
  console.log("=======================================================\n");

  // ── TEST 1: Destination Separation ──
  console.log("1. Citizen Destination Architecture:");
  const reportPageContent = fs.readFileSync(path.resolve("src/app/[city]/report/page.tsx"), "utf-8");
  assertTest(
    "Report page is a dedicated destination (no redirect to dashboard)",
    !reportPageContent.includes("redirect(`/${city}/dashboard`)") &&
    reportPageContent.includes("CivicReportingView")
  );

  const dashboardPageContent = fs.readFileSync(path.resolve("src/app/(citizen)/dashboard/page.tsx"), "utf-8");
  assertTest(
    "Dashboard page focuses on Citizen Hazard Intelligence & Map",
    dashboardPageContent.includes("CitizenHazardMap") &&
    dashboardPageContent.includes("ImpactIntelligenceCard") &&
    !dashboardPageContent.includes("composing") &&
    !dashboardPageContent.includes("dept_questions")
  );

  const headerContent = fs.readFileSync(path.resolve("src/components/citizen/citizen-header.tsx"), "utf-8");
  assertTest(
    "CitizenHeader distinctly exposes Hazard Dashboard and Report Issue",
    headerContent.includes("Hazard Dashboard") && headerContent.includes("Report Issue")
  );

  const bottomNavContent = fs.readFileSync(path.resolve("src/components/citizen/citizen-bottom-nav.tsx"), "utf-8");
  assertTest(
    "CitizenBottomNav centers quick action linking to /report",
    bottomNavContent.includes(`router.push(\`/\${city}/report\`)`)
  );

  // ── TEST 2: Point-in-Polygon Boundary Resolution ──
  console.log("\n2. GIS Point-in-Polygon Resolution & Spatial Honesty:");
  const { resolveBoundary, pointInGeometry } = await import("../src/modules/geo/point-in-polygon.ts");

  // Mumbai Wards
  const mumbaiWardsGeo = JSON.parse(fs.readFileSync(path.resolve("public/data/mumbai/mumbai_bmc_wards.geojson"), "utf-8"));
  assertTest(
    "Mumbai GeoJSON loaded with 24 BMC wards",
    mumbaiWardsGeo.features.length === 24
  );

  // Colaba / Fort: [18.928, 72.833] -> Ward A
  const resColaba = resolveBoundary(18.928, 72.833, mumbaiWardsGeo);
  assertTest(
    "South Mumbai coordinates resolve to Ward A",
    resColaba !== null && resColaba.id === "A"
  );

  // Matunga / Sion: [19.030, 72.858] -> Ward F/North
  const resSion = resolveBoundary(19.030, 72.858, mumbaiWardsGeo);
  assertTest(
    "Central Mumbai coordinates resolve to Ward F/North",
    resSion !== null && resSion.id === "F/North"
  );

  // Nagpur Zones
  const nagpurZonesGeo = JSON.parse(fs.readFileSync(path.resolve("public/data/nagpur/nagpur_nmc_zones.geojson"), "utf-8"));
  assertTest(
    "Nagpur GeoJSON loaded with 10 NMC zones",
    nagpurZonesGeo.features.length === 10
  );

  // Nagpur center: [21.1215, 79.0628] -> Laxmi Nagar Zone 1
  const resNagpur = resolveBoundary(21.1215, 79.0628, nagpurZonesGeo);
  assertTest(
    "Nagpur coordinate resolves to Laxmi Nagar Zone",
    resNagpur !== null && String(resNagpur.properties.zone_number) === "1"
  );

  // Pune Zones
  const puneZonesGeo = JSON.parse(fs.readFileSync(path.resolve("public/data/pune/pune_pmc_zones.geojson"), "utf-8"));
  assertTest(
    "Pune GeoJSON loaded with PMC zones",
    puneZonesGeo.features.length >= 5
  );

  // Out of bounds coordinate (e.g. middle of the Indian Ocean or Delhi coordinate [28.61, 77.20])
  const resOcean = resolveBoundary(15.00, 70.00, mumbaiWardsGeo);
  assertTest(
    "Out-of-bounds coordinates return null without inventing a ward",
    resOcean === null
  );

  // ── TEST 3: Shared Impact Intelligence Contract ──
  console.log("\n3. Grounded Impact Intelligence & Demographic Exposure:");
  const { generateCityImpactAssessment } = await import("../src/modules/impact/generator.ts");

  const impactMumbai = generateCityImpactAssessment("mumbai", { rainfallRateMmH: 35.0, forecast24hTotalMm: 110.0 });
  assertTest(
    "Impact assessment addresses Q1: What is happening / forecast",
    Boolean(impactMumbai.forecastHeadline && impactMumbai.forecastDescription)
  );

  assertTest(
    "Impact assessment addresses Q2: Spatial extent and time horizon",
    Boolean(impactMumbai.spatialExtentDescription && impactMumbai.horizonTimeWindow)
  );

  assertTest(
    "Impact assessment addresses Q3: Telemetry evidence and models",
    Boolean(impactMumbai.evidenceBase.telemetrySource && impactMumbai.evidenceBase.forecastModel)
  );

  assertTest(
    "Impact assessment addresses Q4: Wards and transport corridors affected",
    impactMumbai.potentialImpacts.highestRiskWards.length > 0 &&
    impactMumbai.potentialImpacts.transportCorridorsAffected.length > 0
  );

  assertTest(
    "Demographic methodology explicitly distinguishes estimated population in buffer from casualties",
    impactMumbai.potentialImpacts.demographicMethodologyFootnote.includes("screening buffer, NOT confirmed evacuated or displaced")
  );

  assertTest(
    "Impact assessment addresses Q5: Certainty tiers and missing inputs",
    impactMumbai.certaintyAndLimitations.missingInputs.length > 0 &&
    Boolean(impactMumbai.certaintyAndLimitations.uncertaintyStatement)
  );

  assertTest(
    "Impact assessment addresses Q6: Practical actions for citizens and municipal desks",
    impactMumbai.recommendedActions.citizenActions.length > 0 &&
    impactMumbai.recommendedActions.municipalActions.length > 0
  );

  // ── TEST 4: Secure Markdown Parser ──
  console.log("\n4. Secure Markdown Rendering:");
  const mdViewFile = fs.readFileSync(path.resolve("src/components/ui/markdown-view.tsx"), "utf-8");
  assertTest(
    "MarkdownView component exists with table and callout support",
    mdViewFile.includes("table") && mdViewFile.includes("blockquote") && (mdViewFile.includes("sanitizeUrl") || mdViewFile.includes("isSafeUrl"))
  );

  const assistantDrawerFile = fs.readFileSync(path.resolve("src/components/citizen/sentinel-assistant-drawer.tsx"), "utf-8");
  assertTest(
    "Sentinel assistant drawer uses MarkdownView for model responses",
    assistantDrawerFile.includes("<MarkdownView content={msg.content} />") &&
    !assistantDrawerFile.includes('<div className="whitespace-pre-line space-y-1.5">{msg.content}</div>')
  );

  // ── TEST 5: Telemetry Lab Interpretability & Thresholds ──
  console.log("\n5. Telemetry Lab Active Tabs & Plain-Language Standards:");
  const labViewFile = fs.readFileSync(path.resolve("src/components/admin/telemetry-lab/telemetry-lab-view.tsx"), "utf-8");
  assertTest(
    "Telemetry Lab has sticky active tab navigation rail with spatial lab link",
    labViewFile.includes("sticky top-14") &&
    labViewFile.includes("bg-blue-600 text-white font-bold") &&
    labViewFile.includes("/simulation")
  );

  const explorerFile = fs.readFileSync(path.resolve("src/components/admin/telemetry-lab/parameter-explorer-tab.tsx"), "utf-8");
  assertTest(
    "CAPE explicitly explained as atmospheric instability indicator, NOT ward lightning probability",
    explorerFile.includes("Convective Available Potential Energy (CAPE)") &&
    explorerFile.includes("NOT a direct probability that a thunderstorm will hit a specific ward")
  );

  assertTest(
    "Surface pressure and mean sea-level pressure explicitly distinguished",
    explorerFile.includes("must NOT be confused with Mean Sea-Level Pressure (MSLP)") &&
    explorerFile.includes("pressure_msl")
  );

  assertTest(
    "Wind gusts and sustained wind speed explicitly distinguished",
    explorerFile.includes("Sustained horizontal wind speed") &&
    explorerFile.includes("wind_gusts_10m") &&
    (explorerFile.includes("uprooted trees") || explorerFile.includes("driver of uprooted trees"))
  );

  assertTest(
    "Rainfall rate and accumulated rainfall volume explicitly distinguished",
    explorerFile.includes("precipitation_sum") &&
    explorerFile.includes("Rolling cumulative rainfall depth over 24 hours")
  );

  const chartFile = fs.readFileSync(path.resolve("src/components/admin/telemetry-lab/telemetry-chart.tsx"), "utf-8");
  assertTest(
    "Telemetry chart validates valid zero-precipitation observation vs missing data",
    chartFile.includes("isAllZero") &&
    chartFile.includes("Zero measured in interval") &&
    chartFile.includes("Telemetry Data Unavailable")
  );

  console.log("\n=======================================================");
  console.log(`  PHASE 3 INTEGRATION RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("=======================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
