# Sentinel City Intelligence — Prompt 1 Audit & Design System Manifesto
## Global UI/UX Audit, Premium Light-First Design System, and Layout Repair

**Execution Date:** 2026-10-19  
**Version:** 1.0.0 — Production-Grade Municipal UI Repair  
**Status:** Complete & Verified (29/29 Regression Tests Passing, 0 TypeScript Compilation Errors)  
**Author:** Principal Product Designer, Frontend Architect, Design-Systems Engineer & Accessibility Specialist  

---

## 1. Executive Summary & Design Vision

Urban Link / Sentinel City Intelligence was subjected to an end-to-end design system audit to diagnose and resolve systemic visual defects present in the working application. The initial inspection of the user-supplied screenshots revealed severe issues with **translucent surfaces**, **clashing glassmorphism**, **clipped report tabs**, **unbounded layout dimensions**, and **conflicting interactive map and chatbot z-index hierarchies**.

### The Core Design System Fix: "Light-First with Restrained Skeuomorphism"
Rather than relying on uncalibrated, blurry transparency that lets high-contrast OpenStreetMap vectors bleed through operational text, this phase established a **clean, light-first civic design system**:
1. **Opaque & Semi-Opaque Map Overlays ($\ge 97\%$ opacity):** Text surfaces over maps (scenario parameters, dossiers, ward details, legends) now use `bg-white/98` in light mode and `bg-slate-900/98` in dark mode. Map features remain visible around the panels without sacrificing operational legibility.
2. **Restrained Skeuomorphic Depth:** Subtle inset borders (`border-slate-200/90`), layered shadows (`shadow-2xl`, `shadow-md`), and beveled interactive pills replace excessive backdrop blur.
3. **Tailwind v4 Token Contract Restoration:** Fixed missing `@theme` token definitions (`--color-card`, `--color-surface`, `--color-primary-foreground`) that previously caused `bg-card` and `bg-surface` to resolve to `transparent`.
4. **Tailwind v4 Dark Mode Variant Alignment:** Introduced `@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));` to prevent Windows OS system theme overrides from accidentally applying dark-mode text colors onto light-mode backgrounds.
5. **Backdrop Isolation & Stacking Context (`isolation: isolate`):** All Leaflet maps now enforce isolated stacking contexts, preventing inner controls from punching through page drawers and modals.

---

## 2. Screenshot Defect Reproduction & Root Cause Analysis

### Screenshot 1: Telemetry Lab Parameter Modal
* **URL:** `/admin/mumbai/telemetry-lab?tab=parameters`
* **Observed Defect:** The parameter detail dialog for `2 m Air Temperature (°C)` was almost completely translucent. The background table header ("Category", "Unit", "Data Type", "Model & Resolution") bled directly through the scientific description and operational thresholds. The modal backdrop provided negligible dimming (`bg-black/50 backdrop-blur-xs`), and text contrast was poor.
* **Root Cause:**
  1. Tailwind v4 `@theme` lacked `--color-card` and `--color-surface`, causing `.bg-card` on the modal to resolve to `transparent`.
  2. Dialog overlay used `backdrop-blur-xs` without sufficient opacity.
* **Repair Implementation:**
  - Upgraded dialog container in `src/components/admin/telemetry-lab/parameter-explorer-tab.tsx` to `bg-slate-950/60 backdrop-blur-sm` for the backdrop and `bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl` for the modal surface.
  - Added backdrop click-to-dismiss and escape key accessibility.
  - Inset subsection containers (`Scientific Description`, `Operational Meaning`, `Thresholds`) given solid opaque backgrounds (`bg-slate-50 dark:bg-slate-800/60`) and crisp contrast.

---

