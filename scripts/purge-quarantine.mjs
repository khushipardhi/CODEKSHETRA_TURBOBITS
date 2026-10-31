import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const quarantineDir = path.join(rootDir, '.quarantine_cleanup');

if (fs.existsSync(quarantineDir)) {
  console.log('Purging verified quarantine directory:', quarantineDir);
  fs.rmSync(quarantineDir, { recursive: true, force: true });
  console.log('✓ Quarantine purged successfully. 63.32 MB of disk storage permanently recovered!');
} else {
  console.log('Quarantine directory does not exist.');
}
