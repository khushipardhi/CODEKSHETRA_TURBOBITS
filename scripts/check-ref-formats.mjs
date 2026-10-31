import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const docRefs = JSON.parse(fs.readFileSync(path.join(rootDir, 'scripts/doc-references.json'), 'utf8'));

const allPaths = new Set();
const pathPrefixes = {};

for (const [doc, list] of Object.entries(docRefs)) {
  for (const p of list) {
    allPaths.add(p);
    const prefix = p.split('/')[0];
    pathPrefixes[prefix] = (pathPrefixes[prefix] || 0) + 1;
  }
}

console.log('--- Referenced Path Prefixes in Markdown ---');
console.log(pathPrefixes);

console.log('\n--- Sample of referenced paths ---');
Array.from(allPaths).slice(0, 30).forEach(p => console.log(' ', p));
