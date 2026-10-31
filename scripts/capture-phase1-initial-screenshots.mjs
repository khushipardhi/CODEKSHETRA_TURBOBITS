/**
 * scripts/capture-phase1-initial-screenshots.mjs
 * Captures initial screenshots of all 9 major screens before modifications
 * to establish baseline defect evidence as required by Phase 1 of 10.
 */

import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer-core';

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BROWSER_PATH = fs.existsSync(CHROME_PATH) ? CHROME_PATH : EDGE_PATH;

const OUT_DIR = path.resolve(process.cwd(), 'public', 'screenshots', 'phase1_brand_and_design', 'initial');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

console.log('════════════════════════════════════════════════════════════');
console.log('  PHASE 1: CAPTURING INITIAL DEFECT EVIDENCE SCREENSHOTS    ');
console.log(`  Base URL: ${BASE_URL}`);
console.log(`  Output Directory: ${OUT_DIR}`);
console.log('════════════════════════════════════════════════════════════\n');

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function captureInitialScreenshots() {
  const browser = await puppeteer.launch({
    executablePath: BROWSER_PATH,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--window-size=1440,900',
    ],
    defaultViewport: { width: 1440, height: 900 },
  });

  const page = await browser.newPage();

  const screens = [
    {
      name: '01_admin_command_centre.png',
      url: `${BASE_URL}/admin/mumbai`,
      waitFor: '.grid, .card, h1, header',
      delay: 2000,
    },
    {
      name: '02_hazard_and_incident_map.png',
      url: `${BASE_URL}/admin/mumbai/map`,
      waitFor: '.leaflet-container',
      delay: 2500,
    },
    {
      name: '03_telemetry_lab_overview.png',
      url: `${BASE_URL}/admin/mumbai/telemetry-lab`,
      waitFor: 'h1, .grid',
      delay: 2000,
    },
    {
      name: '04_spatial_simulation_lab.png',
      url: `${BASE_URL}/admin/mumbai/simulation`,
      waitFor: '.leaflet-container',
      delay: 2500,
    },
    {
      name: '05_simulation_ward_detail.png',
      url: `${BASE_URL}/admin/mumbai/simulation`,
      waitFor: '.leaflet-container',
      action: async (p) => {
        // select a ward from dropdown or map
        await p.evaluate(() => {
          const select = document.querySelector('select');
          if (select) {
            select.value = 'F/South';
            select.dispatchEvent(new Event('change', { bubbles: true }));
          }
        });
        await sleep(1500);
      },
      delay: 1000,
    },
    {
      name: '06_simulation_report_studio.png',
      url: `${BASE_URL}/admin/mumbai/simulation/report?dossierId=DOS-COASTAL_MONSOON_SURGE-T6H-MVE9F1AC`,
      waitFor: 'h1, h2, table, .report-studio',
      delay: 2000,
    },
    {
      name: '07_citizen_hazard_dashboard.png',
      url: `${BASE_URL}/mumbai/dashboard`,
      waitFor: 'h1, h2, .grid',
      delay: 2000,
    },
    {
      name: '08_sentinel_ai.png',
      url: `${BASE_URL}/mumbai/sentinel`,
      waitFor: 'input, textarea, h1',
      delay: 1500,
    },
    {
      name: '09_civic_reports_and_my_reports.png',
      url: `${BASE_URL}/mumbai/my-reports`,
      waitFor: 'h1, .card, button',
      delay: 1500,
    },
  ];

  for (const s of screens) {
    console.log(`Capturing initial: ${s.name} from ${s.url}...`);
    try {
      await page.goto(s.url, { waitUntil: 'networkidle2', timeout: 30000 });
      if (s.waitFor) {
        await page.waitForSelector(s.waitFor, { timeout: 10000 }).catch(() => {});
      }
      if (s.action) {
        await s.action(page);
      }
      await sleep(s.delay || 1500);
      const outPath = path.join(OUT_DIR, s.name);
      await page.screenshot({ path: outPath, fullPage: false });
      console.log(`  ✔ Saved ${s.name}`);
    } catch (err) {
      console.error(`  ✗ Failed ${s.name}: ${err.message}`);
    }
  }

  await browser.close();
  console.log('\nInitial screenshots captured in:', OUT_DIR);
}

captureInitialScreenshots();
