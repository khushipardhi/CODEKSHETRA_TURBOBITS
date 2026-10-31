/**
 * scripts/capture-phase2-simulation-screenshots.mjs
 * Captures the 10 mandatory Phase 2 visual verification screenshots of /admin/mumbai/simulation.
 */

import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

const EDGE_PATH_X86 = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const EDGE_PATH_64 = 'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

let BROWSER_PATH = null;
if (fs.existsSync(EDGE_PATH_X86)) BROWSER_PATH = EDGE_PATH_X86;
else if (fs.existsSync(EDGE_PATH_64)) BROWSER_PATH = EDGE_PATH_64;
else if (fs.existsSync(CHROME_PATH)) BROWSER_PATH = CHROME_PATH;

if (!BROWSER_PATH) {
  console.error('No suitable browser found for screenshot capture');
  process.exit(1);
}

const OUT_DIR = path.resolve(process.cwd(), 'public', 'screenshots', 'phase2_sim');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const SCREENS = [
  {
    name: '01_full_mumbai_basemap_wards',
    url: 'http://localhost:3000/admin/mumbai/simulation?scenario=rainfall_waterlogging&t=0&ward=L&tab=ward_detail',
    width: 1440,
    height: 900,
    delay: 5000,
    desc: '1. Full Mumbai basemap and correctly aligned 24 BMC ward boundaries without rectangular artifacts'
  },
  {
    name: '02_rainfall_scenario_initial_t0',
    url: 'http://localhost:3000/admin/mumbai/simulation?scenario=rainfall_waterlogging&t=0&ward=L',
    width: 1440,
    height: 900,
    delay: 4500,
    desc: '2. Rainfall scenario at initial state (T=0.0h)'
  },
  {
    name: '03_rainfall_scenario_advanced_t3',
    url: 'http://localhost:3000/admin/mumbai/simulation?scenario=rainfall_waterlogging&t=3&ward=L',
    width: 1440,
    height: 900,
    delay: 4500,
    desc: '3. Same scenario after advancing time along timeline to peak (T=3.0h)'
  },
  {
    name: '04_rainfall_intensity_updated_90mm',
    url: 'http://localhost:3000/admin/mumbai/simulation?scenario=rainfall_waterlogging&rainfallRateMmH=90&t=3&ward=L',
    width: 1440,
    height: 900,
    delay: 4500,
    desc: '4. Different rainfall intensity (90 mm/h downpour) with dynamic map surface updated'
  },
  {
    name: '05_selected_ward_calculation_details',
    url: 'http://localhost:3000/admin/mumbai/simulation?scenario=rainfall_waterlogging&t=3&ward=L&tab=ward_detail',
    width: 1440,
    height: 900,
    delay: 4500,
    desc: '5. Selected ward (Ward L Kurla) and exact arithmetic calculation trace & census exposure'
  },
  {
    name: '06_baseline_historical_comparison',
    url: 'http://localhost:3000/admin/mumbai/simulation?scenario=rainfall_waterlogging&baseline=historical_july2005&t=3&ward=L',
    width: 1440,
    height: 900,
    delay: 4500,
    desc: '6. Baseline-versus-scenario comparison (26 July 2005 extreme cloudburst context)'
  },
  {
    name: '07_hazard_overlay_readable_legend',
    url: 'http://localhost:3000/admin/mumbai/simulation?scenario=coastal_monsoon_surge&highTideMeters=4.85&t=2&ward=A',
    width: 1440,
    height: 900,
    delay: 4500,
    desc: '7. Coastal monsoon surge hazard overlay with readable legend and sluice lockout'
  },
  {
    name: '08_scenario_missing_inputs_partial',
    url: 'http://localhost:3000/admin/mumbai/simulation?scenario=rainfall_waterlogging&missing=1&t=2&ward=L',
    width: 1440,
    height: 900,
    delay: 4500,
    desc: '8. Scenario with missing inputs and PARTIALLY_CALIBRATED quality tier disclosure'
  },
  {
    name: '09_generated_structured_report',
    url: 'http://localhost:3000/admin/mumbai/simulation?scenario=rainfall_waterlogging&t=3&tab=report',
    width: 1440,
    height: 900,
    delay: 4500,
    desc: '9. Generated Structured Scenario Report with executive KPIs, top 5 wards, and CSV export'
  },
  {
    name: '10_responsive_mobile_simulation',
    url: 'http://localhost:3000/admin/mumbai/simulation?scenario=rainfall_waterlogging&t=2&ward=L',
    width: 390,
    height: 844,
    delay: 4500,
    desc: '10. Responsive mobile interface (390x844) with timeline scrub and alert ribbon'
  }
];

async function prewarm(url) {
  try {
    const res = await fetch(url);
    await res.text();
  } catch (e) {}
}

async function capture() {
  console.log('=== SENTINEL PHASE 2 AUTOMATED SCREENSHOT CAPTURE ===\n');
  console.log(`Browser: ${BROWSER_PATH}`);
  console.log(`Target Directory: ${OUT_DIR}\n`);

  for (let i = 0; i < SCREENS.length; i++) {
    const s = SCREENS[i];
    const outImg = path.join(OUT_DIR, `${s.name}.png`);
    const tmpProfile = path.join(os.tmpdir(), `edge_sim_p2_${Date.now()}_${i}`);

    console.log(`[${i + 1}/${SCREENS.length}] Capturing: ${s.desc}`);
    console.log(`  URL: ${s.url}`);

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
      const res = spawnSync(BROWSER_PATH, args, { timeout: 35000 });
      if (fs.existsSync(outImg)) {
        const stats = fs.statSync(outImg);
        console.log(`  -> SUCCESS: ${s.name}.png (${(stats.size / 1024).toFixed(1)} KB)`);
      } else {
        console.warn(`  -> WARNING: File not generated: ${outImg}`);
      }
    } catch (err) {
      console.error(`  -> ERROR capturing ${s.name}:`, err.message);
    }

    try {
      fs.rmSync(tmpProfile, { recursive: true, force: true });
    } catch (e) {}
  }

  console.log('\n=== ALL PHASE 2 SCREENSHOTS CAPTURED ===\n');
}

capture().catch((err) => {
  console.error('Fatal capture error:', err);
  process.exit(1);
});
