# Nagpur Connect — implementation plan

**Product:** AI-powered civic and emergency response coordination platform for Nagpur  
**Implementation target:** a new Next.js application in `C:\NAGPUR-ONE\nagpur-connect`  
**Prepared for:** Antigravity implementation agent  
**Plan status:** implementation-ready; no application code is included in this deliverable

## 1. Mission and non-negotiable product rules

Nagpur Connect lets a citizen describe a civic problem in natural language—preferably by voice—without needing to identify the responsible government department. The system turns the report into structured data, requests only missing information, presents an understandable summary, and routes a *confirmed* incident to every relevant approved department. Departments assign work to their workers, workers update the task with evidence, departments verify the result, and the citizen can track the outcome.

The guiding principle is: **the citizen describes the problem; the platform understands the government structure.**

These constraints take precedence over visual polish and speed of prototyping:

1. One incident can involve multiple departments and multiple tasks. Never model an incident with a single `department_id`.
2. A normal report is not officially submitted or routed until the citizen confirms the AI summary.
3. A potentially life-threatening emergency must show immediate guidance and configurable official contacts without waiting for a normal confirmation flow. The app must never imply it has dispatched emergency services unless a real, authorized dispatch integration exists.
4. Department access is approval and activation-code based. There is no unrestricted public department registration.
5. A worker is created and managed by their department and receives only task-relevant data.
6. Sensitive and restricted reports must not expose identity or precise location to the public, unrelated departments, or maps.
7. Taxonomy, routing rules, priority thresholds, emergency contacts, escalation policies, and department service areas are data/configuration—not hard-coded JSX conditions.

## 2. Source material and implementation boundaries

Read these before implementation:

| Material | How it should be used |
| --- | --- |
| Master product prompt supplied with this task | Functional source of truth for the platform, role hierarchy, workflow, data model, and safety constraints. |
| Framer visual overview supplied with this task | Visual starting point only: dark canvas, large tight display typography, restrained blue focus/link accent, pill controls, lifted charcoal cards, and scarce atmospheric gradient cards. |
| `C:\NAGPUR-ONE\material-web-main\material-web-main` | Reference material only. Do not modify it, copy its source as the product, or make it a runtime dependency unless a reviewed asset/component is intentionally adopted. |
| Department-coordinate JSON (not currently present in this workspace) | Future seed/import input. Implement a documented, validated importer; do not invent coordinates or silently fabricate department boundaries. |

The Framer system is a marketing reference, whereas incident operations require accessible semantic status states. Preserve the dark editorial character but add clear, labelled, contrast-tested severity/status colours for operational data. Never rely on colour alone to communicate `Critical`, task state, or errors.

## 3. Decisions to lock before writing features

Antigravity should create the app as a fresh project in this folder. Do not turn the `material-web-main` reference directory into the application.

| Concern | Recommended decision |
| --- | --- |
| Framework | Next.js, TypeScript strict mode, App Router, React Server Components by default, client components only for browser APIs and interaction. |
| Backend boundary | Route Handlers under `app/api` call server-only application services; UI must not query TiDB directly. Keep service/repository/provider boundaries testable. |
| Database | TiDB with MySQL-compatible SQL. Use an ORM/query layer configured for MySQL/TiDB; review every generated migration for PostgreSQL-only syntax, unsupported extensions, and unsupported full-text/geospatial assumptions. |
| IDs | Generate sortable ULIDs in the application and store them in `CHAR(26)` columns. Present a separate human-safe incident reference such as `NC-YYYY-######`; never expose sequential primary keys. |
| Authentication | First-party credential/session implementation backed by TiDB: Argon2id password hashes, opaque random session tokens stored hashed, secure `HttpOnly`/`SameSite` cookies, session rotation and revocation. Add OTP/OAuth only after the core roles work. |
| Validation | Shared Zod schemas for request input and server actions; server-side authorization and validation remain mandatory even when UI validation exists. |
| Media | Private S3-compatible object storage with server-issued short-lived upload URLs. Store metadata in TiDB, not binary media blobs. |
| AI and transcription | Provider interfaces (`SpeechToTextProvider`, `IncidentAnalysisProvider`) with a production adapter and deterministic development fixture adapter. AI output is proposed data, never authorization or automatic dispatch. |
| Map | A `MapProvider` interface. Use a browser map renderer that can consume GeoJSON plus a provider implementation selected through configuration. Open external navigation only with the worker’s consent. |
| Realtime | Initial release: authenticated polling or Server-Sent Events for incident/task/notification changes. Keep event creation transactional so a later WebSocket/push provider can subscribe without changing business logic. |
| Background work | Job/outbox interface for transcription, notification delivery, media scanning, retries, escalation, and analytics rollups. Do not make a citizen HTTP request wait on all downstream work. |
| Styling | Tailwind or equivalent token-based CSS with accessible custom components. Use the Framer reference as a style system, not a component library dependency. |

### Required environment contract

Create `.env.example` with descriptions and placeholders only. It must contain no credentials. At minimum define:

```dotenv
DATABASE_URL=mysql://USER:PASSWORD@HOST:PORT/DATABASE
SESSION_SECRET=replace-with-a-long-random-secret
MEDIA_BUCKET=...
MEDIA_REGION=...
MEDIA_ENDPOINT=...
MEDIA_ACCESS_KEY_ID=...
MEDIA_SECRET_ACCESS_KEY=...
MAP_PROVIDER=...
MAP_PUBLIC_TOKEN=...
AI_PROVIDER=...
AI_API_KEY=...
NOTIFICATION_PROVIDER=console|...
APP_ORIGIN=http://localhost:3000
```

