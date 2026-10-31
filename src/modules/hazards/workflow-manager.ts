/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Unified Hazard-to-Incident Workflow Manager
   Prompt 8: Manages authoritative record relationships, evidence linking,
   advisory proposals, deterministic department dispatch, and state boundaries.
   ════════════════════════════════════════════════════════ */

import { execute, query } from "@/lib/db";
import { generateULID as ulid } from "@/lib/ids";
import type {
  CitySlug,
  UnifiedHazardWorkflowRecord,
  WorkflowEvidenceLink,
  PrecautionaryAdvisoryDraft,
  DepartmentTaskItem,
  CitizenReportingPrefill,
  DepartmentTaskLifecycleState,
} from "./workflow-contracts";
import { evaluateRoutingDecision } from "@/modules/routing/engine";
import { isDepartmentConfiguredForCity } from "@/modules/routing/registry";

// In-memory backing store for instant access and testing
const WORKFLOW_RECORDS = new Map<string, UnifiedHazardWorkflowRecord>();
const EVIDENCE_LINKS: WorkflowEvidenceLink[] = [];
const ADVISORY_DRAFTS = new Map<string, PrecautionaryAdvisoryDraft>();
const DEPARTMENT_TASKS = new Map<string, DepartmentTaskItem>();

/**
 * 1. Create a Reviewable Advisory Proposal from Simulation Output
 * STRICT RULE: Hypothetical simulation output is NEVER automatically converted
 * into a confirmed real incident or a public emergency alert.
 */
export async function createScenarioAdvisoryProposal(input: {
  city: CitySlug;
  scenarioId: string;
  scenarioTitle: string;
  wardId: string;
  wardName: string;
  screeningScore: number;
  hazardType: string;
  draftedBy: string;
  recommendedCivicActions?: string[];
  recommendedDepartmentActions?: string[];
  relatedCitizenReportCount?: number;
  chronicHotspotNames?: string[];
}): Promise<PrecautionaryAdvisoryDraft> {
  const advisoryId = `ADV-${ulid()}`;
  const workflowId = `WF-${ulid()}`;

  const severity = input.screeningScore >= 80
    ? "WARNING"
    : input.screeningScore >= 50
      ? "WATCH"
      : "ADVISORY";

  const advisory: PrecautionaryAdvisoryDraft = {
    advisoryId,
    city: input.city,
    wardId: input.wardId,
    wardName: input.wardName,
    hazardType: input.hazardType,
    severity,
    title: `Precautionary Advisory Proposal: ${input.wardName} (${input.scenarioTitle})`,
    summary: `Simulation scenario '${input.scenarioTitle}' indicates elevated susceptibility (${input.screeningScore}/100) in ${input.wardName}. Requires administrative review before any public or inter-agency broadcast.`,
    recommendedCivicActions: input.recommendedCivicActions || [
      "Monitor official municipal weather channels",
      "Avoid low-lying underpasses and chronic flood depressions if rain intensifies",
    ],
    recommendedDepartmentActions: input.recommendedDepartmentActions || [
      "Inspect gravity outfalls and suction pit debris screens",
      "Pre-position portable dewatering pumps at chronic junctions",
    ],
    supportingEvidence: {
      scenarioTitle: input.scenarioTitle,
      screeningScore: input.screeningScore,
      relatedCitizenReportCount: input.relatedCitizenReportCount || 0,
      chronicHotspotNames: input.chronicHotspotNames || [],
    },
    approvalStatus: "AWAITING_REVIEW", // Requires explicit administrative authorization
    draftedBy: input.draftedBy,
    expiresAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  };

  ADVISORY_DRAFTS.set(advisoryId, advisory);

  // Create unified workflow record keeping simulation separate from incidents
  const record: UnifiedHazardWorkflowRecord = {
    workflowId,
    publicReference: `SIM-PROP-${advisoryId.slice(-8)}`,
    city: input.city,
    wardId: input.wardId,
    wardName: input.wardName,
    signalState: "FORECAST_PROJECTED",
    scenarioState: "HYPOTHETICAL_SCENARIO",
    screeningState: "SCREENING_FLAGGED",
    citizenReportState: "CITIZEN_SUBMITTED",
    incidentState: "DRAFT",
    assessmentState: "UNDER_ADMIN_REVIEW",
    warningState: "AWAITING_REVIEW",
    taskState: "TASK_PENDING_APPROVAL",
    scenarioId: input.scenarioId,
    adminReviewId: advisoryId,
    supportingDepartmentCodes: [],
    departmentTaskIds: [],
    criticalFacilityIds: [],
    hotspotIds: [],
    simulatedAt: new Date().toISOString(),
    isHypothetical: true, // Guarantees this is flagged as simulation
    requiresHumanReview: true,
    auditNotes: [
      `Simulation advisory proposal generated for ${input.wardName} at score ${input.screeningScore}. Awaiting admin signoff.`,
    ],
  };

  WORKFLOW_RECORDS.set(workflowId, record);

  // Link evidence
  EVIDENCE_LINKS.push({
    linkId: ulid(),
    sourceType: "SIMULATION_RUN",
    sourceId: input.scenarioId,
    targetType: "ADMIN_ADVISORY",
    targetId: advisoryId,
    city: input.city,
    wardId: input.wardId,
    correlationScore: input.screeningScore / 100,
    correlationRationale: `Numerical simulation run indicates ${input.screeningScore}/100 screening susceptibility.`,
    linkedBy: input.draftedBy,
    createdAt: new Date().toISOString(),
  });

  return advisory;
}

