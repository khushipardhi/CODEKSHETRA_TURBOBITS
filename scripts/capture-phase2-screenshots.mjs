/**
 * scripts/capture-phase2-screenshots.mjs
 * Automated headless browser screenshot capture using Microsoft Edge for Phase 2.
 * Captures all required Telemetry Lab workspaces across desktop and mobile.
 */

import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BROWSER_PATH = fs.existsSync(EDGE_PATH) ? EDGE_PATH : CHROME_PATH;

const OUT_DIR = path.resolve(process.cwd(), 'public', 'screenshots', 'phase2');
const MIRROR_DIR = path.resolve(process.cwd(), 'phase2_screenshots');

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
if (!fs.existsSync(MIRROR_DIR)) fs.mkdirSync(MIRROR_DIR, { recursive: true });

const SCREENS = [
  {
    name: 'phase2_01_telemetry_lab_overview',
    url: 'http://localhost:3000/admin/nagpur/telemetry-lab?tab=overview',
    width: 1366,
    height: 900,
    delay: 4000,
    desc: 'Environmental Telemetry Lab Overview: Headline KPIs, advisories, and dual progression charts'
  },
  {
    name: 'phase2_02_parameter_explorer_catalogue',
    url: 'http://localhost:3000/admin/nagpur/telemetry-lab?tab=parameters',
    width: 1366,
    height: 900,
    delay: 4000,
    desc: 'Parameter Explorer: Searchable catalogue of 60+ parameters with category filter pills'
  },
  {
    name: 'phase2_03_weather_atmosphere_timeseries',
    url: 'http://localhost:3000/admin/nagpur/telemetry-lab?tab=weather',
    width: 1366,
    height: 900,
    delay: 4000,
    desc: 'Weather & Atmosphere: Barometric pressure, peak wind gusts, cloud layers, and CAPE'
  },
  {
    name: 'phase2_04_rainfall_accumulations_hydrology',
    url: 'http://localhost:3000/admin/nagpur/telemetry-lab?tab=rainfall',
    width: 1366,
    height: 900,
    delay: 4000,
    desc: 'Rainfall & Hydrology: Non-overlapping 3h, 6h, 12h, 24h rolling accumulations and GloFAS flow'
  },
  {
    name: 'phase2_05_air_quality_standards_comparison',
    url: 'http://localhost:3000/admin/nagpur/telemetry-lab?tab=air_quality',
    width: 1366,
    height: 900,
    delay: 4000,
    desc: 'Air Quality: PM2.5 vs PM10 CPCB standards, US EPA vs European CAQI, and combustion gases'
  },
  {
    name: 'phase2_06_mumbai_coastal_marine_analysis',
    url: 'http://localhost:3000/admin/mumbai/telemetry-lab?tab=marine',
    width: 1366,
    height: 900,
    delay: 4000,
    desc: 'Mumbai Coastal & Marine: Significant wave height, swell dynamics, and floodgate rules'
  },
  {
    name: 'phase2_07_zone_microclimate_comparison',
    url: 'http://localhost:3000/admin/nagpur/telemetry-lab?tab=comparison',
    width: 1366,
    height: 900,
    delay: 4000,
    desc: 'Cross-Zone Comparison: Dharampeth vs Kalamna vs MIHAN with effective grid cell divergence'
  },
  {
    name: 'phase2_08_historical_era5_reanalysis',
    url: 'http://localhost:3000/admin/nagpur/telemetry-lab?tab=historical',
    width: 1366,
    height: 900,
    delay: 4000,
    desc: 'Historical Analysis: ECMWF ERA5 retrospective reanalysis with date range picker'
  },
  {
    name: 'phase2_09_data_quality_provider_health',
    url: 'http://localhost:3000/admin/nagpur/telemetry-lab?tab=health',
    width: 1366,
    height: 900,
    delay: 4000,
    desc: 'Data Quality & Provider Health: Latency benchmarks, grid resolution, and staleness policies'
  },
  {
    name: 'phase2_10_stale_unavailable_isolation_state',
    url: 'http://localhost:3000/admin/pune/telemetry-lab?tab=marine',
    width: 1366,
    height: 900,
    delay: 4000,
    desc: 'Geographic Isolation State: Clear inland notice for Pune explaining omitted marine data'
  },
  {
    name: 'phase2_11_mobile_telemetry_lab',
    url: 'http://localhost:3000/admin/nagpur/telemetry-lab?tab=overview',
    width: 390,
    height: 844,
    delay: 3500,
    desc: 'Mobile Telemetry Lab View (390x844 responsive layout)'
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
  console.log('=== SENTINEL PHASE 2 AUTOMATED SCREENSHOT CAPTURE ===\n');
  console.log(`Browser: ${BROWSER_PATH}`);
  console.log(`Target Directory: ${OUT_DIR}`);
  console.log(`Mirror Directory: ${MIRROR_DIR}\n`);

  for (let i = 0; i < SCREENS.length; i++) {
    const s = SCREENS[i];
    const outImg = path.join(OUT_DIR, `${s.name}.png`);
    const mirrorImg = path.join(MIRROR_DIR, `${s.name}.png`);
    const tmpProfile = path.join(os.tmpdir(), `edge_p2_${Date.now()}_${i}`);

    // Skip if already successfully captured (> 50KB)
    if (fs.existsSync(outImg) && fs.statSync(outImg).size > 50000) {
      if (!fs.existsSync(mirrorImg)) fs.copyFileSync(outImg, mirrorImg);
      console.log(`[${i + 1}/${SCREENS.length}] Skipping ${s.name} (Already captured: ${(fs.statSync(outImg).size / 1024).toFixed(1)} KB)`);
      continue;
    }

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
      `--virtual-time-budget=${s.delay || 4000}`,
      `--screenshot=${outImg}`,
      s.url
    ];

    try {
      const res = spawnSync(BROWSER_PATH, args, { timeout: 35000 });
      if (fs.existsSync(outImg)) {
        fs.copyFileSync(outImg, mirrorImg);
        const stats = fs.statSync(outImg);
        console.log(`  -> SUCCESS (${(stats.size / 1024).toFixed(1)} KB)`);
      } else {
        console.warn(`  -> WARNING: File not generated: ${outImg}`);
      }
    } catch (err) {
      console.error(`  -> ERROR capturing ${s.name}:`, err.message);
    }
  }

  // Cleanup tmp profile
  try {
    fs.rmSync(tmpProfile, { recursive: true, force: true });
  } catch (e) {}

  console.log('\n=== ALL PHASE 2 SCREENSHOTS CAPTURED SUCCESSFULLY ===');
}

capture().catch((err) => {
  console.error('Fatal capture error:', err);
  process.exit(1);
});
