/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Hazard-to-Incident Workflow Contracts
   Prompt 8: Authoritative Record Relationships, Explicit States,
   Deterministic Routing Linkages, and Evidence Provenance
   ════════════════════════════════════════════════════════ */

export type CitySlug = "mumbai" | "pune" | "nagpur";

// ─── 1. Distinct Lifecycle States (Never Conflate Hazards with Incidents) ───

/** Environmental Signal or Forecast State */
export type SignalState =
  | "SIGNAL_DETECTED"         // Upstream sensor/API reported active variable exceedance
  | "FORECAST_PROJECTED"      // Upstream numerical forecast projects potential exceedance
  | "NORMAL_MONITORING";      // Standard operational baseline within thresholds

/** Hypothetical Scenario State (Strictly Simulation) */
export type ScenarioState =
  | "HYPOTHETICAL_SCENARIO"   // Pure numerical model simulation; never a confirmed real-world incident
  | "SCENARIO_STORED"         // Persisted simulation run output with input hash
  | "SCENARIO_SUPERSEDED";    // Older simulation run configuration replaced by new parameter set

/** Screening Result State */
export type ScreeningState =
  | "SCREENING_FLAGGED"       // Susceptibility score exceeds screening baseline; review recommended
  | "SCREENING_BASELINE"      // Normal susceptibility tier
  | "SCREENING_DISMISSED";    // Reviewed by municipal engineer and assessed as false alarm

/** Citizen-Submitted Report State */
export type CitizenReportState =
  | "CITIZEN_SUBMITTED"       // Citizen logged report via mobile/web UI
  | "AWAITING_CONFIRMATION"   // User reviewing AI classification & location prefill
  | "COMMUNITY_REPORTED"      // Submitted by verified local community observer
  | "NEEDS_INFORMATION"       // Clarification requested from citizen
  | "WITHDRAWN";              // Retracted by citizen

/** Verified Incident State (Authorized Municipal Operations) */
export type IncidentLifecycleState =
  | "DRAFT"                   // Citizen/sensor draft prior to submission
  | "CONFIRMED"               // Validated report received and registered in municipal system
  | "ROUTED"                  // Assigned to primary and supporting municipal departments
  | "IN_PROGRESS"             // Field team dispatched or actively executing mitigation
  | "PENDING_VERIFICATION"    // Work completed on site; awaiting engineering inspection
  | "ESCALATED"               // Breached SLA or escalated to disaster management command
  | "RESOLVED"                // Field work verified and signed off
  | "CLOSED"                  // Administrative signoff complete
  | "REJECTED";               // Classified as duplicate, out of jurisdiction, or non-actionable

/** Administrative Assessment State */
export type AdminAssessmentState =
  | "UNDER_ADMIN_REVIEW"      // Queued for municipal decision-support review
  | "ADVISORY_DRAFTED"        // Precautionary advisory drafted; awaiting formal authorization
  | "APPROVED"                // Authorized by municipal official for dispatch/alerting
  | "REJECTED"                // Review declined by administrator with documented rationale
  | "CANCELLED";              // Obsoleted by changing weather or operational conditions

/** Published Official Warning State */
export type OfficialWarningState =
  | "WARNING_INGESTED"        // Official bulletin received from IMD, CPCB, or CWC
  | "AWAITING_REVIEW"         // Municipal disaster cell reviewing for local publication
  | "APPROVED_PUBLISHED"      // Officially broadcast to citizens and field agencies
  | "EXPIRED"                 // Time horizon elapsed
  | "CANCELLED";              // Rescinded by issuing meteorological/environmental agency

/** Department Task State */
export type DepartmentTaskLifecycleState =
  | "TASK_PENDING_APPROVAL"   // Recommended task waiting for departmental supervisor approval
  | "TASK_ASSIGNED"           // Assigned to primary department queue or specific field worker
  | "TASK_ACCEPTED"           // Field worker/supervisor formally acknowledged task receipt
  | "TASK_EN_ROUTE"           // Mitigation vehicle/crew traveling to site
  | "TASK_REACHED_SITE"       // Geofenced arrival at incident site
  | "TASK_IN_PROGRESS"        // Active mitigation (e.g. dewatering pump deployment)
  | "TASK_BLOCKED"            // Dependent on another agency (e.g. waiting for traffic police diversion)
  | "TASK_COMPLETED"          // Physical work finished; photo/log evidence attached
  | "TASK_VERIFIED_CLOSED"    // Municipal supervisor confirmed resolution
  | "TASK_CANCELLED";         // Task cancelled due to changed circumstances

