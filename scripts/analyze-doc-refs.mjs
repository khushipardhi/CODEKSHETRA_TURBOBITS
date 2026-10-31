import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();

// Find all .md files in docs/ and root
function getMdFiles(dir) {
  let list = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.git' && entry.name !== '.next') {
        list = list.concat(getMdFiles(full));
      }
    } else if (entry.name.endsWith('.md')) {
      list.push(full);
    }
  }
  return list;
}

const mdFiles = getMdFiles(rootDir);
console.log(`Found ${mdFiles.length} Markdown files.`);

const docReferences = {}; // docRelPath -> list of image paths

for (const doc of mdFiles) {
  const relDoc = path.relative(rootDir, doc).replace(/\\/g, '/');
  const content = fs.readFileSync(doc, 'utf8');
  
  // match markdown images: ![alt](path) or <img src="path"> or direct mentions
  const imgMatches = content.match(/!\[.*?\]\((.*?)\)|src=["'](.*?\.(?:png|jpg|jpeg|webp|svg))["']|([A-Za-z0-9_\-\.\/]+\.(?:png|jpg|jpeg|webp))/gi);
  if (imgMatches) {
    const refs = new Set();
    for (const m of imgMatches) {
      // extract just the path or file name
      let clean = m.replace(/^!\[.*?\]\(/, '').replace(/\)$/, '').replace(/^src=["']/, '').replace(/["']$/, '').trim();
      // clean query params or anchors
      clean = clean.split('?')[0].split('#')[0];
      if (clean && !clean.startsWith('http')) {
        refs.add(clean);
      }
    }
    if (refs.size > 0) {
      docReferences[relDoc] = Array.from(refs);
    }
  }
}

console.log('\n--- Markdown Documents Referencing Screenshots ---');
for (const [doc, refs] of Object.entries(docReferences)) {
  console.log(`${doc} references ${refs.length} images`);
}

fs.writeFileSync(path.join(rootDir, 'scripts/doc-references.json'), JSON.stringify(docReferences, null, 2));
