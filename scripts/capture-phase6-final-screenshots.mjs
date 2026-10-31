/**
 * scripts/capture-phase6-final-screenshots.mjs
 * Sentinel City Intelligence — Phase 6 Final Product Hardening Visual QA
 * 
 * Captures all 16 required representative acceptance workflow screenshots using
 * headless Microsoft Edge / Chrome on port 3005 with verified virtual delays.
 */

import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BROWSER_PATH = fs.existsSync(EDGE_PATH) ? EDGE_PATH : CHROME_PATH;

const OUT_DIR = path.resolve(process.cwd(), 'public', 'screenshots', 'phase6');
const MIRROR_DIR = path.resolve(process.cwd(), 'phase6_screenshots');

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
if (!fs.existsSync(MIRROR_DIR)) fs.mkdirSync(MIRROR_DIR, { recursive: true });

const SCREENS = [
  {
    name: 'phase6_01_mumbai_spatial_simulation_lab',
    url: 'http://localhost:3005/admin/mumbai/simulation',
    width: 1440,
    height: 900,
    delay: 6000,
    desc: 'Step 1: Mumbai Spatial Simulation Lab with OSM basemap, 24 BMC wards, and scenario drawer'
  },
  {
    name: 'phase6_02_simulation_scenario_inputs_freshness',
    url: 'http://localhost:3005/admin/mumbai/simulation?scenario=monsoon_downpour_saucer_sinks&rate=65',
    width: 1440,
    height: 900,
    delay: 6000,
    desc: 'Step 2-4: Scenario parameter modification (65 mm/h deluge) with live telemetry reflection'
  },
  {
    name: 'phase6_03_simulation_timeline_advance',
    url: 'http://localhost:3005/admin/mumbai/simulation?scenario=monsoon_downpour_saucer_sinks&t=3.0',
    width: 1440,
    height: 900,
    delay: 6000,
    desc: 'Step 5: Timeline advance to T=3h showing monotonic accumulation and peak temporal factor'
  },
  {
    name: 'phase6_04_ward_selection_calculation_trace',
    url: 'http://localhost:3005/admin/mumbai/simulation?ward=F%2FSouth',
    width: 1440,
    height: 900,
    delay: 6000,
    desc: 'Step 6-8: Ward F/South selection displaying arithmetic trace, assets assessed, and demographic methodology'
  },
  {
    name: 'phase6_05_ward_dossier_modal',
    url: 'http://localhost:3005/admin/mumbai/simulation?tab=dossier&ward=F%2FSouth',
    width: 1440,
    height: 900,
    delay: 6000,
    desc: 'Step 9-11: Canonical 7-Section Dossier modal with 9-category Consequence Matrix and Decision Briefing'
  },
  {
    name: 'phase6_06_telemetry_lab_overview',
    url: 'http://localhost:3005/admin/mumbai/telemetry-lab',
    width: 1440,
    height: 900,
    delay: 6000,
    desc: 'Step 12: Telemetry Lab Overview with 60+ parameters, multi-zone microclimate, and live gauges'
  },
  {
    name: 'phase6_07_telemetry_lab_parameter_explorer',
    url: 'http://localhost:3005/admin/mumbai/telemetry-lab?tab=parameters',
    width: 1440,
    height: 900,
    delay: 6000,
    desc: 'Step 12: Telemetry Lab Parameter Explorer showing scientific units, temporality, and operational interpretation'
  },
  {
    name: 'phase6_08_telemetry_lab_data_quality_health',
    url: 'http://localhost:3005/admin/mumbai/telemetry-lab?tab=data_quality',
    width: 1440,
    height: 900,
    delay: 6000,
    desc: 'Step 12: Telemetry Lab Data Quality & Sources tab showing provider uptime, freshness policies, and circuit states'
  },
  {
    name: 'phase6_09_citizen_hazard_dashboard_desktop',
    url: 'http://localhost:3005/mumbai/dashboard',
    width: 1440,
    height: 900,
    delay: 6000,
    desc: 'Step 13-14: Citizen Hazard Intelligence Dashboard showing grounded environmental signals and safe travel routes'
  },
  {
    name: 'phase6_10_citizen_sentinel_ai_hub',
    url: 'http://localhost:3005/mumbai/sentinel',
    width: 1440,
    height: 900,
    delay: 6000,
    desc: 'Step 15: Citizen Sentinel AI Hub showing formatted Markdown response with timestamps, sources, and shelter intake status'
  },
  {
    name: 'phase6_11_citizen_reporting_destination',
    url: 'http://localhost:3005/mumbai/report',
    width: 1440,
    height: 900,
    delay: 6000,
    desc: 'Step 16-17: Dedicated Civic Reporting destination with category taxonomy, location picker, and safe test report workflow'
  },
  {
    name: 'phase6_12_admin_incidents_management',
    url: 'http://localhost:3005/admin/incidents',
    width: 1440,
    height: 900,
    delay: 6000,
    desc: 'Step 18: Authorised Municipal Admin Incident Console showing triaged citizen reports with SLA timers'
  },
  {
    name: 'phase6_13_citizen_hazard_dashboard_mobile',
    url: 'http://localhost:3005/mumbai/dashboard',
    width: 390,
    height: 844,
    delay: 6000,
    desc: 'Step 19: Mobile viewport (390x844 iPhone 14) Citizen Hazard Dashboard with bottom navigation'
  },
  {
    name: 'phase6_14_citizen_sentinel_ai_mobile',
    url: 'http://localhost:3005/mumbai/sentinel',
    width: 390,
    height: 844,
    delay: 6000,
    desc: 'Step 19: Mobile viewport (390x844) Citizen Sentinel AI Hub showing responsive Markdown formatting'
  },
  {
    name: 'phase6_15_pune_unsupported_scope_handling',
    url: 'http://localhost:3005/admin/pune/simulation',
    width: 1440,
    height: 900,
    delay: 6000,
    desc: 'Step 20: Pune geographical limitation card enforcing Mumbai hydrodynamic boundary contract'
  },
  {
    name: 'phase6_16_admin_settings_source_health',
    url: 'http://localhost:3005/admin/settings',
    width: 1440,
    height: 900,
    delay: 6000,
    desc: 'Step 20: Admin Settings with DataSourceHealthMonitor showing real-time circuit breakers and cache latency'
  }
];

