# SENTINEL CITY INTELLIGENCE — PROMPT 6 OF 10
# Citizen Hazard Dashboard, Personalised Local Intelligence & Sentinel AI Experience

**Document Reference:** `docs/PROMPT6_CITIZEN_INTELLIGENCE.md`  
**Status:** Complete, Tested, and Verified  
**Date:** October 19, 2026  
**Target Environment:** MCGM / BMC (Mumbai), NMC (Nagpur), PMC (Pune)

---

## 1. Architectural Overview: Two Distinct Citizen Destinations

Sentinel City Intelligence establishes two decoupled, dedicated citizen destinations rather than squeezing disparate workflows into a single overloaded view.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CITIZEN APPLICATION SHELL                         │
│       - CitizenHeader (City & Area Switcher, Notification Bell, Theme)      │
│       - CitizenBottomNav (Dashboard, Sentinel AI, Report, My Reports, Profile)│
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
            ┌──────────────────────────┴──────────────────────────┐
            ▼                                                     ▼
┌───────────────────────────────────────┐   ┌───────────────────────────────────────┐
│     DESTINATION A: HAZARD DASHBOARD   │   │     DESTINATION B: CIVIC REPORTS      │
│     Route: /[city]/dashboard          │   │     Route: /[city]/report             │
│                                       │   │                                       │
│  - Explicit Location Context Bar      │   │  - Dedicated 3-Stage Reporting Wizard │
│  - Area Briefing (6 Core Questions)   │   │  - Photo Uploader & Voice Note Rec.   │
│  - Primary Interactive GIS Hazard Map │   │  - Multi-Department AI Routing        │
│  - Grounded Environmental Impact Card │   │  - Human Confirmation Before Submitting│
│  - Verified Emergency Shelters        │   │  - Direct link to My Reports Tracking │
│  - Contextual Action CTAs             │   │    (/[city]/my-reports)               │
└───────────────────────────────────────┘   └───────────────────────────────────────┘
```

---

## 2. The Location Context Model

Every citizen-facing environmental request is bound to an explicit location context object rather than fallaciously assuming the city center or continuous background GPS tracking.

Implemented in `src/components/citizen/area-context.tsx`:

```typescript
export interface CitizenLocationContext {
  city: string;                              // "mumbai" | "pune" | "nagpur"
  cityName: string;                          // "Mumbai", "Pune", "Nagpur"
  selectedLocality: string;                  // "Sion / Matunga", "Dharampeth"
  userCoords: [number, number];              // [lat, lon]
  isGpsAuthorized: boolean;                  // true if user allowed geolocation
  resolvedWard: ResolvedBoundary | null;     // Ray-cast GeoJSON boundary result
  resolvedWardId?: string;                   // e.g. "F/North" or "ZONE-1"
  resolvedWardName?: string;                 // "Ward F/North (Matunga / Sion)"
  resolvedZoneName?: string;                 // "Zone II"
  sourceLocationText: string;                // Grounded text representation
  providerCoords: [number, number];          // Rounded numerical model grid cell
  spatialResolution: string;                 // "1.0 km ECMWF Grid · Copernicus 30m DEM"
  selectionMethod: LocationSelectionMethod;  // "GPS_DEVICE" | "MANUAL_SELECTOR" | "DEFAULT_LOCALITY"
  locationTimestamp: string;                 // ISO 8601 timestamp
  supportStatus: GeographicSupportStatus;    // "SUPPORTED" | "OUTSIDE_JURISDICTION" | "UNRESOLVED_WARD"
  statusMessage: string;                     // Transparent limitation explanation
}
```

### Privacy & Boundary Resolution Rules
1. **Zero Silent Tracking:** Device GPS is queried only upon explicit user request via the Area Selector Modal.
2. **Ray-Casting Resolution:** Coordinates are resolved against authentic GeoJSON boundaries using standard ray-casting (`src/modules/geo/point-in-polygon.ts`):
   - Mumbai: `public/data/mumbai/mumbai_bmc_wards.geojson` (24 administrative wards A-T)
   - Pune: `public/data/pune/pune_pmc_zones.geojson` (PMC zonal administrative boundaries)
   - Nagpur: `public/data/nagpur/nagpur_nmc_zones.geojson` (NMC zonal administrative boundaries)
3. **Out-of-Jurisdiction Notice:** When device coordinates fall outside municipal boundaries (e.g. open ocean or adjacent districts), the system displays a non-blocking informational notice and falls back to regional baseline telemetry.

---

## 3. City-Specific Isolation & Data Integrity

Detailed hydrodynamic simulation models are strictly calibrated to Greater Mumbai. The architecture strictly enforces municipal jurisdiction boundaries:

| Dimension | Greater Mumbai (BMC / MCGM) | Nagpur (NMC) | Pune (PMC) |
|---|---|---|---|
| **Administrative Units** | 24 BMC Wards (A through T) | 10 NMC Zonal Divisions | 15 PMC Zonal Offices |
| **Active Hazards** | Rainfall, Urban Flood, Coastal Surge, AQI, Heatwave | Rainfall, Waterlogging, Heatwave, AQI | Rainfall, Waterlogging, Riverine Flood, AQI, Heatwave |
| **Drainage Telemetry** | Mithi River, 88km nullahs, 35 chronic flood hotspots | Nag River, Pili Nadi, Ambazari overflow channel | Mula-Mutha River right bank, Ramnadi tributary |
| **Coastal Backpressure** | 4.5m CD tidal sluice lockout protocol | None (Inland) | None (Inland) |
| **Simulation State** | **Operational** (24 BMC Wards) | **Limitation Notice** (`UnsupportedCitySimulationState`) | **Limitation Notice** (`UnsupportedCitySimulationState`) |

Under no circumstances do Mumbai ward identifiers, Mithi River vectors, or BMC flood calculations leak into Nagpur or Pune interfaces.

---

## 4. Rebuilt Citizen Hazard Map Surface

The primary interactive GIS map lives on the Hazard Dashboard (`/[city]/dashboard#hazard-map`):
- **Attributed Basemap:** OpenStreetMap tiles served with official copyright attribution.
- **Layer Toggles:** Clean pill buttons toggling Wards/Zones, Hospitals, Fire Stations, and Chronic Flood Hotspots (Mumbai).
- **Floating Legend:** Collapsible legend overlay placed away from map controls.
- **Return to Location:** Instant recenter button flying to the citizen's selected coordinates.
- **Attribution & Provenance Footer:** Clearly displays source provider, grid resolution (1.0 km), and 15-minute sync freshness.

