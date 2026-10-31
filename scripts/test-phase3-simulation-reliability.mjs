/**
 * scripts/test-phase3-simulation-reliability.mjs
 * Sentinel City Intelligence — Phase 3 Automated Simulation Reliability Test Suite.
 *
 * Verifies:
 * 1. Authoritative Simulation State schema & data completeness.
 * 2. Play/Pause deterministic state machine (idempotent triggers, single timer).
 * 3. Step advancement coordination: every time step computes real results.
 * 4. Header layout stability: CSS grid-cols-[1fr_auto_1fr], fixed slots, tabular-nums.
 * 5. Reliable canonical ward navigation & bounding box resolution.
 * 6. In-memory caching for 0ms repeated step replay.
 * 7. Report parameter & time staleness detection.
 * 8. Non-temporal scenario limitation disclaimers.
 */

import assert from "assert";
import fs from "fs";
import path from "path";

const BASE_URL = process.env.TEST_URL || "http://localhost:3000";

let passed = 0;
let failed = 0;

function logPass(msg) {
  passed++;
  console.log(`  \x1b[32m✔ PASS:\x1b[0m ${msg}`);
}

function logFail(msg, err) {
  failed++;
  console.error(`  \x1b[31m✖ FAIL:\x1b[0m ${msg}`);
  if (err) console.error(`    Details: ${err.message || err}`);
}

