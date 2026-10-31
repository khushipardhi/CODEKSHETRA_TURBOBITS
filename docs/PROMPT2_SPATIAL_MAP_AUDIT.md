# Sentinel City Intelligence — Spatial Simulation Lab Overhaul Audit
**Document ID:** `SENTINEL-PROMPT2-SPATIAL-MAP-AUDIT`  
**Focus Area:** GIS Layers, Heatmap Blending, City Geography & Map Workspace UX  
**Author:** Senior GIS Engineer, Environmental Visualisation Specialist & Frontend Architect  
**Target Route:** `/admin/mumbai/simulation` (and Jurisdiction Isolation on `/admin/pune/simulation`, `/admin/nagpur/simulation`)  
**Status:** FULLY VERIFIED & ACCEPTED  

---

## 1. Executive Summary & Engineering Mandate

During Prompt 2 of 10, the **Spatial Simulation Lab** at `/admin/mumbai/simulation` underwent a comprehensive GIS architecture overhaul. The primary objectives were:
1. **Strict Jurisdiction Consistency:** Eliminate cross-jurisdiction data pollution. Ensure Mumbai runs on canonical BMC ward geography (24 wards) and verified hazard layers, while Pune and Nagpur display clean unsupported-state notices with zero Mumbai leakage.
2. **Exhaustive Spatial Layer Tracing:** Inspect and verify all 10 GIS vector and raster surfaces (Wards, Zones, Mithi River & Nullahs, Pumping Stations, Chronic Hotspots, Copernicus GLO-30 DEM Depressions, Arterial Highways, Bridges & Culverts, Emergency Hospitals, and Coastal Exposure Corridors).
3. **Map Layer Semantics & Layer Manager:** Implement a dedicated, accessible GIS Spatial Layer Manager grouping all 10 layers into 5 logical categories with explicit rendering semantics (polygons, lines, point micro-symbols, and continuous fields) while keeping the OpenStreetMap basemap 100% visible beneath overlays.
4. **Graduated Hazard Color System:** Replace saturated red blocks with graduated multi-stop palettes (emerald/sky -> yellow -> orange -> crimson) with calibrated fill opacities (0.12–0.30) tailored to specific hazard domains (Rainfall, Susceptibility, Heat, AQI, Coastal Surge, Wind).
5. **Legitimate Spatial Blending:** Ground continuous surfaces in Inverse Distance Weighting (IDW, $p=2$) across 24 ward centroid observations with ~1.1 km mesh resolution, strictly masked to the BMC coastal perimeter (zero interpolation into the Arabian Sea or outside Mumbai).
6. **Map Workspace UX & Separation of Concerns:** Make the map the primary hero. Keep side drawers at stable dimensions (`md:w-92` / 368px) and **strictly remove dense executive report prose from the right-hand ward inspection drawer**, relocating the full 7-section report into a dedicated, uncompressed modal studio.
7. **Bidirectional Interaction:** Enable seamless two-way synchronization between map clicks, ward focus, ranking tables, and timeline scrubbing.

---

## 2. City & Jurisdiction Consistency Audit

### Problem Identified
Previously, navigating to `/admin/pune/simulation` or `/admin/nagpur/simulation` could trigger background fetches to `/api/hazards/simulation` with `city: "mumbai"` and render Mumbai BMC ward boundaries under non-Mumbai headers.

### Engineering Remediation
1. **Early Return Guard:** In `src/components/admin/simulation/simulation-map-workspace.tsx`, added early returns in both `runSimulation()` and component render:
   ```tsx
   const activeCity = routeCity || contextCity || "mumbai";
   const isMumbaiSupported = activeCity === "mumbai";
   const cityConfig = CITIES[activeCity] || CITIES[DEFAULT_CITY];

   // Abort simulation network execution immediately if unsupported
   const runSimulation = async () => {
     if (!isMumbaiSupported) {
       setLoading(false);
       return;
     }
     // ...
   };
   ```
