import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const allImages = JSON.parse(fs.readFileSync(path.join(rootDir, 'scripts/all-images-audit.json'), 'utf8'));

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

const manifest = [];

// Decision rules
for (const img of allImages) {
  let action = 'KEEP';
  let category = 'ESSENTIAL_EVIDENCE';
  let reason = 'Active audit evidence or required application asset';

  // Rule 1: Root loose duplicate images
  if (img.relPath === 'favicon.jpeg' || img.relPath === 'WhatsApp Image 2026-10-03 at 17.04.21.jpeg') {
    action = 'DELETE';
    category = 'DUPLICATE_ASSET';
    reason = 'Exact binary duplicate of public/favicon.png located in repository root';
  } else if (img.relPath === 'Nagpur Connect_ Full Operational Flow Data - visual selection.png') {
    action = 'DELETE';
    category = 'UNREFERENCED_TEMP_CAPTURE';
    reason = 'Unreferenced loose screenshot in root, not referenced by any markdown or test';
  }
  // Rule 2: Top-level redundant screenshot folders
  else if (img.relPath.startsWith('phase1_screenshots/') ||
           img.relPath.startsWith('phase2_screenshots/') ||
           img.relPath.startsWith('phase3_screenshots/') ||
           img.relPath.startsWith('phase4_screenshots/') ||
           img.relPath.startsWith('phase5_screenshots/') ||
           img.relPath.startsWith('phase6_screenshots/') ||
           img.relPath.startsWith('phase12_screenshots/') ||
           img.relPath.startsWith('gis_repair_screenshots/')) {
    action = 'DELETE';
    category = 'DUPLICATE_EXTERNAL_FOLDER';
    reason = 'Exact duplicate of canonical screenshots housed under public/screenshots/';
  }
  // Rule 3: public/screenshots/phase2_loop
  else if (img.relPath.startsWith('public/screenshots/phase2_loop/')) {
    action = 'DELETE';
    category = 'UNREFERENCED_DEBUG_LOOP';
    reason = 'Unreferenced 1.2MB intermediate playback captures from early test loop; canonical simulation is preserved in phase2_sim and phase1_sim_reliability';
  }
  // Rule 4: public/screenshots/prompt9_audit
  else if (img.relPath.startsWith('public/screenshots/prompt9_audit/')) {
    action = 'DELETE';
    category = 'REDUNDANT_TEST_RUN';
    reason = 'Redundant duplicate run of prompt9; docs/PROMPT9_UX_PERFORMANCE_ACCESSIBILITY.md strictly references public/screenshots/prompt9/';
  }
  // Rule 5: public/screenshots/phase5
  else if (img.relPath.startsWith('public/screenshots/phase5/')) {
    action = 'DELETE';
    category = 'DUPLICATE_FOLDER';
    reason = 'Exact binary duplicate of public/screenshots/phase5_final_audit/ which is the canonical audit folder';
  }
  // Rule 6: public/screenshots/phase1_brand_and_design/initial
  else if (img.relPath.startsWith('public/screenshots/phase1_brand_and_design/initial/')) {
    action = 'CONSOLIDATE';
    category = 'INTERMEDIATE_UI_STATE';
    reason = 'Intermediate UI captures superseded by public/screenshots/phase1_brand_and_design/after/ and phase1_baseline/';
  }
  // Rule 7: Core App assets
  else if (img.isAppAsset) {
    action = 'KEEP';
    category = 'APPLICATION_ASSET';
    reason = 'Live application brand icon or favicon asset';
  }
  // Rule 8: Homepage redesign
  else if (img.relPath.startsWith('public/screenshots/homepage_redesign/')) {
    action = 'KEEP';
    category = 'HOMEPAGE_REDESIGN_EVIDENCE';
    reason = 'Freshly captured and inspected evidence for docs/SENTINEL_HOMEPAGE_REDESIGN.md';
  }
  // Rule 9: Prompt audit evidence (prompt1 - prompt9)
  else if (img.relPath.match(/^public\/screenshots\/prompt[1-9]\//)) {
    action = 'KEEP';
    category = 'PROMPT_AUDIT_EVIDENCE';
    reason = 'Referenced by independent audit documents docs/PROMPT1_... through PROMPT9_...';
  }
  // Rule 10: Phase audit evidence
  else if (img.relPath.startsWith('public/screenshots/phase')) {
    action = 'KEEP';
    category = 'PHASE_AUDIT_EVIDENCE';
    reason = 'Active verification evidence for phase reports and final master audit';
  }
  // Rule 11: docs/screenshots
  else if (img.relPath.startsWith('docs/screenshots/')) {
    action = 'KEEP';
    category = 'DOCS_EMBEDDED_EVIDENCE';
    reason = 'Referenced in phase report docs/PHASE3_CITIZEN_TELEMETRY_INTEGRATION_REPORT.md';
  }
  // Rule 12: GIS repair
  else if (img.relPath.startsWith('public/screenshots/gis_repair/')) {
    action = 'KEEP';
    category = 'GIS_REPAIR_EVIDENCE';
    reason = 'Canonical GIS repair evidence referenced in docs/PHASE1_MUMBAI_GIS_REPAIR_REPORT.md';
  }

  manifest.push({
    path: img.relPath,
    name: img.name,
    size: img.size,
    formattedSize: formatBytes(img.size),
    category,
    action,
    reason,
    exactRefs: img.exactRefs,
    nameRefs: img.nameRefs,
    isDuplicate: img.isDuplicate,
    duplicateCopies: img.duplicateCopies
  });
}

// Write machine-readable manifest
fs.writeFileSync(path.join(rootDir, 'reports/storage-cleanup-manifest.json'), JSON.stringify(manifest, null, 2));
console.log(`Generated reports/storage-cleanup-manifest.json with ${manifest.length} items.`);

// Summary counts
const summary = {
  totalFiles: manifest.length,
  totalBytes: manifest.reduce((s, m) => s + m.size, 0),
  byAction: {}
};

for (const m of manifest) {
  if (!summary.byAction[m.action]) {
    summary.byAction[m.action] = { count: 0, bytes: 0 };
  }
  summary.byAction[m.action].count++;
  summary.byAction[m.action].bytes += m.size;
}

console.log('\n--- Manifest Summary by Action ---');
for (const [action, data] of Object.entries(summary.byAction)) {
  console.log(`${action.padEnd(15)} | ${formatBytes(data.bytes).padStart(10)} | ${data.count} files`);
}
