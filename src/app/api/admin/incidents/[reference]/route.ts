/* ════════════════════════════════════════════════════════
   GET /api/admin/incidents/[reference]
   Admin-level incident detail — full data including
   AI analysis, original text, department answers, geo routing
   ════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { generateULID } from "@/lib/ids";
import { notifyStatusChange } from "@/lib/notification-service";

interface IncidentRow {
  id: string;
  public_reference: string;
  citizen_id: string;
  category_slug: string | null;
  subcategory_slug: string | null;
  status: string;
  severity: string | null;
  priority_score: number | null;
  priority_band: string | null;
  privacy_level: string;
  title: string | null;
  citizen_summary: string | null;
  internal_summary: string | null;
  original_text: string | null;
  original_transcript: string | null;
  location_text: string | null;
  latitude: number | null;
  longitude: number | null;
  location_accuracy: number | null;
  is_emergency: number;
  ai_provider: string | null;
  ai_model: string | null;
  ai_confidence: number | null;
  ai_analysis: string | null;
  final_ai_report: string | null;
  selected_department: string | null;
  department_answers: string | null;
  geo_routing: string | null;
  confirmed_at: string | null;
  routed_at: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

interface ConversationRow {
  question_id: string;
  question_text: string;
  question_type: string;
  question_options: string | null;
  answer_value: string | null;
  sort_order: number;
}

interface DepartmentRow {
  department_code: string;
  department_name: string;
  routing_reason: string | null;
  status: string;
  priority_override: number | null;
  received_at: string | null;
  resolved_at: string | null;
  created_at: string;
}

interface HistoryRow {
  from_status: string;
  to_status: string;
  actor_id: string | null;
  reason: string | null;
  created_at: string;
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

    // Fetch incident — full admin view (all columns including AI report, geo routing)
    const incidents = await query<IncidentRow>(
      `SELECT id, public_reference, citizen_id, category_slug, subcategory_slug,
              status, severity, priority_score, priority_band, privacy_level,
              title, citizen_summary, internal_summary, original_text,
              original_transcript,
              location_text, latitude, longitude, location_accuracy,
              is_emergency, ai_provider, ai_model, ai_confidence, ai_analysis,
              final_ai_report, selected_department, department_answers, geo_routing,
              confirmed_at, routed_at, resolved_at, created_at, updated_at
       FROM incidents WHERE public_reference = ?`,
      [reference]
    );

    if (incidents.length === 0) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Incident not found" } },
        { status: 404 }
      );
    }

    const incident = incidents[0];

    // Fetch departments, timeline, media, AI conversations in parallel
    const [departments, history, media, conversations] = await Promise.all([
      query<DepartmentRow>(
        `SELECT department_code, department_name, routing_reason, status,
                priority_override, received_at, resolved_at, created_at
         FROM incident_departments WHERE incident_id = ?
         ORDER BY created_at ASC`,
        [incident.id]
      ),
      query<HistoryRow>(
        `SELECT from_status, to_status, actor_id, reason, created_at
         FROM incident_status_history
         WHERE incident_id = ?
         ORDER BY created_at ASC`,
        [incident.id]
      ),
      query<MediaRow>(
        `SELECT id, file_name, mime_type, file_size, storage_url, purpose, created_at
         FROM incident_media WHERE incident_id = ?
         ORDER BY created_at ASC`,
        [incident.id]
      ),
      query<ConversationRow>(
        `SELECT question_id, question_text, question_type, question_options,
                answer_value, sort_order
         FROM incident_ai_conversations WHERE incident_id = ?
         ORDER BY sort_order ASC`,
        [incident.id]
      ).catch(() => [] as ConversationRow[]),  // Table may not exist — safe fallback
    ]);

    // Parse JSON fields safely — TiDB may return JSON columns as objects or strings
    const parseJson = (val: unknown): unknown => {
      if (val === null || val === undefined) return null;
      if (typeof val === "object") return val; // Already parsed by mysql2 driver
      if (typeof val === "string") {
        try { return JSON.parse(val); } catch { return null; }
      }
      return null;
    };

    const aiAnalysis = parseJson(incident.ai_analysis);
    const departmentAnswers = parseJson(incident.department_answers);
    const finalAiReport = parseJson(incident.final_ai_report);
    const geoRouting = parseJson(incident.geo_routing);

    return NextResponse.json({
      success: true,
      incident: {
        id: incident.id,
        publicReference: incident.public_reference,
        citizenId: incident.citizen_id,
        category: incident.category_slug,
        subcategory: incident.subcategory_slug,
        status: incident.status,
        severity: incident.severity,
        priorityScore: incident.priority_score,
        priorityBand: incident.priority_band,
        privacyLevel: incident.privacy_level,
        title: incident.title,
        citizenSummary: incident.citizen_summary,
        internalSummary: incident.internal_summary,
        originalText: incident.original_text,
        originalTranscript: incident.original_transcript,
        locationText: incident.location_text,
        latitude: incident.latitude,
        longitude: incident.longitude,
        locationAccuracy: incident.location_accuracy,
        isEmergency: !!incident.is_emergency,
        selectedDepartment: incident.selected_department,
        departmentAnswers,
        ai: {
          provider: incident.ai_provider,
          model: incident.ai_model,
          confidence: incident.ai_confidence,
          analysis: aiAnalysis,
        },
        finalAiReport,
        geoRouting,
        confirmedAt: incident.confirmed_at,
        routedAt: incident.routed_at,
        resolvedAt: incident.resolved_at,
        createdAt: incident.created_at,
        updatedAt: incident.updated_at,
      },
      departments: departments.map((d) => ({
        code: d.department_code,
        name: d.department_name,
        routingReason: d.routing_reason,
        status: d.status,
        priorityOverride: d.priority_override,
        receivedAt: d.received_at,
        resolvedAt: d.resolved_at,
        createdAt: d.created_at,
      })),
      conversations: conversations.map((c) => ({
        questionId: c.question_id,
        questionText: c.question_text,
        questionType: c.question_type,
        questionOptions: parseJson(c.question_options),
        answerValue: c.answer_value,
        sortOrder: c.sort_order,
      })),
      timeline: history.map((h) => ({
        fromStatus: h.from_status,
        toStatus: h.to_status,
        actorId: h.actor_id,
        reason: h.reason,
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
    });
  } catch (err) {
    console.error("[API] /admin/incidents/[reference] error:", err);
    return NextResponse.json(
      { error: { code: "FETCH_FAILED", message: "Failed to fetch incident." } },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await params;
    const body = await request.json();
    const { status, reason, actorName } = body as {
      status?: string;
      reason?: string;
      actorName?: string;
    };

    if (!reference || !status) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Status is required" } },
        { status: 400 }
      );
    }

    const existing = await query<{ id: string; status: string; citizen_id: string; title: string }>(
      `SELECT id, status, citizen_id, title FROM incidents WHERE public_reference = ? LIMIT 1`,
      [reference]
    );

    if (existing.length === 0) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Incident not found" } },
        { status: 404 }
      );
    }

    const inc = existing[0];
    const fromStatus = inc.status;
    const isResolved = status === "RESOLVED" || status === "CLOSED";

    // Update incident
    await execute(
      `UPDATE incidents SET
         status = ?,
         resolved_at = ${isResolved ? "NOW()" : "resolved_at"},
         updated_at = NOW()
       WHERE id = ?`,
      [status, inc.id]
    );

    // Update departments status
    await execute(
      `UPDATE incident_departments SET
         status = ?,
         resolved_at = ${isResolved ? "NOW()" : "resolved_at"}
       WHERE incident_id = ?`,
      [status, inc.id]
    );

    // Log status history event
    await execute(
      `INSERT INTO incident_status_history (
         id, incident_id, from_status, to_status, actor_id, actor_name, actor_role, reason, created_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        generateULID(),
        inc.id,
        fromStatus,
        status,
        "admin_user",
        actorName || "City Command Admin",
        "SUPER_ADMIN",
        reason || `Status updated to ${status} via Admin Command Portal`,
      ]
    ).catch(() => {});

    // Trigger push & email notifications to citizen
    if (inc.citizen_id) {
      notifyStatusChange({
        citizenId: inc.citizen_id,
        incidentId: inc.id,
        publicReference: reference,
        newStatus: status,
        title: inc.title || `Incident ${reference}`,
        reason: reason || undefined,
      }).catch((err) => {
        console.warn("[Admin] Notification error:", err);
      });
    }

    return NextResponse.json({
      success: true,
      message: `Incident ${reference} updated to ${status}`,
    });
  } catch (err) {
    console.error("[API] /admin/incidents/[reference] PATCH error:", err);
    return NextResponse.json(
      { error: { code: "UPDATE_FAILED", message: "Failed to update incident" } },
      { status: 500 }
    );
  }
}