Fail closed at startup when a production-required secret is missing. Never commit `.env`, contact numbers, production tokens, seed credentials, or coordinate files containing restricted operational data.

## 4. Target architecture

```mermaid
flowchart LR
  C[Citizen web experience] --> W[Next.js App Router]
  A[Admin / department / worker portals] --> W
  W --> R[Route handlers + server actions]
  R --> S[Application services]
  S --> DB[(TiDB / MySQL-compatible)]
  S --> O[(Private object storage)]
  S --> AI[STT + incident-analysis providers]
  S --> MAP[Map-provider adapter]
  S --> OUT[(Outbox / job runner)]
  OUT --> N[Notification providers]
  OUT --> AI
  S --> AUDIT[Append-only audit events]
  AUDIT --> DB
```

Use a modular monolith for the hackathon: one deployable Next.js codebase with deliberate module boundaries. It is simpler to build and demo while still allowing the AI, notifications, maps, or jobs to become separate services later.

Suggested application structure:

```text
nagpur-connect/
  app/
    (public)/
    (citizen)/
    (admin)/
    (department)/
    (worker)/
    api/
  components/
    ui/ citizen/ admin/ department/ worker/ maps/
  lib/
    auth/ db/ validation/ permissions/ observability/ formatters/
  modules/
    incidents/ ai/ routing/ tasks/ departments/ notifications/
    media/ maps/ taxonomy/ analytics/ audit/ escalation/
  db/
    schema/ migrations/ seeds/ importers/
  tests/
    unit/ integration/ e2e/ fixtures/
  public/
  docs/
```

Within each module, keep `domain` (types/rules), `service` (use cases), `repository` (TiDB access), and `provider` (external integrations) separate. `app/` should orchestrate requests and render pages; it must not contain untestable business rules.

## 5. Access model and data visibility

### Roles

| Role | Scope | May do | Must not do |
| --- | --- | --- | --- |
| Citizen | Own reports | Draft, submit input, confirm, track, set privacy, receive notifications | View other reports, unredacted operational data, internal notes, worker identity unless policy allows. |
| Super admin | City-wide | Approve departments, issue/revoke activation codes, view all authorized data, configure taxonomy/routing/contacts, audit and analytics | Bypass audit logging or create public exposure of protected reports. |
| Department admin/dispatcher | One or explicitly authorized departments | View department links, acknowledge, assign workers, add internal notes, verify/resolve department work, manage workers | Access unrelated departments or change global rules. |
| Department viewer | One department | Read permitted department incidents and permitted analytics | Assign workers, manage staff, view restricted information without a granular permission. |
| Worker | Their assigned tasks | Accept/update task, upload evidence, add notes | Browse unassigned tasks, see other departments, expose citizen contact/identity beyond task need. |

Use permission checks in both the service layer and route boundary. A role name alone is insufficient: scope every department/worker request by `department_id`, task assignment, incident privacy policy, and explicit grant.

### Department onboarding

1. Super admin creates or reviews a pending department record.
2. Super admin approves it after offline/administrative verification.
3. Super admin creates a single-use activation code with a configurable expiry (default configuration: 24 hours; never hard-code it).
4. Only the invited department email/contact can redeem the code, establish its first department-admin account, and set credentials.
5. Department admins invite/manage their workers and users inside their department.
6. Log every approval, code creation, redemption attempt, revocation, membership change, and role change.

Store only a hash of activation codes. Apply attempt limits, expiry, single use, revocation, and a purpose (`department_initial_admin`, `worker_invite`, etc.).

## 6. Core domain model

### Key relationships

```mermaid
erDiagram
  INCIDENTS ||--o{ INCIDENT_DEPARTMENTS : routes_to
  DEPARTMENTS ||--o{ INCIDENT_DEPARTMENTS : receives
  INCIDENTS ||--o{ TASKS : produces
  INCIDENT_DEPARTMENTS ||--o{ TASKS : owns
  TASKS ||--o{ TASK_ASSIGNMENTS : assignment_history
  USERS ||--o{ TASK_ASSIGNMENTS : worker
  INCIDENTS ||--o{ MEDIA : has
  INCIDENTS ||--o{ INCIDENT_STATUS_HISTORY : changes
  INCIDENTS ||--o{ AI_ANALYSIS_RESULTS : analysed_by
  INCIDENTS ||--|| LOCATIONS : located_at
```

`incidents` is the city-level truth. `incident_departments` represents each department’s independently managed slice of a multi-department incident. Each task belongs to exactly one `incident_department`, while an incident can have any number of tasks. Closing one department link must not automatically resolve the whole incident.

### Tables, fields, and indexes

All mutable tables need `created_at`, `updated_at`, and application-generated `id CHAR(26)` unless noted otherwise. Use UTC timestamps. Use JSON only for extensible snapshots; put filterable/reportable facts in normal columns.

