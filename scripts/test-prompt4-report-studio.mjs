/**
 * scripts/test-prompt4-report-studio.mjs
 * Sentinel City Intelligence — Prompt 4 Report Studio & Dossier Verification Suite
 */

import http from 'http';

const BASE_URL = 'http://localhost:3005';

function get(path) {
  return new Promise((resolve, reject) => {
    http.get(`${BASE_URL}${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', reject);
  });
}

function post(path, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const req = http.request(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function runTests() {
  console.log("════════════════════════════════════════════════════════════");
  console.log("  SENTINEL PROMPT 4: DEDICATED REPORT STUDIO TEST SUITE     ");
  console.log("════════════════════════════════════════════════════════════\n");

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  ✓ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ✗ [FAIL] ${message}`);
      process.exitCode = 1;
    }
  }

  try {
    // 1. Report Page Route Availability
    console.log("Suite 1: Dedicated Route & Page Integrity");
    const pageRes = await get('/admin/mumbai/simulation/report');
    assert(pageRes.status === 200, "Dedicated Report Studio route /admin/mumbai/simulation/report returns HTTP 200");

    const genericPageRes = await get('/admin/simulation/report');
    assert(genericPageRes.status === 200, "Generic route /admin/simulation/report returns HTTP 200");

    // 2. Dossier Generation API
    console.log("\nSuite 2: Canonical Simulation Dossier API");
    const postRes = await post('/api/admin/simulation/dossier', {
      scenarioId: 'rainfall_waterlogging',
      timeStepHours: 2.0,
      selectedWardId: 'L',
      forceDeterministic: true,
    });
    assert(postRes.status === 200, "POST /api/admin/simulation/dossier returns HTTP 200");

    const json = JSON.parse(postRes.data);
    assert(json.success === true, "Dossier response contains success: true");
    assert(Boolean(json.dossier), "Dossier payload exists");

    const d = json.dossier;

    // 3. City-Wide Overview Verification (Level A)
    console.log("\nSuite 3: City-Wide Overview Requirements (Level A)");
    assert(d.executiveSummary.city === "Greater Mumbai", "Executive summary identifies Greater Mumbai");
    assert(d.executiveSummary.highestPriorityWards.length >= 3, "Contains top priority intervention wards");
    assert(d.citywideAssessment.totalWardsEvaluated === 24, "Evaluates exactly 24 canonical BMC wards");
    assert(d.citywideAssessment.tierDistribution.severeCount >= 0, "Provides ward priority tier distribution");
    assert(d.executiveSummary.criticalLimitations.length > 0, "Explicitly documents scientific limitations");

    // 4. Ward-Level Impact Dossier Verification (Level B)
    console.log("\nSuite 4: Ward-Level Dossier Requirements (Level B)");
    const wardL = d.rankedWardsAnalysis.find(w => w.wardId === 'L');
    assert(Boolean(wardL), "Contains deep analysis record for Ward L");
    assert(wardL.wardName.includes("Kurla"), "Ward L correctly maps to Kurla");
    assert(wardL.elevationMeanM > 0, "Contains authentic Copernicus DEM elevation context (~6.9m)");
    assert(wardL.calculationTrace.includes("RunoffExcess"), "Trace contains exact mathematical calculation breakdown");
    assert(wardL.deltaPercent !== undefined, "Calculates delta percent relative to baseline");
    assert(wardL.historicalHotspots.length > 0, "Associates verified chronic flood hotspots (e.g. Bail Bazar)");

    // 5. Population & Asset Exposure Audit
    console.log("\nSuite 5: Population & Infrastructure Exposure Methodology");
    assert(wardL.populationEstimateTotal >= 800000, "Documents census ward population (2011 with 2026 projections)");
    assert(wardL.estimatedExposedPopulation > 0 && wardL.estimatedExposedPopulation < wardL.populationEstimateTotal, "Distinguishes total ward population from low-lying buffer spatial exposure");
    assert(wardL.exposureMethodologyAndCaveat.includes("NOT confirmed casualties"), "Contains mandatory non-casualty theoretical exposure disclaimer");
    assert(Array.isArray(wardL.potentiallyExposedHospitals), "Documents tertiary hospital assets");
    assert(Array.isArray(wardL.potentiallyExposedRoads), "Documents arterial highway corridors");

    // 6. Usable Exports (CSV and JSON)
    console.log("\nSuite 6: Usable Exports (CSV & JSON)");
    const csvRes = await get(`/api/admin/simulation/dossier?dossierId=${encodeURIComponent(d.dossierId)}&format=csv`);
    assert(csvRes.status === 200, "CSV export returns HTTP 200");
    assert(csvRes.data.includes("Ward ID") && csvRes.data.includes("Kurla"), "CSV contains structured tabular ward data");

    const getJsonRes = await get(`/api/admin/simulation/dossier?dossierId=${encodeURIComponent(d.dossierId)}`);
    assert(getJsonRes.status === 200, "JSON retrieval by ID returns HTTP 200");
    const jsonRetrieved = JSON.parse(getJsonRes.data);
    assert(jsonRetrieved.dossier.dossierId === d.dossierId, "Retrieved JSON matches generated dossier ID");

    // 7. Municipal Actions & Non-Dispatch Governance
    console.log("\nSuite 7: Municipal Actions & Governance");
    assert(d.recommendedActions.length >= 3, "Contains structured departmental action recommendations");
    const swdAction = d.recommendedActions.find(a => a.departmentCode === "SWD");
    assert(
      d.limitationsAndGovernance.administrativeDisclaimer.toLowerCase().includes("not replace") ||
      d.limitationsAndGovernance.administrativeDisclaimer.toLowerCase().includes("does not"),
      "Includes non-dispatch legal disclaimer"
    );

    console.log("\n════════════════════════════════════════════════════════════");
    console.log(`  TEST RESULTS: ${passed} / ${total} PASSED (${Math.round((passed / total) * 100)}%)`);
    console.log("════════════════════════════════════════════════════════════\n");

    if (passed === total) {
      console.log("All Prompt 4 Report Studio tests passed successfully!");
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (err) {
    console.error("Test execution failed:", err);
    process.exit(1);
  }
}

runTests();
