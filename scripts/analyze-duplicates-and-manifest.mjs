import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const rootDir = process.cwd();

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileHash(filePath) {
  try {
    const buffer = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(buffer).digest('hex');
  } catch (e) {
    return null;
  }
}

// Read reference map
const refMap = JSON.parse(fs.readFileSync(path.join(rootDir, 'scripts/image-references.json'), 'utf8'));

// Discover all image files
const imageExtensions = new Set(['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif']);
const allImages = [];

function findImages(dir) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.next') continue;
        findImages(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (imageExtensions.has(ext)) {
          const stat = fs.statSync(fullPath);
          const relPath = path.relative(rootDir, fullPath).replace(/\\/g, '/');
          const hash = getFileHash(fullPath);
          allImages.push({
            fullPath,
            relPath,
            name: entry.name,
            ext,
            size: stat.size,
            mtime: stat.mtime,
            hash
          });
        }
      }
    }
  } catch (e) {}
}

findImages(rootDir);

console.log(`Analyzing ${allImages.length} images...`);

// Group by hash to find exact duplicates
const hashGroups = new Map();
for (const img of allImages) {
  if (!hashGroups.has(img.hash)) {
    hashGroups.set(img.hash, []);
  }
  hashGroups.get(img.hash).push(img);
}

let exactDuplicateFilesCount = 0;
let exactDuplicateWastedBytes = 0;

console.log('\n--- Exact Binary Duplicates ---');
const duplicateClusters = [];
for (const [hash, group] of hashGroups.entries()) {
  if (group.length > 1) {
    exactDuplicateFilesCount += (group.length - 1);
    exactDuplicateWastedBytes += group[0].size * (group.length - 1);
    duplicateClusters.push(group);
  }
}

console.log(`Found ${duplicateClusters.length} duplicate clusters with ${exactDuplicateFilesCount} duplicate files.`);
console.log(`Total storage wasted by exact binary duplicates: ${formatBytes(exactDuplicateWastedBytes)}`);

// Display some top duplicate clusters
duplicateClusters.sort((a, b) => (b[0].size * (b.length - 1)) - (a[0].size * (a.length - 1)));
console.log('\nTop 10 Duplicate Clusters:');
duplicateClusters.slice(0, 10).forEach((group, idx) => {
  console.log(`\nCluster #${idx + 1} (${group.length} copies, each ${formatBytes(group[0].size)}, total wasted ${formatBytes(group[0].size * (group.length - 1))}):`);
  group.forEach(g => {
    const refs = refMap[g.relPath] || refMap[g.name] || [];
    console.log(`  - ${g.relPath} (refs: ${refs.length})`);
  });
});

// Save detailed cluster report
fs.writeFileSync(path.join(rootDir, 'scripts/duplicate-clusters.json'), JSON.stringify(duplicateClusters, null, 2));