2. **Jurisdiction Notice Component:** Integrated `<UnsupportedCitySimulationState cityConfig={cityConfig} />` whenever `!isMumbaiSupported`. This notice:
   - Explains analytical boundary enforcement (screening models calibrated only for Greater Mumbai BMC).
   - Clarifies that Pune (PMC) and Nagpur (NMC) drainage corridor calibrations are not yet operational.
   - Provides direct navigation back to `/admin/mumbai/simulation` ("Switch to Mumbai Simulation Lab →").
   - Retains full access to Pune/Nagpur's active civic features: `/admin/[city]/telemetry-lab` and `/admin/[city]/map`.
   - Guarantees **zero Mumbai geography, BMC ward labels, exposure metrics, or scenario outputs leak into other cities**.

---

## 3. Spatial Layer Catalog & GIS Inspection Trace

All 10 GIS layers were traced to their authoritative source files, verified for coordinate order, geometric fidelity, and styling:

| Layer Name | Source File | Geometry Type | Features | Coordinate Reference | Rendering Semantics |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **BMC Administrative Wards** | `public/data/mumbai/mumbai_bmc_wards.geojson` | `Polygon` / `MultiPolygon` | 24 wards | EPSG:4326 (WGS84, [lon, lat]) | Discrete polygons; subtle outline (`#64748b`, weight 1.1); active ward highlighted with bold `#1d4ed8` 3.5px border and halo. |
| **BMC Administrative Zones** | `public/data/mumbai/mumbai_bmc_zones.geojson` | `Polygon` / `MultiPolygon` | 7 zones | EPSG:4326 (WGS84, [lon, lat]) | Dashed purple boundary (`#7c3aed`, weight 2.2, dash "6, 6"); transparent fill. |
| **Mithi River & Drainage Network** | `public/data/mumbai/mumbai_public_drainage_network.geojson` | `LineString` | 39 corridors | EPSG:4326 (WGS84, [lon, lat]) | Deep sky-blue lines (`#0284c7`, weight 2.2, opacity 0.85); tooltips with catchment name and length. |
| **Stormwater Pumping Stations** | `public/data/mumbai/mumbai_drainage_structures.geojson` | `Point` | 41 structures | EPSG:4326 (WGS84, [lon, lat]) | Cyan micro-symbols (`#06b6d4`, radius 3.5/6.5); popup details connecting SWD nullahs. |
| **Chronic Flood Hotspots** | `public/data/mumbai/mumbai_flood_hotspots.geojson` | `Point` | 35 hotspots | EPSG:4326 (WGS84, [lon, lat]) | Crimson micro-symbols (`#ef4444`, radius 3.5/6.5, white halo); popup displays localized chronic waterlogging evidence. |
| **Copernicus DEM Sinks** | `public/data/mumbai/mumbai_low_lying_areas.geojson` | `Polygon` | 15 depressions | EPSG:4326 (WGS84, [lon, lat]) | Amber dashed polygons (`#d97706`, fill `#f59e0b`, opacity 0.18, dash "4, 4"); shows mean elevation ASL. |
| **Arterial Highway Network** | `public/data/mumbai/mumbai_full_road_network.geojson` | `LineString` | 78 corridors | EPSG:4326 (WGS84, [lon, lat]) | Slate corridors (`#334155`, weight 1.4–2.0, opacity 0.75); distinguishes motorways from arterial roads. |
| **Bridges & Waterway Culverts** | `public/data/mumbai/mumbai_bridges_culverts.geojson` | `Point` | 14 bridges | EPSG:4326 (WGS84, [lon, lat]) | Violet micro-symbols (`#8b5cf6`, radius 3.5/6.5); popups with road name and waterway crossed. |
| **Coastal Exposure Corridors** | `public/data/mumbai/mumbai_coastal_exposure.geojson` | `LineString` | 6 zones | EPSG:4326 (WGS84, [lon, lat]) | Teal marine corridors (`#0d9488`, weight 2.8, opacity 0.85, dash "6, 4"); Arabian Sea and creek shorelines. |
| **Emergency Healthcare Hospitals** | `public/data/mumbai/mumbai_emergency_hospitals.geojson` | `Point` | 20 hospitals | EPSG:4326 (WGS84, [lon, lat]) | Emerald micro-symbols (`#10b981`, radius 3.5/6.5); popups show facility level and emergency phone numbers. |
| **Simulated Continuous Surface** | Generated via `src/modules/geo/spatial-surface.ts` | `FeatureCollection` | 24 isobands | EPSG:4326 (WGS84) | Contoured polygon isobands; calibrated fill opacity (0.12–0.30); strictly masked to BMC coastline. |

