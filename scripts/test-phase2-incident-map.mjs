/**
 * scripts/test-phase2-incident-map.mjs
 * Sentinel City Intelligence — Phase 2 of 10 Verification Suite
 * 
 * Tests:
 * 1. OpenStreetMap Basemap Configuration & Attribution
 * 2. Complete Elimination of Unwanted Blue Count Cluster Badges
 * 3. Individual Marker Rendering & Co-located Facility Hub Support
 * 4. Hardware-Accelerated Canvas Performance (preferCanvas=true)
 * 5. Multi-City Geographic Boundary Isolation (Mumbai vs Pune vs Nagpur)
 * 6. Fit City & Reset View Navigation Controls
 * 7. Streamlined Toolbar & Layer Visibility Toggles
 * 8. Ward Polygon Translucency (Base Map Visibility Preservation)
 */

import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

const results = [];
function recordTest(suite, name, passed, details = '') {
  results.push({ suite, name, passed, details });
  const statusStr = passed ? '\x1b[32m[PASS]\x1b[0m' : '\x1b[31m[FAIL]\x1b[0m';
  console.log(`  ${statusStr} ${name}`);
  if (!passed && details) {
    console.log(`         \x1b[33mDetail: ${details}\x1b[0m`);
  }
}

async function runTests() {
  console.log('════════════════════════════════════════════════════════════════════');
  console.log('  SENTINEL CITY INTELLIGENCE — PHASE 2 AUTOMATED TEST SUITE        ');
  console.log(`  Target URL: ${BASE_URL}`);
  console.log('════════════════════════════════════════════════════════════════════\n');

  // ─── SUITE 1: Basemap & Tile Configuration ───
  console.log('=== SUITE 1: Basemap & Tile Configuration ===');
  const mapPagePath = path.resolve(process.cwd(), 'src', 'app', '(admin)', 'admin', 'map', 'page.tsx');
  const mapPageContent = fs.readFileSync(mapPagePath, 'utf8');

  recordTest(
    'Basemap',
    'OpenStreetMap is index 0 (default basemap provider)',
    mapPageContent.includes('id: "osm"') && mapPageContent.includes('useState(TILE_PROVIDERS[0])'),
    'TILE_PROVIDERS[0] must be OpenStreetMap'
  );

  recordTest(
    'Basemap',
    'OpenStreetMap URL uses standard legitimate tile.openstreetmap.org endpoint',
    mapPageContent.includes('https://tile.openstreetmap.org/{z}/{x}/{y}.png')
  );

  recordTest(
    'Basemap',
    'OpenStreetMap attribution contains official copyright attribution',
    mapPageContent.includes('https://www.openstreetmap.org/copyright')
  );

  // ─── SUITE 2: Elimination of Unwanted Count Clusters ───
  console.log('\n=== SUITE 2: Unwanted Cluster Removal & Marker Architecture ===');
  const osmMapPath = path.resolve(process.cwd(), 'src', 'components', 'admin', 'osm-incident-map.tsx');
  const osmMapContent = fs.readFileSync(osmMapPath, 'utf8');

  recordTest(
    'Clustering Removal',
    'Generic FacilityClusterMarker is completely removed',
    !osmMapContent.includes('function FacilityClusterMarker') && !osmMapContent.includes('clusteredFacilities'),
    'Zero generic facility cluster markers should remain'
  );

  recordTest(
    'Clustering Removal',
    'Artificial count badge circles (🏢 ${count}) are eliminated',
    !osmMapContent.includes('🏢 ${count}') && !osmMapContent.includes('🏢 ${facilities.length}'),
    'Facilities must render individually rather than being aggregated into count bubbles'
  );

  recordTest(
    'Markers',
    'True individual facility markers render with department-specific icons',
    osmMapContent.includes('custom-facility-marker') && osmMapContent.includes('DEPT_ICONS'),
    'Each facility has its own distinct marker'
  );

  recordTest(
    'Co-location',
    'Co-located Facility Marker handles identical coordinates with tabbed popup',
    osmMapContent.includes('function ColocatedFacilityMarker') && osmMapContent.includes('activeIdx'),
    'Multi-facility hubs sharing identical coordinates render honest tabbed details'
  );

  // ─── SUITE 3: Performance & Rendering Optimization ───
  console.log('\n=== SUITE 3: GIS Performance & Vector Rendering ===');

  recordTest(
    'Performance',
    'Hardware-accelerated HTML5 canvas renderer enabled (preferCanvas=true)',
    osmMapContent.includes('preferCanvas={true}'),
    'MapContainer must batch vector layers into canvas for smooth panning/zooming'
  );

  recordTest(
    'Performance',
    'Zone fill opacity is restrained (0.04 - 0.14) so base map is never obscured',
    osmMapContent.includes('fillOpacity = incidentCount >= 6 ? 0.14 : incidentCount >= 3 ? 0.10 : incidentCount >= 1 ? 0.08 : 0.04'),
    'Polygon fills must remain translucent'
  );

  recordTest(
    'Navigation',
    'MapController invalidates container size on mount and window resize',
    osmMapContent.includes('map.invalidateSize()') && osmMapContent.includes('window.addEventListener("resize"')
  );

  recordTest(
    'Navigation',
    'Fit City and Reset View triggers are wired to MapController with closePopup',
    osmMapContent.includes('fitCityTrigger') && osmMapContent.includes('resetViewTrigger') && osmMapContent.includes('map.closePopup()')
  );

  // ─── SUITE 4: Multi-City Geographic Boundary Isolation ───
  console.log('\n=== SUITE 4: Geographic Data & City Isolation ===');

  try {
    const resMumbai = await fetch(`${BASE_URL}/api/admin/map-data?city=mumbai`);
    const mumbaiData = await resMumbai.json();

    recordTest(
      'City Isolation',
      'Mumbai map-data API returns 200 OK with success=true',
      mumbaiData.success === true
    );

    recordTest(
      'City Isolation',
      'Mumbai loads all 219 facilities across 14 municipal departments',
      mumbaiData.facilities && mumbaiData.facilities.length === 219,
      `Loaded ${mumbaiData.facilities?.length || 0} facilities`
    );

    const mumbaiBounds = [[18.8500, 72.7500], [19.3500, 73.0500]];
    const allInMumbai = mumbaiData.facilities.every(
      f => f.latitude >= mumbaiBounds[0][0] && f.latitude <= mumbaiBounds[1][0] &&
           f.longitude >= mumbaiBounds[0][1] && f.longitude <= mumbaiBounds[1][1]
    );

    recordTest(
      'City Isolation',
      '100% of Mumbai facilities reside strictly within Greater Mumbai geographic bounds',
      allInMumbai,
      'Zero out-of-boundary facilities'
    );

    const resNagpur = await fetch(`${BASE_URL}/api/admin/map-data?city=nagpur`);
    const nagpurData = await resNagpur.json();

    recordTest(
      'City Isolation',
      'Nagpur loads 200 facilities strictly isolated from Mumbai data',
      nagpurData.facilities && nagpurData.facilities.length === 200,
      `Loaded ${nagpurData.facilities?.length || 0} facilities`
    );

    const nagpurBounds = [[20.8500, 78.7500], [21.4500, 79.4500]];
    const allInNagpur = nagpurData.facilities.every(
      f => f.latitude >= nagpurBounds[0][0] && f.latitude <= nagpurBounds[1][0] &&
           f.longitude >= nagpurBounds[0][1] && f.longitude <= nagpurBounds[1][1]
    );

    recordTest(
      'City Isolation',
      '100% of Nagpur facilities reside strictly within Nagpur NMC bounds',
      allInNagpur
    );
  } catch (err) {
    recordTest('City Isolation', 'API fetch succeeded', false, err.message);
  }

  // ─── SUITE 5: Screenshot Evidence Validation ───
  console.log('\n=== SUITE 5: Screenshot Artifact Verification ===');
  const screenshotDir = path.resolve(process.cwd(), 'public', 'screenshots', 'phase2_incident_map');
  const requiredShots = [
    '01_initial_city_extent.png',
    '02_city_extent_no_optional_overlays.png',
    '03_facilities_enabled.png',
    '04_incidents_enabled.png',
    '05_hazard_layers_enabled.png',
    '06_neighbourhood_zoom.png',
    '07_dense_central_area.png',
    '08_selected_facility_popup.png',
    '09_reset_to_city_action.png',
    '10_mobile_narrow_layout.png',
  ];

  for (const shot of requiredShots) {
    const fullPath = path.join(screenshotDir, shot);
    const exists = fs.existsSync(fullPath);
    const size = exists ? fs.statSync(fullPath).size : 0;
    recordTest(
      'Screenshots',
      `Screenshot artifact ${shot} exists and is non-empty (>50KB)`,
      exists && size > 50000,
      `Size: ${Math.round(size / 1024)} KB`
    );
  }

  // ─── Summary ───
  console.log('\n════════════════════════════════════════════════════════════════════');
  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  console.log(`  PHASE 2 SUMMARY: ${passed}/${total} TESTS PASSED (${failed} failed)`);
  console.log('════════════════════════════════════════════════════════════════════\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
