import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

const BROWSER_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUT_DIR = path.resolve(process.cwd(), 'public', 'screenshots', 'phase6');
const MIRROR_DIR = path.resolve(process.cwd(), 'phase6_screenshots');

const SCREENS = [
  {
    name: 'phase6_02_simulation_scenario_inputs_freshness',
    url: 'http://localhost:3005/admin/mumbai/simulation?scenario=monsoon_downpour_saucer_sinks&rate=65',
    width: 1440,
    height: 900,
    delay: 5000,
  },
  {
    name: 'phase6_08_telemetry_lab_data_quality_health',
    url: 'http://localhost:3005/admin/mumbai/telemetry-lab?tab=data_quality',
    width: 1440,
    height: 900,
    delay: 5000,
  },
  {
    name: 'phase6_09_citizen_hazard_dashboard_desktop',
    url: 'http://localhost:3005/mumbai/dashboard',
    width: 1440,
    height: 900,
    delay: 5000,
  }
];

for (const s of SCREENS) {
  const outPng = path.join(OUT_DIR, `${s.name}.png`);
  const mirrorPng = path.join(MIRROR_DIR, `${s.name}.png`);
  console.log(`Capturing: ${s.name}`);
  const tmpUserData = path.join(os.tmpdir(), `edge_p6_fix_${Date.now()}`);

  const args = [
    '--headless',
    '--disable-gpu',
    '--hide-scrollbars',
    '--no-sandbox',
    '--disable-features=Translate,OptimizationHints,MediaRouter',
    `--user-data-dir=${tmpUserData}`,
    `--window-size=${s.width},${s.height}`,
    `--screenshot=${outPng}`,
    `--virtual-time-budget=${s.delay || 5000}`,
    s.url,
  ];

  const proc = spawnSync(BROWSER_PATH, args, { encoding: 'utf-8', timeout: 35000 });
  try { fs.rmSync(tmpUserData, { recursive: true, force: true }); } catch {}

  if (fs.existsSync(outPng) && fs.statSync(outPng).size > 1000) {
    fs.copyFileSync(outPng, mirrorPng);
    console.log(`  ✔ SUCCESS ${s.name} (${fs.statSync(outPng).size} bytes)`);
  } else {
    console.error(`  ✖ Failed: ${proc.error ? proc.error.message : 'output file missing'}`);
  }
}
