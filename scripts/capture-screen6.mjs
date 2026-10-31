import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUT_DIR = path.resolve(process.cwd(), 'public', 'screenshots', 'phase1');
const MIRROR_DIR = path.resolve(process.cwd(), 'phase1_screenshots');

const outImg = path.join(OUT_DIR, 'phase1_06_contextual_report_form_before_confirmation.png');
const mirrorImg = path.join(MIRROR_DIR, 'phase1_06_contextual_report_form_before_confirmation.png');

const url = 'http://localhost:3000/mumbai/dashboard?prefill=1';

console.log('Capturing phase1_06 via execSync:');
console.log('URL:', url);

const cmd = `"${EDGE_PATH}" --headless --disable-gpu --window-size=1366,900 --screenshot="${outImg}" --virtual-time-budget=3500 "${url}"`;

try {
  execSync(cmd, { stdio: 'ignore', timeout: 25000 });
  if (fs.existsSync(outImg)) {
    fs.copyFileSync(outImg, mirrorImg);
    const stats = fs.statSync(outImg);
    console.log(`SUCCESS: Captured phase1_06 (${(stats.size / 1024).toFixed(1)} KB)`);
  } else {
    console.error('File not created');
  }
} catch (err) {
  console.error('Error:', err.message);
}
