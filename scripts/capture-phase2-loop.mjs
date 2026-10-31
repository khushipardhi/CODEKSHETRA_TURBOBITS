/**
 * scripts/capture-phase2-loop.mjs
 * Captures all 10 verified screenshot loop images required by Sentinel Phase 2.
 */

import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE_URL = "http://localhost:3000";
const OUTPUT_DIR = path.resolve(process.cwd(), "public", "screenshots", "phase2_loop");

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  console.log("Launching Chrome at:", CHROME_PATH);
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu", "--window-size=1600,1000"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000, deviceScaleFactor: 1 });

  async function capture(name, url, waitMs = 3500) {
    console.log(`[Capturing ${name}] -> ${url}`);
    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
    await sleep(waitMs);
    const dest = path.join(OUTPUT_DIR, name);
    await page.screenshot({ path: dest, fullPage: false });
    console.log(`  ✓ Saved: ${dest} (${fs.statSync(dest).size} bytes)`);
  }

  try {
    // 1. Full Mumbai geography with base map and ward boundaries
    await capture(
      "01_full_mumbai_geography.png",
      `${BASE_URL}/admin/mumbai/simulation?scenario=rainfall_waterlogging&t=1`
    );

    // 2. Low-intensity scenario (20 mm/h)
    await capture(
      "02_low_intensity_scenario.png",
      `${BASE_URL}/admin/mumbai/simulation?scenario=rainfall_waterlogging&rainfallRateMmH=20&t=1`
    );

    // 3. Medium-intensity scenario (50 mm/h)
    await capture(
      "03_medium_intensity_scenario.png",
      `${BASE_URL}/admin/mumbai/simulation?scenario=rainfall_waterlogging&rainfallRateMmH=50&t=1`
    );

    // 4. High-intensity scenario (90 mm/h cloudburst, 45% blockage)
    await capture(
      "04_high_intensity_scenario.png",
      `${BASE_URL}/admin/mumbai/simulation?scenario=rainfall_waterlogging&rainfallRateMmH=90&drainageBlockagePct=45&t=3`
    );

    // 5. Timeline progression: T=0h, T=2h, T=5h
    await capture(
      "05_timeline_t0h.png",
      `${BASE_URL}/admin/mumbai/simulation?scenario=rainfall_waterlogging&t=0`
    );
    await capture(
      "05_timeline_t2h.png",
      `${BASE_URL}/admin/mumbai/simulation?scenario=rainfall_waterlogging&t=2`
    );
    await capture(
      "05_timeline_t5h.png",
      `${BASE_URL}/admin/mumbai/simulation?scenario=rainfall_waterlogging&t=5`
    );

    // 6. Selected ward with complete impact details (Ward L Kurla with disaggregated variables and assets)
    await capture(
      "06_ward_detail_complete.png",
      `${BASE_URL}/admin/mumbai/simulation?scenario=rainfall_waterlogging&ward=L&tab=ward_detail&t=2`
    );

    // 7. Ranking selection highlighting the correct ward (Ranked list open)
    await capture(
      "07_ranking_selection_highlight.png",
      `${BASE_URL}/admin/mumbai/simulation?scenario=rainfall_waterlogging&tab=ranked&ward=F/South&t=2`
    );

    // 8. Continuous spatial surface (Isoband mode)
    // Click on Isoband pill in UI or load
    await page.goto(`${BASE_URL}/admin/mumbai/simulation?scenario=rainfall_waterlogging&t=2`, { waitUntil: "networkidle2" });
    await sleep(2500);
    // Click Isobands button
    const buttons = await page.$$("button");
    for (const b of buttons) {
      const text = await (await b.getProperty("textContent")).jsonValue();
      if (text && text.trim() === "Isobands") {
        await b.click();
        break;
      }
    }
    await sleep(1500);
    const destIso = path.join(OUTPUT_DIR, "08_continuous_isoband_surface.png");
    await page.screenshot({ path: destIso });
    console.log(`  ✓ Saved: ${destIso}`);

    // 9. Ward-level fill (Choropleth mode)
    for (const b of buttons) {
      const text = await (await b.getProperty("textContent")).jsonValue();
      if (text && text.trim() === "Choropleth") {
        await b.click();
        break;
      }
    }
    await sleep(1500);
    const destChoro = path.join(OUTPUT_DIR, "09_ward_choropleth_surface.png");
    await page.screenshot({ path: destChoro });
    console.log(`  ✓ Saved: ${destChoro}`);

    // 10a. Desktop Layout (Studio Dual-Panel & Legend)
    await page.goto(`${BASE_URL}/admin/mumbai/simulation?scenario=coastal_monsoon_surge&t=2&tab=ward_detail&ward=A`, { waitUntil: "networkidle2" });
    await sleep(2500);
    const destDesktop = path.join(OUTPUT_DIR, "10_desktop_layout_studio.png");
    await page.screenshot({ path: destDesktop });
    console.log(`  ✓ Saved: ${destDesktop}`);

    // 10b. Mobile Viewport Layout
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await page.goto(`${BASE_URL}/admin/mumbai/simulation?scenario=rainfall_waterlogging&t=2`, { waitUntil: "networkidle2" });
    await sleep(3000);
    const destMobile = path.join(OUTPUT_DIR, "10_mobile_viewport_layout.png");
    await page.screenshot({ path: destMobile });
    console.log(`  ✓ Saved: ${destMobile}`);

    console.log("\nAll 10 screenshot loops completed successfully!");
  } catch (err) {
    console.error("Error capturing screenshots:", err);
  } finally {
    await browser.close();
  }
}

run();