### Screenshots 2 & 3: Spatial Simulation Lab & Dossier Reports
* **URL:** `/admin/mumbai/simulation`
* **Observed Defects:**
  1. **Translucent Glass Panels:** Left scenario controls, bottom timeline, and map legend allowed OSM road rasters to bleed through text.
  2. **Clipped Sub-Tabs:** Dossier sub-tabs on the right were cramped in a single overflowing row (`overflow-x-auto pb-1`), truncating tab labels into "p-Dive" and "G. Data Provenanc...".
  3. **Narrow Dossier Column:** The right panel was hardcoded to `md:w-92` (368px), squeezing multi-column municipal consequence matrices and AI briefings into unreadable vertical slivers.
* **Root Cause:**
  - In `src/components/admin/simulation/simulation-map-workspace.tsx`, overlay elements used `bg-card/95` and `.glass-panel` which were transparent due to missing CSS tokens.
  - In `src/components/admin/simulation/simulation-dossier-panel.tsx`, sub-tabs used a non-wrapping flex layout with single-line whitespace truncation.
* **Repair Implementation:**
  - Hardened floating pills (`left-4` and `right-4`), scenario parameter drawer, map legend, and timeline bar to `bg-white/98 dark:bg-slate-900/98 border border-slate-200/90 dark:border-slate-800 shadow-2xl`.
  - Implemented an **Adaptive Drawer Width**: when the user switches to the `report` tab, the right drawer automatically expands from `md:w-92` to `md:w-[580px] lg:w-[680px]`, giving the comprehensive dossier room to breathe.
  - Redesigned sub-tabs in `src/components/admin/simulation/simulation-dossier-panel.tsx` to use a responsive wrapping layout (`flex flex-wrap items-center gap-1.5`) with distinct letter badges (`A` through `G`), ensuring zero text truncation.

---

### Screenshot 4: Sentinel Multi-Hazard Early Warning Hub
* **URL:** `/mumbai/sentinel`
* **Observed Defects:**
  1. Top navbar was narrow and centered (`max-w-3xl`), creating an awkward misalignment with the wide `max-w-6xl` cards below.
  2. Active tab indicator for `Sentinel AI` was subtle and difficult to distinguish from inactive tabs.
* **Root Cause:**
  - In `src/components/citizen/citizen-header.tsx`, the top bar was hardcoded to `max-w-3xl mx-auto`.
  - Inactive and active tabs differed only by faint blue opacity (`bg-accent/10`).
* **Repair Implementation:**
  - Updated `citizen-header.tsx` to `max-w-6xl mx-auto`, creating seamless vertical alignment across the entire viewport.
  - Upgraded active tab styling to a filled `bg-primary text-primary-foreground shadow-xs font-bold` pill, providing instant, unmistakable active tab recognition in both light and dark modes.

---

### Screenshot 5: Citizen Dashboard Map & Chatbot Collision
* **URL:** `/mumbai/dashboard`
* **Observed Defects:**
  1. The floating Sentinel Assistant chat drawer opened on the right with no backdrop overlay, awkwardly overlapping interactive map controls.
  2. Top map controls bar in Leaflet had `z-[1000]` which punched through the drawer container (`z-50`), causing buttons to float on top of chat messages.
  3. The "MAP LEGEND" box in the citizen map defaulted to open, blocking the center of the South Mumbai coastline.
* **Root Cause:**
  - `src/components/citizen/sentinel-assistant-drawer.tsx` had no backdrop wrapper.
  - `src/components/citizen/citizen-hazard-map-inner.tsx` lacked CSS `isolation: isolate`, allowing Leaflet controls (`z-[1000]`) to escape their container.
  - `showLegend` defaulted to `true`.
* **Repair Implementation:**
  - Wrapped `SentinelAssistantDrawer` in an accessible backdrop overlay (`fixed inset-0 bg-slate-950/40 backdrop-blur-[2px] z-50`) with backdrop click-to-dismiss.
  - Added `isolate` to the citizen map container and reduced map control z-index to `z-20`.
  - Updated `showLegend` default to `false` (collapsible via the "🏷️ Legend" toggle button) so the map is clean upon arrival.

---

## 3. Design System Token Specifications

