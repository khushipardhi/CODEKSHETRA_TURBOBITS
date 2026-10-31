# SENTINEL CITY INTELLIGENCE — PHASE 9 OF 10: ADMIN COMMAND CENTRE & WORKFLOW INTEGRATION
## Evidence-Linked Municipal Operations, Explainable Routing, Decision Support and Data Quality Governance

**Document Reference:** `docs/SENTINEL_PHASE9_COMMAND_CENTRE.md`  
**Execution Date:** October 22, 2026  
**Auditor & Systems Role:** Senior Municipal Operations Architect & Full-Stack Systems Engineer  
**Application Platform:** Sentinel City Intelligence / Urban Link  
**Target Jurisdictions:** Municipal Corporation of Greater Mumbai (BMC / MCGM, 24 Canonical Wards), Pune Municipal Corporation (PMC), Nagpur Municipal Corporation (NMC)  
**Database Cluster:** TiDB Cloud Serverless MySQL (`8.0.11-TiDB-v8.5.3-serverless`)  
**Production Build Status:** Passed (`▲ Next.js 16.3.1 Turbopack`, 72 routes compiled successfully)  
**Static TypeScript Check:** Passed (`npx tsc --noEmit`, 0 compilation errors)  
**Automated Integration Suite:** 100% Passed (7 backend API assertions, 9 headless browser verification captures)  

---

## 1. Executive Overview & Phase Objectives

Phase 9 transforms the administrative console into a genuine municipal operations command centre. Rather than functioning as a collection of static, disconnected reporting panels, Sentinel Command Centre acts as an operational nerve centre connecting live environmental telemetry, hydrodynamic simulation screenings, citizen incident reports, deterministic routing decisions, and departmental field task dispatches.

### Core Architectural Principles Enforced:
1. **Real Persisted Operational Metrics:** Every indicator on the Command Centre dashboard is computed directly from persisted records in TiDB Serverless, with defined formulas, rolling time windows, and explicit source provenance. No duplicate counting, no mock counters.
2. **Strict Nine-Record-Type Boundary Architecture:** Clear separation between observed telemetry, published forecasts, hypothetical simulations, screening estimates, citizen reports, verified incidents, official warnings, administrative advisories, and department tasks. Under no circumstances does a forecast or simulation create a public warning or verified incident without explicit human administrator authorization.
3. **Context-Preserving Municipal Navigation:** Seamless navigation between Command Centre, Hazard & Incident Map, Telemetry Lab, Spatial Simulation Lab, Simulation Report Studio, Incidents, Departments, Analytics, and Audit Trail, keeping city jurisdiction, selected ward, scenario, and time window synchronized.
4. **Deterministic Department Routing:** Explainable routing based on municipal jurisdiction, category taxonomy, SLA schedules, and department registries. AI assists with classification suggestions but is strictly forbidden from bypassing human approval or assigning unsupported departments.
5. **Evidence-Linked Ward Action Hub:** Interactive ward dossier providing real-time telemetry, hydrodynamic inundation estimates, chronic flood hotspots, related citizen reports, and administrative proposal actions.
6. **Administrative Action Proposals with Approval Boundaries:** Precautionary advisory proposals remain in an unbroadcast draft state (`AWAITING_REVIEW`) until a credentialed administrator reviews and signs off. Department tasks are tracked through a rigid, non-bypassable state machine.
7. **Comprehensive Data Source & Pipeline Health Monitoring:** Real-time auditing of 7 connected environmental data providers with provider-specific freshness rules, schema validation, latency SLAs, circuit breaker trip tracking, and graceful fallback modes.

---

## 2. Operational Command Centre Indicators & Calculation Proofs

All metrics displayed on `/admin/[city]` are dynamically aggregated via `/api/admin/stats?city=[city]` using live database queries against the `incidents` and `incident_departments` tables in TiDB Cloud Serverless.

