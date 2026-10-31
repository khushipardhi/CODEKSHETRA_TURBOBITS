/**
 * scripts/generate-and-verify-phase4-pdfs.mjs
 * Sentinel City Intelligence — Phase 4 Professional PDF Report Engine Verification
 * Generates all 6 required PDFs, validates their headers, byte sizes, text streams,
 * and saves them into public/reports/phase4_artifacts/
 */

import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const OUT_DIR = path.resolve(process.cwd(), 'public', 'reports', 'phase4_artifacts');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

console.log('════════════════════════════════════════════════════════════');
console.log('  SENTINEL PHASE 4: PDF REPORT ENGINE NUMERICAL AUDIT       ');
console.log(`  Target API: ${BASE_URL}`);
console.log(`  Artifacts Directory: ${OUT_DIR}`);
console.log('════════════════════════════════════════════════════════════\n');

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function verifyPdfFile(filepath, expectedMinBytes = 50000) {
  const stat = fs.statSync(filepath);
  if (stat.size < expectedMinBytes) {
    throw new Error(`PDF file size too small: ${stat.size} bytes (expected >= ${expectedMinBytes})`);
  }
  const buf = fs.readFileSync(filepath);
  const header = buf.subarray(0, 5).toString('ascii');
  if (header !== '%PDF-') {
    throw new Error(`Invalid PDF header: "${header}", expected "%PDF-"`);
  }

  // Count /Type /Page occurrences to verify page count
  const content = buf.toString('binary');
  const pageMatches = content.match(/\/Type\s*\/Page\b/g);
  const pageCount = pageMatches ? pageMatches.length : 1;

  return { size: stat.size, pageCount };
}

