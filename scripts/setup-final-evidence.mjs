import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const targetDir = path.join(rootDir, 'docs/evidence/final');

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const canonicalMap = [
  {
    target: 'homepage-desktop.png',
    source: 'public/screenshots/homepage_redesign/after_01_desktop_hero.png',
    desc: 'Redesigned Sentinel City Intelligence desktop hero with live telemetry and spatial schematic'
  },
  {
    target: 'homepage-mobile.png',
    source: 'public/screenshots/homepage_redesign/after_10_mobile_hero.png',
    desc: 'Responsive mobile hero view of Sentinel City Intelligence'
  },
  {
    target: 'citizen-dashboard-mobile.png',
    source: 'public/screenshots/phase7_final/02_phase7_citizen_dashboard_mobile.png',
    desc: 'Mobile Citizen Hazard Dashboard with localized weather and shelter context'
  },
  {
    target: 'sentinel-ai-mobile.png',
    source: 'public/screenshots/phase7_final/04_phase7_citizen_alerts_mobile.png',
    desc: 'Mobile conversational interface for Sentinel AI grounded queries'
  },
  {
    target: 'hazard-map-desktop.png',
    source: 'public/screenshots/gis_repair/gis_repair_01_full_mumbai_osm_basemap.png',
    desc: '24-ward municipal GIS Leaflet map with unclustered facilities and flood overlays'
  },
  {
    target: 'telemetry-lab-desktop.png',
    source: 'public/screenshots/phase10_master/phase10_08_telemetry_overview.png',
    desc: 'Environmental Telemetry Lab with 64-parameter matrix and data health'
  },
  {
    target: 'simulation-idle.png',
    source: 'public/screenshots/phase1_sim_reliability/01_simulation_idle.png',
    desc: 'Spatial Simulation Lab at rest / initial scenario state (T=0h)'
  },
  {
    target: 'simulation-playing.png',
    source: 'public/screenshots/phase1_sim_reliability/02_simulation_playing.png',
    desc: 'Hydrodynamic simulation in active playback with temporal hyetograph advance'
  },
  {
    target: 'simulation-ward-detail.png',
    source: 'public/screenshots/phase2_sim/05_selected_ward_calculation_details.png',
    desc: 'Ward L Kurla saucer depression calculation trace and Rational Method runoff'
  },
  {
    target: 'report-studio.png',
    source: 'public/screenshots/phase10_master/phase10_10_dedicated_report_studio.png',
    desc: 'Publication-grade vector PDF Simulation Report Studio workspace'
  },
  {
    target: 'light-theme.png',
    source: 'public/screenshots/homepage_redesign/after_01_desktop_hero.png',
    desc: 'Municipal light theme surface and typography hierarchy'
  },
  {
    target: 'dark-theme.png',
    source: 'public/screenshots/homepage_redesign/after_09_dark_theme_desktop.png',
    desc: 'Municipal dark theme graphite surfaces and high-contrast indicators'
  }
];

console.log('Copying canonical screenshots to docs/evidence/final/ ...');
for (const item of canonicalMap) {
  const srcPath = path.join(rootDir, item.source);
  const destPath = path.join(targetDir, item.target);
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    const stat = fs.statSync(destPath);
    console.log(`✓ ${item.target.padEnd(30)} from ${item.source} (${(stat.size / 1024).toFixed(1)} KB)`);
  } else {
    console.error(`✗ Source missing: ${item.source}`);
  }
}
