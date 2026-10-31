import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const docRefs = JSON.parse(fs.readFileSync(path.join(rootDir, 'scripts/doc-references.json'), 'utf8'));
const allImages = JSON.parse(fs.readFileSync(path.join(rootDir, 'scripts/all-images-audit.json'), 'utf8'));

// Build lookup maps
const relPathSet = new Set(allImages.map(a => a.relPath));
const fileNameMap = new Map();
allImages.forEach(a => {
  if (!fileNameMap.has(a.name)) fileNameMap.set(a.name, []);
  fileNameMap.get(a.name).push(a.relPath);
});

console.log('--- Verifying all Markdown image references against repository images ---');
let totalChecked = 0;
let exactMatches = 0;
let filenameMatches = 0;
let trulyMissing = [];

for (const [doc, list] of Object.entries(docRefs)) {
  for (const ref of list) {
    totalChecked++;
    
    // Normalize ref
    let clean = ref.replace(/\\/g, '/');
    if (clean.startsWith('file:///')) clean = clean.replace('file:///', '');
    if (clean.startsWith('e:/urbanhazards/urban_link-master/')) clean = clean.replace('e:/urbanhazards/urban_link-master/', '');
    if (clean.startsWith('/urbanhazards/urban_link-master/')) clean = clean.replace('/urbanhazards/urban_link-master/', '');
    if (clean.startsWith('/')) clean = clean.slice(1);

    if (relPathSet.has(clean)) {
      exactMatches++;
    } else {
      const base = path.basename(clean);
      if (fileNameMap.has(base)) {
        filenameMatches++;
      } else {
        trulyMissing.push({ doc, ref, clean });
      }
    }
  }
}

console.log(`Checked ${totalChecked} references.`);
console.log(`Exact path matches: ${exactMatches}`);
console.log(`Base filename matches: ${filenameMatches}`);
console.log(`Truly missing / non-existent images: ${trulyMissing.length}`);

if (trulyMissing.length > 0) {
  console.log('Missing items:');
  trulyMissing.slice(0, 15).forEach(m => console.log(`  in ${m.doc}: ${m.ref}`));
}
