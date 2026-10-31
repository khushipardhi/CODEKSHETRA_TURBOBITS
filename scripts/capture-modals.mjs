import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const OUT_DIR = path.resolve(process.cwd(), "public/screenshots");

const TARGETS = [
  {
    name: "13_admin_alert_review_modal.png",
    url: "http://localhost:3000/admin/mumbai/map?tab=alerts",
    width: 1280,
    height: 850,
  },
  {
    name: "14_admin_monsoon_simulation_modal.png",
    url: "http://localhost:3000/admin/mumbai/map?tab=simulation",
    width: 1280,
    height: 850,
  },
];

for (const t of TARGETS) {
  const outPath = path.join(OUT_DIR, t.name);
  console.log(`Capturing: ${t.name} from ${t.url}`);
  const args = [
    "--headless",
    "--disable-gpu",
    `--window-size=${t.width},${t.height}`,
    "--virtual-time-budget=7000",
    `--screenshot=${outPath}`,
    t.url,
  ];
  spawnSync(EDGE_PATH, args, { timeout: 30000 });
  console.log(`Saved: ${outPath} (${fs.statSync(outPath).size} bytes)`);
}
