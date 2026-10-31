/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Alert Lifecycle & Approval Engine
   Manages candidate alerts, administrative authorization, publication,
   broadcasting, expiry, cancellation, and compliance audit logs.
   ════════════════════════════════════════════════════════ */

import { query } from "@/lib/db";
import { generateULID } from "@/lib/ids";
import { createNotification } from "@/lib/notification-service";
import { HazardAlert } from "@/db/schema/004-hazards";

export interface ReviewAlertInput {
  alertId: string;
  action: "APPROVE" | "REJECT" | "UPDATE" | "CANCEL";
  adminId?: string;
  headline?: string;
  description?: string;
  recommendedActions?: string[];
  expiresInHours?: number;
  notes?: string;
  ipAddress?: string;
}

export class AlertLifecycleManager {
  /**
   * Administrative review action for a hazard alert
   */
  async reviewAlert(input: ReviewAlertInput): Promise<HazardAlert> {
    const {
      alertId,
      action,
      adminId = "ADMIN_CONSOLE",
      headline,
      description,
      recommendedActions,
      expiresInHours = 6,
      notes = "",
      ipAddress = "127.0.0.1",
    } = input;

    // 1. Fetch current alert
    const existing = await query<any>(`SELECT * FROM hazard_alerts WHERE id = ?`, [alertId]);
    if (!existing || existing.length === 0) {
      throw new Error(`Alert with ID ${alertId} not found.`);
    }

    const current = existing[0];
    let newStatus: HazardAlert["approval_status"] = current.approval_status;

    if (action === "APPROVE") {
      newStatus = "APPROVED_PUBLISHED";
    } else if (action === "REJECT") {
      newStatus = "REJECTED";
    } else if (action === "CANCEL") {
      newStatus = "CANCELLED";
    } else if (action === "UPDATE") {
      newStatus = current.approval_status;
    }

    const finalHeadline = headline || current.headline;
    const finalDescription = description || current.description;
    const finalActions = recommendedActions ? JSON.stringify(recommendedActions) : (typeof current.recommended_actions === "string" ? current.recommended_actions : JSON.stringify(current.recommended_actions));

    // 2. Update record
    await query(
      `UPDATE hazard_alerts 
       SET approval_status = ?,
           headline = ?,
           description = ?,
           recommended_actions = ?,
           approved_by = CASE WHEN ? = 'APPROVED_PUBLISHED' THEN ? ELSE approved_by END,
           approved_at = CASE WHEN ? = 'APPROVED_PUBLISHED' THEN NOW() ELSE approved_at END,
           expires_at = DATE_ADD(NOW(), INTERVAL ? HOUR),
           updated_at = NOW()
       WHERE id = ?`,
      [
        newStatus,
        finalHeadline,
        finalDescription,
        finalActions,
        newStatus,
        adminId,
        newStatus,
        expiresInHours,
        alertId,
      ]
    );

    // 3. Log compliance audit record
    await query(
      `INSERT INTO hazard_audit_logs 
       (id, city, actor_id, action, target_id, target_type, ip_address, details, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        generateULID(),
        current.city,
        adminId,
        `ALERT_${action}`,
        alertId,
        "HAZARD_ALERT",
        ipAddress,
        JSON.stringify({
          previousStatus: current.approval_status,
          newStatus,
          action,
          notes,
          headline: finalHeadline,
        }),
      ]
    );

    // 4. If approved and published, broadcast public notifications
    if (newStatus === "APPROVED_PUBLISHED") {
      try {
        await createNotification({
          recipientType: "citizen",
          recipientId: "ALL_CITIZENS",
          type: "emergency_alert",
          priority: current.severity === "EMERGENCY" ? "critical" : "high",
          title: `⚠️ ${current.severity}: ${current.title}`,
          message: `${finalHeadline}. ${finalDescription.slice(0, 160)}`,
        });
      } catch (notifyErr) {
        console.warn("[AlertLifecycle] Notification broadcast non-fatal warning:", notifyErr);
      }
    }

    // Return refreshed record
    const updated = await query<any>(`SELECT * FROM hazard_alerts WHERE id = ?`, [alertId]);
    return updated[0];
  }

  /**
   * Fetch pending candidate alerts for administrative review
   */
  async getPendingAlerts(citySlug?: string): Promise<HazardAlert[]> {
    if (citySlug) {
      return await query<HazardAlert>(
        `SELECT * FROM hazard_alerts WHERE city = ? AND approval_status IN ('CANDIDATE_DRAFT', 'PENDING_APPROVAL') ORDER BY created_at DESC`,
        [citySlug]
      );
    }
    return await query<HazardAlert>(
      `SELECT * FROM hazard_alerts WHERE approval_status IN ('CANDIDATE_DRAFT', 'PENDING_APPROVAL') ORDER BY created_at DESC`
    );
  }

  /**
   * Expire stale alerts whose expires_at is past
   */
  async expireStaleAlerts(): Promise<number> {
    const result: any = await query(
      `UPDATE hazard_alerts 
       SET approval_status = 'EXPIRED', updated_at = NOW()
       WHERE approval_status = 'APPROVED_PUBLISHED' AND expires_at < NOW()`
    );
    return result.affectedRows || 0;
  }
}

export const alertLifecycle = new AlertLifecycleManager();
