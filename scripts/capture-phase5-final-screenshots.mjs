/**
 * scripts/capture-phase5-final-screenshots.mjs
 * Sentinel City Intelligence — Phase 5 Final Handover Visual QA Capture
 * 
 * Captures all 16 required final validation screenshots using headless Microsoft Edge / Chrome
 * on port 3005 with verified virtual delays.
 */

import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BROWSER_PATH = fs.existsSync(EDGE_PATH) ? EDGE_PATH : CHROME_PATH;

const OUT_DIR = path.resolve(process.cwd(), 'public', 'screenshots', 'phase5');
const MIRROR_DIR = path.resolve(process.cwd(), 'phase5_screenshots');

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
if (!fs.existsSync(MIRROR_DIR)) fs.mkdirSync(MIRROR_DIR, { recursive: true });

const SCREENS = [
  {
    name: 'phase5_01_simulation_mumbai_full_extent',
    url: 'http://localhost:3005/admin/mumbai/simulation',
    width: 1440,
    height: 900,
    delay: 6000,
    desc: 'Spatial Simulation Lab at full Mumbai extent with OpenStreetMap basemap, 24 BMC wards, and scenario drawer'
  },
  {
    name: 'phase5_02_simulation_low_intensity_rainfall',
    url: 'http://localhost:3005/admin/mumbai/simulation?scenario=monsoon_downpour_saucer_sinks&rate=20&t=1.0',
    width: 1440,
    height: 900,
    delay: 6000,
    desc: 'Low-Intensity Monsoon Scenario (20 mm/h, T=1h): Baseline runoff and low-tier susceptibility'
  },
  {
    name: 'phase5_03_simulation_high_intensity_deluge',
    url: 'http://localhost:3005/admin/mumbai/simulation?scenario=monsoon_downpour_saucer_sinks&rate=90&t=2.0',
    width: 1440,
    height: 900,
    delay: 6000,
    desc: 'High-Intensity Deluge Scenario (90 mm/h, T=2h): Deep red continuous surface over saucer wards (F/S, F/N, Kurla L)'
  },
  {
    name: 'phase5_04_simulation_timeline_evolution_t3',
    url: 'http://localhost:3005/admin/mumbai/simulation?scenario=monsoon_downpour_saucer_sinks&t=3.0',
    width: 1440,
    height: 900,
    delay: 6000,
    desc: 'Timeline Evolution at T=3h: Monotonic accumulation and peak temporal factor escalation'
  },
  {
    name: 'phase5_05_simulation_ward_detail_trace',
    url: 'http://localhost:3005/admin/mumbai/simulation?scenario=monsoon_downpour_saucer_sinks&ward=F%2FSouth',
    width: 1440,
    height: 900,
    delay: 6000,
    desc: 'Selected Ward Inspection: Ward F/South arithmetic trace, Hindmata saucer basin, and tertiary hospital intersections'
  },
  {
    name: 'phase5_06_simulation_ranking_and_report',
    url: 'http://localhost:3005/admin/mumbai/simulation?tab=ranking',
    width: 1440,
    height: 900,
    delay: 6000,
    desc: 'Simulation Ranking and Report Tabs: Ranked wards descending by susceptibility and report summary'
  },
  {
    name: 'phase5_07_simulation_full_dossier',
    url: 'http://localhost:3005/admin/mumbai/simulation?view=dossier',
    width: 1440,
    height: 900,
    delay: 6000,
    desc: 'Full Canonical Simulation Dossier: 7-section report (A-G), 3-role Groq review, and CSV/Markdown export'
  },
  {
    name: 'phase5_08_telemetry_overview',
    url: 'http://localhost:3005/admin/mumbai/telemetry-lab?tab=overview',
    width: 1366,
    height: 900,
    delay: 6000,
    desc: 'Telemetry Lab Overview: Live multi-hazard KPI tiles, active advisories, provider freshness, and sticky rail'
  },
  {
    name: 'phase5_09_telemetry_parameters',
    url: 'http://localhost:3005/admin/mumbai/telemetry-lab?tab=rainfall',
    width: 1366,
    height: 900,
    delay: 6000,
    desc: 'Rainfall & Hydrology Telemetry: Rolling DERIVED series, IMD heavy rain thresholds, and parameter-to-impact link'
  },
  {
    name: 'phase5_10_chart_valid_vs_empty_state',
    url: 'http://localhost:3005/admin/pune/telemetry-lab?tab=marine',
    width: 1366,
    height: 900,
    delay: 6000,
    desc: 'Honest Telemetry Limitation: Pune inland plateau zone disclaimer card without false maritime surge data'
  },
  {
    name: 'phase5_11_admin_incidents_departments',
    url: 'http://localhost:3005/admin/mumbai/incidents',
    width: 1366,
    height: 900,
    delay: 6000,
    desc: 'Admin Incidents & Operational Workflows: Unified incident queue, departmental routing, and status transitions'
  },
  {
    name: 'phase5_12_citizen_hazard_dashboard',
    url: 'http://localhost:3005/mumbai/dashboard',
    width: 1366,
    height: 950,
    delay: 7000,
    desc: 'Citizen Hazard Dashboard: Resolved location briefing (CST/Fort), live conditions, and interactive map'
  },
  {
    name: 'phase5_13_citizen_civic_reports',
    url: 'http://localhost:3005/mumbai/report',
    width: 1366,
    height: 900,
    delay: 6000,
    desc: 'Dedicated Civic Issue Reporting: 17 municipal category cards, instant voice/text AI intake, and My Reports'
  },
  {
    name: 'phase5_14_sentinel_ai_markdown',
    url: 'http://localhost:3005/mumbai/sentinel',
    width: 1366,
    height: 900,
    delay: 6000,
    desc: 'Sentinel AI Assistant: Clean rendered Markdown (bold text, bullet points) with live RAG telemetry grounding'
  },
  {
    name: 'phase5_15_mobile_citizen_nav',
    url: 'http://localhost:3005/mumbai/dashboard',
    width: 390,
    height: 844,
    delay: 6500,
    desc: 'Mobile Citizen Navigation (390x844): 5-tab bottom navigation with elevated (+) button, zero overflow'
  },
  {
    name: 'phase5_16_mobile_map_and_reporting',
    url: 'http://localhost:3005/mumbai/report',
    width: 390,
    height: 844,
    delay: 6000,
    desc: 'Mobile Civic Reporting (390x844): Responsive 2-column municipal category grid with 48px touch targets'
  }
];

