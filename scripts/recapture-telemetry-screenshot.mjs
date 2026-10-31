import fs from "fs";
import path from "path";
import puppeteer from "puppeteer-core";

const ARTIFACT_DIR = "C:\\Users\\omsat\\.gemini\\antigravity-ide\\brain\\e0b45031-f0f8-4066-8567-28eef54a4f96";
const TARGET_PATH_PUBLIC = path.resolve(process.cwd(), "public", "screenshots", "phase10_master", "phase10_12_opened_telemetry_pdf_graphs.png");
const TARGET_PATH_ARTIFACT = path.join(ARTIFACT_DIR, "phase10_12_opened_telemetry_pdf_graphs.png");

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

async function run() {
  const browser = await puppeteer.launch({
    executablePath: findChrome(),
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    defaultViewport: { width: 1280, height: 1100 },
  });

  const page = await browser.newPage();
  await page.goto("http://localhost:3000/api/admin/reports/telemetry-pdf?city=mumbai&tab=overview&format=html", {
    waitUntil: "networkidle0",
  });

  await page.screenshot({ path: TARGET_PATH_PUBLIC });
  await page.screenshot({ path: TARGET_PATH_ARTIFACT });
  await browser.close();

  console.log("Captured updated screenshot to:");
  console.log("  ", TARGET_PATH_PUBLIC);
  console.log("  ", TARGET_PATH_ARTIFACT);
}

run().catch(console.error);
