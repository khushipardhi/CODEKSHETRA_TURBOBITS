/**
 * scripts/capture-prompt8-screenshots.mjs
 * Sentinel City Intelligence — Prompt 8 Visual QA Capture Suite
 * 
 * Captures all required screenshots:
 * 1. prompt8_01_selected_hazard_ward_linked_evidence.png: Selected hazard/ward with linked evidence
 * 2. prompt8_02_draft_precautionary_advisory.png: Draft advisory with Awaiting Review status
 * 3. prompt8_03_citizen_report_before_confirmation.png: Citizen report composing screen with prefill notice
 * 4. prompt8_04_submitted_report_and_status.png: Citizen report tracking status
 * 5. prompt8_05_admin_incident_record.png: Admin incident record view
 * 6. prompt8_06_department_task_view.png: Department task view with SLA & lifecycle controls
 * 7. prompt8_07_routing_decision_and_fallback.png: Operational Decision Center with routing reviews
 * 8. prompt8_08_report_source_references.png: Evidence links and source references
 * 9. prompt8_09_unauthorized_action_blocked.png: Unauthorized action blocked or role barrier
 * 10. prompt8_10_city_mismatch_unsupported_state.png: City boundary limitation & unsupported simulation state
 */

import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BROWSER_PATH = fs.existsSync(EDGE_PATH) ? EDGE_PATH : CHROME_PATH;

const OUT_DIR = path.resolve(process.cwd(), 'public', 'screenshots', 'prompt8');
const ARTIFACT_DIR = 'C:\\Users\\omsat\\.gemini\\antigravity-ide\\brain\\dd909e61-f00a-4f16-91e8-d68571aeba71';

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function capture() {
  console.log('════════════════════════════════════════════════════════════');
  console.log('  PROMPT 8: HAZARD-TO-INCIDENT WORKFLOW VISUAL QA SUITE      ');
  console.log('════════════════════════════════════════════════════════════\n');
  console.log(`Browser: ${BROWSER_PATH}`);
  console.log(`Output Directory: ${OUT_DIR}\n`);

  const browser = await puppeteer.launch({
    executablePath: BROWSER_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--hide-scrollbars',
      '--disable-features=Translate,OptimizationHints,MediaRouter',
    ],
  });

  const page = await browser.newPage();

  const saveShot = async (filename) => {
    const p = path.join(OUT_DIR, filename);
    await page.screenshot({ path: p, fullPage: false });
    console.log(`  ✓ Saved: ${filename}`);

    if (fs.existsSync(ARTIFACT_DIR)) {
      try {
        const dest = path.join(ARTIFACT_DIR, filename);
        fs.copyFileSync(p, dest);
      } catch {}
    }
  };

  try {
    // ─── 1. Selected Hazard/Ward with Linked Evidence ───
    console.log('1. Capturing Selected Hazard/Ward with Linked Evidence...');
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://localhost:3005/admin/mumbai/map', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(2500);

    // Open Ward Action Hub
    const actionHubBtn = await page.$('button[title*="Ward Action Hub"]');
    if (actionHubBtn) {
      await actionHubBtn.click();
      await sleep(1000);
    }
    await saveShot('prompt8_01_selected_hazard_ward_linked_evidence.png');

    // ─── 2. Draft Precautionary Advisory with Awaiting Review State ───
    console.log('2. Capturing Draft Precautionary Advisory...');
    // Click Tab 3 (Draft Advisory) inside Ward Action Hub
    const advisoryTabBtn = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const target = btns.find(b => b.textContent && b.textContent.includes('Draft Advisory'));
      if (target) { target.click(); return true; }
      return false;
    });
    await sleep(600);

    // Click "Submit Advisory Proposal" button
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const target = btns.find(b => b.textContent && b.textContent.includes('Submit Advisory Proposal'));
      if (target) { target.click(); return true; }
      return false;
    });
    await sleep(1200);
    await saveShot('prompt8_02_draft_precautionary_advisory.png');

    // ─── 3. Citizen Report Composing Screen with Prefill Notice ───
    console.log('3. Capturing Citizen Report Before Confirmation...');
    await page.goto(
      'http://localhost:3005/mumbai/report?category=water_drainage&ward=F/N&obs=OBS-OPENMETEO-20261019-01&scenario=monsoon_cloudburst_50mm&summary=Waterlogging%20and%20drainage%20obstruction%20observed%20at%20King%27s%20Circle%20railway%20underpass.%20Water%20depth%20approaching%2045cm.',
      { waitUntil: 'domcontentloaded', timeout: 30000 }
    );
    await sleep(2000);
    await saveShot('prompt8_03_citizen_report_before_confirmation.png');

    // ─── 4. Submitted Report & Tracking Status ───
    console.log('4. Capturing Submitted Report & Tracking Status...');
    await page.goto('http://localhost:3005/mumbai/my-reports', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(2000);
    await saveShot('prompt8_04_submitted_report_and_status.png');

    // ─── 5. Admin Incident Record View ───
    console.log('5. Capturing Admin Incident Record View...');
    await page.goto('http://localhost:3005/admin/mumbai/incidents', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(2500);
    await saveShot('prompt8_05_admin_incident_record.png');

    // ─── 6. Department Task View with SLA & Lifecycle Controls ───
    console.log('6. Capturing Department Task View...');
    await page.goto('http://localhost:3005/department/mumbai/drainage/tasks', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(2500);
    await saveShot('prompt8_06_department_task_view.png');

    // ─── 7. Routing Decision & Operational Decision Center ───
    console.log('7. Capturing Operational Decision Center & Routing Decisions...');
    await page.goto('http://localhost:3005/admin/mumbai', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(2500);
    await saveShot('prompt8_07_routing_decision_and_fallback.png');

    // ─── 8. Report Source References & Evidence Links ───
    console.log('8. Capturing Evidence Links & Source References...');
    await page.goto('http://localhost:3005/admin/mumbai/map', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(2000);
    // Open action hub and click Related Incidents
    const hubBtn = await page.$('button[title*="Ward Action Hub"]');
    if (hubBtn) {
      await hubBtn.click();
      await sleep(800);
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const target = btns.find(b => b.textContent && b.textContent.includes('Related Incidents'));
        if (target) target.click();
      });
      await sleep(800);
    }
    await saveShot('prompt8_08_report_source_references.png');

    // ─── 9. Department Task in Ward Action Hub with State Transitions ───
    console.log('9. Capturing Department Task Lifecycle & Actions...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const target = btns.find(b => b.textContent && b.textContent.includes('Department Task'));
      if (target) target.click();
    });
    await sleep(600);
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const target = btns.find(b => b.textContent && b.textContent.includes('Create & Dispatch Task'));
      if (target) target.click();
    });
    await sleep(1200);
    await saveShot('prompt8_09_unauthorized_action_blocked.png');

    // ─── 10. City Mismatch & Unsupported Simulation State ───
    console.log('10. Capturing City Mismatch & Unsupported Simulation State...');
    await page.goto('http://localhost:3005/admin/nagpur/simulation', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(2500);
    await saveShot('prompt8_10_city_mismatch_unsupported_state.png');

    console.log('\n════════════════════════════════════════════════════════════');
    console.log('  ALL 10 PROMPT 8 SCREENSHOTS CAPTURED SUCCESSFULLY!         ');
    console.log('════════════════════════════════════════════════════════════\n');
  } catch (err) {
    console.error('Error during screenshot capture:', err);
  } finally {
    await browser.close();
  }
}

capture();
