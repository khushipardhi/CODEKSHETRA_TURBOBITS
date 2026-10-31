import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BROWSER_PATH = fs.existsSync(EDGE_PATH) ? EDGE_PATH : CHROME_PATH;

const OUT_DIR = path.resolve(process.cwd(), "public/screenshots/phase2_sim");
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const TARGETS = [
  {
    name: "01_phase2_spatial_simulation_mumbai.png",
    url: "http://localhost:3000/admin/mumbai/simulation",
    width: 1440,
    height: 900,
    description: "Phase 2 Spatial Simulation Lab with decluttered micro-markers and calibrated isoband translucency",
  },
  {
    name: "02_phase2_ward_l_kurla_focus.png",
    url: "http://localhost:3000/admin/mumbai/simulation?ward=L&t=2",
    width: 1440,
    height: 900,
    description: "Ward L (Kurla) inspection with highlighted flood hotspots and Mithi River nullah vectors",
  },
  {
    name: "03_phase2_ward_fs_dadar_focus.png",
    url: "http://localhost:3000/admin/mumbai/simulation?ward=F/S&t=2",
    width: 1440,
    height: 900,
    description: "Ward F/South (Dadar / Parel) inspection with localized depression hotspots",
  },
  {
    name: "04_phase2_rainfall_accumulation_t3h.png",
    url: "http://localhost:3000/admin/mumbai/simulation?scenario=rainfall_accumulation&t=3",
    width: 1440,
    height: 900,
    description: "Multi-Horizon Rainfall Accumulation at T=3h with transparent continuous surface",
  },
];

console.log(`Starting Phase 2 simulation screenshot capture using: ${BROWSER_PATH}`);
const results = [];

for (const target of TARGETS) {
  const outPath = path.join(OUT_DIR, target.name);
  console.log(`Capturing: ${target.name} from ${target.url}...`);

  const args = [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    `--window-size=${target.width},${target.height}`,
    `--screenshot=${outPath}`,
    "--virtual-time-budget=6000",
    target.url,
  ];

  const proc = spawnSync(BROWSER_PATH, args, { encoding: "utf-8", timeout: 25000 });
  if (fs.existsSync(outPath) && fs.statSync(outPath).size > 1000) {
    const sizeKb = (fs.statSync(outPath).size / 1024).toFixed(1);
    console.log(`  ✔ Successfully saved: ${target.name} (${sizeKb} KB)`);
    results.push({ name: target.name, success: true, sizeKb, description: target.description });
  } else {
    console.log(`  ✖ Failed to capture: ${target.name}`);
    results.push({ name: target.name, success: false, error: proc.stderr || "Zero byte file" });
  }
}

console.log("\nSummary of Phase 2 Captures:");
console.table(results);
