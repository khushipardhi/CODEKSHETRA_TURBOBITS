import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const outDir = path.join(rootDir, 'docs/evidence/final/live_verification');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Find Chrome
const chromePaths = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  process.env.CHROME_BIN
].filter(Boolean);

let executablePath = null;
for (const p of chromePaths) {
  if (fs.existsSync(p)) {
    executablePath = p;
    break;
  }
}

if (!executablePath) {
  console.error('Chrome executable not found!');
  process.exit(1);
}

const routes = [
  { name: 'verify_01_homepage.png', url: 'http://localhost:3000/' },
  { name: 'verify_02_citizen_dashboard.png', url: 'http://localhost:3000/mumbai/dashboard' },
  { name: 'verify_03_admin_hazard_map.png', url: 'http://localhost:3000/admin/mumbai/map' },
  { name: 'verify_04_telemetry_lab.png', url: 'http://localhost:3000/admin/mumbai/telemetry-lab' },
  { name: 'verify_05_spatial_simulation.png', url: 'http://localhost:3000/admin/mumbai/simulation' }
];

async function run() {
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // Pre-seed localStorage to Mumbai
  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    localStorage.setItem('urban-link-city', 'mumbai');
    localStorage.setItem('urban_link_city', 'mumbai');
  });

  for (const r of routes) {
    console.log(`Verifying: ${r.url} ...`);
    try {
      await page.goto(r.url, { waitUntil: 'networkidle2', timeout: 30000 });
      await new Promise(res => setTimeout(res, 2000));
      const dest = path.join(outDir, r.name);
      await page.screenshot({ path: dest });
      console.log(`✓ Captured ${r.name}`);
    } catch (err) {
      console.error(`✗ Error loading ${r.url}:`, err.message);
    }
  }

  await browser.close();
  console.log('Live workspace verification complete!');
}

run();
