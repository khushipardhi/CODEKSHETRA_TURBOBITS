/**
 * scripts/capture-prompt4-screenshots.mjs
 * Sentinel City Intelligence — Prompt 4 Report Studio Visual Capture Suite
 */

import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BROWSER_PATH = fs.existsSync(EDGE_PATH) ? EDGE_PATH : CHROME_PATH;

const OUT_DIR = path.resolve(process.cwd(), 'public', 'screenshots', 'prompt4');
const ARTIFACT_DIR = 'C:\\Users\\omsat\\.gemini\\antigravity-ide\\brain\\dd909e61-f00a-4f16-91e8-d68571aeba71';

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function capture() {
  console.log('════════════════════════════════════════════════════════════');
  console.log('  PROMPT 4: DEDICATED SIMULATION REPORT STUDIO SCREENSHOTS  ');
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

  // Helper to save and copy to artifact dir
  const saveShot = (filename) => {
    const p = path.join(OUT_DIR, filename);
    const artP = path.join(ARTIFACT_DIR, filename);
    if (fs.existsSync(p)) {
      try {
        fs.copyFileSync(p, artP);
      } catch (e) {
        // ignore artifact copy if not accessible
      }
    }
  };

  try {
    // ─── 1. City-wide Overview (prompt4_01_citywide_overview.png) ───
    console.log('[1/9] Capturing prompt4_01_citywide_overview.png...');
    await page.setViewport({ width: 1440, height: 950 });
    await page.goto('http://localhost:3005/admin/mumbai/simulation/report?scenario=monsoon_downpour_saucer_sinks&t=2.0', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });
    await page.waitForSelector('#sec-citywide', { timeout: 15000 });
    await sleep(2500);

    // Scroll to city-wide section
    await page.evaluate(() => {
      const el = document.getElementById('sec-citywide');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
    await sleep(1000);
    const path1 = path.join(OUT_DIR, 'prompt4_01_citywide_overview.png');
    await page.screenshot({ path: path1 });
    saveShot('prompt4_01_citywide_overview.png');
    console.log(`  ✓ Saved ${path1}`);

    // ─── 2. Full Ward-Level Dossier (prompt4_02_ward_level_dossier.png) ───
    console.log('[2/9] Capturing prompt4_02_ward_level_dossier.png...');
    await page.evaluate(() => {
      // Switch scope to ward_detail
      const buttons = Array.from(document.querySelectorAll('button'));
      const wardBtn = buttons.find(b => b.textContent && b.textContent.includes('Ward Dossier:'));
      if (wardBtn) wardBtn.click();
      const wardSec = document.getElementById('sec-ward');
      if (wardSec) wardSec.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
    await sleep(2000);
    const path2 = path.join(OUT_DIR, 'prompt4_02_ward_level_dossier.png');
    await page.screenshot({ path: path2 });
    saveShot('prompt4_02_ward_level_dossier.png');
    console.log(`  ✓ Saved ${path2}`);

    // ─── 3. Report Navigation (prompt4_03_report_navigation.png) ───
    console.log('[3/9] Capturing prompt4_03_report_navigation.png...');
    await page.evaluate(() => {
      window.scrollTo(0, 0);
    });
    await sleep(1000);
    const path3 = path.join(OUT_DIR, 'prompt4_03_report_navigation.png');
    await page.screenshot({ path: path3 });
    saveShot('prompt4_03_report_navigation.png');
    console.log(`  ✓ Saved ${path3}`);

    // ─── 4. Population & Asset Exposure Sections (prompt4_04_population_asset_sections.png) ───
    console.log('[4/9] Capturing prompt4_04_population_asset_sections.png...');
    await page.evaluate(() => {
      const el = document.getElementById('sec-assets');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
    await sleep(1500);
    const path4 = path.join(OUT_DIR, 'prompt4_04_population_asset_sections.png');
    await page.screenshot({ path: path4 });
    saveShot('prompt4_04_population_asset_sections.png');
    console.log(`  ✓ Saved ${path4}`);

    // ─── 5. Formula & Source References (prompt4_05_formula_source_references.png) ───
    console.log('[5/9] Capturing prompt4_05_formula_source_references.png...');
    await page.evaluate(() => {
      const el = document.getElementById('sec-formulas');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
    await sleep(1500);
    const path5 = path.join(OUT_DIR, 'prompt4_05_formula_source_references.png');
    await page.screenshot({ path: path5 });
    saveShot('prompt4_05_formula_source_references.png');
    console.log(`  ✓ Saved ${path5}`);

    // ─── 6. Recommended Municipal Actions (prompt4_06_recommended_municipal_actions.png) ───
    console.log('[6/9] Capturing prompt4_06_recommended_municipal_actions.png...');
    await page.evaluate(() => {
      const el = document.getElementById('sec-actions');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
    await sleep(1500);
    const path6 = path.join(OUT_DIR, 'prompt4_06_recommended_municipal_actions.png');
    await page.screenshot({ path: path6 });
    saveShot('prompt4_06_recommended_municipal_actions.png');
    console.log(`  ✓ Saved ${path6}`);

    // ─── 7. Export / Print View (prompt4_07_export_print_view.png) ───
    console.log('[7/9] Capturing prompt4_07_export_print_view.png...');
    await page.emulateMediaType('print');
    await page.evaluate(() => {
      window.scrollTo(0, 0);
    });
    await sleep(2000);
    const path7 = path.join(OUT_DIR, 'prompt4_07_export_print_view.png');
    await page.screenshot({ path: path7 });
    saveShot('prompt4_07_export_print_view.png');
    console.log(`  ✓ Saved ${path7}`);
    await page.emulateMediaType('screen'); // Restore

    // ─── 8. Report with Incomplete Data Warning (prompt4_08_incomplete_data_warning.png) ───
    console.log('[8/9] Capturing prompt4_08_incomplete_data_warning.png...');
    await page.goto('http://localhost:3005/admin/mumbai/simulation/report?scenario=monsoon_downpour_saucer_sinks&missing=1', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });
    await page.waitForSelector('#sec-governance', { timeout: 15000 });
    await sleep(2000);
    await page.evaluate(() => {
      const el = document.getElementById('sec-governance');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
    await sleep(1500);
    const path8 = path.join(OUT_DIR, 'prompt4_08_incomplete_data_warning.png');
    await page.screenshot({ path: path8 });
    saveShot('prompt4_08_incomplete_data_warning.png');
    console.log(`  ✓ Saved ${path8}`);

    // ─── 9. Narrow / Mobile Viewport (prompt4_09_mobile_viewport.png) ───
    console.log('[9/9] Capturing prompt4_09_mobile_viewport.png...');
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await page.goto('http://localhost:3005/admin/mumbai/simulation/report?scenario=monsoon_downpour_saucer_sinks&t=2.0', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });
    await page.waitForSelector('#sec-exec', { timeout: 15000 });
    await sleep(2500);
    const path9 = path.join(OUT_DIR, 'prompt4_09_mobile_viewport.png');
    await page.screenshot({ path: path9 });
    saveShot('prompt4_09_mobile_viewport.png');
    console.log(`  ✓ Saved ${path9}`);

    console.log('\n════════════════════════════════════════════════════════════');
    console.log('  ALL 9 PROMPT 4 SCREENSHOTS SUCCESSFULLY CAPTURED!        ');
    console.log('════════════════════════════════════════════════════════════\n');
  } catch (err) {
    console.error('Error during screenshot capture:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

capture();
