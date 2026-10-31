import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const OUT_DIR = path.resolve(process.cwd(), "public/screenshots/phase7_final");
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const TARGETS = [
  {
    name: "01_phase7_citizen_dashboard_desktop.png",
    url: "http://localhost:3000/mumbai/dashboard",
    width: 1280,
    height: 850,
  },
  {
    name: "02_phase7_citizen_dashboard_mobile.png",
    url: "http://localhost:3000/mumbai/dashboard",
    width: 390,
    height: 844,
  },
  {
    name: "03_phase7_citizen_alerts_desktop.png",
    url: "http://localhost:3000/mumbai/alerts",
    width: 1280,
    height: 850,
  },
  {
    name: "04_phase7_citizen_alerts_mobile.png",
    url: "http://localhost:3000/mumbai/alerts",
    width: 390,
    height: 844,
  },
  {
    name: "05_phase7_pune_dashboard_desktop.png",
    url: "http://localhost:3000/pune/dashboard",
    width: 1280,
    height: 850,
  },
  {
    name: "06_phase7_nagpur_dashboard_desktop.png",
    url: "http://localhost:3000/nagpur/dashboard",
    width: 1280,
    height: 850,
  },
];

console.log("Capturing Phase 7 Final Screenshots...");
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

  const res = spawnSync(EDGE_PATH, args, { stdio: "inherit" });
  if (res.status === 0 && fs.existsSync(outPath)) {
    const stats = fs.statSync(outPath);
    console.log(`✓ Saved ${t.name} (${stats.size} bytes)`);
  } else {
    console.error(`✗ Failed to capture ${t.name}`);
  }
}
console.log("Done capturing Phase 7 screenshots.");
