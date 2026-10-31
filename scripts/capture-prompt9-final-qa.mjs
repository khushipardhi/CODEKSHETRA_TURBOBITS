/**
 * scripts/capture-prompt9-final-qa.mjs
 * Sentinel City Intelligence — Prompt 9 Final QA Visual Evidence Capture Suite
 */

import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BROWSER_PATH = fs.existsSync(EDGE_PATH) ? EDGE_PATH : CHROME_PATH;

const OUT_DIR = path.resolve(process.cwd(), 'public', 'screenshots', 'prompt9');
const ARTIFACT_DIR = 'C:\\Users\\omsat\\.gemini\\antigravity-ide\\brain\\dd909e61-f00a-4f16-91e8-d68571aeba71';

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function capture() {
  console.log('════════════════════════════════════════════════════════════');
  console.log('  PROMPT 9: FINAL QA VISUAL VERIFICATION CAPTURE SUITE       ');
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
    // Hide any dev overlays before screenshot
    await page.evaluate(() => {
      document.querySelectorAll('nextjs-portal, [data-nextjs-toast]').forEach(e => e.remove());
    });
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
    // ─── 1. Admin Command Dashboard (Desktop Light) ───
    console.log('1. Admin Dashboard Desktop Light...');
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://localhost:3005/admin/mumbai', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(3000);
    await saveShot('prompt9_01_admin_dashboard_desktop_light.png');

    // ─── 2. Admin Command Dashboard (Desktop Dark) ───
    console.log('2. Admin Dashboard Desktop Dark...');
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.classList.add('dark');
    });
    await sleep(1500);
    await saveShot('prompt9_02_admin_dashboard_desktop_dark.png');
    // reset dark
    await page.evaluate(() => {
      document.documentElement.removeAttribute('data-theme');
      document.documentElement.classList.remove('dark');
    });

    // ─── 3. Admin Hazard & Incident Map (Fixed Locality Dropdown) ───
    console.log('3. Admin Hazard & Incident Map...');
    await page.goto('http://localhost:3005/admin/mumbai/map', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(3000);
    await saveShot('prompt9_03_admin_hazard_map_desktop.png');

    // ─── 4. Telemetry Lab Overview ───
    console.log('4. Telemetry Lab Overview...');
    await page.goto('http://localhost:3005/admin/mumbai/telemetry-lab', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(3500);
    await saveShot('prompt9_04_telemetry_lab_overview.png');

    // ─── 5. Telemetry Parameter Detail Modal ───
    console.log('5. Telemetry Parameter Detail Modal...');
    await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('div, button'));
      const target = cards.find(c => c.textContent && (c.textContent.includes('Precipitation Rate') || c.textContent.includes('Rainfall Rate')));
      if (target) target.click();
    });
    await sleep(1500);
    await saveShot('prompt9_05_telemetry_parameter_modal.png');

    // ─── 6. Spatial Simulation Lab (Debounced Runner & Polish) ───
    console.log('6. Spatial Simulation Lab...');
    await page.goto('http://localhost:3005/admin/mumbai/simulation', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(3500);
    await saveShot('prompt9_06_spatial_simulation_lab.png');

    // ─── 7. Full-Width City Report ───
    console.log('7. Full-Width City Report...');
    await page.goto('http://localhost:3005/admin/mumbai/simulation/report', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(4000);
    await saveShot('prompt9_07_fullwidth_city_report.png');

    // ─── 8. Ward-Level Dossier ───
    console.log('8. Ward-Level Dossier...');
    await page.evaluate(() => window.scrollBy(0, 950));
    await sleep(1500);
    await saveShot('prompt9_08_ward_level_dossier.png');

    // ─── 9. Citizen Hazard Dashboard Desktop ───
    console.log('9. Citizen Hazard Dashboard Desktop...');
    await page.goto('http://localhost:3005/mumbai/dashboard', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(3000);
    await saveShot('prompt9_09_citizen_dashboard_desktop.png');

    // ─── 10. Citizen Hazard Dashboard Mobile (390px) ───
    console.log('10. Citizen Hazard Dashboard Mobile (390px)...');
    await page.setViewport({ width: 390, height: 844, isMobile: true });
    await page.goto('http://localhost:3005/mumbai/dashboard', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(3000);
    await saveShot('prompt9_10_citizen_dashboard_mobile_390.png');

    // ─── 11. Citizen Accessible Table View (Non-Map Alternative) ───
    console.log('11. Citizen Accessible Ward Table View...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const tableBtn = btns.find(b => b.textContent && b.textContent.includes('Table'));
      if (tableBtn) tableBtn.click();
    });
    await sleep(1500);
    await saveShot('prompt9_11_citizen_accessible_table_view.png');

    // ─── 12. Sentinel AI Sticky Chat Workspace ───
    console.log('12. Sentinel AI Sticky Chat Workspace...');
    await page.setViewport({ width: 1440, height: 900, isMobile: false });
    await page.goto('http://localhost:3005/mumbai/sentinel', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(3000);
    await saveShot('prompt9_12_sentinel_ai_sticky_chat.png');

    // ─── 13. Civic Reports Form Mobile (390px) ───
    console.log('13. Civic Reports Form Mobile (390px)...');
    await page.setViewport({ width: 390, height: 844, isMobile: true });
    await page.goto('http://localhost:3005/mumbai/report', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(2500);
    await saveShot('prompt9_13_civic_reports_form_mobile_390.png');

    // ─── 14. My Reports ───
    console.log('14. My Reports...');
    await page.setViewport({ width: 1440, height: 900, isMobile: false });
    await page.goto('http://localhost:3005/mumbai/my-reports', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(2500);
    await saveShot('prompt9_14_my_reports.png');

    // ─── 15. Department Workflow ───
    console.log('15. Department Workflow Tasks...');
    await page.goto('http://localhost:3005/department/mumbai/SWD/tasks', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(3000);
    await saveShot('prompt9_15_department_workflow_tasks.png');

    // ─── 16. Minimum Responsive Check (320px) ───
    console.log('16. Minimum Viewport Check (320px)...');
    await page.setViewport({ width: 320, height: 640, isMobile: true });
    await page.goto('http://localhost:3005/mumbai/dashboard', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(2500);
    await saveShot('prompt9_16_responsive_320_check.png');

    // ─── 17. Dark Mode Simulation Dossier ───
    console.log('17. Dark Mode Simulation Dossier...');
    await page.setViewport({ width: 1440, height: 900, isMobile: false });
    await page.goto('http://localhost:3005/admin/mumbai/simulation', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(2500);
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.classList.add('dark');
    });
    await sleep(1500);
    await saveShot('prompt9_17_dark_mode_simulation_dossier.png');

    console.log('\n════════════════════════════════════════════════════════════');
    console.log('  ALL PROMPT 9 QA SCREENSHOTS CAPTURED SUCCESSFULLY!         ');
    console.log('════════════════════════════════════════════════════════════\n');
  } catch (err) {
    console.error('Final QA capture error:', err);
  } finally {
    await browser.close();
  }
}

capture();
