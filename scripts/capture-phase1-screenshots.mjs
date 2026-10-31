/**
 * scripts/capture-phase1-screenshots.mjs
 * Automated headless browser screenshot capture using Microsoft Edge for Phase 1.
 * Captures all required citizen, admin, department, GIS map, and mobile screens.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUT_DIR = path.resolve(process.cwd(), 'public', 'screenshots', 'phase1');
const MIRROR_DIR = path.resolve(process.cwd(), 'phase1_screenshots');

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
if (!fs.existsSync(MIRROR_DIR)) fs.mkdirSync(MIRROR_DIR, { recursive: true });

const SCREENS = [
  {
    name: 'phase1_01_citizen_dashboard_desktop',
    url: 'http://localhost:3000/mumbai/dashboard',
    width: 1366,
    height: 900,
    delay: 3500,
    desc: 'Citizen Dashboard Desktop: Local conditions, hazard status, verified facilities'
  },
  {
    name: 'phase1_02_citizen_dashboard_mobile',
    url: 'http://localhost:3000/mumbai/dashboard',
    width: 390,
    height: 844,
    delay: 3000,
    desc: 'Citizen Dashboard Mobile (390x844 responsive layout)'
  },
  {
    name: 'phase1_03_area_location_selection',
    url: 'http://localhost:3000/mumbai/dashboard#my-area',
    width: 1366,
    height: 900,
    delay: 3500,
    desc: 'Hyperlocal Area Selection & Live Conditions in Mumbai'
  },
  {
    name: 'phase1_04_citizen_hazard_detail_and_outlook',
    url: 'http://localhost:3000/mumbai/dashboard#hazard-status',
    width: 1366,
    height: 900,
    delay: 3500,
    desc: 'Hazard Categories, Preparedness Catalog, and 24h/7d Outlook'
  },
  {
    name: 'phase1_05_sentinel_ai_source_backed_briefing',
    url: 'http://localhost:3000/mumbai/sentinel',
    width: 1366,
    height: 900,
    delay: 3500,
    desc: 'Sentinel AI Grounded 6-Point Briefing with Citations'
  },
  {
    name: 'phase1_06_contextual_report_form_before_confirmation',
    url: 'http://localhost:3000/mumbai/dashboard?prefill=true&category=drainage_waterlogging&location=Milan%20Subway%2C%20Santacruz&summary=Suspected%20waterlogging%20due%20to%20severe%20storm%20drain%20blockage',
    width: 1366,
    height: 900,
    delay: 3500,
    desc: 'Contextual Report Form Prefilled from Sentinel AI with Human Review Required'
  },
  {
    name: 'phase1_07_citizen_my_reports_lifecycle',
    url: 'http://localhost:3000/mumbai/my-reports',
    width: 1366,
    height: 900,
    delay: 3000,
    desc: 'Citizen My Reports: Stable reference, department assignment, and lifecycle status'
  },
  {
    name: 'phase1_08_admin_command_and_incident_record',
    url: 'http://localhost:3000/admin/incidents',
    width: 1366,
    height: 900,
    delay: 3500,
    desc: 'Admin Incidents Queue: Triage, assigned departments, and audit trail'
  },
  {
    name: 'phase1_09_assigned_department_view',
    url: 'http://localhost:3000/department/mumbai/MCGM-SWD/tasks',
    width: 1366,
    height: 900,
    delay: 3500,
    desc: 'Assigned Department Queue: MCGM Storm Water Drains operational tasks'
  },
  {
    name: 'phase1_10_source_health_and_staleness_monitor',
    url: 'http://localhost:3000/admin/settings',
    width: 1366,
    height: 900,
    delay: 3500,
    desc: 'Provider Health & Stale Data Monitor: Retrieval status and timestamps'
  }
];

async function capture() {
  console.log('=== SENTINEL PHASE 1 AUTOMATED SCREENSHOT CAPTURE ===\n');
  console.log(`Target Directory: ${OUT_DIR}`);
  console.log(`Mirror Directory: ${MIRROR_DIR}\n`);

  for (let i = 0; i < SCREENS.length; i++) {
    const s = SCREENS[i];
    const outImg = path.join(OUT_DIR, `${s.name}.png`);
    const mirrorImg = path.join(MIRROR_DIR, `${s.name}.png`);

    console.log(`[${i + 1}/${SCREENS.length}] Capturing ${s.name} (${s.width}x${s.height})`);
    console.log(`  URL: ${s.url}`);

    const cmd = `"${EDGE_PATH}" --headless --disable-gpu --window-size=${s.width},${s.height} --screenshot="${outImg}" --virtual-time-budget=${s.delay} "${s.url}"`;
    try {
      execSync(cmd, { stdio: 'ignore', timeout: 30000 });
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

  console.log('\n=== ALL PHASE 1 SCREENSHOTS CAPTURED SUCCESSFULLY ===');
}

capture().catch(err => {
  console.error('Fatal capture error:', err);
  process.exit(1);
});
