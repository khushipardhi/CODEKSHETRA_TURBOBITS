/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — PDF Rendering Engine
   Phase 4: High-Fidelity Headless Chrome PDF Pipeline
   with Zero-Dependency Pure PDF Fallback Engine
   ════════════════════════════════════════════════════════ */

import fs from "fs";
import puppeteer from "puppeteer-core";
import type { PDFGenerationOptions } from "./contracts";
import { generatePurePdfFallback } from "./pure-pdf-fallback";

/**
 * Discovers any available Chromium-based browser executable on the host system.
 * Returns null if no compatible browser is found (triggering pure PDF fallback).
 */
export function findBrowserExecutable(): string | null {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) {
    return process.env.CHROME_PATH;
  }

  const localAppData = process.env.LOCALAPPDATA || "";
  const programFiles = process.env.ProgramFiles || "C:\\Program Files";
  const programFilesX86 = process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)";

  // Windows candidate executable paths (Chrome, Edge, Brave, Chromium)
  const winCandidates = [
    // Google Chrome
    `${programFiles}\\Google\\Chrome\\Application\\chrome.exe`,
    `${programFilesX86}\\Google\\Chrome\\Application\\chrome.exe`,
    localAppData ? `${localAppData}\\Google\\Chrome\\Application\\chrome.exe` : "",

    // Microsoft Edge
    `${programFiles}\\Microsoft\\Edge\\Application\\msedge.exe`,
    `${programFilesX86}\\Microsoft\\Edge\\Application\\msedge.exe`,
    localAppData ? `${localAppData}\\Microsoft\\Edge\\Application\\msedge.exe` : "",

    // Brave Browser
    `${programFiles}\\BraveSoftware\\Brave-Browser\\Application\\brave.exe`,
    `${programFilesX86}\\BraveSoftware\\Brave-Browser\\Application\\brave.exe`,
    localAppData ? `${localAppData}\\BraveSoftware\\Brave-Browser\\Application\\brave.exe` : "",

    // Chromium & Developer builds
    localAppData ? `${localAppData}\\Chromium\\Application\\chrome.exe` : "",
    `${programFiles}\\Chromium\\Application\\chrome.exe`,
  ].filter(Boolean);

  for (const p of winCandidates) {
    if (fs.existsSync(p)) return p;
  }

  // Linux standard candidate paths
  const linuxPaths = [
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/brave-browser",
    "/snap/bin/chromium",
  ];
  for (const lp of linuxPaths) {
    try {
      if (fs.existsSync(lp)) return lp;
    } catch {}
  }

  // macOS standard candidate paths
  const macPaths = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
  ];
  for (const mp of macPaths) {
    try {
      if (fs.existsSync(mp)) return mp;
    } catch {}
  }

  return null;
}

/**
 * Renders an HTML report to PDF.
 * Attempts headless browser rendering with puppeteer-core first.
 * If browser binary is absent or crashes (e.g. Vercel serverless / container),
 * transparently falls back to the pure-PDF fallback engine.
 */
export async function renderHtmlToPdf(
  htmlContent: string,
  options: PDFGenerationOptions = {}
): Promise<Buffer> {
  const browserPath = findBrowserExecutable();

  if (browserPath) {
    try {
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
          timeout: 25000,
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

        // Verify valid PDF signature
        if (buffer && buffer.length >= 500 && buffer.subarray(0, 5).toString("ascii").startsWith("%PDF-")) {
          return buffer;
        }
      } finally {
        await browser.close().catch(() => {});
      }
    } catch (puppeteerErr) {
      console.warn(
        "[PDFRenderer] Puppeteer execution failed, falling back to pure PDF engine:",
        puppeteerErr instanceof Error ? puppeteerErr.message : puppeteerErr
      );
    }
  } else {
    console.warn(
      "[PDFRenderer] No compatible Chromium/Edge binary found on system. Utilizing resilient pure-PDF fallback engine..."
    );
  }

  // Pure PDF engine fallback
  const fallbackBuffer = await generatePurePdfFallback(htmlContent, options);
  if (!fallbackBuffer || !fallbackBuffer.subarray(0, 5).toString("ascii").startsWith("%PDF-")) {
    throw new Error("Failed to generate valid PDF buffer using fallback engine");
  }

  return fallbackBuffer;
}
