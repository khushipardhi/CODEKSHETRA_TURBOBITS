import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const docRefs = JSON.parse(fs.readFileSync(path.join(rootDir, 'scripts/doc-references.json'), 'utf8'));

console.log('--- Checking references to prompt folders in markdown ---');
for (let i = 1; i <= 9; i++) {
  const pName = `prompt${i}`;
  const matches = [];
  for (const [doc, list] of Object.entries(docRefs)) {
    for (const r of list) {
      if (r.includes(pName)) matches.push({ doc, r });
    }
  }
  console.log(`prompt${i}: ${matches.length} references`);
  if (matches.length > 0) {
    console.log(`  Sample: ${matches[0].doc} -> ${matches[0].r}`);
  }
}
const p9auditMatches = [];
for (const [doc, list] of Object.entries(docRefs)) {
  for (const r of list) {
    if (r.includes('prompt9_audit')) p9auditMatches.push({ doc, r });
  }
}
console.log(`prompt9_audit: ${p9auditMatches.length} references`);
