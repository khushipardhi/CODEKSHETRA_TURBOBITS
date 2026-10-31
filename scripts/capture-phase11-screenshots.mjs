/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Phase 11 Headless Screenshot Capturer
   Captures authentic rendered UI across all Phase 11 cross-dashboard
   views: Admin Data Quality Monitor, Command Center, GIS Hazard Map,
   Citizen Multi-Hazard Briefing, Sentinel AI, Alert Centre,
   and Department Consoles across Desktop & Mobile viewports.
   ════════════════════════════════════════════════════════ */

import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BROWSER_PATH = fs.existsSync(EDGE_PATH) ? EDGE_PATH : CHROME_PATH;

const OUT_DIR = path.resolve(process.cwd(), "public/screenshots/phase11");
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const ARTIFACT_DIR = path.resolve(
  "C:/Users/omsat/.gemini/antigravity-ide/brain/8087085b-5ab5-4129-8b64-884dc08d2745/phase11_screenshots"
);
if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

const TARGETS = [
  {
    name: "phase11_01_admin_settings_data_quality_desktop.png",
    url: "http://localhost:3000/admin/settings",
    width: 1366,
    height: 900,
    role: "Admin",
    city: "All",
    viewport: "Desktop (1366x900)",
    description: "Centralized Data Quality & Connector Health Monitor showing provider latencies, observation age vs ingestion time, and SLA targets",
  },
  {
    name: "phase11_02_admin_settings_data_quality_mobile.png",
    url: "http://localhost:3000/admin/settings",
    width: 390,
    height: 844,
    role: "Admin",
    city: "All",
    viewport: "Mobile (390x844)",
    description: "Centralized Data Quality Monitor rendered on Mobile Viewport with responsive cards",
  },
  {
    name: "phase11_03_admin_command_centre_desktop.png",
    url: "http://localhost:3000/admin",
    width: 1366,
    height: 900,
    role: "Admin",
    city: "Nagpur (Default)",
    viewport: "Desktop (1366x900)",
    description: "Admin Command Centre Overview with live KPI aggregations, dynamic connector indicators, and operational triage",
  },
  {
    name: "phase11_04_admin_hazard_map_desktop.png",
    url: "http://localhost:3000/admin/mumbai/map",
    width: 1366,
    height: 900,
    role: "Admin",
    city: "Mumbai",
    viewport: "Desktop (1366x900)",
    description: "Admin Command Hazard Map with Mumbai Copernicus DEM elevation sinks, tidal sluice gates, and verified incidents",
  },
  {
    name: "phase11_05_admin_hazard_map_mobile.png",
    url: "http://localhost:3000/admin/mumbai/map",
    width: 390,
    height: 844,
    role: "Admin",
    city: "Mumbai",
    viewport: "Mobile (390x844)",
    description: "Admin Hazard Map on Mobile Viewport with mobile bottom drawer controls",
  },
  {
    name: "phase11_06_citizen_mumbai_home_desktop.png",
    url: "http://localhost:3000/mumbai/dashboard",
    width: 1366,
    height: 900,
    role: "Citizen",
    city: "Mumbai",
    viewport: "Desktop (1366x900)",
    description: "Citizen Multi-Hazard Dashboard showing Dadar Area Briefing, live rainfall telemetry, and verified facilities",
  },
  {
    name: "phase11_07_citizen_mumbai_home_mobile.png",
    url: "http://localhost:3000/mumbai/dashboard",
    width: 390,
    height: 844,
    role: "Citizen",
    city: "Mumbai",
    viewport: "Mobile (390x844)",
    description: "Citizen Mobile Viewport showing quick category reporting grid and local hazard status",
  },
  {
    name: "phase11_08_citizen_sentinel_ai_desktop.png",
    url: "http://localhost:3000/mumbai/sentinel",
    width: 1366,
    height: 900,
    role: "Citizen",
    city: "Mumbai",
    viewport: "Desktop (1366x900)",
    description: "Sentinel AI Citizen Assistant Console with evidence-grounded advice and verified safety guidance",
  },
  {
    name: "phase11_09_citizen_alert_centre_desktop.png",
    url: "http://localhost:3000/mumbai/alerts",
    width: 1366,
    height: 900,
    role: "Citizen",
    city: "Mumbai",
    viewport: "Desktop (1366x900)",
    description: "Citizen Municipal Alert Centre displaying active official warning broadcasts without internal draft leakage",
  },
  {
    name: "phase11_10_department_mumbai_swd_desktop.png",
    url: "http://localhost:3000/department/mumbai/drainage/tasks",
    width: 1366,
    height: 900,
    role: "Department",
    city: "Mumbai",
    viewport: "Desktop (1366x900)",
    description: "Mumbai BMC Stormwater Drainage Department Task Desk with SLA countdowns & Primary/Supporting badges",
  },
  {
    name: "phase11_11_department_pune_roads_desktop.png",
    url: "http://localhost:3000/department/pune/road_maintenance/tasks",
    width: 1366,
    height: 900,
    role: "Department",
    city: "Pune",
    viewport: "Desktop (1366x900)",
    description: "Pune PMC Roads Department Console with pothole and road restoration work orders",
  },
  {
    name: "phase11_12_department_nagpur_electricity_desktop.png",
    url: "http://localhost:3000/department/nagpur/electricity/tasks",
    width: 1366,
    height: 900,
    role: "Department",
    city: "Nagpur",
    viewport: "Desktop (1366x900)",
    description: "Nagpur NMC Electricity Department Console showing live feeder isolation and transformer maintenance tasks",
  },
  {
    name: "phase11_13_citizen_my_reports_desktop.png",
    url: "http://localhost:3000/mumbai/my-reports",
    width: 1366,
    height: 900,
    role: "Citizen",
    city: "Mumbai",
    viewport: "Desktop (1366x900)",
    description: "Citizen Incident Tracking Desk with real-time lifecycle status badges and public explanation",
  },
  {
    name: "phase11_14_citizen_my_reports_mobile.png",
    url: "http://localhost:3000/mumbai/my-reports",
    width: 390,
    height: 844,
    role: "Citizen",
    city: "Mumbai",
    viewport: "Mobile (390x844)",
    description: "Citizen Incident Tracking Desk on Mobile Viewport with responsive status cards",
  },
];

console.log(`Starting Phase 11 automated screenshot capture using: ${BROWSER_PATH}`);
const results = [];

for (const t of TARGETS) {
  const outPath = path.join(OUT_DIR, t.name);
  const artifactPath = path.join(ARTIFACT_DIR, t.name);
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
    if (exists) {
      fs.copyFileSync(outPath, artifactPath);
    }
    console.log(` -> ${t.name}: ${exists ? `SUCCESS (${size} bytes)` : "FAILED"}`);
    results.push({ ...t, path: outPath, artifactPath, size, success: exists });
  } catch (err) {
    console.error(` -> Error capturing ${t.name}:`, err.message);
    results.push({ ...t, path: outPath, artifactPath, size: 0, success: false, error: err.message });
  }
}

console.log("\n--- PHASE 11 SCREENSHOT CAPTURE COMPLETE ---");
console.log(`Successfully captured: ${results.filter(r => r.success).length} / ${results.length}`);
