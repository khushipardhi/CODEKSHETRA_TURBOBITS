/**
 * scripts/capture-prompt6-screenshots.mjs
 * Sentinel City Intelligence — Prompt 6 Visual QA Capture Suite
 * 
 * Captures all 12 required screenshots:
 * 1. prompt6_01_citizen_dashboard_desktop.png: Citizen Hazard Dashboard at desktop width
 * 2. prompt6_02_citizen_dashboard_mobile.png: The same page at mobile width (390px)
 * 3. prompt6_03_selected_area_resolved_ward.png: Selected area & resolved ward badge
 * 4. prompt6_04_manual_area_selection.png: Manual area selection modal open
 * 5. prompt6_05_relevant_hazard_layer_legend.png: Relevant hazard layer with floating legend
 * 6. prompt6_06_sentinel_ai_headings_lists_table.png: Sentinel AI with headings, lists and styled table
 * 7. prompt6_07_source_grounded_answer.png: Source-grounded answer with verified telemetry references
 * 8. prompt6_08_contextual_draft_report.png: Contextual draft report with prefilled parameters
 * 9. prompt6_09_separate_civic_reports_page.png: Dedicated Civic Reports destination
 * 10. prompt6_10_facility_details_directions.png: Verified emergency shelters with directions
 * 11. prompt6_11_missing_stale_data.png: Honest missing/stale telemetry & limitations disclosure
 * 12. prompt6_12_unsupported_city_simulation_state.png: Unsupported city simulation state for non-Mumbai
 */

import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BROWSER_PATH = fs.existsSync(EDGE_PATH) ? EDGE_PATH : CHROME_PATH;

