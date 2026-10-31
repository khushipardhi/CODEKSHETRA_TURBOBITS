/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Routing Decision Records & Audit
   Persists explainable routing decisions, tracks admin overrides,
   preserves both original recommendation and authorized outcome.
   ════════════════════════════════════════════════════════ */

import { execute, query } from "@/lib/db";
import { generateULID as ulid } from "@/lib/ids";
import type { RoutingDecision } from "./engine";

export interface StoredRoutingRecord {
  id: string;
  incidentId: string | null;
  eventId: string | null;
  city: string;
  category: string;
  subcategory: string | null;
  hazardType: string | null;
  locationText: string | null;
  latitude: number | null;
  longitude: number | null;
  matchedRuleId: string;
  ruleVersion: string;
  primaryDepartment: string;
  supportingDepartments: Array<{ code: string; name: string }>;
  dependencies: Array<{ department: string; action: string; requiredBefore: string }>;
  decisionExplanation: string;
  factsUsed: Record<string, unknown>;
  missingFacts: string[];
  confidenceStatus: "HIGH" | "MEDIUM" | "REQUIRES_REVIEW" | "FALLBACK";
  assignmentMode: "AUTOMATIC" | "RECOMMENDED" | "AWAITING_APPROVAL";
  isOverridden: boolean;
  overrideActorId: string | null;
  overrideActorName: string | null;
  overrideReason: string | null;
  previousDepartment: string | null;
  finalDepartment: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Persist an explainable routing decision record to TiDB
 */
export async function persistRoutingDecisionRecord(
  decision: RoutingDecision,
  incidentId?: string | null,
  eventId?: string | null
): Promise<string> {
  const recordId = ulid();

  await execute(
    `INSERT INTO routing_decision_records (
      id, incident_id, event_id, city, category, subcategory, hazard_type,
      location_text, latitude, longitude, matched_rule_id, rule_version,
      primary_department, supporting_departments, dependencies,
      decision_explanation, facts_used, missing_facts, confidence_status,
      assignment_mode, is_overridden, final_department, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, NOW(), NOW())`,
    [
      recordId,
      incidentId || null,
      eventId || null,
      decision.city,
      decision.factsUsed.category,
      decision.factsUsed.subcategory || null,
      decision.factsUsed.hazardType || null,
      decision.factsUsed.locationText || null,
      decision.factsUsed.coordinates ? decision.factsUsed.coordinates[0] : null,
      decision.factsUsed.coordinates ? decision.factsUsed.coordinates[1] : null,
      decision.matchedRuleId,
      decision.ruleVersion,
      decision.primaryDepartment,
      JSON.stringify(decision.supportingDepartments),
      JSON.stringify(decision.dependencies),
      decision.decisionExplanation,
      JSON.stringify(decision.factsUsed),
      JSON.stringify(decision.missingFacts),
      decision.confidenceStatus,
      decision.assignmentMode,
      decision.primaryDepartment,
    ]
  );

  return recordId;
}

/**
 * Retrieve the active routing decision record for an incident
 */
export async function getRoutingDecisionForIncident(
  incidentId: string
): Promise<StoredRoutingRecord | null> {
  const rows = await query<any>(
    `SELECT * FROM routing_decision_records WHERE incident_id = ? ORDER BY created_at DESC LIMIT 1`,
    [incidentId]
  );

  if (!rows || rows.length === 0) return null;
  const r = rows[0];

  return {
    id: r.id,
    incidentId: r.incident_id,
    eventId: r.event_id,
    city: r.city,
    category: r.category,
    subcategory: r.subcategory,
    hazardType: r.hazard_type,
    locationText: r.location_text,
    latitude: r.latitude ? Number(r.latitude) : null,
    longitude: r.longitude ? Number(r.longitude) : null,
    matchedRuleId: r.matched_rule_id,
    ruleVersion: r.rule_version,
    primaryDepartment: r.primary_department,
    supportingDepartments: typeof r.supporting_departments === "string" ? JSON.parse(r.supporting_departments) : (r.supporting_departments || []),
    dependencies: typeof r.dependencies === "string" ? JSON.parse(r.dependencies) : (r.dependencies || []),
    decisionExplanation: r.decision_explanation,
    factsUsed: typeof r.facts_used === "string" ? JSON.parse(r.facts_used) : (r.facts_used || {}),
    missingFacts: typeof r.missing_facts === "string" ? JSON.parse(r.missing_facts) : (r.missing_facts || []),
    confidenceStatus: r.confidence_status,
    assignmentMode: r.assignment_mode,
    isOverridden: !!r.is_overridden,
    overrideActorId: r.override_actor_id,
    overrideActorName: r.override_actor_name,
    overrideReason: r.override_reason,
    previousDepartment: r.previous_department,
    finalDepartment: r.final_department,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

/**
 * Record an administrative override.
 * Preserves the original recommendation and explanation while assigning new authorized department.
 */
export async function recordRoutingOverride(params: {
  incidentId: string;
  overrideDepartment: string;
  actorId: string;
  actorName: string;
  reason: string;
}): Promise<boolean> {
  const { incidentId, overrideDepartment, actorId, actorName, reason } = params;

  // 1. Get existing decision record
  const current = await getRoutingDecisionForIncident(incidentId);
  const previousDept = current ? current.finalDepartment : null;

  // 2. Update routing_decision_records
  if (current) {
    await execute(
      `UPDATE routing_decision_records
       SET is_overridden = 1,
           override_actor_id = ?,
           override_actor_name = ?,
           override_reason = ?,
           previous_department = ?,
           final_department = ?,
           updated_at = NOW()
       WHERE id = ?`,
      [actorId, actorName, reason, previousDept, overrideDepartment, current.id]
    );
  }

  // 3. Update incidents table
  await execute(
    `UPDATE incidents
     SET selected_department = ?,
         primary_department = ?,
         updated_at = NOW()
     WHERE id = ?`,
    [overrideDepartment, overrideDepartment, incidentId]
  );

  // 4. Update incident_departments: set previous dept to REASSIGNED and insert new primary dept
  if (previousDept && previousDept !== overrideDepartment) {
    await execute(
      `UPDATE incident_departments
       SET status = 'REASSIGNED', action_notes = ?
       WHERE incident_id = ? AND department_code = ?`,
      [`Reassigned to ${overrideDepartment} by ${actorName}: ${reason}`, incidentId, previousDept]
    );
  }

  await execute(
    `INSERT INTO incident_departments (
      id, incident_id, department_code, department_name, routing_reason, role, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, 'PRIMARY', 'ROUTED', NOW(), NOW())
    ON DUPLICATE KEY UPDATE status = 'ROUTED', role = 'PRIMARY', routing_reason = VALUES(routing_reason), action_notes = VALUES(routing_reason)`,
    [
      ulid(),
      incidentId,
      overrideDepartment,
      overrideDepartment.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      `Administrative override by ${actorName}: ${reason}`,
    ]
  );

  // 5. Append to incident_status_history
  await execute(
    `INSERT INTO incident_status_history (
      id, incident_id, from_status, to_status, actor_id, reason, created_at
    ) VALUES (?, ?, 'ROUTED', 'ROUTED', ?, ?, NOW())`,
    [ulid(), incidentId, actorId, `Routing overridden to ${overrideDepartment}: ${reason}`]
  );

  return true;
}

/**
 * List pending routing decisions requiring administrative review
 */
export async function listPendingRoutingReviews(city?: string): Promise<StoredRoutingRecord[]> {
  const isAll = !city || city === "all";
  const rows = await query<any>(
    `SELECT r.*, i.public_reference, i.title, i.severity, i.status AS incident_status
     FROM routing_decision_records r
     LEFT JOIN incidents i ON i.id = r.incident_id
     WHERE (r.confidence_status IN ('REQUIRES_REVIEW', 'FALLBACK') OR r.assignment_mode = 'AWAITING_APPROVAL')
       AND (i.status NOT IN ('RESOLVED', 'CLOSED', 'DISMISSED') OR i.status IS NULL)
       ${isAll ? "" : "AND r.city = ?"}
     ORDER BY r.created_at DESC
     LIMIT 50`,
    isAll ? [] : [city.toLowerCase()]
  );

  return (rows || []).map((r) => ({
    id: r.id,
    incidentId: r.incident_id,
    eventId: r.event_id,
    city: r.city,
    category: r.category,
    subcategory: r.subcategory,
    hazardType: r.hazard_type,
    locationText: r.location_text,
    latitude: r.latitude ? Number(r.latitude) : null,
    longitude: r.longitude ? Number(r.longitude) : null,
    matchedRuleId: r.matched_rule_id,
    ruleVersion: r.rule_version,
    primaryDepartment: r.primary_department,
    supportingDepartments: typeof r.supporting_departments === "string" ? JSON.parse(r.supporting_departments) : (r.supporting_departments || []),
    dependencies: typeof r.dependencies === "string" ? JSON.parse(r.dependencies) : (r.dependencies || []),
    decisionExplanation: r.decision_explanation,
    factsUsed: typeof r.facts_used === "string" ? JSON.parse(r.facts_used) : (r.facts_used || {}),
    missingFacts: typeof r.missing_facts === "string" ? JSON.parse(r.missing_facts) : (r.missing_facts || []),
    confidenceStatus: r.confidence_status,
    assignmentMode: r.assignment_mode,
    isOverridden: !!r.is_overridden,
    overrideActorId: r.override_actor_id,
    overrideActorName: r.override_actor_name,
    overrideReason: r.override_reason,
    previousDepartment: r.previous_department,
    finalDepartment: r.final_department,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    publicReference: r.public_reference,
    title: r.title,
    severity: r.severity,
  }));
}
