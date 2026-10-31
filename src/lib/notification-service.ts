/* ════════════════════════════════════════════════════════
   Notification Service — Server-side utility
   Creates notification records in TiDB.
   Called from incident lifecycle events.
   ════════════════════════════════════════════════════════ */

import { execute } from "@/lib/db";
import { generateULID } from "@/lib/ids";
import { sendPushNotification } from "@/lib/push-service";
import { notifyCitizenViaEmail } from "@/lib/email-service";

export type NotificationType =
  | "report_received"
  | "report_confirmed"
  | "status_changed"
  | "dept_notified"
  | "dept_resolved"
  | "comment_added"
  | "emergency_alert";

export type RecipientType = "citizen" | "admin" | "department";
export type NotificationPriority = "normal" | "high" | "critical";

interface CreateNotificationParams {
  recipientType: RecipientType;
  recipientId: string;
  incidentId?: string;
  type: NotificationType;
  priority?: NotificationPriority;
  title: string;
  message: string;
}

/**
 * Create a notification record in TiDB.
 * Non-fatal: if the notifications table doesn't exist yet, fails silently.
 */
export async function createNotification(params: CreateNotificationParams): Promise<void> {
  try {
    await execute(
      `INSERT INTO notifications (
        id, recipient_type, recipient_id, incident_id,
        type, priority, title, message
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        generateULID(),
        params.recipientType,
        params.recipientId,
        params.incidentId || null,
        params.type,
        params.priority || "normal",
        params.title,
        params.message,
      ]
    );
  } catch (err) {
    // Non-fatal — table may not exist yet
    console.warn("[Notifications] Failed to create notification:", err);
  }

  // If this is a citizen notification, attempt to send a Web Push notification
  if (params.recipientType === "citizen") {
    sendPushNotification(params.recipientId, {
      title: params.title,
      body: params.message,
      priority: params.priority || "normal",
      incidentId: params.incidentId,
    }).catch((err) => {
      console.warn("[Notifications] Failed to send push notification:", err);
    });
  }
}

/**
 * Notify citizen that their report was received.
 */
export async function notifyReportReceived(params: {
  citizenId: string;
  incidentId: string;
  publicReference: string;
  title: string;
}): Promise<void> {
  await createNotification({
    recipientType: "citizen",
    recipientId: params.citizenId,
    incidentId: params.incidentId,
    type: "report_confirmed",
    priority: "normal",
    title: "Report Received ✓",
    message: `Your report "${params.title}" (${params.publicReference}) has been received and is being processed.`,
  });

  notifyCitizenViaEmail(params.citizenId, {
    title: params.title,
    publicReference: params.publicReference,
    newStatus: "CONFIRMED",
    reason: "Report successfully submitted by citizen and registered in municipal dispatch.",
  }).catch(() => {});
}

/**
 * Notify citizen of a status change.
 */
export async function notifyStatusChange(params: {
  citizenId: string;
  incidentId: string;
  publicReference: string;
  newStatus: string;
  title?: string;
  reason?: string;
  departmentName?: string;
  locationText?: string;
  workerName?: string;
}): Promise<void> {
  const statusNames: Record<string, string> = {
    ROUTED: "routed to department",
    ASSIGNED: "assigned to a team",
    IN_PROGRESS: "being worked on",
    WORK_COMPLETED: "work completed, pending verification",
    RESOLVED: "resolved",
    CLOSED: "closed",
  };

  const statusText = statusNames[params.newStatus] || params.newStatus.toLowerCase();

  await createNotification({
    recipientType: "citizen",
    recipientId: params.citizenId,
    incidentId: params.incidentId,
    type: "status_changed",
    priority: params.newStatus === "RESOLVED" ? "high" : "normal",
    title: `Report Update: ${params.publicReference}`,
    message: `Your report has been ${statusText}.${params.reason ? ` Note: ${params.reason}` : ""}`,
  });

  notifyCitizenViaEmail(params.citizenId, {
    title: params.title || `Incident ${params.publicReference}`,
    publicReference: params.publicReference,
    newStatus: params.newStatus,
    reason: params.reason,
    departmentName: params.departmentName,
    locationText: params.locationText,
    workerName: params.workerName,
  }).catch(() => {});
}

/**
 * Notify department of a new incident routed to them.
 */
export async function notifyDepartment(params: {
  departmentCode: string;
  incidentId: string;
  publicReference: string;
  severity: string;
  title: string;
}): Promise<void> {
  const priority: NotificationPriority =
    params.severity === "CRITICAL" ? "critical" :
    params.severity === "HIGH" ? "high" : "normal";

  await createNotification({
    recipientType: "department",
    recipientId: params.departmentCode,
    incidentId: params.incidentId,
    type: "dept_notified",
    priority,
    title: `New ${params.severity || "—"} Incident: ${params.publicReference}`,
    message: params.title,
  });
}

/**
 * Notify admin of emergency/critical incidents.
 */
export async function notifyAdminEmergency(params: {
  incidentId: string;
  publicReference: string;
  title: string;
}): Promise<void> {
  await createNotification({
    recipientType: "admin",
    recipientId: "admin",
    incidentId: params.incidentId,
    type: "emergency_alert",
    priority: "critical",
    title: `🚨 Emergency: ${params.publicReference}`,
    message: params.title,
  });
}
