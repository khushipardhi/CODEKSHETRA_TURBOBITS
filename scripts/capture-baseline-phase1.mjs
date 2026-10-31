import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BROWSER_PATH = fs.existsSync(EDGE_PATH) ? EDGE_PATH : CHROME_PATH;

const OUT_DIR = path.resolve(process.cwd(), "public/screenshots/phase1_baseline");
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const TARGETS = [
  {
    name: "01_spatial_simulation_mumbai.png",
    url: "http://localhost:3000/admin/mumbai/simulation",
    width: 1280,
    height: 800,
    description: "Spatial Simulation Lab (Mumbai) with parameters and Leaflet canvas",
  },
  {
    name: "02_spatial_simulation_pune_defect.png",
    url: "http://localhost:3000/admin/pune/simulation",
    width: 1280,
    height: 800,
    description: "Spatial Simulation Lab (Pune) showing Mumbai geometry under Pune jurisdiction selector",
  },
  {
    name: "03_telemetry_lab_overview.png",
    url: "http://localhost:3000/admin/mumbai/telemetry-lab",
    width: 1280,
    height: 800,
    description: "Environmental Telemetry Lab Overview with parameter cards and progression charts",
  },
  {
    name: "04_telemetry_lab_parameters.png",
    url: "http://localhost:3000/admin/mumbai/telemetry-lab?tab=parameters",
    width: 1280,
    height: 800,
    description: "Parameter Explorer tab with catalog of 49+ environmental variables",
  },
  {
    name: "05_admin_overview.png",
    url: "http://localhost:3000/admin/mumbai",
    width: 1280,
    height: 800,
    description: "Admin Command Centre Overview with KPIs and quick actions",
  },
  {
    name: "06_citizen_dashboard.png",
    url: "http://localhost:3000/mumbai/dashboard",
    width: 1280,
    height: 800,
    description: "Citizen Hazard Intelligence Dashboard with location briefing and hazard map",
  },
  {
    name: "07_citizen_reporting.png",
    url: "http://localhost:3000/mumbai/report",
    width: 1280,
    height: 800,
    description: "Citizen Civic Issue Reporting destination separated from hazard dashboard",
  },
  {
    name: "08_spatial_simulation_pune_unsupported.png",
    url: "http://localhost:3000/admin/pune/simulation",
    width: 1280,
    height: 800,
    description: "Spatial Simulation Lab (Pune) with clean unsupported state contract",
  },
];

console.log(`Starting Phase 1 baseline screenshot capture using: ${BROWSER_PATH}`);
const results = [];

for (const t of TARGETS) {
  const outPath = path.join(OUT_DIR, t.name);
  console.log(`Capturing: ${t.name} from ${t.url}`);

  const args = [
    "--headless",
    "--disable-gpu",
    `--window-size=${t.width},${t.height}`,
    "--virtual-time-budget=8000",
    `--screenshot=${outPath}`,
    t.url,
  ];

  try {
    spawnSync(BROWSER_PATH, args, { timeout: 35000 });
    const exists = fs.existsSync(outPath);
    const size = exists ? fs.statSync(outPath).size : 0;
    console.log(` -> ${t.name}: ${exists ? `SUCCESS (${size} bytes)` : "FAILED"}`);
    results.push({ ...t, path: outPath, size, success: exists });
  } catch (err) {
    console.error(` -> Error capturing ${t.name}:`, err.message);
    results.push({ ...t, path: outPath, size: 0, success: false, error: err.message });
  }
}

console.log("\n--- BASELINE CAPTURE SUMMARY ---");
console.log(JSON.stringify(results.map(r => ({ name: r.name, size: r.size, success: r.success })), null, 2));
