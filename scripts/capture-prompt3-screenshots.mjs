/**
 * scripts/capture-prompt3-screenshots.mjs
 * Sentinel City Intelligence — Prompt 3 Environmental Simulation Engine & Terrain Capturer
 * Captures comprehensive high-fidelity screenshots for:
 * 1. Initial scenario (T=1.0h, Constant 65 mm/h, live hydrology timeline)
 * 2. Changed rainfall intensity (110 mm/h extreme cloudburst, runoff excess surge)
 * 3. Different time steps (T=2.5h Chicago convective burst peak & tidal fluctuation)
 * 4. Terrain-related output (Copernicus DEM depressions, saucer sinks, slope, TWI)
 * 5. Baseline comparison (26 July 2005 944mm historical vs live baseline)
 * 6. Missing elevation/drainage input (simulateMissingInputs=true, PARTIALLY_CALIBRATED banner)
 * 7. The same selected ward in map and statistics (Ward L Kurla synchronized across views)
 */

import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BROWSER_PATH = fs.existsSync(EDGE_PATH) ? EDGE_PATH : CHROME_PATH;

const OUT_DIR = path.resolve(process.cwd(), 'public', 'screenshots', 'prompt3');
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
    // 1. Initial Scenario: Default T=1.0h, Constant 65 mm/h
    console.log("1. Capturing Initial Scenario...");
    await page.goto("http://localhost:3005/admin/mumbai/simulation?scenario=rainfall_waterlogging&rainfallRate=65&t=1.0&ward=L", { waitUntil: "networkidle2", timeout: 45000 });
    await new Promise(r => setTimeout(r, 4000));
    await takeSnap("prompt3_01_initial_scenario.png", "Initial Scenario: Default T=1.0h, Constant 65 mm/h, Live Hydrology Bar & Physical Inputs");

    // 2. Changed Rainfall Intensity: 110 mm/h Extreme Cloudburst
    console.log("2. Capturing Changed Rainfall Intensity...");
    await page.goto("http://localhost:3005/admin/mumbai/simulation?scenario=rainfall_waterlogging&rainfallRate=110&t=1.0&ward=L", { waitUntil: "networkidle2", timeout: 45000 });
    await new Promise(r => setTimeout(r, 3500));
    await takeSnap("prompt3_02_changed_rainfall_intensity.png", "Changed Rainfall Intensity: 110 mm/h Extreme Cloudburst with Runoff Surge");

    // 3. Different Time Steps: T=2.5h Chicago Convective Peak
    console.log("3. Capturing Different Time Steps (Hyetograph Burst at T=2.5h)...");
    await page.goto("http://localhost:3005/admin/mumbai/simulation?scenario=rainfall_waterlogging&rainfallProfile=1&rainfallRate=75&t=2.5&astronomicalTide=4.2&ward=L", { waitUntil: "networkidle2", timeout: 45000 });
    await new Promise(r => setTimeout(r, 3500));
    await takeSnap("prompt3_03_time_steps.png", "Different Time Steps: T=2.5h Chicago Convective Burst Peak (113 mm/h) & Tide Dynamics");

    // 4. Terrain-Related Output: Copernicus GLO-30 DEM Depressions & Ward F/N
    console.log("4. Capturing Terrain-Related Output...");
    await page.goto("http://localhost:3005/admin/mumbai/simulation?scenario=rainfall_waterlogging&rainfallRate=65&t=1.0&ward=F/N&tab=ward_detail", { waitUntil: "networkidle2", timeout: 45000 });
    await new Promise(r => setTimeout(r, 3500));
    // Open layer manager to highlight DEM depression sinks
    await page.evaluate(() => {
      const layersBtn = Array.from(document.querySelectorAll('button')).find(el => el.textContent?.includes('Layers'));
      if (layersBtn) layersBtn.click();
    });
    await new Promise(r => setTimeout(r, 1500));
    await takeSnap("prompt3_04_terrain_related_output.png", "Terrain-Related Output: Copernicus DEM Saucer Depressions & Topographic Drainage Sinks");

    // 5. Baseline Comparison: 26 July 2005 Extreme Cloudburst (944 mm)
    console.log("5. Capturing Baseline Comparison...");
    await page.goto("http://localhost:3005/admin/mumbai/simulation?scenario=rainfall_waterlogging&baseline=historical_july2005&rainfallRate=125&t=3.0&ward=L", { waitUntil: "networkidle2", timeout: 45000 });
    await new Promise(r => setTimeout(r, 3500));
    await takeSnap("prompt3_05_baseline_comparison.png", "Baseline Comparison: 26 July 2005 Historical Cloudburst (944 mm) Calibration Mode");

    // 6. Missing Elevation or Drainage Input: simulateMissingInputs=true
    console.log("6. Capturing Missing Elevation or Drainage Input State...");
    await page.goto("http://localhost:3005/admin/mumbai/simulation?scenario=rainfall_waterlogging&missing=1&ward=L", { waitUntil: "networkidle2", timeout: 45000 });
    await new Promise(r => setTimeout(r, 3500));
    await takeSnap("prompt3_06_missing_elevation_drainage_input.png", "Missing Elevation/Drainage Input: PARTIALLY_CALIBRATED Audit Notice & Missing Sensor Disclaimers");

    // 7. Same Selected Ward in Map and Statistics (Ward L Kurla Synchronized)
    console.log("7. Capturing Synchronized Ward L Kurla in Map and Statistics...");
    await page.goto("http://localhost:3005/admin/mumbai/simulation?scenario=rainfall_waterlogging&rainfallRate=75&t=2.0&ward=L&tab=ward_detail", { waitUntil: "networkidle2", timeout: 45000 });
    await new Promise(r => setTimeout(r, 3500));
    await takeSnap("prompt3_07_same_selected_ward_map_and_stats.png", "Synchronized Ward L Kurla: Exact Alignment Across Map Polygon, Live Hydrology Bar & Right Statistics Drawer");

    console.log("\nAll 7 Prompt 3 screenshots successfully captured and mirrored!");
  } catch (err) {
    console.error("Screenshot capture failed:", err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run();