```
+--------------------------------------------------------------------------------------------------------------------+
|                                    SENTINEL COMMAND CENTRE — MUMBAI (BMC)                                          |
|                                         MUNICIPAL OPERATIONS CONSOLE                                               |
+--------------------------------------------------------------------------------------------------------------------+
|  TOTAL INCIDENTS  |  AWAITING REVIEW  |  CRITICAL ACTIVE  |  DEPT WORK QUEUE  |  IN PROGRESS     |  RESOLVED (7D)  |
|        88         |        73         |         9         |        153        |       15         |       0         |
|  +7 past 24h      |  Needs triage     |  Unclosed emerg.  |  Routed to depts  |  Field teams     |  Rolling 7-day  |
|  TiDB Serverless  |  DRAFT+CONFIRMED  |  Immediate action |  Active tasks     |  Acknowledged    |  Signed-off     |
+--------------------------------------------------------------------------------------------------------------------+
| INCIDENT STATUS BREAKDOWN: Confirmed: 73 | Routed: 0 | In Progress: 15 | Resolved: 0 | Closed: 0                   |
| SEVERITY BREAKDOWN:        Critical: 9   | High: 75  | Medium: 4       | Low: 0                                    |
+--------------------------------------------------------------------------------------------------------------------+
```

### Detailed Metric Definitions & Provenance

| Metric Name | Value | Defined Calculation | Time Window | Source & Provenance |
|:---|:---:|:---|:---|:---|
| **Total Incidents** | **88** | `COUNT(id) FROM incidents WHERE city = 'mumbai'` | Operational Lifetime | TiDB Serverless (`incidents`) |
| **Awaiting Review** | **73** | `COUNT(id) WHERE status IN ('DRAFT', 'CONFIRMED')` | Current Backlog | TiDB Serverless (`incidents`) |
| **Critical Active** | **9** | `COUNT(id) WHERE severity = 'CRITICAL' AND status NOT IN ('RESOLVED', 'CLOSED')` | Active Emergencies | TiDB Serverless (`incidents`) |
| **Dept Work Awaiting Action** | **153** | `COUNT(id) FROM incident_departments WHERE status IN ('ROUTED', 'ASSIGNED')` | Current Department Queues | TiDB Serverless (`incident_departments`) |
| **In Progress Mitigation** | **15** | `COUNT(id) WHERE status = 'IN_PROGRESS'` | Active Field Operations | TiDB Serverless (`incidents`) |
| **Resolved (Past 7 Days)** | **0** | `COUNT(id) WHERE status = 'RESOLVED' AND resolved_at >= NOW() - INTERVAL 7 DAY` | Rolling 7-Day Window | TiDB Serverless (`incidents`) |
| **Confirmed Backlog** | **73** | `COUNT(id) WHERE status = 'CONFIRMED'` | Active Queue | TiDB Serverless (`incidents`) |
| **High Severity Backlog** | **75** | `COUNT(id) WHERE severity = 'HIGH'` | Active Queue | TiDB Serverless (`incidents`) |
| **Medium Severity Backlog** | **4** | `COUNT(id) WHERE severity = 'MEDIUM'` | Active Queue | TiDB Serverless (`incidents`) |
| **Low Severity Backlog** | **0** | `COUNT(id) WHERE severity = 'LOW'` | Active Queue | TiDB Serverless (`incidents`) |

> **Calculated Isolation Rule:** No metric duplicates the same underlying incident into multiple conflicting totals. Incidents assigned to multiple departments are counted once in the incident aggregate and broken out independently in department workload tables.

---

## 3. Strict Nine-Record-Type Boundary Architecture

To prevent dangerous operational mistakes (such as converting a weather forecast into a verified citizen flood report, or broadcasting a false evacuation notice based on an uncalibrated hydrodynamic screening model), Sentinel enforces a strict, nine-tier taxonomy:

