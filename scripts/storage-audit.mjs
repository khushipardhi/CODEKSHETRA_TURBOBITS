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

console.log('Auditing storage in:', rootDir);

// 1. Audit top-level folders
const topItems = fs.readdirSync(rootDir, { withFileTypes: true });
const topLevelSizes = [];

function getDirSize(dir) {
  let size = 0;
  let fileCount = 0;
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      try {
        if (entry.isDirectory()) {
          const sub = getDirSize(fullPath);
          size += sub.size;
          fileCount += sub.fileCount;
        } else if (entry.isFile()) {
          const stat = fs.statSync(fullPath);
          size += stat.size;
          fileCount++;
        }
      } catch (err) {}
    }
  } catch (err) {}
  return { size, fileCount };
}

let totalWorkspaceSize = 0;
let totalWorkspaceFiles = 0;

for (const item of topItems) {
  const fullPath = path.join(rootDir, item.name);
  if (item.isDirectory()) {
    const { size, fileCount } = getDirSize(fullPath);
    topLevelSizes.push({ name: item.name, isDir: true, size, fileCount, formatted: formatBytes(size) });
    totalWorkspaceSize += size;
    totalWorkspaceFiles += fileCount;
  } else {
    try {
      const stat = fs.statSync(fullPath);
      topLevelSizes.push({ name: item.name, isDir: false, size: stat.size, fileCount: 1, formatted: formatBytes(stat.size) });
      totalWorkspaceSize += stat.size;
      totalWorkspaceFiles++;
    } catch (e) {}
  }
}

topLevelSizes.sort((a, b) => b.size - a.size);

console.log('\n--- Top Level Directories / Files ---');
topLevelSizes.slice(0, 20).forEach(item => {
  console.log(`${item.name.padEnd(35)} | ${item.formatted.padStart(10)} | ${item.fileCount.toString().padStart(6)} files`);
});
console.log(`\nTotal Workspace Size: ${formatBytes(totalWorkspaceSize)} (${totalWorkspaceFiles} files)`);

// 2. Discover all image files (.png, .jpg, .jpeg, .webp, .svg, .gif) across the repo
const imageExtensions = new Set(['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif']);
const allImages = [];

function findImages(dir) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === '.git') {
          continue; // skip searching node_modules & .git for screenshot candidates
        }
        findImages(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (imageExtensions.has(ext)) {
          try {
            const stat = fs.statSync(fullPath);
            const relPath = path.relative(rootDir, fullPath).replace(/\\/g, '/');
            allImages.push({
              fullPath,
              relPath,
              name: entry.name,
              ext,
              size: stat.size,
              mtime: stat.mtime
            });
          } catch (e) {}
        }
      }
    }
  } catch (e) {}
}

findImages(rootDir);

allImages.sort((a, b) => b.size - a.size);

let totalImageSize = allImages.reduce((sum, img) => sum + img.size, 0);

console.log(`\n--- Discovered Image Files (excluding node_modules & .git) ---`);
console.log(`Total Image Count: ${allImages.length}`);
console.log(`Total Image Size: ${formatBytes(totalImageSize)}`);

// Group images by directory
const imagesByDir = {};
for (const img of allImages) {
  const dir = path.dirname(img.relPath);
  if (!imagesByDir[dir]) {
    imagesByDir[dir] = { count: 0, size: 0, files: [] };
  }
  imagesByDir[dir].count++;
  imagesByDir[dir].size += img.size;
  imagesByDir[dir].files.push(img);
}

const dirList = Object.entries(imagesByDir).map(([dir, data]) => ({
  dir,
  count: data.count,
  size: data.size,
  formatted: formatBytes(data.size)
})).sort((a, b) => b.size - a.size);

console.log('\n--- Image Breakdown by Directory ---');
dirList.forEach(d => {
  console.log(`${d.dir.padEnd(45)} | ${d.formatted.padStart(10)} | ${d.count.toString().padStart(4)} files`);
});

// Output top 20 largest images
console.log('\n--- Top 20 Largest Images ---');
allImages.slice(0, 20).forEach(img => {
  console.log(`${img.relPath.padEnd(60)} | ${formatBytes(img.size).padStart(10)}`);
});