| Table | Purpose and essential columns | Indexes / constraints |
| --- | --- | --- |
| `users` | Account core: `email`, `phone_e164` (nullable), `password_hash`, `status`, `last_login_at`, `display_name` | Unique normalized email when present; unique normalized phone when policy uses it; index `status`. |
| `roles`, `permissions`, `user_roles`, `role_permissions` | RBAC catalog and grants | Unique role/permission keys; unique join pairs. |
| `sessions` | Hashed opaque token, `user_id`, expiry, revocation, device metadata | Unique token hash; index `(user_id, expires_at)`. |
| `citizen_profiles` | `user_id`, contact preferences, language, verified flags | Unique `user_id`. Keep sensitive fields minimal. |
| `departments` | Name, code, type, approval state, service-area reference, contact metadata, availability | Unique `code`; indexes approval state/type. |
| `department_users` | User membership, department role, state, invited/approved metadata | Unique `(department_id, user_id)`; index user and active department. |
| `workers` | Worker extension: `user_id`, `department_id`, availability, team/name, emergency contact only if authorized | Unique active worker membership; index `(department_id, availability)`. |
| `activation_codes` | Hashed code, purpose, target department/email, expires/redeemed/revoked data | Index usable-code lookup and expiry; never store raw code. |
| `incident_categories`, `incident_subcategories` | Configurable citizen-facing and internal taxonomy, help copy, active/sort flags | Unique stable slug; indexed parent/active. |
| `department_routing_rules` | Category/subcategory/entity/severity conditions, department, weight, active/priority | Index active category/subcategory and department. Version rules for auditability. |
| `priority_policies` | Configurable score band, factors, label, active/version | Range/active index; store applied policy version on analysis. |
| `locations` | Captured address text, locality/ward, latitude, longitude, precision, source, geocode metadata | Index `(latitude, longitude)` only for bounding-box queries; index ward/locality. Do not assume unsupported TiDB GIS features. |
| `incidents` | Public-safe core: public reference, citizen, category/subcategory, lifecycle status, severity, priority score/band, privacy level, location, short title, confirmed/routed/resolved timestamps, emergency flag | Unique reference; composite indexes `(status, priority_score, created_at)`, `(category_id, created_at)`, `(severity, created_at)`, `(location_id)`, `(citizen_id, created_at)`. |
| `incident_private_details` | Original transcript/text, contact snapshot, redacted fields, sensitive facts, encryption metadata | Unique `incident_id`; access through a dedicated redaction service. |
| `incident_departments` | Incident/department link, routing reason, status, acknowledgement, priority override, visibility, received/resolved timestamps | Unique `(incident_id, department_id)`; index `(department_id, status, priority_score)` and incident. |
| `incident_assignments` | Record of dispatcher/team/worker assignments at incident-link level | Index active assignment and history by incident department. |
| `tasks` | Department-owned task: incident link, title, required action, task status, priority snapshot, due/escalation timestamps, current assignee pointer | Index `(incident_department_id, status, priority)` and `(current_worker_id, status)`. |
| `task_assignments` | Immutable worker assignment history: assigned/unassigned time, actor/reason | Index task and worker history; only one active assignment enforced in service transaction. |
| `incident_status_history`, `incident_department_status_history`, `task_status_history` | Append-only from/to state, actor, reason, timestamp, safe metadata | Index entity/timestamp and actor. |
| `media` | Storage key, MIME, size, checksum, scanning state, purpose, visibility, related incident/task, uploader | Index related entity/purpose; enforce allowed MIME/size before issuing upload. |
| `ai_analysis_results` | Provider/model/version, redacted input hash, transcript, parsed entities JSON, confidence, severity/priority/routing proposal, policy version, review state | Index incident/time/provider; retain outputs for audit and correction. |
| `ai_recommendations` | Specific request-for-info, guidance, routing/escalation recommendations, acceptance/rejection and actor | Index incident/state. |
| `notifications`, `notification_preferences`, `delivery_attempts` | In-app notification, channel, payload template key, delivery/retry state, read state | Index recipient/unread/created and retry due time. |
| `emergency_contacts` | Verified contact record, service/category/area applicability, source, verification date, active state | Never seed unverified numbers; index active/category/area. |
| `escalation_policies`, `escalation_records` | Configurable SLA/escalation rules and actual triggers/acknowledgements | Index active rules and unresolved escalation records. |
| `audit_logs` | Append-only actor, role/scope snapshot, event key, target, timestamp, IP/device metadata, redacted metadata | Index target/time, actor/time, event/time. Avoid secrets, full transcripts, and raw tokens. |
| `outbox_events` | Transactional events for async delivery; type, safe payload, status, retry schedule/idempotency key | Unique idempotency key; index pending retry time. |

Use MySQL-compatible types (`VARCHAR`, `CHAR`, `DECIMAL`, `DATETIME`, `JSON`, `TINYINT`, `INT`) deliberately. Add foreign keys only after confirming the selected TiDB deployment/version behavior; application transactions and repository checks must preserve integrity either way. Do not use PostgreSQL arrays, enums, `RETURNING` assumptions, extensions, or PostGIS.

### Privacy levels

| Level | Typical use | Map and data rule |
| --- | --- | --- |
| `PUBLIC` | Non-sensitive civic issue | Exact location only to authorized operational users; citizen-facing tracking remains private. |
| `RESTRICTED` | Potentially identifying/safety matter | Show broad area/ward to non-authorized viewers; hide direct contact and private narrative. |
| `SENSITIVE` | Cybercrime, vulnerable people, violence, or protected report | No public/admin-map marker with identifiable data. Permit only specifically authorized role/department access; redact worker view to task minimum. |

The privacy level can be proposed by AI but must be validated by rules and editable by an authorized human. The original narrative should be separated from the display-safe summary from the first write.

## 7. Incident, department, and task state machines

Treat the state machine as an explicit domain service, not a free-form string update. Every transition requires actor authorization, transition validation, an append-only history row, an audit event, and relevant notification/outbox events in one transaction.

### City-level incident states