The design tokens in `src/app/globals.css` were updated to establish a cohesive, light-first foundation with flawless dark-mode parity:

### Light Theme Tokens (`@theme` Default)
```css
--color-canvas: #f8fafc;
--color-surface-0: #ffffff;
--color-surface-1: #f1f5f9;
--color-surface-2: #e2e8f0;
--color-surface-3: #cbd5e1;
--color-surface-4: #94a3b8;

--color-card: #ffffff;
--color-card-elevated: #ffffff;
--color-surface: #ffffff;
--color-surface-elevated: #f8fafc;
--color-surface-hover: #f1f5f9;

--color-primary: #0052cc;
--color-primary-foreground: #ffffff;
--color-primary-hover: #003d9b;
--color-primary-muted: rgba(0, 82, 204, 0.08);

--color-text-primary: #0f172a;
--color-text-secondary: #334155;
--color-text-tertiary: #64748b;
--color-border: #e2e8f0;
--color-border-hover: #cbd5e1;
--color-overlay: rgba(15, 23, 42, 0.50);
```

### Dark Theme Tokens (`[data-theme="dark"]`)
```css
--color-canvas: #090d16;
--color-surface-0: #0f172a;
--color-surface-1: #1e293b;
--color-surface-2: #334155;
--color-surface-3: #475569;
--color-surface-4: #64748b;

--color-card: #0f172a;
--color-card-elevated: #1e293b;
--color-surface: #0f172a;
--color-surface-elevated: #1e293b;
--color-surface-hover: #334155;

--color-primary: #38bdf8;
--color-primary-foreground: #090d16;
--color-primary-hover: #7dd3fc;
--color-primary-muted: rgba(56, 189, 248, 0.15);

--color-text-primary: #f8fafc;
--color-text-secondary: #cbd5e1;
--color-text-tertiary: #94a3b8;
--color-border: rgba(255, 255, 255, 0.12);
--color-border-hover: rgba(255, 255, 255, 0.20);
--color-overlay: rgba(0, 0, 0, 0.75);
```

### High-Opacity Map Overlay Classes
```css
.map-overlay-panel {
  background-color: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(226, 232, 240, 0.95);
  box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08);
}

[data-theme="dark"] .map-overlay-panel {
  background-color: rgba(15, 23, 42, 0.98);
  border-color: rgba(255, 255, 255, 0.12);
  box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.6);
}
```

---

## 4. Summary of Files Modified

| File | Nature of Changes |
| :--- | :--- |
| `src/app/globals.css` | Added missing Tailwind v4 `@theme` tokens, custom dark variant, hardened glass and overlay utilities |
| `src/app/layout.tsx` | Enforced strict light-first default theme initialization in inline script |
| `src/components/ui/theme-provider.tsx` | Fixed fallback mechanism to default to light mode rather than OS dark preference |
| `src/components/admin/telemetry-lab/parameter-explorer-tab.tsx` | Solid opaque dialog surface, dimming backdrop overlay, deep-linking `param` search support |
| `src/components/admin/telemetry-lab/telemetry-lab-view.tsx` | Prevented Parameter Explorer from being blocked by asynchronous telemetry API loading |
| `src/components/admin/simulation/simulation-map-workspace.tsx` | Opaque 98% drawers, solid map legend, solid timeline bar, adaptive 680px report drawer |
| `src/components/admin/simulation/simulation-dossier-panel.tsx` | Wrapping responsive sub-tabs with letter badges (A–G) preventing label clipping |
| `src/components/citizen/sentinel-assistant-drawer.tsx` | Added modal backdrop overlay, solid light/dark card surface, and backdrop dismiss |
| `src/components/citizen/citizen-hazard-map-inner.tsx` | Added `isolate` stacking context, reduced control z-index, defaulted legend to collapsed |
| `src/components/citizen/citizen-header.tsx` | Expanded max-width from `3xl` to `6xl`, upgraded active nav tab to filled high-contrast pill |
| `src/app/(admin)/admin/layout.tsx` | Upgraded active admin navigation items to `bg-primary text-primary-foreground` |
| `scripts/capture-prompt1-verification.mjs` | Automated Puppeteer verification capturer covering light, dark, and mobile viewports |

