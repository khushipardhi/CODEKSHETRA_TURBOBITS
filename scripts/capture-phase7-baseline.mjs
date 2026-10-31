import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const OUT_DIR = path.resolve(process.cwd(), "public/screenshots/phase7_baseline");
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const TARGETS = [
  {
    name: "baseline_citizen_dashboard_desktop.png",
    url: "http://localhost:3000/mumbai/dashboard",
    width: 1280,
    height: 800,
  },
  {
    name: "baseline_citizen_dashboard_mobile.png",
    url: "http://localhost:3000/mumbai/dashboard",
    width: 390,
    height: 844,
  },
  {
    name: "baseline_citizen_report_desktop.png",
    url: "http://localhost:3000/mumbai/report",
    width: 1280,
    height: 800,
  },
  {
    name: "baseline_citizen_myreports_desktop.png",
    url: "http://localhost:3000/mumbai/my-reports",
    width: 1280,
    height: 800,
  },
  {
    name: "baseline_citizen_sentinel_desktop.png",
    url: "http://localhost:3000/mumbai/sentinel",
    width: 1280,
    height: 850,
  },
  {
    name: "baseline_citizen_sentinel_mobile.png",
    url: "http://localhost:3000/mumbai/sentinel",
    width: 390,
    height: 844,
  },
];

console.log("Capturing Phase 7 Baseline Screenshots...");
for (const t of TARGETS) {
  const outPath = path.join(OUT_DIR, t.name);
  console.log(`Capturing: ${t.name} from ${t.url}`);
  const args = [
    "--headless",
    "--disable-gpu",
    `--window-size=${t.width},${t.height}`,
    "--virtual-time-budget=6000",
    `--screenshot=${outPath}`,
    t.url,
  ];
  spawnSync(EDGE_PATH, args, { timeout: 30000 });
  const size = fs.existsSync(outPath) ? fs.statSync(outPath).size : 0;
  console.log(`Saved: ${outPath} (${size} bytes)`);
}
console.log("Phase 7 Baseline Capture Complete!");
