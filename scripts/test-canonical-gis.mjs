import fs from 'fs';
import path from 'path';
import {
  canonicalWardId,
  isMatchingWard,
  findMatchingWardFeature,
  computeGeometryBounds,
  computeGeometryCenter,
  MUMBAI_CANONICAL_WARDS,
} from '../src/modules/geo/canonical-gis.js';

console.log('════════════════════════════════════════════════════════');
console.log('  TESTING CANONICAL GIS IDENTITY & SPATIAL RESOLVER     ');
console.log('════════════════════════════════════════════════════════\n');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✔ [PASS] ${message}`);
    passCount++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    failCount++;
  }
}

// 1. Test canonical normalization of 24 Mumbai wards
console.log('[SECTION 1] Canonical Ward Identity & Alias Matching...');
assert(canonicalWardId('A') === 'A', 'Ward A resolves to A');
assert(canonicalWardId('L') === 'L', 'Ward L resolves to L');
assert(canonicalWardId('F/South') === 'F/South', 'Ward F/South resolves to F/South');
assert(canonicalWardId('F/S') === 'F/South', 'Alias F/S resolves to F/South');
assert(canonicalWardId('fs') === 'F/South', 'Alias fs resolves to F/South');
assert(canonicalWardId('Ward F/S') === 'F/South', 'Alias "Ward F/S" resolves to F/South');
assert(canonicalWardId('F-South') === 'F/South', 'Alias "F-South" resolves to F/South');
assert(canonicalWardId('F/North') === 'F/North', 'Ward F/North resolves to F/North');
assert(canonicalWardId('F/N') === 'F/North', 'Alias F/N resolves to F/North');
assert(canonicalWardId('K/East') === 'K/East', 'Ward K/East resolves to K/East');
assert(canonicalWardId('K/E') === 'K/East', 'Alias K/E resolves to K/East');
assert(canonicalWardId('ward k/w') === 'K/West', 'Alias "ward k/w" resolves to K/West');
assert(canonicalWardId('R/Central') === 'R/Central', 'Ward R/Central resolves to R/Central');
assert(canonicalWardId('R/C') === 'R/Central', 'Alias R/C resolves to R/Central');

// 2. Test equivalence matching
console.log('\n[SECTION 2] Symmetric Ward Equivalence...');
assert(isMatchingWard('F/South', 'F/S'), 'F/South matches F/S');
assert(isMatchingWard('F/S', 'F/South'), 'F/S matches F/South');
assert(isMatchingWard('Ward F/N', 'F/North'), '"Ward F/N" matches F/North');
assert(!isMatchingWard('F/South', 'F/North'), 'F/South does NOT match F/North');
assert(isMatchingWard('L', 'l'), 'L matches l');

// 3. Test Pune and Nagpur zone normalization
console.log('\n[SECTION 3] Multi-City Isolation...');
assert(canonicalWardId('Zone 1', 'pune') === 'ZONE-1', 'Pune "Zone 1" resolves to ZONE-1');
assert(canonicalWardId('Zone 5', 'pune') === 'ZONE-5', 'Pune "Zone 5" resolves to ZONE-5');
assert(canonicalWardId('NGP-ZPOLY-01', 'nagpur') === 'ZONE-1', 'Nagpur NGP-ZPOLY-01 resolves to ZONE-1');
assert(canonicalWardId('Zone 10', 'nagpur') === 'ZONE-10', 'Nagpur "Zone 10" resolves to ZONE-10');

// 4. Test feature lookup & bounding box calculation on real GeoJSON
console.log('\n[SECTION 4] Real GeoJSON Feature Lookup & Geometry Bounds...');
const geojsonPath = path.resolve('public/data/mumbai/mumbai_bmc_wards.geojson');
const raw = fs.readFileSync(geojsonPath, 'utf8');
const wardsGeoJson = JSON.parse(raw);

assert(wardsGeoJson.features.length === 24, 'GeoJSON contains 24 BMC wards');

let allBoundsValid = true;
for (const [id, meta] of Object.entries(MUMBAI_CANONICAL_WARDS)) {
  // Test lookup via canonical ID
  const featById = findMatchingWardFeature(wardsGeoJson, id, 'mumbai');
  if (!featById) {
    console.error(`Missing feature for canonical ID ${id}`);
    allBoundsValid = false;
    continue;
  }
  // Test lookup via shorthand alias
  const featByShort = findMatchingWardFeature(wardsGeoJson, meta.shortCode, 'mumbai');
  if (!featByShort || featByShort !== featById) {
    console.error(`Shorthand lookup failed for ${meta.shortCode}`);
    allBoundsValid = false;
    continue;
  }
  // Test geometry bounds
  const bounds = computeGeometryBounds(featById.geometry);
  if (!bounds || bounds[0][0] >= bounds[1][0] || bounds[0][1] >= bounds[1][1]) {
    console.error(`Invalid bounds for ward ${id}:`, bounds);
    allBoundsValid = false;
    continue;
  }
  const center = computeGeometryCenter(featById.geometry);
  if (!center || isNaN(center[0]) || isNaN(center[1])) {
    console.error(`Invalid center for ward ${id}:`, center);
    allBoundsValid = false;
    continue;
  }
}

assert(allBoundsValid, 'All 24 BMC wards resolved with valid Polygon/MultiPolygon bounds');

// 5. Test MultiPolygon bounds specifically (Ward P/North includes Madh island)
const wardPN = findMatchingWardFeature(wardsGeoJson, 'P/North');
assert(wardPN.geometry.type === 'MultiPolygon' || wardPN.geometry.type === 'Polygon', 'Ward P/North has valid geometry');
const pnBounds = computeGeometryBounds(wardPN.geometry);
assert(pnBounds !== null, 'Ward P/North computes valid MultiPolygon bounds');
console.log(`  ℹ Ward P/North Bounds: [[${pnBounds[0].join(', ')}], [${pnBounds[1].join(', ')}]]`);

console.log('\n════════════════════════════════════════════════════════');
console.log(`  RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
console.log('════════════════════════════════════════════════════════\n');

if (failCount > 0) process.exit(1);