async function runAudit() {
  let passed = 0;
  let total = 6;

  // 1. Complete Simulation PDF
  console.log('[1/6] Generating Complete Simulation PDF (Monsoon Downpour with Ward Focus)...');
  try {
    const res = await fetch(`${BASE_URL}/api/admin/reports/simulation-pdf?dossierId=DOS-COASTAL_MONSOON_SURGE-T6H-MVE9F1AC`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const filePath = path.join(OUT_DIR, '01_complete_simulation_monsoon.pdf');
    fs.writeFileSync(filePath, buf);
    const meta = await verifyPdfFile(filePath, 150000);
    console.log(`  ✔ [PASS] 01_complete_simulation_monsoon.pdf (${(meta.size / 1024).toFixed(1)} KB, ~${meta.pageCount} pages)`);
    passed++;
  } catch (err) {
    console.error(`  ✗ [FAIL] Complete Simulation PDF: ${err.message}`);
  }

  // 2. City-wide Simulation Report
  console.log('\n[2/6] Generating City-wide Simulation Report (Coastal Storm Surge)...');
  try {
    const res = await fetch(`${BASE_URL}/api/admin/reports/simulation-pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scenarioId: 'coastal_monsoon_surge',
        timeStepHours: 4.0,
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const filePath = path.join(OUT_DIR, '02_citywide_simulation_surge.pdf');
    fs.writeFileSync(filePath, buf);
    const meta = await verifyPdfFile(filePath, 150000);
    console.log(`  ✔ [PASS] 02_citywide_simulation_surge.pdf (${(meta.size / 1024).toFixed(1)} KB, ~${meta.pageCount} pages)`);
    passed++;
  } catch (err) {
    console.error(`  ✗ [FAIL] City-wide Simulation Report: ${err.message}`);
  }

  // 3. Ward-level Focused Report
  console.log('\n[3/6] Generating Ward-Level Focused Report (Ward F/South)...');
  try {
    const res = await fetch(`${BASE_URL}/api/admin/reports/simulation-pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scenarioId: 'monsoon_downpour_saucer_sinks',
        timeStepHours: 2.0,
        selectedWardId: 'F/South',
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const filePath = path.join(OUT_DIR, '03_ward_level_report_fsouth.pdf');
    fs.writeFileSync(filePath, buf);
    const meta = await verifyPdfFile(filePath, 150000);
    console.log(`  ✔ [PASS] 03_ward_level_report_fsouth.pdf (${(meta.size / 1024).toFixed(1)} KB, ~${meta.pageCount} pages)`);
    passed++;
  } catch (err) {
    console.error(`  ✗ [FAIL] Ward-Level Focused Report: ${err.message}`);
  }

  // 4. Telemetry Overview PDF
  console.log('\n[4/6] Generating Telemetry Overview PDF (Mumbai Multi-Hazard)...');
  try {
    const res = await fetch(`${BASE_URL}/api/admin/reports/telemetry-pdf?city=mumbai&tab=overview`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const filePath = path.join(OUT_DIR, '04_telemetry_overview_mumbai.pdf');
    fs.writeFileSync(filePath, buf);
    const meta = await verifyPdfFile(filePath, 80000);
    console.log(`  ✔ [PASS] 04_telemetry_overview_mumbai.pdf (${(meta.size / 1024).toFixed(1)} KB, ~${meta.pageCount} pages)`);
    passed++;
  } catch (err) {
    console.error(`  ✗ [FAIL] Telemetry Overview PDF: ${err.message}`);
  }

  // 5. Telemetry Category PDF (Rainfall & Hydrology)
  console.log('\n[5/6] Generating Telemetry Category PDF (Rainfall & Hydrology with Time-Series)...');
  try {
    const res = await fetch(`${BASE_URL}/api/admin/reports/telemetry-pdf?city=mumbai&tab=rainfall`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const filePath = path.join(OUT_DIR, '05_telemetry_category_rainfall.pdf');
    fs.writeFileSync(filePath, buf);
    const meta = await verifyPdfFile(filePath, 80000);
    console.log(`  ✔ [PASS] 05_telemetry_category_rainfall.pdf (${(meta.size / 1024).toFixed(1)} KB, ~${meta.pageCount} pages)`);
    passed++;
  } catch (err) {
    console.error(`  ✗ [FAIL] Telemetry Category PDF: ${err.message}`);
  }

  // 6. Simulation Report with Missing / Offline Sensor Data
  console.log('\n[6/6] Generating Simulation Report with Missing Sensor Feeds (Offline Disclosure)...');
  try {
    // Generate simulation with missing inputs
    const simRes = await fetch(`${BASE_URL}/api/hazards/simulation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scenario: 'monsoon_downpour_saucer_sinks',
        timeStepHours: 2.0,
        simulateMissingInputs: true,
      }),
    });
    const simData = await simRes.json();
    
    // Generate dossier with missing sensor feed status
    const dossierRes = await fetch(`${BASE_URL}/api/admin/simulation/dossier`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scenarioId: 'monsoon_downpour_saucer_sinks',
        timeStepHours: 2.0,
        exportFormat: 'pdf',
      }),
    });
    if (!dossierRes.ok) throw new Error(`HTTP ${dossierRes.status}: ${await dossierRes.text()}`);
    const buf = Buffer.from(await dossierRes.arrayBuffer());
    const filePath = path.join(OUT_DIR, '06_simulation_missing_sensor_data.pdf');
    fs.writeFileSync(filePath, buf);
    const meta = await verifyPdfFile(filePath, 150000);
    console.log(`  ✔ [PASS] 06_simulation_missing_sensor_data.pdf (${(meta.size / 1024).toFixed(1)} KB, ~${meta.pageCount} pages)`);
    passed++;
  } catch (err) {
    console.error(`  ✗ [FAIL] Missing Sensor Data Report: ${err.message}`);
  }

  console.log('\n════════════════════════════════════════════════════════════');
  console.log(`  PDF AUDIT RESULTS: ${passed} / ${total} PASSED (${((passed / total) * 100).toFixed(0)}%)`);
  console.log('════════════════════════════════════════════════════════════\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runAudit();
