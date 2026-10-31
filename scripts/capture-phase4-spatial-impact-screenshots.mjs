/**
 * scripts/capture-phase4-spatial-impact-screenshots.mjs
 * Sentinel City Intelligence — Phase 4 of 10 Verification Screenshots
 * Captures city extent, ward zoom, low/high output, selected ward terrain drawer, and legend details.
 */

import fs from "fs";
import path from "path";
import puppeteer from "puppeteer-core";

const BASE_URL = process.env.TEST_URL || "http://localhost:3000";
const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const BROWSER_PATH = fs.existsSync(CHROME_PATH) ? CHROME_PATH : EDGE_PATH;

const OUT_DIR = path.resolve(process.cwd(), "public", "screenshots", "phase4_spatial_impact");
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

// Brain artifact dir for embedded markdown
const BRAIN_DIR = "C:\\Users\\omsat\\.gemini\\antigravity-ide\\brain\\e0b45031-f0f8-4066-8567-28eef54a4f96";

console.log("════════════════════════════════════════════════════════════════════");
console.log("  PHASE 4 OF 10: SPATIAL SURFACES & TERRAIN VERIFICATION CAPTURE    ");
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
    // 1. City Extent Continuous Hazard Surface (502 land-clipped cells)
    console.log("[1/6] Loading /admin/mumbai/simulation for City Extent Continuous Surface...");
    await page.goto(`${BASE_URL}/admin/mumbai/simulation`, { waitUntil: "networkidle0", timeout: 45000 });
    await page.waitForSelector(".leaflet-container", { timeout: 20000 });
    await sleep(3500);

    const shot1 = path.join(OUT_DIR, "01_city_extent_continuous_surface.png");
    await page.screenshot({ path: shot1, fullPage: false });
    await copyToBrain(shot1, "phase4_01_city_extent_continuous_surface.png");
    console.log("  ✓ Captured 01_city_extent_continuous_surface.png");

    // 2. Ward Zoom on Ward L (Kurla) / Mithi River Saucer Depression
    console.log("[2/6] Zooming into Ward L Kurla saucer depression...");
    // Find Ward L in ranking table and click to zoom
    const wardLClicked = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll("tr, div, button"));
      for (const el of rows) {
        if (el.textContent && el.textContent.includes("Ward L") && el.textContent.includes("Kurla")) {
          el.click();
          return true;
        }
      }
      return false;
    });

    await sleep(2500);
    const shot2 = path.join(OUT_DIR, "02_ward_zoom_saucer_depression.png");
    await page.screenshot({ path: shot2, fullPage: false });
    await copyToBrain(shot2, "phase4_02_ward_zoom_saucer_depression.png");
    console.log(`  ✓ Captured 02_ward_zoom_saucer_depression.png (Ward L clicked: ${wardLClicked})`);

    // 3. Selected Ward Drawer showing Terrain & Demographic Exposure Breakdown
    console.log("[3/6] Capturing Ward L detail drawer with 4-tier exposure & DEM profile...");
    // Scroll the drawer to show terrain card and demographic analysis
    await page.evaluate(() => {
      const drawer = document.querySelector(".overflow-y-auto");
      if (drawer) {
        drawer.scrollTop = 300;
      }
    });
    await sleep(1500);

    const shot4 = path.join(OUT_DIR, "04_selected_ward_terrain_exposure.png");
    await page.screenshot({ path: shot4, fullPage: false });
    await copyToBrain(shot4, "phase4_04_selected_ward_terrain_exposure.png");
    console.log("  ✓ Captured 04_selected_ward_terrain_exposure.png");

    // 4. Low vs High Output Variance
    console.log("[4/6] Adjusting rainfall parameter to 90 mm/h to capture high-severity response...");
    // Move time slider or change rainfall input if available
    await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll("input[type='range'], input[type='number']"));
      for (const inp of inputs) {
        if (inp.max === "120" || inp.step === "5") {
          inp.value = "90";
          inp.dispatchEvent(new Event("input", { bubbles: true }));
          inp.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }
    });
    await sleep(2500);

    const shot3 = path.join(OUT_DIR, "03_low_vs_high_input_variance.png");
    await page.screenshot({ path: shot3, fullPage: false });
    await copyToBrain(shot3, "phase4_03_low_vs_high_input_variance.png");
    console.log("  ✓ Captured 03_low_vs_high_input_variance.png");

    // 5. Legend Sources & DEM Scientific Disclaimer
    console.log("[5/6] Capturing Map Legend, Copernicus DEM & BRIMSTOWAD Provenance...");
    await page.evaluate(() => {
      // Close drawer or scroll to legend
      const closeBtn = document.querySelector("button[title='Close drawer'], button[aria-label='Close drawer']");
      if (closeBtn) closeBtn.click();
    });
    await sleep(1500);

    const shot5 = path.join(OUT_DIR, "05_legend_sources_dem_disclaimer.png");
    await page.screenshot({ path: shot5, fullPage: false });
    await copyToBrain(shot5, "phase4_05_legend_sources_dem_disclaimer.png");
    console.log("  ✓ Captured 05_legend_sources_dem_disclaimer.png");

    // 6. Representation Mode Toggle (Choropleth vs Continuous Surface)
    console.log("[6/6] Toggling representation mode...");
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      for (const b of buttons) {
        if (b.textContent && (b.textContent.includes("Choropleth") || b.textContent.includes("Isoband") || b.textContent.includes("Hybrid"))) {
          b.click();
          break;
        }
      }
    });
    await sleep(2000);

    const shot6 = path.join(OUT_DIR, "06_hybrid_mode_continuous_and_choropleth.png");
    await page.screenshot({ path: shot6, fullPage: false });
    await copyToBrain(shot6, "phase4_06_hybrid_mode_continuous_and_choropleth.png");
    console.log("  ✓ Captured 06_hybrid_mode_continuous_and_choropleth.png");

    console.log("\n════════════════════════════════════════════════════════════════════");
    console.log("  ALL 6 VERIFICATION SCREENSHOTS CAPTURED SUCCESSFULLY!              ");
    console.log("════════════════════════════════════════════════════════════════════\n");
  } catch (err) {
    console.error("Screenshot capture failed:", err);
  } finally {
    await browser.close();
  }
}

run();
