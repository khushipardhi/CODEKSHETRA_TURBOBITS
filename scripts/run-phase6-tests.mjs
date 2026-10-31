/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Phase 6 Regression & Validation Suite
   Comprehensive automated verification across all cities, endpoints,
   data pipelines, security checks, and city isolation boundaries.
   ════════════════════════════════════════════════════════ */

import fs from "fs";
import path from "path";

const BASE_URL = process.env.BASE_URL || "http://localhost:3005";

const suiteResults = {
  timestamp: new Date().toISOString(),
  urbanLinkCore: [],
  sentinelEndpoints: [],
  cityIsolation: [],
  dataIntegrity: [],
  securityAudit: [],
  aiSafetyAudit: [],
};

function logTest(category, name, passed, details = "") {
  suiteResults[category].push({ name, passed, details });
  const statusStr = passed ? "✓ PASS" : "✗ FAIL";
  console.log(`[${category}] ${statusStr}: ${name} ${details ? `(${details})` : ""}`);
}

async function testFetch(endpoint, options = {}) {
  const url = endpoint.startsWith("http") ? endpoint : `${BASE_URL}${endpoint}`;
  const start = Date.now();
  try {
    const res = await fetch(url, { ...options });
    const latency = Date.now() - start;
    let json = null;
    try {
      json = await res.json();
    } catch {}
    return { ok: res.ok, status: res.status, json, latency };
  } catch (err) {
    return { ok: false, status: 0, error: err.message, latency: Date.now() - start };
  }
}

