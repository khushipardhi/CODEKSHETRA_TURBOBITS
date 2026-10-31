/* ════════════════════════════════════════════════════════
   Incident State Machine — Explicit domain service
   Every transition requires validation, history, and audit
   ════════════════════════════════════════════════════════ */

import type { IncidentStatus, IncidentDepartmentStatus, TaskStatus } from "./types";

/** Valid city-level incident transitions */
const incidentTransitions: Record<IncidentStatus, IncidentStatus[]> = {
  DRAFT: ["AI_PROCESSING", "CANCELLED"],
  AI_PROCESSING: [
    "AWAITING_CITIZEN_CONFIRMATION",
    "NEEDS_INFORMATION",
    "EMERGENCY_GUIDANCE",
    "AI_FAILED",
    "CANCELLED",
  ],
  NEEDS_INFORMATION: ["AI_PROCESSING", "CANCELLED"],
  AWAITING_CITIZEN_CONFIRMATION: [
    "CONFIRMED",
    "NEEDS_INFORMATION",
    "CANCELLED",
    "EXPIRED",
  ],
  EMERGENCY_GUIDANCE: [
    "AWAITING_CITIZEN_CONFIRMATION",
    "CONFIRMED",
    "CANCELLED",
  ],
  CONFIRMED: ["ROUTED"],
  ROUTED: ["IN_PROGRESS", "PENDING_VERIFICATION", "RESOLVED", "ESCALATED"],
  IN_PROGRESS: ["PENDING_VERIFICATION", "ESCALATED", "RESOLVED"],
  PENDING_VERIFICATION: ["IN_PROGRESS", "RESOLVED", "ESCALATED"],
  ESCALATED: ["IN_PROGRESS", "PENDING_VERIFICATION", "RESOLVED"],
  RESOLVED: ["CLOSED", "REOPENED"],
  CLOSED: ["REOPENED"],
  REOPENED: ["ROUTED", "IN_PROGRESS"],
  CANCELLED: [],
  EXPIRED: [],
  AI_FAILED: [],
};

/** Valid department-link transitions */
const departmentTransitions: Record<
  IncidentDepartmentStatus,
  IncidentDepartmentStatus[]
> = {
  ROUTED: ["RECEIVED", "DECLINED"],
  RECEIVED: ["ASSIGNED"],
  ASSIGNED: ["IN_PROGRESS"],
  IN_PROGRESS: ["WORK_COMPLETED", "ESCALATED"],
  WORK_COMPLETED: ["VERIFIED", "IN_PROGRESS"],
  VERIFIED: ["RESOLVED"],
  RESOLVED: [],
  DECLINED: [],
  ESCALATED: ["IN_PROGRESS", "RESOLVED"],
  CANCELLED: [],
};

/** Valid task transitions */
const taskTransitions: Record<TaskStatus, TaskStatus[]> = {
  UNASSIGNED: ["ASSIGNED"],
  ASSIGNED: ["ACCEPTED", "REASSIGNED", "CANCELLED"],
  ACCEPTED: ["EN_ROUTE", "REASSIGNED"],
  EN_ROUTE: ["REACHED_SITE"],
  REACHED_SITE: ["WORK_STARTED", "BLOCKED"],
  WORK_STARTED: ["WORK_COMPLETED", "BLOCKED"],
  WORK_COMPLETED: ["AWAITING_VERIFICATION"],
  AWAITING_VERIFICATION: ["VERIFIED", "WORK_STARTED"],
  VERIFIED: ["RESOLVED"],
  RESOLVED: [],
  REASSIGNED: ["UNASSIGNED"],
  BLOCKED: ["WORK_STARTED", "REASSIGNED", "CANCELLED"],
  CANCELLED: [],
};

export function canTransitionIncident(
  from: IncidentStatus,
  to: IncidentStatus
): boolean {
  return incidentTransitions[from]?.includes(to) ?? false;
}

export function canTransitionDepartment(
  from: IncidentDepartmentStatus,
  to: IncidentDepartmentStatus
): boolean {
  return departmentTransitions[from]?.includes(to) ?? false;
}

export function canTransitionTask(from: TaskStatus, to: TaskStatus): boolean {
  return taskTransitions[from]?.includes(to) ?? false;
}

export function getValidIncidentTransitions(
  current: IncidentStatus
): IncidentStatus[] {
  return incidentTransitions[current] ?? [];
}

export function getValidDepartmentTransitions(
  current: IncidentDepartmentStatus
): IncidentDepartmentStatus[] {
  return departmentTransitions[current] ?? [];
}

export function getValidTaskTransitions(current: TaskStatus): TaskStatus[] {
  return taskTransitions[current] ?? [];
}
