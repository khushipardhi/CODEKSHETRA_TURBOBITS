/**
 * scripts/capture-phase3-map-visualisation.mjs
 * Sentinel City Intelligence — Phase 3 Map Visualisation, Smooth Fills & Performance Verification
 * Captures all 11 required visual scenarios for Phase 3 Cartographic GIS audit.
 */

import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const BROWSER_PATH = fs.existsSync(CHROME_PATH) ? CHROME_PATH : EDGE_PATH;
const TARGET_URL = process.env.TEST_URL || 'http://localhost:3000';
const OUT_DIR = path.resolve(process.cwd(), 'public', 'screenshots', 'phase3_map_visualisation');
const ARTIFACT_DIR = path.resolve(process.cwd(), 'phase3_screenshots');

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
if (!fs.existsSync(ARTIFACT_DIR)) fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function saveScreen(page, filename, description) {
  const p1 = path.join(OUT_DIR, filename);
  const p2 = path.join(ARTIFACT_DIR, filename);
  await page.screenshot({ path: p1, fullPage: false });
  fs.copyFileSync(p1, p2);
  console.log(`  📸 [SAVED] ${filename} — ${description}`);
}

async function runVisualVerification() {
  console.log('════════════════════════════════════════════════════════════');
  console.log('  SENTINEL PHASE 3: GIS VISUALISATION & CARTOGRAPHY AUDIT   ');
  console.log(`  Browser: ${BROWSER_PATH}`);
  console.log(`  Target URL: ${TARGET_URL}`);
  console.log(`  Output Directory: ${OUT_DIR}`);
  console.log('════════════════════════════════════════════════════════════\n');

  const browser = await puppeteer.launch({
    executablePath: BROWSER_PATH,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      '--window-size=1440,900',
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  try {
    // 1. Mumbai with default basemap
    console.log('[SCENARIO 1] Mumbai with Default OpenStreetMap Basemap...');
    await page.goto(`${TARGET_URL}/admin/simulation?city=mumbai&time=2`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await sleep(3000);
    await saveScreen(page, '01_mumbai_default_basemap.png', 'Mumbai extent with OpenStreetMap standard basemap');

    // 2. Ward polygons filled according to actual values (Choropleth mode)
    console.log('[SCENARIO 2] Ward Polygons Filled According to Actual Values...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const choroplethBtn = btns.find((b) => b.textContent && b.textContent.includes('Choropleth'));
      if (choroplethBtn) choroplethBtn.click();
    });
    await sleep(2000);
    await saveScreen(page, '02_ward_polygons_filled_values.png', 'Ward polygons filled with graduated choropleth severity values');

    // 3. Low, moderate and high values
    console.log('[SCENARIO 3] Low, Moderate and High Values across Wards...');
    await page.goto(`${TARGET_URL}/admin/simulation?city=mumbai&time=3&scenario=rainfall_waterlogging`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await sleep(3000);
    await saveScreen(page, '03_low_moderate_high_values.png', 'Gradient distribution displaying low (green), moderate (amber), and high (red) risk');

    // 4. No-data wards (Simulate missing sensor feed)
    console.log('[SCENARIO 4] Distinct No-Data / Sensor Offline Wards...');
    await page.goto(`${TARGET_URL}/admin/simulation?city=mumbai&time=2&missing=1`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await sleep(3000);
    await saveScreen(page, '04_no_data_wards.png', 'Neutral slate dashed styling for offline sensor feeds in wards M/East and T');

    // 5. Selected ward and boundary
    console.log('[SCENARIO 5] Selected Ward with High-Contrast Boundary...');
    await page.goto(`${TARGET_URL}/admin/simulation?city=mumbai&ward=F/South&time=2`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await sleep(3000);
    await saveScreen(page, '05_selected_ward_boundary.png', 'Ward F/South highlighted with high-contrast blue boundary and elevated fill');

    // 6. Facilities and incident markers above fill
    console.log('[SCENARIO 6] Facilities and Incident Markers Layered Above Fill...');
    await page.evaluate(() => {
      const circleMarkers = document.querySelectorAll('.leaflet-overlay-pane circle, .leaflet-marker-pane .leaflet-marker-icon, svg path');
      if (circleMarkers.length > 0) {
        (circleMarkers[0]).dispatchEvent(new MouseEvent('click', { bubbles: true }));
      }
    });
    await sleep(2000);
    await saveScreen(page, '06_facilities_incident_markers_above_fill.png', 'Stormwater pumps, hospitals, and flood hotspots layered above hazard fills');

    // 7. Legend and layer controls
    console.log('[SCENARIO 7] Legend and GIS Layer Controls...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const layerBtn = btns.find((b) => b.getAttribute('title')?.includes('Layer') || b.textContent?.includes('Layers') || b.textContent?.includes('Layer Manager'));
      if (layerBtn) layerBtn.click();
    });
    await sleep(2000);
    await saveScreen(page, '07_legend_layer_controls.png', 'Multi-tier cartographic legend with unit, tiers, No-Data swatch and layer manager');

    // 8. Map during simulation playback
    console.log('[SCENARIO 8] Map During Simulation Playback...');
    await page.goto(`${TARGET_URL}/admin/simulation?city=mumbai&time=1`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await sleep(2000);
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const playBtn = btns.find((b) => b.getAttribute('title')?.includes('Play') || b.textContent?.includes('Play'));
      if (playBtn) playBtn.click();
    });
    await sleep(3000);
    await saveScreen(page, '08_map_simulation_playback.png', 'Real-time timeline playback advancing with live Leaflet setStyle updates');

    // 9. Map after selecting different scenario (Extreme Heat Stress)
    console.log('[SCENARIO 9] Map with Different Hazard Scenario (Heat Stress)...');
    await page.goto(`${TARGET_URL}/admin/simulation?city=mumbai&scenario=extreme_heat_stress&time=2`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await sleep(3000);
    await saveScreen(page, '09_map_different_scenario.png', 'Extreme Heat Stress scenario with dedicated temperature/heat index color ramp');

    // 10. Light and dark themes (CartoDB Dark Matter)
    console.log('[SCENARIO 10] Dark GIS Cartography Theme...');
    await page.goto(`${TARGET_URL}/admin/simulation?city=mumbai&time=2`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await sleep(2000);
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
      const btns = Array.from(document.querySelectorAll('button'));
      const darkBtn = btns.find((b) => b.textContent && b.textContent.includes('Dark Matter'));
      if (darkBtn) darkBtn.click();
    });
    await sleep(2500);
    await saveScreen(page, '10_light_and_dark_themes.png', 'CartoDB Dark Matter basemap with high-contrast glowing neon hazard fills');

    // 11. Desktop and mobile layouts
    console.log('[SCENARIO 11] Mobile Viewport Layout...');
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await page.goto(`${TARGET_URL}/admin/simulation?city=mumbai&time=2`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await sleep(3000);
    await saveScreen(page, '11_desktop_and_mobile_layouts.png', 'Responsive mobile layout with collapsible drawer and compact legend pill');

    console.log('\n════════════════════════════════════════════════════════════');
    console.log('  ALL 11 VISUAL VERIFICATION SCREENSHOTS CAPTURED!          ');
    console.log('════════════════════════════════════════════════════════════\n');
  } catch (err) {
    console.error('Error during visual capture:', err);
  } finally {
    await browser.close();
  }
}

runVisualVerification();