| State | Meaning | Valid next states |
| --- | --- | --- |
| `DRAFT` | Citizen has not submitted input | `AI_PROCESSING`, `CANCELLED` |
| `AI_PROCESSING` | Transcript/analysis is being generated | `AWAITING_CITIZEN_CONFIRMATION`, `NEEDS_INFORMATION`, `EMERGENCY_GUIDANCE`, `AI_FAILED`, `CANCELLED` |
| `NEEDS_INFORMATION` | Required dynamic input missing | `AI_PROCESSING`, `CANCELLED` |
| `AWAITING_CITIZEN_CONFIRMATION` | AI summary shown; not official yet | `CONFIRMED`, `NEEDS_INFORMATION`, `CANCELLED`, `EXPIRED` |
| `EMERGENCY_GUIDANCE` | Urgent triage guidance/contact view shown | `AWAITING_CITIZEN_CONFIRMATION`, `CONFIRMED`, `CANCELLED` |
| `CONFIRMED` | Citizen confirms; routing transaction pending | `ROUTED` |
| `ROUTED` | At least one incident-department link created and notified | `IN_PROGRESS`, `PENDING_VERIFICATION`, `RESOLVED`, `ESCALATED` |
| `IN_PROGRESS` | One or more department tasks active | `PENDING_VERIFICATION`, `ESCALATED`, `RESOLVED` |
| `PENDING_VERIFICATION` | Required work complete; department verification pending | `IN_PROGRESS`, `RESOLVED`, `ESCALATED` |
| `ESCALATED` | An SLA/safety rule fired; work continues | `IN_PROGRESS`, `PENDING_VERIFICATION`, `RESOLVED` |
| `RESOLVED` | All required department links verified/resolved | `CLOSED`, `REOPENED` |
| `CLOSED` | Final administrative closure | `REOPENED` |
| `CANCELLED`, `EXPIRED`, `AI_FAILED` | Terminal/exception states | `DRAFT` only via a new duplicate/retry flow; preserve history |

`REOPENED` can return to `ROUTED` or `IN_PROGRESS` only with a documented reason and a notification. Never overwrite a prior history row.

### Department link and task states

`incident_departments` uses: `ROUTED → RECEIVED → ASSIGNED → IN_PROGRESS → WORK_COMPLETED → VERIFIED → RESOLVED`, plus `DECLINED` (requires reason and admin visibility), `ESCALATED`, and `CANCELLED`.

Tasks use: `UNASSIGNED → ASSIGNED → ACCEPTED → EN_ROUTE → REACHED_SITE → WORK_STARTED → WORK_COMPLETED → AWAITING_VERIFICATION → VERIFIED → RESOLVED`, with `REASSIGNED`, `BLOCKED`, and `CANCELLED` exception paths. A worker cannot resolve the city-level incident; their completion is evidence for department verification.

Citizen tracking translates internal state into five simple labels: **Submitted**, **Received**, **Assigned**, **In progress**, and **Resolved**. Do not reveal internal notes, worker location, security details, or a department’s internal escalation reason.

## 8. AI incident engine

### Processing contract

1. The browser records voice only after permission, shows recording state, and allows text fallback.
2. Upload audio through a short-lived private upload URL; validate type/size/duration server-side before processing.
3. Queue speech-to-text. Display that the report is being understood; do not claim certainty.
4. Send the transcript and only necessary media context to `IncidentAnalysisProvider` after data minimisation/redaction appropriate to the provider agreement.
5. Require structured JSON that conforms to a server-owned schema; reject/repair invalid output, never parse free-form prose as business data.
6. Run deterministic policy/routing validation after model output. The model may suggest categories/departments, but the configured taxonomy and rules decide allowable routes and priority band.
7. Persist the analysis version, confidence, policy version, and safe summary. If confidence is low or required facts are missing, ask targeted follow-up questions instead of guessing.
8. Show the citizen a clear summary and the exact departments/services proposed. On edit, re-run analysis and retain the prior version for audit.
9. On confirmation, create the incident-department links atomically, enqueue notifications, and return the report reference. An idempotency key prevents double submission.

### Required structured analysis shape

```ts
type IncidentAnalysis = {
  categorySlug: string | null
  subcategorySlug: string | null
  title: string
  citizenSummary: string
  internalSummary: string
  entities: {
    locationText?: string
    peopleAffected?: number
    injuries?: boolean
    vehicles?: number
    fire?: boolean
    blockage?: boolean
    infrastructure?: string[]
    hazards?: string[]
    timeContext?: string
  }
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  priorityFactors: Record<string, number | boolean | string>
  proposedPriorityScore: number // 0–100; validated server-side
  proposedDepartmentCodes: string[]
  requiredInformation: Array<{
    field: 'location' | 'description' | 'photo' | 'video' | 'people_affected' | 'other'
    requirement: 'REQUIRED' | 'RECOMMENDED' | 'OPTIONAL'
    reason: string
  }>
  privacyProposal: 'PUBLIC' | 'RESTRICTED' | 'SENSITIVE'
  emergencyAssessment: {
    isPotentialEmergency: boolean
    guidanceKey?: string
    requiresImmediateContactPrompt: boolean
  }
  confidence: number
  uncertaintyNotes: string[]
}
```

Use an `AI_ANALYSIS_SCHEMA_VERSION`. Version prompts, provider/model configuration, and scoring policy separately. Never expose hidden prompts, confidence internals, or unredacted model reasoning to the citizen UI.

### Priority and routing policy

Start with transparent, configurable scoring factors: injury/life risk, active fire/gas/electrical danger, number of affected people, obstruction/public impact, vulnerable location, time sensitivity, recurrence, and verified media/location. Store individual applied factors so an admin can explain why a report was treated as high priority. Initial bands may be `0–30 low`, `31–60 medium`, `61–80 high`, and `81–100 critical`, but obtain them from `priority_policies` rather than constants.

Routing evaluates active taxonomy mappings and rules in priority order. It returns zero or more departments with a reason. A zero-route result goes to an admin review queue; it must not disappear or be auto-routed to an arbitrary department. Examples to seed as rules, not frontend code:

| Internal problem | Candidate department services |
| --- | --- |
| Road accident with injuries/blockage | Police, health/ambulance liaison, traffic management |
| Fire | Fire & rescue; optionally police, health, disaster response when conditions match |
| Flooded road | Water/drainage, roads/public works, traffic |
| Pothole | Roads/public works |
| Sewage overflow | Water/drainage; environmental/public health if configured |

Emergency classification triggers a high-visibility emergency panel with approved, database-configured contact information and safety copy. It may still log/route a confirmed incident; it must clearly say that displaying a contact or notification is **not dispatch confirmation**.

### Graceful failure and human override

If recording, transcription, AI analysis, geocoding, or a map provider fails, the citizen can continue with text/manual location, save/retry a draft, or reach emergency guidance as applicable. Department/admin users can correct category, severity, privacy, route, and priority, with reason/versioned audit evidence. The system must never block emergency guidance because an AI provider is unavailable.

## 9. API and server-action contract

Use route handlers for externally callable APIs and server actions only for authenticated, same-origin form mutations. All mutations require CSRF/origin protection appropriate to the selected session model, schema validation, authorization, idempotency when retrying would be unsafe, audit entries, and correct problem-detail errors.

### Auth and identity

| Method | Endpoint | Notes |
| --- | --- | --- |
| `POST` | `/api/auth/register/citizen` | Minimal citizen account; rate limited; verify contact according to policy. |
| `POST` | `/api/auth/login` | Generic failure response; lockout/rate-limit policy; rotate session. |
| `POST` | `/api/auth/logout` | Revoke current session. |
| `POST` | `/api/auth/password/forgot` | Time-limited one-use reset workflow; do not reveal account existence. |
| `POST` | `/api/auth/department-activation` | Redeem valid approved department activation code. |
| `POST` | `/api/auth/worker-invite/accept` | Department-issued worker onboarding only. |
| `GET` | `/api/me` | Safe authenticated profile/permissions/scopes. |

### Citizen report flow

| Method | Endpoint | Responsibility |
| --- | --- | --- |
| `POST` | `/api/incidents/drafts` | Create idempotent citizen draft with privacy choice and initial text. |
| `PATCH` | `/api/incidents/drafts/:id` | Add/edit text, consent, location, dynamic answers; enforce owner. |
| `POST` | `/api/media/upload-intents` | Validate desired upload and issue short-lived private upload intent. |
| `POST` | `/api/incidents/drafts/:id/transcription` | Queue/upload-reference transcription job; return job state. |
| `POST` | `/api/incidents/drafts/:id/analyse` | Queue/re-run structured AI analysis. |
| `GET` | `/api/incidents/drafts/:id/analysis` | Safe analysis/result state for the owner. |
| `POST` | `/api/incidents/drafts/:id/confirm` | Revalidate draft, require any truly required information, freeze analysis snapshot, route atomically. |
| `GET` | `/api/incidents/:reference` | Citizen sees only their incident’s tracking-safe projection. |
| `GET` | `/api/citizen/incidents` | Paginated own incident list. |
| `GET/PATCH` | `/api/citizen/notification-preferences` | Opt-in channels and preferences. |

For unauthenticated reporting, either keep an anonymous, non-routable short-lived local draft or explicitly build verified-contact guest reporting. Do not silently create a permanent citizen profile without the consent/legal policy required for this deployment.

### Admin APIs

| Method | Endpoint group | Responsibility |
| --- | --- | --- |
| `GET` | `/api/admin/incidents` | Paginated/filterable city incident projection; scope/redaction aware. |
| `GET` | `/api/admin/incidents/:id` | Detail, route/analysis/history/actions after permission check. |
| `GET` | `/api/admin/map/incidents` | Bounding-box/zoom-filtered safe marker DTO, never raw incident rows. |
| `GET/POST/PATCH` | `/api/admin/departments` and `/:id` | Create, review, approve, suspend, and manage department metadata. |
| `POST` | `/api/admin/departments/:id/activation-codes` | Create auditable expiring code; return raw code once only. |
| `GET/PATCH` | `/api/admin/taxonomy/*`, `/routing-rules`, `/priority-policies` | Versioned configuration management. |
| `GET/PATCH` | `/api/admin/emergency-contacts` | Verification source/date mandatory before activation. |
| `GET` | `/api/admin/analytics/*` | Aggregate, privacy-safe KPI/trend responses. |
| `GET` | `/api/admin/audit-logs` | Filtered, permission-gated audit log. |

### Department and worker APIs

| Method | Endpoint group | Responsibility |
| --- | --- | --- |
| `GET` | `/api/department/incidents` | Only authenticated department links; filter by state/priority/assignee. |
| `POST` | `/api/department/incidents/:id/acknowledge` | `ROUTED → RECEIVED`. |
| `POST` | `/api/department/incidents/:id/tasks` | Create department task with action/safety instructions. |
| `POST` | `/api/department/tasks/:id/assign` | Assign/reassign active department worker transactionally. |
| `POST` | `/api/department/tasks/:id/verify` | Verify evidence and advance department link; reason required for rejection. |
| `GET/POST/PATCH` | `/api/department/workers` | Invite, activate, suspend, availability and limited roster management. |
| `GET` | `/api/worker/tasks` | Current worker’s assigned task projection only. |
| `GET` | `/api/worker/tasks/:id` | Minimum necessary task details and map/navigation action. |
| `POST` | `/api/worker/tasks/:id/transitions` | Valid worker state transitions with optional note. |
| `POST` | `/api/worker/tasks/:id/media` | Upload intent/link for before/after proof; scanning required before verification. |

