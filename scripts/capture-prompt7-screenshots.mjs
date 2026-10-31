/**
 * scripts/capture-prompt7-screenshots.mjs
 * Sentinel City Intelligence — Prompt 7 Visual QA Capture Suite
 * 
 * Captures all required screenshots:
 * 1. prompt7_01_telemetry_overview.png: Telemetry overview with trustworthy key metrics & explainable insights
 * 2. prompt7_02_parameter_explorer.png: Parameter Explorer and category filters
 * 3. prompt7_03_weather_atmosphere_category.png: Weather & Atmosphere category workspace
 * 4. prompt7_04_rainfall_hydrology_category.png: Rainfall & Hydrology category workspace
 * 5. prompt7_05_coastal_marine_category.png: Coastal & Marine category workspace (Mumbai)
 * 6. prompt7_06_valid_graph_source_time.png: Valid graph with source/time information & "NOW" marker
 * 7. prompt7_07_empty_unavailable_data.png: Empty/unavailable-data chart with honest disclosure
 * 8. prompt7_08_zone_comparison_view.png: Zone comparison view with grid-snapping detection
 * 9. prompt7_09_historical_versus_current.png: Historical ERA5 baseline vs current forecast view
 * 10. prompt7_10_parameter_to_spatial_analysis.png: Parameter-to-spatial-analysis navigation & 7-point drawer
 * 11. prompt7_11_source_health_view.png: 7-point provider health & data quality matrix
 * 12. prompt7_12_dark_theme_active_tabs.png: Active-tab styling in dark theme
 * 13. prompt7_13_responsive_mobile_layout.png: Responsive layouts on mobile viewport (390px)
 */

import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BROWSER_PATH = fs.existsSync(EDGE_PATH) ? EDGE_PATH : CHROME_PATH;

