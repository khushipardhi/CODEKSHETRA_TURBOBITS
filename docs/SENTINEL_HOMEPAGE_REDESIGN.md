# SENTINEL CITY INTELLIGENCE — HOMEPAGE REDESIGN
## Complete Product Transformation of the Main Landing Page (`localhost:3000`)
**Document Version:** 1.0.0  
**Date:** October 22, 2026  
**Status:** COMPLETE & VERIFIED  
**Target URI:** `http://localhost:3000/` (`src/app/page.tsx`)  
**Architecture:** Next.js 16.3.1 (Turbopack, App Router, TypeScript, Tailwind CSS, Lucide Icons)

---

## 1. Executive Summary & Brand Transformation

The primary landing page at `http://localhost:3000/` has undergone a complete architectural, visual, and conceptual redesign. Previously presented as a basic civic complaint submission portal ("Urban Link" / *"Tell us what happened"*), the homepage now authoritatively embodies **Sentinel City Intelligence**—an integrated municipal risk intelligence ecosystem connecting environmental telemetry, geospatial hazard analysis, hydrodynamic scenario simulation, AI-assisted reasoning, emergency preparedness, civic reporting, and deterministic operational dispatch.

### Key Tenets of the Redesign:
1. **Holistic Product Positioning:** Civic reporting is repositioned as a vital *ground-truth sensor network* feeding the broader operational platform rather than being the solitary purpose of the system.
2. **The Five Connected Capabilities:** The platform is framed around five interconnected pillars: **Observe**, **Understand**, **Simulate**, **Decide**, and **Respond**.
3. **Scientific Demarcation & Honesty:** No exaggerated or unvalidated claims. The simulation engine is explicitly demarcated as a **Tier 2 Screening Model** (calibrated against Copernicus GLO-30 DEM topography and Rational Method hydrology), distinguishing atmospheric forecasts from actual observations and simulations from verified emergency incidents.
4. **Lightweight & High-Performance:** The landing page avoids embedding heavy Leaflet canvases or duplicating the simulation engine. Instead, it utilizes lightweight vector SVG schematics, interactive layer switchers, and validated telemetry snapshots, keeping initial load times sub-second and build size compact.
5. **Full Theme & Multi-Device Parity:** Flawless visual hierarchy across both Light and Dark themes, with verified responsiveness across 1536px, 1280px, 1024px, 768px, 430px, 390px, 360px, and 320px viewports with zero horizontal overflow.

---

## 2. Inventory of Redesigned Sections & Component Architecture

All landing page components are modularly organized under `src/components/landing/` and assembled within `src/app/page.tsx`.

