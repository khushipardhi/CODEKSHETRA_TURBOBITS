import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const OUT_DIR = path.resolve(process.cwd(), "public/screenshots/phase8_baseline");
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const TARGETS = [
  {
    name: "baseline_admin_overview_desktop.png",
    url: "http://localhost:3000/admin/mumbai",
    width: 1280,
    height: 850,
  },
  {
    name: "baseline_admin_map_desktop.png",
    url: "http://localhost:3000/admin/mumbai/map",
    width: 1280,
    height: 850,
  },
  {
    name: "baseline_admin_map_mobile.png",
    url: "http://localhost:3000/admin/mumbai/map",
    width: 390,
    height: 844,
  },
  {
    name: "baseline_citizen_dashboard_desktop.png",
    url: "http://localhost:3000/mumbai/dashboard",
    width: 1280,
    height: 850,
  },
  {
    name: "baseline_citizen_sentinel_desktop.png",
    url: "http://localhost:3000/mumbai/sentinel",
    width: 1280,
    height: 850,
  },
  {
    name: "baseline_citizen_alerts_desktop.png",
    url: "http://localhost:3000/mumbai/alerts",
    width: 1280,
    height: 850,
  },
  {
    name: "baseline_dept_swm_desktop.png",
    url: "http://localhost:3000/department/mumbai/SWM",
    width: 1280,
    height: 850,
  },
  {
    name: "baseline_dept_tasks_desktop.png",
    url: "http://localhost:3000/department/mumbai/SWM/tasks",
    width: 1280,
    height: 850,
  },
];

console.log("Capturing Phase 8 Baseline Screenshots...");
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
console.log("Done capturing Phase 8 baseline screenshots.");
