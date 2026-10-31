import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const quarantineDir = path.join(rootDir, '.quarantine_cleanup');

if (!fs.existsSync(quarantineDir)) {
  fs.mkdirSync(quarantineDir, { recursive: true });
}

const manifest = JSON.parse(fs.readFileSync(path.join(rootDir, 'reports/storage-cleanup-manifest.json'), 'utf8'));

// Filter candidates for quarantine (DELETE and CONSOLIDATE)
const candidates = manifest.filter(m => m.action === 'DELETE' || m.action === 'CONSOLIDATE');

// Also include test_sim_out.pdf if present
if (fs.existsSync(path.join(rootDir, 'test_sim_out.pdf'))) {
  candidates.push({
    path: 'test_sim_out.pdf',
    name: 'test_sim_out.pdf',
    size: fs.statSync(path.join(rootDir, 'test_sim_out.pdf')).size,
    category: 'TEST_OUTPUT',
    action: 'DELETE',
    reason: 'One-off test simulation PDF output in repository root'
  });
}

console.log(`Starting controlled quarantine of ${candidates.length} candidates...`);

let movedCount = 0;
let movedBytes = 0;
let skippedCount = 0;

for (const c of candidates) {
  const src = path.join(rootDir, c.path);
  const dest = path.join(quarantineDir, c.path);

  if (fs.existsSync(src)) {
    const destDir = path.dirname(dest);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    fs.renameSync(src, dest);
    movedCount++;
    movedBytes += c.size;
  } else {
    skippedCount++;
  }
}

// Clean empty directories in root
const topFolders = [
  'phase1_screenshots',
  'phase2_screenshots',
  'phase3_screenshots',
  'phase4_screenshots',
  'phase5_screenshots',
  'phase6_screenshots',
  'phase12_screenshots',
  'gis_repair_screenshots'
];

for (const tf of topFolders) {
  const p = path.join(rootDir, tf);
  if (fs.existsSync(p)) {
    try {
      if (fs.readdirSync(p).length === 0) {
        fs.rmdirSync(p);
      }
    } catch (e) {}
  }
}

// Clean empty folders in public/screenshots if empty
const pubFolders = [
  'public/screenshots/phase2_loop',
  'public/screenshots/prompt9_audit',
  'public/screenshots/phase5',
  'public/screenshots/phase1_brand_and_design/initial'
];

for (const pf of pubFolders) {
  const p = path.join(rootDir, pf);
  if (fs.existsSync(p)) {
    try {
      if (fs.readdirSync(p).length === 0) {
        fs.rmdirSync(p);
      }
    } catch (e) {}
  }
}

console.log(`\nQuarantine execution complete:`);
console.log(`  Moved files: ${movedCount}`);
console.log(`  Total size quarantined: ${(movedBytes / (1024 * 1024)).toFixed(2)} MB`);
console.log(`  Skipped (not found): ${skippedCount}`);
console.log(`  Quarantine directory: ${quarantineDir}`);
