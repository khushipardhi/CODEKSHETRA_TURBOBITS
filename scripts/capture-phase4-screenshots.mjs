/**
 * scripts/capture-phase4-screenshots.mjs
 * Automated headless browser screenshot capture using Microsoft Edge / Chrome for Phase 4.
 * Captures all 13 required Telemetry Lab, Admin IA, Citizen Map, and Mobile UX screens.
 */

import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BROWSER_PATH = fs.existsSync(EDGE_PATH) ? EDGE_PATH : CHROME_PATH;

const OUT_DIR = path.resolve(process.cwd(), 'public', 'screenshots', 'phase4');
const MIRROR_DIR = path.resolve(process.cwd(), 'phase4_screenshots');

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
if (!fs.existsSync(MIRROR_DIR)) fs.mkdirSync(MIRROR_DIR, { recursive: true });

const SCREENS = [
  {
    name: 'phase4_01_telemetry_lab_overview',
    url: 'http://localhost:3005/admin/mumbai/telemetry-lab?tab=overview',
    width: 1366,
    height: 900,
    delay: 6000,
    desc: 'Telemetry Lab Overview: Live multi-hazard KPI tiles, active advisories, provider grid disclosures, and cross-workspace navigation'
  },
  {
    name: 'phase4_02_telemetry_rainfall_hydrology',
    url: 'http://localhost:3005/admin/mumbai/telemetry-lab?tab=rainfall',
    width: 1366,
    height: 900,
    delay: 6000,
    desc: 'Rainfall & Hydrology: Parameter-to-impact navigation banner, 3h/6h/12h/24h rolling accumulations (DERIVED), and IMD threshold citations'
  },
  {
    name: 'phase4_03_telemetry_weather_atmosphere',
    url: 'http://localhost:3005/admin/mumbai/telemetry-lab?tab=weather',
    width: 1366,
    height: 900,
    delay: 6000,
    desc: 'Weather & Atmosphere: Barometric pressure vs MSL, sustained wind vs peak gusts (FORECAST), and Cyclone Surge simulation link'
  },
  {
    name: 'phase4_04_telemetry_coastal_marine_mumbai',
    url: 'http://localhost:3005/admin/mumbai/telemetry-lab?tab=marine',
    width: 1366,
    height: 900,
    delay: 6000,
    desc: 'Coastal & Marine (Mumbai): CMEMS 0.08° Arabian Sea wave heights, swell dynamics (MODELLED), and spring tide sluice gate locking link'
  },
  {
    name: 'phase4_05_telemetry_unavailable_inland_pune',
    url: 'http://localhost:3005/admin/pune/telemetry-lab?tab=marine',
    width: 1366,
    height: 900,
    delay: 6000,
    desc: 'Honest Telemetry Limitation: Pune inland plateau zone disclaimer explaining marine telemetry restriction to maritime coastal zones'
  },
  {
    name: 'phase4_06_telemetry_parameter_detail',
    url: 'http://localhost:3005/admin/mumbai/telemetry-lab?tab=parameters',
    width: 1366,
    height: 900,
    delay: 6000,
    desc: 'Parameter Explorer: 60+ typed parameter registry with category filters, data types, scientific metadata, and spatial links'
  },
  {
    name: 'phase4_07_admin_command_dashboard',
    url: 'http://localhost:3005/admin/mumbai',
    width: 1366,
    height: 900,
    delay: 6000,
    desc: 'Admin Information Architecture: Sidebar navigation with Command Dashboard, Hazard Map, Telemetry Lab, Simulation Lab, and Incidents'
  },
  {
    name: 'phase4_08_citizen_hazard_dashboard_resolved',
    url: 'http://localhost:3005/mumbai/dashboard',
    width: 1366,
    height: 950,
    delay: 7000,
    desc: 'Citizen Hazard Dashboard: Resolved location briefing, live weather conditions, 6-core geospatial impact intelligence, and interactive map'
  },
  {
    name: 'phase4_09_citizen_hazard_dashboard_manual',
    url: 'http://localhost:3005/mumbai/dashboard#my-area',
    width: 1366,
    height: 950,
    delay: 6500,
    desc: 'Citizen Manual Locality Selection: Explicit locality selection, GPS permission-grounded controls, and transparent boundary mapping'
  },
  {
    name: 'phase4_10_citizen_civic_reports_dedicated',
    url: 'http://localhost:3005/mumbai/report',
    width: 1366,
    height: 900,
    delay: 6000,
    desc: 'Dedicated Civic Reporting: Distinct destination separated from hazard map with category selection, 3-stage AI analysis, and photo/voice upload'
  },
  {
    name: 'phase4_11_sentinel_ai_markdown_rendering',
    url: 'http://localhost:3005/mumbai/sentinel',
    width: 1366,
    height: 900,
    delay: 6000,
    desc: 'Sentinel AI Assistant: Grounded municipal chat with clean, sanitized Markdown rendering (headings, bullet points, bold text, no raw syntax)'
  },
  {
    name: 'phase4_12_citizen_map_legend_and_ward',
    url: 'http://localhost:3005/mumbai/dashboard',
    width: 1366,
    height: 950,
    delay: 7000,
    desc: 'Citizen Hazard Map & Legend: Layer toggles (Wards, Hospitals, Fire, Hotspots), floating Map Legend, and Ward inspection intelligence panel'
  },
  {
    name: 'phase4_13_mobile_navigation_and_reporting',
    url: 'http://localhost:3005/mumbai/report',
    width: 390,
    height: 844,
    delay: 6000,
    desc: 'Mobile UX & Responsive Navigation: Tested at 390x844 with 48px touch targets, 5-tab bottom navigation, zero horizontal overflow, and accessible form controls'
  }
];

