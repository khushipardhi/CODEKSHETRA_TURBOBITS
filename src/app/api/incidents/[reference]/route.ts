/* ════════════════════════════════════════════════════════
   GET /api/incidents/[reference]
   Fetch incident by public reference for citizen tracking
   Includes ownership check, AI Q&A, final report
   ════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getCitizenIdentity, isAdminRequest } from "@/lib/citizen-identity";

interface IncidentRow {
  id: string;
  public_reference: string;
  citizen_id: string;
  category_slug: string | null;
  status: string;
  severity: string | null;
  priority_score: number | null;
  title: string | null;
  citizen_summary: string | null;
  internal_summary: string | null;
  original_text: string | null;
  location_text: string | null;
  latitude: number | null;
  longitude: number | null;
  is_emergency: number;
  privacy_level: string;
  ai_analysis: string | null;
  final_ai_report: string | null;
  department_answers: string | null;
  created_at: string;
  confirmed_at: string | null;
  resolved_at: string | null;
}

interface DepartmentRow {
  department_code: string;
  department_name: string;
  status: string;
}

interface HistoryRow {
  to_status: string;
  reason: string | null;
  created_at: string;
}

interface ConversationRow {
  question_id: string;
  question_text: string;
  question_type: string;
  question_options: string | null;
  answer_value: string | null;
  answer_timestamp: string | null;
  is_required: number;
  sort_order: number;
}

interface MediaRow {
  id: string;
  file_name: string;
  mime_type: string;
  file_size: number;
  storage_url: string | null;
  purpose: string;
  created_at: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await params;

    if (!reference) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Reference is required" } },
        { status: 400 }
      );
    }

    // Try to get columns — handle missing final_ai_report/department_answers gracefully
    let incidents: IncidentRow[];
    try {
      incidents = await query<IncidentRow>(
        `SELECT id, public_reference, citizen_id, category_slug, status, severity,
                priority_score, title, citizen_summary, internal_summary, original_text,
                location_text, latitude, longitude, is_emergency, privacy_level,
                ai_analysis, final_ai_report, department_answers,
                created_at, confirmed_at, resolved_at
         FROM incidents WHERE public_reference = ?`,
        [reference]
      );
    } catch {
      // Fallback query without new columns
      incidents = await query<IncidentRow>(
        `SELECT id, public_reference, citizen_id, category_slug, status, severity,
                priority_score, title, citizen_summary, location_text,
                latitude, longitude, is_emergency,
                created_at, confirmed_at, resolved_at
         FROM incidents WHERE public_reference = ?`,
        [reference]
      );
    }

    if (incidents.length === 0) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Incident not found" } },
        { status: 404 }
      );
    }

    const incident = incidents[0];

    // ── Ownership check ──
    // Admin can see everything. Citizens can only see their own reports.
    // IMPORTANT: A citizen may have TWO valid IDs during a session:
    //   1. The httpOnly cookie guest_token (set async via register-guest)
    //   2. The x-guest-id header (from localStorage, the primary source)
    // Both map to the same human but may have different UUIDs if the cookie
    // registration hasn't completed yet. We accept EITHER as valid ownership.
    const isAdmin = isAdminRequest(request);
    if (!isAdmin) {
      const identity = await getCitizenIdentity(request);

      // Build set of all possible IDs for this requester
      const validIds = new Set<string>();
      if (identity) validIds.add(identity.citizenId);

      // Also check the raw header ID directly (in case cookie differs)
      const headerRaw = request.headers.get("x-guest-id");
      if (headerRaw) validIds.add(`guest_${headerRaw}`);

      // Check the cookie value too
      const cookieRaw = request.cookies.get("guest_token")?.value;
      if (cookieRaw) validIds.add(`guest_${cookieRaw}`);

      if (validIds.size === 0 || !validIds.has(incident.citizen_id)) {
        return NextResponse.json(
          { error: { code: "FORBIDDEN", message: "You are not authorized to view this report." } },
          { status: 403 }
        );
      }
    }

    // Fetch departments
    const departments = await query<DepartmentRow>(
      `SELECT department_code, department_name, status
       FROM incident_departments WHERE incident_id = ?`,
      [incident.id]
    );

    // Fetch status history
    const history = await query<HistoryRow>(
      `SELECT to_status, reason, created_at
       FROM incident_status_history
       WHERE incident_id = ?
       ORDER BY created_at ASC`,
      [incident.id]
    );

    // Fetch AI conversations (questions + answers)
    let conversations: ConversationRow[] = [];
    try {
      conversations = await query<ConversationRow>(
        `SELECT question_id, question_text, question_type, question_options,
                answer_value, answer_timestamp, is_required, sort_order
         FROM incident_ai_conversations
         WHERE incident_id = ?
         ORDER BY sort_order ASC, created_at ASC`,
        [incident.id]
      );
    } catch {
      // Table may not exist yet — non-fatal
    }

    // Parse JSON fields safely (TiDB mysql2 driver parses JSON columns into JS objects automatically)
    let finalReport = null;
    try {
      if (incident.final_ai_report) {
        finalReport = typeof incident.final_ai_report === "string" 
          ? JSON.parse(incident.final_ai_report) 
          : incident.final_ai_report;
      }
    } catch { /* invalid JSON */ }

    let deptAnswers = null;
    try {
      if (incident.department_answers) {
        deptAnswers = typeof incident.department_answers === "string" 
          ? JSON.parse(incident.department_answers) 
          : incident.department_answers;
      }
    } catch { /* invalid JSON */ }

    // Fetch incident media attachments
    let media: MediaRow[] = [];
    try {
      media = await query<MediaRow>(
        `SELECT id, file_name, mime_type, file_size, storage_url, purpose, created_at
         FROM incident_media
         WHERE incident_id = ?
         ORDER BY created_at ASC`,
        [incident.id]
      );
    } catch {
      // Table may not exist yet — non-fatal
    }

    // Build response — citizen vs admin get different data
    const baseResponse = {
      publicReference: incident.public_reference,
      category: incident.category_slug,
      status: incident.status,
      severity: incident.severity,
      priorityScore: incident.priority_score,
      title: incident.title,
      citizenSummary: incident.citizen_summary,
      locationText: incident.location_text,
      latitude: incident.latitude,
      longitude: incident.longitude,
      isEmergency: !!incident.is_emergency,
      privacyLevel: incident.privacy_level || "PUBLIC",
      createdAt: incident.created_at,
      confirmedAt: incident.confirmed_at,
      resolvedAt: incident.resolved_at,
    };

    // Admin gets additional fields
    const adminFields = isAdmin ? {
      internalSummary: incident.internal_summary,
      originalText: incident.original_text,
      citizenId: incident.citizen_id,
      aiAnalysis: incident.ai_analysis 
        ? (typeof incident.ai_analysis === "string" ? JSON.parse(incident.ai_analysis) : incident.ai_analysis) 
        : null,
      departmentAnswers: deptAnswers,
    } : {};

    return NextResponse.json({
      success: true,
      incident: {
        ...baseResponse,
        ...adminFields,
        finalReport,
      },
      departments: departments.map((d) => ({
        code: d.department_code,
        name: d.department_name,
        status: d.status,
      })),
      timeline: history.map((h) => ({
        status: h.to_status,
        description: h.reason,
        timestamp: h.created_at,
      })),
      media: media.map((m) => ({
        id: m.id,
        fileName: m.file_name,
        mimeType: m.mime_type,
        fileSize: m.file_size,
        storageUrl: m.storage_url,
        purpose: m.purpose,
        createdAt: m.created_at,
      })),
      aiConversation: conversations.map((c) => ({
        questionId: c.question_id,
        questionText: c.question_text,
        questionType: c.question_type,
        questionOptions: c.question_options 
          ? (typeof c.question_options === "string" ? JSON.parse(c.question_options) : c.question_options) 
          : null,
        answerValue: c.answer_value,
        answerTimestamp: c.answer_timestamp,
        isRequired: !!c.is_required,
        sortOrder: c.sort_order,
      })),
    });
  } catch (err) {
    console.error("[API] /incidents/[reference] error:", err);
    return NextResponse.json(
      {
        error: {
          code: "FETCH_FAILED",
          message: "Failed to fetch incident details.",
        },
      },
      { status: 500 }
    );
  }
}
