import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const OUT_DIR = path.resolve(process.cwd(), "public/screenshots/phase8_final");

const TARGETS = [
  {
    name: "07_phase8_admin_map_pune_desktop.png",
    url: "http://localhost:3000/admin/pune/map",
    width: 1280,
    height: 850,
  },
  {
    name: "08_phase8_admin_map_nagpur_desktop.png",
    url: "http://localhost:3000/admin/nagpur/map",
    width: 1280,
    height: 850,
  },
];

console.log("Capturing Pune and Nagpur Phase 8 Map Screenshots...");
for (const t of TARGETS) {
  const outPath = path.join(OUT_DIR, t.name);
  console.log(`Capturing: ${t.name} from ${t.url}`);
  const args = [
    "--headless",
    "--disable-gpu",
    `--window-size=${t.width},${t.height}`,
    "--virtual-time-budget=6500",
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
console.log("Done capturing Pune and Nagpur screenshots.");