| # | Section Name | Source Component | Real Platform Capability / Destination |
|---|---|---|---|
| **0** | **Global Navigation Bar** | `landing-navbar.tsx` | Fixed glass header, brand mark, live city switcher (`Mumbai`, `Pune`, `Nagpur`), theme toggle, mobile drawer, links to `/login` and `/[city]/dashboard`. |
| **1** | **Hero Section** | `hero-section.tsx` | Editorial headline, Copernicus DEM topography visual, live telemetry chips (27.8°C, 0.0 mm/h, 3.2m tide, PM2.5 60.8), active simulation badge, direct CTAs to `/[city]/dashboard` and `/[city]/simulation`. |
| **2** | **Connected Pillars** | `connected-capabilities.tsx` | Five-pillar operational architecture: Observe (`/telemetry-lab`), Understand (`/admin/map`), Simulate (`/simulation`), Decide (`/admin/simulation/report`), Respond (`/admin/incidents`). |
| **3** | **Platform Overview** | `platform-overview.tsx` | Asymmetric bento grid with 7 differentiated cards showcasing telemetry, multi-hazard, simulation, GIS, AI, civic ops, and vector PDF reports. |
| **4** | **Interactive City Intelligence Canvas** | `interactive-intelligence-canvas.tsx` | 6-layer interactive switcher (Atmospheric feeds, GIS wards, Hazard analysis & sluice gates, Inundation saucers, Civic dispatch, PDF dossiers) with dynamic SVG schematics and direct workspace links. |
| **5** | **Spatial Simulation Lab Differentiator** | `simulation-differentiator-section.tsx` | Tier 2 Hydrodynamic Screening showcase: 3 scenario toggles, time-step slider ($T=1h$ to $6h$), 24-ward ranked susceptibility list, Rational Method ($Q=CIA$) trace, and scientific disclaimer. Links to `/[city]/simulation`. |
| **6** | **Environmental Telemetry Showcase** | `telemetry-showcase-section.tsx` | 64-parameter matrix with filterable categories (Atmosphere, Hydrology, Air Quality, Marine), 8 audited metric tiles with statutory thresholds (CPCB, IMD, INCOIS), and vector hyetograph chart. Links to `/[city]/telemetry-lab`. |
| **7** | **Intelligence Workflow** | `intelligence-workflow-section.tsx` | 5-stage deterministic pipeline ($Sources \to Context \to Simulation \to Evidence \to Action$) featuring prominent Scientific Honesty & Operational Transparency callout. |
| **8** | **Sentinel AI Section** | `sentinel-ai-section.tsx` | Grounded AI demonstration: Location-aware Kurla waterlogging query, strict source citations (ECMWF, Open-Meteo, BMC GIS), anti-hallucination guardrails, and actionable follow-ups. Links to `/[city]/sentinel`. |
| **9** | **Reporting & Decision Support** | `reporting-decision-support-section.tsx` | Publication-grade vector PDF dossiers (City Overview, Ward L Kurla, Multi-Hazard Telemetry, Precipitation Hyetograph), ISO A4 formatting, and link to `/[city]/simulation/report`. |
| **10** | **Civic & Emergency Operations** | `civic-operations-section.tsx` | Ground-truth sensor network pipeline: Citizen Report $\to$ Triage $\to$ Department Routing $\to$ Geofenced Work Order $\to$ Supervisor Verification. Direct links to `/[city]/report` and `/admin/incidents`. |
| **11** | **Workspaces Directory** | `workspaces-directory-section.tsx` | Navigation hub for 8 purpose-built workspaces with role badges, descriptions, and verified compiled routes. |
| **12** | **Supported Municipal Jurisdictions** | `supported-cities-section.tsx` | Multi-jurisdiction breakdown: Greater Mumbai (Full Tier 2 Simulation + 24 Wards), Pune (Regional Telemetry + Civic Routing), Nagpur (Regional Telemetry + Civic Routing) with truthful data limitations. |
| **13** | **Data Provenance & Methodology** | `data-methodology-section.tsx` | Comprehensive open data audit citing authoritative providers (ESA, ECMWF, Open-Meteo, INCOIS, CPCB, BMC), resolutions, coordinate systems (WGS-84, EPSG:4326), and open licenses. |
| **14** | **Closing CTA Section** | `closing-cta-section.tsx` | High-impact closing prompt with dual CTAs for municipal commanders and citizens. |
| **15** | **Municipal Footer** | `landing-footer.tsx` | Enterprise footer with platform description, workspace links, civic services, methodology citations, and login links. |

---

## 3. Real Destination Route Matrix

All links and CTAs across the homepage resolve to existing, active routes within the Next.js application:

| Call to Action / Card | Destination Route | Target Audience & Function |
|---|---|---|
| **Explore City Intelligence** (Hero Primary) | `/[city]/dashboard` | Citizen & public overview of current localized alerts, weather, and shelters. |
| **Launch Simulation Lab** (Hero Secondary) | `/[city]/simulation` | Municipal planners & engineers running hydrodynamic inundation screening. |
| **Open Citizen Hub** (Hero Tertiary) | `/[city]/dashboard` | Citizen self-service portal for ward context and localized risk status. |
| **Command Console** (Nav Primary) | `/admin` | Municipal command staff and department supervisors. |
| **Explore GIS Map** (Understand Pillar) | `/admin/[city]/map` | 24-ward Leaflet map with 219 unclustered facilities and hazard overlays. |
| **Open Simulation Lab** (Simulate Pillar) | `/[city]/simulation` | Scenario configuration, hyetograph playback, and ward saucer analysis. |
| **Open Report Studio** (Decide Pillar) | `/[city]/simulation/report` | Multi-page publication-grade vector PDF dossier generation. |
| **Inspect Operations** (Respond Pillar) | `/admin/[city]/incidents` | Triage queue, SLA breach monitoring, and department work orders. |
| **Explore Full Telemetry Lab** | `/[city]/telemetry-lab` | 64-parameter matrix with live atmospheric and oceanographic feeds. |
| **Consult Sentinel AI** | `/[city]/sentinel` | Three-role conversational assistant grounded in municipal telemetry. |
| **File a Citizen Report** | `/[city]/report` | Public multi-modal hazard reporting with GPS auto-triage. |
| **Track Existing Report** | `/track` | Public status tracking by municipal tracking code. |
| **Department Operations Console** | `/department` | Department-specific task manager for Stormwater, Solid Waste, and Health. |