Use cursor pagination and explicit filter allowlists. For route parameters, resolve an opaque ID/reference and check scope inside services. Never trust client-provided `departmentId`, role, priority, status, or citizen identity.

## 10. Pages and interaction design

### Route map

| Route group | Key pages | Purpose |
| --- | --- | --- |
| `(public)` | `/`, `/emergency`, `/track` | Landing/report entry, official emergency guidance, report ID lookup with secure verification. |
| `(citizen)` | `/report`, `/report/voice`, `/report/review`, `/reports`, `/reports/[reference]`, `/notifications`, `/settings` | Voice/text capture, dynamic questions, confirmation, tracking, preferences. |
| `(admin)` | `/admin`, `/admin/map`, `/admin/incidents`, `/admin/incidents/[id]`, `/admin/departments`, `/admin/departments/approvals`, `/admin/users`, `/admin/taxonomy`, `/admin/routing`, `/admin/contacts`, `/admin/analytics`, `/admin/audit`, `/admin/settings` | City command centre and configuration. |
| `(department)` | `/department`, `/department/incidents`, `/department/incidents/[id]`, `/department/tasks`, `/department/workers`, `/department/analytics` | Department triage, dispatch, verification, workers, workload. |
| `(worker)` | `/worker`, `/worker/tasks/[id]`, `/worker/profile` | Mobile-first task execution and evidence upload. |

Guard route groups server-side and redirect unauthorized users without revealing protected resources. Build an error, loading, empty, permission-denied, offline/retry, and not-found state for every major flow.

### Citizen journey

1. Landing shows one primary action: **Tell us what happened**. Keep an obvious manual-entry route and an emergency action nearby.
2. The report composer allows voice, text, photo (where safe), and location. Explain microphone/location permission and provide no-permission alternatives.
3. After analysis, show plain-language “We understood your problem as…” with incident type, location, people/hazard facts, severity, priority band/meaning, departments/services, recommended/required extra information, and privacy choice.
4. For normal incidents, enable **Confirm & send** only once required facts are present. Confirm performs the routing transaction.
5. For possible emergencies, interrupt with calm, prominent safety guidance and verified service contacts. Let the user return to or continue the incident record; do not make calls or claim dispatch without explicit supported integration.
6. After confirmation, show a reference ID, citizen-safe status timeline, what happens next, and notification preferences.

### Admin/department/worker experiences

Admin is a city command centre: KPI cards, priority-aware live feed, map, department workload, drill-down incident detail, policy/configuration, and audit visibility. Department is a triage and dispatch workspace filtered to its incident links. Worker is a mobile-first, low-distraction queue of assigned tasks with clearly sequenced state actions, map/navigation, safety instructions, and proof capture.

Present the map as operational context, not as a public incident browser. Marker payloads must be a deliberately redacted map DTO, constrained by bounding box, zoom, timeframe, role, and privacy level.

## 11. Visual system derived from the Framer reference

Implement a project-owned design-token layer. Do not depend on proprietary fonts or blindly replicate Framer branding.

| Token family | Implementation direction |
| --- | --- |
| Canvas and surfaces | Near-black, slightly warm canvas; charcoal elevation steps; soft hairline dividers. The app remains dark by default. |
| Text | Bright primary text and muted gray secondary text. Use an open, licensed fallback (e.g. Inter/Geist/Mona Sans) if GT Walsheim is not licensed. |
| Display type | Large, confident and tightly tracked only on public/landing headings. Use responsive `clamp()` sizing; do not use huge typography in dense control-room tables. |
| Actions | White primary pill CTA, dark secondary pill, accessible focus ring in the restrained blue accent. Minimum touch target: 44px. |
| Cards | 15–20px card radius, clearer operational density in dashboards, 30px radius for occasional marketing/empty-state gradient cards. Gradients remain cards—not full operational backgrounds. |
| Semantic states | Define accessible semantic pairs for critical, high, medium, low, success, warning, and error. Pair colour with text, icon, priority label, and shape/badge. |
| Data views | Tables need keyboard navigation, sort/filter state in URL query parameters, visible focus, sufficient contrast, and responsive card/list alternatives. |

At desktop use a persistent navigation rail/side navigation for internal portals. At tablet/mobile collapse it into a drawer. The worker portal should be mobile-first; action buttons remain thumb-friendly and never depend on hover. Use skeletons only when their content size is predictable; otherwise use clear status text.

## 12. Coordinates, locations, and map import plan

There is no department-coordinate JSON in the workspace at planning time. When supplied, do not code against an assumed shape. First add `docs/coordinate-import-format.md` describing the accepted manifest and an example such as:

```json
{
  "version": 1,
  "departments": [
    {
      "departmentCode": "ROADS",
      "name": "Roads and Public Works",
      "serviceAreas": [
        {
          "name": "Ward 1",
          "geometry": { "type": "Polygon", "coordinates": [] }
        }
      ],
      "officeLocation": { "latitude": 0, "longitude": 0 }
    }
  ]
}
```

Implement `db/importers/import-department-coordinates.ts` as an explicit operator command with `--dry-run` and `--apply` modes. It must:

1. Validate JSON shape/version and every coordinate range; reject mixed coordinate order, invalid rings, unknown department codes, duplicate feature IDs, and unsupported geometry.
2. Print a reconciliation report (new, updated, rejected, unlinked department records) before applying anything.
3. Upsert only by immutable department code and external feature ID. Never match on display name alone.
4. Store the original file hash, import timestamp, actor, source filename, version, and change summary in an import/audit record.
5. Preserve existing service-area versions so an incident’s historical route can be explained.
6. Use bounding boxes/application point-in-polygon logic only after validating TiDB capability and performance. Do not fabricate a geographic result when a location is outside all known areas; send it to review.

