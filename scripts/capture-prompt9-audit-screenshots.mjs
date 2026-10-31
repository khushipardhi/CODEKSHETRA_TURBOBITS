/**
 * scripts/capture-prompt9-audit-screenshots.mjs
 * Sentinel City Intelligence — Prompt 9 Pre-Audit Screenshot Suite
 */

import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BROWSER_PATH = fs.existsSync(EDGE_PATH) ? EDGE_PATH : CHROME_PATH;

const OUT_DIR = path.resolve(process.cwd(), 'public', 'screenshots', 'prompt9_audit');
const ARTIFACT_DIR = 'C:\\Users\\omsat\\.gemini\\antigravity-ide\\brain\\dd909e61-f00a-4f16-91e8-d68571aeba71';

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function capture() {
  console.log('════════════════════════════════════════════════════════════');
  console.log('  PROMPT 9: PRE-AUDIT VISUAL DEFECT DISCOVERY CAPTURE        ');
  console.log('════════════════════════════════════════════════════════════\n');

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
    // 1. Admin Command Dashboard (Light Mode)
    console.log('1. Admin Dashboard Desktop Light...');
    await page.setViewport({ width: 1440, height: 900 });
    await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);
    await page.goto('http://localhost:3005/admin/mumbai', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(2500);
    await saveShot('audit_01_admin_dashboard_desktop_light.png');

    // 2. Admin Command Dashboard (Dark Mode)
    console.log('2. Admin Dashboard Desktop Dark...');
    await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });
    await sleep(1000);
    await saveShot('audit_02_admin_dashboard_desktop_dark.png');
    // reset dark class
    await page.evaluate(() => document.documentElement.classList.remove('dark'));

    // 3. Hazard & Incident Map
    console.log('3. Admin Hazard & Incident Map...');
    await page.goto('http://localhost:3005/admin/mumbai/map', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(2500);
    await saveShot('audit_03_admin_map_desktop.png');

    // 4. Telemetry Lab Overview
    console.log('4. Telemetry Lab Overview...');
    await page.goto('http://localhost:3005/admin/mumbai/telemetry-lab', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(2500);
    await saveShot('audit_04_telemetry_lab_overview.png');

    // 5. Telemetry Parameter Modal
    console.log('5. Telemetry Parameter Detail Modal...');
    // Click on a telemetry parameter card to open detail modal
    const paramCard = await page.$('[data-testid="param-card"], div.cursor-pointer, .card-hover');
    if (paramCard) {
      await paramCard.click();
      await sleep(1500);
    } else {
      // try clicking any button with Inspect or parameter name
      await page.evaluate(() => {
        const els = Array.from(document.querySelectorAll('button, div'));
        const el = els.find(e => e.textContent && e.textContent.includes('Rainfall Rate'));
        if (el) el.click();
      });
      await sleep(1500);
    }
    await saveShot('audit_05_telemetry_parameter_modal.png');

    // 6. Spatial Simulation Lab
    console.log('6. Spatial Simulation Lab...');
    await page.goto('http://localhost:3005/admin/mumbai/simulation', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(2500);
    await saveShot('audit_06_spatial_simulation_lab.png');

    // 7. Simulation Controls & Legend
    console.log('7. Simulation Controls & Legend...');
    // Scroll or focus on controls
    await page.evaluate(() => window.scrollBy(0, 300));
    await sleep(1000);
    await saveShot('audit_07_simulation_controls_legend.png');

    // 8. Full-Width City Report
    console.log('8. Full-Width City Report...');
    await page.goto('http://localhost:3005/admin/mumbai/simulation/report', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(2500);
    await saveShot('audit_08_fullwidth_city_report.png');

    // 9. Ward-Level Dossier
    console.log('9. Ward-Level Dossier...');
    await page.evaluate(() => window.scrollBy(0, 800));
    await sleep(1000);
    await saveShot('audit_09_ward_dossier.png');

    // 10. Citizen Hazard Dashboard Desktop
    console.log('10. Citizen Hazard Dashboard Desktop...');
    await page.goto('http://localhost:3005/mumbai/dashboard', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(2500);
    await saveShot('audit_10_citizen_dashboard_desktop.png');

    // 11. Citizen Hazard Dashboard Mobile (390px)
    console.log('11. Citizen Hazard Dashboard Mobile (390px)...');
    await page.setViewport({ width: 390, height: 844, isMobile: true });
    await page.goto('http://localhost:3005/mumbai/dashboard', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(2000);
    await saveShot('audit_11_citizen_dashboard_mobile_390.png');

    // 12. Citizen Map Mobile (390px)
    console.log('12. Citizen Map Mobile (390px)...');
    await page.goto('http://localhost:3005/mumbai/alerts', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(2500);
    await saveShot('audit_12_citizen_map_mobile_390.png');

    // 13. Sentinel AI Chat Mobile & Desktop
    console.log('13. Sentinel AI Conversation...');
    await page.setViewport({ width: 1440, height: 900, isMobile: false });
    await page.goto('http://localhost:3005/mumbai/sentinel', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(2500);
    await saveShot('audit_13_sentinel_ai_chat.png');

    // 14. Civic Reports Form Mobile (390px)
    console.log('14. Civic Reports Form Mobile (390px)...');
    await page.setViewport({ width: 390, height: 844, isMobile: true });
    await page.goto('http://localhost:3005/mumbai/report', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(2000);
    await saveShot('audit_14_civic_reports_form_mobile_390.png');

    // 15. My Reports
    console.log('15. My Reports...');
    await page.setViewport({ width: 1440, height: 900, isMobile: false });
    await page.goto('http://localhost:3005/mumbai/my-reports', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(2000);
    await saveShot('audit_15_my_reports.png');

    // 16. Department Workflow
    console.log('16. Department Workflow...');
    await page.goto('http://localhost:3005/department/mumbai/SWD/tasks', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(2000);
    await saveShot('audit_16_department_workflow.png');

    // 17. Extreme Small Responsive Check (320px)
    console.log('17. Extreme Small Responsive Check (320px)...');
    await page.setViewport({ width: 320, height: 640, isMobile: true });
    await page.goto('http://localhost:3005/mumbai/dashboard', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(2000);
    await saveShot('audit_17_responsive_320_check.png');

    console.log('\n════════════════════════════════════════════════════════════');
    console.log('  ALL AUDIT SCREENSHOTS CAPTURED!                           ');
    console.log('════════════════════════════════════════════════════════════\n');
  } catch (err) {
    console.error('Audit capture error:', err);
  } finally {
    await browser.close();
  }
}

capture();
