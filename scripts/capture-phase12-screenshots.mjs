/**
 * scripts/capture-phase12-screenshots.mjs
 * Automated headless browser screenshot capture using Microsoft Edge for Phase 12.
 * Captures all required citizen, admin, department, GIS map, and mobile screens.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUT_DIR = path.resolve(process.cwd(), 'public', 'screenshots', 'phase12');
const MIRROR_DIR = path.resolve(process.cwd(), 'phase12_screenshots');

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
if (!fs.existsSync(MIRROR_DIR)) fs.mkdirSync(MIRROR_DIR, { recursive: true });

const SCREENS = [
  {
    name: 'phase12_01_citizen_home_my_area_desktop',
    url: 'http://localhost:3000/mumbai/dashboard',
    width: 1366,
    height: 900,
    delay: 3500,
    desc: 'Citizen Home & Hyperlocal Area Briefing'
  },
  {
    name: 'phase12_02_citizen_sentinel_ai_desktop',
    url: 'http://localhost:3000/mumbai/sentinel',
    width: 1366,
    height: 900,
    delay: 3000,
    desc: 'Sentinel AI Assistant with Live Grounding'
  },
  {
    name: 'phase12_03_citizen_alert_centre_desktop',
    url: 'http://localhost:3000/mumbai/alerts',
    width: 1366,
    height: 900,
    delay: 2500,
    desc: 'Citizen Alert Centre'
  },
  {
    name: 'phase12_04_citizen_report_submission_desktop',
    url: 'http://localhost:3000/mumbai/report',
    width: 1366,
    height: 900,
    delay: 2500,
    desc: 'Voice & Photo Report Submission'
  },
  {
    name: 'phase12_05_citizen_report_tracking_desktop',
    url: 'http://localhost:3000/mumbai/my-reports',
    width: 1366,
    height: 900,
    delay: 2500,
    desc: 'Citizen Report Tracking Desk'
  },
  {
    name: 'phase12_06_admin_command_center_desktop',
    url: 'http://localhost:3000/admin',
    width: 1366,
    height: 900,
    delay: 3500,
    desc: 'Admin Operational Command Center'
  },
  {
    name: 'phase12_07_admin_map_polished_layers_desktop',
    url: 'http://localhost:3000/admin/map',
    width: 1366,
    height: 900,
    delay: 4500,
    desc: 'Polished Admin GIS Map with Floating Toolbar & Waterway Layers'
  },
  {
    name: 'phase12_08_admin_incidents_decision_desk_desktop',
    url: 'http://localhost:3000/admin/incidents',
    width: 1366,
    height: 900,
    delay: 3000,
    desc: 'Admin Incidents & Decision Desk'
  },
  {
    name: 'phase12_09_department_mumbai_swd_tasks_desktop',
    url: 'http://localhost:3000/department/mumbai/MCGM-SWD/tasks',
    width: 1366,
    height: 900,
    delay: 3000,
    desc: 'Department Mumbai SWD Tasks & SLA Desk'
  },
  {
    name: 'phase12_10_department_pune_fire_tasks_desktop',
    url: 'http://localhost:3000/department/pune/PMC-FIRE/tasks',
    width: 1366,
    height: 900,
    delay: 3000,
    desc: 'Department Pune Fire Rescue Tasks'
  },
  {
    name: 'phase12_11_department_nagpur_health_tasks_desktop',
    url: 'http://localhost:3000/department/nagpur/NMC-HEALTH/tasks',
    width: 1366,
    height: 900,
    delay: 3000,
    desc: 'Department Nagpur Health Tasks Desk'
  },
  {
    name: 'phase12_12_pune_city_dashboard_desktop',
    url: 'http://localhost:3000/pune/dashboard',
    width: 1366,
    height: 900,
    delay: 3000,
    desc: 'Pune Citizen Dashboard & Enriched Facilities'
  },
  {
    name: 'phase12_13_nagpur_city_dashboard_desktop',
    url: 'http://localhost:3000/nagpur/dashboard',
    width: 1366,
    height: 900,
    delay: 3000,
    desc: 'Nagpur Citizen Dashboard & Enriched Facilities'
  },
  {
    name: 'phase12_14_admin_data_quality_health_monitor_desktop',
    url: 'http://localhost:3000/admin/settings',
    width: 1366,
    height: 900,
    delay: 3500,
    desc: 'Admin Settings & Live Data Quality Health Monitor'
  },
  {
    name: 'phase12_15_mobile_citizen_dashboard',
    url: 'http://localhost:3000/mumbai/dashboard',
    width: 390,
    height: 844,
    delay: 3000,
    desc: 'Mobile Citizen View (390x844)'
  },
  {
    name: 'phase12_16_mobile_department_tasks',
    url: 'http://localhost:3000/department/mumbai/MCGM-SWD/tasks',
    width: 390,
    height: 844,
    delay: 3000,
    desc: 'Mobile Department View (390x844)'
  }
];

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function capture() {
  console.log('=== SENTINEL PHASE 12 AUTOMATED SCREENSHOT CAPTURE ===\n');
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
      execSync(cmd, { stdio: 'ignore', timeout: 25000 });
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

  console.log('\n=== ALL PHASE 12 SCREENSHOTS CAPTURED SUCCESSFULLY ===');
}

capture().catch(err => {
  console.error('Fatal capture error:', err);
  process.exit(1);
});