The live incident map needs only incident point data and optional department service-area overlays. Keep geocoding/provider calls behind the map provider boundary, cache normalised results with provenance, and allow a citizen to correct a location before confirmation.

## 13. Security, safety, and reliability checklist

- Hash passwords with Argon2id and modern per-password salts; never log credentials, reset tokens, activation codes, session tokens, raw media URLs, or provider keys.
- Use TLS, secure `HttpOnly` cookies, `SameSite=Lax` or stricter justified policy, CSRF/origin protection for cookie-authenticated mutations, session expiry/rotation, logout/revocation, and idle-session policy.
- Enforce RBAC plus resource scope in services. Add tests proving a worker cannot fetch an unassigned task and one department cannot read another’s link.
- Validate and normalize all input. Use parameterized queries. Escape output by default. Rate-limit login, activation redemption, report creation, AI/transcription requests, upload intents, and tracking lookups.
- Require server-issued upload intents. Allowlist MIME/type/size/duration, inspect magic bytes where possible, malware scan before making files available, strip unsafe metadata/EXIF according to privacy policy, and use private signed downloads.
- Separate `incident_private_details` from display-safe data. Encrypt especially sensitive stored fields using a managed key strategy when deployment supports it; define key rotation and access logging.
- Record immutable, redacted audit events for security and operational mutations. Restrict audit-log access and retention policy.
- Use idempotency keys and transactional outbox events for report confirmation, state transitions, assignments, and notifications. Design all jobs for at-least-once execution with deduplication.
- Include CSP, frame-ancestor policy, security headers, dependency scanning, error tracking with PII scrubbing, structured logs, health checks, backup/restore test, and minimal production monitoring.
- Treat AI output as untrusted external input. Schema validate it, constrain it to active taxonomy, retain correction feedback, and do not let it call tools/dispatch/permissions directly.
- Display only verified, configured emergency contacts. Attach source and verification date, and add a process to expire/reverify records. No made-up helpline numbers in seeds or mock copy.

## 14. Incremental Antigravity execution plan

Each phase must leave the application runnable, typed, linted, and testable. Commit one coherent phase at a time. Do not skip tests merely because fixtures are used in a hackathon demo.

### Phase 0 — bootstrap and engineering guardrails

1. Create the new Next.js TypeScript App Router project in `C:\NAGPUR-ONE\nagpur-connect`; leave `material-web-main` untouched.
2. Add strict TypeScript, formatter/linter, `.editorconfig`, `.gitignore`, `.env.example`, README, test runner, E2E runner, and CI workflow for install/typecheck/lint/unit tests/build.
3. Add the design-token foundation, global dark shell, accessible typography, buttons, inputs, badge, card, dialog, toast, empty/error/loading state, table/list primitives, and icon policy.
4. Establish module aliases and server-only import boundaries. Add a centralized error/response format and request correlation ID.
5. Add a local development composition/configuration for TiDB-compatible MySQL access or clearly document the chosen managed TiDB development connection. No production credentials in the repo.

**Exit criteria:** `dev`, typecheck, lint, test, and production build all run; public shell renders responsively; no material-reference source is imported.

### Phase 1 — schema, migrations, fixtures, and identity

1. Implement schema/migrations for users, roles/permissions, sessions, departments, memberships, workers, activation codes, taxonomy, emergency contacts, audit, outbox, and imports.
2. Seed deterministic demo roles, a super admin through an environment-driven bootstrap command, approved/pending sample departments, citizen categories, subcategories, routing rules, priority policies, and clearly labelled placeholder emergency contact records that remain inactive until verified.
3. Build custom session/auth flows and route guards. Implement password reset and rate limiting as scoped features rather than UI-only stubs.
4. Build admin department approval and activation-code issuance/redeeming; build department worker invitation/activation.
5. Test migration on the actual TiDB-compatible target and write authorization tests for every role.

**Exit criteria:** An admin can safely activate a department; a department can provision a worker; invalid/expired/reused codes fail; unauthorized route/API access is denied and audited.

### Phase 2 — taxonomy, routing configuration, location foundation

1. Build CRUD/version workflow for taxonomy, routing rules, priority policies, department service areas, emergency-contact records, and escalation policies. Restrict this to super admins.
2. Seed the eight citizen-facing categories and enough internal subcategories/mappings to demonstrate the major paths; expand toward the requested 70+ as data, not components.
3. Implement location capture, manual address fallback, provider abstraction, coordinate validation, normalisation, redaction levels, and map DTOs.
4. Add the coordinate-import contract and dry-run/apply importer described above. Keep it ready for the later JSON file without guessing its schema.

**Exit criteria:** Admin can configure a mapping without deployment; a valid sample coordinate file dry-runs and imports reproducibly; protected location data is redacted correctly.

### Phase 3 — citizen report and confirmation flow

1. Build the public landing page, report composer, category browse/help, text path, microphone permission flow, manual location path, privacy selector, and safe media upload intent flow.
2. Implement `DRAFT`, dynamic answer storage, client-side draft recovery, explicit consent language, and the resilient failure/retry states.
3. Build the analysis-progress and citizen-summary UI. Use a deterministic fixture analysis adapter first to exercise all states while provider credentials are absent.
4. Require citizen confirmation to create a routed report. Generate the public-safe incident reference, citizen tracking timeline, and in-app notification record.

**Exit criteria:** A citizen can text-report a pothole/accident, add only relevant requested details, review a summary, confirm once, receive an ID, and see a safe tracking page. Double-click/retry cannot create duplicate routed incidents.