---

## 5. Personalised Citizen Briefing (The 6 Core Questions)

Implemented in `src/components/citizen/my-area-briefing.tsx` and `src/components/citizen/impact-intelligence-card.tsx`:
1. **What is happening or forecast?** Plain-language observation (e.g. `0.1 mm/h dry to trace precipitation`, 24-hour accumulation forecast).
2. **Over what area and time window?** Explicit locality and temporal scope (`Next 3 to 6 Hours IST`).
3. **What evidence supports this?** High-resolution ECMWF numerical model, IMD AWS radar, and municipal chronic waterlogging registers.
4. **What could be affected?** Documented low-lying saucer depressions (e.g. Hindmata, Gandhi Market, Milan Subway) and residential demographic screening buffers (explicitly non-casualty estimates).
5. **How certain is the assessment, and what is missing?** Honest missing data disclosure (unmapped roadside catch-pits, offline sensor feeds tagged `Unavailable`).
6. **What practical actions should be considered?** Citizen precautions (avoid depressed subways, elevate electrical appliances) and municipal engineer standby pump protocols.

---

## 6. Secure Markdown Rendering Pipeline (`src/components/ui/markdown-view.tsx`)

The upgraded Markdown parser provides clean, resilient, and safe formatting for Sentinel AI:
- **Responsive Tables:** Parses standard and pipe-delimited markdown tables. Renders within an `overflow-x-auto` wrapper with horizontal scrolling and data row counts.
- **Hierarchy:** H1, H2, H3, and H4 headings with distinct typography and spacing.
- **Lists:** Ordered (`1. `, `2. `) and unordered (`- `, `* `, `+ `) with clean indentations.
- **Structured Callouts:** Blockquotes (`> `) are automatically categorized into styled alert boxes:
  - `🚨 Critical Safety Alert` (Red theme)
  - `ℹ️ Informational / Uncertainty Note` (Amber theme)
  - Standard contextual quote
