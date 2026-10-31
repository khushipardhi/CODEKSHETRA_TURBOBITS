import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const allImages = JSON.parse(fs.readFileSync(path.join(rootDir, 'scripts/all-images-audit.json'), 'utf8'));
const docRefs = JSON.parse(fs.readFileSync(path.join(rootDir, 'scripts/doc-references.json'), 'utf8'));

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Group images by directory
const dirs = {};
for (const img of allImages) {
  if (!dirs[img.dir]) {
    dirs[img.dir] = {
      dir: img.dir,
      count: 0,
      size: 0,
      files: [],
      exactRefsTotal: 0,
      nameRefsTotal: 0,
      dupesTotal: 0,
      referencingDocs: new Set()
    };
  }
  const d = dirs[img.dir];
  d.count++;
  d.size += img.size;
  d.files.push(img);
  d.exactRefsTotal += img.exactRefs.length;
  d.nameRefsTotal += img.nameRefs.length;
  if (img.isDuplicate) d.dupesTotal++;
  img.exactRefs.forEach(r => d.referencingDocs.add(r));
  img.nameRefs.forEach(r => d.referencingDocs.add(r));
}

const dirArray = Object.values(dirs).sort((a, b) => b.size - a.size);

console.log('=== Complete Directory Audit ===\n');
for (const d of dirArray) {
  console.log(`Directory: ${d.dir}`);
  console.log(`  Files: ${d.count} | Size: ${formatBytes(d.size)} | Dupes: ${d.dupesTotal}`);
  console.log(`  Exact path refs: ${d.exactRefsTotal} | Name refs: ${d.nameRefsTotal}`);
  console.log(`  Referencing documents (${d.referencingDocs.size}):`);
  Array.from(d.referencingDocs).slice(0, 5).forEach(doc => console.log(`    - ${doc}`));
  if (d.referencingDocs.size > 5) console.log(`    ... and ${d.referencingDocs.size - 5} more`);
  console.log('');
}
