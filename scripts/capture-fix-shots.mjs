import fs from "fs";
import path from "path";
import puppeteer from "puppeteer-core";

const BASE_URL = process.env.TEST_URL || "http://localhost:3000";
const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const BROWSER_PATH = fs.existsSync(CHROME_PATH) ? CHROME_PATH : EDGE_PATH;
const OUT_DIR = path.resolve(process.cwd(), "public", "screenshots", "phase5_telemetry");
const BRAIN_DIR = "C:\\Users\\omsat\\.gemini\\antigravity-ide\\brain\\e0b45031-f0f8-4066-8567-28eef54a4f96";

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
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu", "--window-size=1520,960"],
    defaultViewport: { width: 1520, height: 960 },
  });

  const page = await browser.newPage();

  try {
    console.log("Navigating to Parameter Explorer...");
    await page.goto(`${BASE_URL}/admin/mumbai/telemetry-lab?tab=parameters`, {
      waitUntil: "networkidle0",
      timeout: 45000,
    });
    await sleep(3000);

    // Click using mouse on the exact coordinates of the first card's "Inspect & Rules"
    const clickedDrawer = await page.evaluate(() => {
      const spans = Array.from(document.querySelectorAll("span"));
      const target = spans.find((s) => s.textContent && s.textContent.includes("Inspect & Rules"));
      if (target) {
        target.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
        return true;
      }
      return false;
    });
    console.log("Clicked drawer target with dispatchEvent:", clickedDrawer);
    await sleep(3000);

    const shot3 = path.join(OUT_DIR, "03_parameter_detail_drawer_plain_language.png");
    await page.screenshot({ path: shot3, fullPage: false });
    await copyToBrain(shot3, "phase5_03_parameter_detail_drawer_plain_language.png");
    console.log("✓ Captured 03_parameter_detail_drawer_plain_language.png");
  } finally {
    await browser.close();
  }
}

run();
