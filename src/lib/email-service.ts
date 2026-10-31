/* ==========================================================
   Email Service — Nagpur Connect
   Automated 4-Stage Lifecycle Email Notifications via EmailJS
   ========================================================== */

import { query } from "@/lib/db";

// EmailJS Environment Variables
const EMAILJS_SERVICE_ID = process.env.EMAILJS_SERVICE_ID || "service_zdtdw8a";
const EMAILJS_TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID || "template_dtaszud";
const EMAILJS_PUBLIC_KEY = process.env.EMAILJS_PUBLIC_KEY || "mcwRaEW_RhQlmLFeL";
const EMAILJS_PRIVATE_KEY = process.env.EMAILJS_PRIVATE_KEY || "uVVNPCccuj896jFfOdL_j";
const EMAILJS_CONNECTED_EMAIL = process.env.EMAILJS_CONNECTED_EMAIL || "mesapos.in@gmail.com";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://nagpur-connect.vercel.app";

export interface EmailJSTemplateParams {
  to_name: string;
  to_email: string;
  subject: string;
  report_id: string;
  report_title: string;
  category: string;
  status_badge: string;
  status_title: string;
  status_color: string;
  status_message: string;
  timeline_step: string | number;
  step1_color: string;
  step1_bg: string;
  step1_icon: string;
  step2_color: string;
  step2_bg: string;
  step2_icon: string;
  step3_color: string;
  step3_bg: string;
  step3_icon: string;
  step4_color: string;
  step4_bg: string;
  step4_icon: string;
  department_name: string;
  location_text: string;
  action_notes: string;
  updated_at: string;
  tracking_url: string;
  portal_url: string;
  my_reports_url: string;
  emergency_url: string;
  map_view_url: string;
  regards_team: string;
  support_email: string;
}

/**
 * Send email via EmailJS official REST API
 */
export async function sendEmailJS(params: EmailJSTemplateParams): Promise<boolean> {
  try {
    const payload = {
      service_id: EMAILJS_SERVICE_ID,
      template_id: EMAILJS_TEMPLATE_ID,
      user_id: EMAILJS_PUBLIC_KEY,
      accessToken: EMAILJS_PRIVATE_KEY,
      template_params: params,
    };

    console.log(`[EmailJS] Sending email to: ${params.to_email} | Subject: ${params.subject}`);

    const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Origin": APP_URL,
        "Referer": `${APP_URL}/`,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.warn(`[EmailJS] Failed to send email (HTTP ${res.status}):`, errText);
      return false;
    }

    console.log(`[EmailJS] ✅ Successfully delivered email to: ${params.to_email}`);
    return true;
  } catch (err) {
    console.error("[EmailJS] Network/execution error:", err);
    return false;
  }
}

/**
 * Helper to fetch citizen name & email from TiDB
 */
async function getCitizenContact(citizenId: string): Promise<{ name: string; email: string } | null> {
  try {
    let email: string | null = null;
    let name = "Citizen";
    let emailEnabled = true;

    if (citizenId.startsWith("google_")) {
      const googleId = citizenId.replace("google_", "");
      const rows = await query<{ email: string; name: string; notification_email_enabled: number }>(
        `SELECT email, name, notification_email_enabled FROM citizens WHERE google_id = ? LIMIT 1`,
        [googleId]
      ).catch(() => []);
      if (rows.length > 0) {
        email = rows[0].email;
        name = rows[0].name || name;
        emailEnabled = !!rows[0].notification_email_enabled;
      }
    } else if (citizenId.startsWith("guest_")) {
      const guestId = citizenId.replace("guest_", "");
      const rows = await query<{ email: string; name: string; notification_email_enabled: number }>(
        `SELECT email, name, notification_email_enabled FROM citizens WHERE guest_id = ? LIMIT 1`,
        [guestId]
      ).catch(() => []);
      if (rows.length > 0) {
        email = rows[0].email;
        name = rows[0].name || name;
        emailEnabled = !!rows[0].notification_email_enabled;
      }
    } else {
      // Direct email or UUID lookup
      const rows = await query<{ email: string; name: string; notification_email_enabled: number }>(
        `SELECT email, name, notification_email_enabled FROM citizens WHERE id = ? OR email = ? LIMIT 1`,
        [citizenId, citizenId]
      ).catch(() => []);
      if (rows.length > 0) {
        email = rows[0].email;
        name = rows[0].name || name;
        emailEnabled = !!rows[0].notification_email_enabled;
      }
    }

    if (!email) {
      // If citizen has not registered an email (e.g. testing as guest),
      // deliver to connected developer/admin Gmail so you can see live tracking emails!
      if (EMAILJS_CONNECTED_EMAIL) {
        console.log(
          `[EmailService] Citizen ${citizenId} has no saved email. Delivering to connected Gmail: ${EMAILJS_CONNECTED_EMAIL}`
        );
        return { name: name || "Citizen", email: EMAILJS_CONNECTED_EMAIL };
      }
      return null;
    }

    if (!emailEnabled) {
      return null;
    }

    return { name, email };
  } catch (err) {
    console.warn("[EmailService] Failed to retrieve citizen email:", err);
    return null;
  }
}

/**
 * ─── 4-STAGE LIFECYCLE EMAIL SENDER ───
 */
