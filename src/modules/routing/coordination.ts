/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Multi-Department Coordination
   Orchestrates primary and supporting department task dependencies,
   blocked states, and unified incident history.
   ════════════════════════════════════════════════════════ */

import { execute, query } from "@/lib/db";
import { generateULID as ulid } from "@/lib/ids";
import type { RoutingDecision } from "./engine";

export interface DepartmentCoordinationStatus {
  incidentId: string;
  departmentCode: string;
  departmentName: string;
  role: "PRIMARY" | "SUPPORTING";
  status: string;
  dependsOnDepartment: string | null;
  isBlocked: boolean;
  blockedReason: string | null;
  assignedWorkerId: string | null;
  assignedWorkerName: string | null;
  actionNotes: string | null;
  receivedAt: string | null;
  acknowledgedAt: string | null;
  resolvedAt: string | null;
  resolutionEvidenceUrl: string | null;
}

/**
 * Initialize department coordination for an incident based on routing decision.
 * Creates primary and supporting department records with dependencies.
 */
export async function initializeDepartmentCoordination(
  incidentId: string,
  decision: RoutingDecision
): Promise<void> {
  // 1. Primary Department Record
  await execute(
    `INSERT INTO incident_departments (
      id, incident_id, department_code, department_name, routing_reason,
      role, status, depends_on_department, is_blocked, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, 'PRIMARY', 'ROUTED', NULL, 0, NOW(), NOW())
    ON DUPLICATE KEY UPDATE
      role = 'PRIMARY',
      routing_reason = VALUES(routing_reason),
      updated_at = NOW()`,
    [
      ulid(),
      incidentId,
      decision.primaryDepartment,
      decision.primaryDepartmentName,
      decision.decisionExplanation,
    ]
  );

  // 2. Supporting Department Records
  for (const supp of decision.supportingDepartments) {
    // Check if supporting dept has a dependency on primary or vice-versa
    const dep = decision.dependencies.find((d) => d.department === supp.code);
    const dependsOn = dep ? decision.primaryDepartment : null;

    await execute(
      `INSERT INTO incident_departments (
        id, incident_id, department_code, department_name, routing_reason,
        role, status, depends_on_department, is_blocked, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'SUPPORTING', 'ROUTED', ?, 0, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        role = 'SUPPORTING',
        depends_on_department = VALUES(depends_on_department),
        updated_at = NOW()`,
      [
        ulid(),
        incidentId,
        supp.code,
        supp.name,
        `Supporting coordination for ${decision.primaryDepartmentName}`,
        dependsOn,
      ]
    );
  }
}

/**
 * Retrieve all participating departments and coordination states for an incident.
 */
export async function getIncidentDepartmentCoordination(
  incidentId: string
): Promise<DepartmentCoordinationStatus[]> {
  const rows = await query<any>(
    `SELECT * FROM incident_departments WHERE incident_id = ? ORDER BY role ASC, created_at ASC`,
    [incidentId]
  );

  return (rows || []).map((r) => ({
    incidentId: r.incident_id,
    departmentCode: r.department_code,
    departmentName: r.department_name,
    role: (r.role as "PRIMARY" | "SUPPORTING") || "PRIMARY",
    status: r.status,
    dependsOnDepartment: r.depends_on_department,
    isBlocked: !!r.is_blocked,
    blockedReason: r.blocked_reason,
    assignedWorkerId: r.assigned_worker_id,
    assignedWorkerName: r.assigned_worker_name,
    actionNotes: r.action_notes,
    receivedAt: r.received_at,
    acknowledgedAt: r.acknowledged_at,
    resolvedAt: r.resolved_at,
    resolutionEvidenceUrl: r.resolution_evidence_url,
  }));
}

/**
 * Update department status within coordination workflow.
 */