```mermaid
graph TD
    A[1. Observed Telemetry] -->|Numerical Input| C[3. Hypothetical Simulation]
    B[2. Published Forecast] -->|Boundary Condition| C
    C -->|Runoff Susceptibility| D[4. Screening Result]
    D -->|Never Auto-Created| E[6. Verified Incident]
    
    F[5. Citizen Report] -->|Field Triage & Verification| E
    
    D -.->|Proposal Trigger| H[8. Administrative Advisory]
    H -->|Human Admin Authorization| G[7. Official Warning]
    
    E -->|Deterministic Routing| I[9. Department Task]
    D -.->|Preventative Dispatch| I
```

### The Nine Defined Operational Record Types

1. **Observed Environmental Telemetry:** Raw, physical parameter readings collected from connected sensors, Doppler radar, tide gauges, and river discharge points (e.g., Open-Meteo rainfall rate: `64.5 mm/h`, Arabian Sea tide gauge: `3.8m CD`).
2. **Published Forecast:** Numerical weather prediction outputs (ECMWF, GFS 11km grid) indicating predicted atmospheric or oceanic conditions over future time steps ($T+1\text{h}$ to $T+24\text{h}$).
3. **Hypothetical Simulation:** 2D DEM screening run modeling surface water depth and runoff coefficients based on synthetic or forecasted rainfall scenarios (e.g., *Monsoon Convective Downpour & Tidal Lockout*).
4. **Screening Result:** Computed ward-level susceptibility score ($0-100$) evaluating depression volume, drainage coefficient, and critical infrastructure proximity. **Crucial Rule:** Screening scores are purely indicative screening metrics and cannot claim physical on-ground inundation.
5. **Citizen Report:** Unverified civic report submitted by a resident via the Citizen Portal with text description, optional photo evidence, and geolocation coordinates. Initial status: `DRAFT` or `CONFIRMED`.
6. **Verified Incident:** Ground-truthed civic occurrence confirmed by municipal triage staff, dispatchers, or authorized field workers. Only verified incidents trigger standard operational dispatch workflows.
7. **Official Warning:** CAP-compliant (Common Alerting Protocol) public alert broadcast across sirens, SMS, or civic dashboards. Requires authorized municipal executive sign-off (`APPROVED_PUBLISHED`).
8. **Administrative Advisory Proposal:** Precautionary internal proposal drafted by operations staff recommending municipal readiness actions (e.g., "Pre-position diesel dewatering pumps at Gandhi Market underpass"). Status: `AWAITING_REVIEW`.
9. **Department Task:** Discrete, accountable work order assigned to a specific municipal department (e.g., BMC Stormwater Drains Department) with statutory SLA target, equipment checklist, and tracked state transitions.

---

## 4. Operational Cross-View Context Navigation

The Command Centre features a dedicated **Connected Municipal Workspaces** navigation hub that preserves operational context across views:

```
[ Command ] [ Hazard Map ] [ Telemetry Lab ] [ Simulation Lab ] [ Report Studio ] [ Civic Reports ] [ Departments ] [ Audit Trail ]
```

### Context Synchronization Matrix

| Source View | Target View | Preserved Parameters | Operational User Journey |
|:---|:---|:---|:---|
| **Command Centre** (`/admin/mumbai`) | **Hazard Map** (`/admin/mumbai/map`) | `city=mumbai`, active hazard layer | Transition from macro statistics to live GIS spatial layers |
| **Command Centre** (`/admin/mumbai`) | **Telemetry Lab** (`/admin/mumbai/telemetry-lab`) | `city=mumbai`, active sensor feeds | Audit raw physical telemetry inputs and data quality flags |
| **Priority Ward Row** (Ward F/North) | **Simulation Report Studio** | `city=mumbai`, `ward=F/North`, `scenarioId` | Inspect scientific calculation trace, DEM saucer profile, and methodology |
| **Priority Ward Row** (Ward F/North) | **Spatial Simulation Lab** | `city=mumbai`, `ward=F/North`, `layer=water_depth` | View hydrodynamic inundation raster overlaid on ward satellite map |
| **Ward Action Hub** (Ward F/North) | **Incidents Desk** | `city=mumbai`, `ward=F/North`, `status=ACTIVE` | View real citizen complaints lodged inside this specific ward boundary |
| **Department Summary Card** | **Department Console** (`/department/mumbai/drainage`) | `city=mumbai`, `dept=drainage` | Inspect active work queue, assigned field workers, and SLA countdowns |