// ─── 2. Authoritative Evidence Linkage Interface ───

export interface WorkflowEvidenceLink {
  linkId: string;
  sourceType: "TELEMETRY_OBSERVATION" | "SIMULATION_RUN" | "CITIZEN_REPORT" | "OFFICIAL_WARNING" | "HISTORICAL_HOTSPOT";
  sourceId: string;
  targetType: "INCIDENT" | "DEPARTMENT_TASK" | "ADMIN_ADVISORY" | "DOSSIER";
  targetId: string;
  city: CitySlug;
  wardId?: string;
  correlationScore: number;     // 0.0 to 1.0 confidence/relevance score
  correlationRationale: string; // Plain-language scientific or operational explanation
  linkedBy: string;             // Actor ID or automated system engine
  createdAt: string;
}

// ─── 3. Unified Cross-Entity Record Schema ───

export interface UnifiedHazardWorkflowRecord {
  // Identity & Jurisdiction
  workflowId: string;
  publicReference: string;
  city: CitySlug;
  wardId: string;
  wardName: string;

  // Discrete States
  signalState: SignalState;
  scenarioState: ScenarioState;
  screeningState: ScreeningState;
  citizenReportState: CitizenReportState;
  incidentState: IncidentLifecycleState;
  assessmentState: AdminAssessmentState;
  warningState: OfficialWarningState;
  taskState: DepartmentTaskLifecycleState;

  // Foreign Identifiers (Traceable Links)
  telemetryObservationId?: string | null;
  simulationRunId?: string | null;
  scenarioId?: string | null;
  dossierId?: string | null;
  dossierVersion?: string | null;
  citizenReportId?: string | null;
  incidentId?: string | null;
  adminReviewId?: string | null;
  officialWarningId?: string | null;
  primaryDepartmentCode?: string | null;
  supportingDepartmentCodes: string[];
  departmentTaskIds: string[];
  criticalFacilityIds: string[];
  hotspotIds: string[];

  // Provenance & Timestamps
  observedAt?: string | null;
  simulatedAt?: string | null;
  reportedAt?: string | null;
  routedAt?: string | null;
  slaDueAt?: string | null;
  resolvedAt?: string | null;

  // Metadata
  isHypothetical: boolean;      // True if originating from simulation; prevents public alert generation
  requiresHumanReview: boolean; // True if routing or advisory needs authorized official signoff
  auditNotes: string[];
}

// ─── 4. Precautionary Advisory Draft Interface ───

export interface PrecautionaryAdvisoryDraft {
  advisoryId: string;
  city: CitySlug;
  wardId: string;
  wardName: string;
  hazardType: string;
  severity: "ADVISORY" | "WATCH" | "WARNING" | "EMERGENCY";
  title: string;
  summary: string;
  recommendedCivicActions: string[];
  recommendedDepartmentActions: string[];
  supportingEvidence: {
    telemetrySource?: string;
    telemetryValue?: string;
    scenarioTitle?: string;
    screeningScore?: number;
    relatedCitizenReportCount: number;
    chronicHotspotNames: string[];
  };
  approvalStatus: "DRAFT" | "AWAITING_REVIEW" | "APPROVED_PUBLISHED" | "REJECTED";
  draftedBy: string;
  approvedBy?: string | null;
  approvedAt?: string | null;
  expiresAt: string;
  createdAt: string;
}

// ─── 5. Department Task Coordination & Dependencies ───

export interface DepartmentTaskItem {
  taskId: string;
  incidentId: string;
  publicReference: string;
  city: CitySlug;
  wardId: string;
  departmentCode: string;
  departmentName: string;
  role: "PRIMARY" | "SUPPORTING";
  taskTitle: string;
  requiredAction: string;
  status: DepartmentTaskLifecycleState;
  dependsOnDepartment?: string | null;
  isBlocked: boolean;
  blockedReason?: string | null;
  assignedWorkerId?: string | null;
  assignedWorkerName?: string | null;
  actionNotes?: string | null;
  resolutionEvidenceUrl?: string | null;
  slaTargetMinutes: number;
  slaDueAt: string;
  isOverdue: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── 6. Citizen Report Contextual Prefill ───

export interface CitizenReportingPrefill {
  city: CitySlug;
  cityName: string;
  resolvedWardId?: string;
  resolvedWardName?: string;
  localityName?: string;
  coordinates?: [number, number];
  suggestedCategory: string;
  suggestedSubcategory?: string;
  hazardSignalText?: string;
  sourceObservationId?: string;
  sourceScenarioId?: string;
  timestamp: string;
  prefillNotice: string;
}