export async function updateDepartmentAction(params: {
  incidentId: string;
  departmentCode: string;
  action: "ACKNOWLEDGE" | "ACCEPT" | "ASSIGN" | "BLOCK" | "UNBLOCK" | "RESOLVE" | "REJECT";
  actorId?: string;
  actorName?: string;
  workerId?: string;
  workerName?: string;
  notes?: string;
  blockedReason?: string;
  dependsOnDept?: string;
  resolutionEvidenceUrl?: string;
}): Promise<{
  success: boolean;
  fromStatus: string;
  toStatus: string;
  isAllResolved: boolean;
  unblockedDepartments: string[];
}> {
  const { incidentId, departmentCode, action, notes, blockedReason, dependsOnDept, resolutionEvidenceUrl, workerId, workerName } = params;

  // 1. Get current department record
  const currentRows = await query<any>(
    `SELECT * FROM incident_departments WHERE incident_id = ? AND department_code = ? LIMIT 1`,
    [incidentId, departmentCode]
  );

  if (!currentRows || currentRows.length === 0) {
    throw new Error(`Department '${departmentCode}' is not assigned to incident '${incidentId}'`);
  }

  const current = currentRows[0];
  const fromStatus = current.status;
  let toStatus = fromStatus;
  let historyReason = notes || "";
  const unblockedDepartments: string[] = [];

  if (action === "ACKNOWLEDGE") {
    toStatus = "ACKNOWLEDGED";
    historyReason = historyReason || `Acknowledged by ${current.department_name}`;
    await execute(
      `UPDATE incident_departments
       SET status = 'ACKNOWLEDGED', acknowledged_at = NOW(), action_notes = COALESCE(?, action_notes), updated_at = NOW()
       WHERE incident_id = ? AND department_code = ?`,
      [notes || null, incidentId, departmentCode]
    );

    // Update parent incident if it hasn't been acknowledged yet
    await execute(
      `UPDATE incidents
       SET acknowledged_at = COALESCE(acknowledged_at, NOW())
       WHERE id = ?`,
      [incidentId]
    );
  } else if (action === "ACCEPT") {
    toStatus = "ASSIGNED";
    historyReason = historyReason || `Accepted by ${current.department_name}`;
    await execute(
      `UPDATE incident_departments
       SET status = 'ASSIGNED', received_at = NOW(), action_notes = COALESCE(?, action_notes), updated_at = NOW()
       WHERE incident_id = ? AND department_code = ?`,
      [notes || null, incidentId, departmentCode]
    );

    await execute(
      `UPDATE incidents
       SET status = 'ASSIGNED'
       WHERE id = ? AND status IN ('DRAFT', 'CONFIRMED', 'ROUTED')`,
      [incidentId]
    );
  } else if (action === "ASSIGN") {
    toStatus = "IN_PROGRESS";
    const assignedLabel = workerName || (workerId ? `Worker ${workerId}` : "Field Team");
    historyReason = historyReason || `Assigned to ${assignedLabel}`;
    await execute(
      `UPDATE incident_departments
       SET status = 'IN_PROGRESS',
           assigned_worker_id = ?,
           assigned_worker_name = ?,
           action_notes = COALESCE(?, action_notes),
           updated_at = NOW()
       WHERE incident_id = ? AND department_code = ?`,
      [workerId || null, workerName || null, notes || null, incidentId, departmentCode]
    );

    await execute(
      `UPDATE incidents
       SET status = 'IN_PROGRESS'
       WHERE id = ? AND status IN ('DRAFT', 'CONFIRMED', 'ROUTED', 'ASSIGNED')`,
      [incidentId]
    );
  } else if (action === "BLOCK") {
    toStatus = "BLOCKED";
    const reasonText = blockedReason || notes || "Awaiting supporting agency prerequisite";
    historyReason = `Blocked: ${reasonText}`;
    await execute(
      `UPDATE incident_departments
       SET status = 'BLOCKED',
           is_blocked = 1,
           blocked_reason = ?,
           depends_on_department = COALESCE(?, depends_on_department),
           action_notes = ?,
           updated_at = NOW()
       WHERE incident_id = ? AND department_code = ?`,
      [reasonText, dependsOnDept || null, notes || null, incidentId, departmentCode]
    );

    // If primary is blocked, flag incident
    if (current.role === "PRIMARY") {
      await execute(
        `UPDATE incidents
         SET is_blocked = 1, blocked_reason = ?
         WHERE id = ?`,
        [reasonText, incidentId]
      );
    }
  } else if (action === "UNBLOCK") {
    toStatus = current.assigned_worker_id ? "IN_PROGRESS" : "ASSIGNED";
    historyReason = historyReason || "Dependency resolved; task unblocked";
    await execute(
      `UPDATE incident_departments
       SET status = ?, is_blocked = 0, blocked_reason = NULL, action_notes = COALESCE(?, action_notes), updated_at = NOW()
       WHERE incident_id = ? AND department_code = ?`,
      [toStatus, notes || null, incidentId, departmentCode]
    );

    // Check if any other departments are still blocked
    const otherBlocked = await query<{ cnt: number }>(
      `SELECT COUNT(*) as cnt FROM incident_departments WHERE incident_id = ? AND is_blocked = 1`,
      [incidentId]
    );
    if (Number(otherBlocked[0]?.cnt || 0) === 0) {
      await execute(
        `UPDATE incidents SET is_blocked = 0, blocked_reason = NULL WHERE id = ?`,
        [incidentId]
      );
    }
  } else if (action === "RESOLVE") {
    toStatus = "RESOLVED";
    historyReason = historyReason || `Resolved by ${current.department_name}: ${notes || "Completed"}`;
    await execute(
      `UPDATE incident_departments
       SET status = 'RESOLVED',
           resolved_at = NOW(),
           action_notes = COALESCE(?, action_notes),
           resolution_evidence_url = COALESCE(?, resolution_evidence_url),
           is_blocked = 0,
           updated_at = NOW()
       WHERE incident_id = ? AND department_code = ?`,
      [notes || null, resolutionEvidenceUrl || null, incidentId, departmentCode]
    );

    // Automatic Unblock: If other departments were depending on this department, unblock them!
    const dependentRows = await query<{ department_code: string }>(
      `SELECT department_code FROM incident_departments
       WHERE incident_id = ? AND depends_on_department = ? AND is_blocked = 1`,
      [incidentId, departmentCode]
    );

    for (const depRow of dependentRows) {
      await execute(
        `UPDATE incident_departments
         SET status = 'ASSIGNED', is_blocked = 0, blocked_reason = NULL,
             action_notes = CONCAT(COALESCE(action_notes, ''), ' [Prerequisite completed by ', ?, ']')
         WHERE incident_id = ? AND department_code = ?`,
        [current.department_name, incidentId, depRow.department_code]
      );
      unblockedDepartments.push(depRow.department_code);
    }
  } else if (action === "REJECT") {
    toStatus = "REJECTED";
    historyReason = `Rejected by ${current.department_name}: ${notes || "Jurisdiction mismatch"}`;
    await execute(
      `UPDATE incident_departments
       SET status = 'REJECTED', action_notes = ?, updated_at = NOW()
       WHERE incident_id = ? AND department_code = ?`,
      [notes || "Rejected by department", incidentId, departmentCode]
    );

    // Escalate incident to admin review
    await execute(
      `UPDATE incidents
       SET status = 'AWAITING_REVIEW'
       WHERE id = ?`,
      [incidentId]
    );
  }

  // Check if ALL participating departments are resolved
  const unresolvedDepts = await query<{ cnt: number }>(
    `SELECT COUNT(*) AS cnt
     FROM incident_departments
     WHERE incident_id = ? AND status NOT IN ('RESOLVED', 'CLOSED', 'REJECTED')`,
    [incidentId]
  );
  const isAllResolved = Number(unresolvedDepts[0]?.cnt || 0) === 0;

  if (isAllResolved && action === "RESOLVE") {
    await execute(
      `UPDATE incidents
       SET status = 'RESOLVED',
           resolved_at = NOW(),
           resolution_notes = COALESCE(?, resolution_notes),
           resolution_evidence_url = COALESCE(?, resolution_evidence_url)
       WHERE id = ?`,
      [notes || null, resolutionEvidenceUrl || null, incidentId]
    );
  }

  // Append to status history
  await execute(
    `INSERT INTO incident_status_history (
      id, incident_id, from_status, to_status, actor_id, reason, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, NOW())`,
    [ulid(), incidentId, fromStatus, toStatus, departmentCode, historyReason]
  );

  return {
    success: true,
    fromStatus,
    toStatus,
    isAllResolved,
    unblockedDepartments,
  };
}