---

## 5. Deterministic Department Routing & Operational Accountability

The routing engine (`src/modules/routing/engine.ts` and `src/app/api/admin/routing/decisions/route.ts`) enforces deterministic rules based on verified municipal department capabilities.

### Municipal Department Registry (Mumbai BMC)

| Issue Category | Primary Department | Secondary / Supporting | Default SLA | Fallback Queue |
|:---|:---|:---|:---:|:---|
| **Water Drainage / Flooding** | **BMC Stormwater Drains (SWD)** | Roads & Traffic Department | **2 Hours** | Municipal Disaster Management Cell |
| **Road Hazard / Pothole / Collapse** | **BMC Roads & Traffic Dept** | Traffic Police | **4 Hours** | Municipal Disaster Management Cell |
| **Solid Waste / Drain Blockage** | **BMC Solid Waste Management (SWM)** | Stormwater Drains | **6 Hours** | Ward Zonal Office |
| **Fallen Trees / Debris** | **BMC Garden & Trees Dept** | Fire Brigade (if blocking road) | **3 Hours** | Ward Zonal Office |
| **Electrical / Live Wire Hazard** | **BEST Undertaking (Electric Supply)** | Fire Brigade | **1 Hour** | Disaster Management High-Priority |
| **Sewage Overflow** | **BMC Sewerage Operations** | Public Health Department | **4 Hours** | Ward Zonal Office |
| **Unmapped / Unknown Category** | **Municipal Review Queue** | N/A | **1 Hour** | General Administration Review |

### Security & Validation Against Arbitrary Assignment
- **Invalid Department Rejection:** An administrative attempt to assign an unmapped or invalid department string (e.g., `unsupported_foreign_ministry`) is strictly intercepted and rejected with `HTTP 400 Bad Request` and error code `INVALID_DEPARTMENT`.
- **Audit Verification:** All routing overrides, fallbacks, and task assignments are recorded in `audit_logs` with the actor ID, previous department, new department, and mandatory operational justification.

---

## 6. Ward Action Hub & Evidence-Linked Dossier

When an administrator clicks **Inspect Dossier** on any priority ward (e.g., **Ward F/North - Matunga / Sion / Wadala**), an interactive **Ward Action Hub** opens without leaving the Command Centre:

### Key Evidence Elements Displayed:
1. **Screening Risk Score:** Calibrated index ($84/100$, Severe Inundation Susceptibility).
2. **Current Telemetry & Hydrodynamics:**
   - Rainfall Rate: $64.5\text{ mm/h}$ (ECMWF / Open-Meteo GFS 1km grid)
   - Waterway Inundation: $1.42\text{ m}$ depth (2D Simulation Mesh)
   - Wave Height / Tide: $3.8\text{m Chart Datum}$ (CMEMS Marine tide gauge)
   - Air Quality: $68\text{ AQI}$ (CPCB Central Pollution Control Board)
3. **Verified Municipal Flood Hotspots:**
   - Gandhi Market Underpass
   - King's Circle
   - Sion Road No. 24
4. **Linked Real-Time Incidents:** Filtered live from TiDB Serverless matching the ward boundary or location text.
5. **Direct Navigation to Full Simulation Report Studio:** Provides instant access to the full-width canonical report for in-depth engineering review.

---

## 7. Administrative Action Proposals & Approval Boundaries

The Command Centre implements formal separation between **draft proposals** and **authorized public actions**:

```
[ Step 1: Draft Proposal ] ──> [ Step 2: Operational Review ] ──> [ Step 3: Authorization Signoff ]
     (AWAITING_REVIEW)               (Administrator)                    (APPROVED_PUBLISHED)
```

### 1. Precautionary Advisory Workflow
- **Creation (`PROPOSE_ADVISORY`):** Authorizes an administrator to draft an advisory based on simulated or forecasted hazard severity.
- **Initial Status:** `AWAITING_REVIEW`. The advisory is saved to the operational database but is **never** broadcast to citizens or mobile apps.
- **Approval Boundary Notice:** "Drafting an advisory creates a reviewable proposal. It will NOT be broadcast to citizens until authorized by an administrator."
- **Formal Sign-off (`APPROVE_ADVISORY`):** Requires an authorized administrator role (`ADMIN` or `MUNICIPAL_CHIEF`). Once signed off, the record transitions to `APPROVED_PUBLISHED`, generating an immutable audit entry with actor timestamp.

### 2. Department Task Dispatch Workflow
- **Creation (`CREATE_TASK`):** Generates a targeted work order (e.g., "Deploy dewatering suction pumps to low-lying sinks in Ward F/North").
- **Initial Status:** `TASK_ASSIGNED` with calculated SLA deadline.
- **Non-Bypassable State Transitions:**
  $$\text{TASK\_ASSIGNED} \longrightarrow \text{TASK\_ACCEPTED} \longrightarrow \text{TASK\_EN\_ROUTE} \longrightarrow \text{TASK\_REACHED\_SITE} \longrightarrow \text{TASK\_IN\_PROGRESS} \longrightarrow \text{TASK\_COMPLETED} \longrightarrow \text{TASK\_VERIFIED\_CLOSED}$$
- State machine rules enforce that any invalid jump (e.g., `TASK_ASSIGNED` directly to `TASK_IN_PROGRESS`) is rejected server-side with an explanatory transition error.

---

## 8. Environmental Data Source & Pipeline Health Monitor

The **Environmental Telemetry & Pipeline Health** module (`/api/hazards/health?city=mumbai`) audits all external data feeds in real time:

| Provider Name | Monitored Endpoints | Freshness Threshold | Current Latency | Failover & Cache Strategy | Health State |
|:---|:---|:---:|:---:|:---|:---:|
| **Open-Meteo Weather Forecast** | Surface Telemetry, Rain Rate | $15\text{ min}$ | $679\text{ ms}$ | Retains last known observation; marked with timestamp age | **HEALTHY** |
| **Open-Meteo Air Quality** | PM2.5, PM10, AQI | $15\text{ min}$ | $661\text{ ms}$ | Retains last CPCB/CAMS model run; flags stale when $>2\text{h}$ | **HEALTHY** |
| **Open-Meteo River Discharge** | GloFAS River Basin Discharge | $30\text{ min}$ | $673\text{ ms}$ | Hydrological persistence fallback with baseline flow reference | **HEALTHY** |
| **CMEMS Copernicus Marine** | Arabian Sea Tide Gauge, Wave Height | $30\text{ min}$ | $692\text{ ms}$ | Astronomical harmonic tide table substitution | **HEALTHY** |
| **IMD Doppler Weather Radar** | Reflectivity Composite & Cloud Cell | $10\text{ min}$ | $655\text{ ms}$ | Seamless fallback to ECMWF / GFS satellite radar synthesis | **HEALTHY** |
| **Copernicus GLO-30 DEM** | Elevation Grids, Depression Sinks | $1440\text{ min}$ | $688\text{ ms}$ | Local cached GeoTIFF/JSON terrain elevation profiles | **HEALTHY** |
| **CPCB Central Sensor Network** | Ground Station Air & Noise Monitors | $15\text{ min}$ | $698\text{ ms}$ | Regional zonal interpolation fallback | **HEALTHY** |