---

## 5. Visual QA & Screenshot Verification Gallery

All 11 verification screenshots were captured directly from the running dev server (`http://localhost:3005`) using headless Microsoft Edge via Puppeteer:

1. **`prompt1_01_telemetry_parameter_modal_light.png`** (240 KB): Parameter Detail Modal in Light Mode. Pure white opaque dialog surface (`bg-white`), dark high-contrast typography, dimmed backdrop (`bg-slate-950/60`), zero table text bleeding through.
2. **`prompt1_02_telemetry_parameter_modal_dark.png`** (250 KB): Parameter Detail Modal in Dark Mode. Sleek dark surface (`bg-slate-900`), white typography, sky blue action button, crisp borders.
3. **`prompt1_03_spatial_simulation_report_light.png`** (590 KB): Simulation Lab in Light Mode. Widened report workspace (680px), non-clipped sub-tabs (A through G with badges), solid white Scenario Parameters drawer, opaque map legend, and solid timeline bar.
4. **`prompt1_04_spatial_simulation_report_dark.png`** (591 KB): Simulation Lab in Dark Mode. Deep slate panels over map, vibrant flood contours, sharp legibility.
5. **`prompt1_05_citizen_dashboard_light.png`** (326 KB): Citizen Hazard Dashboard in Light Mode. Full-width `max-w-6xl` header aligned with content, filled blue active nav pill, clean unobstructed map with collapsed legend.
6. **`prompt1_06_citizen_assistant_drawer_backdrop_light.png`** (310 KB): Sentinel Assistant Drawer with Backdrop. Smooth background dimming over map and cards, zero map control bleed-through, pristine conversation bubbles.
7. **`prompt1_07_citizen_sentinel_hub_light.png`** (167 KB): Sentinel AI Hub in Light Mode. Aligned navbar, high-contrast active tab, clean metric cards (Precipitation, Temperature, Air Quality, Coastal Surge).
8. **`prompt1_08_citizen_sentinel_hub_dark.png`** (181 KB): Sentinel AI Hub in Dark Mode.
9. **`prompt1_09_admin_command_dashboard_light.png`** (236 KB): Admin Command Dashboard in Light Mode. Crisp KPI summary cards, clean light sidebar, filled active nav indicator.
10. **`prompt1_10_mobile_citizen_dashboard_390.png`** (82 KB): Mobile Citizen Dashboard (390x844). Stacked 2-column KPI cards, mobile bottom nav bar, accessible touch targets, zero horizontal scrolling.
11. **`prompt1_11_mobile_simulation_lab_390.png`** (393 KB): Mobile Simulation Lab (390x844). Collapsible floating quick-expand scenario pills, responsive timeline slider, full map visibility.

---

## 6. Regression Testing & Build Verification

### TypeScript Compiler Check
```bash
npx tsc --noEmit
# Exit Code: 0 (Zero compilation errors)
```

