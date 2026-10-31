/* ════════════════════════════════════════════════════════
   scripts/capture-phase3-integration-screenshots.mjs
   Automated headless Microsoft Edge screenshot capture for Phase 3.
   Captures all 10 verified integration screens and mirrors them
   to public/screenshots/phase3 and docs/screenshots/.
   ════════════════════════════════════════════════════════ */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const OUT_DIR = path.resolve(process.cwd(), "public", "screenshots", "phase3");
const DOCS_DIR = path.resolve(process.cwd(), "docs", "screenshots", "phase3");

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
if (!fs.existsSync(DOCS_DIR)) fs.mkdirSync(DOCS_DIR, { recursive: true });

const SCREENS = [
  {
    name: "phase3_01_citizen_hazard_dashboard_with_map",
    url: "http://localhost:3000/mumbai/dashboard",
    width: 1366,
    height: 900,
    delay: 4000,
    desc: "1. Citizen Hazard Dashboard with Interactive GIS Map and Municipal Boundaries",
  },
  {
    name: "phase3_02_citizen_selected_location_ward_details",
    url: "http://localhost:3000/mumbai/dashboard#my-area",
    width: 1366,
    height: 900,
    delay: 4000,
    desc: "2. Resolved Citizen Location and Ward Details with Demographic Screening Buffer",
  },
  {
    name: "phase3_03_hazard_information_and_source_context",
    url: "http://localhost:3000/mumbai/dashboard",
    width: 1366,
    height: 1200,
    delay: 4000,
    desc: "3. Grounded Impact Intelligence: The 6 Core Geospatial Impact Questions",
  },
  {
    name: "phase3_04_citizen_civic_reports_page",
    url: "http://localhost:3000/mumbai/report",
    width: 1366,
    height: 900,
    delay: 3500,
    desc: "4. Dedicated Citizen Civic Reporting Destination (Separate from Hazard Dashboard)",
  },
  {
    name: "phase3_05_sentinel_ai_rendered_markdown",
    url: "http://localhost:3000/mumbai/sentinel",
    width: 1366,
    height: 900,
    delay: 4000,
    desc: "5. Sentinel Safety AI with Correctly Rendered Markdown, Lists, and Muster Points",
  },
  {
    name: "phase3_06_contextual_report_form_and_status",
    url: "http://localhost:3000/mumbai/report?category=drainage_waterlogging&ward=F/North&location=Ward%20F/North%20(Matunga%20/%20Sion)&summary=Waterlogging%20and%20drainage%20obstruction%20observed%20in%20Ward%20F/North.",
    width: 1366,
    height: 950,
    delay: 3500,
    desc: "6. Contextual Report Form Prefilled from Map/Impact Card with Human Review",
  },
  {
    name: "phase3_07_telemetry_lab_active_tab_styling",
    url: "http://localhost:3000/admin/mumbai/telemetry-lab?tab=parameters",
    width: 1366,
    height: 900,
    delay: 4000,
    desc: "7. Telemetry Lab Sticky Active Tab Navigation Rail with Spatial Lab Link",
  },
  {
    name: "phase3_08_populated_parameter_chart",
    url: "http://localhost:3000/admin/mumbai/telemetry-lab?tab=weather",
    width: 1366,
    height: 950,
    delay: 4000,
    desc: "8. Populated Environmental Parameter Chart with Historical/Forecast Validation",
  },
  {
    name: "phase3_09_chart_valid_no_data_state",
    url: "http://localhost:3000/admin/mumbai/telemetry-lab?tab=rainfall",
    width: 1366,
    height: 900,
    delay: 4000,
    desc: "9. Valid Zero-Observation Confirmation vs Data Unavailable State",
  },
  {
    name: "phase3_10_admin_map_to_impact_incident_workflow",
    url: "http://localhost:3000/admin/mumbai/simulation",
    width: 1366,
    height: 900,
    delay: 4000,
    desc: "10. Admin Connected Workspaces: Simulation Map, Ward Impact Rankings, and Cross-Links",
  },
];

console.log("=======================================================");
console.log("  CAPTURING 10 PHASE 3 INTEGRATION SCREENSHOTS VIA EDGE");
console.log("=======================================================\n");

for (let i = 0; i < SCREENS.length; i++) {
  const s = SCREENS[i];
  const outPath = path.join(OUT_DIR, `${s.name}.png`);
  const docsPath = path.join(DOCS_DIR, `${s.name}.png`);

  console.log(`[${i + 1}/${SCREENS.length}] Capturing: ${s.name}`);
  console.log(`     URL: ${s.url}`);
  console.log(`     Viewport: ${s.width}x${s.height}`);

  const useBudget = s.url.includes("/dashboard") ? "--virtual-time-budget=2000" : "";
  const cmd = `"${EDGE_PATH}" --headless=new --disable-gpu --no-sandbox --window-size=${s.width},${s.height} --screenshot="${outPath}" ${useBudget} "${s.url}"`;

  try {
    execSync(cmd, { stdio: "ignore", timeout: 30000 });
    if (fs.existsSync(outPath)) {
      fs.copyFileSync(outPath, docsPath);
      const sz = (fs.statSync(outPath).size / 1024).toFixed(1);
      console.log(`     ✓ Saved: ${sz} KB -> ${outPath}`);
    } else {
      console.error(`     ✗ Failed to produce file: ${outPath}`);
    }
  } catch (err) {
    console.error(`     ✗ Error during capture:`, err.message);
  }
}

console.log("\n=======================================================");
console.log("  PHASE 3 SCREENSHOT CAPTURE COMPLETE");
console.log("=======================================================\n");
