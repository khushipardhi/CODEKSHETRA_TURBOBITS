import fs from "fs";
import path from "path";
import puppeteer from "puppeteer-core";

const ARTIFACT_DIR = "C:\\Users\\omsat\\.gemini\\antigravity-ide\\brain\\e0b45031-f0f8-4066-8567-28eef54a4f96";
const OUT_DIR = path.resolve(process.cwd(), "public", "screenshots", "homepage_redesign");

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

function findChrome() {
  const paths = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  ];
  for (const p of paths) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error("No Chrome/Edge browser found");
}

async function capture() {
  const browser = await puppeteer.launch({
    executablePath: findChrome(),
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem("urban-link-city", "mumbai");
  });

  // 1. Desktop Hero (1280x900)
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle0" });
  await page.screenshot({ path: path.join(OUT_DIR, "after_01_desktop_hero.png") });
  fs.copyFileSync(path.join(OUT_DIR, "after_01_desktop_hero.png"), path.join(ARTIFACT_DIR, "after_01_desktop_hero.png"));

  // 2. Full Desktop Page
  await page.screenshot({ path: path.join(OUT_DIR, "after_02_full_desktop_page.png"), fullPage: true });
  fs.copyFileSync(path.join(OUT_DIR, "after_02_full_desktop_page.png"), path.join(ARTIFACT_DIR, "after_02_full_desktop_page.png"));

  // 3. Platform Overview (#overview)
  const overviewEl = await page.$("#overview");
  if (overviewEl) {
    await overviewEl.screenshot({ path: path.join(OUT_DIR, "after_03_platform_overview.png") });
    fs.copyFileSync(path.join(OUT_DIR, "after_03_platform_overview.png"), path.join(ARTIFACT_DIR, "after_03_platform_overview.png"));
  }

  // 4. Interactive Intelligence Canvas (#interactive-canvas)
  const canvasEl = await page.$("#interactive-canvas");
  if (canvasEl) {
    await canvasEl.screenshot({ path: path.join(OUT_DIR, "after_04_interactive_canvas.png") });
    fs.copyFileSync(path.join(OUT_DIR, "after_04_interactive_canvas.png"), path.join(ARTIFACT_DIR, "after_04_interactive_canvas.png"));
  }

  // 5. Spatial Simulation Preview (#simulation)
  const simEl = await page.$("#simulation");
  if (simEl) {
    await simEl.screenshot({ path: path.join(OUT_DIR, "after_05_simulation_preview.png") });
    fs.copyFileSync(path.join(OUT_DIR, "after_05_simulation_preview.png"), path.join(ARTIFACT_DIR, "after_05_simulation_preview.png"));
  }

  // 6. Telemetry Section (#telemetry)
  const telemEl = await page.$("#telemetry");
  if (telemEl) {
    await telemEl.screenshot({ path: path.join(OUT_DIR, "after_06_telemetry_section.png") });
    fs.copyFileSync(path.join(OUT_DIR, "after_06_telemetry_section.png"), path.join(ARTIFACT_DIR, "after_06_telemetry_section.png"));
  }

  // 7. Sentinel AI Section (#sentinel-ai)
  const aiEl = await page.$("#sentinel-ai");
  if (aiEl) {
    await aiEl.screenshot({ path: path.join(OUT_DIR, "after_07_sentinel_ai_section.png") });
    fs.copyFileSync(path.join(OUT_DIR, "after_07_sentinel_ai_section.png"), path.join(ARTIFACT_DIR, "after_07_sentinel_ai_section.png"));
  }

  // 8. Workspaces Directory (#workspaces)
  const wsEl = await page.$("#workspaces");
  if (wsEl) {
    await wsEl.screenshot({ path: path.join(OUT_DIR, "after_08_workspaces_directory.png") });
    fs.copyFileSync(path.join(OUT_DIR, "after_08_workspaces_directory.png"), path.join(ARTIFACT_DIR, "after_08_workspaces_directory.png"));
  }

  // 9. Dark Theme Full Viewport
  await page.evaluate(() => {
    document.documentElement.setAttribute("data-theme", "dark");
  });
  await new Promise((r) => setTimeout(r, 400));
  await page.screenshot({ path: path.join(OUT_DIR, "after_09_dark_theme_desktop.png") });
  fs.copyFileSync(path.join(OUT_DIR, "after_09_dark_theme_desktop.png"), path.join(ARTIFACT_DIR, "after_09_dark_theme_desktop.png"));

  // Switch back to light for mobile
  await page.evaluate(() => {
    document.documentElement.removeAttribute("data-theme");
  });

  // 10. Mobile Hero (390x844)
  await page.setViewport({ width: 390, height: 844 });
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle0" });
  await page.screenshot({ path: path.join(OUT_DIR, "after_10_mobile_hero.png") });
  fs.copyFileSync(path.join(OUT_DIR, "after_10_mobile_hero.png"), path.join(ARTIFACT_DIR, "after_10_mobile_hero.png"));

  // 11. Full Mobile Page
  await page.screenshot({ path: path.join(OUT_DIR, "after_11_full_mobile_page.png"), fullPage: true });
  fs.copyFileSync(path.join(OUT_DIR, "after_11_full_mobile_page.png"), path.join(ARTIFACT_DIR, "after_11_full_mobile_page.png"));

  // 12. Mobile Workspace Navigation Menu Open
  const menuBtn = await page.$("button[aria-label='Toggle Navigation Menu']");
  if (menuBtn) {
    await menuBtn.click();
    await new Promise((r) => setTimeout(r, 400));
    await page.screenshot({ path: path.join(OUT_DIR, "after_12_mobile_menu_open.png") });
    fs.copyFileSync(path.join(OUT_DIR, "after_12_mobile_menu_open.png"), path.join(ARTIFACT_DIR, "after_12_mobile_menu_open.png"));
  }

  // 13. Ultra-Narrow 320px Viewport Check (iPhone SE)
  await page.setViewport({ width: 320, height: 568 });
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle0" });
  await page.screenshot({ path: path.join(OUT_DIR, "after_13_responsive_320_check.png") });
  fs.copyFileSync(path.join(OUT_DIR, "after_13_responsive_320_check.png"), path.join(ARTIFACT_DIR, "after_13_responsive_320_check.png"));

  await browser.close();
  console.log("All after screenshots captured successfully!");
}

capture().catch(console.error);