const OUT_DIR = path.resolve(process.cwd(), 'public', 'screenshots', 'prompt7');
const ARTIFACT_DIR = 'C:\\Users\\omsat\\.gemini\\antigravity-ide\\brain\\dd909e61-f00a-4f16-91e8-d68571aeba71';

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function capture() {
  console.log('════════════════════════════════════════════════════════════');
  console.log('  PROMPT 7: TELEMETRY INTELLIGENCE VISUAL QA SCREENSHOTS     ');
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
    const artP = path.join(ARTIFACT_DIR, filename);
    await page.screenshot({ path: p, fullPage: false });
    try {
      fs.copyFileSync(p, artP);
    } catch (e) {
      // ignore
    }
    const stat = fs.statSync(p);
    console.log(`  📸 Saved: ${filename} (${Math.round(stat.size / 1024)} KB)`);
  };

  try {
    // ─── 1. TELEMETRY OVERVIEW DESKTOP ──────────────────────
    console.log('[1/13] Capturing Telemetry Overview with Key Metrics...');
    await page.setViewport({ width: 1440, height: 960 });
    await page.goto('http://localhost:3005/admin/mumbai/telemetry-lab?tab=overview', { waitUntil: 'networkidle2' });
    await sleep(2500);
    await saveShot('prompt7_01_telemetry_overview.png');

    // ─── 2. PARAMETER EXPLORER & FILTERS ────────────────────
    console.log('[2/13] Capturing Parameter Explorer & Filter Toolbar...');
    await page.goto('http://localhost:3005/admin/mumbai/telemetry-lab?tab=parameters', { waitUntil: 'networkidle2' });
    await sleep(1500);
    await saveShot('prompt7_02_parameter_explorer.png');

    // ─── 3. WEATHER & ATMOSPHERE CATEGORY ───────────────────
    console.log('[3/13] Capturing Weather & Atmosphere Workspace...');
    await page.goto('http://localhost:3005/admin/mumbai/telemetry-lab?tab=weather', { waitUntil: 'networkidle2' });
    await sleep(1500);
    await saveShot('prompt7_03_weather_atmosphere_category.png');

    // ─── 4. RAINFALL & HYDROLOGY CATEGORY ───────────────────
    console.log('[4/13] Capturing Rainfall & Hydrology Workspace...');
    await page.goto('http://localhost:3005/admin/mumbai/telemetry-lab?tab=rainfall', { waitUntil: 'networkidle2' });
    await sleep(1500);
    await saveShot('prompt7_04_rainfall_hydrology_category.png');

    // ─── 5. COASTAL & MARINE CATEGORY (MUMBAI) ──────────────
    console.log('[5/13] Capturing Coastal & Marine Workspace (Mumbai)...');
    await page.goto('http://localhost:3005/admin/mumbai/telemetry-lab?tab=marine', { waitUntil: 'networkidle2' });
    await sleep(1500);
    await saveShot('prompt7_05_coastal_marine_category.png');

    // ─── 6. VALID GRAPH WITH SOURCE / TIME & NOW MARKER ─────
    console.log('[6/13] Capturing High-Precision Graph with Source & Time...');
    await page.goto('http://localhost:3005/admin/mumbai/telemetry-lab?tab=weather', { waitUntil: 'networkidle2' });
    await sleep(1500);
    // Scroll slightly to focus on the barometric or wind graph
    await page.evaluate(() => window.scrollBy(0, 180));
    await sleep(500);
    await saveShot('prompt7_06_valid_graph_source_time.png');

    // ─── 7. EMPTY / UNAVAILABLE DATA CHART ──────────────────
    console.log('[7/13] Capturing Honest Empty / Unavailable-Data Chart...');
    // We can view Nagpur Marine tab which honestly explains inland geographical limitation
    await page.goto('http://localhost:3005/admin/nagpur/telemetry-lab?tab=marine', { waitUntil: 'networkidle2' });
    await sleep(1500);
    await saveShot('prompt7_07_empty_unavailable_data.png');

    // ─── 8. ZONE COMPARISON WITH GRID SNAPPING ──────────────
    console.log('[8/13] Capturing Zone Comparison & Grid Snapping Detection...');
    await page.goto('http://localhost:3005/admin/nagpur/telemetry-lab?tab=comparison', { waitUntil: 'networkidle2' });
    await sleep(2000);
    await saveShot('prompt7_08_zone_comparison_view.png');

    // ─── 9. HISTORICAL VERSUS CURRENT BASELINE ──────────────
    console.log('[9/13] Capturing Historical Baseline vs Current Forecast...');
    await page.goto('http://localhost:3005/admin/mumbai/telemetry-lab?tab=historical&startDate=2024-07-01&endDate=2024-07-07', { waitUntil: 'networkidle2' });
    await sleep(2500);
    await saveShot('prompt7_09_historical_versus_current.png');

    // ─── 10. PARAMETER TO SPATIAL ANALYSIS DRAWER ───────────
    console.log('[10/13] Capturing Parameter-to-Spatial-Analysis Navigation Drawer...');
    await page.goto('http://localhost:3005/admin/mumbai/telemetry-lab?tab=parameters&param=precipitation', { waitUntil: 'networkidle2' });
    await sleep(1500);
    await saveShot('prompt7_10_parameter_to_spatial_analysis.png');

    // ─── 11. SOURCE HEALTH & 7-POINT DATA QUALITY ───────────
    console.log('[11/13] Capturing 7-Point Provider Quality & Health Matrix...');
    await page.goto('http://localhost:3005/admin/mumbai/telemetry-lab?tab=health', { waitUntil: 'networkidle2' });
    await sleep(1500);
    await saveShot('prompt7_11_source_health_view.png');

    // ─── 12. ACTIVE-TAB STYLING IN DARK THEME ───────────────
    console.log('[12/13] Capturing Dark Theme Active Tabs & Styling...');
    await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);
    await page.evaluate(() => document.documentElement.classList.add('dark'));
    await page.goto('http://localhost:3005/admin/mumbai/telemetry-lab?tab=overview', { waitUntil: 'networkidle2' });
    await page.evaluate(() => document.documentElement.classList.add('dark'));
    await sleep(1500);
    await saveShot('prompt7_12_dark_theme_active_tabs.png');

    // Reset dark mode
    await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);
    await page.evaluate(() => document.documentElement.classList.remove('dark'));

    // ─── 13. RESPONSIVE MOBILE VIEWPORT (390px) ─────────────
    console.log('[13/13] Capturing Responsive Mobile Layout (390px)...');
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await page.goto('http://localhost:3005/admin/mumbai/telemetry-lab?tab=overview', { waitUntil: 'networkidle2' });
    await sleep(2000);
    await saveShot('prompt7_13_responsive_mobile_layout.png');

    console.log('\n✔ All 13 Prompt 7 Visual QA Screenshots captured successfully!');
  } catch (err) {
    console.error('Screenshot capture failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

capture();