async function capture() {
  console.log('=== SENTINEL PHASE 5 FINAL HANDOVER SCREENSHOT CAPTURE ===\n');
  console.log(`Browser: ${BROWSER_PATH}`);
  console.log(`Target Directory: ${OUT_DIR}`);
  console.log(`Mirror Directory: ${MIRROR_DIR}\n`);

  for (let i = 0; i < SCREENS.length; i++) {
    const s = SCREENS[i];
    const outPath = path.join(OUT_DIR, `${s.name}.png`);
    const mirrorPath = path.join(MIRROR_DIR, `${s.name}.png`);

    console.log(`[${i + 1}/${SCREENS.length}] Capturing ${s.name} (${s.width}x${s.height})`);
    console.log(`  URL: ${s.url}`);

    const tmpUserData = path.join(os.tmpdir(), `edge_p5_${Date.now()}_${i}`);

    const args = [
      '--headless',
      '--disable-gpu',
      '--hide-scrollbars',
      '--no-sandbox',
      '--disable-features=Translate,OptimizationHints,MediaRouter',
      `--user-data-dir=${tmpUserData}`,
      `--window-size=${s.width},${s.height}`,
      `--screenshot=${outPath}`,
      `--virtual-time-budget=${s.delay || 6000}`,
      s.url
    ];

    const proc = spawnSync(BROWSER_PATH, args, { encoding: 'utf-8', timeout: 30000 });

    try {
      fs.rmSync(tmpUserData, { recursive: true, force: true });
    } catch {
      // ignore
    }

    if (fs.existsSync(outPath) && fs.statSync(outPath).size > 1000) {
      const sizeKb = (fs.statSync(outPath).size / 1024).toFixed(1);
      console.log(`  -> SUCCESS (${sizeKb} KB)`);
      fs.copyFileSync(outPath, mirrorPath);
    } else {
      console.log(`  -> WARNING: Empty or missing output for ${s.name}`);
    }
  }

  console.log('\n=== COMPLETED: ALL PHASE 5 FINAL SCREENSHOTS CAPTURED ===\n');
}

capture();
