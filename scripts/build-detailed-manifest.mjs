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

// 1. Scan relevant directories for references
const searchDirs = ['docs', 'src', 'scripts', 'public'];
const relevantExts = new Set(['.md', '.ts', '.tsx', '.js', '.mjs', '.json', '.html', '.css']);
const referencedPaths = new Map(); // normalized string -> Set of referencing files

function scanFile(filePath) {
  try {
    const rel = path.relative(rootDir, filePath).replace(/\\/g, '/');
    if (rel.startsWith('scripts/all-images') || rel.startsWith('scripts/image-references') || rel.startsWith('scripts/duplicate')) return;
    const content = fs.readFileSync(filePath, 'utf8');
    const matches = content.match(/[A-Za-z0-9_\-\.\/\\]+\.(?:png|jpg|jpeg|webp|svg)/gi);
    if (matches) {
      for (const m of matches) {
        const norm = m.replace(/\\/g, '/');
        const base = path.basename(norm);
        if (!referencedPaths.has(norm)) referencedPaths.set(norm, new Set());
        referencedPaths.get(norm).add(rel);

        if (!referencedPaths.has(base)) referencedPaths.set(base, new Set());
        referencedPaths.get(base).add(rel);
      }
    }
  } catch (e) {}
}

function scanDir(dir) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (e.name === 'node_modules' || e.name === '.git' || e.name === '.next' || e.name === 'data') continue;
        scanDir(full);
      } else if (relevantExts.has(path.extname(e.name).toLowerCase())) {
        scanFile(full);
      }
    }
  } catch (e) {}
}

for (const d of searchDirs) {
  const full = path.join(rootDir, d);
  if (fs.existsSync(full)) scanDir(full);
}
// Also check root .md / config files
fs.readdirSync(rootDir, { withFileTypes: true }).forEach(e => {
  if (e.isFile() && (e.name.endsWith('.md') || e.name.endsWith('.json') || e.name.endsWith('.ts') || e.name.endsWith('.js'))) {
    scanFile(path.join(rootDir, e.name));
  }
});

console.log(`Discovered ${referencedPaths.size} unique image-like references in codebase & docs.`);

// 2. Discover all images
const imageExts = new Set(['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif']);
const allImages = [];

function findImages(dir) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.next') continue;
        findImages(full);
      } else if (imageExts.has(path.extname(entry.name).toLowerCase())) {
        const stat = fs.statSync(full);
        const rel = path.relative(rootDir, full).replace(/\\/g, '/');
        allImages.push({
          fullPath: full,
          relPath: rel,
          name: entry.name,
          dir: path.dirname(rel),
          ext: path.extname(entry.name).toLowerCase(),
          size: stat.size,
          mtime: stat.mtime,
          hash: getFileHash(full)
        });
      }
    }
  } catch (e) {}
}

findImages(rootDir);

// 3. Group by hash to find duplicate copies
const hashGroups = new Map();
for (const img of allImages) {
  if (!hashGroups.has(img.hash)) hashGroups.set(img.hash, []);
  hashGroups.get(img.hash).push(img);
}

for (const img of allImages) {
  const group = hashGroups.get(img.hash);
  img.duplicateCopies = group.map(g => g.relPath).filter(p => p !== img.relPath);
  img.isDuplicate = group.length > 1;

  // Check exact references
  const exactSet = referencedPaths.get(img.relPath) || new Set();
  const nameSet = referencedPaths.get(img.name) || new Set();
  img.exactRefs = Array.from(exactSet);
  img.nameRefs = Array.from(nameSet);

  // Is app asset
  img.isAppAsset = img.relPath.startsWith('public/brand') || 
                   img.relPath === 'public/favicon.ico' || 
                   img.relPath === 'public/favicon.png' || 
                   img.relPath.startsWith('src/app/icon') || 
                   img.relPath.startsWith('src/app/apple-icon');
}

console.log(`Audited ${allImages.length} images.`);

// Print summary by top-level folders
const topFolderStats = {};
for (const img of allImages) {
  const top = img.relPath.split('/')[0];
  if (!topFolderStats[top]) topFolderStats[top] = { count: 0, size: 0, exactRefs: 0, dupes: 0 };
  topFolderStats[top].count++;
  topFolderStats[top].size += img.size;
  if (img.exactRefs.length > 0) topFolderStats[top].exactRefs++;
  if (img.isDuplicate) topFolderStats[top].dupes++;
}

console.log('\n--- Top Folder Image Statistics ---');
for (const [top, stats] of Object.entries(topFolderStats)) {
  console.log(`${top.padEnd(30)} | ${formatBytes(stats.size).padStart(10)} | ${stats.count.toString().padStart(4)} files | exact refs: ${stats.exactRefs} | dupes: ${stats.dupes}`);
}

fs.writeFileSync(path.join(rootDir, 'scripts/all-images-audit.json'), JSON.stringify(allImages, null, 2));
console.log('Saved image audit to scripts/all-images-audit.json');
