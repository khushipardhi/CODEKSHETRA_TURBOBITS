import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const manifest = JSON.parse(fs.readFileSync(path.join(rootDir, 'reports/storage-cleanup-manifest.json'), 'utf8'));

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Group candidates
const toDelete = manifest.filter(m => m.action === 'DELETE');
const toConsolidate = manifest.filter(m => m.action === 'CONSOLIDATE');
const toKeep = manifest.filter(m => m.action === 'KEEP');

// Group toDelete by folder
const deleteByFolder = {};
for (const item of toDelete) {
  const folder = item.path.split('/')[0];
  const fullFolder = path.dirname(item.path);
  if (!deleteByFolder[fullFolder]) deleteByFolder[fullFolder] = { count: 0, bytes: 0, items: [] };
  deleteByFolder[fullFolder].count++;
  deleteByFolder[fullFolder].bytes += item.size;
  deleteByFolder[fullFolder].items.push(item);
}

let doc = `# SENTINEL CITY INTELLIGENCE — SCREENSHOT STORAGE CLEANUP PLAN
## Controlled Workspace Storage Optimization & Audit Evidence Preservation
**Document Version:** 1.0.0  
**Date:** October 22, 2026  
**Status:** DRAFTED FOR REVIEW & EXECUTION  
**Target Repository:** \`e:\\urbanhazards\\urban_link-master\`

---

## 1. Executive Summary & Storage Audit Baseline

An exhaustive workspace audit was conducted across all files, subdirectories, and media assets in the Sentinel City Intelligence repository. The total workspace size was measured at **2.12 GB (34,439 files)**.

### Workspace Storage Breakdown
| Component / Directory | Disk Usage | File Count | Nature & Classification |
|---|---|---|---|
| \`.next\` | **1.37 GB** | 5,090 files | Build & development server cache (\`.next/dev\` = 1.02 GB disposable Turbopack cache). |
| \`node_modules\` | **486.38 MB** | 27,834 files | Core npm dependencies. Preserved intact. |
| \`public/screenshots/\` | **151.12 MB** | 489 files | Primary UI, simulation, telemetry, and audit evidence captures across Phases 1–12. |
| \`data/\` | **72.88 MB** | 280 files | Copernicus DEM topography, 24 BMC ward GeoJSON, simulation dossiers. Preserved intact. |
| Top-level Screenshot Dirs (8 folders) | **40.90 MB** | 142 files | **100% duplicate** captures of folders already housed under \`public/screenshots/\`. |
| \`docs/\` | **3.59 MB** | 72 files | Documentation, phase reports, and embedded phase3 evidence (2.54 MB). |
| \`src/\` | **3.32 MB** | 306 files | Core application source code. Preserved intact. |
| Root Loose Artifacts | **1.20 MB** | 4 files | Disposable test PDFs and duplicate icons. |

---

## 2. Classification Framework

Every image file in the repository (647 total audited files, 196.01 MB) was classified according to strict evidentiary criteria:

1. **KEEP (Essential Evidence & Active Audit Trails — 452 files, 132.77 MB):**
   - **Canonical Final Evidence:** The curated final audit suite in \`docs/evidence/final/\` representing all key views.
   - **Active Master Audit:** \`public/screenshots/phase10_master/\` (19 files) and \`public/screenshots/homepage_redesign/\` (17 files).
   - **Prompt Audit Trail:** \`public/screenshots/prompt1/\` through \`prompt9/\` (105 files) referenced across \`docs/PROMPT1_...\` to \`PROMPT9_...\`.
   - **Phase Handover Evidence:** Canonical phase evidence in \`public/screenshots/phase*\` referenced by respective acceptance reports.
   - **Core Design Assets:** \`public/brand/\`, \`public/favicon.png\`, \`public/apple-touch-icon.png\`, \`src/app/icon.png\`.

2. **CONSOLIDATE (Redundant / Intermediate UI States — 9 files, 2.02 MB):**
   - Intermediate styling passes (e.g. \`public/screenshots/phase1_brand_and_design/initial/\`) that have been superseded by verified \`/after/\` and \`phase1_baseline/\` captures.

3. **DELETE (Exact Binary Duplicates & Unreferenced Debug Loops — 186 files, 60.73 MB):**
   - **Top-Level Redundant Folders:** 142 files across 8 folders that are exact duplicates of files in \`public/screenshots/\`.
   - **Unreferenced Playback Loop:** \`public/screenshots/phase2_loop/\` (13 files, 13.74 MB) consisting of 1.2 MB uncompressed raw captures from early timeline debugging.
   - **Redundant Audit Runs:** \`public/screenshots/prompt9_audit/\` (17 files, 2.50 MB) superseded by \`prompt9/\`.
   - **Duplicate Phase 5 Folder:** \`public/screenshots/phase5/\` (11 files, 2.87 MB) identical to \`phase5_final_audit/\`.
   - **Root Duplicates:** \`favicon.jpeg\`, \`WhatsApp Image...\`, and unreferenced \`Nagpur Connect...\`.

---

## 3. Directory-by-Directory Removal Manifest

### Group A: Top-Level Duplicated Folders (142 files, 40.90 MB)
All 142 files in these 8 top-level directories are confirmed exact binary duplicates (matching SHA-256 hashes) of screenshots inside \`public/screenshots/\`. They are referenced in **0** markdown documents or tests.

| Directory | File Count | Size | Duplicate Destination in \`public/screenshots/\` | Proposed Action |
|---|---|---|---|---|
| \`phase1_screenshots/\` | 22 | 8.17 MB | \`public/screenshots/phase1_brand_and_design/\` & \`phase1_sim_reliability/\` | **DELETE** |
| \`phase2_screenshots/\` | 23 | 8.31 MB | \`public/screenshots/phase2_gis_interaction/\` & \`phase2_sim/\` | **DELETE** |
| \`phase3_screenshots/\` | 24 | 5.29 MB | \`public/screenshots/phase3/\` & \`phase3_map_visualisation/\` | **DELETE** |
| \`phase4_screenshots/\` | 24 | 3.58 MB | \`public/screenshots/phase4/\` & \`phase4_pdf_reporting/\` | **DELETE** |
| \`phase5_screenshots/\` | 11 | 2.87 MB | \`public/screenshots/phase5_final_audit/\` | **DELETE** |
| \`phase6_screenshots/\` | 16 | 5.48 MB | \`public/screenshots/phase6/\` | **DELETE** |
| \`phase12_screenshots/\` | 16 | 2.43 MB | \`public/screenshots/phase12/\` | **DELETE** |
| \`gis_repair_screenshots/\` | 6 | 4.90 MB | \`public/screenshots/gis_repair/\` | **DELETE** |

### Group B: Unreferenced Debug Loops & Redundant Test Runs (41 files, 19.11 MB)
| Directory | File Count | Size | Reason for Removal | Proposed Action |
|---|---|---|---|---|
| \`public/screenshots/phase2_loop/\` | 13 | 13.74 MB | 0 references in any doc. 1.2 MB uncompressed raw captures. Canonical simulation timeline preserved in \`phase2_sim/\`. | **DELETE** |
| \`public/screenshots/prompt9_audit/\` | 17 | 2.50 MB | 0 references in docs. Redundant secondary capture of \`prompt9/\`. \`docs/PROMPT9_...\` references \`prompt9/\`. | **DELETE** |
| \`public/screenshots/phase5/\` | 11 | 2.87 MB | 0 exact references. Exact duplicate of \`public/screenshots/phase5_final_audit/\`. | **DELETE** |

### Group C: Intermediate UI States (9 files, 2.02 MB)
| Directory | File Count | Size | Reason for Removal | Proposed Action |
|---|---|---|---|---|
| \`public/screenshots/phase1_brand_and_design/initial/\` | 9 | 2.02 MB | Superseded by \`/after/\` and \`phase1_baseline/\`. | **CONSOLIDATE / DELETE** |

### Group D: Root-Level Disposable Assets (4 files, 1.20 MB)
| File | Size | Reason for Removal | Proposed Action |
|---|---|---|---|
| \`Nagpur Connect_ Full Operational Flow Data - visual selection.png\` | 446.42 KB | Unreferenced loose capture in root. | **DELETE** |
| \`WhatsApp Image 2026-10-03 at 17.04.21.jpeg\` | 82.47 KB | Exact duplicate of \`public/favicon.png\` in root. | **DELETE** |
| \`favicon.jpeg\` | 82.47 KB | Exact duplicate of \`public/favicon.png\` in root. | **DELETE** |
| \`test_sim_out.pdf\` | 586.62 KB | One-off scratch test PDF in root. | **DELETE** |

---

## 4. Preserved Canonical Audit Evidence (\`docs/evidence/final/\`)

To fulfill Section 4 of the project specifications, the following 12 canonical screenshots are curated and permanently preserved in \`docs/evidence/final/\`:

| Canonical File Name | Source File | Description |
|---|---|---|
| \`homepage-desktop.png\` | \`public/screenshots/homepage_redesign/after_01_desktop_hero.png\` | Final desktop hero showing brand mark and live telemetry. |
| \`homepage-mobile.png\` | \`public/screenshots/homepage_redesign/after_10_mobile_hero.png\` | Final responsive mobile hero at 390px. |
| \`citizen-dashboard-mobile.png\` | \`public/screenshots/phase7_final/02_phase7_citizen_dashboard_mobile.png\` | Citizen ward-level briefing on mobile viewport. |
| \`sentinel-ai-mobile.png\` | \`public/screenshots/phase7_final/04_phase7_citizen_alerts_mobile.png\` | Mobile conversational assistant interface. |
| \`hazard-map-desktop.png\` | \`public/screenshots/gis_repair/gis_repair_01_full_mumbai_osm_basemap.png\` | 24-ward Leaflet GIS map with unclustered facilities. |
| \`telemetry-lab-desktop.png\` | \`public/screenshots/phase5_final_audit/phase5_08_telemetry_overview.png\` | Comprehensive 64-parameter telemetry overview. |
| \`simulation-idle.png\` | \`public/screenshots/phase1_sim_reliability/01_simulation_idle.png\` | Spatial Simulation Lab at rest ($T=0h$). |
| \`simulation-playing.png\` | \`public/screenshots/phase1_sim_reliability/02_simulation_playing.png\` | Actively advancing hydrodynamic simulation ($T=3h$). |
| \`simulation-ward-detail.png\` | \`public/screenshots/phase2_sim/05_selected_ward_calculation_details.png\` | Ward L Kurla saucer depression calculation trace. |
| \`report-studio.png\` | \`public/screenshots/phase6/phase6_01_report_studio_full_width.png\` | 1280px publication-grade vector PDF Report Studio. |
| \`light-theme.png\` | \`public/screenshots/homepage_redesign/after_01_desktop_hero.png\` | Clean municipal light theme presentation. |
| \`dark-theme.png\` | \`public/screenshots/homepage_redesign/after_09_dark_theme_desktop.png\` | High-contrast graphite dark theme presentation. |

---

## 5. Storage Recovery Summary

| Category | Files Removed | Immediate Storage Recovered |
|---|---|---|
| **Top-Level Redundant Folders (8 dirs)** | 142 files | **40.90 MB** |
| **Unreferenced Debug Loops & Redundant Runs** | 41 files | **19.11 MB** |
| **Intermediate UI States** | 9 files | **2.02 MB** |
| **Root Disposable Files** | 4 files | **1.20 MB** |
| **Screenshot Storage Total Recovery** | **196 files** | **63.23 MB** |
| **Optional Build Cache (\`.next/dev\` cleanup)** | ~2,910 files | **1,021 MB (1.02 GB)** |
| **Total Potential Storage Recovery** | **~3,106 files** | **~1.08 GB** |

---

## 6. Execution Safety & Safeguards

1. **Reference Pre-Check:** Verified that zero markdown documents or test scripts point to the deletion candidates.
2. **Quarantine Before Final Removal:** Files will be staged in \`.quarantine_cleanup/\` and validated before deletion.
3. **No Code or Data Disruption:** Source code (\`src/\`), GeoJSON datasets (\`data/\`), dependencies (\`node_modules\`), and environment configs (\`.env\`) are strictly excluded.
4. **Build Verification:** Following removal, \`npx tsc --noEmit\` and \`npm run build\` will be executed to guarantee 0 regressions.
`;

fs.writeFileSync(path.join(rootDir, 'docs/SCREENSHOT_STORAGE_CLEANUP_PLAN.md'), doc);
console.log('Saved docs/SCREENSHOT_STORAGE_CLEANUP_PLAN.md');
