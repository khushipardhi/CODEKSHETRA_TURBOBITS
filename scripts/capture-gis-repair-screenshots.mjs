/**
 * scripts/capture-gis-repair-screenshots.mjs
 * Sentinel City Intelligence — Phase 1 GIS Repair & OpenStreetMap Visual Verification
 * 
 * Captures real high-definition browser screenshots of /admin/mumbai/simulation:
 * 1. Full Greater Mumbai extent with OpenStreetMap basemap & 24 wards (zero watermark)
 * 2. Island City (South Mumbai: Wards A-G) with coastline, roads & landmarks
 * 3. Suburbs & Mithi River Basin (Ward L Kurla, BKC, nullahs & pumping stations)
 * 4. Selected ward deep inspection & administrative hierarchy
 * 5. Multi-scenario simulation state with transparent hazard surfaces
 */

import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BROWSER_PATH = fs.existsSync(EDGE_PATH) ? EDGE_PATH : CHROME_PATH;

const OUT_DIR = path.resolve(process.cwd(), 'public', 'screenshots', 'gis_repair');
const ARTIFACT_DIR = path.resolve(process.cwd(), 'gis_repair_screenshots');

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
if (!fs.existsSync(ARTIFACT_DIR)) fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

const SCREENS = [
  {
    name: 'gis_repair_01_full_mumbai_osm_basemap',
    url: 'http://localhost:3000/admin/mumbai/simulation',
    width: 1440,
    height: 920,
    delay: 5000,
    desc: 'Full Greater Mumbai extent: Genuine OpenStreetMap standard basemap with roads, coastline, 24 BMC wards, zero watermark, zoom controls and Fit Mumbai button'
  },
  {
    name: 'gis_repair_02_island_city_coastal_alignment',
    url: 'http://localhost:3000/admin/mumbai/simulation?ward=A&tab=ward_detail',
    width: 1440,
    height: 920,
    delay: 5000,
    desc: 'Island City (South Mumbai: Colaba, Fort, Marine Drive): Real coastal outline, port docks, railway corridors, and Ward A selection'
  },
  {
    name: 'gis_repair_03_kurla_mithi_basin_infrastructure',
    url: 'http://localhost:3000/admin/mumbai/simulation?scenario=rainfall_waterlogging&ward=L&t=2',
    width: 1440,
    height: 920,
    delay: 5000,
    desc: 'Central Suburbs & Mithi River Basin: Ward L (Kurla) with Mithi river corridor, stormwater nullahs, recurring hotspots, and pumping stations'
  },
  {
    name: 'gis_repair_04_western_suburbs_andheri',
    url: 'http://localhost:3000/admin/mumbai/simulation?scenario=drainage_stress_blockage&ward=K/West&t=3',
    width: 1440,
    height: 920,
    delay: 5000,
    desc: 'Western Suburbs: Ward K/West (Andheri West / Juhu) with Arabian Sea coastline, creek outfalls, and transparent hazard isobands'
  },
  {
    name: 'gis_repair_05_eastern_suburbs_chembur',
    url: 'http://localhost:3000/admin/mumbai/simulation?scenario=extreme_heat_stress&ward=M/East&t=2',
    width: 1440,
    height: 920,
    delay: 5000,
    desc: 'Eastern Suburbs: Ward M/East (Govandi / Mankhurd / Trombay) with Thane Creek mudflats and heat stress vulnerability profile'
  },
  {
    name: 'gis_repair_06_bmc_zones_hierarchy',
    url: 'http://localhost:3000/admin/mumbai/simulation?zones=1',
    width: 1440,
    height: 920,
    delay: 5000,
    desc: 'BMC Municipal Zones Hierarchy: 7 BMC Zones (Zones I through VII) outlining the administrative grouping of all 24 constituent wards'
  }
];

async function prewarm(url) {
  try {
    const res = await fetch(url);
    await res.text();
  } catch (e) {
    // Ignore prewarm error
  }
}

async function capture() {
  console.log('================================================================================');
  console.log('SENTINEL GIS REPAIR — AUTOMATED VISUAL ACCEPTANCE SCREENSHOT CAPTURE');
  console.log('================================================================================\n');
  console.log(`Browser: ${BROWSER_PATH}`);
  console.log(`Target Directory: ${OUT_DIR}\n`);

  for (let i = 0; i < SCREENS.length; i++) {
    const s = SCREENS[i];
    const outImg = path.join(OUT_DIR, `${s.name}.png`);
    const artifactImg = path.join(ARTIFACT_DIR, `${s.name}.png`);
    const tmpProfile = path.join(os.tmpdir(), `edge_gis_${Date.now()}_${i}`);

    console.log(`[${i + 1}/${SCREENS.length}] Capturing: ${s.name}`);
    console.log(`  URL: ${s.url}`);
    console.log(`  Description: ${s.desc}`);

    // Pre-warm the URL
    await prewarm(s.url);

    const args = [
      '--headless',
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      `--user-data-dir=${tmpProfile}`,
      `--window-size=${s.width},${s.height}`,
      `--virtual-time-budget=${s.delay || 5000}`,
      `--screenshot=${outImg}`,
      s.url
    ];

    try {
      const res = spawnSync(BROWSER_PATH, args, { timeout: 40000 });
      if (fs.existsSync(outImg)) {
        fs.copyFileSync(outImg, artifactImg);
        const stats = fs.statSync(outImg);
        console.log(`  -> CAPTURED (${(stats.size / 1024).toFixed(1)} KB)\n`);
      } else {
        console.warn(`  -> WARNING: File not generated: ${outImg}\n`);
      }
    } catch (err) {
      console.error(`  -> ERROR capturing ${s.name}:`, err.message);
    } finally {
      try {
        fs.rmSync(tmpProfile, { recursive: true, force: true });
      } catch (e) {}
    }
  }

  console.log('Visual acceptance capture complete!');
}

capture();
