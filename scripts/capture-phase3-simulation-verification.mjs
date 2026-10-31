/**
 * scripts/capture-phase3-simulation-verification.mjs
 * Captures 10 real verification screenshots for Sentinel City Intelligence
 * Phase 3 of 10: Spatial Simulation Reliability & Stable Playback
 */

import fs from "fs";
import path from "path";
import puppeteer from "puppeteer-core";

const BASE_URL = process.env.TEST_URL || "http://localhost:3000";
const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const BROWSER_PATH = fs.existsSync(CHROME_PATH) ? CHROME_PATH : EDGE_PATH;

const OUT_DIR = path.resolve(process.cwd(), "public", "screenshots", "phase3_simulation_reliability");
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

console.log("════════════════════════════════════════════════════════════════════");
console.log("  PHASE 3 OF 10: SPATIAL SIMULATION RELIABILITY SCREENSHOT CAPTURE  ");
console.log(`  Base URL: ${BASE_URL}`);
console.log(`  Output Directory: ${OUT_DIR}`);
console.log("════════════════════════════════════════════════════════════════════\n");

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  const browser = await puppeteer.launch({
    executablePath: BROWSER_PATH,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-gpu",
      "--window-size=1440,900",
    ],
    defaultViewport: { width: 1440, height: 900 },
  });

  const page = await browser.newPage();

  try {
    // 1. Initial Simulation State
    console.log("[1/10] Loading /admin/mumbai/simulation for Initial State...");
    await page.goto(`${BASE_URL}/admin/mumbai/simulation`, { waitUntil: "networkidle0", timeout: 45000 });
    await page.waitForSelector(".leaflet-container", { timeout: 20000 });
    await sleep(3000);

    await page.screenshot({
      path: path.join(OUT_DIR, "01_initial_simulation_state.png"),
      fullPage: false,
    });
    console.log("  ✓ Captured 01_initial_simulation_state.png");

    // 2. Actively Playing State
    console.log("[2/10] Triggering Play button to capture Actively Playing State...");
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const pBtn = btns.find((b) => b.textContent && b.textContent.includes("PLAY"));
      if (pBtn) pBtn.click();
    });
    await sleep(2000); // Allow playback loop to advance smoothly

    await page.screenshot({
      path: path.join(OUT_DIR, "02_actively_playing_playback.png"),
      fullPage: false,
    });
    console.log("  ✓ Captured 02_actively_playing_playback.png");

    // 3. Paused Playback State
    console.log("[3/10] Clicking Pause to capture Paused Playback State...");
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const pauseBtn = btns.find((b) => b.textContent && b.textContent.includes("PAUSE"));
      if (pauseBtn) pauseBtn.click();
    });
    await sleep(1500);

    await page.screenshot({
      path: path.join(OUT_DIR, "03_paused_playback_state.png"),
      fullPage: false,
    });
    console.log("  ✓ Captured 03_paused_playback_state.png");

    // 4. Later Time Step Evolution (T=4.0h)
    console.log("[4/10] Navigating to later time step (T=4.0h) via URL query...");
    await page.goto(`${BASE_URL}/admin/mumbai/simulation?scenario=rainfall_waterlogging&t=4&ward=L`, {
      waitUntil: "networkidle0",
      timeout: 35000,
    });
    await sleep(3000);

    await page.screenshot({
      path: path.join(OUT_DIR, "04_later_time_step_evolution.png"),
      fullPage: false,
    });
    console.log("  ✓ Captured 04_later_time_step_evolution.png");

    // 5. Different Inputs Recalculated (Extreme monsoon 90mm/h, 6h duration)
    console.log("[5/10] Loading different inputs (90 mm/h, duration=6h) to capture dynamic recalculated surface...");
    await page.goto(`${BASE_URL}/admin/mumbai/simulation?scenario=rainfall_waterlogging&t=2.5&rainfallRateMmH=90&durationHours=6&ward=L`, {
      waitUntil: "networkidle0",
      timeout: 35000,
    });
    await sleep(3000);

    await page.screenshot({
      path: path.join(OUT_DIR, "05_different_inputs_recalculated.png"),
      fullPage: false,
    });
    console.log("  ✓ Captured 05_different_inputs_recalculated.png");

    // 6. Selected Ward Focused & Bounding Box Fitted
    console.log("[6/10] Focusing Ward L with full inspection drawer and bounds fitting...");
    await page.evaluate(() => {
      const locateBtn = Array.from(document.querySelectorAll("button")).find((b) => b.textContent && b.textContent.includes("Locate"));
      if (locateBtn) locateBtn.click();
    });
    await sleep(2000);

    await page.screenshot({
      path: path.join(OUT_DIR, "06_selected_ward_focused.png"),
      fullPage: false,
    });
    console.log("  ✓ Captured 06_selected_ward_focused.png");

    // 7. Stable Header Inspection (High-resolution clip of the top ribbon)
    console.log("[7/10] Capturing zoomed inspection of the stable 3-column top header...");
    await page.screenshot({
      path: path.join(OUT_DIR, "07_stable_header_inspection.png"),
      clip: { x: 0, y: 0, width: 1440, height: 130 },
    });
    console.log("  ✓ Captured 07_stable_header_inspection.png (top toolbar ribbon)");

    // 8. Mobile Narrow Layout (390 x 844)
    console.log("[8/10] Resizing viewport to 390x844 for mobile layout verification...");
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await sleep(2000);

    await page.screenshot({
      path: path.join(OUT_DIR, "08_mobile_responsive_layout.png"),
      fullPage: false,
    });
    console.log("  ✓ Captured 08_mobile_responsive_layout.png");

    // Restore desktop viewport
    await page.setViewport({ width: 1440, height: 900 });
    await sleep(1000);

    // 9. Ranked Ward Selection (Switch to Ranked tab & select Ward F/South)
    console.log("[9/10] Switching to Ranked Wards tab and selecting Ward F/South...");
    await page.evaluate(() => {
      const tabBtns = Array.from(document.querySelectorAll("button"));
      const rankedBtn = tabBtns.find((b) => b.textContent && b.textContent.includes("Ranked"));
      if (rankedBtn) rankedBtn.click();
    });
    await sleep(1500);

    // Click on a ward item in the ranked list
    await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll("div")).filter((d) => d.textContent && d.textContent.includes("F/South"));
      if (rows.length > 0) {
        rows[0].click();
      }
    });
    await sleep(2000);

    await page.screenshot({
      path: path.join(OUT_DIR, "09_ranked_ward_selection.png"),
      fullPage: false,
    });
    console.log("  ✓ Captured 09_ranked_ward_selection.png");

    // 10. Report Staleness Synchronization (Simulation Report Studio with modified timeline)
    console.log("[10/10] Loading Simulation Report Studio with outdated param/t to verify staleness banner...");
    await page.goto(`${BASE_URL}/admin/mumbai/simulation/report?scenario=rainfall_waterlogging&t=4.5&ward=L&rainfallRateMmH=110`, {
      waitUntil: "networkidle0",
      timeout: 35000,
    });
    await sleep(3500);

    await page.screenshot({
      path: path.join(OUT_DIR, "10_report_staleness_sync.png"),
      fullPage: false,
    });
    console.log("  ✓ Captured 10_report_staleness_sync.png");

    console.log("\n════════════════════════════════════════════════════════════════════");
    console.log("  SUCCESS: ALL 10 PHASE 3 VERIFICATION SCREENSHOTS CAPTURED!");
    console.log(`  Directory: ${OUT_DIR}`);
    console.log("════════════════════════════════════════════════════════════════════\n");
  } catch (err) {
    console.error("Screenshot capture failed:", err);
  } finally {
    await browser.close();
  }
}

run();