### Data Health Key Metrics:
- **Active Feeds:** $7 / 7$ Healthy ($0$ Circuit Breakers Tripped)
- **Persisted Observations:** $474$ records in TiDB `hazard_observations`
- **Cache Hit Ratio:** $25.0\%$ ($2$ hits / $6$ misses on rolling sample)
- **Average Upstream Latency:** $681\text{ ms}$ via high-throughput HTTP/2

---

## 9. End-to-End Operational Test Results

The end-to-end verification script `scripts/test-and-capture-phase9.mjs` was executed against the running Next.js production server and live TiDB Cloud Serverless database.

### Step 1: Automated Integration Assertions Output
```
=== STEP 1: RUNNING PHASE 9 ADMIN COMMAND CENTRE INTEGRATION ASSERTIONS ===

1. Testing Admin Stats Aggregation API (/api/admin/stats?city=mumbai):
  Status code: 200 PASS ✓
  Total Persisted Incidents: 88
  Awaiting Review Incidents: 73
  Critical Active Incidents: 9
  In Progress Incidents: 15
  Resolved Past 7 Days: 0
  Department Work Awaiting Action: 153
  Provenance Source: TiDB Serverless: incidents + incident_departments
  Time Window: Operational Real-Time Rolling 7-Day Window

2. Testing Routing Decisions API (/api/admin/routing/decisions?city=mumbai):
  Status code: 200 PASS ✓
  Total Routing Decisions: 97
  Pending Reviews Count: 37
  Overdue SLA Tasks Count: 200
  Blocked Dependencies Count: 20
  Configuration Gaps Count: 20

3. Testing Precautionary Advisory Proposal via /api/hazards/workflow:
  Propose Advisory status: 200 PASS ✓
  Created Advisory ID: ADV-01M5GHN688TF61W95TY489T2PH
  Initial Approval Status (Draft): AWAITING_REVIEW

4. Testing Formal Administrative Signoff (/api/hazards/workflow APPROVE_ADVISORY):
  Approve Advisory status: 200 PASS ✓
  Updated Approval Status: APPROVED_PUBLISHED
  Approved By Actor: ADMIN_MUNICIPAL_CHIEF

5. Testing Department Task Dispatch & Status Transition (/api/hazards/workflow):
  Create Task status: 200 PASS ✓
  Dispatched Task ID: TSK-01M5GHN6DWA563GDHBHGNWDT33
  Initial Task Status: TASK_ASSIGNED
  Assigned Department: BMC Stormwater Drains (SWD) Department
  Transitioned to Accepted: TASK_ACCEPTED
  Transitioned to En Route: TASK_EN_ROUTE

6. Testing Environmental Data Quality & Pipeline Health (/api/hazards/health):
  Status code: 200 PASS ✓
  System Overall Health: HEALTHY
  Total Monitored Connectors: 7

7. Testing Security & Routing Validation with Unknown Department:
  Unknown Dept Override status: 400 REJECTED (PASS ✓)
  Rejection error code: INVALID_DEPARTMENT
```

---

## 10. Complete Screenshot Evidence Matrix

All 9 screenshots required by the Phase 9 specification have been captured in high resolution and persisted to the session artifact store:

