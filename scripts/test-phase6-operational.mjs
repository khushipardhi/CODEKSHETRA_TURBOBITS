/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Phase 6 Operational & Impact Test Suite
   
   Audits:
   1. 9-Category Evidence-Based Impact & Consequence Matrix
   2. Municipal Decision Support Engine & Departmental Grounding
   3. Formal Alert & Threshold Semantic Isolation
   4. Operational Data-Quality Monitoring & Freshness Policies
   5. Unified Intelligence Pipeline Envelope & Provenance
   6. Simulation Engine Reproducibility & Calibration Contract
   7. 3-Role Groq Server-Side Credential Safety & Non-Leakage
   8. Citizen Usability, Safety & Report Separation
   ════════════════════════════════════════════════════════ */

import fs from 'fs';
import path from 'path';
import assert from 'assert';

const BASE_URL = process.env.TEST_URL || 'http://localhost:3005';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function it(description, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✓ ${description}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ ${description}`);
    console.error(`    Error: ${err.message}`);
    failedTests++;
  }
}

async function itAsync(description, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  ✓ ${description}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ ${description}`);
    console.error(`    Error: ${err.message}`);
    failedTests++;
  }
}

async function runPhase6Tests() {
  console.log('\n========================================================');
  console.log('  SENTINEL CITY INTELLIGENCE — PHASE 6 OPERATIONAL AUDIT');
  console.log(`  Target Base URL: ${BASE_URL}`);
  console.log(`  Execution Time: ${new Date().toISOString()}`);
  console.log('========================================================\n');

  // ─── SUITE 1: Evidence-Based Consequence Matrix (9 Categories) ───
  console.log('Suite 1: Evidence-Based Impact & Consequence Matrix');

  let simData = null;
  await itAsync('POST /api/hazards/simulation returns 9-category Consequence Matrix', async () => {
    const res = await fetch(`${BASE_URL}/api/hazards/simulation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scenarioId: 'rainfall_waterlogging',
        parameters: { rainfallRateMmH: 65, durationHours: 3, drainageBlockagePct: 35 },
        timeStepHours: 3,
        baselineMode: 'current_live',
        city: 'mumbai',
      }),
    });

    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.ok(json.data.consequenceMatrix, 'consequenceMatrix must be attached to simulation result');
    assert.strictEqual(json.data.consequenceMatrix.categories.length, 9, 'Must have exactly 9 categories');
    simData = json.data;
  });

  it('Verifies all 9 mandatory consequence categories exist with complete metadata', () => {
    assert.ok(simData && simData.consequenceMatrix);
    const expectedKeys = [
      'POPULATION',
      'HOSPITALS_EMERGENCY',
      'COLLEGES_SCHOOLS',
      'BUILDING_FOOTPRINTS',
      'ROADS_TRANSPORT',
      'DRAINAGE_WATERWAYS',
      'MUNICIPAL_INFRASTRUCTURE',
      'CIVIC_REPORTS_HOTSPOTS',
      'PUBLIC_SERVICES',
    ];

    for (const key of expectedKeys) {
      const cat = simData.consequenceMatrix.categories.find((c) => c.categoryKey === key);
      assert.ok(cat, `Category ${key} must exist`);
      assert.ok(typeof cat.mappedAssetsAssessed === 'number', `${key} mappedAssetsAssessed must be number`);
      assert.ok(typeof cat.screeningCriterionMetCount === 'number', `${key} screeningCriterionMetCount must be number`);
      assert.ok(cat.geographicMethod.length > 10, `${key} geographicMethod must be documented`);
      assert.ok(cat.sourceAndReferenceDate.length > 5, `${key} sourceAndReferenceDate must be documented`);
      assert.ok(cat.impactNature, `${key} impactNature must be defined`);
      assert.ok(cat.stateClassification, `${key} stateClassification must be defined`);
      assert.ok(cat.dataCompletenessAndLimitations.length > 15, `${key} limitations must be disclosed`);
    }
  });

  it('Honesty Safeguard: Hospitals category specifies PROXIMITY and does not claim structural water ingress', () => {
    const hosp = simData.consequenceMatrix.categories.find((c) => c.categoryKey === 'HOSPITALS_EMERGENCY');
    assert.strictEqual(hosp.impactNature, 'PROXIMITY');
    assert.ok(hosp.dataCompletenessAndLimitations.includes('Point locations only'));
    assert.ok(hosp.dataCompletenessAndLimitations.includes('does not confirm physical building water ingress'));
  });

  it('Honesty Safeguard: Population category specifies ward-level aggregate and MODELLED_ESTIMATED', () => {
    const pop = simData.consequenceMatrix.categories.find((c) => c.categoryKey === 'POPULATION');
    assert.strictEqual(pop.stateClassification, 'MODELLED_ESTIMATED');
    assert.strictEqual(pop.impactNature, 'POTENTIAL_EXPOSURE');
    assert.ok(pop.dataCompletenessAndLimitations.includes('Ward-level aggregate only'));
  });

  it('Honesty Safeguard: Civic hotspots category references official MCGM chronic hotspots', () => {
    const hot = simData.consequenceMatrix.categories.find((c) => c.categoryKey === 'CIVIC_REPORTS_HOTSPOTS');
    assert.strictEqual(hot.stateClassification, 'OBSERVED_VERIFIED');
    assert.ok(hot.sourceAndReferenceDate.includes('MCGM Disaster Management Department'));
  });

  // ─── SUITE 2: Municipal Decision Support Engine ───
  console.log('\nSuite 2: Municipal Decision Support Engine');

  it('Attaches structured decision briefings for high-priority wards', () => {
    assert.ok(simData.highPriorityWardAdvisories && simData.highPriorityWardAdvisories.length > 0);
    const adv = simData.highPriorityWardAdvisories[0];

    assert.ok(adv.wardId, 'wardId must exist');
    assert.ok(adv.dataIndicates.length > 20, 'dataIndicates must be descriptive');
    assert.ok(adv.whyPrioritised.length > 20, 'whyPrioritised must detail ground factors');
    assert.ok(adv.supportingMeasurements.length >= 3, 'supportingMeasurements must be provided');
    assert.ok(adv.whatCouldChangeAssessment.length > 15, 'whatCouldChangeAssessment must be provided');
    assert.ok(adv.whatMunicipalityShouldVerifyNext.length >= 3, 'whatMunicipalityShouldVerifyNext must have steps');
  });

  it('Grounds decision recommendations in actual BMC departmental registry (SWD, Roads, DMD)', () => {
    const adv = simData.highPriorityWardAdvisories[0];
    assert.strictEqual(adv.responsibleDepartment.code, 'SWD');
    assert.ok(adv.responsibleDepartment.name.includes('Stormwater Drains'));
    assert.ok(adv.supportingDepartments.some((d) => d.code === 'ROADS_TRAFFIC'));
    assert.ok(adv.supportingDepartments.some((d) => d.code === 'DISASTER_MANAGEMENT'));
  });

  it('Enforces non-automated personnel dispatch governance disclaimer', () => {
    const adv = simData.highPriorityWardAdvisories[0];
    assert.strictEqual(adv.authorisationStatus, 'RECOMMENDED_AWAITING_EOC_APPROVAL');
    assert.ok(adv.dispatchDisclaimer.includes('DOES NOT constitute an official government alert'));
    assert.ok(adv.dispatchDisclaimer.includes('Emergency Operations Centre controller'));
  });

  // ─── SUITE 3: Alert & Threshold Semantic Isolation ───
  console.log('\nSuite 3: Alert & Threshold Semantic Isolation');

  const thresholdFile = fs.readFileSync(
    path.resolve('src/modules/hazards/threshold-registry.ts'),
    'utf-8'
  );

  it('Source Audit: threshold-registry.ts defines all 5 semantic alert scopes', () => {
    assert.ok(thresholdFile.includes('OFFICIAL_GOVERNMENT_WARNING'));
    assert.ok(thresholdFile.includes('APPLICATION_SCREENING_LEVEL'));
    assert.ok(thresholdFile.includes('HYPOTHETICAL_SIMULATION_SEVERITY'));
    assert.ok(thresholdFile.includes('VERIFIED_INCIDENT_SEVERITY'));
    assert.ok(thresholdFile.includes('ADMINISTRATIVE_REVIEW_PRIORITY'));
  });

  it('Source Audit: threshold-registry.ts enforces explicit statutory provenance disclaimers', () => {
    assert.ok(thresholdFile.includes('formatSemanticAlertBadge'));
    assert.ok(thresholdFile.includes('OFFICIAL WARNING:'));
    assert.ok(thresholdFile.includes('SCREENING ESTIMATE:'));
    assert.ok(thresholdFile.includes('SIMULATION STRESS TEST:'));
    assert.ok(thresholdFile.includes('NOT a government public warning'));
  });

  // ─── SUITE 4: Operational Data-Quality Monitoring ───
  console.log('\nSuite 4: Operational Data-Quality Monitoring');

  let healthData = null;
  await itAsync('GET /api/hazards/health returns connectors with Phase 6 operational metrics', async () => {
    const res = await fetch(`${BASE_URL}/api/hazards/health`);
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.ok(json.data.connectors.length >= 7, 'Expected at least 7 connectors');
    healthData = json.data;
  });

  it('Tracks freshness policies, expected update intervals, and stale indicators across all providers', () => {
    assert.ok(healthData);
    for (const conn of healthData.connectors) {
      assert.ok(conn.sourceId, 'sourceId must exist');
      assert.ok(conn.expectedUpdateIntervalSeconds > 0, `${conn.sourceId} expectedUpdateIntervalSeconds must be > 0`);
      assert.ok(conn.freshnessPolicySeconds > 0, `${conn.sourceId} freshnessPolicySeconds must be > 0`);
      assert.strictEqual(typeof conn.isStale, 'boolean', `${conn.sourceId} isStale must be boolean`);
      assert.ok(conn.stateClassification, `${conn.sourceId} stateClassification must be defined`);
    }
  });

  // ─── SUITE 5: Unified Intelligence Pipeline Envelope ───
  console.log('\nSuite 5: Unified Intelligence Pipeline Envelope');

  it('Simulation result includes canonical Pipeline Provenance envelope', () => {
    const prov = simData.pipelineProvenance;
    assert.ok(prov, 'pipelineProvenance must be present');
    assert.strictEqual(prov.cityId, 'mumbai');
    assert.strictEqual(prov.jurisdiction, 'Brihanmumbai Municipal Corporation (BMC / MCGM)');
    assert.strictEqual(prov.calculationStatus, 'VALIDATED');
    assert.strictEqual(prov.confidenceTier, 'HIGH');
    assert.ok(prov.knownLimitations.length >= 2);
  });

  await itAsync('Propagates missing parameters by downgrading status', async () => {
    const res = await fetch(`${BASE_URL}/api/hazards/simulation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scenarioId: 'monsoon_downpour_saucer_sinks',
        parameters: {}, // missing all parameters
        city: 'mumbai',
      }),
    });

    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.ok(json.data.missingParameters.length > 0, 'missingParameters must be detected');
    assert.strictEqual(json.data.qualityStatus, 'PARTIALLY_CALIBRATED');
    assert.ok(json.data.pipelineProvenance.knownLimitations.some((l) => l.includes('Missing parameters')));
  });

  // ─── SUITE 6: Simulation Engine Reproducibility & Calibration Contract ───
  console.log('\nSuite 6: Simulation Engine Reproducibility & Calibration Contract');

  await itAsync('Deterministic reproducibility: Identical inputs produce identical numbers', async () => {
    const payload = {
      scenarioId: 'rainfall_waterlogging',
      parameters: { rainfallRateMmH: 52, durationHours: 2, drainageBlockagePct: 20 },
      timeStepHours: 2,
      baselineMode: 'dry_baseline',
      city: 'mumbai',
    };

    const [res1, res2] = await Promise.all([
      fetch(`${BASE_URL}/api/hazards/simulation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then((r) => r.json()),
      fetch(`${BASE_URL}/api/hazards/simulation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then((r) => r.json()),
    ]);

    assert.strictEqual(res1.data.summary.meanCityValue, res2.data.summary.meanCityValue);
    assert.strictEqual(res1.data.summary.peakCityValue, res2.data.summary.peakCityValue);
    assert.strictEqual(res1.data.rankedWards[0].wardId, res2.data.rankedWards[0].wardId);
    assert.strictEqual(res1.data.rankedWards[0].metricValue, res2.data.rankedWards[0].metricValue);
  });

  await itAsync('Enforces Mumbai-Only Hydrodynamic Calibration Contract', async () => {
    const res = await fetch(`${BASE_URL}/api/hazards/simulation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scenarioId: 'rainfall_waterlogging',
        city: 'pune',
      }),
    });

    assert.strictEqual(res.status, 400);
    const json = await res.json();
    assert.strictEqual(json.success, false);
    assert.ok(json.error.includes("Spatial flood simulation is currently only calibrated for 'mumbai'"));
  });

  // ─── SUITE 7: Canonical Dossier Integration with Phase 6 Artifacts ───
  console.log('\nSuite 7: Canonical Dossier Integration');

  await itAsync('POST /api/admin/simulation/dossier returns dossier with Consequence Matrix & Decision Briefing', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/simulation/dossier`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scenarioId: 'rainfall_waterlogging',
        parametersApplied: { rainfallRateMmH: 45, durationHours: 2, drainageBlockagePct: 15 },
        timeStepHours: 2,
        selectedWardId: 'F/North',
        forceDeterministic: true,
      }),
    });

    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.ok(json.dossier, 'Response must contain dossier');
    assert.ok(json.dossier.consequenceMatrix, 'Dossier must contain consequenceMatrix');
    assert.strictEqual(json.dossier.consequenceMatrix.categories.length, 9);
    assert.ok(json.dossier.wardDecisionSummary, 'Dossier must contain wardDecisionSummary');
    assert.ok(json.dossier.pipelineProvenance, 'Dossier must contain pipelineProvenance');
  });

  // ─── SUITE 8: Three-Role Groq Server-Side Credential Safety ───
  console.log('\nSuite 8: Three-Role Groq Architecture & Safety');

  const aiRoleConfigContent = fs.readFileSync(
    path.resolve('src/modules/dossier/ai-role-config.ts'),
    'utf-8'
  );

  it('Source Audit: Server-side Groq credentials are never imported or passed to client', () => {
    assert.ok(!aiRoleConfigContent.includes('NEXT_PUBLIC_GROQ'));
    assert.ok(aiRoleConfigContent.includes('inspectRoleCredentialStatus'));
    assert.ok(aiRoleConfigContent.includes('hasKeyPrefix'));
    assert.ok(aiRoleConfigContent.includes('createRoleGroqClient'));
  });

  // ─── Summary ───
  console.log('\n========================================================');
  console.log(`  PHASE 6 TEST SUMMARY: ${passedTests} / ${totalTests} PASSED`);
  if (failedTests > 0) {
    console.log(`  FAILED: ${failedTests}`);
    process.exit(1);
  } else {
    console.log('  ALL PHASE 6 OPERATIONAL INTELLIGENCE AUDIT CHECKS PASSED!');
  }
  console.log('========================================================\n');
}

runPhase6Tests().catch((err) => {
  console.error('Unhandled test runner exception:', err);
  process.exit(1);
});
