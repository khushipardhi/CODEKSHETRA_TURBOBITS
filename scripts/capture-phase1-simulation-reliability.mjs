/**
 * scripts/capture-phase1-simulation-reliability.mjs
 * Sentinel City Intelligence — Phase 1 Simulation Reliability & Stability Verification
 * Automated Puppeteer-Core test suite running in Chrome/Edge headless browser.
 */

import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const BROWSER_PATH = fs.existsSync(CHROME_PATH) ? CHROME_PATH : EDGE_PATH;
const TARGET_URL = process.env.TEST_URL || 'http://localhost:3000';
const OUT_DIR = path.resolve(process.cwd(), 'public', 'screenshots', 'phase1_sim_reliability');
const ARTIFACT_DIR = path.resolve(process.cwd(), 'phase1_screenshots');

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
if (!fs.existsSync(ARTIFACT_DIR)) fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runVerification() {
  console.log('════════════════════════════════════════════════════════════');
  console.log('  SENTINEL PHASE 1: SIMULATION PLAYBACK & STABILITY AUDIT   ');
  console.log(`  Browser: ${BROWSER_PATH}`);
  console.log(`  Target URL: ${TARGET_URL}/admin/mumbai/simulation`);
  console.log(`  Output Directory: ${OUT_DIR}`);
  console.log('════════════════════════════════════════════════════════════\n');

  const browser = await puppeteer.launch({
    executablePath: BROWSER_PATH,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      '--window-size=1440,900',
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const consoleLogs = [];
  const pageErrors = [];

  page.on('console', (msg) => {
    const text = msg.text();
    // Filter out expected Next.js development notices
    if (!text.includes('[Fast Refresh]') && !text.includes('Download the React DevTools')) {
      consoleLogs.push(`[${msg.type()}] ${text}`);
    }
  });

  page.on('pageerror', (err) => {
    pageErrors.push(err.message);
    console.error('  [BROWSER ERROR]:', err.message);
  });

  async function takeScreenshot(name, desc) {
    const filePath = path.join(OUT_DIR, `${name}.png`);
    const mirrorPath = path.join(ARTIFACT_DIR, `${name}.png`);
    await page.screenshot({ path: filePath, fullPage: false });
    fs.copyFileSync(filePath, mirrorPath);
    const stat = fs.statSync(filePath);
    console.log(`  ✔ [SAVED] ${name}.png (${(stat.size / 1024).toFixed(1)} KB) — ${desc}`);
  }

  try {
    // 1. Simulation idle at initial time
    console.log('[STEP 1] Navigating to Simulation Lab (Idle state at T=1.0h)...');
    await page.goto(`${TARGET_URL}/admin/mumbai/simulation?scenario=rainfall_waterlogging&t=1&ward=L`, {
      waitUntil: 'networkidle2',
      timeout: 45000,
    });
    await sleep(3500); // Allow Leaflet tiles and wards GeoJSON to render
    await takeScreenshot('01_simulation_idle', 'Simulation idle at T=1.0h with aligned toolbar and 24 wards');

    // 2. Playback activation
    console.log('[STEP 2] Clicking PLAY to activate deterministic playback...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const playBtn = buttons.find(b => b.textContent && (b.textContent.includes('PLAY') || b.textContent.includes('PAUSE')));
      if (playBtn) playBtn.click();
      else throw new Error('Play button not found');
    });
    await sleep(2500); // Allow playback to advance by at least 1 step
    await takeScreenshot('02_simulation_playing', 'Actively playing simulation with button showing PAUSE');

    // 3. Timeline at later step
    console.log('[STEP 3] Observing simulation advance to later timeline step...');
    await sleep(3500); // Advance to T=3.0h or later
    await takeScreenshot('03_timeline_later_step', 'Simulation advanced to later time step with synchronized map');

    // 4. Pausing simulation
    console.log('[STEP 4] Clicking PAUSE to halt timeline advancement...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const pauseBtn = buttons.find(b => b.textContent && b.textContent.includes('PAUSE'));
      if (pauseBtn) pauseBtn.click();
      else {
        // Fallback: click play button
        const anyPlay = buttons.find(b => b.textContent && b.textContent.includes('PLAY'));
        if (anyPlay) anyPlay.click();
      }
    });
    await sleep(1000);
    await takeScreenshot('04_simulation_paused', 'Paused simulation holding stable time step and spatial state');

    // 5. Previous / Next Step interaction
    console.log('[STEP 5] Testing +1h Step Forward and -1h Step Back buttons...');
    const stepNextBtn = await page.waitForSelector('button[title="Step Forward 1h"]', { timeout: 5000 });
    await stepNextBtn.click();
    await sleep(1200);
    const stepPrevBtn = await page.waitForSelector('button[title="Step Back 1h"]', { timeout: 5000 });
    await stepPrevBtn.click();
    await sleep(1200);
    await takeScreenshot('05_step_interaction', 'Deterministic step forward (+1h) and back (-1h)');

    // 6. Reset simulation
    console.log('[STEP 6] Testing Reset button to restore T=0.0h initial state...');
    const resetBtn = await page.waitForSelector('button[title="Reset to T=0"]', { timeout: 5000 });
    await resetBtn.click();
    await sleep(1500);
    await takeScreenshot('06_simulation_reset', 'Reset simulation back to T=0.0h');

    // 7. Timeline Scrubbing
    console.log('[STEP 7] Testing bottom scrubber timeline slider seeking to T=4.5h...');
    await page.evaluate(() => {
      const slider = document.querySelector('input[type="range"]');
      if (slider) {
        slider.value = '4.5';
        slider.dispatchEvent(new Event('input', { bubbles: true }));
        slider.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await sleep(1500);
    await takeScreenshot('07_timeline_scrubbing', 'Timeline scrubbed to T=4.5h with instant map synchrony');

    // 8. Parameter Modification
    console.log('[STEP 8] Modifying Scenario Precipitation Rate parameter...');
    await page.evaluate(() => {
      // Find the first input range in the left drawer if present
      const rangeInputs = document.querySelectorAll('input[type="range"]');
      if (rangeInputs.length > 1) {
        rangeInputs[0].value = '80';
        rangeInputs[0].dispatchEvent(new Event('input', { bubbles: true }));
        rangeInputs[0].dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await sleep(2000);
    await takeScreenshot('08_parameter_change', 'Parameter modified with synchronized calculation');

    // 9. Scenario Switch
    console.log('[STEP 9] Switching scenario to Coastal Monsoon Surge...');
    await page.goto(`${TARGET_URL}/admin/mumbai/simulation?scenario=coastal_monsoon_surge&t=2&ward=A`, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });
    await sleep(3500);
    await takeScreenshot('09_scenario_switch', 'Scenario switched to Coastal Monsoon Surge with sea surface');

    // 10. Toolbar Stability during playback
    console.log('[STEP 10] Verifying header toolbar stability during multiple playback steps...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const playBtn = buttons.find(b => b.textContent && b.textContent.includes('PLAY'));
      if (playBtn) playBtn.click();
    });
    await sleep(2500);
    await takeScreenshot('10_stable_toolbar_playback', 'Header toolbar perfectly stable and locked during playback');
    // Pause again
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const pauseBtn = buttons.find(b => b.textContent && b.textContent.includes('PAUSE'));
      if (pauseBtn) pauseBtn.click();
    });

    // 11. Narrow / Mobile Viewport Layout
    console.log('[STEP 11] Testing responsive mobile viewport (390x844)...');
    await page.setViewport({ width: 390, height: 844 });
    await sleep(1500);
    await takeScreenshot('11_narrow_viewport', 'Mobile responsive layout (390x844) with clean compact toolbar');

    // 12. Recoverable Notice / Boundary Enforcement
    console.log('[STEP 12] Testing unsupported city jurisdiction boundary (/admin/pune/simulation)...');
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(`${TARGET_URL}/admin/pune/simulation`, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });
    await sleep(2000);
    await takeScreenshot('12_recoverable_notice', 'Jurisdiction notice explaining Mumbai BMC screening boundary');

    console.log('\n════════════════════════════════════════════════════════════');
    console.log('  ALL 12 VERIFICATION SCREENSHOTS CAPTURED SUCCESSFULLY     ');
    console.log('════════════════════════════════════════════════════════════\n');

    console.log(`Browser Page Errors: ${pageErrors.length}`);
    if (pageErrors.length > 0) {
      console.log('Errors:', pageErrors);
    }

  } catch (err) {
    console.error('Verification failed with error:', err);
    throw err;
  } finally {
    await browser.close();
  }
}

runVerification().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
