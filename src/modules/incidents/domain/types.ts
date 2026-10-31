/* ════════════════════════════════════════════════════════
   Incident Domain Types
   Core types for the incident management system
   ════════════════════════════════════════════════════════ */

export type IncidentStatus =
  | "DRAFT"
  | "AI_PROCESSING"
  | "NEEDS_INFORMATION"
  | "AWAITING_CITIZEN_CONFIRMATION"
  | "EMERGENCY_GUIDANCE"
  | "CONFIRMED"
  | "ROUTED"
  | "IN_PROGRESS"
  | "PENDING_VERIFICATION"
  | "ESCALATED"
  | "RESOLVED"
  | "CLOSED"
  | "CANCELLED"
  | "EXPIRED"
  | "AI_FAILED"
  | "REOPENED";

export type IncidentDepartmentStatus =
  | "ROUTED"
  | "RECEIVED"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "WORK_COMPLETED"
  | "VERIFIED"
  | "RESOLVED"
  | "DECLINED"
  | "ESCALATED"
  | "CANCELLED";

export type TaskStatus =
  | "UNASSIGNED"
  | "ASSIGNED"
  | "ACCEPTED"
  | "EN_ROUTE"
  | "REACHED_SITE"
  | "WORK_STARTED"
  | "WORK_COMPLETED"
  | "AWAITING_VERIFICATION"
  | "VERIFIED"
  | "RESOLVED"
  | "REASSIGNED"
  | "BLOCKED"
  | "CANCELLED";

export type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type PrivacyLevel = "PUBLIC" | "RESTRICTED" | "SENSITIVE";

export interface Incident {
  id: string;
  publicReference: string;
  citizenId: string;
  categoryId: string | null;
  subcategoryId: string | null;
  status: IncidentStatus;
  severity: Severity;
  priorityScore: number;
  priorityBand: string;
  privacyLevel: PrivacyLevel;
  title: string;
  citizenSummary: string;
  locationId: string | null;
  isEmergency: boolean;
  confirmedAt: string | null;
  routedAt: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IncidentDepartment {
  id: string;
  incidentId: string;
  departmentId: string;
  routingReason: string;
  status: IncidentDepartmentStatus;
  priorityOverride: number | null;
  receivedAt: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  incidentDepartmentId: string;
  title: string;
  requiredAction: string;
  status: TaskStatus;
  prioritySnapshot: number;
  currentWorkerId: string | null;
  dueAt: string | null;
  escalationAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Location {
  id: string;
  addressText: string;
  locality: string | null;
  ward: string | null;
  latitude: number | null;
  longitude: number | null;
  precision: string | null;
  source: string;
  createdAt: string;
}

export interface IncidentAnalysis {
  categorySlug: string | null;
  subcategorySlug: string | null;
  title: string;
  citizenSummary: string;
  internalSummary: string;
  entities: {
    locationText?: string;
    peopleAffected?: number;
    injuries?: boolean;
    vehicles?: number;
    fire?: boolean;
    blockage?: boolean;
    infrastructure?: string[];
    hazards?: string[];
    timeContext?: string;
  };
  severity: Severity;
  priorityFactors: Record<string, number | boolean | string>;
  proposedPriorityScore: number;
  proposedDepartmentCodes: string[];
  requiredInformation: Array<{
    field:
      | "location"
      | "description"
      | "photo"
      | "video"
      | "people_affected"
      | "other";
    requirement: "REQUIRED" | "RECOMMENDED" | "OPTIONAL";
    reason: string;
  }>;
  privacyProposal: PrivacyLevel;
  emergencyAssessment: {
    isPotentialEmergency: boolean;
    guidanceKey?: string;
    requiresImmediateContactPrompt: boolean;
  };
  confidence: number;
  uncertaintyNotes: string[];
}

/** Citizen-safe tracking labels */
export type CitizenTrackingLabel =
  | "Submitted"
  | "Received"
  | "Assigned"
  | "In Progress"
  | "Resolved";

/** Map internal state to citizen-safe label */
export function toCitizenLabel(status: IncidentStatus): CitizenTrackingLabel {
  switch (status) {
    case "CONFIRMED":
    case "ROUTED":
      return "Submitted";
    case "IN_PROGRESS":
      return "In Progress";
    case "PENDING_VERIFICATION":
    case "ESCALATED":
      return "In Progress";
    case "RESOLVED":
    case "CLOSED":
      return "Resolved";
    default:
      return "Submitted";
  }
}
