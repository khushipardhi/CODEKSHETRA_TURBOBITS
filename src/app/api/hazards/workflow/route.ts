/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence API — /api/hazards/workflow
   Unified Hazard-to-Incident Workflow, Department Routing,
   Action Tracking & Evidence-Linked Reports (Prompt 8)
   ════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import {
  createScenarioAdvisoryProposal,
  approveAdvisory,
  generateCitizenReportingPrefill,
  createDepartmentTask,
  transitionTaskStatus,
  getEvidenceLinksForEntity,
  getDepartmentTasks,
  getAdvisoryDrafts,
} from "@/modules/hazards/workflow-manager";
import type { CitySlug, DepartmentTaskLifecycleState } from "@/modules/hazards/workflow-contracts";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "evidence";
    const city = (searchParams.get("city") || "mumbai").toLowerCase() as CitySlug;
    const targetId = searchParams.get("targetId");
    const departmentCode = searchParams.get("departmentCode") || undefined;
    const status = searchParams.get("status") as DepartmentTaskLifecycleState | undefined;

    if (type === "evidence" && targetId) {
      const links = getEvidenceLinksForEntity(targetId);
      return NextResponse.json({
        success: true,
        data: { targetId, links, count: links.length },
      });
    }

    if (type === "advisories") {
      const advisories = getAdvisoryDrafts(city);
      return NextResponse.json({
        success: true,
        data: { city, advisories, count: advisories.length },
      });
    }

    if (type === "tasks") {
      const tasks = getDepartmentTasks({ city, departmentCode, status });
      return NextResponse.json({
        success: true,
        data: { city, tasks, count: tasks.length },
      });
    }

    if (type === "prefill") {
      const category = searchParams.get("category") || "water_drainage";
      const subcategory = searchParams.get("subcategory") || undefined;
      const wardId = searchParams.get("wardId") || undefined;
      const wardName = searchParams.get("wardName") || undefined;
      const obsId = searchParams.get("obsId") || undefined;
      const scenarioId = searchParams.get("scenarioId") || undefined;
      const lat = searchParams.get("lat") ? parseFloat(searchParams.get("lat")!) : undefined;
      const lon = searchParams.get("lon") ? parseFloat(searchParams.get("lon")!) : undefined;

      const prefill = generateCitizenReportingPrefill({
        city,
        cityName: city === "mumbai" ? "Mumbai" : city === "pune" ? "Pune" : "Nagpur",
        resolvedWardId: wardId,
        resolvedWardName: wardName,
        coordinates: lat && lon ? [lat, lon] : undefined,
        suggestedCategory: category,
        suggestedSubcategory: subcategory,
        sourceObservationId: obsId,
        sourceScenarioId: scenarioId,
      });

      return NextResponse.json({
        success: true,
        data: prefill,
      });
    }

    return NextResponse.json(
      { success: false, error: { code: "BAD_REQUEST", message: "Invalid type or missing parameters" } },
      { status: 400 }
    );
  } catch (err) {
    console.error("[API /api/hazards/workflow GET] Error:", err);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: (err as Error).message } },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { action } = body;

    if (!action) {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "Action is required." } },
        { status: 400 }
      );
    }

    // ─── 1. Create Simulation Advisory Proposal (Never convert directly to real incident) ───
    if (action === "PROPOSE_ADVISORY") {
      const {
        city = "mumbai",
        scenarioId,
        scenarioTitle,
        wardId,
        wardName,
        screeningScore,
        hazardType = "urban_flood",
        draftedBy = "SYSTEM_SIMULATION_ENGINE",
        recommendedCivicActions,
        recommendedDepartmentActions,
        relatedCitizenReportCount,
        chronicHotspotNames,
      } = body;

      if (!scenarioId || !wardId || screeningScore == null) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "scenarioId, wardId, and screeningScore are required.",
            },
          },
          { status: 400 }
        );
      }

      const advisory = await createScenarioAdvisoryProposal({
        city: (city as string).toLowerCase() as CitySlug,
        scenarioId,
        scenarioTitle: scenarioTitle || scenarioId,
        wardId,
        wardName: wardName || wardId,
        screeningScore: Number(screeningScore),
        hazardType,
        draftedBy,
        recommendedCivicActions,
        recommendedDepartmentActions,
        relatedCitizenReportCount,
        chronicHotspotNames,
      });

      return NextResponse.json({
        success: true,
        data: advisory,
        message: "Precautionary advisory proposal drafted. Awaiting authorized administrative review.",
      });
    }

    // ─── 2. Authorize Precautionary Advisory ───
    if (action === "APPROVE_ADVISORY") {
      const { advisoryId, actorId = "ADMIN_MUNICIPAL", role = "ADMIN", notes } = body;

      if (!advisoryId) {
        return NextResponse.json(
          { success: false, error: { code: "VALIDATION_ERROR", message: "advisoryId is required." } },
          { status: 400 }
        );
      }

      const advisory = await approveAdvisory(advisoryId, {
        actorId,
        role,
        notes,
      });

      return NextResponse.json({
        success: true,
        data: advisory,
        message: "Advisory successfully authorized and marked as APPROVED_PUBLISHED.",
      });
    }

    // ─── 3. Create Department Task from Findings ───
    if (action === "CREATE_TASK") {
      const {
        incidentId,
        publicReference,
        city = "mumbai",
        wardId,
        category = "water_drainage",
        subcategory,
        taskTitle,
        requiredAction,
        creatorRole = "ADMIN",
        latitude,
        longitude,
        customDepartmentCode,
      } = body;

      if (!taskTitle || !requiredAction) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "taskTitle and requiredAction are required.",
            },
          },
          { status: 400 }
        );
      }

      const task = await createDepartmentTask({
        incidentId: incidentId || `INC-${Date.now()}`,
        publicReference: publicReference || `TASK-REF-${Date.now().toString().slice(-6)}`,
        city: (city as string).toLowerCase() as CitySlug,
        wardId: wardId || "UNSPECIFIED",
        category,
        subcategory,
        taskTitle,
        requiredAction,
        creatorRole,
        latitude: latitude ? Number(latitude) : undefined,
        longitude: longitude ? Number(longitude) : undefined,
        customDepartmentCode,
      });

      return NextResponse.json({
        success: true,
        data: task,
        message: `Task created and assigned to ${task.departmentName} (${task.departmentCode}). Status: ${task.status}.`,
      });
    }

    // ─── 4. Transition Department Task Status (With Proof / Real Lifecycle) ───
    if (action === "TRANSITION_TASK") {
      const {
        taskId,
        fromStatus,
        toStatus,
        actorId = "WORKER_FIELD",
        role = "DEPARTMENT_WORKER",
        departmentCode,
        actionNotes,
        resolutionEvidenceUrl,
      } = body;

      if (!taskId || !toStatus) {
        return NextResponse.json(
          {
            success: false,
            error: { code: "VALIDATION_ERROR", message: "taskId and toStatus are required." },
          },
          { status: 400 }
        );
      }

      const task = await transitionTaskStatus({
        taskId,
        fromStatus,
        toStatus,
        actor: { actorId, role, departmentCode },
        actionNotes,
        resolutionEvidenceUrl,
      });

      return NextResponse.json({
        success: true,
        data: task,
        message: `Task ${taskId} transitioned to ${task.status}.`,
      });
    }

    return NextResponse.json(
      { success: false, error: { code: "UNKNOWN_ACTION", message: `Action '${action}' is not supported.` } },
      { status: 400 }
    );
  } catch (err: any) {
    console.error("[API /api/hazards/workflow POST] Error:", err);
    return NextResponse.json(
      { success: false, error: { code: "WORKFLOW_ERROR", message: err.message || "Workflow execution failed." } },
      { status: 400 }
    );
  }
}