/**
 * 2. Administrative Review & Approval of Advisory
 * Formal approval boundary: only authorized administrator can publish.
 */
export async function approveAdvisory(
  advisoryId: string,
  actor: { actorId: string; role: string; notes?: string }
): Promise<PrecautionaryAdvisoryDraft> {
  const advisory = ADVISORY_DRAFTS.get(advisoryId);
  if (!advisory) {
    throw new Error(`Advisory '${advisoryId}' not found.`);
  }

  if (actor.role !== "ADMIN" && actor.role !== "SUPER_ADMIN") {
    throw new Error(`Unauthorized: Role '${actor.role}' cannot authorize public advisories. Requires ADMIN role.`);
  }

  advisory.approvalStatus = "APPROVED_PUBLISHED";
  advisory.approvedBy = actor.actorId;
  advisory.approvedAt = new Date().toISOString();

  // Update DB if alerts table exists
  try {
    await execute(
      `UPDATE hazard_alerts SET approval_status = 'APPROVED_PUBLISHED', approved_by = ?, approved_at = NOW() WHERE alert_reference = ?`,
      [actor.actorId, advisoryId]
    );
  } catch {
    // Non-fatal if offline
  }

  return advisory;
}

/**
 * 3. Contextual Citizen Reporting Prefill Generator
 * Formats prefilled parameters with honest uncertainty disclaimers.
 */
export function generateCitizenReportingPrefill(input: {
  city: CitySlug;
  cityName: string;
  resolvedWardId?: string;
  resolvedWardName?: string;
  localityName?: string;
  coordinates?: [number, number];
  suggestedCategory: string;
  suggestedSubcategory?: string;
  sourceObservationId?: string;
  sourceScenarioId?: string;
  hazardSignalText?: string;
}): CitizenReportingPrefill {
  return {
    city: input.city,
    cityName: input.cityName,
    resolvedWardId: input.resolvedWardId,
    resolvedWardName: input.resolvedWardName,
    localityName: input.localityName,
    coordinates: input.coordinates,
    suggestedCategory: input.suggestedCategory,
    suggestedSubcategory: input.suggestedSubcategory,
    hazardSignalText: input.hazardSignalText,
    sourceObservationId: input.sourceObservationId,
    sourceScenarioId: input.sourceScenarioId,
    timestamp: new Date().toISOString(),
    prefillNotice:
      "Prefilled from Sentinel Environmental Intelligence. A rainfall forecast or high susceptibility score is NOT proof of current ground flooding. Please confirm the exact conditions you observe before submitting.",
  };
}

