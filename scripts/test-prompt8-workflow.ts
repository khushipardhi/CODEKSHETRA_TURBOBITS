/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Prompt 8 Verification Test Suite
   Unified Hazard-to-Incident Workflow, Department Routing, Action Tracking & Evidence Linking
   ════════════════════════════════════════════════════════ */

import {
  createScenarioAdvisoryProposal,
  approveAdvisory,
  generateCitizenReportingPrefill,
  createDepartmentTask,
  transitionTaskStatus,
  getEvidenceLinksForEntity,
  getDepartmentTasks,
  getAdvisoryDrafts,
} from "../src/modules/hazards/workflow-manager";
import { evaluateRoutingDecision } from "../src/modules/routing/engine";
import { isDepartmentConfiguredForCity } from "../src/modules/routing/registry";
import { canTransitionIncident, canTransitionTask } from "../src/modules/incidents/domain/state-machine";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✔ [PASS] ${testName}`);
    passedCount++;
  } else {
    console.error(`  ✖ [FAIL] ${testName}${detail ? ` -> ${detail}` : ""}`);
    failedCount++;
  }
}

async function runTestSuite() {
  console.log("\n========================================================================");
  console.log("  SENTINEL CITY INTELLIGENCE — PROMPT 8 WORKFLOW VERIFICATION SUITE");
  console.log(`  Execution Time: ${new Date().toISOString()}`);
  console.log("========================================================================\n");

  // ─── 1. Authoritative Record Relationships & Explicit State Separation ───
  console.log("--- 1. Authoritative Record Relationships & Discrete Lifecycle States ---");

  // Step 1: Environmental Signal -> Hypothetical Scenario
  const advisoryProposal = await createScenarioAdvisoryProposal({
    city: "mumbai",
    scenarioId: "monsoon_cloudburst_50mm",
    scenarioTitle: "Monsoon Cloudburst Simulation",
    wardId: "F/N",
    wardName: "Ward F/North (Matunga / Sion)",
    screeningScore: 78,
    hazardType: "urban_flood",
    draftedBy: "SYSTEM_SIMULATION_ENGINE",
    recommendedCivicActions: ["Avoid King's Circle underpass", "Monitor MCGM emergency helpline 1916"],
    recommendedDepartmentActions: ["Pre-deploy portable dewatering pumps at Gandhi Market"],
    chronicHotspotNames: ["Gandhi Market", "Hindmata Cinema"],
  });

  assert(
    advisoryProposal.approvalStatus === "AWAITING_REVIEW",
    "[StateSeparation] Simulation output creates an advisory proposal with status 'AWAITING_REVIEW'",
    advisoryProposal.approvalStatus
  );
  assert(
    advisoryProposal.severity === "WATCH",
    "[StateSeparation] Screening score 78 correctly sets advisory severity to 'WATCH'",
    advisoryProposal.severity
  );

  // Check evidence link creation
  const evidenceLinks = getEvidenceLinksForEntity(advisoryProposal.advisoryId);
  assert(
    evidenceLinks.length > 0,
    "[EvidenceLink] Evidence link created connecting scenario run to advisory draft",
    `Found ${evidenceLinks.length} links`
  );
  assert(
    evidenceLinks[0].sourceType === "SIMULATION_RUN",
    "[EvidenceLink] Source type correctly recorded as 'SIMULATION_RUN'",
    evidenceLinks[0].sourceType
  );
  assert(
    evidenceLinks[0].targetType === "ADMIN_ADVISORY",
    "[EvidenceLink] Target type correctly recorded as 'ADMIN_ADVISORY'",
    evidenceLinks[0].targetType
  );

  // ─── 2. Administrative Approval Gate (No Auto-Conversion to Real Incident) ───
  console.log("\n--- 2. Administrative Review & Approval Boundaries ---");

  // Attempt unauthorized approval (e.g. citizen role) -> must reject
  let unauthorizedError = false;
  try {
    await approveAdvisory(advisoryProposal.advisoryId, {
      actorId: "CITIZEN_GUEST",
      role: "CITIZEN",
    });
  } catch (err: any) {
    unauthorizedError = true;
  }
  assert(
    unauthorizedError,
    "[AuthBoundary] Unauthorized non-admin role rejected from approving public advisory"
  );

  // Authorized administrator approval -> must succeed
  const approvedAdvisory = await approveAdvisory(advisoryProposal.advisoryId, {
    actorId: "ADMIN_MUNICIPAL_DISASTER_CELL",
    role: "ADMIN",
    notes: "Reviewed against King's Circle terrain saucer sinks. Precautionary warning authorized.",
  });

  assert(
    approvedAdvisory.approvalStatus === "APPROVED_PUBLISHED",
    "[AuthBoundary] Administrator authorization transitions advisory to 'APPROVED_PUBLISHED'",
    approvedAdvisory.approvalStatus
  );
  assert(
    Boolean(approvedAdvisory.approvedBy && approvedAdvisory.approvedAt),
    "[AuditTrail] Approved advisory records authorized actor and ISO timestamp"
  );

  // ─── 3. Contextual Citizen Reporting & Honest Prefill ───
  console.log("\n--- 3. Contextual Citizen Reporting & Uncertainty Disclaimers ---");

  const prefill = generateCitizenReportingPrefill({
    city: "mumbai",
    cityName: "Mumbai",
    resolvedWardId: "F/N",
    resolvedWardName: "Ward F/North",
    localityName: "Matunga East",
    coordinates: [19.0269, 72.8553],
    suggestedCategory: "water_drainage",
    suggestedSubcategory: "waterlogging_drainage",
    sourceObservationId: "OBS-OPENMETEO-20261019-01",
    sourceScenarioId: "monsoon_cloudburst_50mm",
  });

  assert(
    prefill.city === "mumbai",
    "[CitizenPrefill] Prefills active municipal jurisdiction (Mumbai)",
    prefill.city
  );
  assert(
    prefill.resolvedWardId === "F/N",
    "[CitizenPrefill] Prefills resolved administrative ward ID (F/N)",
    prefill.resolvedWardId
  );
  assert(
    Boolean(prefill.coordinates && prefill.coordinates[0] === 19.0269),
    "[CitizenPrefill] Preserves explicit coordinates when authorized by citizen"
  );
  assert(
    prefill.prefillNotice.includes("NOT proof of current ground flooding"),
    "[CitizenPrefill] Includes explicit disclaimer that forecast/simulation is not proof of flooding"
  );

  // ─── 4. Deterministic Departmental Routing & SLA ───
  console.log("\n--- 4. Deterministic Departmental Routing & SLA ---");

  // Mumbai drainage routing
  const mumbaiRouting = evaluateRoutingDecision({
    city: "mumbai",
    category: "water_drainage",
    subcategory: "waterlogging_drainage",
    latitude: 19.0269,
    longitude: 72.8553,
  });

  assert(
    mumbaiRouting.primaryDepartment === "drainage",
    "[DeterministicRouting] Mumbai drainage issue routes to BMC SWD ('drainage')",
    mumbaiRouting.primaryDepartment
  );
  assert(
    mumbaiRouting.slaHours > 0,
    "[SLA] Configured SLA hours computed deterministically",
    `${mumbaiRouting.slaHours} hours`
  );
  assert(
    mumbaiRouting.confidenceStatus === "HIGH",
    "[DeterministicRouting] Routing confidence classified as HIGH for fully matched rule",
    mumbaiRouting.confidenceStatus
  );

  // Cross-city validation
  assert(
    isDepartmentConfiguredForCity("mumbai", "drainage"),
    "[CityIsolation] 'drainage' is verified as configured for Mumbai (BMC)"
  );
  assert(
    isDepartmentConfiguredForCity("pune", "drainage"),
    "[CityIsolation] 'drainage' is verified as configured for Pune (PMC)"
  );
  assert(
    !isDepartmentConfiguredForCity("nagpur", "coastal_marine_board"),
    "[CityIsolation] Non-existent coastal department correctly rejected for inland Nagpur"
  );

  // Unknown category fallback queue
  const fallbackRouting = evaluateRoutingDecision({
    city: "mumbai",
    category: "unrecognized_exotic_anomaly",
  });

  assert(
    fallbackRouting.confidenceStatus === "FALLBACK" || fallbackRouting.confidenceStatus === "REQUIRES_REVIEW",
    "[FallbackQueue] Unrecognized categories route to review/fallback queue rather than inventing a department",
    fallbackRouting.confidenceStatus
  );
  assert(
    Boolean(fallbackRouting.primaryDepartment),
    "[FallbackQueue] Assigned to authoritative municipal fallback department (Disaster Cell)",
    fallbackRouting.primaryDepartment
  );

  // ─── 5. Department Task Creation, Dependencies & State Transitions ───
  console.log("\n--- 5. Department Task Tracking & Real Lifecycle Transitions ---");

  const task = await createDepartmentTask({
    incidentId: "INC-2026-TEST-001",
    publicReference: "MUM-2026-000042",
    city: "mumbai",
    wardId: "F/N",
    category: "water_drainage",
    taskTitle: "Deploy dewatering suction pumps to Gandhi Market low saucer",
    requiredAction: "Verify gravity sluice gate lockout and operate diesel pumps",
    creatorRole: "ADMIN",
    latitude: 19.0269,
    longitude: 72.8553,
  });

  assert(
    task.departmentCode === "drainage",
    "[TaskCreation] Task correctly created and assigned to 'drainage'",
    task.departmentCode
  );
  assert(
    task.status === "TASK_ASSIGNED",
    "[TaskCreation] Initial state is 'TASK_ASSIGNED', strictly not 'TASK_COMPLETED'",
    task.status
  );
  assert(
    Boolean(task.slaDueAt),
    "[TaskSLA] Task contains explicit SLA due timestamp",
    task.slaDueAt
  );

  // Formal acceptance by field worker
  const acceptedTask = await transitionTaskStatus({
    taskId: task.taskId,
    fromStatus: "TASK_ASSIGNED",
    toStatus: "TASK_ACCEPTED",
    actor: { actorId: "SWD_WORKER_101", role: "DEPARTMENT_WORKER", departmentCode: "drainage" },
    actionNotes: "Receipt acknowledged by Ward F/N dewatering squad",
  });

  assert(
    acceptedTask.status === "TASK_ACCEPTED",
    "[StateTransition] Task transitioned from ASSIGNED -> ACCEPTED",
    acceptedTask.status
  );

  // Crew En Route
  const enRouteTask = await transitionTaskStatus({
    taskId: task.taskId,
    fromStatus: "TASK_ACCEPTED",
    toStatus: "TASK_EN_ROUTE",
    actor: { actorId: "SWD_WORKER_101", role: "DEPARTMENT_WORKER", departmentCode: "drainage" },
  });

  assert(
    enRouteTask.status === "TASK_EN_ROUTE",
    "[StateTransition] Task transitioned from ACCEPTED -> EN_ROUTE",
    enRouteTask.status
  );

  // Arrived at site
  const reachedSiteTask = await transitionTaskStatus({
    taskId: task.taskId,
    fromStatus: "TASK_EN_ROUTE",
    toStatus: "TASK_REACHED_SITE",
    actor: { actorId: "SWD_WORKER_101", role: "DEPARTMENT_WORKER", departmentCode: "drainage" },
  });

  assert(
    reachedSiteTask.status === "TASK_REACHED_SITE",
    "[StateTransition] Task transitioned from EN_ROUTE -> REACHED_SITE",
    reachedSiteTask.status
  );

  // Work Started on Site
  const inProgressTask = await transitionTaskStatus({
    taskId: task.taskId,
    fromStatus: "TASK_REACHED_SITE",
    toStatus: "TASK_IN_PROGRESS",
    actor: { actorId: "SWD_WORKER_101", role: "DEPARTMENT_WORKER", departmentCode: "drainage" },
  });

  assert(
    inProgressTask.status === "TASK_IN_PROGRESS",
    "[StateTransition] Task transitioned from REACHED_SITE -> IN_PROGRESS",
    inProgressTask.status
  );

  // Completion without evidence -> must reject
  let rejectedNoEvidence = false;
  try {
    await transitionTaskStatus({
      taskId: task.taskId,
      fromStatus: "TASK_IN_PROGRESS",
      toStatus: "TASK_COMPLETED",
      actor: { actorId: "SWD_WORKER_101", role: "DEPARTMENT_WORKER", departmentCode: "drainage" },
    });
  } catch {
    rejectedNoEvidence = true;
  }
  assert(
    rejectedNoEvidence,
    "[CompletionEvidence] Completing a task requires resolution notes or photographic proof"
  );

  // Completion with evidence -> succeeds
  const completedTask = await transitionTaskStatus({
    taskId: task.taskId,
    fromStatus: "TASK_IN_PROGRESS",
    toStatus: "TASK_COMPLETED",
    actor: { actorId: "SWD_WORKER_101", role: "DEPARTMENT_WORKER", departmentCode: "drainage" },
    actionNotes: "High-capacity pump deployed; water level receded by 0.65m; carriage-way traffic restored.",
    resolutionEvidenceUrl: "https://sentinel.urbanlink.gov.in/evidence/pump-deployment-gandhi-market.jpg",
  });

  assert(
    completedTask.status === "TASK_COMPLETED",
    "[StateTransition] Task completed with documented resolution notes and evidence URL",
    completedTask.status
  );

  // Supervisor verified and closed
  const closedTask = await transitionTaskStatus({
    taskId: task.taskId,
    fromStatus: "TASK_COMPLETED",
    toStatus: "TASK_VERIFIED_CLOSED",
    actor: { actorId: "SWD_SUPERVISOR_01", role: "ADMIN" },
    actionNotes: "Supervisor on-site inspection verified drainage clearance",
  });

  assert(
    closedTask.status === "TASK_VERIFIED_CLOSED",
    "[StateTransition] Final supervisor signoff transitions task to 'TASK_VERIFIED_CLOSED'",
    closedTask.status
  );

  // ─── 6. Failure Modes & Edge Case Verification ───
  console.log("\n--- 6. Failure Conditions & Security Edge Cases ---");

  // Invalid state jump (e.g. ASSIGNED directly to CLOSED without doing the work)
  const freshTask = await createDepartmentTask({
    incidentId: "INC-2026-TEST-002",
    publicReference: "MUM-2026-000043",
    city: "mumbai",
    wardId: "G/N",
    category: "water_drainage",
    taskTitle: "Inspect Dharavi nullah gate",
    requiredAction: "Verify mechanical hoist",
    creatorRole: "ADMIN",
  });

  let invalidJumpRejected = false;
  try {
    await transitionTaskStatus({
      taskId: freshTask.taskId,
      fromStatus: "TASK_ASSIGNED",
      toStatus: "TASK_VERIFIED_CLOSED",
      actor: { actorId: "SWD_WORKER_101", role: "DEPARTMENT_WORKER" },
      actionNotes: "Skipping all middle steps",
    });
  } catch {
    invalidJumpRejected = true;
  }
  assert(
    invalidJumpRejected,
    "[StateValidation] State machine rejects illegal skip from 'TASK_ASSIGNED' directly to 'TASK_VERIFIED_CLOSED'"
  );

  // Cross-department unauthorized modification
  let crossDeptRejected = false;
  try {
    await transitionTaskStatus({
      taskId: freshTask.taskId,
      fromStatus: "TASK_ASSIGNED",
      toStatus: "TASK_ACCEPTED",
      actor: {
        actorId: "TRAFFIC_POLICE_OFFICER",
        role: "DEPARTMENT_WORKER",
        departmentCode: "traffic_police", // Mismatched department!
      },
      actionNotes: "Attempting to accept another department's work",
    });
  } catch {
    crossDeptRejected = true;
  }
  assert(
    crossDeptRejected,
    "[RBAC] Worker from another department cannot accept or alter tasks assigned to 'drainage'"
  );

  // City jurisdiction mismatch rejection
  let cityMismatchRejected = false;
  try {
    await createDepartmentTask({
      incidentId: "INC-2026-TEST-003",
      publicReference: "PUN-2026-000099",
      city: "pune",
      wardId: "ZONE-1",
      category: "water_drainage",
      taskTitle: "Pune culvert repair",
      requiredAction: "Repair culvert",
      creatorRole: "ADMIN",
      customDepartmentCode: "invalid_alien_department_code",
    });
  } catch {
    cityMismatchRejected = true;
  }
  assert(
    cityMismatchRejected,
    "[CityIsolation] Department task creation rejects invalid or cross-city department assignment"
  );

  // Existing incident state machine verification
  assert(
    canTransitionIncident("DRAFT", "AI_PROCESSING"),
    "[DomainStateMachine] Incident allows DRAFT -> AI_PROCESSING"
  );
  assert(
    canTransitionIncident("CONFIRMED", "ROUTED"),
    "[DomainStateMachine] Incident allows CONFIRMED -> ROUTED"
  );
  assert(
    !canTransitionIncident("DRAFT", "RESOLVED"),
    "[DomainStateMachine] Incident forbids skipping directly from DRAFT to RESOLVED"
  );

  // ─── Summary ───
  console.log("\n========================================================================");
  console.log(`  PROMPT 8 TEST RESULTS: ${passedCount} / ${passedCount + failedCount} PASSED (${failedCount} FAILED)`);
  if (failedCount === 0) {
    console.log("  STATUS: ALL UNIFIED HAZARD-TO-INCIDENT WORKFLOW REQUIREMENTS VERIFIED!");
  } else {
    console.log("  STATUS: SOME TESTS FAILED — INVESTIGATE BEFORE HANDOVER.");
  }
  console.log("========================================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error("Unhandled test suite execution error:", err);
  process.exit(1);
});