- **Security & XSS Defense:**
  - Strips dangerous HTML tags (`<script>`, `<iframe>`, `<object>`, `<embed>`).
  - Sanitizes URLs, explicitly rejecting `javascript:`, `data:`, and `vbscript:` schemes.
  - Formats internal application routes and telephone links (`tel:`) safely.
- **Safe Fallback:** Intercepts raw JSON errors or network exceptions, rendering a citizen-friendly alert with a "Retry Query" action.

---

## 7. Verified Emergency Shelters & Relief Facilities

Emergency facilities in `src/app/[city]/sentinel/page.tsx` and `MyAreaBriefing` strictly adhere to responsible status disclosures:
- **Designated Tagging:** Labeled as `DESIGNATED SHELTER` or `VERIFIED MUNICIPAL FACILITY`.
- **Intake Disclaimer:** Under no circumstances does the system claim a facility is open or has available beds without sensor confirmation. Displays:
  > *"ℹ️ Intake Notice: Shelter opens upon official municipal disaster activation orders. Contact ward disaster control desk at [phone] for live intake status."*
- **One-Touch Actions:** Provides telephone dialing (`tel:`) and Google Maps directions (`https://www.google.com/maps/dir/...`).

---

## 8. Automated Verification Suite (`scripts/test-prompt6-citizen-intelligence.ts`)

All 39 automated verification tests pass with zero errors:

```
========================================================================
  SENTINEL CITY INTELLIGENCE — PROMPT 6 CITIZEN INTELLIGENCE VERIFICATION
  Test Runner: scripts/test-prompt6-citizen-intelligence.ts
========================================================================

--- 1. City Isolation & Boundary Separation ---
  ✔ [PASS] [CityIsolation] Mumbai BMC 24 wards GeoJSON exists on disk
  ✔ [PASS] [CityIsolation] Mumbai has exactly 24 BMC administrative wards
  ✔ [PASS] [CityIsolation] Nagpur NMC zones GeoJSON exists on disk
  ✔ [PASS] [CityIsolation] Nagpur zones contain zero Mumbai BMC ward leakage
  ✔ [PASS] [CityIsolation] Pune PMC zones GeoJSON exists on disk
  ✔ [PASS] [CityIsolation] Pune zones contain zero Mumbai BMC ward leakage
  ✔ [PASS] [CityIsolation] Simulation API rejects Nagpur with HTTP 400 limitation error
  ✔ [PASS] [CityIsolation] Simulation error clearly explains limitation to Mumbai

--- 2. Location Context Model & Ray-Casting ---
  ✔ [PASS] [LocationContext] Ray-casting resolves Sion coordinates to a valid boundary
  ✔ [PASS] [LocationContext] Resolved boundary correctly matches Ward F/North
  ✔ [PASS] [LocationContext] Resolved boundary correctly matches Ward A (South Mumbai)
  ✔ [PASS] [LocationContext] Coordinates in open ocean correctly return null (unresolved)
  ✔ [PASS] [LocationContext] Pune coordinates tested against Mumbai wards correctly return null

--- 3. Sentinel AI Assistant Endpoint & Grounding ---
  ✔ [PASS] [SentinelAI] Sentinel AI assistant responds with HTTP 200
  ✔ [PASS] [SentinelAI] Sentinel AI returns valid reply text
  ✔ [PASS] [SentinelAI] Sentinel AI provides verified grounding source references
  ✔ [PASS] [SentinelAI] Sentinel AI provides verified municipal shelters with helpline
  ✔ [PASS] [SentinelAI] Sentinel AI provides contextual action prefill data for civic reporting
  ✔ [PASS] [SentinelAI] Contextual action correctly routes to drainage_waterlogging in Mumbai
  ✔ [PASS] [SentinelAI] Sentinel AI map follow-up action routes to citizen dashboard (#hazard-map)

--- 4. Hyperlocal Area Briefing Endpoint & Honest Missing Data ---
  ✔ [PASS] [AreaBriefing] Area briefing endpoint responds with HTTP 200
  ✔ [PASS] [AreaBriefing] Area briefing payload is valid
  ✔ [PASS] [AreaBriefing] Briefing includes current weather telemetry
  ✔ [PASS] [AreaBriefing] Briefing includes air quality telemetry
  ✔ [PASS] [AreaBriefing] Active rain rate is a validated numeric observation
  ✔ [PASS] [AreaBriefing] Nearest emergency facility includes name and telephone contact
  ✔ [PASS] [AreaBriefing] Emergency facility includes directions link

--- 5. Distinct Destinations & Route Availability ---
  ✔ [PASS] [RouteAvailability] Route '/mumbai/dashboard' responds with HTTP 200
  ✔ [PASS] [RouteAvailability] Route '/mumbai/report' responds with HTTP 200
  ✔ [PASS] [RouteAvailability] Route '/mumbai/my-reports' responds with HTTP 200
  ✔ [PASS] [RouteAvailability] Route '/mumbai/sentinel' responds with HTTP 200
  ✔ [PASS] [RouteAvailability] Route '/nagpur/dashboard' responds with HTTP 200
  ✔ [PASS] [RouteAvailability] Route '/nagpur/sentinel' responds with HTTP 200
  ✔ [PASS] [RouteAvailability] Route '/pune/dashboard' responds with HTTP 200
  ✔ [PASS] [RouteAvailability] Route '/admin/nagpur/simulation' responds with HTTP 200

--- 6. Markdown Security & XSS Sanitization ---
  ✔ [PASS] [MarkdownSecurity] Unsafe scheme 'javascript' correctly detected as dangerous
  ✔ [PASS] [MarkdownSecurity] Unsafe scheme 'data' correctly detected as dangerous
  ✔ [PASS] [MarkdownSecurity] Unsafe scheme 'vbscript' correctly detected as dangerous
  ✔ [PASS] [MarkdownSecurity] Internal application route safely permitted

========================================================================
  PROMPT 6 TEST RESULTS: 39 / 39 PASSED | BUILD: PASS (EXIT 0)
========================================================================
```

