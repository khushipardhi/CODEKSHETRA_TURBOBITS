import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const targets = [
  { name: 'phase12_07_admin_map_polished_layers_desktop', url: 'http://localhost:3000/admin/map' },
  { name: 'phase12_08_admin_incidents_decision_desk_desktop', url: 'http://localhost:3000/admin/incidents' }
];

for (const t of targets) {
  const outImg = path.resolve(process.cwd(), 'public/screenshots/phase12', t.name + '.png');
  const mirrorImg = path.resolve(process.cwd(), 'phase12_screenshots', t.name + '.png');
  const cmd = `"${EDGE_PATH}" --headless --disable-gpu --window-size=1366,900 --screenshot="${outImg}" --virtual-time-budget=4000 "${t.url}"`;
  console.log('Capturing:', t.name);
  try {
    execSync(cmd, { stdio: 'inherit', timeout: 35000 });
    if (fs.existsSync(outImg)) {
      fs.copyFileSync(outImg, mirrorImg);
      console.log('OK:', fs.statSync(outImg).size, 'bytes');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}
