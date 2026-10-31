import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const allImages = JSON.parse(fs.readFileSync(path.join(rootDir, 'scripts/all-images-audit.json'), 'utf8'));

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

const dirMap = {};

for (const img of allImages) {
  const dir = img.dir;
  if (!dirMap[dir]) {
    dirMap[dir] = {
      count: 0,
      size: 0,
      exactRefFiles: 0,
      nameRefFiles: 0,
      dupeFiles: 0,
      files: []
    };
  }
  dirMap[dir].count++;
  dirMap[dir].size += img.size;
  if (img.exactRefs.length > 0) dirMap[dir].exactRefFiles++;
  if (img.nameRefs.length > 0) dirMap[dir].nameRefFiles++;
  if (img.isDuplicate) dirMap[dir].dupeFiles++;
  dirMap[dir].files.push(img);
}

const dirList = Object.entries(dirMap).map(([dir, d]) => ({
  dir,
  count: d.count,
  size: d.size,
  formatted: formatBytes(d.size),
  exactRefFiles: d.exactRefFiles,
  nameRefFiles: d.nameRefFiles,
  dupeFiles: d.dupeFiles
})).sort((a, b) => b.size - a.size);

console.log('--- Subdirectory Deep Dive ---');
dirList.forEach(d => {
  console.log(`${d.dir.padEnd(50)} | ${d.formatted.padStart(10)} | ${d.count.toString().padStart(3)} imgs | exact refs: ${d.exactRefFiles.toString().padStart(2)} | name refs: ${d.nameRefFiles.toString().padStart(2)} | dupes: ${d.dupeFiles.toString().padStart(2)}`);
});