---

## 9. Visual QA Screenshot Inventory

All 12 high-resolution screenshots have been captured and verified in `public/screenshots/prompt6/`:

1. `prompt6_01_citizen_dashboard_desktop.png` (325 KB): Full-width Citizen Hazard Dashboard showing Location Context bar, My Area Briefing, and Leaflet Hazard Map.
2. `prompt6_02_citizen_dashboard_mobile.png` (186 KB): Mobile layout (390px width) demonstrating responsive cards, bottom navigation, and zero horizontal scroll.
3. `prompt6_03_selected_area_resolved_ward.png` (325 KB): Detailed view of resolved ward badge (`BMC Ward F/North`) and spatial resolution metadata.
4. `prompt6_04_manual_area_selection.png` (210 KB): Area Selector Modal showing neighborhood selection, search filter, and privacy-first GPS option.
5. `prompt6_05_relevant_hazard_layer_legend.png` (210 KB): Interactive Leaflet map displaying active boundary overlays and floating legend.
6. `prompt6_06_sentinel_ai_headings_lists_table.png` (131 KB): Sentinel AI conversational interface rendering headings, bullet lists, and telemetry baseline table.
7. `prompt6_07_source_grounded_answer.png` (129 KB): Grounded Sentinel AI answer displaying verified sources (IMD, BMC Disaster Cell, Open-Meteo).
8. `prompt6_08_contextual_draft_report.png` (78 KB): Contextual civic report wizard prefilled with telemetry, coordinates, and hazard summary.
9. `prompt6_09_separate_civic_reports_page.png` (105 KB): Dedicated Civic Reporting destination with category selection, voice notes, and photo uploader.
10. `prompt6_10_facility_details_directions.png` (190 KB): Verified emergency shelters displaying designated tags, intake notices, helplines, and Google Maps links.
11. `prompt6_11_missing_stale_data.png` (182 KB): Data transparency card showing honest disclosures for unmapped micro-drains and offline sensor status.
12. `prompt6_12_unsupported_city_simulation_state.png` (140 KB): Explicit boundary enforcement banner for Nagpur explaining hydrodynamic simulation scope.
