/**
 * scripts/capture-shot9.mjs
 * Sentinel City Intelligence — Prompt 4 Mobile Screenshot Capture
 */

import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BROWSER_PATH = fs.existsSync(EDGE_PATH) ? EDGE_PATH : CHROME_PATH;

const OUT_DIR = path.resolve(process.cwd(), 'public', 'screenshots', 'prompt4');
const ARTIFACT_DIR = 'C:\\Users\\omsat\\.gemini\\antigravity-ide\\brain\\dd909e61-f00a-4f16-91e8-d68571aeba71';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function capture() {
  console.log('Capturing prompt4_09_mobile_viewport.png (390x844)...');

  const browser = await puppeteer.launch({
    executablePath: BROWSER_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-gpu',
      '--window-size=390,844',
      '--hide-scrollbars',
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });

  try {
    await page.goto('http://localhost:3005/admin/mumbai/simulation/report?scenario=rainfall_waterlogging&t=2.0', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    console.log('Page loaded, waiting for dossier compilation...');
    await page.waitForFunction(() => !document.querySelector('.animate-spin'), { timeout: 45000 });
    await sleep(2500);

    const path9 = path.join(OUT_DIR, 'prompt4_09_mobile_viewport.png');
    await page.screenshot({ path: path9 });

    const artP = path.join(ARTIFACT_DIR, 'prompt4_09_mobile_viewport.png');
    try {
      fs.copyFileSync(path9, artP);
    } catch {}

    console.log(`  ✓ Successfully saved ${path9} (${(fs.statSync(path9).size / 1024).toFixed(1)} KB)`);
  } catch (err) {
    console.error('Error capturing shot 9:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

capture();
