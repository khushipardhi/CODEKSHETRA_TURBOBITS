/**
 * scripts/capture-phase5-telemetry-screenshots.mjs
 * Sentinel City Intelligence — Phase 5 of 10 Verification Screenshots
 * Captures 12 comprehensive operational and visual states of the Telemetry Lab.
 */

import fs from "fs";
import path from "path";
import puppeteer from "puppeteer-core";

const BASE_URL = process.env.TEST_URL || "http://localhost:3000";
const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const BROWSER_PATH = fs.existsSync(CHROME_PATH) ? CHROME_PATH : EDGE_PATH;

const OUT_DIR = path.resolve(process.cwd(), "public", "screenshots", "phase5_telemetry");
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

// Brain artifact dir for embedded markdown
const BRAIN_DIR = "C:\\Users\\omsat\\.gemini\\antigravity-ide\\brain\\e0b45031-f0f8-4066-8567-28eef54a4f96";

console.log("════════════════════════════════════════════════════════════════════");
console.log("  PHASE 5 OF 10: TELEMETRY LAB EXPANSION SCREENSHOT SUITE           ");
console.log(`  Base URL: ${BASE_URL}`);
console.log(`  Output Directory: ${OUT_DIR}`);
console.log("════════════════════════════════════════════════════════════════════\n");

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function copyToBrain(sourcePath, filename) {
  try {
    if (fs.existsSync(BRAIN_DIR)) {
      const dest = path.join(BRAIN_DIR, filename);
      fs.copyFileSync(sourcePath, dest);
    }
  } catch (err) {
    console.warn("Could not copy to brain dir:", err.message);
  }
}

