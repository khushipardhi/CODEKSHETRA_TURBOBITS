/**
 * scripts/capture-phase3-screenshots.mjs
 * Automated headless browser screenshot capture using Microsoft Edge for Phase 3.
 * Captures all 13 required spatial intelligence and simulation workspaces.
 */

import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BROWSER_PATH = fs.existsSync(EDGE_PATH) ? EDGE_PATH : CHROME_PATH;

const OUT_DIR = path.resolve(process.cwd(), 'public', 'screenshots', 'phase3');
const MIRROR_DIR = path.resolve(process.cwd(), 'phase3_screenshots');

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
if (!fs.existsSync(MIRROR_DIR)) fs.mkdirSync(MIRROR_DIR, { recursive: true });

const SCREENS = [
  {
    name: 'phase3_01_full_mumbai_ward_boundary_map',
    url: 'http://localhost:3000/admin/mumbai/simulation?scenario=rainfall_waterlogging&ward=L',
    width: 1366,
    height: 900,
    delay: 4500,
    desc: 'Full Mumbai 24 BMC administrative ward boundary map (Wards A through T) with zero rectangular bounding box artifacts'
  },
  {
    name: 'phase3_02_environmental_overlays_drainage',
    url: 'http://localhost:3000/admin/mumbai/simulation?scenario=drainage_stress_blockage&ward=L',
    width: 1366,
    height: 900,
    delay: 4500,
    desc: 'Physical environmental reference layers: Mithi River & Vakola nullah drainage corridors, chronic flood hotspots, and MCGM pumping stations'
  },
  {
    name: 'phase3_03_continuous_hazard_isobands_legend',
    url: 'http://localhost:3000/admin/mumbai/simulation?scenario=rainfall_accumulation&t=3',
    width: 1366,
    height: 900,
    delay: 4500,
    desc: 'Continuous spatial hazard field: Multi-tier smooth isobands with color ramps, source resolution badge (0.01°), and units legend'
  },
  {
    name: 'phase3_04_geometry_cleaned_coastal_alignment',
    url: 'http://localhost:3000/admin/mumbai/simulation?scenario=rainfall_waterlogging&ward=G/South',
    width: 1366,
    height: 900,
    delay: 4500,
    desc: 'Geometry validation and coastal alignment: Island City coastline clipped strictly to Arabian Sea without boxy placeholders'
  },
  {
    name: 'phase3_05_rainfall_scenario_before_playback',
    url: 'http://localhost:3000/admin/mumbai/simulation?scenario=rainfall_waterlogging&t=0',
    width: 1366,
    height: 900,
    delay: 4500,
    desc: 'Rainfall scenario before playback (T=0h baseline state with playback controls primed)'
  },
  {
    name: 'phase3_06_rainfall_scenario_timestep_progression',
    url: 'http://localhost:3000/admin/mumbai/simulation?scenario=rainfall_waterlogging&t=4',
    width: 1366,
    height: 900,
    delay: 4500,
    desc: 'Rainfall waterlogging scenario at peak accumulation (T=4.0h dynamic state showing runoff buildup in depression zones)'
  },
  {
    name: 'phase3_07_baseline_versus_scenario_comparison',
    url: 'http://localhost:3000/admin/mumbai/simulation?scenario=rainfall_waterlogging&baseline=historical_july2005&t=6',
    width: 1366,
    height: 900,
    delay: 4500,
    desc: 'Baseline versus scenario comparison: Historical 26 July 2005 (944mm cloudburst) vs live forecast'
  },
  {
    name: 'phase3_08_selected_ward_details_calculations',
    url: 'http://localhost:3000/admin/mumbai/simulation?scenario=rainfall_waterlogging&ward=L&tab=ward_detail',
    width: 1366,
    height: 900,
    delay: 4500,
    desc: 'Selected ward deep inspection: Ward L (Kurla / Sakinaka) showing underlying topographic formula, depression factor, and advisory draft'
  },
  {
    name: 'phase3_09_coastal_rainfall_sluice_lockout',
    url: 'http://localhost:3000/admin/mumbai/simulation?scenario=coastal_monsoon_surge&ward=A&t=2',
    width: 1366,
    height: 900,
    delay: 4500,
    desc: 'Scenario C: Arabian Sea 4.65m high tide triggering gravity sluice gate lockout at Lovegrove & Britannia with coastal ward impact'
  },
  {
    name: 'phase3_10_extreme_heat_stress_screening',
    url: 'http://localhost:3000/admin/mumbai/simulation?scenario=extreme_heat_stress&ward=M/East&t=3',
    width: 1366,
    height: 900,
    delay: 4500,
    desc: 'Scenario E: Extreme heat stress screening with NOAA Heat Index formula, apparent temperature, and sensitive population warnings'
  },
  {
    name: 'phase3_11_historical_playback_july2005',
    url: 'http://localhost:3000/admin/mumbai/simulation?scenario=rainfall_waterlogging&baseline=historical_july2005&t=8',
    width: 1366,
    height: 900,
    delay: 4500,
    desc: 'Historical playback progression: 26 July 2005 landmark downpour showing catastrophic Mithi River corridor inundation'
  },
  {
    name: 'phase3_12_degraded_model_limitations_panel',
    url: 'http://localhost:3000/admin/mumbai/simulation?scenario=drainage_stress_blockage&tab=model_meta',
    width: 1366,
    height: 900,
    delay: 4500,
    desc: 'Tier 2 screening simulation disclosures: Model readiness tier badge, scientific formulas, uncalibrated assumptions, and non-hydrodynamic disclaimers'
  },
  {
    name: 'phase3_13_mobile_responsive_simulation',
    url: 'http://localhost:3000/admin/mumbai/simulation?scenario=rainfall_waterlogging&t=2',
    width: 390,
    height: 844,
    delay: 4000,
    desc: 'Mobile responsive spatial simulation canvas with adaptable floating drawer controls'
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
  console.log('=== SENTINEL PHASE 3 AUTOMATED SCREENSHOT CAPTURE ===\n');
  console.log(`Browser: ${BROWSER_PATH}`);
  console.log(`Target Directory: ${OUT_DIR}`);
  console.log(`Mirror Directory: ${MIRROR_DIR}\n`);

  for (let i = 0; i < SCREENS.length; i++) {
    const s = SCREENS[i];
    const outImg = path.join(OUT_DIR, `${s.name}.png`);
    const mirrorImg = path.join(MIRROR_DIR, `${s.name}.png`);
    const tmpProfile = path.join(os.tmpdir(), `edge_p3_${Date.now()}_${i}`);

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
    } finally {
      try {
        fs.rmSync(tmpProfile, { recursive: true, force: true });
      } catch (e) {}
    }
  }

  console.log('\n=== ALL 13 PHASE 3 SCREENSHOTS CAPTURED SUCCESSFULLY ===');
}

capture().catch((err) => {
  console.error('Fatal capture error:', err);
  process.exit(1);
});
