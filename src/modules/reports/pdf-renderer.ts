/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — PDF Rendering Engine
   Phase 4: High-Fidelity Headless Chrome PDF Pipeline
   ════════════════════════════════════════════════════════ */

import fs from "fs";
import path from "path";
import puppeteer from "puppeteer-core";
import type { PDFGenerationOptions } from "./contracts";

export function findBrowserExecutable(): string {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) {
    return process.env.CHROME_PATH;
  }

  // Windows standard paths
  const winChrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  const winChromeX86 = "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe";
  const winEdge = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
  const winEdge64 = "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe";

  if (fs.existsSync(winChrome)) return winChrome;
  if (fs.existsSync(winChromeX86)) return winChromeX86;
  if (fs.existsSync(winEdge)) return winEdge;
  if (fs.existsSync(winEdge64)) return winEdge64;

  // Linux standard paths
  const linuxPaths = [
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ];
  for (const lp of linuxPaths) {
    if (fs.existsSync(/*turbopackIgnore: true*/ lp)) return lp;
  }

  // macOS standard paths
  const macPaths = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  ];
  for (const mp of macPaths) {
    if (fs.existsSync(/*turbopackIgnore: true*/ mp)) return mp;
  }

  throw new Error("No compatible Chromium or Edge browser executable found on system.");
}

export async function renderHtmlToPdf(
  htmlContent: string,
  options: PDFGenerationOptions = {}
): Promise<Buffer> {
  const browserPath = findBrowserExecutable();

  const browser = await puppeteer.launch({
    executablePath: browserPath,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--no-first-run",
      "--no-default-browser-check",
    ],
  });

  try {
    const page = await browser.newPage();
    
    // Set viewport for print emulation
    await page.setViewport({ width: 1200, height: 1600, deviceScaleFactor: 2 });

    // Load full HTML content
    await page.setContent(htmlContent, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    // Emulate print media for clean layout
    await page.emulateMediaType("print");

    const pdfUint8Array = await page.pdf({
      format: options.format || "A4",
      landscape: options.landscape || false,
      printBackground: options.printBackground !== false,
      margin: options.margin || {
        top: "14mm",
        bottom: "16mm",
        left: "12mm",
        right: "12mm",
      },
      displayHeaderFooter: options.displayHeaderFooter !== false,
      headerTemplate: options.headerTemplate || "<div></div>",
      footerTemplate:
        options.footerTemplate ||
        `<div style="font-size: 7.5pt; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; width: 100%; padding: 0 12mm; display: flex; justify-content: space-between; color: #64748b; border-top: 0.5px solid #e2e8f0; padding-top: 3mm;">
          <span style="font-weight: 700; text-transform: uppercase;">MUNICIPAL CORPORATION OF GREATER MUMBAI (MCGM) · DISASTER MANAGEMENT CELL</span>
          <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
        </div>`,
    });

    const buffer = Buffer.from(pdfUint8Array);

    // Strict validation: check PDF signature
    if (!buffer || buffer.length < 500) {
      throw new Error(`Generated PDF is suspiciously small (${buffer.length} bytes)`);
    }

    const header = buffer.subarray(0, 5).toString("ascii");
    if (!header.startsWith("%PDF-")) {
      throw new Error(`Invalid PDF header: "${header}", expected "%PDF-"`);
    }

    return buffer;
  } finally {
    await browser.close();
  }
}