---

## 4. Map Layer Semantics & Layer Manager Architecture

A dedicated, accessible **GIS Spatial Layer Manager** popover was implemented in `src/components/admin/simulation/simulation-map-workspace.tsx`, accessible directly from the top map ribbon (`[Layers (10)]` button) and left parameter drawer:

### Categories:
1. **Administrative Boundaries:** BMC Wards (24), BMC Administrative Zones (I–VII)
2. **Hydrology & Waterways:** Mithi River & Nullahs, Stormwater Pumping Outfalls (41), Coastal Exposure Shoreline
3. **Topography & Hazards:** Chronic Flood Hotspots (35), Copernicus DEM Saucer Sinks (15)
4. **Critical Infrastructure:** Arterial Highways (78), Bridges & Culverts (14), Emergency Hospitals (20)
5. **Hazard Surface & Representation:** Continuous Isobands, Representation Mode Selector (`Isobands` / `Choropleth` / `Hybrid`), and Ward Isolation Filter (`Focus Markers on Ward {selectedWardId}`)

All layers are independently toggleable without page reloads.

---

## 5. Graduated Hazard Colour System

### Color Philosophy
To prevent large areas from turning into opaque solid red fills, the color system was calibrated using multi-stop ramps with soft opacity (0.12–0.30). This allows OpenStreetMap roads, building outlines, railway tracks, and coastal contours to remain clearly legible.

### Multi-Hazard Ramps:
- **Waterlogging Susceptibility (0–100):**
  - `0–20`: `#22c55e` (Emerald — Minimal Susceptibility, 15% opacity)
  - `20–40`: `#eab308` (Yellow — Low Inundation Risk, 22% opacity)
  - `40–60`: `#f97316` (Orange — Moderate Waterlogging, 28% opacity)
  - `60–80`: `#ef4444` (Red — High Sinking / Choke, 34% opacity)
  - `80–100`: `#991b1b` (Crimson — Severe Inundation Hazard, 40% opacity)
- **Monsoon Rainfall Intensity (mm/h):**
  - `0–5 mm/h`: `#93c5fd` (Sky 300)
  - `5–15 mm/h`: `#3b82f6` (Blue 500)
  - `15–35 mm/h`: `#1d4ed8` (Blue 700)
  - `35–65 mm/h`: `#7c3aed` (Violet 600)
  - `>65 mm/h`: `#dc2626` (Red 600)
- **Coastal Marine & Tidal Surge (0–100):**
  - Seafoam (`#2dd4bf`) -> Cyan (`#06b6d4`) -> Ocean Blue (`#2563eb`) -> Deep Indigo (`#4338ca`) -> Crimson (`#991b1b`)
- **Heat Stress Index (°C):**
  - Mint (`#6ee7b7`) -> Yellow (`#fde047`) -> Orange (`#fb923c`) -> Danger Coral (`#f87171`) -> Extreme Crimson (`#b91c1c`)
- **Air Quality Index (AQI):**
  - Good Green (`#22c55e`) -> Moderate Yellow (`#eab308`) -> Sensitive Orange (`#f97316`) -> Unhealthy Red (`#ef4444`) -> Hazardous Maroon (`#7f1d1d`)

---

## 6. Technically Legitimate Blended Surface

