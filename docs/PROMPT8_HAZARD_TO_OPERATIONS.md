# Sentinel City Intelligence — Prompt 8 of 10 Handover
## Unified Hazard-to-Incident Workflow, Department Routing, Action Tracking and Evidence-Linked Reports

**Version:** 1.0.0  
**Date:** October 19, 2026  
**Author:** Municipal Systems Architecture & Civic Incident Management Specialist  
**Status:** Verification Complete & Ready for Review  

---

### Executive Summary

Prompt 8 integrates environmental observations, mathematical hazard simulations, citizen reports, and departmental actions into an authoritative, deterministic lifecycle engine without creating secondary database silos or treating hypothetical simulation runs as real incidents.

```
+--------------------------+         +-------------------------------+
| Environmental Telemetry  |         |  Hydrodynamic Scenario Sim    |
| (Rain, Tides, Sensors)   |         |  (25yr, 50yr, 100yr Return)   |
+------------+-------------+         +---------------+---------------+
             |                                       |
             +-------------------+-------------------+
                                 |
                                 v
                     [ Hazard Evidence Link ]
                     (Observation & Run IDs)
                                 |
        +------------------------+------------------------+
        |                                                 |
        v                                                 v
+-------------------------------+         +-------------------------------+
| Contextual Citizen Prefill   |         | Precautionary Advisory Draft  |
| - Honest Disclaimer Banner    |         | - Awaiting Municipal Approval |
| - Citizen Editable Values     |         | - Admin Review Gatekeeper     |
| - Ground Truth Verification   |         | - No Premature Siren/Alert    |
+---------------+---------------+         +---------------+---------------+
                |                                         |
                v                                         v
+-------------------------------+         +-------------------------------+
| Confirmed Citizen Report /    |         | Deterministic Department Task |
| Ground Incident (incidents)   |         | - Geofenced State Machine     |
| - Ward & GPS Georeferencing   |         | - City & Boundary Isolation   |
| - Evidence Audit Reference    |         | - Proof-of-Work Required      |
+-------------------------------+         +-------------------------------+
```

---

### 1. Authoritative Record Relationships

All records maintain strict, non-destructive, bidirectional references stored in the database layer. Citizen reports are never merged or deleted simply because they share a geographic ward.

| Primary Entity | Foreign Key / Link ID | Target Entity | Relationship Semantics |
| :--- | :--- | :--- | :--- |
| `hazard_evidence_links` | `telemetry_observation_id` | Telemetry Data Lake | Points to raw physical sensor/forecast telemetry. |
| `hazard_evidence_links` | `simulation_run_id` | `simulations` table | Points to immutable scenario parameters and return-period models. |
| `hazard_evidence_links` | `ward_id` | Municipal Ward Boundary | Georeferences physical administrative jurisdiction (e.g. BMC Ward `F/N`). |
| `hazard_evidence_links` | `incident_id` | `incidents` table | Links evidence to authorized municipal incidents or citizen reports. |
| `hazard_evidence_links` | `task_id` | `tasks` table | Associates operational actions with source environmental signals. |
| `advisories` | `approved_by` | User Profiles / Admins | Auditable human gatekeeper signature; non-nullable upon publishing. |
| `tasks` | `dependencies` | Task IDs Array | Sequential blockers preventing premature dispatch before prerequisite tasks clear. |

---

### 2. Discrete State Machine & Boundary Separation

To ensure hypothetical calculations never trigger civil alarms or confuse dispatchers, eight discrete lifecycle states are established:

```
[ SignalState ] --------> [ ScenarioState ] --------> [ ScreeningState ]
(Telemetry Feed)          (Simulation Run)            (Ward Threshold Check)
                                                             |
                                +----------------------------+----------------------------+
                                |                                                         |
                                v                                                         v
                    [ AdminAssessmentState ]                                  [ CitizenReportState ]
                    - PROPOSED                                                - DRAFT
                    - AWAITING_REVIEW                                         - SUBMITTED
                    - APPROVED (Human Only)                                   - VERIFIED_ON_GROUND
                    - REJECTED                                                - REJECTED_UNFOUNDED
                                |                                                         |
                                v                                                         v
                    [ OfficialWarningState ]                                  [ IncidentLifecycleState ]
                    - DRAFT                                                   - REPORTED
                    - SIGNED_OFF                                              - INVESTIGATING
                    - PUBLISHED                                               - ACTION_IN_PROGRESS
                    - EXPIRED / REVOKED                                       - RESOLVED / CLOSED
                                |
                                v
                    [ DepartmentTaskLifecycleState ]
                    - CREATED -> ASSIGNED -> ACCEPTED -> EN_ROUTE -> REACHED_SITE -> IN_PROGRESS -> COMPLETED -> VERIFIED_CLOSED
```

#### Key Architectural Guarantees:
1. **Simulation Output ≠ Incident:** A simulation predicting 1.2m inundation creates an `AdminAssessmentState` in `PROPOSED` status. It is physically impossible for the simulation code path to insert rows directly into `incidents` with status `VERIFIED`.
2. **Human-in-the-Loop Siren Gate:** Official civil alerts (`OfficialWarningState`) require explicit multi-factor admin approval (`approved_by: string`, `approver_role: 'MUNICIPAL_ADMIN'`).
3. **No Automatic Ground Truth Conversion:** An atmospheric forecast of heavy rainfall (e.g., 85mm/hr) will never automatically flag a road as flooded without field sensor confirmation or human inspection.

---

### 3. Contextual Citizen Reporting

When Sentinel AI detects active environmental risks, citizens navigating the portal can prefill reporting forms directly with context-aware information:

- **Prefilled Fields:** City (`Mumbai`), Ward (`F/N - Matunga`), Coordinates (`19.0269, 72.8553`), Category (`Waterlogging / Drainage`), and Observation References.
- **Mandatory Uncertainty Banner:** The form renders an amber Sentinel Intelligence callout:
  > *"A forecast or simulation of heavy rainfall is NOT proof of current ground flooding. Please confirm whether you are personally observing water accumulation right now."*
- **Explicit Confirmation:** Citizens retain 100% control to edit location, category, and remarks before hitting submit.
- **Verification Isolation:** Submissions are tagged with `verification_status: 'UNVERIFIED_CITIZEN_REPORT'` and link their parent `telemetry_observation_id` into `hazard_evidence_links`.

---

### 4. Deterministic Departmental Routing

Task routing is purely deterministic and governed by a municipal routing matrix. The LLM is restricted to providing advisory category suggestions; routing decisions are hard-coded to city registries.

| City Jurisdiction | Incident / Risk Category | Primary Assigned Department | Mandatory Supporting Depts | Default SLA Target |
| :--- | :--- | :--- | :--- | :--- |
| **Mumbai (BMC)** | Waterlogging / Sump Failure | `Storm Water Drains (SWD)` | Disaster Management Cell, Traffic Police | 45 Minutes |
| **Mumbai (BMC)** | Tree Fall / Structural Risk | `Garden & Tree Authority` | Fire Brigade, BEST Electric | 60 Minutes |
| **Mumbai (BMC)** | Landslide / Slope Failure | `Building Proposal / SRA` | Disaster Cell, Emergency Medical | 30 Minutes |
| **Pune (PMC)** | Nullah Choking / Flooding | `Drainage Department` | Traffic Control, City Police | 60 Minutes |
| **Nagpur (NMC)** | Potholes & Flash Overflow | `Public Works Dept (PWD)` | Traffic Division | 90 Minutes |
| **ANY CITY** | Unmapped / Ambiguous Category | `Municipal Review Queue` | Central Command Desk | 30 Minutes |

#### Fallback Queue Protection:
If a reported issue does not cleanly match municipal ontology or crosses jurisdictional boundaries, it routes directly to `Municipal Review Queue` with flag `requires_manual_routing: true`. Tasks are never assigned to non-existent departments or entities in other cities.

---

### 5. Map Findings to Departmental Work (Ward Action Hub)

Authorized operators can click any ward or hazard hotspot in the Unified Operations Map to open the interactive **Ward Action Hub Modal**:

1. **Tab 1 — Source Evidence:** Displays live telemetry (precipitation, tide level, sea wave height), scenario run parameters (return period, model grid resolution), and chronic flood hotspots.
2. **Tab 2 — Related Incidents:** Lists verified civic incidents and active citizen reports filtered exclusively to that ward, showing reporter timestamp and priority scores.
3. **Tab 3 — Precautionary Advisory:** Allows operators to draft precautionary notices (`AWAITING_REVIEW`) with clear escalation impact summaries.
4. **Tab 4 — Department Tasks:** Enables task dispatch with geofenced state machine enforcement:
   - `ASSIGNED` -> `ACCEPTED` (acknowledgment of assignment)
   - `ACCEPTED` -> `EN_ROUTE` (crew deployed)
   - `EN_ROUTE` -> `REACHED_SITE` (geofenced arrival at location)
   - `REACHED_SITE` -> `IN_PROGRESS` (mitigation underway)
   - `IN_PROGRESS` -> `COMPLETED` (requires completion proof notes / evidence photo URL)
   - `COMPLETED` -> `VERIFIED_CLOSED` (supervisor audit sign-off)

---

### 6. Operational Dossier & Version Immutability

The system guarantees numerical consistency across all views:
- A calculated 100-year return scenario showing **1.85m peak inundation** in Ward F/N outputs the exact same `1.85m` figure in the simulation panel, the Ward Action Hub, the PDF export, and the department dispatch record.
- **Scenario Version Hash:** Every dossier contains an immutable `scenarioRunId` and `scenarioConfigHash`. If an engineer reruns the hydrodynamic simulation with updated tidal coefficients, historical dossiers are tagged as `SUPERSEDED_BY_CONFIG_V2` and are never silently overwritten.

---

### 7. City and Jurisdiction Isolation

Strict isolation prevents data leaks across municipal boundaries:
- **Mumbai:** Uses BMC Ward codes (`A` through `T`), BMC Department IDs, and Arabian Sea tidal gauge telemetry.
- **Pune:** Uses PMC Prabhag divisions, Mutha River basin gauges, and PMC Drainage Department routing.
- **Nagpur:** Uses NMC Zone identifiers, Nag River telemetry, and NMC PWD routing.
- **Boundary Guard:** Attempts to run Mumbai flood models on Nagpur coordinates return an explicit error banner: `"Simulation boundary restricted to Greater Mumbai (BMC). For Nagpur, please refer to NMC Flood Management protocols."`

---

### 8. Verification & Test Suite

The automated test suite (`scripts/test-prompt8-workflow.ts`) was executed against the active runtime.

**Test Results: 36 / 36 Passed (100% Success Rate)**

```
================================================================================
  SENTINEL OPERATIONAL WORKFLOW TEST SUITE
================================================================================
  Section 1: Authoritative Record Relationships (4/4 Passed)
  Section 2: Discrete State Machine Separation (5/5 Passed)
  Section 3: Contextual Citizen Prefill (4/4 Passed)
  Section 4: Deterministic Department Routing & Fallback (5/5 Passed)
  Section 5: Department Task Geofenced Lifecycle (6/6 Passed)
  Section 6: Source Evidence & Operational Dossier Linkage (3/3 Passed)
  Section 7: City & Jurisdiction Isolation (4/4 Passed)
  Section 8: Failure Modes & Security Boundary Tests (5/5 Passed)
================================================================================
  TOTAL TESTS: 36 | PASSED: 36 | FAILED: 0
================================================================================
```

---

### 9. Visual QA Screenshot Inventory

All visual evidence has been captured directly from the live application and verified in `public/screenshots/prompt8/`:

| Screenshot Reference | Filename | Description & Verification |
| :--- | :--- | :--- |
| **QA-01** | `prompt8_01_selected_hazard_ward_linked_evidence.png` | Ward Action Hub showing live telemetry (94mm/hr rainfall, 4.2m tide), inundation depth, wave height, and chronic flood hotspots. |
| **QA-02** | `prompt8_02_draft_precautionary_advisory.png` | Precautionary advisory drafted with `AWAITING_REVIEW` status, impact summary, and admin authorization CTA. |
| **QA-03** | `prompt8_03_citizen_report_before_confirmation.png` | Citizen reporting view with high-visibility Sentinel Intelligence prefill callout banner and honest ground truth disclaimer. |
| **QA-04** | `prompt8_04_submitted_report_and_status.png` | Citizen tracking view displaying submitted incident status with authoritative reference ID. |
| **QA-05** | `prompt8_05_admin_incident_record.png` | Admin incident desk with priority scores, department assignments, and evidence links. |
| **QA-06** | `prompt8_06_department_task_view.png` | Department task view with live SLA countdown, dependency tracking, and progression controls. |
| **QA-07** | `prompt8_07_routing_decision_and_fallback.png` | Operational Decision Center displaying deterministic department routing, overdue tasks, and fallback review queue. |
| **QA-08** | `prompt8_08_report_source_references.png` | Ward Action Hub Related Incidents tab listing open civic complaints cross-referenced with ward evidence. |
| **QA-09** | `prompt8_09_unauthorized_action_blocked.png` | Department task creation modal showing mandatory input validation, SLA target selection, and role gatekeepers. |
| **QA-10** | `prompt8_10_city_mismatch_unsupported_state.png` | Nagpur simulation boundary limitation state demonstrating strict geographic and jurisdictional isolation. |

---

### 10. Technical Architecture & File Inventory

- **Contracts:** [`src/modules/hazards/workflow-contracts.ts`](file:///e:/urbanhazards/urban_link-master/src/modules/hazards/workflow-contracts.ts)
- **Engine / Service:** [`src/modules/hazards/workflow-manager.ts`](file:///e:/urbanhazards/urban_link-master/src/modules/hazards/workflow-manager.ts)
- **API Endpoint:** [`src/app/api/hazards/workflow/route.ts`](file:///e:/urbanhazards/urban_link-master/src/app/api/hazards/workflow/route.ts)
- **Incident Creation API:** [`src/app/api/incidents/create/route.ts`](file:///e:/urbanhazards/urban_link-master/src/app/api/incidents/create/route.ts)
- **UI Action Hub:** [`src/components/admin/ward-action-hub-modal.tsx`](file:///e:/urbanhazards/urban_link-master/src/components/admin/ward-action-hub-modal.tsx)
- **Map Page Integration:** [`src/app/(admin)/admin/map/page.tsx`](file:///e:/urbanhazards/urban_link-master/src/app/(admin)/admin/map/page.tsx)
- **Citizen Prefill Component:** [`src/components/citizen/civic-reporting-view.tsx`](file:///e:/urbanhazards/urban_link-master/src/components/citizen/civic-reporting-view.tsx)
- **Automated Verification:** [`scripts/test-prompt8-workflow.ts`](file:///e:/urbanhazards/urban_link-master/scripts/test-prompt8-workflow.ts)
- **Visual Capture Script:** [`scripts/capture-prompt8-screenshots.mjs`](file:///e:/urbanhazards/urban_link-master/scripts/capture-prompt8-screenshots.mjs)

---

### 11. Known Limitations & Recommendations for Prompt 9

1. **Cellular IoT Telemetry Latency:** The current physical sensor adapter polls tidal stations on a 5-minute interval. For extreme flash events, a WebSocket push stream (to be addressed in Prompt 9/10) will reduce telemetry propagation latency from 300s to < 2s.
2. **Mobile Field App Geofence Tolerance:** Task transition from `TASK_EN_ROUTE` to `TASK_REACHED_SITE` currently validates GPS coordinates within a 250m radial buffer of the ward centroid. Field crews operating in narrow alleys may require a dynamic precision buffer during heavy monsoon cloud cover.
3. **Multi-Jurisdiction Mutual Aid:** When Mumbai and Thane border areas experience concurrent waterlogging, cross-municipal resource sharing is logged as separate tasks under each city registry. A federated mutual-aid coordination schema can be layered on top of this foundation in subsequent releases.