### Automated Regression Suite (`scripts/run-phase6-tests.mjs`)
```
=== SENTINEL AUTOMATED REGRESSION SUITE ===
--- 1. Testing Urban Link Core Functionality ---
[urbanLinkCore] ✓ PASS: Admin stats for mumbai (Status 200)
[urbanLinkCore] ✓ PASS: Admin incidents query for mumbai (Status 200)
[urbanLinkCore] ✓ PASS: Admin map data for mumbai (Facilities: 219)
[urbanLinkCore] ✓ PASS: Admin stats for pune (Status 200)
[urbanLinkCore] ✓ PASS: Admin incidents query for pune (Status 200)
[urbanLinkCore] ✓ PASS: Admin map data for pune (Facilities: 428)
[urbanLinkCore] ✓ PASS: Admin stats for nagpur (Status 200)
[urbanLinkCore] ✓ PASS: Admin incidents query for nagpur (Status 200)
[urbanLinkCore] ✓ PASS: Admin map data for nagpur (Facilities: 200)

--- 2. Testing Sentinel Multi-Hazard Endpoints ---
[sentinelEndpoints] ✓ PASS: Live Hazard Feed for mumbai (Temp: 27.8°C, Rain: 0.3mm/h, Risk: MODERATE)
[sentinelEndpoints] ✓ PASS: Connector Health Monitor for mumbai (7 connectors active)
[sentinelEndpoints] ✓ PASS: Alert Review & Approval for mumbai (Pending: 0)
[sentinelEndpoints] ✓ PASS: Live Hazard Feed for pune (Temp: 24.4°C, Rain: 0.3mm/h, Risk: LOW)
[sentinelEndpoints] ✓ PASS: Connector Health Monitor for pune (7 connectors active)
[sentinelEndpoints] ✓ PASS: Alert Review & Approval for pune (Pending: 0)
[sentinelEndpoints] ✓ PASS: Live Hazard Feed for nagpur (Temp: 25.3°C, Rain: 0mm/h, Risk: LOW)
[sentinelEndpoints] ✓ PASS: Connector Health Monitor for nagpur (7 connectors active)
[sentinelEndpoints] ✓ PASS: Alert Review & Approval for nagpur (Pending: 0)

--- 3. Testing Risk Assessment & Hydrological Simulation ---
[sentinelEndpoints] ✓ PASS: Real-Time Explainable Assessment (Mumbai) (Score: 24/100, Level: LOW)
[sentinelEndpoints] ✓ PASS: Monsoon Stress-Test Simulation (Mumbai 50 mm/h) (Scenario Score: 49/100, Watermarked: true)

--- 4. Testing Strict City Boundary Isolation ---
[cityIsolation] ✓ PASS: Mumbai Map Layers Ingestion (Hotspots: 35, Sinks: 15)
[cityIsolation] ✓ PASS: Pune Boundary Isolation (Zero Mumbai Flood Data Leakage)
[cityIsolation] ✓ PASS: Nagpur Boundary Isolation (Zero Mumbai Flood Data Leakage)
[cityIsolation] ✓ PASS: Unsupported City Rejection (Rejected with HTTP 400)

--- 5. Testing Sentinel Safety Assistant (Groq RAG) ---
[aiSafetyAudit] ✓ PASS: Conversational AI Grounded Response (Length: 1526 chars, Refers to official BMC status)

--- 6. Auditing Spatial Data Files on Disk ---
[dataIntegrity] ✓ PASS: Mumbai 10 GIS Spatial Layers in data/mumbai/flood_spatial (10 files verified)
[dataIntegrity] ✓ PASS: Pune Civic Facilities & Boundaries in data/pune (28 files verified)
[dataIntegrity] ✓ PASS: Nagpur Civic Facilities & Zones in data/geodata (14 files verified)

--- 7. Scanning Client Source Files for Leaked Credentials ---
[securityAudit] ✓ PASS: Client-Side Code Secret Leak Scan (0 sensitive environment tokens found)

SUITE COMPLETE: 29 / 29 TESTS PASSED (100%)
```

---

## 7. Handover Notes for Prompt 2

Prompt 1 acceptance criteria have been achieved:
- **Design Tokens:** Complete and robust token foundation in `src/app/globals.css`.
- **Readability:** All glassmorphism transparency bugs resolved; overlays are $\ge 97\%$ opaque.
- **Layout & Stacking:** Zero card clipping, zero modal/map collision, responsive adaptive widths on desktop and mobile.
- **Interaction Clarity:** Active navigation states are high-contrast and unmistakable across admin and citizen views.
- **Architectural Preservation:** Zero routes altered, zero database changes, zero regressions in backend or AI pipeline.

The project is fully prepared and hardened for **Prompt 2**.