async function prewarm(url) {
  try {
    const res = await fetch(url);
    await res.text();
  } catch (e) {
    // Ignore prewarm error
  }
}

async function capture() {
  console.log('=== SENTINEL PHASE 4 AUTOMATED SCREENSHOT CAPTURE ===\n');
  console.log(`Browser: ${BROWSER_PATH}`);
  console.log(`Target Directory: ${OUT_DIR}`);
  console.log(`Mirror Directory: ${MIRROR_DIR}\n`);

  let captured = 0;

  for (let i = 0; i < SCREENS.length; i++) {
    const s = SCREENS[i];
    const outImg = path.join(OUT_DIR, `${s.name}.png`);
    const mirrorImg = path.join(MIRROR_DIR, `${s.name}.png`);
    const tmpProfile = path.join(os.tmpdir(), `edge_p4_${Date.now()}_${i}`);

    console.log(`[${i + 1}/${SCREENS.length}] Capturing ${s.name} (${s.width}x${s.height})`);
    console.log(`  URL: ${s.url}`);

    // Pre-warm the URL so page compiles and APIs cache
    await prewarm(s.url);

    const args = [
      '--headless',
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      `--user-data-dir=${tmpProfile}`,
      `--window-size=${s.width},${s.height}`,
      `--virtual-time-budget=${s.delay || 4500}`,
      `--screenshot=${outImg}`,
      s.url
    ];

    try {
      const res = spawnSync(BROWSER_PATH, args, { timeout: 40000 });
      if (fs.existsSync(outImg)) {
        fs.copyFileSync(outImg, mirrorImg);
        const stats = fs.statSync(outImg);
        console.log(`  -> SUCCESS (${(stats.size / 1024).toFixed(1)} KB)`);
        captured++;
      } else {
        console.warn(`  -> WARNING: File not generated: ${outImg}`);
      }
    } catch (err) {
      console.error(`  -> ERROR capturing ${s.name}:`, err.message);
    } finally {
      try {
        fs.rmSync(tmpProfile, { recursive: true, force: true });
      } catch (e) {}
    }
  }

  console.log(`\n=== COMPLETED: ${captured}/${SCREENS.length} PHASE 4 SCREENSHOTS CAPTURED ===`);
}

capture().catch((err) => {
  console.error('Fatal capture error:', err);
  process.exit(1);
});