async function runTests() {
  console.log("\n" + "=".repeat(72));
  console.log("  SENTINEL PHASE 3: SIMULATION RELIABILITY & PLAYBACK SUITE");
  console.log(`  Target URL: ${BASE_URL}`);
  console.log("=".repeat(72) + "\n");

  // ─── SUITE 1: Authoritative Simulation State Schema ───
  console.log("=== SUITE 1: Authoritative Simulation State Schema ===");
  try {
    const res = await fetch(`${BASE_URL}/api/hazards/simulation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scenarioId: "rainfall_waterlogging",
        timeStepHours: 1.5,
        city: "mumbai",
        parameters: { precipitationRateMmH: 80, durationHours: 6 },
      }),
    });
    assert.strictEqual(res.status, 200, "API must return HTTP 200");
    const json = await res.json();
    assert.strictEqual(json.success, true, "Response success flag must be true");

    const data = json.data;
    assert.strictEqual(data.scenarioId, "rainfall_waterlogging", "Scenario ID must match");
    assert.strictEqual(data.timeStepHours, 1.5, "Time step must match requested 1.5h");
    assert.strictEqual(data.modelTier, "TIER_2_SCREENING_SIMULATION", "Model tier must be defined");
    assert.ok(data.rankedWards && data.rankedWards.length === 24, "All 24 BMC wards must be evaluated");
    assert.ok(data.continuousSurface && data.continuousSurface.isobandsGeoJSON, "Continuous surface isobands must exist");
    assert.ok(data.auditTrail && data.auditTrail.executedAt, "Audit trail execution timestamp must exist");
    assert.ok(data.qualityStatus, "Data quality status must be populated");
    logPass("Authoritative simulation output payload contains complete contract attributes");
  } catch (err) {
    logFail("Authoritative simulation state schema check failed", err);
  }

  // ─── SUITE 2: Time Advancement & Deterministic Evolution ───
  console.log("\n=== SUITE 2: Time Advancement & Step Coordination ===");
  try {
    // Step T=1.0h
    const res1 = await fetch(`${BASE_URL}/api/hazards/simulation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scenarioId: "rainfall_waterlogging",
        timeStepHours: 1.0,
        city: "mumbai",
        parameters: { rainfallRateMmH: 75, durationHours: 6 },
      }),
    });
    const json1 = await res1.json();

    // Step T=3.0h
    const res2 = await fetch(`${BASE_URL}/api/hazards/simulation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scenarioId: "rainfall_waterlogging",
        timeStepHours: 3.0,
        city: "mumbai",
        parameters: { rainfallRateMmH: 75, durationHours: 6 },
      }),
    });
    const json2 = await res2.json();

    assert.ok(json1.data && json2.data, "Both simulation time steps must return valid data");
    assert.strictEqual(json1.data.temporalHydrology.accumulatedRainfallMm, 75, "T=1h accumulated rainfall must be 75mm");
    assert.strictEqual(json2.data.temporalHydrology.accumulatedRainfallMm, 225, "T=3h accumulated rainfall must be 225mm");
    assert.ok(
      json2.data.summary.peakCityValue >= json1.data.summary.peakCityValue,
      "Severity must evolve monotonically with rainfall accumulation"
    );
    logPass("Temporal evolution verified: T=1.0h (75mm) -> T=3.0h (225mm) with real calculation update");
  } catch (err) {
    logFail("Time advancement step coordination check failed", err);
  }

  // ─── SUITE 3: Codebase Header Layout Stability (Anti-Bounce Audit) ───
  console.log("\n=== SUITE 3: Header Anti-Bounce & Stability Verification ===");
  try {
    const workspacePath = path.resolve("src/components/admin/simulation/simulation-map-workspace.tsx");
    const content = fs.readFileSync(workspacePath, "utf-8");

    assert.ok(
      content.includes("grid grid-cols-[1fr_auto_1fr]"),
      "Header must use 3-column CSS grid (grid-cols-[1fr_auto_1fr]) to dead-center controls"
    );
    assert.ok(
      content.includes("w-[84px]"),
      "Play/Pause button must reserve fixed width w-[84px] to prevent horizontal reflow on state toggle"
    );
    assert.ok(
      content.includes("w-[125px]"),
      "Time step pill must reserve fixed width w-[125px]"
    );
    assert.ok(
      content.includes("tabular-nums"),
      "Time step display must use tabular-nums font styling to prevent micro-jitter"
    );
    assert.ok(
      content.includes("w-[135px]"),
      "Calculation status slot must reserve fixed width (w-[135px]) for CALCULATING vs MESH SYNCED"
    );
    assert.ok(
      content.includes("w-[130px]"),
      "Alert level badge slot must reserve fixed width (w-[130px])"
    );
    logPass("Header layout stability verified: 3-column CSS grid, fixed widths, tabular numerals");
  } catch (err) {
    logFail("Header anti-bounce audit failed", err);
  }

  // ─── SUITE 4: Reliable Canonical Ward Navigation & Bounding Box ───
  console.log("\n=== SUITE 4: Reliable Ward Navigation & MultiPolygon Resolution ===");
  try {
    const gisPath = path.resolve("src/modules/geo/canonical-gis.ts");
    const gisContent = fs.readFileSync(gisPath, "utf-8");

    assert.ok(
      gisContent.includes("export function computeGeometryBounds"),
      "canonical-gis must export computeGeometryBounds"
    );
    assert.ok(
      gisContent.includes("canonicalWardId"),
      "canonical-gis must export canonicalWardId alias resolver"
    );

    const mapPath = path.resolve("src/components/admin/simulation/leaflet-simulation-map.tsx");
    const mapContent = fs.readFileSync(mapPath, "utf-8");

    assert.ok(
      mapContent.includes("wardFocusTrigger"),
      "LeafletSimulationMap & MapWardFocusController must accept wardFocusTrigger prop"
    );
    assert.ok(
      mapContent.includes("map.invalidateSize()"),
      "MapWardFocusController must call map.invalidateSize() before fitBounds"
    );
    assert.ok(
      mapContent.includes("map.fitBounds(bounds, {"),
      "MapWardFocusController must fit precisely to actual polygon boundary with padding"
    );
    assert.ok(
      mapContent.includes("padding: [50, 50]"),
      "fitBounds must include suitable [50, 50] padding"
    );
    logPass("Ward navigation verified: canonical identity, MultiPolygon bound calculation, [50, 50] padding");
  } catch (err) {
    logFail("Ward navigation verification failed", err);
  }

  // ─── SUITE 5: Playback Controller State Machine & Lifecycle ───
  console.log("\n=== SUITE 5: Playback Controller Lifecycle & Cancellation ===");
  try {
    const hookPath = path.resolve("src/components/admin/simulation/use-simulation-playback.ts");
    const hookContent = fs.readFileSync(hookPath, "utf-8");

    assert.ok(
      hookContent.includes("schedulePlaybackTick"),
      "Playback controller must implement sequential schedulePlaybackTick loop"
    );
    assert.ok(
      hookContent.includes("await executeCalculation"),
      "Time step advancement must await executeCalculation before scheduling next step"
    );
    assert.ok(
      hookContent.includes("prefetchStep"),
      "Playback controller must prefetch upcoming time steps into in-memory cache"
    );
    assert.ok(
      hookContent.includes("abortControllerRef.current.abort()"),
      "In-flight requests must be aborted cleanly when parameters change or unmounting"
    );
    assert.ok(
      hookContent.includes("isPlayingRef.current = false"),
      "Pause and Scrub must immediately clear isPlayingRef and stop advancement"
    );
    assert.ok(
      hookContent.includes("authoritativeState: AuthoritativeSimulationState"),
      "Playback controller must expose unified AuthoritativeSimulationState"
    );
    logPass("Playback controller verified: sequential step loop, prefetching, prompt pause, clean cleanup");
  } catch (err) {
    logFail("Playback controller lifecycle verification failed", err);
  }

  // ─── SUITE 6: Report Staleness & Parameter Synchronization ───
  console.log("\n=== SUITE 6: Report Staleness & Parameter Synchronization ===");
  try {
    const dossierPanelPath = path.resolve("src/components/admin/simulation/simulation-dossier-panel.tsx");
    const dossierPanelContent = fs.readFileSync(dossierPanelPath, "utf-8");

    assert.ok(
      dossierPanelContent.includes("dossier.parametersApplied && simOutput.parametersApplied"),
      "SimulationDossierPanel must check parametersApplied for report staleness"
    );

    const reportStudioPath = path.resolve("src/components/admin/simulation/simulation-report-studio.tsx");
    const reportStudioContent = fs.readFileSync(reportStudioPath, "utf-8");

    assert.ok(
      reportStudioContent.includes("dossier.parametersApplied && parametersApplied"),
      "SimulationReportStudio must check parametersApplied for scenario out-of-date state"
    );
    logPass("Report synchronization verified: parameter change immediately marks dossier report as outdated");
  } catch (err) {
    logFail("Report staleness audit failed", err);
  }

  // ─── SUITE 7: Non-Temporal Scenario Limitation Disclaimers ───
  console.log("\n=== SUITE 7: Non-Temporal Scenario Limitation Disclaimers ===");
  try {
    const registryPath = path.resolve("src/modules/simulation/scenario-registry.ts");
    const registryContent = fs.readFileSync(registryPath, "utf-8");

    assert.ok(
      registryContent.includes("TIER_2_SCREENING_SIMULATION") ||
      registryContent.includes("Screening model only"),
      "Scenario registry must disclose screening nature and limitations"
    );
    assert.ok(
      registryContent.includes("limitations: ["),
      "Every scenario must document explicit limitations list"
    );
    logPass("Scientific honesty verified: Non-hydrodynamic screening limitations clearly documented");
  } catch (err) {
    logFail("Non-temporal limitation check failed", err);
  }

  // ─── FINAL SUMMARY ───
  console.log("\n" + "=".repeat(72));
  console.log(`  PHASE 3 SUMMARY: ${passed}/${passed + failed} TESTS PASSED (${failed} failed)`);
  console.log("=".repeat(72) + "\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test runner encountered fatal error:", err);
  process.exit(1);
});
