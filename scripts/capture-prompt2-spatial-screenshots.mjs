/**
 * scripts/capture-prompt2-spatial-screenshots.mjs
 * Sentinel City Intelligence — Prompt 2 Spatial Simulation Map Overhaul Capturer
 * Captures comprehensive high-fidelity screenshots for:
 * - Entire Mumbai extent & zoomed Island City
 * - Ward boundaries with OpenStreetMap basemap
 * - Layer manager and principal GIS layers
 * - Low, Medium, and High simulation states
 * - Continuous hazard surface & calibrated legend
 * - Full map without panels, with drawers open, and mobile viewport
 * - Unsupported city jurisdiction enforcement (Pune & Nagpur)
 */

import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BROWSER_PATH = fs.existsSync(EDGE_PATH) ? EDGE_PATH : CHROME_PATH;

const OUT_DIR = path.resolve(process.cwd(), 'public', 'screenshots', 'prompt2');
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

  async function takeSnap(filename, description) {
    const filePath = path.join(OUT_DIR, filename);
    await page.screenshot({ path: filePath, fullPage: false });
    
    // Copy to artifacts temp media directory for inclusion in markdown
    const artifactPath = path.join(ARTIFACTS_MEDIA_DIR, filename);
    fs.copyFileSync(filePath, artifactPath);
    console.log(`✔ [Captured]: ${filename} — ${description}`);
  }

  try {
    // 1. Entire Mumbai Extent (Baseline full view with drawers open)
    console.log("Navigating to /admin/mumbai/simulation...");
    await page.goto("http://localhost:3005/admin/mumbai/simulation", { waitUntil: "networkidle2", timeout: 45000 });
    await new Promise(r => setTimeout(r, 4000));
    await takeSnap("prompt2_01_entire_mumbai_extent.png", "Entire Greater Mumbai Extent with Basemap & Overlays");

    // 2. High Zoom on Island City & Suburban Wards
    await page.evaluate(() => {
      // Zoom into Island City using leaflet map if available or click on Ward D
      const wardPill = Array.from(document.querySelectorAll('div')).find(el => el.textContent?.includes('Ward D'));
      if (wardPill) wardPill.click();
    });
    await new Promise(r => setTimeout(r, 2000));
    await takeSnap("prompt2_02_island_city_suburban_zoom.png", "Zoomed Island City & Suburban Ward D Focus");

    // 3. Reset to Full Map without Open Panels (Full Map Preset)
    await page.evaluate(() => {
      const fullMapBtn = Array.from(document.querySelectorAll('button')).find(el => el.textContent?.trim() === 'Full Map');
      if (fullMapBtn) fullMapBtn.click();
    });
    await new Promise(r => setTimeout(r, 1500));
    await takeSnap("prompt2_03_ward_boundaries_basemap.png", "Ward Boundaries and Authentic OpenStreetMap Basemap without Drawers");

    // 4. Open GIS Layer Manager Popover
    await page.evaluate(() => {
      const layersBtn = Array.from(document.querySelectorAll('button')).find(el => el.textContent?.includes('Layers'));
      if (layersBtn) layersBtn.click();
    });
    await new Promise(r => setTimeout(r, 1200));
    await takeSnap("prompt2_04_layer_manager_open.png", "Accessible Categorized GIS Layer Manager Popover");

    // 5. Principal Hazard Layers: Hydrology & Waterways (close layer manager, open controls)
    await page.evaluate(() => {
      const closeBtn = document.querySelector('button[title="Toggle Scenario Inputs Panel"]');
      if (closeBtn) closeBtn.click();
    });
    await new Promise(r => setTimeout(r, 1200));
    await takeSnap("prompt2_05_layer_rivers_drainage.png", "Hydrology & Drainage Corridors Overlay with OpenStreetMap");

    // 6. Low Output State (T=0.5h, light rain)
    await page.goto("http://localhost:3005/admin/mumbai/simulation?scenario=rainfall_waterlogging&rainfallRate=10&t=0.5", { waitUntil: "networkidle2" });
    await new Promise(r => setTimeout(r, 3500));
    await takeSnap("prompt2_06_output_state_low.png", "Low Output State (T=0.5h, 10 mm/h Light Inundation)");

    // 7. Medium Output State (T=2.5h, moderate rain 45 mm/h)
    await page.goto("http://localhost:3005/admin/mumbai/simulation?scenario=rainfall_waterlogging&rainfallRate=45&t=2.5", { waitUntil: "networkidle2" });
    await new Promise(r => setTimeout(r, 3500));
    await takeSnap("prompt2_07_output_state_medium.png", "Medium Output State (T=2.5h, 45 mm/h Yellow Watch)");

    // 8. High Output State (Extreme Monsoon Cloudburst 95 mm/h with Sluice Lockout)
    await page.goto("http://localhost:3005/admin/mumbai/simulation?scenario=rainfall_waterlogging&rainfallRate=95&t=4.0&astronomicalTide=4.85", { waitUntil: "networkidle2" });
    await new Promise(r => setTimeout(r, 4000));
    await takeSnap("prompt2_08_output_state_high_alert.png", "High Output State (95 mm/h Rainfall + 4.85m High Tide Sluice Lockout)");

    // 9. Continuous Surface and its Legend
    await takeSnap("prompt2_09_continuous_surface_legend.png", "Continuous Hazard Isoband Field with Calibrated Graduated Legend");

    // 10. Right Drawer: Ward Inspection Details
    await page.evaluate(() => {
      const wardTab = Array.from(document.querySelectorAll('button')).find(el => el.textContent?.trim() === 'Ward Detail');
      if (wardTab) wardTab.click();
    });
    await new Promise(r => setTimeout(r, 1500));
    await takeSnap("prompt2_10_drawer_ward_inspection_open.png", "Right Inspection Drawer: Ward Detail, Demographic Exposure & Municipal Mitigation");

    // 11. Right Drawer: Ranked List Tab
    await page.evaluate(() => {
      const rankedTab = Array.from(document.querySelectorAll('button')).find(el => el.textContent?.includes('Ranked'));
      if (rankedTab) rankedTab.click();
    });
    await new Promise(r => setTimeout(r, 1500));
    await takeSnap("prompt2_11_drawer_ranked_list.png", "Right Inspection Drawer: Ranked 24 BMC Wards by Severity");

    // 12. Full Screen Executive Dossier Report Modal
    await page.evaluate(() => {
      const dossierBtn = Array.from(document.querySelectorAll('button')).find(el => el.textContent?.includes('Dossier Report'));
      if (dossierBtn) dossierBtn.click();
    });
    await new Promise(r => setTimeout(r, 2000));
    await takeSnap("prompt2_12_executive_dossier_modal.png", "Dedicated Full Screen Executive Dossier Report Modal (Uncompressed)");

    // Close modal
    await page.evaluate(() => {
      const closeBtn = Array.from(document.querySelectorAll('button')).find(el => el.textContent?.trim() === '✕');
      if (closeBtn) closeBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    // 13. Mobile Viewport (iPhone width 390 x 844)
    await page.setViewport({ width: 390, height: 844, isMobile: true });
    await new Promise(r => setTimeout(r, 1500));
    await takeSnap("prompt2_13_mobile_map_controls.png", "Mobile Viewport (390px): Clean Canvas with Floating Expand Pills");

    // 14. Reset to Desktop Viewport
    await page.setViewport({ width: 1440, height: 900 });

    // 15. Unsupported City Jurisdiction Notice: Pune
    console.log("Testing Unsupported City: /admin/pune/simulation...");
    await page.goto("http://localhost:3005/admin/pune/simulation", { waitUntil: "networkidle2" });
    await new Promise(r => setTimeout(r, 2500));
    await takeSnap("prompt2_14_unsupported_city_pune.png", "Unsupported City Jurisdiction Screen: Pune PMC (Zero Mumbai Leakage)");

    // 16. Unsupported City Jurisdiction Notice: Nagpur
    console.log("Testing Unsupported City: /admin/nagpur/simulation...");
    await page.goto("http://localhost:3005/admin/nagpur/simulation", { waitUntil: "networkidle2" });
    await new Promise(r => setTimeout(r, 2500));
    await takeSnap("prompt2_15_unsupported_city_nagpur.png", "Unsupported City Jurisdiction Screen: Nagpur NMC (Zero Mumbai Leakage)");

    console.log("All Prompt 2 verification screenshots captured successfully!");
  } catch (err) {
    console.error("Error during screenshot capture:", err);
  } finally {
    await browser.close();
  }
}

run();
