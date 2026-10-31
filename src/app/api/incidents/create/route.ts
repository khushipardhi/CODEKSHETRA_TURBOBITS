/* ════════════════════════════════════════════════════════
   POST /api/incidents/create
   Persist confirmed incident to TiDB
   Stores: department_answers, selected_department, geo_routing,
           AI Q&A conversations, final AI report
   Uses real citizen identity
   ════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { execute, query } from "@/lib/db";
import { generateULID as ulid } from "@/lib/ids";
import { formatDepartmentName } from "@/modules/ai/department-routing";
import { routeIncident } from "@/modules/geo/router";
import { getCitizenIdentity } from "@/lib/citizen-identity";
import {
  notifyReportReceived,
  notifyDepartment,
  notifyAdminEmergency,
} from "@/lib/notification-service";
import { CITIES, DEFAULT_CITY, detectCityFromCoords } from "@/lib/city-context";
import { evaluateRoutingDecision } from "@/modules/routing/engine";
import { persistRoutingDecisionRecord } from "@/modules/routing/decision-record";
import { initializeDepartmentCoordination } from "@/modules/routing/coordination";
import { calculateOperationalPriority, computeSlaStatus } from "@/modules/routing/sla";
import type { AnalysisResult } from "@/modules/ai/engine";
import type { GeoRoutingResult } from "@/modules/geo/types";

/** Generate a public reference like NAG-2026-000042, PUN-2026-000042, MUM-2026-000042 */
async function generateReference(prefix: string = "NAG"): Promise<string> {
  const year = new Date().getUTCFullYear();
  await execute("INSERT INTO incident_sequence (year) VALUES (?)", [year]);
  const rows = await query<{ id: number }>("SELECT LAST_INSERT_ID() as id");
  const seq = rows[0]?.id ?? Math.floor(Math.random() * 999999);
  return `${prefix}-${year}-${String(seq).padStart(6, "0")}`;
}

/** AI Q&A item from the client */
interface AIConversationItem {
  questionId: string;
  questionText: string;
  questionType: string;
  questionOptions?: string[];
  answerValue: string | string[];
  required: boolean;
  sortOrder: number;
}

