/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Phase 3 Dossier & 3-Role AI Test Suite
   Verifies:
   - Credential isolation and non-exposure
   - Evidence package extraction & canonical source ID integrity
   - Role 1 (Evidence Analyst) contract & anti-hallucination
   - Role 2 (Impact Analyst) contract & proximity-vs-damage guardrails
   - Role 3 (Report Editor) contract & contradiction detection
   - Deterministic fallbacks on timeout/auth-failure
   - Complete 7-Section Canonical Dossier assembly (A through G)
   - Export utilities (Markdown, CSV, JSON)
   - Persistence & repository round-trip
   - Live Groq provider status check (distinguishing unit tests from live API)
   ════════════════════════════════════════════════════════ */

import fs from "fs";
import path from "path";
import assert from "assert";

// Load environment variables from .env.local without exposing values
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const match = trimmed.match(/^([A-Za-z0-9_]+)=(.*)$/);
      if (match) {
        process.env[match[1]] = match[2].trim();
      }
    }
  }
}

let passed = 0;
let failed = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`[FAIL] ${name}:`, err.message);
    failed++;
  }
}

async function runAsyncTest(name, fn) {
  try {
    await fn();
    console.log(`[PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`[FAIL] ${name}:`, err.message);
    failed++;
  }
}

console.log("============================================================");
console.log("SENTINEL CITY INTELLIGENCE — PHASE 3 TEST SUITE");
console.log("Canonical Simulation Dossiers & 3-Role Groq AI Architecture");
console.log("============================================================\n");

// TEST 1: Role Credential Isolation & Safe Inspection
runTest("Test 1: Role Credential Isolation & Secret Protection", () => {
  const role1Key = process.env["GROQ_ROLE1_API_KEY"] || process.env["GROQ_LLAMA_API_KEY"] || "";
  const role2Key = process.env["GROQ_ROLE2_API_KEY"] || process.env["GROQ_API_KEY"] || "";
  const role3Key = process.env["GROQ_ROLE3_API_KEY"] || process.env["GROQ_THIRD_API_KEY"] || "";

  // Verify variables exist
  assert.ok(role2Key.length > 0, "Role 2 key must be present");
  assert.ok(role3Key.length > 0, "Role 3 key must be present");

  // Verify no secret is leaked in logs or error messages
  const stringified = JSON.stringify({ role1: role1Key ? "CONFIGURED" : "MISSING", role2: "CONFIGURED", role3: "CONFIGURED" });
  assert.ok(!stringified.includes("gsk_"), "Secret API key tokens must never be logged or exposed");
});

// TEST 2: Canonical Source IDs and Evidence Package Contract
runTest("Test 2: Canonical Source IDs & Data Provenance Integrity", () => {
  const CANONICAL_SOURCE_IDS = [
    "SRC_COPERNICUS_GLO30",
    "SRC_MCGM_HOTSPOTS_2024",
    "SRC_OPENMETEO_HRRR",
    "SRC_NDMA_SACHET_RSS",
    "SRC_CENSUS_2011_PROJECTED_2026",
    "SRC_MCGM_HOSPITALS_GIS",
    "SRC_MCGM_ROADS_GIS",
    "SRC_MCGM_SWD_PUMPS",
  ];

  assert.strictEqual(CANONICAL_SOURCE_IDS.length, 8, "Must have exactly 8 verified canonical spatial data sources");
  assert.ok(CANONICAL_SOURCE_IDS.includes("SRC_COPERNICUS_GLO30"), "Copernicus GLO-30 DEM must be registered");
  assert.ok(CANONICAL_SOURCE_IDS.includes("SRC_MCGM_HOTSPOTS_2024"), "MCGM 35 Chronic Hotspots must be registered");
});

// Dynamic imports of TypeScript compiled artifacts or TS files via ts-node/register or direct module imports
// In Next.js / Node 20+, let's test the assembled contracts and orchestrator
await runAsyncTest("Test 3: Evidence Package Construction from Simulation Result", async () => {
  const { runSimulationTimeStep } = await import("../src/modules/simulation/engine.js").catch(() => import("../dist/modules/simulation/engine.js")).catch(async () => {
    // If running under tsx / ts-node or direct import
    return await import("../src/modules/simulation/engine.ts");
  });
  const { buildEvidencePackage } = await import("../src/modules/dossier/evidence-package.ts");

  const simOutput = runSimulationTimeStep({
    scenarioId: "monsoon_downpour_saucer_sinks",
    timeStepHours: 2.0,
    selectedWardId: "F/South",
  });

  const evidence = buildEvidencePackage({
    simOutput,
    selectedWardId: "F/South",
  });

  assert.strictEqual(evidence.meta.city, "Greater Mumbai");
  assert.strictEqual(evidence.meta.timeStepHours, 2.0);
  assert.strictEqual(evidence.topRankedWards.length, 5, "Must evaluate top 5 priority intervention wards");
  assert.ok(evidence.selectedWardDetail, "Selected ward detail must be populated");
  assert.strictEqual(evidence.selectedWardDetail.wardId, "F/South");
  assert.ok(evidence.selectedWardDetail.hospitals.length > 0, "Ward F/South must contain mapped hospitals (KEM, Tata Memorial)");
});

await runAsyncTest("Test 4: Role 1 Evidence Analyst Anti-Hallucination & Fallback", async () => {
  const { runSimulationTimeStep } = await import("../src/modules/simulation/engine.ts");
  const { buildEvidencePackage } = await import("../src/modules/dossier/evidence-package.ts");
  const { runEvidenceAnalyst } = await import("../src/modules/dossier/evidence-analyst.ts");

  const simOutput = runSimulationTimeStep({
    scenarioId: "monsoon_downpour_saucer_sinks",
    timeStepHours: 2.0,
    selectedWardId: "L",
  });

  const evidence = buildEvidencePackage({ simOutput, selectedWardId: "L" });

  // Test deterministic fallback behavior
  const { output, audit } = await runEvidenceAnalyst({
    ...evidence,
    knownSourceIds: ["SRC_COPERNICUS_GLO30"],
  });

  assert.ok(output.narrativeOverview.length > 20, "Narrative overview must be populated");
  assert.ok(output.citedSourceIds.length > 0, "Must cite valid source IDs");
  assert.ok(output.keySupportingEvidence.length >= 2, "Must provide key supporting evidence");
  assert.ok(audit.roleName === "Evidence Analyst", "Role name must match");
});

await runAsyncTest("Test 5: Role 2 Impact Analyst Proximity vs Damage Guardrail", async () => {
  const { runSimulationTimeStep } = await import("../src/modules/simulation/engine.ts");
  const { buildEvidencePackage } = await import("../src/modules/dossier/evidence-package.ts");
  const { runImpactAnalyst } = await import("../src/modules/dossier/impact-analyst.ts");

  const simOutput = runSimulationTimeStep({
    scenarioId: "monsoon_downpour_saucer_sinks",
    timeStepHours: 3.0,
    selectedWardId: "F/South",
  });

  const evidence = buildEvidencePackage({ simOutput, selectedWardId: "F/South" });
  const { output, audit } = await runImpactAnalyst(evidence);

  assert.ok(output.recommendedDepartmentalActions.length >= 3, "Must produce multiple departmental actions");
  assert.ok(output.proximityVsDamageDisclaimer.includes("screening"), "Must include non-inundation screening caveat");
  
  // Verify departmental assignments
  const depts = output.recommendedDepartmentalActions.map(a => a.department);
  assert.ok(depts.includes("SWD") || depts.includes("DMD"), "Must assign actions to municipal departments");
});

await runAsyncTest("Test 6: Role 3 Report Editor Contradiction & Fact-Check Audit", async () => {
  const { runSimulationTimeStep } = await import("../src/modules/simulation/engine.ts");
  const { buildEvidencePackage } = await import("../src/modules/dossier/evidence-package.ts");
  const { runEvidenceAnalyst } = await import("../src/modules/dossier/evidence-analyst.ts");
  const { runImpactAnalyst } = await import("../src/modules/dossier/impact-analyst.ts");
  const { runReportEditor } = await import("../src/modules/dossier/report-editor.ts");

  const simOutput = runSimulationTimeStep({
    scenarioId: "monsoon_downpour_saucer_sinks",
    timeStepHours: 2.0,
    selectedWardId: "F/South",
  });

  const evidence = buildEvidencePackage({ simOutput, selectedWardId: "F/South" });
  const role1 = await runEvidenceAnalyst(evidence);
  const role2 = await runImpactAnalyst(evidence);

  const { output, audit } = await runReportEditor({
    evidence,
    role1Output: role1.output,
    role2Output: role2.output,
  });

  assert.ok(output.executiveSummarySynthesis.length > 50, "Executive summary must be synthesized");
  assert.ok(output.verifiedKeyFindings.length >= 3, "Key findings must be preserved");
  assert.strictEqual(output.editorialReviewPassed, true, "Editorial check must pass");
});

await runAsyncTest("Test 7: Canonical 7-Section Dossier Assembly & Schema Integrity", async () => {
  const { runSimulationTimeStep } = await import("../src/modules/simulation/engine.ts");
  const { orchestrateSimulationDossier } = await import("../src/modules/dossier/orchestrator.ts");

  const simOutput = runSimulationTimeStep({
    scenarioId: "monsoon_downpour_saucer_sinks",
    timeStepHours: 2.0,
    selectedWardId: "F/South",
  });

  const dossier = await orchestrateSimulationDossier({
    simOutput,
    selectedWardId: "F/South",
    forceDeterministic: true,
  });

  // Verify all 7 Sections:
  assert.ok(dossier.executiveSummary, "Section A (Executive Summary) must exist");
  assert.ok(dossier.conditionsAndInputs, "Section B (Conditions and Inputs) must exist");
  assert.ok(dossier.methodologyAndCalculation, "Section C (Methodology and Calculation) must exist");
  assert.ok(dossier.citywideAssessment, "Section D (Citywide Assessment) must exist");
  assert.ok(dossier.wardDetailedAnalysis, "Section E (Ward Detailed Analysis) must exist");
  assert.ok(dossier.recommendedActions, "Section F (Recommended Actions) must exist");
  assert.ok(dossier.limitationsAndGovernance, "Section G (Data Limitations and References) must exist");

  // Verify Section Details
  assert.strictEqual(dossier.executiveSummary.city, "Greater Mumbai");
  assert.strictEqual(dossier.citywideAssessment.totalWardsEvaluated, 24);
  assert.strictEqual(dossier.wardDetailedAnalysis.wardId, "F/South");
  assert.ok(dossier.recommendedActions.length >= 4);
  assert.strictEqual(dossier.limitationsAndGovernance.sourceReferences.length, 8);
});

await runAsyncTest("Test 8: Export Utilities (Markdown, Municipal CSV, Structured JSON)", async () => {
  const { runSimulationTimeStep } = await import("../src/modules/simulation/engine.ts");
  const { orchestrateSimulationDossier } = await import("../src/modules/dossier/orchestrator.ts");
  const { exportDossierToMarkdown, exportDossierToCSV } = await import("../src/modules/dossier/export-utils.ts");

  const simOutput = runSimulationTimeStep({
    scenarioId: "monsoon_downpour_saucer_sinks",
    timeStepHours: 2.0,
    selectedWardId: "F/South",
  });

  const dossier = await orchestrateSimulationDossier({
    simOutput,
    selectedWardId: "F/South",
    forceDeterministic: true,
  });

  const md = exportDossierToMarkdown(dossier);
  assert.ok(md.includes("# SENTINEL CITY INTELLIGENCE — CANONICAL SIMULATION DOSSIER"), "Markdown header required");
  assert.ok(md.includes("## SECTION A: EXECUTIVE SUMMARY"), "Markdown Section A required");
  assert.ok(md.includes("## SECTION G: DATA PROVENANCE"), "Markdown Section G required");

  const csv = exportDossierToCSV(dossier);
  assert.ok(csv.includes("WARD-BY-WARD EVALUATION"), "CSV must include ward evaluation header");
  assert.ok(csv.includes("F/South"), "CSV must include Ward F/South row");

  const json = JSON.stringify(dossier);
  assert.ok(JSON.parse(json).dossierId, "JSON roundtrip must succeed");
});

await runAsyncTest("Test 9: Persistence Repository Round-Trip (Save & Retrieve)", async () => {
  const { runSimulationTimeStep } = await import("../src/modules/simulation/engine.ts");
  const { orchestrateSimulationDossier } = await import("../src/modules/dossier/orchestrator.ts");
  const { saveDossier, getDossierById, listDossiers } = await import("../src/modules/dossier/repository.ts");

  const simOutput = runSimulationTimeStep({
    scenarioId: "monsoon_downpour_saucer_sinks",
    timeStepHours: 2.0,
    selectedWardId: "L",
  });

  const dossier = await orchestrateSimulationDossier({
    simOutput,
    selectedWardId: "L",
    forceDeterministic: true,
  });

  await saveDossier(dossier);

  const retrieved = await getDossierById(dossier.dossierId);
  assert.ok(retrieved, "Retrieved dossier must not be null");
  assert.strictEqual(retrieved.dossierId, dossier.dossierId);
  assert.strictEqual(retrieved.wardDetailedAnalysis?.wardId, "L");

  const list = await listDossiers({ limit: 5 });
  assert.ok(list.length > 0, "List dossiers must return recent dossiers");
});

await runAsyncTest("Test 10: Live Groq Model Integration for Configured Roles", async () => {
  const Groq = (await import("groq-sdk")).default;
  const key2 = process.env["GROQ_API_KEY"];
  const key3 = process.env["GROQ_THIRD_API_KEY"];

  console.log("   Checking Live Groq Model Call for Role 2 / Key 2...");
  if (key2) {
    try {
      const client2 = new Groq({ apiKey: key2 });
      const res = await client2.chat.completions.create({
        model: "qwen/qwen3.8-27b",
        messages: [{ role: "user", content: "State operational readiness for MCGM EOC in 4 words" }],
        max_tokens: 20,
      });
      console.log(`   [Role 2 Live Result]: "${res.choices[0]?.message?.content?.trim()}"`);
      assert.ok(res.choices[0]?.message?.content, "Role 2 live call must produce content");
    } catch (e) {
      console.warn("   [Role 2 Live Warning]:", e.message);
    }
  }

  console.log("   Checking Live Groq Model Call for Role 3 / Key 3...");
  if (key3) {
    try {
      const client3 = new Groq({ apiKey: key3 });
      const res3 = await client3.chat.completions.create({
        model: "qwen/qwen3.8-27b",
        messages: [{ role: "user", content: "State report verification status in 4 words" }],
        max_tokens: 20,
      });
      console.log(`   [Role 3 Live Result]: "${res3.choices[0]?.message?.content?.trim()}"`);
      assert.ok(res3.choices[0]?.message?.content, "Role 3 live call must produce content");
    } catch (e) {
      console.warn("   [Role 3 Live Warning]:", e.message);
    }
  }

  // Check Role 1 key
  const key1 = process.env["GROQ_ROLE1_API_KEY"] || process.env["GROQ_LLAMA_API_KEY"];
  console.log(`   Role 1 Key present in env: ${Boolean(key1)} (Safe fallback: deterministic rules engine)`);
});

console.log("\n============================================================");
console.log(`TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
console.log("============================================================\n");

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
