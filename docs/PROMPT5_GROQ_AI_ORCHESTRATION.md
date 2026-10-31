# SENTINEL CITY INTELLIGENCE — PROMPT 5 OF 10
# Three-Role Groq AI Orchestration, Evidence Grounding & Report Quality Assurance

**Document Reference:** `docs/PROMPT5_GROQ_AI_ORCHESTRATION.md`  
**Status:** Complete, Tested, and Verified  
**Date:** October 19, 2026  
**Target Environment:** MCGM & Regional Jurisdictions (Urban Link / Sentinel City Intelligence)

---

## 1. Architectural Overview & Separation of Concerns

The Sentinel City Intelligence architecture employs a **three-role, server-side Groq orchestration pipeline** designed to interpret, synthesize, and quality-review urban hazard simulation dossiers. All three AI roles are strictly server-side, independently credentialed, and decoupled from client-side bundles.

Deterministic simulation outputs from `src/modules/simulation/engine.ts` serve as the **immutable source of truth**. Under no circumstances do LLMs compute numbers, re-rank municipal wards, alter threshold calculations, or manufacture synthetic telemetry.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       DETERMINISTIC SIMULATION ENGINE                       │
│  - Multi-hazard calculations (Rainfall excess, Topo Sink, Hotspot density)  │
│  - Bounded demographic exposure buffers                                     │
│  - Municipal ward rankings (Wards A through T)                              │
│  - Sluice gate lockout protocols & calculation audit traces                 │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                         [Structured Evidence Package]
                                       │
                   ┌───────────────────┴───────────────────┐
                   ▼                                       ▼
    ┌─────────────────────────────┐         ┌─────────────────────────────┐
    │           ROLE 1            │         │           ROLE 2            │
    │    Environmental Evidence   │         │   Spatial Impact & Municipal│
    │           Analyst           │         │     Operations Analyst      │
    │  - Interprets validated     │         │  - Interprets ward metrics  │
    │    weather/hydrology inputs │         │  - Evaluates asset overlays │
    │  - Evaluates temporal/      │         │  - Recommends SOP actions   │
    │    geographic coverage      │         │    for SWD, Roads, Health   │
    │  - Identifies missing/stale │         │  - Anti-hallucination checks│
    │  - Grounded in source IDs   │         │    (no structural damage)   │
    └──────────────┬──────────────┘         └──────────────┬──────────────┘
                   │                                       │
                   │ [Validated Role 1]                    │ [Validated Role 2]
                   └───────────────────┬───────────────────┘
                                       ▼
                        ┌─────────────────────────────┐
                        │           ROLE 3            │
                        │    Report Editor & Quality  │
                        │           Reviewer          │
                        │  - Synthesizes narrative    │
                        │  - Numeric consistency audit│
                        │  - Contradiction detection  │
                        │  - Limitation preservation  │
                        └──────────────┬──────────────┘
                                       │
                                       ▼
                        ┌─────────────────────────────┐
                        │   RUNTIME VALIDATION SUITE  │
                        │  - Unknown source ID check  │
                        │  - False claim rejection    │
                        │  - Numeric tolerance bounds │
                        └──────────────┬──────────────┘
                                       │
                                       ▼
                        ┌─────────────────────────────┐
                        │  FINAL VERIFIED DOSSIER     │
                        │  - Markdown / CSV / JSON    │
                        │  - Provenance & Model Audit │
                        │  - Report Studio Display    │
                        └─────────────────────────────┘
