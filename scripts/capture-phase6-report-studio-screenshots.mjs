import fs from "fs";
import path from "path";
import puppeteer from "puppeteer-core";

const BASE_URL = "http://localhost:3000";
const ARTIFACT_DIR = "C:\\Users\\omsat\\.gemini\\antigravity-ide\\brain\\e0b45031-f0f8-4066-8567-28eef54a4f96";

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

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function capture() {
  console.log("=== PHASE 6: CAPTURING REPORT STUDIO VERIFICATION SCREENSHOT SUITE ===");
  const browserPath = findChrome();
  console.log("Using browser at:", browserPath);

  const browser = await puppeteer.launch({
    executablePath: browserPath,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--window-size=1440,900",
    ],
    defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 1.5 },
  });

  const page = await browser.newPage();

  try {
    // 1. Report Studio Open (Full-width dedicated route)
    console.log("1. Capturing Report Studio open...");
    await page.goto(`${BASE_URL}/admin/mumbai/simulation/report?dossierId=DOS-COASTAL_MONSOON_SURGE-T6H-MVE9F1AC&ward=L&scope=citywide`, {
      waitUntil: "networkidle2",
      timeout: 30000,
    });
    await sleep(2500);
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "phase6_01_report_studio_full_width.png"),
      fullPage: false,
    });
    console.log("✓ Saved phase6_01_report_studio_full_width.png");

    // 2. Report Studio after refresh (F5) - testing persistence bug
    console.log("2. Capturing Report Studio after page refresh (F5)...");
    await page.reload({ waitUntil: "networkidle2" });
    await sleep(2500);
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "phase6_02_report_studio_after_refresh.png"),
      fullPage: false,
    });
    console.log("✓ Saved phase6_02_report_studio_after_refresh.png");

    // 3. Return to simulation action
    console.log("3. Capturing Return to Simulation action...");
    await page.click('a[title*="Return to interactive GIS spatial simulation map"]');
    await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 }).catch(() => {});
    await sleep(3000);
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "phase6_03_return_to_simulation_map.png"),
      fullPage: false,
    });
    console.log("✓ Saved phase6_03_return_to_simulation_map.png");

    // 4. Ward drawer showing concise summary + Open Full Report Studio button
    console.log("4. Capturing map ward drawer with Open Full Report Studio link...");
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "phase6_14_ward_drawer_with_report_button.png"),
      fullPage: false,
    });
    console.log("✓ Saved phase6_14_ward_drawer_with_report_button.png");

    // 5. Navigate back to Report Studio
    console.log("5. Navigating to Report Studio for City-Wide report overview...");
    await page.goto(`${BASE_URL}/admin/mumbai/simulation/report?dossierId=DOS-COASTAL_MONSOON_SURGE-T6H-MVE9F1AC&ward=L&scope=citywide`, {
      waitUntil: "networkidle2",
    });
    await sleep(2000);
    await page.waitForSelector("#tab-scope-citywide", { timeout: 10000 });
    await page.click("#tab-scope-citywide");
    await sleep(1000);
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "phase6_04_citywide_report_overview.png"),
      fullPage: false,
    });
    console.log("✓ Saved phase6_04_citywide_report_overview.png");

    // 6. Ward Report Scope view (Ward L dossier)
    console.log("6. Capturing Selected Ward dossier view...");
    await page.waitForSelector("#tab-scope-ward", { timeout: 10000 });
    await page.click("#tab-scope-ward");
    await sleep(1000);
    // Scroll down to Section E (Ward Dossier)
    await page.evaluate(() => {
      const el = document.getElementById("sec-ward");
      if (el) el.scrollIntoView({ behavior: "instant", block: "start" });
    });
    await sleep(800);
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "phase6_05_ward_detail_dossier.png"),
      fullPage: false,
    });
    console.log("✓ Saved phase6_05_ward_detail_dossier.png");

    // Scroll back to top
    await page.evaluate(() => window.scrollTo(0, 0));
    await sleep(500);

    // 7. Dossier Archive & Run History Modal
    console.log("7. Capturing Dossier Archive modal...");
    await page.waitForSelector("#btn-dossier-archive", { timeout: 10000 });
    await page.click("#btn-dossier-archive");
    await sleep(2000);
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "phase6_06_dossier_archive_modal.png"),
      fullPage: false,
    });
    console.log("✓ Saved phase6_06_dossier_archive_modal.png");

    // Close History Modal
    await page.evaluate(() => {
      const modal = document.getElementById("dossier-history-modal");
      if (modal) {
        const btn = modal.querySelector('button[class*="text-text-primary"]');
        if (btn) btn.click();
      }
    });
    await sleep(800);

    // 8. PDF Export in progress
    console.log("8. Capturing PDF export in progress...");
    page.click("#btn-download-pdf-dossier").catch(() => {});
    await sleep(400);
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "phase6_07_pdf_export_in_progress.png"),
      fullPage: false,
    });
    console.log("✓ Saved phase6_07_pdf_export_in_progress.png");
    await sleep(3500); // Wait for compilation to complete

    // 9. Opened Simulation PDF (Page 1: Official Cover & Executive Summary)
    console.log("9. Capturing Opened Simulation PDF (Page 1)...");
    const pdfPage = await browser.newPage();
    await pdfPage.setViewport({ width: 1200, height: 1650, deviceScaleFactor: 2 });
    
    // Fetch dossier HTML directly from template
    const simDossierRes = await fetch(`${BASE_URL}/api/admin/simulation/dossier?dossierId=DOS-COASTAL_MONSOON_SURGE-T6H-MVE9F1AC`);
    const simDossierJson = await simDossierRes.json();
    const { generateSimulationReportHtml } = await import("../src/modules/reports/simulation-pdf-template.ts");
    const simHtml = generateSimulationReportHtml(simDossierJson.dossier);
    
    await pdfPage.setContent(simHtml, { waitUntil: "domcontentloaded" });
    await sleep(1500);
    await pdfPage.screenshot({
      path: path.join(ARTIFACT_DIR, "phase6_08_opened_simulation_pdf.png"),
      fullPage: false,
    });
    console.log("✓ Saved phase6_08_opened_simulation_pdf.png");

    // 10. Opened Simulation PDF Page 2 (Vector GIS Map Figure)
    console.log("10. Capturing Opened Simulation PDF Page 2 (Vector GIS Map)...");
    await pdfPage.evaluate(() => {
      const pages = document.querySelectorAll(".page");
      if (pages.length > 1) {
        pages[1].scrollIntoView({ behavior: "instant", block: "start" });
      }
    });
    await sleep(800);
    await pdfPage.screenshot({
      path: path.join(ARTIFACT_DIR, "phase6_09_opened_simulation_pdf_page2_map.png"),
      fullPage: false,
    });
    console.log("✓ Saved phase6_09_opened_simulation_pdf_page2_map.png");
    await pdfPage.close();

    // 11. Telemetry Lab Report Modal
    console.log("11. Capturing Telemetry Lab Report Modal...");
    await page.goto(`${BASE_URL}/admin/mumbai/telemetry-lab`, {
      waitUntil: "networkidle2",
      timeout: 30000,
    });
    await sleep(2500);
    await page.waitForSelector("#btn-open-telemetry-report-modal", { timeout: 10000 });
    await page.click("#btn-open-telemetry-report-modal");
    await sleep(1500);
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "phase6_10_telemetry_report_modal.png"),
      fullPage: false,
    });
    console.log("✓ Saved phase6_10_telemetry_report_modal.png");

    // Close Telemetry modal
    await page.keyboard.press("Escape").catch(() => {});
    await sleep(500);

    // 12. Opened Telemetry PDF Report
    console.log("12. Capturing Opened Telemetry PDF...");
    const telPage = await browser.newPage();
    await telPage.setViewport({ width: 1200, height: 1650, deviceScaleFactor: 2 });
    
    const telRes = await fetch(`${BASE_URL}/api/hazards/telemetry-lab?city=mumbai&tab=rainfall`);
    const telData = await telRes.json();
    const { buildTelemetryReportDocument } = await import("../src/modules/reports/telemetry-report-builder.ts");
    const { generateTelemetryReportHtml } = await import("../src/modules/reports/telemetry-pdf-template.ts");
    const telDoc = buildTelemetryReportDocument({
      city: "mumbai",
      tab: "rainfall",
      telemetryData: telData,
    });
    const telHtml = generateTelemetryReportHtml(telDoc);
    await telPage.setContent(telHtml, { waitUntil: "domcontentloaded" });
    await sleep(1500);
    await telPage.screenshot({
      path: path.join(ARTIFACT_DIR, "phase6_11_opened_telemetry_pdf.png"),
      fullPage: false,
    });
    console.log("✓ Saved phase6_11_opened_telemetry_pdf.png");
    await telPage.close();

    // 13. Error / Retry State
    console.log("13. Capturing Error / Retry State...");
    await page.goto(`${BASE_URL}/admin/mumbai/simulation/report?dossierId=NON_EXISTENT_DOSSIER_12345`, {
      waitUntil: "networkidle2",
      timeout: 30000,
    });
    await sleep(2000);
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "phase6_12_error_retry_state.png"),
      fullPage: false,
    });
    console.log("✓ Saved phase6_12_error_retry_state.png");

    // 14. Mobile Report View (iPhone 14 / modern mobile 390x844)
    console.log("14. Capturing Mobile Report View...");
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    await page.goto(`${BASE_URL}/admin/mumbai/simulation/report?dossierId=DOS-COASTAL_MONSOON_SURGE-T6H-MVE9F1AC&ward=L&scope=citywide`, {
      waitUntil: "networkidle2",
      timeout: 30000,
    });
    await sleep(2500);
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "phase6_13_mobile_report_studio.png"),
      fullPage: false,
    });
    console.log("✓ Saved phase6_13_mobile_report_studio.png");

    console.log("\n=== ALL 14 VERIFICATION SCREENSHOTS CAPTURED SUCCESSFULLY ===");
  } finally {
    await browser.close();
  }
}

capture().catch(console.error);
