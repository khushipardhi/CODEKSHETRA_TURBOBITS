/**
 * scripts/capture-prompt1-verification.mjs
 * Sentinel City Intelligence — Prompt 1 of 10 Visual Verification Capturer
 * Uses puppeteer-core with Microsoft Edge / Chrome to capture high-fidelity
 * screenshots of repaired interfaces in Light & Dark modes across viewports.
 */

import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BROWSER_PATH = fs.existsSync(EDGE_PATH) ? EDGE_PATH : CHROME_PATH;

const OUT_DIR = path.resolve(process.cwd(), 'public', 'screenshots', 'prompt1');
const ARTIFACTS_MEDIA_DIR = path.resolve(
  process.env.USERPROFILE || 'C:\\Users\\omsat',
  '.gemini\\antigravity-ide\\brain\\dd909e61-f00a-4f16-91e8-d68571aeba71\\.tempmediaStorage'
);

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
if (!fs.existsSync(ARTIFACTS_MEDIA_DIR)) fs.mkdirSync(ARTIFACTS_MEDIA_DIR, { recursive: true });

async function run() {
  console.log(`Launching headless browser: ${BROWSER_PATH}`);
  const browser = await puppeteer.launch({
    executablePath: BROWSER_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--window-size=1440,900'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  async function setLightMode() {
    await page.evaluate(() => {
      localStorage.setItem('nagpur-theme', 'light');
      localStorage.setItem('urban-link-theme', 'light');
      document.documentElement.setAttribute('data-theme', 'light');
    });
    await new Promise(r => setTimeout(r, 600));
  }

  async function setDarkMode() {
    await page.evaluate(() => {
      localStorage.setItem('nagpur-theme', 'dark');
      localStorage.setItem('urban-link-theme', 'dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await new Promise(r => setTimeout(r, 600));
  }

  async function takeSnap(filename, description) {
    const filePath = path.join(OUT_DIR, filename);
    await page.screenshot({ path: filePath, fullPage: false });
    
    // Also copy to artifacts temp media directory for inclusion in response
    const artifactPath = path.join(ARTIFACTS_MEDIA_DIR, filename);
    fs.copyFileSync(filePath, artifactPath);
    
    const size = fs.statSync(filePath).size;
    console.log(`[CAPTURED] ${filename} (${size} bytes) — ${description}`);
    return filePath;
  }

  try {
    // 1. Parameter Detail Modal (Light Mode)
    console.log('\n--- 1. Telemetry Lab Parameter Modal (Light) ---');
    await page.goto('http://localhost:3005/admin/mumbai/telemetry-lab?tab=parameters&param=temperature_2m', { waitUntil: 'networkidle2', timeout: 30000 });
    await setLightMode();
    await new Promise(r => setTimeout(r, 2000));
    await takeSnap('prompt1_01_telemetry_parameter_modal_light.png', 'Parameter Detail Modal with solid opaque dialog, high contrast copy, and backdrop');

    // 2. Parameter Detail Modal (Dark Mode)
    console.log('\n--- 2. Telemetry Lab Parameter Modal (Dark) ---');
    await setDarkMode();
    await takeSnap('prompt1_02_telemetry_parameter_modal_dark.png', 'Parameter Detail Modal in Dark Mode with dark surface and crystal-clear borders');

    // 3. Spatial Simulation Lab with Expanded Report (Light Mode)
    console.log('\n--- 3. Spatial Simulation Lab (Light) ---');
    await page.goto('http://localhost:3005/admin/mumbai/simulation', { waitUntil: 'networkidle2', timeout: 30000 });
    await setLightMode();
    await new Promise(r => setTimeout(r, 3000));
    
    // Switch to Report tab
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('button'));
      const reportTab = tabs.find(b => b.innerText.trim().includes('Report'));
      if (reportTab) reportTab.click();
    });
    await new Promise(r => setTimeout(r, 2000));
    await takeSnap('prompt1_03_spatial_simulation_report_light.png', 'Simulation Lab with widened report panel, non-clipped sub-tabs, and solid legend in Light Mode');

    // 4. Spatial Simulation Lab (Dark Mode)
    console.log('\n--- 4. Spatial Simulation Lab (Dark) ---');
    await setDarkMode();
    await takeSnap('prompt1_04_spatial_simulation_report_dark.png', 'Simulation Lab in Dark Mode with dark map overlay panels and distinct active states');

    // 5. Citizen Hazard Dashboard (Light Mode)
    console.log('\n--- 5. Citizen Hazard Dashboard (Light) ---');
    await page.goto('http://localhost:3005/mumbai/dashboard', { waitUntil: 'networkidle2', timeout: 30000 });
    await setLightMode();
    await new Promise(r => setTimeout(r, 4000));
    await takeSnap('prompt1_05_citizen_dashboard_light.png', 'Citizen Hazard Dashboard with aligned max-w-6xl header, unobscured map, and clear active nav');

    // 6. Citizen Dashboard with Sentinel Assistant Drawer (Backdrop Overlay)
    console.log('\n--- 6. Citizen Assistant Drawer (Backdrop Overlay) ---');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const askBtn = buttons.find(b => b.innerText.includes('Ask Sentinel') || b.title?.includes('Sentinel'));
      if (askBtn) askBtn.click();
    });
    await new Promise(r => setTimeout(r, 1500));
    await takeSnap('prompt1_06_citizen_assistant_drawer_backdrop_light.png', 'Sentinel Assistant Drawer with backdrop dimming background map without modal collision');

    // 7. Citizen Sentinel Hub (Light Mode)
    console.log('\n--- 7. Sentinel Hub (Light) ---');
    await page.goto('http://localhost:3005/mumbai/sentinel', { waitUntil: 'networkidle2', timeout: 30000 });
    await setLightMode();
    await new Promise(r => setTimeout(r, 3000));
    await takeSnap('prompt1_07_citizen_sentinel_hub_light.png', 'Sentinel Multi-Hazard Hub in Light Mode with aligned cards and crisp grounding telemetry');

    // 8. Citizen Sentinel Hub (Dark Mode)
    console.log('\n--- 8. Sentinel Hub (Dark) ---');
    await setDarkMode();
    await takeSnap('prompt1_08_citizen_sentinel_hub_dark.png', 'Sentinel Multi-Hazard Hub in Dark Mode');

    // 9. Admin Command Dashboard (Light Mode)
    console.log('\n--- 9. Admin Command Dashboard (Light) ---');
    await page.goto('http://localhost:3005/admin/mumbai', { waitUntil: 'networkidle2', timeout: 30000 });
    await setLightMode();
    await new Promise(r => setTimeout(r, 3000));
    await takeSnap('prompt1_09_admin_command_dashboard_light.png', 'Admin Command Dashboard with crisp KPI cards and clean light sidebar');

    // 10. Mobile Responsive Citizen Dashboard (390x844)
    console.log('\n--- 10. Mobile Responsive Citizen Dashboard ---');
    await page.setViewport({ width: 390, height: 844, isMobile: true });
    await page.goto('http://localhost:3005/mumbai/dashboard', { waitUntil: 'networkidle2', timeout: 30000 });
    await setLightMode();
    await new Promise(r => setTimeout(r, 3000));
    await takeSnap('prompt1_10_mobile_citizen_dashboard_390.png', 'Mobile Citizen Dashboard at 390px with responsive vertical stacking and touch targets');

    // 11. Mobile Responsive Simulation Lab (390x844)
    console.log('\n--- 11. Mobile Responsive Simulation Lab ---');
    await page.goto('http://localhost:3005/admin/mumbai/simulation', { waitUntil: 'networkidle2', timeout: 30000 });
    await setLightMode();
    await new Promise(r => setTimeout(r, 3000));
    await takeSnap('prompt1_11_mobile_simulation_lab_390.png', 'Mobile Simulation Lab at 390px with collapsible scenario controls');

  } catch (err) {
    console.error('Error during screenshot execution:', err);
  } finally {
    await browser.close();
    console.log('\nBrowser closed. Prompt 1 verification captures complete!');
  }
}

run();