```

---

## 2. Role Specifications & Independent Configuration

Each role is defined in `src/modules/dossier/ai-role-config.ts` with dedicated client instantiation, environment variable resolution, model selection, temperature, token limits, and timeouts.

| Dimension | Role 1: Environmental Evidence Analyst | Role 2: Spatial Impact & Municipal Operations Analyst | Role 3: Report Editor & Quality Reviewer |
|---|---|---|---|
| **Primary File** | `src/modules/dossier/evidence-analyst.ts` | `src/modules/dossier/impact-analyst.ts` | `src/modules/dossier/report-editor.ts` |
| **Credential Variables** | `GROQ_ROLE1_API_KEY`, `GROQ_LLAMA_API_KEY` | `GROQ_ROLE2_API_KEY`, `GROQ_API_KEY` | `GROQ_ROLE3_API_KEY`, `GROQ_API_KEY_3`, `GROQ_THIRD_API_KEY` |
| **Active Key Status** | Fallback Deterministic Mode (401 auth handling) | **LIVE & OPERATIONAL** (208ms latency) | **LIVE & OPERATIONAL** (149ms latency) |
| **Primary Model** | `qwen/qwen3.8-27b` | `qwen/qwen3.8-27b` | `qwen/qwen3.8-27b` |
| **Fallback Models** | `openai/gpt-oss-120b`, `openai/gpt-oss-20b` | `openai/gpt-oss-120b`, `openai/gpt-oss-20b` | `openai/gpt-oss-120b`, `openai/gpt-oss-20b` |
| **Temperature** | `0.10` (strictly factual) | `0.15` (structured operational) | `0.10` (precise synthesis) |
| **Max Tokens** | `2048` | `2500` | `4096` |
| **Request Timeout** | `12,000 ms` | `14,000 ms` | `15,000 ms` |
| **Retry Policy** | 2 attempts with exponential backoff | 2 attempts with exponential backoff | 2 attempts with exponential backoff |
| **Deterministic Fallback** | Yes (`generateDeterministicEvidenceAnalysis`) | Yes (`generateDeterministicImpactAnalysis`) | Yes (`generateDeterministicReportEditor`) |

### Credential Safety Guarantee
- **Never exposed to clients:** Credentials exist exclusively within Node.js runtime process environment.
- **Zero log leakage:** Diagnostic and logging utilities (`scripts/test-groq-credentials.mjs`, `orchestrator.ts`) sanitize output, printing only masked prefixes (e.g. `gsk_***...`) or boolean presence indicators.
- **No browser bundles:** Client components never import Groq SDK or server configuration modules.

---

## 3. Strict Responsibilities & Boundaries

### Role 1: Environmental Evidence Analyst
- **Allowed:**
  - Interprets validated precipitation rates ($mm/h$), tidal elevations ($m$ CD), soil moisture indexes, and wind vectors.
  - Explains spatial rainfall distributions and elevation sinks across Mumbai.
  - Cites only canonical source identifiers (`SRC_IMD_AWS`, `SRC_GLO30_DEM`, `SRC_MCGM_HOTSPOTS`, `SRC_INCOIS_TIDE`, `SRC_BMC_WARDS_2024`, `SRC_CENSUS_2011`).
  - Identifies missing, stale, or partially calibrated telemetry.
- **Prohibited:**
  - Inventing hypothetical weather readings or altering numeric values.
  - Generating replacement risk scores.
  - Making assumptions about ground structural damage.

### Role 2: Spatial Impact & Municipal Operations Analyst
- **Allowed:**
  - Interprets deterministic ward rankings (top high-risk wards).
  - Evaluates documented critical infrastructure intersections (stormwater pumping stations, major transit hubs, tertiary hospitals).
  - Outlines departmental actions for BMC desks (Stormwater Drainage - SWD, Disaster Management - DMD, Roads & Traffic, Public Health, Solid Waste Management - SWM, Mumbai Traffic Police).
  - Interprets demographic exposure as screening estimates.
- **Prohibited:**
  - Claiming hospitals are flooded, roads are destroyed, or structures collapsed without physical damage sensor confirmation.
  - Treating demographic exposure as confirmed casualty or injury counts.
  - Inventing fictional asset locations.

### Role 3: Report Editor & Quality Reviewer
- **Allowed:**
  - Assembling Executive Summaries, Ward Priority Briefs, and Strategic Recommendations.
  - Auditing numeric consistency between narrative prose and mathematical outputs.
  - Checking units ($mm/h$, $m$, $m^3/s$, persons).
  - Flagging contradictions and appending explicit analytical limitations.
- **Prohibited:**
  - Silently altering calculated values or modifying ward scores.
  - Omitting known limitations or uncertainty statements.
  - Resolving discrepancies by fabricating unverified data.

---

## 4. Runtime Validation Engine (`src/modules/dossier/validation.ts`)

Every output returned by the Groq AI roles passes through a multi-stage validation engine before being accepted into the final dossier.

```typescript
// Validation Rules Implemented:
1. Unknown Source ID Rejection:
   - Matches all cited source IDs against evidence.knownSourceIds.
   - Any hallucinated ID (e.g., 'SRC_UNKNOWN_RADAR') is flagged and rejected.

2. Anti-Hallucination & Structural Damage Filter:
   - Scans text for ungrounded alarmist terms:
     "hospital.*(flood|collapse|submerge)"
     "fatalit(y|ies)|deaths|casualties confirmed"
     "bridge.*collapse|road.*washout"
   - Flags findings as UNGROUNDED_STRUCTURAL_CLAIM.

3. Cross-Jurisdiction Sanitization:
   - Detects leakage of other municipal jurisdictions (Pune, Nagpur, Thane) in Mumbai reports.
   - Rejects or flags cross-jurisdiction references.

4. Numeric Consistency Audit:
   - Compares peak ward score cited in narrative against deterministic calculation.
   - Discrepancy > 5% triggers NUMERIC_DISCREPANCY warning.
   - Verifies alert level matches deterministic threshold (CRITICAL, HIGH, MODERATE, LOW).