/**
 * 4. Deterministic Department Task Creation
 * Connects map/ward findings to authoritative department queues.
 * Enforces city jurisdiction isolation and task dependencies.
 */
export async function createDepartmentTask(input: {
  incidentId: string;
  publicReference: string;
  city: CitySlug;
  wardId: string;
  category: string;
  subcategory?: string | null;
  taskTitle: string;
  requiredAction: string;
  creatorRole: string;
  latitude?: number | null;
  longitude?: number | null;
  customDepartmentCode?: string;
}): Promise<DepartmentTaskItem> {
  // 1. Evaluate deterministic routing
  const routing = evaluateRoutingDecision({
    city: input.city,
    category: input.category,
    subcategory: input.subcategory,
    latitude: input.latitude,
    longitude: input.longitude,
  });

  const targetDept = input.customDepartmentCode || routing.primaryDepartment;

  // 2. City Jurisdiction Validation
  if (!isDepartmentConfiguredForCity(input.city, targetDept)) {
    throw new Error(
      `Jurisdiction Error: Department '${targetDept}' is not configured for ${input.city.toUpperCase()}. Cross-city assignment rejected.`
    );
  }

  // 3. Determine if task has dependencies
  const dep = routing.dependencies.find((d) => d.department === targetDept);
  const dependsOn = dep ? dep.requiredBefore : null;
  const isBlocked = Boolean(dependsOn);
  const blockedReason = dependsOn ? `Awaiting prerequisite completion by ${dependsOn}` : null;

  const taskId = `TSK-${ulid()}`;
  const now = new Date();
  const slaTargetMinutes = routing.slaHours * 60;
  const slaDueAt = new Date(now.getTime() + slaTargetMinutes * 60 * 1000).toISOString();

  const task: DepartmentTaskItem = {
    taskId,
    incidentId: input.incidentId,
    publicReference: input.publicReference,
    city: input.city,
    wardId: input.wardId,
    departmentCode: targetDept,
    departmentName: routing.primaryDepartmentName,
    role: "PRIMARY",
    taskTitle: input.taskTitle,
    requiredAction: input.requiredAction,
    status: isBlocked ? "TASK_BLOCKED" : "TASK_ASSIGNED",
    dependsOnDepartment: dependsOn,
    isBlocked,
    blockedReason,
    slaTargetMinutes,
    slaDueAt,
    isOverdue: false,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  DEPARTMENT_TASKS.set(taskId, task);

  // Attempt DB persistence
  try {
    await execute(
      `INSERT INTO tasks (
        id, incident_department_id, title, required_action, status, priority_snapshot,
        due_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        taskId,
        input.incidentId,
        task.taskTitle,
        task.requiredAction,
        isBlocked ? "BLOCKED" : "ASSIGNED",
        50,
        slaDueAt.slice(0, 19).replace("T", " "),
      ]
    );
  } catch {
    // Non-fatal if offline
  }

  return task;
}

/**
 * 5. Update Department Task Status with State Machine Integrity
 * Disallows premature "dispatched" or "completed" claims without real state transition.
 */
export async function transitionTaskStatus(input: {
  taskId: string;
  fromStatus: DepartmentTaskLifecycleState;
  toStatus: DepartmentTaskLifecycleState;
  actor: { actorId: string; role: string; departmentCode?: string };
  actionNotes?: string;
  resolutionEvidenceUrl?: string;
}): Promise<DepartmentTaskItem> {
  const task = DEPARTMENT_TASKS.get(input.taskId);
  if (!task) {
    throw new Error(`Task '${input.taskId}' not found.`);
  }

  // Authorization check: Worker can only update their own department's task
  if (
    input.actor.role !== "ADMIN" &&
    input.actor.departmentCode &&
    input.actor.departmentCode !== task.departmentCode
  ) {
    throw new Error(
      `Forbidden: Worker from department '${input.actor.departmentCode}' cannot update tasks for '${task.departmentCode}'.`
    );
  }

  // State Transition Validation
  const validTransitions: Record<DepartmentTaskLifecycleState, DepartmentTaskLifecycleState[]> = {
    TASK_PENDING_APPROVAL: ["TASK_ASSIGNED", "TASK_CANCELLED"],
    TASK_ASSIGNED: ["TASK_ACCEPTED", "TASK_BLOCKED", "TASK_CANCELLED"],
    TASK_ACCEPTED: ["TASK_EN_ROUTE", "TASK_BLOCKED"],
    TASK_EN_ROUTE: ["TASK_REACHED_SITE", "TASK_BLOCKED"],
    TASK_REACHED_SITE: ["TASK_IN_PROGRESS", "TASK_BLOCKED"],
    TASK_IN_PROGRESS: ["TASK_COMPLETED", "TASK_BLOCKED"],
    TASK_BLOCKED: ["TASK_ACCEPTED", "TASK_IN_PROGRESS", "TASK_CANCELLED"],
    TASK_COMPLETED: ["TASK_VERIFIED_CLOSED", "TASK_IN_PROGRESS"],
    TASK_VERIFIED_CLOSED: [],
    TASK_CANCELLED: [],
  };

  const allowed = validTransitions[task.status] || [];
  if (!allowed.includes(input.toStatus)) {
    throw new Error(
      `Invalid Transition: Cannot transition task from '${task.status}' to '${input.toStatus}'. Valid targets: ${allowed.join(", ") || "none"}`
    );
  }

  // Resolution requires evidence
  if (input.toStatus === "TASK_COMPLETED" && !input.actionNotes && !input.resolutionEvidenceUrl) {
    throw new Error("Validation Error: Task completion requires resolution notes or photographic evidence.");
  }

  task.status = input.toStatus;
  task.actionNotes = input.actionNotes || task.actionNotes;
  task.resolutionEvidenceUrl = input.resolutionEvidenceUrl || task.resolutionEvidenceUrl;
  task.updatedAt = new Date().toISOString();

  if (input.toStatus === "TASK_BLOCKED") {
    task.isBlocked = true;
  } else if (task.isBlocked) {
    task.isBlocked = false;
    task.blockedReason = null;
  }

  return task;
}

/**
 * 6. Evidence Querying & Correlation Inspection
 */
export function getEvidenceLinksForEntity(targetId: string): WorkflowEvidenceLink[] {
  return EVIDENCE_LINKS.filter((l) => l.targetId === targetId || l.sourceId === targetId);
}

/**
 * 7. Retrieve All Active Department Tasks
 */
export function getDepartmentTasks(filter?: {
  city?: CitySlug;
  departmentCode?: string;
  status?: DepartmentTaskLifecycleState;
}): DepartmentTaskItem[] {
  let list = Array.from(DEPARTMENT_TASKS.values());
  if (filter?.city) {
    list = list.filter((t) => t.city === filter.city);
  }
  if (filter?.departmentCode) {
    list = list.filter((t) => t.departmentCode === filter.departmentCode);
  }
  if (filter?.status) {
    list = list.filter((t) => t.status === filter.status);
  }
  return list;
}

/**
 * 8. Retrieve All Advisory Drafts
 */
export function getAdvisoryDrafts(city?: CitySlug): PrecautionaryAdvisoryDraft[] {
  let list = Array.from(ADVISORY_DRAFTS.values());
  if (city) {
    list = list.filter((a) => a.city === city);
  }
  return list;
}