### Phase 4 — AI, voice, priority, and emergency handling

1. Implement the audio upload/transcription job contract and provider adapter. Store only private media references and transcribed data in the private detail boundary.
2. Implement schema-constrained incident analysis, missing-information questions, confidence thresholds, configured priority score calculation, routing validation, analysis versioning, and admin correction workflow.
3. Implement the urgent/emergency safety panel and verified-contact resolver. Copy must distinguish guidance/notification from actual dispatch.
4. Test provider failure, malformed output, low confidence, no route, mixed routing (accident/fire/flood), and emergency flow with deterministic fixtures.

**Exit criteria:** Voice/text reaches the same review/confirm flow; no invalid model output changes an incident; a life-risk fixture shows guidance immediately even if analysis/job retries.

### Phase 5 — admin command centre and department dispatch

1. Build admin KPIs, incident list/detail, safe live map, priority filters, live/recent feed, department workload, configuration surfaces, audit view, and initially simple aggregation queries.
2. Build department dashboard, filtered incident queue, acknowledgement, internal notes, worker roster, assignment, task creation, proof review, verification, and department analytics.
3. Implement notifications/outbox delivery adapter with an in-app channel first; add email/SMS/push only when credentials/compliance requirements are approved.
4. Implement state machine enforcement, citizen projection, department-link independence, and escalation jobs/policies.

**Exit criteria:** One accident can route to police, traffic, and health; each department sees only its link; their tasks can progress independently; citizen status becomes resolved only after all required work is verified.

### Phase 6 — mobile worker portal and evidence trail

1. Build worker mobile dashboard, priority queue, task detail, navigation handoff, accepted/en-route/reached/start/complete actions, notes, before/after proof, and offline/retry-aware UX.
2. Enforce minimum-data worker projection and scoped signed media URLs. Give clear safety instructions but do not expose sensitive citizen identity by default.
3. Build department verification/rejection/reassignment flow and complete audit/status history timeline.

**Exit criteria:** A worker can only operate assigned tasks, attach valid proof, move through permitted transitions, and have the work verified/rejected by their department with full history.

### Phase 7 — analytics, hardening, and demo readiness

1. Add metrics for incident category/area/department, new/critical/in-progress/resolved, response time, resolution time, recurring locations, department workload, and escalations. Use aggregate/read-model queries; avoid calculating city-wide dashboard metrics in browser code.
2. Add accessibility tests, keyboard/screen-reader passes, responsive visual QA, performance checks for map/list pagination, security headers, upload scanning workflow, audit review, and PII-scrubbed error observability.
3. Add comprehensive fixtures: pothole, accident, fire, flooded road, sensitive cybercrime, unrouteable report, expired code, malicious upload, and cross-department access attempts.
4. Document deployment, migration, backup/restore, provider configuration, coordinate import, emergency contact verification, and an operator runbook.

**Exit criteria:** End-to-end demo succeeds from voice/text citizen report through multi-department task verification, while security/access tests and production build pass.

## 15. Quality gates and test matrix

| Layer | Required checks |
| --- | --- |
| Unit | State transitions, score/routing policy, redaction, permissions, contact resolution, import validation, idempotency. |
| Integration | TiDB repositories/migrations, session lifecycle, confirmation transaction/outbox, assignment concurrency, upload-intent validation, AI JSON validation. |
| End-to-end | Citizen normal report, emergency guidance, admin approval, department activation, multi-department route, worker proof, department verification, citizen tracking. |
| Authorization | Every API must have positive and negative cases for citizen/admin/department/worker plus unrelated department/worker access. |
| Accessibility | Keyboard paths, names/roles/states, visible focus, contrast, error announcements, 44px touch targets, voice/manual alternatives. |
| Security | Rate-limit, CSRF/origin, IDOR, privilege escalation, malicious upload, expired/reused activation code, PII in map/log/error response. |
| Visual/responsive | Desktop command centre; tablet collapse; mobile report and worker task path; operational labels remain legible on dark backgrounds. |

Create fixtures and test helpers before complex UI. A happy-path mock is not acceptance evidence for a civic emergency product.

## 16. Deliverables expected from Antigravity

At the end of implementation, the new project folder should include:

- A runnable, documented Next.js/TiDB application with migrations and seed/import commands.
- `README.md` with local setup, environment variables, run/test commands, demo accounts supplied only through local environment setup, and known limitations.
- `docs/architecture.md`, `docs/api.md`, `docs/state-machines.md`, `docs/security-and-privacy.md`, `docs/coordinate-import-format.md`, `docs/emergency-contact-verification.md`, and `docs/operator-runbook.md`.
- A design-token/component inventory showing how the Framer reference was adapted for operational accessibility.
- Unit, integration, E2E, and authorization tests listed above.
- Clearly labelled provider adapters/fixtures so the demo works without falsely simulating a real ambulance/police/fire dispatch.

## 17. Explicitly deferred unless separately authorized

- Real emergency dispatch, CAD/112/ambulance/police/fire integrations.
- Publishing reports/maps to the general public.
- Automatic high-risk AI actions without authorized human/policy control.
- Unverified emergency phone numbers or operational SLAs.
- Biometric/face recognition, surveillance, or identity enrichment.
- Production SMS/email/push delivery without approved provider accounts, consent language, and legal/compliance review.
- Assuming the future department-coordinate JSON schema or fabricating Nagpur locations/service boundaries.

These are deliberate safety boundaries, not missing features. The prototype may demonstrate its workflow with fixture providers and explicitly labelled demo data while retaining a clean path to approved production integrations.
