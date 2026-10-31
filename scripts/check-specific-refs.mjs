import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const docRefs = JSON.parse(fs.readFileSync(path.join(rootDir, 'scripts/doc-references.json'), 'utf8'));

const targets = ['docs/screenshots', 'Nagpur Connect', 'WhatsApp', 'favicon.jpeg', 'test_sim_out.pdf'];

for (const t of targets) {
  const matches = [];
  for (const [doc, list] of Object.entries(docRefs)) {
    for (const r of list) {
      if (r.includes(t)) matches.push({ doc, r });
    }
  }
  console.log(`Target: "${t}" found ${matches.length} references:`);
  matches.forEach(m => console.log(`  in ${m.doc}: ${m.r}`));
}