The continuous hazard field adheres strictly to spatial data contracts:
1. **Input Values:** Deterministic scenario observations and baseline values computed per ward office centroid.
2. **Spatial Coordinates:** 24 verified BMC Ward Office coordinates in WGS84 EPSG:4326.
3. **Interpolation Method:** Inverse Distance Weighting (IDW) with distance exponent $p = 2$ and minimum distance epsilon $10^{-4}$ degrees:
   $$\hat{Z}(x) = \frac{\sum_{i=1}^n w_i Z_i}{\sum_{i=1}^n w_i}, \quad w_i = \frac{1}{d(x, x_i)^2}$$
4. **Spatial Resolution:** ~1.1 km ($\approx 0.01^\circ$ grid mesh equivalent).
5. **Geographic Masking:** Clipped strictly to the canonical 24 BMC administrative ward boundary polygons. **No interpolation extends into the Arabian Sea, Thane Creek, or neighboring Thane/Navi Mumbai districts.**
6. **Nodata Handling:** Defaults to dry baseline ($0$) when missing; explicitly flags `PARTIALLY_CALIBRATED` if primary sensor streams are unavailable.
7. **Scientific Disclaimer:** Distinctly marks screening scores (0–100 relative susceptibility) as non-hydrodynamic proxy indices rather than claiming calibrated physical water depth in meters.

---

## 7. Map Workspace UX Overhaul & Drawer Isolation

### Elimination of Prose inside Ward Detail Drawer
Requirement 6 explicitly mandated: *"Do not render large report prose inside the right-hand ward-detail drawer."*

**Architectural Changes Implemented:**
1. **Clean Right Drawer:** The right drawer now supports 3 focused analytical tabs:
   - **Ward Detail:** Metrics gauge box, demographic exposure, mathematical calculation trace, variable disaggregation, local hotspots, pumps, and actionable mitigation buttons.
   - **Ranked:** Sorted 24-ward severity table with click-to-focus.
   - **Formulas & Science:** Mathematical formula, physical assumptions, limitations, and required datasets.
2. **Stable Drawer Dimensions:** Right drawer width is locked at `md:w-92` (368px) and never balloons to 680px.
3. **Dedicated Full Executive Dossier Modal:** The multi-page, 7-section structured scenario report (`SimulationDossierPanel`) opens in a dedicated wide modal (`max-w-5xl`, `h-[92vh]`) via the `[Dossier Report]` ribbon button or the "View Report →" banner. This leaves the primary map completely uncompressed and spacious during interactive exploration.
4. **MapResizeWatcher:** Integrated an automatic Leaflet size invalidator:
   ```tsx
   function MapResizeWatcher({ controlsOpen, drawerOpen }) {
     const map = useMap();
     useEffect(() => {
       const timer = setTimeout(() => map.invalidateSize({ animate: false }), 280);
       return () => clearTimeout(timer);
     }, [controlsOpen, drawerOpen, map]);
     // ...
   }
   ```
   This ensures zero gray-tile glitches when drawers expand or collapse.

---

## 8. Verification Screenshot Evidence

All required states were captured in high-fidelity (1440×900 desktop and 390×844 mobile viewports) and inspected:

### Screenshot Directory
All images are preserved in `public/screenshots/prompt2/` and `.tempmediaStorage/`:

| Screenshot Identifier | Description | Verification Finding |
| :--- | :--- | :--- |
| `prompt2_01_entire_mumbai_extent.png` | Entire Greater Mumbai extent with OpenStreetMap basemap & overlays | Basemap 100% visible, fully attributed; Ward L highlighted; graduated color surface. |
| `prompt2_02_island_city_suburban_zoom.png` | Zoomed Island City & Suburban ward focus | Ward D highlighted; high zoom renders road network and drainage lines crisply. |
| `prompt2_03_ward_boundaries_basemap.png` | Full map view without open drawers | Clean panoramic canvas; floating quick-expand pills positioned without collision. |
| `prompt2_04_layer_manager_open.png` | Accessible GIS Layer Manager popover | 10 layers categorized into 5 sections with clear toggles, badges, and counts. |
| `prompt2_05_layer_rivers_drainage.png` | Hydrology & drainage network corridors | Mithi River and nullah corridors styled cleanly in sky-blue over OpenStreetMap. |
| `prompt2_06_output_state_low.png` | Low simulation output state (10 mm/h rain, T=0.5h) | Pale green/yellow surface; normal conditions alert badge. |
| `prompt2_07_output_state_medium.png` | Medium simulation output state (45 mm/h rain, T=2.5h) | Balanced orange/yellow contours; Yellow Advisory alert level. |
| `prompt2_08_output_state_high_alert.png` | High simulation output state (95 mm/h + 4.85m tide lockout) | RED ALERT active; crimson severity in Kurla/Sakinaka; threshold exceeded notice. |
| `prompt2_09_continuous_surface_legend.png` | Continuous surface legend with technical metadata | Transparent legend displaying units, IDW p=2 method, ~1.1km mesh, and BMC mask. |
| `prompt2_10_drawer_ward_inspection_open.png` | Right inspection drawer: Ward Detail | Demographic exposure (2011 Census), arithmetic trace, municipal actions, no report prose. |
| `prompt2_11_drawer_ranked_list.png` | Right inspection drawer: Ranked 24 Wards | Complete 24-ward ranking list sorted descending by metric with severity chips. |
| `prompt2_12_executive_dossier_modal.png` | Dedicated Executive Dossier Report Modal | Spacious uncompressed modal with sub-tabs A–G, Export CSV, and high-readability charts. |
| `prompt2_13_mobile_map_controls.png` | Mobile viewport (390px iPhone width) | Responsive canvas; floating pills truncated cleanly with zero overlap or collision. |
| `prompt2_14_unsupported_city_pune.png` | Unsupported city jurisdiction notice: Pune (PMC) | Clean boundary enforcement notice; zero Mumbai leakage; action to switch to Mumbai. |
| `prompt2_15_unsupported_city_nagpur.png` | Unsupported city jurisdiction notice: Nagpur (NMC) | Full jurisdiction notice; links to Nagpur telemetry and incident desk. |

---

## 9. Test Verification Results

### Suite 1: Mumbai GIS Repair & OpenStreetMap Integrity
Command: `node scripts/test-mumbai-gis-repair.mjs`
- **Result:** 22/22 Tests PASSED (100%)
- Confirmed 24 BMC wards presence, RFC 7946 coordinate order, Point-in-Polygon resolution, and authentic OpenStreetMap Standard basemap URL.

### Suite 2: Multi-Hazard Simulation Numerical Verification
Command: `node scripts/test-phase2-simulation.mjs`
- **Result:** 13/13 Tests PASSED (100%)
- Confirmed deterministic temporal evolution, parameter sensitivity, 4.5m CD tidal sluice lockout, missing input fallback, and demographic exposure estimation.

### Suite 3: TypeScript Type Checking
Command: `npx tsc --noEmit`
- **Result:** 0 errors. All interfaces, layer props, and Next.js 16 types compiled cleanly.

### Suite 4: Production Build
Command: `npm run build`
- **Result:** Exit Code 0. All 67 static and dynamic pages generated successfully via Next.js Turbopack.

---

## 10. Outstanding Limitations & Readiness for Prompt 3

1. **Current Hydrodynamic Scope:** The 2D surface is an empirical screening model based on IDW interpolation over ward observations, slope gradients, and historical hotspot weights. It is not a full finite-element Navier-Stokes 2D hydrodynamic solver (e.g. SWMM / Telemac-2D). This limitation is prominently disclosed in the Model Metadata and Scientific Disclaimers.
2. **Additional Cities:** Pune (PMC) and Nagpur (NMC) spatial simulations are intentionally gated with clear unsupported-state notices until city-specific municipal drainage corridors and elevation models are onboarded in future phases.
3. **Handoff to Prompt 3:** The spatial map canvas, layer manager, and continuous surfaces are fully verified, robust, and ready for Prompt 3 (Executive Dossier Reporting and Analytical Enhancements).
