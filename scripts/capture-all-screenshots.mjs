/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Automated Headless Screenshot Capturer
   Captures authentic rendered UI across routes at desktop & mobile viewports.
   ════════════════════════════════════════════════════════ */

import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BROWSER_PATH = fs.existsSync(EDGE_PATH) ? EDGE_PATH : CHROME_PATH;

const OUT_DIR = path.resolve(process.cwd(), "public/screenshots");
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const TARGETS = [
  {
    name: "01_citizen_dashboard_desktop.png",
    url: "http://localhost:3000/mumbai/dashboard",
    width: 1280,
    height: 800,
    description: "Citizen Dashboard (Mumbai) with Live Sentinel Condition Banner",
  },
  {
    name: "02_citizen_dashboard_mobile.png",
    url: "http://localhost:3000/mumbai/dashboard",
    width: 390,
    height: 844,
    description: "Citizen Dashboard (Mumbai) on mobile (390x844)",
  },
  {
    name: "03_citizen_sentinel_hub_desktop.png",
    url: "http://localhost:3000/mumbai/sentinel",
    width: 1280,
    height: 850,
    description: "Sentinel Multi-Hazard Intelligence Hub (Mumbai) with Live Telemetry & Shelters",
  },
  {
    name: "04_citizen_sentinel_hub_mobile.png",
    url: "http://localhost:3000/mumbai/sentinel",
    width: 390,
    height: 844,
    description: "Sentinel Multi-Hazard Intelligence Hub (Mumbai) on mobile (390x844)",
  },
  {
    name: "05_admin_overview_desktop.png",
    url: "http://localhost:3000/admin/mumbai",
    width: 1280,
    height: 850,
    description: "Admin Command Centre Overview with Sentinel Multi-Hazard Intelligence Card",
  },
  {
    name: "06_admin_overview_mobile.png",
    url: "http://localhost:3000/admin/mumbai",
    width: 390,
    height: 844,
    description: "Admin Command Centre Overview on mobile (390x844)",
  },
  {
    name: "07_admin_hazard_map_mumbai.png",
    url: "http://localhost:3000/admin/mumbai/map",
    width: 1280,
    height: 850,
    description: "Admin Multi-Hazard Command Map (Mumbai) with GIS Flood Corridors and Weather Ribbon",
  },
  {
    name: "08_department_drainage_desktop.png",
    url: "http://localhost:3000/department/mumbai/drainage",
    width: 1280,
    height: 850,
    description: "Stormwater Drainage Department Operations Console with Sentinel Live Advisory",
  },
  {
    name: "09_pune_sentinel_hub.png",
    url: "http://localhost:3000/pune/sentinel",
    width: 1280,
    height: 850,
    description: "Pune Sentinel Intelligence Hub with PMC Shelters & Mutha River Basin Telemetry",
  },
  {
    name: "10_pune_admin_hazard_map.png",
    url: "http://localhost:3000/admin/pune/map",
    width: 1280,
    height: 850,
    description: "Pune Admin Command Map showing PMC boundaries and Pune-isolated telemetry",
  },
  {
    name: "11_nagpur_sentinel_hub.png",
    url: "http://localhost:3000/nagpur/sentinel",
    width: 1280,
    height: 850,
    description: "Nagpur Sentinel Hub with NMC Shelters, Heat & Air Quality Context",
  },
  {
    name: "12_citizen_reporting_intact.png",
    url: "http://localhost:3000/mumbai/report",
    width: 1280,
    height: 850,
    description: "Citizen Issue Reporting Flow Intact with Voice & Category Selection",
  },
];

console.log(`Starting automated screenshot capture using: ${BROWSER_PATH}`);
const results = [];

for (const t of TARGETS) {
  const outPath = path.join(OUT_DIR, t.name);
  console.log(`Capturing: ${t.name} (${t.width}x${t.height}) from ${t.url}`);

  const args = [
    "--headless",
    "--disable-gpu",
    `--window-size=${t.width},${t.height}`,
    "--virtual-time-budget=7000",
    `--screenshot=${outPath}`,
    t.url,
  ];

  try {
    const res = spawnSync(BROWSER_PATH, args, { timeout: 30000 });
    const exists = fs.existsSync(outPath);
    const size = exists ? fs.statSync(outPath).size : 0;
    console.log(` -> ${t.name}: ${exists ? `SUCCESS (${size} bytes)` : "FAILED"}`);
    results.push({ ...t, path: outPath, size, success: exists });
  } catch (err) {
    console.error(` -> Error capturing ${t.name}:`, err.message);
    results.push({ ...t, path: outPath, size: 0, success: false, error: err.message });
  }
}

console.log("\n--- SCREENSHOT CAPTURE COMPLETE ---");
console.log(JSON.stringify(results, null, 2));