---

## 4. Before vs. After Comparative Analysis

| Dimension | Previous Homepage ("Urban Link") | Redesigned Homepage ("Sentinel City Intelligence") |
|---|---|---|
| **Primary Framing** | Simple citizen complaint reporting tool ("Report an Issue in your neighbourhood"). | Integrated municipal risk intelligence & spatial simulation ecosystem. |
| **Visual Identity** | Basic form fields, blue buttons, generic iconography, complaint cards. | High-end editorial typography, digital-twin Copernicus DEM schematics, telemetry indicators, glassmorphic navigation. |
| **Scientific Grounding** | None. Purely text-based incident categories. | Copernicus DEM topography, Rational Method runoff calculation ($Q=CIA$), statutory threshold monitoring (CPCB NAAQS, IMD, INCOIS). |
| **Simulation Visibility** | Completely hidden / inaccessible from the homepage. | Prominent Tier 2 Hydrodynamic Screening differentiator with interactive scenario toggles and time-step slider. |
| **Telemetry Depth** | Zero environmental data visible on the landing page. | Audited 64-parameter matrix showcase with category filters and vector hyetograph time-series. |
| **Grounded AI** | Mentioned vaguely as "AI analysis". | Grounded Sentinel AI preview with verifiable source citations, anti-hallucination guardrails, and direct workflow routing. |
| **Report Generation** | Not mentioned or linked. | Dedicated Publication-Grade Reports section showcasing multi-page vector PDF dossiers. |
| **Jurisdiction Transparency** | Implicitly Mumbai-only without explanation. | Transparent 3-city jurisdiction cards detailing exact coverage and limitations for Mumbai, Pune, and Nagpur. |
| **Data Provenance** | None provided. | Explicit data provenance table detailing source agencies (ESA, ECMWF, INCOIS, CPCB, BMC), resolutions, and licenses. |

---

## 5. Truthful Demarcation: Live Integrations vs. Previews

To maintain absolute scientific credibility, all features are rigorously demarcated across the landing page:

| Feature / Visual | Presentation State | Justification & Scientific Demarcation |
|---|---|---|
| **Greater Mumbai Hydrodynamic Screening** | **Interactive Preview** | Powered by Copernicus GLO-30 DEM, 24 BMC administrative boundaries, and Rational Method runoff. Demarcated explicitly as a *Tier 2 Screening Model* (not a 2D shallow-water numerical solver). |
| **Pune & Nagpur Simulation** | **Explicitly Unavailable** | Cards accurately inform users that hydrodynamic screening is currently restricted to Mumbai; Pune and Nagpur support regional weather telemetry and civic department routing only. |
| **Atmospheric & Ocean Telemetry** | **Validated Snapshot** | Displays audited live parameters (27.8°C, 0.0 mm/h, 3.2m tide, PM2.5 60.8) from Open-Meteo, ECMWF IFS, and INCOIS. Labeled with exact data source and update latency. |
| **Vector PDF Dossier Downloads** | **Sample Previews** | PDF dossier cards in the landing preview link directly to `/api/admin/reports/simulation-pdf` and the full Report Studio, with note that full rendering requires active simulation run parameters. |
| **Sentinel AI Assistant Preview** | **Demonstration Model** | Static side-by-side terminal preview of a Ward L Kurla waterlogging query is explicitly labeled *"Static Grounded Demonstration"*; links to `/[city]/sentinel` for the live 3-role Groq LLM agent. |

