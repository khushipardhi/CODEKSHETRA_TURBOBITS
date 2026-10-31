import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const docRefs = JSON.parse(fs.readFileSync(path.join(rootDir, 'scripts/doc-references.json'), 'utf8'));

// Check how top-level folders are referenced
const topFolderRefs = {
  phase1_screenshots: [],
  phase2_screenshots: [],
  phase3_screenshots: [],
  phase4_screenshots: [],
  phase5_screenshots: [],
  phase6_screenshots: [],
  phase12_screenshots: [],
  gis_repair_screenshots: []
};

for (const [doc, list] of Object.entries(docRefs)) {
  for (const ref of list) {
    for (const tf of Object.keys(topFolderRefs)) {
      if (ref.includes(tf)) {
        topFolderRefs[tf].push({ doc, ref });
      }
    }
  }
}

console.log('--- Top-level screenshot folder references in Markdown ---');
for (const [tf, list] of Object.entries(topFolderRefs)) {
  console.log(`${tf}: referenced in ${list.length} places`);
  if (list.length > 0) {
    list.slice(0, 5).forEach(item => console.log(`   in ${item.doc}: ${item.ref}`));
  }
}