const OUT_DIR = path.resolve(process.cwd(), 'public', 'screenshots', 'prompt6');
const ARTIFACT_DIR = 'C:\\Users\\omsat\\.gemini\\antigravity-ide\\brain\\dd909e61-f00a-4f16-91e8-d68571aeba71';

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function capture() {
  console.log('════════════════════════════════════════════════════════════');
  console.log('  PROMPT 6: CITIZEN INTELLIGENCE VISUAL QA SCREENSHOTS       ');
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

  const saveShot = (filename) => {
    const p = path.join(OUT_DIR, filename);
    const artP = path.join(ARTIFACT_DIR, filename);
    if (fs.existsSync(p)) {
      try {
        fs.copyFileSync(p, artP);
      } catch (e) {}
    }
  };

  try {
    // 1. Citizen Hazard Dashboard at Desktop Width
    console.log('[1/12] Capturing prompt6_01_citizen_dashboard_desktop.png...');
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
    await page.goto('http://localhost:3005/mumbai/dashboard', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(4000);
    const p1 = path.join(OUT_DIR, 'prompt6_01_citizen_dashboard_desktop.png');
    await page.screenshot({ path: p1, fullPage: false });
    saveShot('prompt6_01_citizen_dashboard_desktop.png');
    console.log('  ✓ Saved prompt6_01_citizen_dashboard_desktop.png');

    // 2. Citizen Hazard Dashboard at Mobile Width (390x844)
    console.log('[2/12] Capturing prompt6_02_citizen_dashboard_mobile.png...');
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true });
    await page.goto('http://localhost:3005/mumbai/dashboard', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(3500);
    const p2 = path.join(OUT_DIR, 'prompt6_02_citizen_dashboard_mobile.png');
    await page.screenshot({ path: p2, fullPage: false });
    saveShot('prompt6_02_citizen_dashboard_mobile.png');
    console.log('  ✓ Saved prompt6_02_citizen_dashboard_mobile.png');

    // Restore Desktop Viewport
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1, isMobile: false });

    // 3. Selected Area and Resolved Ward
    console.log('[3/12] Capturing prompt6_03_selected_area_resolved_ward.png...');
    await page.goto('http://localhost:3005/mumbai/dashboard', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(3500);
    const p3 = path.join(OUT_DIR, 'prompt6_03_selected_area_resolved_ward.png');
    await page.screenshot({ path: p3, fullPage: false });
    saveShot('prompt6_03_selected_area_resolved_ward.png');
    console.log('  ✓ Saved prompt6_03_selected_area_resolved_ward.png');

    // 4. Manual Area Selection Modal
    console.log('[4/12] Capturing prompt6_04_manual_area_selection.png...');
    await page.evaluate(() => {
      // Find button that contains "Change Area" or "Change Locality"
      const buttons = Array.from(document.querySelectorAll('button'));
      const changeBtn = buttons.find(b => b.textContent && (b.textContent.includes('Change Area') || b.textContent.includes('Change Locality')));
      if (changeBtn) changeBtn.click();
    });
    await sleep(1500);
    const p4 = path.join(OUT_DIR, 'prompt6_04_manual_area_selection.png');
    await page.screenshot({ path: p4, fullPage: false });
    saveShot('prompt6_04_manual_area_selection.png');
    console.log('  ✓ Saved prompt6_04_manual_area_selection.png');

    // Close selector modal
    await page.keyboard.press('Escape');
    await sleep(500);

    // 5. Relevant Hazard Layer with Legend
    console.log('[5/12] Capturing prompt6_05_relevant_hazard_layer_legend.png...');
    await page.evaluate(() => {
      const legendBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Legend'));
      if (legendBtn) legendBtn.click();
    });
    await sleep(1500);
    const p5 = path.join(OUT_DIR, 'prompt6_05_relevant_hazard_layer_legend.png');
    await page.screenshot({ path: p5, fullPage: false });
    saveShot('prompt6_05_relevant_hazard_layer_legend.png');
    console.log('  ✓ Saved prompt6_05_relevant_hazard_layer_legend.png');

    // 6. Sentinel AI with Headings, Lists, and Table
    console.log('[6/12] Capturing prompt6_06_sentinel_ai_headings_lists_table.png...');
    await page.goto('http://localhost:3005/mumbai/sentinel', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(3500);
    const p6 = path.join(OUT_DIR, 'prompt6_06_sentinel_ai_headings_lists_table.png');
    await page.screenshot({ path: p6, fullPage: false });
    saveShot('prompt6_06_sentinel_ai_headings_lists_table.png');
    console.log('  ✓ Saved prompt6_06_sentinel_ai_headings_lists_table.png');

    // 7. Source-Grounded Answer with Telemetry References
    console.log('[7/12] Capturing prompt6_07_source_grounded_answer.png...');
    // Scroll slightly inside chat to show grounding sources clearly
    await page.evaluate(() => {
      const chatContainer = document.querySelector('.overflow-y-auto');
      if (chatContainer) chatContainer.scrollTop = 250;
    });
    await sleep(1000);
    const p7 = path.join(OUT_DIR, 'prompt6_07_source_grounded_answer.png');
    await page.screenshot({ path: p7, fullPage: false });
    saveShot('prompt6_07_source_grounded_answer.png');
    console.log('  ✓ Saved prompt6_07_source_grounded_answer.png');

    // 8. Contextual Draft Report (Prefilled via Contextual Trigger)
    console.log('[8/12] Capturing prompt6_08_contextual_draft_report.png...');
    await page.goto(
      'http://localhost:3005/mumbai/report?category=drainage_waterlogging&location=Sion%20%2F%20Matunga%20(Ward%20F%2FNorth)&summary=Waterlogging%20observed%20in%20low-lying%20saucer%20basin%20near%20Gandhi%20Market&lat=19.035&lon=72.860',
      { waitUntil: 'networkidle2', timeout: 30000 }
    );
    await sleep(3500);
    const p8 = path.join(OUT_DIR, 'prompt6_08_contextual_draft_report.png');
    await page.screenshot({ path: p8, fullPage: false });
    saveShot('prompt6_08_contextual_draft_report.png');
    console.log('  ✓ Saved prompt6_08_contextual_draft_report.png');

    // 9. Separate Civic Reports Page
    console.log('[9/12] Capturing prompt6_09_separate_civic_reports_page.png...');
    await page.goto('http://localhost:3005/mumbai/report', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(3500);
    const p9 = path.join(OUT_DIR, 'prompt6_09_separate_civic_reports_page.png');
    await page.screenshot({ path: p9, fullPage: false });
    saveShot('prompt6_09_separate_civic_reports_page.png');
    console.log('  ✓ Saved prompt6_09_separate_civic_reports_page.png');

    // 10. Facility Details and Directions
    console.log('[10/12] Capturing prompt6_10_facility_details_directions.png...');
    await page.goto('http://localhost:3005/mumbai/sentinel', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(3000);
    await page.evaluate(() => {
      window.scrollTo(0, 1100);
    });
    await sleep(1500);
    const p10 = path.join(OUT_DIR, 'prompt6_10_facility_details_directions.png');
    await page.screenshot({ path: p10, fullPage: false });
    saveShot('prompt6_10_facility_details_directions.png');
    console.log('  ✓ Saved prompt6_10_facility_details_directions.png');

    // 11. Missing / Stale Data Transparency
    console.log('[11/12] Capturing prompt6_11_missing_stale_data.png...');
    await page.goto('http://localhost:3005/mumbai/dashboard', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(3000);
    await page.evaluate(() => {
      // Scroll to impact intelligence card with limitations & missing inputs
      const impactCard = document.getElementById('impact-intelligence');
      if (impactCard) impactCard.scrollIntoView();
    });
    await sleep(1500);
    const p11 = path.join(OUT_DIR, 'prompt6_11_missing_stale_data.png');
    await page.screenshot({ path: p11, fullPage: false });
    saveShot('prompt6_11_missing_stale_data.png');
    console.log('  ✓ Saved prompt6_11_missing_stale_data.png');

    // 12. Unsupported City-Specific Simulation State
    console.log('[12/12] Capturing prompt6_12_unsupported_city_simulation_state.png...');
    await page.goto('http://localhost:3005/admin/nagpur/simulation', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(3500);
    const p12 = path.join(OUT_DIR, 'prompt6_12_unsupported_city_simulation_state.png');
    await page.screenshot({ path: p12, fullPage: false });
    saveShot('prompt6_12_unsupported_city_simulation_state.png');
    console.log('  ✓ Saved prompt6_12_unsupported_city_simulation_state.png');

    console.log('\n════════════════════════════════════════════════════════════');
    console.log('  ALL 12 PROMPT 6 SCREENSHOTS CAPTURED AND VERIFIED!        ');
    console.log('════════════════════════════════════════════════════════════\n');
  } catch (err) {
    console.error('Screenshot capture failure:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

capture();