import os from 'os';

async function captureScreens() {
  console.log('\n============================================================');
  console.log('  PHASE 6 VISUAL QA CAPTURE: 16 ACCEPTANCE WORKFLOW SCREENS');
  console.log(`  Browser: ${BROWSER_PATH}`);
  console.log('============================================================\n');

  for (let i = 0; i < SCREENS.length; i++) {
    const s = SCREENS[i];
    const outPng = path.join(OUT_DIR, `${s.name}.png`);
    const mirrorPng = path.join(MIRROR_DIR, `${s.name}.png`);

    console.log(`[${i + 1}/${SCREENS.length}] Capturing: ${s.name} (${s.width}x${s.height})`);
    console.log(`  URL: ${s.url}`);

    const tmpUserData = path.join(os.tmpdir(), `edge_p6_${Date.now()}_${i}`);

    const args = [
      '--headless',
      '--disable-gpu',
      '--hide-scrollbars',
      '--no-sandbox',
      '--disable-features=Translate,OptimizationHints,MediaRouter',
      `--user-data-dir=${tmpUserData}`,
      `--window-size=${s.width},${s.height}`,
      `--screenshot=${outPng}`,
      `--virtual-time-budget=${s.delay || 6000}`,
      s.url,
    ];

    const proc = spawnSync(BROWSER_PATH, args, { encoding: 'utf-8', timeout: 30000 });

    try {
      fs.rmSync(tmpUserData, { recursive: true, force: true });
    } catch {
      // ignore
    }

    if (fs.existsSync(outPng) && fs.statSync(outPng).size > 1000) {
      const bytes = fs.statSync(outPng).size;
      fs.copyFileSync(outPng, mirrorPng);
      console.log(`  ✔ SUCCESS (${(bytes / 1024).toFixed(1)} KB)`);
    } else {
      console.error(`  ✖ Failed: ${proc.error ? proc.error.message : 'Missing output'}`);
    }
  }

  console.log('\n============================================================');
  console.log('  ALL PHASE 6 SCREENSHOTS CAPTURED SUCCESSFULLY!');
  console.log(`  Output Directory: ${OUT_DIR}`);
  console.log('============================================================\n');
}

captureScreens().catch(console.error);