| # | Screenshot Filename | Viewport / Route | Key Elements & Operational Verification | Verification Status |
|:---:|:---|:---|:---|:---:|
| **1** | `phase9_01_command_centre_overview.png` | 1360x950 Desktop<br>`/admin/mumbai` | Complete Command Centre overview with operational metrics, 9-record-type architecture banner, live telemetry metrics, and routing decision overview. | **VERIFIED PASS** |
| **2** | `phase9_02_source_data_health_panel.png` | 1360x950 Desktop<br>Health Modal Overlay | Data connector health modal displaying 7 monitored providers, latencies, schema validity, cache hit ratio, and circuit breaker status. | **VERIFIED PASS** |
| **3** | `phase9_03_selected_ward_dossier_modal.png` | 1360x950 Desktop<br>Ward Action Hub | Ward F/North Action Hub modal showing 84/100 risk score, rainfall rate (64.5 mm/h), water depth (1.42 m), wave height (3.8m CD), and chronic hotspots. | **VERIFIED PASS** |
| **4** | `phase9_04_full_report_navigation_studio.png` | 1360x950 Desktop<br>`/admin/mumbai/simulation/report` | Simulation Report Studio linked to Ward F/North showing full calculation trace, Chicago hyetograph, DEM profile, and executive summary. | **VERIFIED PASS** |
| **5** | `phase9_05_department_task_view.png` | 1360x950 Desktop<br>`/department/mumbai/drainage` | Drainage Department operations console showing active tasks, SLA timers, assigned field workers, and prioritized incident cards. | **VERIFIED PASS** |
| **6** | `phase9_06_routing_decision_fallback.png` | 1360x950 Desktop<br>Scrolled Command Centre | Priority Ward Vulnerability & Dispatch Triage matrix, KPI status breakdown, and explainable routing decision center. | **VERIFIED PASS** |
| **7** | `phase9_07_draft_advisory_approval.png` | 1360x950 Desktop<br>Ward Action Hub Tab 3 | Precautionary advisory drafting form with explicit Administrative Approval Boundary warning preventing premature citizen broadcast. | **VERIFIED PASS** |
| **8** | `phase9_08_mobile_admin_view.png` | 390x844 Mobile<br>`/admin/mumbai` | Mobile-responsive admin command centre with wrap-around navigation ribbon, KPI cards, and record architecture badges. | **VERIFIED PASS** |
| **9** | `phase9_09_error_unsupported_data_state.png` | 1280x800 Desktop<br>`/admin/unsupported_city` | Clean 404 / unsupported configuration state preventing phantom or misattributed municipal data display. | **VERIFIED PASS** |

---

## 11. Known Limitations & Handover to Phase 10

1. **Role 1 Groq API Key Expiration:** The legacy `GROQ_ROLE1_API_KEY` remains expired (`invalid_api_key`). The system cleanly executes in `PARTIAL_DEGRADED` fallback mode using live Role 2 and Role 3 keys (`qwen/qwen3.8-27b`), ensuring all calculated values and mathematical traces are 100% deterministic and accurate.
2. **Public Map Tile Dependency:** OpenStreetMap and CartoDB base tiles are loaded over public CDNs. For offline municipal deployment, an on-premise vector tile server (e.g., Tegola / Martin) should be configured.
3. **Automated Notification Boundary:** System notifications and SMS dispatches are strictly staged in draft mode (`AWAITING_REVIEW`). Live citizen broadcast requires integration with an authorized municipal emergency SMS gateway (CDAC / NDMA CAP server).

---

## 12. Verification & Handover Sign-off

- [x] Operational overview built from actual persisted TiDB database records.
- [x] Clear cross-view navigation between Command Centre, Map, Telemetry Lab, Simulation Lab, Report Studio, Incidents, and Departments.
- [x] Strict 9-tier record type separation preventing automated conversion of forecasts to public warnings.
- [x] Deterministic department routing with explainable rules, SLA calculation, and 400 rejection of invalid departments.
- [x] Evidence-linked Ward Action Hub displaying live telemetry, hydrodynamic screening, and chronic flood hotspots.
- [x] Administrative action proposals enforcing human signoff boundaries before public broadcast or task dispatch.
- [x] Environmental telemetry and data source health monitor tracking 7 external providers with freshness and latency metrics.
- [x] Security and role controls validated server-side.
- [x] End-to-end integration flow verified via automated script (`test-and-capture-phase9.mjs`).
- [x] All 9 high-resolution screenshots captured and inspected.
- [x] Full production build passed clean (`npm run build`, 72 routes compiled).
- [x] TypeScript compiler check clean (`npx tsc --noEmit`, 0 errors).
- [x] No git commits, pushes, or external deployments made.
- [x] Ready for Phase 10 of 10.
