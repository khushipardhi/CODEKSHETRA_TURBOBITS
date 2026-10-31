/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Phase 10 Headless Screenshot Capturer
   Captures authentic rendered UI across Phase 10 operational routing,
   department coordination, and admin decision center across viewports.
   ════════════════════════════════════════════════════════ */

import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BROWSER_PATH = fs.existsSync(EDGE_PATH) ? EDGE_PATH : CHROME_PATH;

const OUT_DIR = path.resolve(process.cwd(), "public/screenshots/phase10");
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const TARGETS = [
  {
    name: "phase10_01_admin_operational_decision_center_desktop.png",
    url: "http://localhost:3000/admin",
    width: 1366,
    height: 900,
    description: "Admin Operational Decision Center showing routing KPIs, reviews, overdue SLA tasks, and blocked dependencies (Desktop)",
  },
  {
    name: "phase10_02_admin_operational_decision_center_mobile.png",
    url: "http://localhost:3000/admin",
    width: 390,
    height: 844,
    description: "Admin Operational Decision Center on mobile viewport (390x844)",
  },
  {
    name: "phase10_03_mumbai_drainage_tasks_desk_desktop.png",
    url: "http://localhost:3000/department/mumbai/drainage/tasks",
    width: 1366,
    height: 900,
    description: "Mumbai BMC Stormwater Drainage Department Task Desk with Primary/Supporting badges, SLA countdowns & Blocked indicators (Desktop)",
  },
  {
    name: "phase10_04_mumbai_drainage_tasks_desk_mobile.png",
    url: "http://localhost:3000/department/mumbai/drainage/tasks",
    width: 390,
    height: 844,
    description: "Mumbai BMC Stormwater Drainage Department Task Desk on mobile viewport (390x844)",
  },
  {
    name: "phase10_05_pune_roads_tasks_desk_desktop.png",
    url: "http://localhost:3000/department/pune/road_maintenance/tasks",
    width: 1366,
    height: 900,
    description: "Pune PMC Road Department Task Desk showing potholes, resurfacing tasks, and dependencies",
  },
  {
    name: "phase10_06_nagpur_electrical_tasks_desk_desktop.png",
    url: "http://localhost:3000/department/nagpur/electricity/tasks",
    width: 1366,
    height: 900,
    description: "Nagpur NMC Electrical Department Task Desk with live wire & feeder isolation workflows",
  },
  {
    name: "phase10_07_citizen_tracking_and_briefing_desktop.png",
    url: "http://localhost:3000/mumbai/dashboard",
    width: 1366,
    height: 900,
    description: "Citizen Multi-Hazard Dashboard with Explainable Operational Status & Real-Time Hydrology Briefing",
  },
];

console.log(`Starting Phase 10 automated screenshot capture using: ${BROWSER_PATH}`);
const results = [];

for (const t of TARGETS) {
  const outPath = path.join(OUT_DIR, t.name);
  console.log(`Capturing: ${t.name} (${t.width}x${t.height}) from ${t.url}`);

  const args = [
    "--headless",
    "--disable-gpu",
    `--window-size=${t.width},${t.height}`,
    "--virtual-time-budget=8000",
    `--screenshot=${outPath}`,
    t.url,
  ];

  try {
    const res = spawnSync(BROWSER_PATH, args, { timeout: 35000 });
    const exists = fs.existsSync(outPath);
    const size = exists ? fs.statSync(outPath).size : 0;
    console.log(` -> ${t.name}: ${exists ? `SUCCESS (${size} bytes)` : "FAILED"}`);
    results.push({ ...t, path: outPath, size, success: exists });
  } catch (err) {
    console.error(` -> Error capturing ${t.name}:`, err.message);
    results.push({ ...t, path: outPath, size: 0, success: false, error: err.message });
  }
}

console.log("\n--- PHASE 10 SCREENSHOT CAPTURE COMPLETE ---");
console.log(`Captured ${results.filter((r) => r.success).length} / ${results.length} screenshots successfully.`);