async function run() {
  const browser = await puppeteer.launch({
    executablePath: BROWSER_PATH,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-gpu",
      "--window-size=1520,960",
    ],
    defaultViewport: { width: 1520, height: 960 },
  });

  const page = await browser.newPage();

  try {
    // -----------------------------------------------------------------------
    // 1. Overview with KPI Metric Cards, Trends, and Environmental Summary
    // -----------------------------------------------------------------------
    console.log("[1/12] Loading /admin/mumbai/telemetry-lab?tab=overview...");
    await page.goto(`${BASE_URL}/admin/mumbai/telemetry-lab?tab=overview`, {
      waitUntil: "networkidle0",
      timeout: 45000,
    });
    await sleep(3500);

    const shot1 = path.join(OUT_DIR, "01_telemetry_overview_cards_charts.png");
    await page.screenshot({ path: shot1, fullPage: false });
    await copyToBrain(shot1, "phase5_01_telemetry_overview_cards_charts.png");
    console.log("  ✓ Captured 01_telemetry_overview_cards_charts.png");

    // -----------------------------------------------------------------------
    // 2. Parameter Explorer: 8 Operational Categories & Dynamic Counts
    // -----------------------------------------------------------------------
    console.log("[2/12] Loading Parameter Explorer with 8 operational categories...");
    await page.goto(`${BASE_URL}/admin/mumbai/telemetry-lab?tab=parameters`, {
      waitUntil: "networkidle0",
      timeout: 45000,
    });
    await sleep(2500);

    const shot2 = path.join(OUT_DIR, "02_parameter_explorer_8_categories.png");
    await page.screenshot({ path: shot2, fullPage: false });
    await copyToBrain(shot2, "phase5_02_parameter_explorer_8_categories.png");
    console.log("  ✓ Captured 02_parameter_explorer_8_categories.png");

    // -----------------------------------------------------------------------
    // 3. Parameter Detail Drawer / Modal (Plain-Language & Scientific Explanations)
    // -----------------------------------------------------------------------
    console.log("[3/12] Opening detail drawer for Sustained Wind Speed (wind_speed_10m)...");
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const inspectBtn = buttons.find((b) => b.textContent && b.textContent.includes("Inspect & Rules"));
      if (inspectBtn) {
        inspectBtn.click();
      }
    });
    await sleep(2500);

    const shot3 = path.join(OUT_DIR, "03_parameter_detail_drawer_plain_language.png");
    await page.screenshot({ path: shot3, fullPage: false });
    await copyToBrain(shot3, "phase5_03_parameter_detail_drawer_plain_language.png");
    console.log("  ✓ Captured 03_parameter_detail_drawer_plain_language.png");

    // -----------------------------------------------------------------------
    // 4. Weather & Atmosphere Tab
    // -----------------------------------------------------------------------
    console.log("[4/12] Loading Weather & Atmosphere Tab...");
    await page.goto(`${BASE_URL}/admin/mumbai/telemetry-lab?tab=weather`, {
      waitUntil: "networkidle0",
      timeout: 45000,
    });
    await sleep(3000);

    const shot4 = path.join(OUT_DIR, "04_weather_atmosphere_tab.png");
    await page.screenshot({ path: shot4, fullPage: false });
    await copyToBrain(shot4, "phase5_04_weather_atmosphere_tab.png");
    console.log("  ✓ Captured 04_weather_atmosphere_tab.png");

    // -----------------------------------------------------------------------
    // 5. Rainfall & Hydrology Tab with Accumulation View Mode
    // -----------------------------------------------------------------------
    console.log("[5/12] Loading Rainfall & Hydrology Tab...");
    await page.goto(`${BASE_URL}/admin/mumbai/telemetry-lab?tab=rainfall`, {
      waitUntil: "networkidle0",
      timeout: 45000,
    });
    await sleep(3000);

    const shot5 = path.join(OUT_DIR, "05_rainfall_accumulation_mode.png");
    await page.screenshot({ path: shot5, fullPage: false });
    await copyToBrain(shot5, "phase5_05_rainfall_accumulation_mode.png");
    console.log("  ✓ Captured 05_rainfall_accumulation_mode.png");

    // -----------------------------------------------------------------------
    // 6. Air Quality Tab (US AQI vs PM2.5 Mass Density)
    // -----------------------------------------------------------------------
    console.log("[6/12] Loading Air Quality Tab...");
    await page.goto(`${BASE_URL}/admin/mumbai/telemetry-lab?tab=air_quality`, {
      waitUntil: "networkidle0",
      timeout: 45000,
    });
    await sleep(3000);

    const shot6 = path.join(OUT_DIR, "06_air_quality_tab.png");
    await page.screenshot({ path: shot6, fullPage: false });
    await copyToBrain(shot6, "phase5_06_air_quality_tab.png");
    console.log("  ✓ Captured 06_air_quality_tab.png");

    // -----------------------------------------------------------------------
    // 7. Coastal & Marine Tab (Mumbai Ocean Dynamics)
    // -----------------------------------------------------------------------
    console.log("[7/12] Loading Coastal & Marine Tab...");
    await page.goto(`${BASE_URL}/admin/mumbai/telemetry-lab?tab=marine`, {
      waitUntil: "networkidle0",
      timeout: 45000,
    });
    await sleep(3000);

    const shot7 = path.join(OUT_DIR, "07_coastal_marine_tab.png");
    await page.screenshot({ path: shot7, fullPage: false });
    await copyToBrain(shot7, "phase5_07_coastal_marine_tab.png");
    console.log("  ✓ Captured 07_coastal_marine_tab.png");

    // -----------------------------------------------------------------------
    // 8. Zone Comparison Tab (Shared ECMWF 11km Grid Cell Disclosure)
    // -----------------------------------------------------------------------
    console.log("[8/12] Loading Zone Comparison Tab...");
    await page.goto(`${BASE_URL}/admin/mumbai/telemetry-lab?tab=comparison`, {
      waitUntil: "networkidle0",
      timeout: 45000,
    });
    await sleep(3500);

    const shot8 = path.join(OUT_DIR, "08_zone_comparison_shared_grid.png");
    await page.screenshot({ path: shot8, fullPage: false });
    await copyToBrain(shot8, "phase5_08_zone_comparison_shared_grid.png");
    console.log("  ✓ Captured 08_zone_comparison_shared_grid.png");

    // -----------------------------------------------------------------------
    // 9. Historical Analysis Tab (ERA5 Reanalysis Replay)
    // -----------------------------------------------------------------------
    console.log("[9/12] Loading Historical Analysis Tab...");
    await page.goto(`${BASE_URL}/admin/mumbai/telemetry-lab?tab=historical`, {
      waitUntil: "networkidle0",
      timeout: 45000,
    });
    await sleep(3500);

    const shot9 = path.join(OUT_DIR, "09_historical_era5_reanalysis.png");
    await page.screenshot({ path: shot9, fullPage: false });
    await copyToBrain(shot9, "phase5_09_historical_era5_reanalysis.png");
    console.log("  ✓ Captured 09_historical_era5_reanalysis.png");

    // -----------------------------------------------------------------------
    // 10. Valid Empty-Data State (Pune Marine Exclusion or Data Unavailable)
    // -----------------------------------------------------------------------
    console.log("[10/12] Loading Pune Marine Exclusion (Honest Unavailable State)...");
    await page.goto(`${BASE_URL}/admin/pune/telemetry-lab?tab=marine`, {
      waitUntil: "networkidle0",
      timeout: 45000,
    });
    await sleep(3000);

    const shot10 = path.join(OUT_DIR, "10_empty_unavailable_data_state.png");
    await page.screenshot({ path: shot10, fullPage: false });
    await copyToBrain(shot10, "phase5_10_empty_unavailable_data_state.png");
    console.log("  ✓ Captured 10_empty_unavailable_data_state.png");

    // -----------------------------------------------------------------------
    // 11. Dark Theme High Contrast Verification
    // -----------------------------------------------------------------------
    console.log("[11/12] Rendering Telemetry Lab in Dark Theme...");
    await page.goto(`${BASE_URL}/admin/mumbai/telemetry-lab?tab=overview`, {
      waitUntil: "networkidle0",
      timeout: 45000,
    });
    await page.evaluate(() => {
      document.documentElement.setAttribute("data-theme", "dark");
      document.documentElement.classList.add("dark");
      document.body.classList.add("dark");
      localStorage.setItem("nagpur-theme", "dark");
      // Find theme toggle button and click if not dark
      const toggle = document.querySelector('button[aria-label*="dark mode"]');
      if (toggle) toggle.click();
    });
    await sleep(2500);

    const shot11 = path.join(OUT_DIR, "11_dark_theme_contrast.png");
    await page.screenshot({ path: shot11, fullPage: false });
    await copyToBrain(shot11, "phase5_11_dark_theme_contrast.png");
    console.log("  ✓ Captured 11_dark_theme_contrast.png");

    // Reset theme
    await page.evaluate(() => {
      document.documentElement.classList.remove("dark");
      document.body.classList.remove("dark");
    });

    // -----------------------------------------------------------------------
    // 12. Mobile Viewport Layout (390 x 844)
    // -----------------------------------------------------------------------
    console.log("[12/12] Testing Mobile Viewport Layout (390x844)...");
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await page.goto(`${BASE_URL}/admin/mumbai/telemetry-lab?tab=overview`, {
      waitUntil: "networkidle0",
      timeout: 45000,
    });
    await sleep(3000);

    const shot12 = path.join(OUT_DIR, "12_mobile_responsive_layout.png");
    await page.screenshot({ path: shot12, fullPage: false });
    await copyToBrain(shot12, "phase5_12_mobile_responsive_layout.png");
    console.log("  ✓ Captured 12_mobile_responsive_layout.png");

    console.log("\n════════════════════════════════════════════════════════════════════");
    console.log("  ALL 12 PHASE 5 SCREENSHOTS CAPTURED & SAVED SUCCESSFULLY!        ");
    console.log("════════════════════════════════════════════════════════════════════\n");
  } catch (err) {
    console.error("Screenshot capture failed:", err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run();
