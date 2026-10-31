import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getDirSize(dir) {
  let size = 0;
  let fileCount = 0;
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const sub = getDirSize(fullPath);
        size += sub.size;
        fileCount += sub.fileCount;
      } else if (entry.isFile()) {
        const stat = fs.statSync(fullPath);
        size += stat.size;
        fileCount++;
      }
    }
  } catch (err) {}
  return { size, fileCount };
}

// Inspect .next subdirectories
const nextDir = path.join(rootDir, '.next');
if (fs.existsSync(nextDir)) {
  console.log('--- .next Subdirectory Breakdown ---');
  const items = fs.readdirSync(nextDir, { withFileTypes: true });
  for (const item of items) {
    const p = path.join(nextDir, item.name);
    if (item.isDirectory()) {
      const { size, fileCount } = getDirSize(p);
      console.log(`${item.name.padEnd(25)} | ${formatBytes(size).padStart(10)} | ${fileCount.toString().padStart(5)} files`);
    } else {
      const stat = fs.statSync(p);
      console.log(`${item.name.padEnd(25)} | ${formatBytes(stat.size).padStart(10)} | 1 file`);
    }
  }
}

// Also check references to screenshots across docs, markdown, ts, js, json
console.log('\n--- Scanning for References to Screenshots in Markdown and Source Files ---');
const textExtensions = new Set(['.md', '.ts', '.tsx', '.js', '.mjs', '.json', '.html', '.css']);
const referencedImages = new Map(); // filename or path -> Set of referencing files

function searchReferences(dir) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.next') continue;
        searchReferences(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (textExtensions.has(ext)) {
          try {
            const content = fs.readFileSync(fullPath, 'utf8');
            const relPath = path.relative(rootDir, fullPath).replace(/\\/g, '/');
            // Look for image extensions or screenshot paths in content
            const matches = content.match(/[A-Za-z0-9_\-\/\.\\]+\.(png|jpg|jpeg|webp|svg)/gi);
            if (matches) {
              for (const match of matches) {
                const norm = match.replace(/\\/g, '/');
                const base = path.basename(norm);
                if (!referencedImages.has(base)) {
                  referencedImages.set(base, new Set());
                }
                referencedImages.get(base).add(relPath);

                if (!referencedImages.has(norm)) {
                  referencedImages.set(norm, new Set());
                }
                referencedImages.get(norm).add(relPath);
              }
            }
          } catch (e) {}
        }
      }
    }
  } catch (e) {}
}

searchReferences(rootDir);
console.log(`Total unique image references discovered: ${referencedImages.size}`);

// Write reference list to file for deeper analysis
const refSummary = {};
for (const [key, set] of referencedImages.entries()) {
  refSummary[key] = Array.from(set);
}
fs.writeFileSync(path.join(rootDir, 'scripts/image-references.json'), JSON.stringify(refSummary, null, 2));
console.log('Saved reference map to scripts/image-references.json');