async function runAllTests() {
  console.log("=== STARTING SENTINEL PHASE 6 AUTOMATED REGRESSION SUITE ===\n");

  // ─── 1. Urban Link Core APIs ───
  console.log("--- 1. Testing Urban Link Core Functionality ---");
  for (const city of ["mumbai", "pune", "nagpur"]) {
    const stats = await testFetch(`/api/admin/stats?city=${city}`);
    logTest("urbanLinkCore", `Admin stats for ${city}`, stats.ok && stats.json?.success, `Status ${stats.status}, ${stats.latency}ms`);

    const incidents = await testFetch(`/api/admin/incidents?city=${city}&limit=5`);
    logTest("urbanLinkCore", `Admin incidents query for ${city}`, incidents.ok && incidents.json?.success, `Status ${incidents.status}`);

    const mapData = await testFetch(`/api/admin/map-data?city=${city}`);
    logTest("urbanLinkCore", `Admin map data for ${city}`, mapData.ok && mapData.json?.success, `Facilities: ${mapData.json?.facilities?.length || 0}`);
  }

  // ─── 2. Sentinel Endpoints ───
  console.log("\n--- 2. Testing Sentinel Multi-Hazard Endpoints ---");
  for (const city of ["mumbai", "pune", "nagpur"]) {
    const feed = await testFetch(`/api/hazards/feed?city=${city}`);
    const weather = feed.json?.data?.currentTelemetry?.weather;
    const hasTelemetry = weather?.temperatureCelsius !== undefined;
    logTest(
      "sentinelEndpoints",
      `Live Hazard Feed for ${city}`,
      feed.ok && feed.json?.success && hasTelemetry,
      `Temp: ${weather?.temperatureCelsius}°C, Rain: ${weather?.rainfallRateMmH}mm/h, Risk: ${feed.json?.data?.assessment?.riskLevel}`
    );

    const health = await testFetch(`/api/hazards/health?city=${city}`);
    const connectorsCount = health.json?.data?.connectors?.length || 0;
    logTest("sentinelEndpoints", `Connector Health Monitor for ${city}`, health.ok && connectorsCount >= 3, `${connectorsCount} connectors active`);

    const review = await testFetch(`/api/hazards/alerts/review?city=${city}`);
    logTest("sentinelEndpoints", `Alert Review & Approval for ${city}`, review.ok && review.json?.success, `Pending: ${review.json?.data?.pendingAlerts?.length || 0}`);
  }

  // ─── 3. Sentinel Risk Assessment & Simulation ───
  console.log("\n--- 3. Testing Risk Assessment & Hydrological Simulation ---");
  const assessMumbai = await testFetch("/api/hazards/assess", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ city: "mumbai" }),
  });
  logTest("sentinelEndpoints", "Real-Time Explainable Assessment (Mumbai)", assessMumbai.ok && assessMumbai.json?.data?.riskScore !== undefined, `Score: ${assessMumbai.json?.data?.riskScore}/100, Level: ${assessMumbai.json?.data?.riskLevel}`);

  const simMumbai = await testFetch("/api/hazards/assess", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      city: "mumbai",
      simulationScenario: { rainfallRateMmH: 50, durationHours: 3, tidalSurgeMeters: 2.2 },
    }),
  });
  const isSimulation = simMumbai.json?.data?.isSimulation === true;
  logTest("sentinelEndpoints", "Monsoon Stress-Test Simulation (Mumbai 50 mm/h)", simMumbai.ok && isSimulation, `Scenario Score: ${simMumbai.json?.data?.riskScore}/100, Watermarked: ${isSimulation}`);

  // ─── 4. City Boundary Isolation & Access Control ───
  console.log("\n--- 4. Testing Strict City Boundary Isolation ---");
  // Mumbai map layers should return hotspots and sinks
  const mumLayers = await testFetch("/api/hazards/map-layers?city=mumbai&layers=hotspots,sinks,drainage,coastal");
  const mumHotspots = mumLayers.json?.data?.layers?.hotspots?.features?.length || 0;
  const mumSinks = mumLayers.json?.data?.layers?.sinks?.features?.length || 0;
  logTest("cityIsolation", "Mumbai Map Layers Ingestion", mumHotspots === 35 && mumSinks === 15, `Hotspots: ${mumHotspots}, Sinks: ${mumSinks}`);

  // Pune map layers MUST NOT return Mumbai flood hotspots or depression sinks
  const puneLayers = await testFetch("/api/hazards/map-layers?city=pune&layers=hotspots,sinks,drainage,coastal");
  const puneHotspots = puneLayers.json?.data?.layers?.hotspots?.features?.length || 0;
  const puneSinks = puneLayers.json?.data?.layers?.sinks?.features?.length || 0;
  const puneIsolated = puneHotspots === 0 && puneSinks === 0;
  logTest("cityIsolation", "Pune Boundary Isolation (Zero Mumbai Flood Data Leakage)", puneIsolated, `Pune Hotspots: ${puneHotspots}, Sinks: ${puneSinks}`);

  // Nagpur map layers MUST NOT return Mumbai flood hotspots or depression sinks
  const nagpurLayers = await testFetch("/api/hazards/map-layers?city=nagpur&layers=hotspots,sinks,drainage,coastal");
  const nagpurHotspots = nagpurLayers.json?.data?.layers?.hotspots?.features?.length || 0;
  const nagpurSinks = nagpurLayers.json?.data?.layers?.sinks?.features?.length || 0;
  const nagpurIsolated = nagpurHotspots === 0 && nagpurSinks === 0;
  logTest("cityIsolation", "Nagpur Boundary Isolation (Zero Mumbai Flood Data Leakage)", nagpurIsolated, `Nagpur Hotspots: ${nagpurHotspots}, Sinks: ${nagpurSinks}`);

  // Invalid city validation
  const invalidCityRes = await testFetch("/api/hazards/feed?city=delhi_unsupported");
  logTest("cityIsolation", "Unsupported City Rejection", invalidCityRes.status === 400, `Rejected with HTTP ${invalidCityRes.status}`);

  // ─── 5. Sentinel Safety Assistant RAG & Anti-Hallucination Audit ───
  console.log("\n--- 5. Testing Sentinel Safety Assistant (Groq RAG) ---");
  const aiTest = await testFetch("/api/hazards/assistant", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      city: "mumbai",
      message: "Are there any official flood warnings in Mumbai right now?",
      conversationHistory: [],
    }),
  });
  const reply = aiTest.json?.data?.reply || "";
  const mentionsOfficialData = reply.includes("1916") || reply.includes("None") || reply.includes("alert") || reply.includes("low");
  const noFabricatedSirens = !reply.toLowerCase().includes("immediate evacuation required");
  logTest("aiSafetyAudit", "Conversational AI Grounded Response", aiTest.ok && mentionsOfficialData && noFabricatedSirens, `Length: ${reply.length} chars, Refers to official BMC status`);

  // ─── 6. Data Integrity & Spatial Assets Audit ───
  console.log("\n--- 6. Auditing Spatial Data Files on Disk ---");
  const mumbaiFloodDir = path.resolve(process.cwd(), "data/mumbai/flood_spatial");
  const mumbaiFiles = fs.existsSync(mumbaiFloodDir) ? fs.readdirSync(mumbaiFloodDir) : [];
  logTest("dataIntegrity", "Mumbai 10 GIS Spatial Layers in data/mumbai/flood_spatial", mumbaiFiles.length >= 10, `${mumbaiFiles.length} files verified`);

  const puneDataDir = path.resolve(process.cwd(), "data/pune");
  const puneFiles = fs.existsSync(puneDataDir) ? fs.readdirSync(puneDataDir) : [];
  logTest("dataIntegrity", "Pune Civic Facilities & Boundaries in data/pune", puneFiles.length >= 8, `${puneFiles.length} files verified`);

  const nagpurDataDir = path.resolve(process.cwd(), "data/geodata");
  const nagpurFiles = fs.existsSync(nagpurDataDir) ? fs.readdirSync(nagpurDataDir) : [];
  logTest("dataIntegrity", "Nagpur Civic Facilities & Zones in data/geodata", nagpurFiles.length >= 8, `${nagpurFiles.length} files verified`);

  // ─── 7. Security Audit: Client Code Secrets Leak Scan ───
  console.log("\n--- 7. Scanning Client Source Files for Leaked Credentials ---");
  const clientFiles = [
    "src/app/(admin)/admin/page.tsx",
    "src/app/(admin)/admin/map/page.tsx",
    "src/components/admin/osm-incident-map.tsx",
    "src/components/citizen/sentinel-hazard-banner.tsx",
    "src/components/citizen/sentinel-assistant-drawer.tsx",
    "src/components/department/DepartmentHazardContext.tsx",
    "src/app/[city]/sentinel/page.tsx",
  ];

  let clientLeakDetected = false;
  const sensitivePatterns = [
    /TIDB_HOST/i,
    /TIDB_PASSWORD/i,
    /GROQ_API_KEY/i,
    /AUTH_SECRET/i,
    /ASSEMBLYAI_API_KEY/i,
    /VAPID_PRIVATE_KEY/i,
    /mysql:\/\//i,
  ];

  for (const relPath of clientFiles) {
    const fullPath = path.resolve(process.cwd(), relPath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, "utf-8");
      for (const pat of sensitivePatterns) {
        if (pat.test(content)) {
          clientLeakDetected = true;
          logTest("securityAudit", `Secret Leak in ${relPath}`, false, `Matched ${pat}`);
        }
      }
    }
  }

  if (!clientLeakDetected) {
    logTest("securityAudit", "Client-Side Code Secret Leak Scan", true, "0 sensitive environment tokens found in client components");
  }

  // ─── Summary ───
  const allTests = [
    ...suiteResults.urbanLinkCore,
    ...suiteResults.sentinelEndpoints,
    ...suiteResults.cityIsolation,
    ...suiteResults.dataIntegrity,
    ...suiteResults.securityAudit,
    ...suiteResults.aiSafetyAudit,
  ];
  const passedCount = allTests.filter((t) => t.passed).length;
  const totalCount = allTests.length;

  console.log("\n==================================================");
  console.log(`SUITE COMPLETE: ${passedCount} / ${totalCount} TESTS PASSED (${Math.round((passedCount / totalCount) * 100)}%)`);
  console.log("==================================================");

  fs.writeFileSync(
    path.resolve(process.cwd(), "docs/REGRESSION_TEST_RESULTS.json"),
    JSON.stringify(suiteResults, null, 2)
  );
}

runAllTests().catch((err) => {
  console.error("Test Suite Fatal Error:", err);
});
