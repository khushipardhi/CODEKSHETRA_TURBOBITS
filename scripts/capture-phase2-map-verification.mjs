/**
 * scripts/capture-phase2-map-verification.mjs
 * Captures 10 comprehensive verification states for Sentinel City Intelligence
 * Phase 2 of 10: Hazard & Incident Map
 * (Unwanted Clustering Removed, OSM Defaults Restored, Smooth Hardware-Accelerated Performance)
 */

import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer-core';

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BROWSER_PATH = fs.existsSync(CHROME_PATH) ? CHROME_PATH : EDGE_PATH;

const OUT_DIR = path.resolve(process.cwd(), 'public', 'screenshots', 'phase2_incident_map');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

console.log('════════════════════════════════════════════════════════════════════');
console.log('  PHASE 2 OF 10: HAZARD & INCIDENT MAP VERIFICATION CAPTURE         ');
console.log(`  Base URL: ${BASE_URL}`);
console.log(`  Output Directory: ${OUT_DIR}`);
console.log('════════════════════════════════════════════════════════════════════\n');

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  const browser = await puppeteer.launch({
    executablePath: BROWSER_PATH,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--window-size=1440,900',
    ],
    defaultViewport: { width: 1440, height: 900 },
  });

  const page = await browser.newPage();

  try {
    // 1. Initial City Extent
    console.log('[1/10] Loading /admin/mumbai/map for Initial City Extent...');
    await page.goto(`${BASE_URL}/admin/mumbai/map`, { waitUntil: 'networkidle0', timeout: 35000 });
    await page.waitForSelector('.leaflet-container', { timeout: 15000 });
    await sleep(2500); // Allow OpenStreetMap tiles to load completely

    await page.screenshot({
      path: path.join(OUT_DIR, '01_initial_city_extent.png'),
      fullPage: false,
    });
    console.log('  ✓ Captured 01_initial_city_extent.png');

    // 2. City extent with no optional overlays
    console.log('[2/10] Toggling off optional overlays for pure basemap & boundary extent...');
    // Click Reports and Facilities toggles in the GIS toolbar
    const toolbarButtons = await page.$$('.bg-surface-0\\/95 button');
    for (const btn of toolbarButtons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('Reports') || text.includes('Facilities') || text.includes('Wards')) {
        await btn.click();
        await sleep(200);
      }
    }
    await sleep(1000);
    await page.screenshot({
      path: path.join(OUT_DIR, '02_city_extent_no_optional_overlays.png'),
      fullPage: false,
    });
    console.log('  ✓ Captured 02_city_extent_no_optional_overlays.png');

    // 3. Facilities enabled (Restore true individual facility markers, no clusters)
    console.log('[3/10] Enabling facilities (219 discrete points, zero artificial count clusters)...');
    for (const btn of toolbarButtons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('Facilities')) {
        await btn.click();
        await sleep(300);
      }
    }
    await sleep(1500);
    await page.screenshot({
      path: path.join(OUT_DIR, '03_facilities_enabled.png'),
      fullPage: false,
    });
    console.log('  ✓ Captured 03_facilities_enabled.png');

    // 4. Incidents enabled
    console.log('[4/10] Enabling incident reports...');
    for (const btn of toolbarButtons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('Reports')) {
        await btn.click();
        await sleep(300);
      }
    }
    await sleep(1200);
    await page.screenshot({
      path: path.join(OUT_DIR, '04_incidents_enabled.png'),
      fullPage: false,
    });
    console.log('  ✓ Captured 04_incidents_enabled.png');

    // 5. Hazard layers enabled
    console.log('[5/10] Enabling verified hazard layers (hotspots, depression sinks, 88km drainage)...');
    for (const btn of toolbarButtons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('Hazards')) {
        await btn.click();
        await sleep(500);
        break;
      }
    }
    // Click "Enable All" inside hazard popover
    const enableAllBtn = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(b => b.textContent && b.textContent.includes('Enable All'));
    });
    if (enableAllBtn && enableAllBtn.asElement()) {
      await enableAllBtn.asElement().click();
      await sleep(1200);
    }
    await page.screenshot({
      path: path.join(OUT_DIR, '05_hazard_layers_enabled.png'),
      fullPage: false,
    });
    console.log('  ✓ Captured 05_hazard_layers_enabled.png');

    // Close hazard popover so subsequent zoom & overview screens have clean map visibility
    const closeHazardPopover = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(b => b.textContent && b.textContent.trim() === '✕');
    });
    if (closeHazardPopover && closeHazardPopover.asElement()) {
      await closeHazardPopover.asElement().click();
      await sleep(300);
    }

    // 6. Neighbourhood zoom (Dadar / Matunga)
    console.log('[6/10] Zooming to neighborhood (Dadar)...');
    const localitySelectHandle = await page.evaluateHandle(() => {
      const selects = Array.from(document.querySelectorAll('select'));
      return selects.find(s => s.querySelector('option[disabled]')?.textContent?.includes('Jump to'));
    });
    if (localitySelectHandle && localitySelectHandle.asElement()) {
      await localitySelectHandle.asElement().select('3'); // Dadar
      await sleep(2200);
    }
    await page.screenshot({
      path: path.join(OUT_DIR, '06_neighbourhood_zoom.png'),
      fullPage: false,
    });
    console.log('  ✓ Captured 06_neighbourhood_zoom.png');

    // 7. Dense central area (CST / Fort / South Mumbai)
    console.log('[7/10] Navigating to dense South Mumbai / Fort / CST administrative core...');
    if (localitySelectHandle && localitySelectHandle.asElement()) {
      await localitySelectHandle.asElement().select('0'); // CST / Fort
      await sleep(2200);
    }
    await page.screenshot({
      path: path.join(OUT_DIR, '07_dense_central_area.png'),
      fullPage: false,
    });
    console.log('  ✓ Captured 07_dense_central_area.png');

    // 8. Selected facility popup
    console.log('[8/10] Selecting facility marker to inspect rich detail popup...');
    const facilityMarker = await page.$('.custom-facility-marker, .custom-hub-marker');
    if (facilityMarker) {
      await facilityMarker.click();
      await sleep(1200);
    }
    await page.screenshot({
      path: path.join(OUT_DIR, '08_selected_facility_popup.png'),
      fullPage: false,
    });
    console.log('  ✓ Captured 08_selected_facility_popup.png');

    // 9. Reset-to-city action (Fit City)
    console.log('[9/10] Triggering Fit City action to return from deep zoom to full city extent...');
    const fitCityBtn = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(b => b.getAttribute('title') && b.getAttribute('title').includes('Fit'));
    });
    if (fitCityBtn && fitCityBtn.asElement()) {
      await fitCityBtn.asElement().click();
      await sleep(2000);
    }
    await page.screenshot({
      path: path.join(OUT_DIR, '09_reset_to_city_action.png'),
      fullPage: false,
    });
    console.log('  ✓ Captured 09_reset_to_city_action.png');

    // 10. Mobile / Narrow map layout (390x844)
    console.log('[10/10] Testing mobile / narrow viewport (390x844)...');
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await sleep(1500);
    await page.screenshot({
      path: path.join(OUT_DIR, '10_mobile_narrow_layout.png'),
      fullPage: false,
    });
    console.log('  ✓ Captured 10_mobile_narrow_layout.png');

    console.log('\n✅ All 10 Phase 2 verification screenshots captured successfully!');
  } catch (err) {
    console.error('❌ Error during capture:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run();