```

---

## 5. Fault-Tolerance & Partial-Report Behavior

If any role encounters network timeouts, rate limits, or invalid credentials (such as an expired test key returning HTTP 401), **the simulation report never crashes**.

1. The orchestrator catches the role failure.
2. The failed role falls back instantly to the deterministic rules-based generator (`deterministic-fallback.ts`).
3. Healthy roles (e.g. Roles 2 and 3) continue executing live against their Groq endpoints.
4. The dossier status is set to `PARTIAL_DEGRADED`.
5. The Report Studio UI displays:
   - An amber `AI: PARTIAL_DEGRADED` badge (`#badge-ai-state`).
   - A descriptive warning banner explaining which role utilized deterministic fallback.
   - Complete access to the "AI Audits" modal (`#btn-ai-audits`) displaying role latencies, model versions, and verification results.

---

## 6. Citizen Sentinel AI Grounding (`src/modules/ai/sentinel-engine.ts`)

The Citizen Sentinel AI assistant is decoupled from the 3-role dossier pipeline:
- Dedicated endpoint: `/api/hazards/assistant`
- Fast, low-latency citizen Q&A powered by `qwen/qwen3.8-27b`.
- Grounded strictly in user GPS coordinates, active municipal weather feeds, IMD alerts, and verified emergency shelters.
- Directly embeds action links into responses, redirecting citizens to the official Civic Hazard Reporting form (`/[city]/report`) with prefilled hazard types and coordinates.
- Never serves as a numerical calculation engine or replaces municipal simulation.

---

## 7. Verification Test Suite & Results

### Automated Test Suite: `scripts/test-prompt5-groq-orchestration.ts`
All 14 comprehensive tests pass with zero errors:

```
======================================================================
  SENTINEL CITY INTELLIGENCE — PROMPT 5 VALIDATION SUITE              
  Three-Role Groq AI Orchestration, Grounding & Quality Assurance     
======================================================================

PASS  1. Role Configuration Independence
PASS  2. Credential Variable Inspection (Zero Leakage)
PASS  3. Deterministic Ground Truth Preservation
PASS  4. Role 1 Output Validation & Unknown Source Rejection
PASS  5. Role 2 Output Validation & Structural Damage Guardrails
PASS  6. Role 3 Output Validation & Numeric Consistency Checks
PASS  7. Sluice Gate Lockout Deterministic Integrity
PASS  8. Partial Report Degradation on Role Failure
PASS  9. Missing Third Key Graceful Degradation
PASS 10. Out-of-Date Scenario Change Detection
PASS 11. End-to-End Orchestrator Pipeline
PASS 12. Citizen Sentinel AI Evidence Grounding
PASS 13. Export Provenance & Grounding Audit Trail
PASS 14. Performance & Token Boundary Checks

----------------------------------------------------------------------
TOTAL TESTS: 14 | PASSED: 14 | FAILED: 0 | SKIPPED: 0
STATUS: ALL PROMPT 5 REQUIREMENTS VERIFIED AND PASSING
======================================================================
```

### Headless Visual QA Screenshots
All 6 required screenshots have been captured at 1920x1080 resolution and verified in `public/screenshots/prompt5/`:

1. `prompt5_01_running_role_status.png` (208 KB): Three-Role Groq AI audit modal displaying live role cards, latencies, model IDs, and grounded source references.
2. `prompt5_02_full_successful_report.png` (180 KB): Full-width Report Studio with verified 7-section canonical dossier and high-risk ward breakdown.
3. `prompt5_03_unsupported_claim_warning.png` (208 KB): Active runtime contradiction flags and unsupported claim warnings displayed in the audit inspector.
4. `prompt5_04_partial_result_role_failure.png` (182 KB): Report Studio showing `AI: PARTIAL_DEGRADED` status badge and graceful deterministic fallback banner.
5. `prompt5_05_report_regenerated_changed_scenario.png` (63 KB): Out-of-date scenario banner requiring explicit regeneration when rainfall or tide parameters are altered.
6. `prompt5_06_sentinel_ai_evidence_response.png` (216 KB): Citizen Sentinel AI answering query with verified grounding sources, shelter references, and prefilled Civic Report link.

---

## 8. Integration Dependencies & Next Steps

- **Completed:** Three-role architecture, runtime validator, deterministic ground truth enforcement, Report Studio UI modal, Sentinel citizen assistant grounding, and test verification.
- **Dependencies for Prompt 6:**
  - Automated continuous pipeline integration.
  - Multi-hazard temporal event playback and historical storm event benchmarks (e.g. July 26, 2005 Mumbai benchmark).
