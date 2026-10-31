/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — SLA & Escalation Engine
   Tracks operational acknowledgement, overdue deadlines,
   warning indicators, and supervisor escalation routing.
   ════════════════════════════════════════════════════════ */

import { query } from "@/lib/db";

export type OperationalPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface SlaCalculationResult {
  priority: OperationalPriority;
  ackTargetMinutes: number;
  resolutionTargetHours: number;
  ackDueAt: string; // ISO string
  resolutionDueAt: string; // ISO string
  isAckOverdue: boolean;
  isResolutionOverdue: boolean;
  ackTimeRemainingMinutes: number;
  resolutionTimeRemainingMinutes: number;
  warningIndicator: boolean; // True if > 75% elapsed
  escalationRequired: boolean;
  escalationRecipient: string;
}

/** Standard Fallback Escalation Policies */
const DEFAULT_SLA_POLICY: Record<
  OperationalPriority,
  { ackMinutes: number; resolutionHours: number; recipient: string }
> = {
  CRITICAL: {
    ackMinutes: 30,
    resolutionHours: 4,
    recipient: "Municipal Disaster Control Cell & Department Head",
  },
  HIGH: {
    ackMinutes: 60,
    resolutionHours: 12,
    recipient: "Zonal Executive Engineer",
  },
  MEDIUM: {
    ackMinutes: 240,
    resolutionHours: 24,
    recipient: "Ward Operations Supervisor",
  },
  LOW: {
    ackMinutes: 720,
    resolutionHours: 48,
    recipient: "Standard Municipal Admin Queue",
  },
};

/**
 * Calculate operational priority from incident facts.
 * Decouples hazard likelihood from consequence and official warning status.
 */
export function calculateOperationalPriority(facts: {
  isEmergency?: boolean;
  severity?: string | null;
  activeNearbyReportsCount?: number;
  hasOfficialWarning?: boolean;
  isBlockedEssentialRoute?: boolean;
  isCriticalFacilityExposed?: boolean;
}): OperationalPriority {
  if (facts.isEmergency || facts.isBlockedEssentialRoute || facts.isCriticalFacilityExposed) {
    return "CRITICAL";
  }

  const sev = (facts.severity || "").toUpperCase();
  if (sev === "CRITICAL" || sev === "SEVERE" || facts.hasOfficialWarning) {
    return "CRITICAL";
  }

  if (sev === "HIGH" || (facts.activeNearbyReportsCount && facts.activeNearbyReportsCount >= 3)) {
    return "HIGH";
  }

  if (sev === "MEDIUM" || sev === "MODERATE") {
    return "MEDIUM";
  }

  return "LOW";
}

/**
 * Compute SLA deadlines, overdue states, and escalation triggers.
 */
export async function computeSlaStatus(params: {
  city: string;
  departmentCode: string;
  priority: OperationalPriority;
  createdAt: string | Date;
  acknowledgedAt?: string | Date | null;
  resolvedAt?: string | Date | null;
}): Promise<SlaCalculationResult> {
  const { city, departmentCode, priority, createdAt, acknowledgedAt, resolvedAt } = params;
  const createdDate = new Date(createdAt);
  const now = new Date();

  let ackTargetMinutes = DEFAULT_SLA_POLICY[priority].ackMinutes;
  let resolutionTargetHours = DEFAULT_SLA_POLICY[priority].resolutionHours;
  let escalationRecipient = DEFAULT_SLA_POLICY[priority].recipient;

  // Attempt database query for customized city/dept escalation policy
  try {
    const rows = await query<{
      ack_target_minutes: number;
      resolution_target_hours: number;
      escalation_recipient: string;
    }>(
      `SELECT ack_target_minutes, resolution_target_hours, escalation_recipient
       FROM department_escalation_rules
       WHERE city = ? AND department_code = ? AND priority_level = ? AND is_active = 1
       LIMIT 1`,
      [city.toLowerCase(), departmentCode, priority]
    );

    if (rows && rows.length > 0) {
      ackTargetMinutes = rows[0].ack_target_minutes;
      resolutionTargetHours = rows[0].resolution_target_hours;
      escalationRecipient = rows[0].escalation_recipient;
    }
  } catch {
    // Database fallback to standard policy
  }

  const ackDueAt = new Date(createdDate.getTime() + ackTargetMinutes * 60 * 1000);
  const resolutionDueAt = new Date(createdDate.getTime() + resolutionTargetHours * 60 * 60 * 1000);

  // Acknowledgement check
  const ackEffectiveTime = acknowledgedAt ? new Date(acknowledgedAt) : now;
  const ackElapsedMs = ackEffectiveTime.getTime() - createdDate.getTime();
  const ackTotalMs = ackTargetMinutes * 60 * 1000;
  const isAckOverdue = !acknowledgedAt && now.getTime() > ackDueAt.getTime();
  const ackTimeRemainingMinutes = Math.round((ackDueAt.getTime() - now.getTime()) / (60 * 1000));

  // Resolution check
  const resolutionEffectiveTime = resolvedAt ? new Date(resolvedAt) : now;
  const resElapsedMs = resolutionEffectiveTime.getTime() - createdDate.getTime();
  const resTotalMs = resolutionTargetHours * 60 * 60 * 1000;
  const isResolutionOverdue = !resolvedAt && now.getTime() > resolutionDueAt.getTime();
  const resolutionTimeRemainingMinutes = Math.round(
    (resolutionDueAt.getTime() - now.getTime()) / (60 * 1000)
  );

  // Warning indicator (True if > 75% of time has elapsed and not yet acknowledged or resolved)
  const isAckWarning = !acknowledgedAt && ackElapsedMs / ackTotalMs >= 0.75;
  const isResWarning = !resolvedAt && resElapsedMs / resTotalMs >= 0.75;
  const warningIndicator = isAckWarning || isResWarning;

  const escalationRequired = isAckOverdue || isResolutionOverdue;

  return {
    priority,
    ackTargetMinutes,
    resolutionTargetHours,
    ackDueAt: ackDueAt.toISOString(),
    resolutionDueAt: resolutionDueAt.toISOString(),
    isAckOverdue,
    isResolutionOverdue,
    ackTimeRemainingMinutes,
    resolutionTimeRemainingMinutes,
    warningIndicator,
    escalationRequired,
    escalationRecipient,
  };
}
