import fs from "fs";
import path from "path";
import puppeteer from "puppeteer-core";

const ARTIFACT_DIR = "C:\\Users\\omsat\\.gemini\\antigravity-ide\\brain\\e0b45031-f0f8-4066-8567-28eef54a4f96";
const OUT_DIR = path.resolve(process.cwd(), "public", "screenshots", "homepage_redesign");

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

  // Desktop before
  const pageDesk = await browser.newPage();
  await pageDesk.setViewport({ width: 1280, height: 900 });
  await pageDesk.evaluateOnNewDocument(() => {
    localStorage.setItem("urban-link-city", "mumbai");
  });
  await pageDesk.goto("http://localhost:3000/", { waitUntil: "networkidle0" });
  await pageDesk.screenshot({ path: path.join(OUT_DIR, "before_desktop.png"), fullPage: false });
  await pageDesk.screenshot({ path: path.join(OUT_DIR, "before_desktop_fullpage.png"), fullPage: true });
  fs.copyFileSync(path.join(OUT_DIR, "before_desktop.png"), path.join(ARTIFACT_DIR, "homepage_before_desktop.png"));

  // Mobile before
  const pageMob = await browser.newPage();
  await pageMob.setViewport({ width: 390, height: 844 });
  await pageMob.evaluateOnNewDocument(() => {
    localStorage.setItem("urban-link-city", "mumbai");
  });
  await pageMob.goto("http://localhost:3000/", { waitUntil: "networkidle0" });
  await pageMob.screenshot({ path: path.join(OUT_DIR, "before_mobile.png"), fullPage: false });
  await pageMob.screenshot({ path: path.join(OUT_DIR, "before_mobile_fullpage.png"), fullPage: true });
  fs.copyFileSync(path.join(OUT_DIR, "before_mobile.png"), path.join(ARTIFACT_DIR, "homepage_before_mobile.png"));

  await browser.close();
  console.log("Captured unblocked before screenshots successfully!");
}

capture().catch(console.error);