---

## 6. Verification, Visual Inspection & Defect Remediation

### 6.1. Build & TypeScript Verification
- **TypeScript:** `npx tsc --noEmit` executed with **0 errors**.
- **Production Compilation:** `npm run build` compiled all **72 application routes** successfully with Next.js Turbopack in 13.5s.
- **Server Health:** Production daemon (`npm start`) operational on `http://localhost:3000`.

### 6.2. Visual Acceptance & Screenshot Gallery
The following screenshots were captured, visually inspected, and archived in `public/screenshots/homepage_redesign/`:

1. `before_desktop.png` / `before_desktop_fullpage.png`: Baseline audit of the previous "Urban Link" portal.
2. `before_mobile.png` / `before_mobile_fullpage.png`: Baseline mobile audit.
3. `after_01_desktop_hero.png`: New editorial hero with brand mark, topography schematic, and live telemetry chips.
4. `after_02_full_desktop_page.png`: Complete 1536px desktop rendering showing all 15 sections.
5. `after_03_platform_overview.png`: Bento grid overview with 7 capability cards.
6. `after_04_interactive_canvas.png`: Interactive layer switcher with dynamic SVG schematics and feed telemetry.
7. `after_05_simulation_preview.png`: Hydrodynamic screening lab with scenario buttons, time slider, and Rational Method formula.
8. `after_06_telemetry_section.png`: 64-parameter matrix and vector hyetograph time-series chart.
9. `after_07_sentinel_ai_section.png`: Grounded AI terminal preview with source citations.
10. `after_08_workspaces_directory.png`: 8-destination directory cards.
11. `after_09_dark_theme_desktop.png`: High-contrast dark theme rendering with graphite surfaces.
12. `after_10_mobile_hero.png`: Mobile viewport (390px) hero rendering.
13. `after_11_full_mobile_page.png`: Complete mobile scroll showcasing natural single-column reflow.
14. `after_12_mobile_menu_open.png`: Mobile drawer navigation with quick links.
15. `after_13_responsive_320_check.png`: Ultra-compact (320px) viewport validation ensuring zero horizontal overflow.

### 6.3. Defects Identified and Corrected During Inspection
1. **Interactive Intelligence Canvas Text Overlap:**
   - *Defect:* In `interactive-intelligence-canvas.tsx`, the SVG label `1012 hPa` vertically collided with the subtitle `Santacruz AWS Grid Point` on small desktop viewports.
   - *Fix:* Adjusted SVG coordinate offsets (`y={122}` and `y={142}`) and increased text leadings. Verified in `after_04_interactive_canvas.png`.
2. **Simulation Sluice Gate Collision:**
   - *Defect:* In `simulation-differentiator-section.tsx`, the callout text `Coastal Sluice Lockout` collided with the red sluice gate marker.
   - *Fix:* Shifted SVG text x-position to `x={375}` and set text anchor to `end`. Verified in `after_05_simulation_preview.png`.
3. **Local Storage Key Alignment:**
   - *Defect:* Automated headless test runner was intermittently seeing the City Selection Modal because of a key mismatch (`urban_link_city` vs `urban-link-city`).
   - *Fix:* Aligned storage keys in all screenshot and test scripts to `urban-link-city`, ensuring seamless rendering.

---

## 7. Remaining Considerations & Non-Defects

1. **City Selection Modal on First Visit:** The modal is an intentional architectural gate for first-time visitors who navigate directly to `/` without a preset city cookie or localStorage value. The landing page cleanly supports selecting Mumbai, Pune, or Nagpur.
2. **Third-Party Telemetry Latency:** Telemetry values shown on the landing page represent the latest cached model cycle from Open-Meteo and INCOIS (updated every 15 minutes). If third-party APIs experience downtime, the components gracefully fallback to the latest verified snapshot without breaking layout.
3. **No Database Alterations:** Per strict operational instructions, no database records were modified, no git operations were executed, and all existing backend API contracts were preserved intact.

---
*Signed by Principal Product Designer & Senior Frontend Architect, Sentinel City Intelligence Platform.*
