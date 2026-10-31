import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();

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
  const dirPath = path.join(rootDir, tf);
  if (fs.existsSync(dirPath)) {
    const files = fs.readdirSync(dirPath);
    console.log(`\nFolder: ${tf} (${files.length} files)`);
    // Find matching files in public/screenshots
    let matchingInPublic = 0;
    for (const f of files) {
      // search in public/screenshots recursively
      const publicMatches = [];
      function searchPublic(p) {
        const entries = fs.readdirSync(p, { withFileTypes: true });
        for (const e of entries) {
          const fp = path.join(p, e.name);
          if (e.isDirectory()) searchPublic(fp);
          else if (e.name === f) publicMatches.push(path.relative(rootDir, fp).replace(/\\/g, '/'));
        }
      }
      searchPublic(path.join(rootDir, 'public/screenshots'));
      if (publicMatches.length > 0) {
        matchingInPublic++;
      }
    }
    console.log(`  Matching files found in public/screenshots: ${matchingInPublic} / ${files.length}`);
  }
}