export async function notifyCitizenViaEmail(
  citizenId: string,
  payload: {
    publicReference: string;
    title?: string;
    category?: string;
    newStatus: string;
    departmentName?: string;
    locationText?: string;
    reason?: string;
    workerName?: string;
  }
): Promise<void> {
  const contact = await getCitizenContact(citizenId);
  if (!contact) {
    console.log(`[EmailService] Skipping email notification (no verified email for ${citizenId})`);
    return;
  }

  const nowFormatted = new Date().toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const trackingUrl = `${APP_URL}/dashboard/${payload.publicReference}`;
  const reportTitle = payload.title || payload.category || "Civic Incident Report";
  const categoryName = payload.category || "General Civic Issue";
  const deptName = payload.departmentName || "Nagpur Municipal Response Command";
  const location = payload.locationText || "Nagpur Municipal Jurisdiction";
  const actionNote = payload.reason || "Processed by municipal civic dispatch.";

  // Generate stage-specific attributes
  let step = 1;
  let statusBadge = "Submitted";
  let statusTitle = "Report Registered & Confirmed";
  let statusColor = "#2563eb"; // Blue
  let statusMessage = "Thank you for contributing to a cleaner, safer Nagpur. Your incident report has been securely registered in the municipal dispatch database and queued for AI verification and routing.";

  let s1 = { color: "#2563eb", bg: "#2563eb", icon: "✓" };
  let s2 = { color: "#94a3b8", bg: "#cbd5e1", icon: "2" };
  let s3 = { color: "#94a3b8", bg: "#cbd5e1", icon: "3" };
  let s4 = { color: "#94a3b8", bg: "#cbd5e1", icon: "4" };

  const normStatus = payload.newStatus.toUpperCase();

  if (normStatus === "ASSIGNED" || normStatus === "ROUTED" || normStatus === "RECEIVED") {
    step = 2;
    statusBadge = "Acknowledged";
    statusTitle = "Routed to Handling Department";
    statusColor = "#4f46e5"; // Indigo
    statusMessage = `Your report has been reviewed and acknowledged by ${deptName}. The response team is preparing necessary field resources.`;
    s1 = { color: "#059669", bg: "#059669", icon: "✓" };
    s2 = { color: "#4f46e5", bg: "#4f46e5", icon: "✓" };
    s3 = { color: "#94a3b8", bg: "#cbd5e1", icon: "3" };
    s4 = { color: "#94a3b8", bg: "#cbd5e1", icon: "4" };
  } else if (normStatus === "IN_PROGRESS" || normStatus === "WORK_STARTED" || normStatus === "EN_ROUTE") {
    step = 3;
    statusBadge = "In Progress";
    statusTitle = payload.workerName ? `Field Crew Dispatched (${payload.workerName})` : "Field Crew Dispatched to Site";
    statusColor = "#d97706"; // Amber
    statusMessage = `A municipal field unit has been dispatched to ${location} to commence on-site remediation.`;
    s1 = { color: "#059669", bg: "#059669", icon: "✓" };
    s2 = { color: "#059669", bg: "#059669", icon: "✓" };
    s3 = { color: "#d97706", bg: "#d97706", icon: "⚙️" };
    s4 = { color: "#94a3b8", bg: "#cbd5e1", icon: "4" };
  } else if (normStatus === "RESOLVED" || normStatus === "WORK_COMPLETED" || normStatus === "CLOSED") {
    step = 4;
    statusBadge = "Resolved";
    statusTitle = "Civic Issue Successfully Resolved";
    statusColor = "#059669"; // Emerald Green
    statusMessage = "Municipal field operations on your report have concluded. Field verification is complete and the issue has been successfully remediated.";
    s1 = { color: "#059669", bg: "#059669", icon: "✓" };
    s2 = { color: "#059669", bg: "#059669", icon: "✓" };
    s3 = { color: "#059669", bg: "#059669", icon: "✓" };
    s4 = { color: "#059669", bg: "#059669", icon: "🎉" };
  }

  const emailParams: EmailJSTemplateParams = {
    to_name: contact.name,
    to_email: contact.email,
    subject: `[Sentinel City Intelligence] #${payload.publicReference}: ${statusTitle}`,
    report_id: payload.publicReference,
    report_title: reportTitle,
    category: categoryName,
    status_badge: statusBadge,
    status_title: statusTitle,
    status_color: statusColor,
    status_message: statusMessage,
    timeline_step: step,
    step1_color: s1.color,
    step1_bg: s1.bg,
    step1_icon: s1.icon,
    step2_color: s2.color,
    step2_bg: s2.bg,
    step2_icon: s2.icon,
    step3_color: s3.color,
    step3_bg: s3.bg,
    step3_icon: s3.icon,
    step4_color: s4.color,
    step4_bg: s4.bg,
    step4_icon: s4.icon,
    department_name: deptName,
    location_text: location,
    action_notes: actionNote,
    updated_at: nowFormatted,
    tracking_url: trackingUrl,
    portal_url: APP_URL,
    my_reports_url: `${APP_URL}/my-reports`,
    emergency_url: `${APP_URL}/emergency`,
    map_view_url: `${APP_URL}/track?ref=${payload.publicReference}`,
    regards_team: "Sentinel Citizen Support • Municipal Administration",
    support_email: EMAILJS_CONNECTED_EMAIL,
  };

  await sendEmailJS(emailParams);
}