export async function POST(request: NextRequest) {
  try {
    // Extract real citizen identity
    const identity = await getCitizenIdentity(request);
    const citizenId = identity?.citizenId ?? "anonymous";

    const body = await request.json();
    const {
      originalText,
      originalTranscript,
      analysis,
      locationText,
      latitude,
      longitude,
      departmentAnswers,
      selectedDepartment,
      aiConversation,
      finalReport: clientFinalReport,
      privacyLevel: clientPrivacy,
      attachments,
      telemetryObservationId,
      simulationRunId,
    } = body as {
      originalText: string;
      originalTranscript?: string;
      analysis: AnalysisResult;
      locationText?: string;
      latitude?: number;
      longitude?: number;
      departmentAnswers?: Record<string, string | string[]>;
      selectedDepartment?: string;
      aiConversation?: AIConversationItem[];
      finalReport?: Record<string, unknown> | null;
      privacyLevel?: string;
      attachments?: Array<{
        fileName: string;
        mimeType: string;
        fileSize: number;
        storageUrl: string;
        purpose?: string;
      }>;
      telemetryObservationId?: string | null;
      simulationRunId?: string | null;
    };

    if (!analysis || !analysis.summary) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Analysis data is required",
          },
        },
        { status: 400 }
      );
    }

    const rawCity = (body as any).cityId || (body as any).city || request.headers.get("x-city") || DEFAULT_CITY;
    let cityId = String(rawCity).toLowerCase();

    // ─── Boundary Guard: Check GPS coordinates against selected city ───
    let cityMismatchWarning: string | null = null;
    if (typeof latitude === "number" && typeof longitude === "number") {
      const detectedCity = detectCityFromCoords(latitude, longitude);
      if (detectedCity && detectedCity !== cityId) {
        cityMismatchWarning = `GPS coordinates (${latitude.toFixed(4)}, ${longitude.toFixed(4)}) belong to ${detectedCity.toUpperCase()}, but report context was ${cityId.toUpperCase()}. Corrected jurisdiction to ${detectedCity.toUpperCase()} to prevent cross-city data contamination.`;
        console.warn(`[API] Cross-city boundary mismatch: ${cityMismatchWarning}`);
        cityId = detectedCity;
      }
    }

    const cityConfig = CITIES[cityId] || CITIES[DEFAULT_CITY];
    const prefix = cityConfig.refPrefix || "NAG";

    const incidentId = ulid();
    const publicReference = await generateReference(prefix);

    // Map privacy level — prefer client choice, fall back to AI analysis
    const privacyLevel = clientPrivacy
      ? clientPrivacy.toUpperCase()
      : analysis.privacy?.level === "sensitive"
        ? "SENSITIVE"
        : analysis.privacy?.level === "restricted"
          ? "RESTRICTED"
          : "PUBLIC";

    // Map severity
    const severity = (analysis.severity?.level || "medium").toUpperCase();

    // Build final AI report JSON — merge Stage 3 synthesis if available
    const finalAiReport = {
      incidentType: analysis.incidentType,
      category: analysis.mainCategoryName || analysis.mainCategory,
      subcategory: analysis.subcategory,
      summary: clientFinalReport?.finalSummary || analysis.summary,
      severity: analysis.severity,
      priority: analysis.priority,
      affectedPeople: clientFinalReport?.affectedPeople ?? analysis.affectedPeople,
      departments: analysis.departments,
      location: analysis.location,
      privacy: analysis.privacy,
      isEmergency: analysis.isEmergency,
      confidence: analysis.confidence,
      deptQuestions: analysis.deptQuestions,
      questionsForCitizen: analysis.questionsForCitizen,
      aiProvider: analysis.aiProvider,
      aiModel: analysis.aiModel,
      // Stage 3 synthesis
      keyFindings: clientFinalReport?.keyFindings || [],
      recommendedActions: clientFinalReport?.recommendedActions || [],
      urgencyReason: clientFinalReport?.urgencyReason || "",
      finalSummary: clientFinalReport?.finalSummary || null,
      generatedAt: new Date().toISOString(),
    };

    // ─── Phase 10: Explainable Deterministic Routing & SLA Calculation ───
    const routingDecision = evaluateRoutingDecision({
      city: String(rawCity).toLowerCase(),
      category: analysis.mainCategory || "other",
      subcategory: analysis.subcategory || analysis.incidentType || null,
      severity,
      isEmergency: !!analysis.isEmergency,
      locationText: locationText || analysis.location?.text || null,
      latitude: latitude || null,
      longitude: longitude || null,
    });

    const operationalPriority = calculateOperationalPriority({
      isEmergency: !!analysis.isEmergency,
      severity,
      hasOfficialWarning: false,
    });

    const slaStatus = await computeSlaStatus({
      city: cityConfig.id,
      departmentCode: routingDecision.primaryDepartment,
      priority: operationalPriority,
      createdAt: new Date(),
    });

    const primaryDept = selectedDepartment || routingDecision.primaryDepartment;

    // Insert the incident with real citizen identity, city context, and Phase 10 operational columns
    await execute(
      `INSERT INTO incidents (
        id, public_reference, city, citizen_id, selected_department, primary_department,
        category_slug, subcategory_slug, status, severity, priority_score, priority_band,
        operational_priority, sla_due_at, privacy_level,
        title, citizen_summary, internal_summary, original_text,
        location_text, latitude, longitude,
        is_emergency, ai_provider, ai_model, ai_confidence, ai_analysis,
        department_answers, confirmed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        incidentId,
        publicReference,
        cityConfig.id,
        citizenId,
        primaryDept,
        primaryDept,
        analysis.mainCategory || null,
        analysis.subcategory || null,
        "CONFIRMED",
        severity,
        analysis.priority?.score ?? 50,
        analysis.priority?.band ?? "MEDIUM",
        operationalPriority,
        slaStatus.resolutionDueAt.replace("T", " ").slice(0, 19),
        privacyLevel,
        analysis.summary.slice(0, 200),
        analysis.summary,
        `${analysis.mainCategoryName || analysis.mainCategory || "Department"} — ${analysis.incidentType || "Civic Issue"}. Score: ${analysis.priority?.score ?? 50}`,
        originalText || null,
        locationText || analysis.location?.text || null,
        latitude || null,
        longitude || null,
        analysis.isEmergency ? 1 : 0,
        analysis.aiProvider || null,
        analysis.aiModel || null,
        analysis.confidence?.overall ?? 0.85,
        JSON.stringify(analysis),
        departmentAnswers ? JSON.stringify(departmentAnswers) : null,
      ]
    );

    // Store final AI report (try ALTER TABLE if column doesn't exist yet)
    try {
      await execute(
        `UPDATE incidents SET final_ai_report = ? WHERE id = ?`,
        [JSON.stringify(finalAiReport), incidentId]
      );
    } catch {
      // Column may not exist yet — non-fatal
      console.warn("[API] final_ai_report column not available — skipping");
    }

    // Store original transcript if voice input
    if (originalTranscript) {
      try {
        await execute(
          `UPDATE incidents SET original_transcript = ? WHERE id = ?`,
          [originalTranscript, incidentId]
        );
      } catch {
        // Column may not exist yet — non-fatal
      }
    }

    // Insert AI conversation (questions + answers) if provided
    if (aiConversation && aiConversation.length > 0) {
      try {
        for (const item of aiConversation) {
          const answerStr = Array.isArray(item.answerValue)
            ? item.answerValue.join(", ")
            : String(item.answerValue || "");

          await execute(
            `INSERT INTO incident_ai_conversations (
              id, incident_id, question_id, question_text, question_type,
              question_options, answer_value, answer_timestamp,
              is_required, sort_order
            ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?)`,
            [
              ulid(),
              incidentId,
              item.questionId,
              item.questionText,
              item.questionType,
              item.questionOptions ? JSON.stringify(item.questionOptions) : null,
              answerStr,
              item.required ? 1 : 0,
              item.sortOrder,
            ]
          );
        }
      } catch (qaErr) {
        // Q&A table may not exist yet — non-fatal
        console.warn("[API] AI conversations table not available:", qaErr);
      }
    }

    // Insert attachments into incident_media if provided
    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      try {
        for (const att of attachments) {
          if (!att.storageUrl) continue;
          await execute(
            `INSERT INTO incident_media (
              id, incident_id, file_name, mime_type, file_size, storage_url, purpose, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
            [
              ulid(),
              incidentId,
              att.fileName || "attachment.jpg",
              att.mimeType || "image/jpeg",
              att.fileSize || 0,
              att.storageUrl,
              att.purpose || "evidence",
            ]
          );
        }
        console.log(`[API] Stored ${attachments.length} attachments for incident ${publicReference}`);
      } catch (mediaErr) {
        console.warn("[API] Failed to store attachments (non-fatal):", mediaErr);
      }
    }

    // ─── Phase 10: Multi-Department Coordination & Decision Record ───
    await initializeDepartmentCoordination(incidentId, routingDecision);
    await persistRoutingDecisionRecord(routingDecision, incidentId);

    // Record status history
    await execute(
      `INSERT INTO incident_status_history (
        id, incident_id, from_status, to_status, actor_id, reason
      ) VALUES (?, ?, 'DRAFT', 'CONFIRMED', ?, ?)`,
      [
        ulid(),
        incidentId,
        citizenId,
        departmentAnswers && Object.keys(departmentAnswers).length > 0
          ? "Citizen confirmed AI analysis with dept-specific answers"
          : "Citizen confirmed AI analysis",
      ]
    );

    // ─── Phase 1: Explicit Environmental Evidence Link ───
    try {
      const recentEvents = await query<{ id: string; event_reference: string }>(
        `SELECT id, event_reference FROM hazard_events 
         WHERE city = ? AND status IN ('DETECTED', 'ACTIVE', 'ESCALATED') 
         ORDER BY started_at DESC LIMIT 1`,
        [cityConfig.id]
      );

      if (recentEvents && recentEvents.length > 0) {
        const eventId = recentEvents[0].id;
        await execute(
          `INSERT INTO hazard_evidence_links (
            id, hazard_event_id, evidence_type, evidence_id, correlation_score, notes, created_at
          ) VALUES (?, ?, 'INCIDENT_REPORT', ?, 0.85, ?, NOW())`,
          [
            ulid(),
            eventId,
            incidentId,
            `Linked civic incident ${publicReference} (${analysis.mainCategory || "Civic"}) to hazard event ${recentEvents[0].event_reference}`
          ]
        );
      }
    } catch (hazLinkErr) {
      console.warn("[API] Hazard evidence link non-fatal note:", hazLinkErr);
    }

    // ─── Prompt 8: Explicit Telemetry & Simulation Evidence Linkages ───
    if (telemetryObservationId) {
      try {
        await execute(
          `INSERT INTO hazard_evidence_links (
            id, hazard_event_id, evidence_type, evidence_id, correlation_score, notes, created_at
          ) VALUES (?, ?, 'OBSERVATION', ?, 0.90, ?, NOW())`,
          [
            ulid(),
            incidentId,
            telemetryObservationId,
            `Incident ${publicReference} linked to upstream telemetry observation ${telemetryObservationId}`,
          ]
        );
      } catch (obsLinkErr) {
        console.warn("[API] Telemetry link non-fatal note:", obsLinkErr);
      }
    }

    if (simulationRunId) {
      try {
        await execute(
          `INSERT INTO hazard_evidence_links (
            id, hazard_event_id, evidence_type, evidence_id, correlation_score, notes, created_at
          ) VALUES (?, ?, 'TERRAIN_SINK', ?, 0.80, ?, NOW())`,
          [
            ulid(),
            incidentId,
            simulationRunId,
            `Incident ${publicReference} linked to simulation scenario run ${simulationRunId}`,
          ]
        );
      } catch (simLinkErr) {
        console.warn("[API] Simulation link non-fatal note:", simLinkErr);
      }
    }

    // ─── Geo Routing ───
    let geoRouting: GeoRoutingResult | null = null;
    if (latitude && longitude && analysis.departments && analysis.departments.length > 0) {
      try {
        geoRouting = routeIncident({
          latitude,
          longitude,
          requiredDepartments: analysis.departments.map((d) => d.code),
          cityId: cityConfig.id,
        });

        await execute(
          `UPDATE incidents SET geo_routing = ? WHERE id = ?`,
          [JSON.stringify(geoRouting), incidentId]
        );

        console.log(
          `[API] Geo routing: zone=${geoRouting.matchedZone?.zoneName || "none"} ` +
            `recommendations=${geoRouting.recommendations.length} in ${geoRouting.processingTimeMs}ms`
        );
      } catch (geoErr) {
        console.warn("[API] Geo routing failed (non-fatal):", geoErr);
      }
    }

    // ─── Fire notifications (non-blocking, non-fatal) ───
    Promise.allSettled([
      // Citizen: report received
      notifyReportReceived({
        citizenId,
        incidentId,
        publicReference,
        title: analysis.summary,
      }),
      // Each department: new incident routed
      ...(analysis.departments && analysis.departments.length > 0
        ? analysis.departments.map((d) =>
            notifyDepartment({
              departmentCode: d.code,
              incidentId,
              publicReference,
              severity,
              title: analysis.summary,
            })
          )
        : [
            notifyDepartment({
              departmentCode: routingDecision.primaryDepartment,
              incidentId,
              publicReference,
              severity,
              title: analysis.summary,
            }),
          ]),
      // Admin: emergency alert
      ...(analysis.isEmergency
        ? [
            notifyAdminEmergency({
              incidentId,
              publicReference,
              title: analysis.summary,
            }),
          ]
        : []),
    ]).catch(() => {});

    console.log(
      `[API] Incident created: ${publicReference} | citizen=${citizenId} | ` +
        `${analysis.mainCategory}/${analysis.subcategory} | ${severity} | ` +
        `depts=[${(analysis.departments || [{ code: routingDecision.primaryDepartment }]).map((d: any) => d.code).join(",")}] | ` +
        `answers=${departmentAnswers ? Object.keys(departmentAnswers).length : 0} | ` +
        `qa=${aiConversation?.length || 0} | geo=${geoRouting ? "yes" : "no"}`
    );

    return NextResponse.json({
      success: true,
      incident: {
        id: incidentId,
        publicReference,
        title: analysis.summary,
        status: "CONFIRMED",
        severity,
        priorityScore: analysis.priority?.score ?? 50,
        priorityBand: analysis.priority?.band ?? "MEDIUM",
        operationalPriority,
        isEmergency: !!analysis.isEmergency,
        primaryDepartment: {
          code: routingDecision.primaryDepartment,
          name: routingDecision.primaryDepartmentName,
        },
        supportingDepartments: routingDecision.supportingDepartments,
        departments: [
          { code: routingDecision.primaryDepartment, name: routingDecision.primaryDepartmentName },
          ...routingDecision.supportingDepartments,
        ],
        routingDecision: {
          ruleId: routingDecision.matchedRuleId,
          explanation: routingDecision.decisionExplanation,
          confidence: routingDecision.confidenceStatus,
          assignmentMode: routingDecision.assignmentMode,
          dependencies: routingDecision.dependencies,
          sla: {
            ackMinutes: routingDecision.ackMinutes,
            slaHours: routingDecision.slaHours,
            dueAt: slaStatus.resolutionDueAt,
            escalationTarget: routingDecision.escalationTarget,
          },
        },
        createdAt: new Date().toISOString(),
      },
      geoRouting: geoRouting || undefined,
      warning: cityMismatchWarning || undefined,
    });
  } catch (err) {
    console.error("[API] /incidents/create error:", err);
    return NextResponse.json(
      {
        error: {
          code: "CREATE_FAILED",
          message: "Failed to create the incident. Please try again.",
          retryable: true,
        },
      },
      { status: 500 }
    );
  }
}
