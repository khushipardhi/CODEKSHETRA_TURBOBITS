# SENTINEL CITY INTELLIGENCE — PHASE 3 TECHNICAL HANDOVER
## Spatial Simulation Reliability, Stable Playback, Consistent Ward Navigation and Correct State Management

**Project:** Sentinel City Intelligence (formerly Urban Link)  
**System:** Spatial Simulation Lab (`/admin/[city]/simulation` & `/admin/[city]/simulation/report`)  
**Phase:** 3 of 10  
**Status:** COMPLETE & VERIFIED  
**Date:** October 2026  
**Engineering Discipline:** Senior Simulation Engineer, React Performance Specialist & GIS Application Architect  

---

### Executive Summary

In Phase 3 of 10, the **Spatial Simulation Lab** was audited and improved to resolve critical architectural defects reported in simulation playback, toolbar reflow, ward navigation, and report synchronization. Prior to this phase:
1. **Playback Lag & Freezing:** A blind `setInterval` continuously bumped `timeStep` while in-flight fetch requests were aborted by subsequent interval ticks. At 2x and 5x speeds, calculations never completed, freezing the map and ranking table while the timer counter raced ahead blindly.
2. **Toolbar Bouncing:** The top simulation header used `flex justify-between`. Dynamic mounting and unmounting of Model Tier badges and Data Quality tags on the left caused the central Play/Pause controls to shift horizontally across the screen continuously during simulation playback.
3. **Inconsistent Ward Navigation:** The map focus controller blocked re-centering if a previously selected ward was clicked again (`targetCanonical === prevWardRef.current`). Operators panning away to examine neighboring nullahs could not re-center on the active ward without selecting an intermediate ward first.
4. **Report Parameter Staleness Blindspot:** The Simulation Dossier Panel and Simulation Report Studio only checked scenario ID and time step hours, ignoring parameter variations (e.g., rainfall rate, astronomical tide, siltation blockage), leading to stale reports displaying mismatched metrics.

All four defect classes have been systematically resolved with zero rewrites to the core simulation engine or Leaflet basemap.

---

### Key Architectural Improvements

```
┌─────────────────────────────────────────────────────────────────────────────┐
│             SENTINEL ONE AUTHORITATIVE SIMULATION STATE MACHINE             │
├─────────────────────────────────────────────────────────────────────────────┤
│ • City: "mumbai"                • Jurisdiction: "Greater Mumbai (MCGM/BMC)" │
│ • Scenario: ID & Model Version  • Parameters: Key-Value Input Set           │
│ • Time Step: T (0.0h to maxT)   • Horizon: Duration (1h to 12h)             │
│ • Playback: Status & Speed (1x) • Selected Ward: Canonical Ward ID          │
│ • Calculation Version: v_seq_ts • Quality Status: VALIDATED / PROVISIONAL   │
│ • Report Version: Dossier ID    • Result Cache: In-Memory 0ms Replay Map    │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
        ┌──────────────────────────────┼──────────────────────────────┐
        ▼                              ▼                              ▼
┌──────────────────┐          ┌──────────────────┐          ┌──────────────────┐
│ STABLE HEADER    │          │ LEAFLET CANVAS   │          │ DOSSIER STUDIO   │
│ 3-Column Grid    │          │ Real 24 Wards    │          │ Outdated Warning │
│ Fixed Widths     │          │ MultiPolygon Fit │          │ Sync with Inputs │
│ Tabular Numeral  │          │ Isoband Updates  │          │ Deep Comparison  │
└──────────────────┘          └──────────────────┘          └──────────────────┘
```

---

### 1. Establish One Authoritative Simulation State

Prior implementations maintained fractured pieces of simulation state across the workspace header, Leaflet map component, drawer tabs, and report panels.

**Implementation:**
- Built the unified `AuthoritativeSimulationState` contract in [use-simulation-playback.ts](file:///e:/urbanhazards/urban_link-master/src/components/admin/simulation/use-simulation-playback.ts).
- Centralized all simulation coordinates into a single immutable bundle:
  - `city`: Current municipal jurisdiction (`"mumbai"`).
  - `jurisdiction`: Display authority (`"Greater Mumbai (MCGM / BMC)"`).
  - `scenarioId` & `modelVersion`: Active scenario definition and engine release.
  - `parameters`: Exact input parameter dictionary (`rainfallRateMmH`, `astronomicalTideM`, `drainageBlockagePct`, `durationHours`, etc.).
  - `timeStep` & `maxDuration`: Selected simulation step and horizon boundary.
  - `playbackStatus` & `playbackSpeed`: Machine state (`"idle" | "playing" | "paused" | "calculating"`) and multiplier (1x, 2x, 5x).
  - `selectedWardId`: Canonical ward identity (e.g., `"L"`, `"A"`, `"F/South"`).
  - `calculationVersion`: Monotonic request sequence ID and execution timestamp.
  - `qualityStatus`: Data tier (`"VALIDATED" | "PROVISIONAL" | "PARTIALLY_CALIBRATED"`).
  - `reportVersion`: Deterministic dossier identifier synchronized with current calculation version.
  - `simResult`: Full `SimulationResult` payload driving all UI surfaces simultaneously.

---

### 2. Deterministic Playback Lifecycle & Sequential Step Advancement

**Root Cause of Playback Freezing:**
The legacy hook relied on `setInterval(() => setTimeStep(prev => prev + 0.5), intervalMs)` coupled to a React `useEffect([timeStep])`. If a network calculation required 350ms, a subsequent 400ms tick dispatched an `abortController.abort()`, cancelling the calculation before completion. The map and ranked table froze while the time counter raced ahead.

**Solution (`use-simulation-playback.ts`):**
- **Single Timer Ownership:** Replaced blind `setInterval` with a recursive sequential step loop (`schedulePlaybackTick`).
- **Calculation Coordination:** Time step advancement **awaits calculation completion** before scheduling the subsequent tick. Time never races ahead of unrendered spatial surfaces.
- **Background Pre-fetching:** While step $T$ is displaying, the controller automatically prefetches $T + \Delta t$ into the in-memory cache in the background during the pacing delay (1800ms / 900ms / 360ms). When the tick fires, the next step resolves in **0ms**.
- **Prompt Pause:** Clicking Pause sets `isPlayingRef.current = false` and clears `playbackTimeoutRef.current` immediately.
- **Idempotent Play:** Repeated clicks on Play are strictly idempotent; they never spawn duplicate timers or overlapping loops.
- **Scrubbing & Reset Safety:** Scrubbing the timeline slider or clicking Reset (`T=0`) cancels active playback loops cleanly and evaluates the target time step deterministically.
- **Speed Isolation:** Speed changes (1x, 2x, 5x) adjust the pacing timeout delay only; they never alter scientific input parameters.
- **Unmount Cleanup:** Component unmount aborts in-flight fetch requests and nullifies active timers.
- **Last Valid Result Retention:** If a network failure occurs, the engine preserves the last valid `simResult` on screen and displays an error banner rather than blanking the map.

---

### 3. Header Stability & Elimination of Toolbar Bouncing

**Root Cause of Bouncing:**
The simulation workspace header used `flex justify-between`. When calculating status changed or model tier badges (`TIER_1_...`, `TIER_2_...`) mounted conditionally into the DOM, the center playback container shifted left and right continuously.

**Solution (`simulation-map-workspace.tsx`):**
- **3-Column CSS Grid:** Migrated `<header>` to `grid grid-cols-[1fr_auto_1fr] items-center px-3 sm:px-4 h-14 border-b border-divider bg-card shrink-0 z-20 gap-2`.
- **Mathematical Dead-Center:** The center playback controls container is anchored with `justify-self-center`. DOM insertions or width variations in the left or right columns have **zero impact** on the horizontal position of Play/Pause/Scrub controls.
- **Fixed-Width Reserved Slots:**
  - Calculation status slot: Fixed `w-[135px]` (`CALCULATING...` vs `MESH SYNCED`).
  - Play/Pause button: Fixed `w-[84px]` with fixed `w-11` label text.
  - Time step indicator: Fixed `w-[125px]` with CSS `tabular-nums` to eliminate character-width jitter.
  - Alert level badge slot: Fixed `w-[130px]` (`RED ALERT`, `ORANGE WATCH`, `NORMAL`).
- **Responsive Mobile Layout:** Below 768px, the layout auto-collapses drawers into floating pills (`Scenario A: ... T=2.5h` and `Ward L 99.7`), maintaining full map visibility without horizontal overflow.

---

### 4. Reliable Ward Navigation & MultiPolygon Resolution

**Root Cause of Navigation Failure:**
`MapWardFocusController` in `leaflet-simulation-map.tsx` blocked focus if `targetCanonical === prevWardRef.current`. If an operator clicked Ward L, panned away to inspect neighboring catchment areas, and clicked Ward L again, the map ignored the action completely.

**Solution:**
- **Ward Focus Trigger:** Added `wardFocusTrigger: number` counter passed from `simulation-map-workspace.tsx` through `LeafletSimulationMap` to `MapWardFocusController`.
- **Re-Centering Guarantee:** Whenever a ward is selected from the map, the Ward Select dropdown, the Ranked Wards table, or an explicit "📍 Locate" button, `handleSelectWard(wardId, true)` increments `wardFocusTrigger`.
- **Robust Bounding Box Calculation:** `computeGeometryBounds` in [canonical-gis.ts](file:///e:/urbanhazards/urban_link-master/src/modules/geo/canonical-gis.ts) parses GeoJSON coordinates:
  - Single Polygons with exterior boundaries and interior holes.
  - MultiPolygons with separated landmasses (e.g., Madh Island in Ward P/North).
  - Inverts [lng, lat] GeoJSON coordinates to Leaflet [lat, lng].
- **Map Container Invalidation:** Calls `map.invalidateSize()` before `map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15.0 })`, preventing geometry clipping after drawer transitions.
- **Office Coordinates Fallback:** If bounding box calculation fails, cleanly flies to official ward office coordinates (`map.flyTo([lat, lng], 13.5)`).

---

### 5. Report Synchronization & Parameter Staleness

**Root Cause:**
Previously, reports in `simulation-dossier-panel.tsx` and `simulation-report-studio.tsx` only compared `scenarioId` and `timeStepHours`. Changing rainfall from 45 mm/h to 110 mm/h did not flag the report as outdated.

**Solution:**
- Extended `isStale` in [simulation-dossier-panel.tsx](file:///e:/urbanhazards/urban_link-master/src/components/admin/simulation/simulation-dossier-panel.tsx) and `isScenarioOutOfDate` in [simulation-report-studio.tsx](file:///e:/urbanhazards/urban_link-master/src/components/admin/simulation/simulation-report-studio.tsx) to deeply compare `parametersApplied`:
  ```typescript
  const isStale = useMemo(() => {
    if (!dossier) return false;
    if (dossier.scenarioId !== simOutput.activeScenarioId) return true;
    if (Math.abs(dossier.timeStepHours - simOutput.timeStepHours) > 0.01) return true;
    if (dossier.parametersApplied && simOutput.parametersApplied) {
      for (const [k, v] of Object.entries(simOutput.parametersApplied)) {
        if (dossier.parametersApplied[k] !== undefined && dossier.parametersApplied[k] !== v) {
          return true;
        }
      }
    }
    return false;
  }, [dossier, simOutput]);
  ```
- Any modification to rainfall, tide, duration, or siltation blockage immediately flags the report as outdated and presents a 1-click **Refresh Dossier** action.

---

### Verification & Automated Test Evidence

#### 1. Automated Test Suite Results
Executed [scripts/test-phase3-simulation-reliability.mjs](file:///e:/urbanhazards/urban_link-master/scripts/test-phase3-simulation-reliability.mjs):
```
========================================================================
  SENTINEL PHASE 3: SIMULATION RELIABILITY & PLAYBACK SUITE
  Target URL: http://localhost:3000
========================================================================

=== SUITE 1: Authoritative Simulation State Schema ===
  ✔ PASS: Authoritative simulation output payload contains complete contract attributes

=== SUITE 2: Time Advancement & Step Coordination ===
  ✔ PASS: Temporal evolution verified: T=1.0h (75mm) -> T=3.0h (225mm) with real calculation update

=== SUITE 3: Header Anti-Bounce & Stability Verification ===
  ✔ PASS: Header layout stability verified: 3-column CSS grid, fixed widths, tabular numerals

=== SUITE 4: Reliable Ward Navigation & MultiPolygon Resolution ===
  ✔ PASS: Ward navigation verified: canonical identity, MultiPolygon bound calculation, [50, 50] padding

=== SUITE 5: Playback Controller Lifecycle & Cancellation ===
  ✔ PASS: Playback controller verified: sequential step loop, prefetching, prompt pause, clean cleanup

=== SUITE 6: Report Staleness & Parameter Synchronization ===
  ✔ PASS: Report synchronization verified: parameter change immediately marks dossier report as outdated

=== SUITE 7: Non-Temporal Scenario Limitation Disclaimers ===
  ✔ PASS: Scientific honesty verified: Non-hydrodynamic screening limitations clearly documented

========================================================================
  PHASE 3 SUMMARY: 7/7 TESTS PASSED (0 failed)
========================================================================
```

#### 2. Regression Testing
- [test-phase2-incident-map.mjs](file:///e:/urbanhazards/urban_link-master/scripts/test-phase2-incident-map.mjs): **26/26 PASSED** (0 failed).
- [test-phase2-simulation.mjs](file:///e:/urbanhazards/urban_link-master/scripts/test-phase2-simulation.mjs): **13/13 PASSED** (0 failed).

#### 3. TypeScript Compilation
Executed `npx tsc --noEmit`:
- **Exit Code: 0** (0 diagnostic errors).

#### 4. Production Build Verification
Executed `npm run build`:
- **Exit Code: 0**. Compiled successfully in 7.1s; 71/71 static and dynamic pages generated without warnings or runtime errors.

---

### Visual Verification Artifacts

All 10 actual verification screenshots have been captured and saved to `public/screenshots/phase3_simulation_reliability/`:

| Artifact | File Name | Description | Verification Finding |
|---|---|---|---|
| **01** | `01_initial_simulation_state.png` | Initial Spatial Simulation Lab state | T=1.0h, MESH SYNCED pill, dead-center playback controls, Ward L selected, continuous hazard surface rendered. |
| **02** | `02_actively_playing_playback.png` | Actively playing simulation loop | Amber CALCULATING... pulse, PLAY toggled to PAUSE, time advanced to T=1.5h, dossier card displays OUTDATED badge. |
| **03** | `03_paused_playback_state.png` | Paused playback state | Playback stopped promptly on Pause click; calculation state committed and synchronized with map. |
| **04** | `04_later_time_step_evolution.png` | Later time step (T=4.0h) | Accumulated rainfall advanced, hazard isobands expanded dynamically, gauge reflects evolving severity. |
| **05** | `05_different_inputs_recalculated.png` | Parameter modification (90 mm/h, 6h) | Engine recalculated surface under extreme monsoon forcing; higher peak severity reflected on 24 wards. |
| **06** | `06_selected_ward_focused.png` | Ward L focused with bounds fitting | Bounding box computed with [50, 50] padding; blue selection border active; demographic exposure panel open. |
| **07** | `07_stable_header_inspection.png` | Top header ribbon high-resolution clip | 3-column CSS grid verification showing dead-center alignment, fixed-width slots, and tabular numerals. |
| **08** | `08_mobile_responsive_layout.png` | Mobile viewport (390 x 844) | Drawers auto-collapse into floating scenario and ward pills; map and legend remain prominent without overflow. |
| **09** | `09_ranked_ward_selection.png` | Ranked Wards list tab & ward selection | 24 wards sorted by severity; selecting Ward F/South highlights polygon and fits bounds cleanly. |
| **10** | `10_report_staleness_sync.png` | Report Studio parameter synchronization | Full-width report studio displays verified inputs and synchronizes with simulation parameters. |

---

### Files Modified & Created

1. **Modified Core Hook:**
   - [src/components/admin/simulation/use-simulation-playback.ts](file:///e:/urbanhazards/urban_link-master/src/components/admin/simulation/use-simulation-playback.ts) — Implemented authoritative simulation state, sequential step advancement, in-memory LRU cache, and pre-fetching.
2. **Modified Map Workspace:**
   - [src/components/admin/simulation/simulation-map-workspace.tsx](file:///e:/urbanhazards/urban_link-master/src/components/admin/simulation/simulation-map-workspace.tsx) — Migrated header to 3-column CSS grid, added `wardFocusTrigger`, wired up `handleSelectWard` across tabs.
3. **Modified Leaflet Map:**
   - [src/components/admin/simulation/leaflet-simulation-map.tsx](file:///e:/urbanhazards/urban_link-master/src/components/admin/simulation/leaflet-simulation-map.tsx) — Added `wardFocusTrigger` support to `MapWardFocusController` for consistent ward navigation.
4. **Modified Dossier Panel:**
   - [src/components/admin/simulation/simulation-dossier-panel.tsx](file:///e:/urbanhazards/urban_link-master/src/components/admin/simulation/simulation-dossier-panel.tsx) — Added deep parameter comparison to `isStale`.
5. **Modified Report Studio:**
   - [src/components/admin/simulation/simulation-report-studio.tsx](file:///e:/urbanhazards/urban_link-master/src/components/admin/simulation/simulation-report-studio.tsx) — Added parameter comparison to `isScenarioOutOfDate`.
6. **Modified Dossier Schema & Orchestration:**
   - [src/modules/dossier/contracts.ts](file:///e:/urbanhazards/urban_link-master/src/modules/dossier/contracts.ts) & [src/modules/dossier/orchestrator.ts](file:///e:/urbanhazards/urban_link-master/src/modules/dossier/orchestrator.ts) — Added `parametersApplied` to `CanonicalSimulationDossier`.
7. **Created Test & Capture Scripts:**
   - [scripts/test-phase3-simulation-reliability.mjs](file:///e:/urbanhazards/urban_link-master/scripts/test-phase3-simulation-reliability.mjs) — 7-suite automated reliability test.
   - [scripts/capture-phase3-simulation-verification.mjs](file:///e:/urbanhazards/urban_link-master/scripts/capture-phase3-simulation-verification.mjs) — 10-state Puppeteer screenshot capture.
8. **Created Documentation:**
   - [docs/SENTINEL_PHASE3_SIMULATION_RELIABILITY.md](file:///e:/urbanhazards/urban_link-master/docs/SENTINEL_PHASE3_SIMULATION_RELIABILITY.md) — Comprehensive technical handover documentation.
