/* ════════════════════════════════════════════════════════
   GeoNexus — Incident Analysis Specialist Agent Wrapper
   Independent execution wrapper for Mode A (direct specialist chat)
   and Mode B (orchestrator child task delegation).
   Connects to real TiDB Cloud incidents table and 17-department routing.
   ════════════════════════════════════════════════════════ */

import { query } from "@/lib/db";
import { GroqIncidentAnalysisProvider } from "@/modules/ai/groq-provider";
import {
  createTask,
  addTraceStep,
  recordToolExecution,
  completeTask,
  failTask,
} from "./task-manager";
import {
  SpecialistAgentResult,
  AgentTask,
} from "@/db/schema/005-agents";

export interface IncidentSpecialistParams {
  query: string;
  city?: string;
  wardId?: string;
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;
  parentTaskId?: string | null;
}

export interface IncidentExecutionOutput {
  taskId: string;
  agentId: "incident";
  content: string;
  specialistResult: SpecialistAgentResult;
  task: AgentTask;
}

export async function executeIncidentTask(
  params: IncidentSpecialistParams
): Promise<IncidentExecutionOutput> {
  const startTime = Date.now();
  const city = params.city || "mumbai";

  const task = await createTask({
    agentId: "incident",
    taskType: "INCIDENT_TRIAGE_AND_ANALYSIS",
    intent: "CIVIC_INCIDENT_OPERATIONS",
    inputPreview: params.query.slice(0, 480),
    inputPayload: {
      query: params.query,
      city,
      wardId: params.wardId,
    },
    parentTaskId: params.parentTaskId,
  });

  try {
    // ─── Stage 1: Query Active Incidents from Database ───
    await addTraceStep(task.id, {
      stage: "database_incident_retrieval",
      durationMs: Date.now() - startTime,
      status: "OK",
      detail: `Querying active civic incidents for ${city.toUpperCase()} from TiDB Cloud`,
    });

    const dbStart = Date.now();
    let dbIncidents: any[] = [];
    try {
      dbIncidents = await query<any>(
        `SELECT id, public_reference, title, severity, status, city, 
                primary_department, operational_priority, location_text, 
                latitude, longitude, created_at 
         FROM incidents 
         WHERE city = ? 
         ORDER BY created_at DESC 
         LIMIT 60`,
        [city]
      );
    } catch (dbErr: any) {
      console.warn("[IncidentSpecialist] DB query fallback to all cities:", dbErr?.message);
      dbIncidents = await query<any>(
        `SELECT id, public_reference, title, severity, status, city, 
                primary_department, operational_priority, location_text, 
                latitude, longitude, created_at 
         FROM incidents 
         ORDER BY created_at DESC 
         LIMIT 60`,
        []
      );
    }

    await recordToolExecution(task.id, {
      toolId: "incident.get_active_reports",
      agentId: "incident",
      parameters: { city, limit: 60 },
      resultPreview: `Retrieved ${dbIncidents.length} civic incidents from TiDB Cloud repository`,
      success: true,
      durationMs: Date.now() - dbStart,
    });

    // ─── Stage 2: Specific Text Triage (If query describes a specific incident) ───
    let analyzedSpecificReport: any = null;
    const isDescribingIncident =
      params.query.length > 25 &&
      !params.query.toLowerCase().startsWith("what") &&
      !params.query.toLowerCase().startsWith("analyse") &&
      !params.query.toLowerCase().startsWith("analyze") &&
      !params.query.toLowerCase().startsWith("give me");

    if (isDescribingIncident) {
      const triageStart = Date.now();
      try {
        const provider = new GroqIncidentAnalysisProvider();
        const analysis = await provider.analyze({
          text: params.query,
          locationContext: params.wardId,
        });
        analyzedSpecificReport = analysis.analysis;

        await recordToolExecution(task.id, {
          toolId: "incident.triage_text",
          agentId: "incident",
          parameters: { textLength: params.query.length },
          resultPreview: `Category: ${analyzedSpecificReport.mainCategory}, Severity: ${analyzedSpecificReport.severity?.level || "medium"} (${analyzedSpecificReport.severity?.score || 0}/100)`,
          success: true,
          durationMs: Date.now() - triageStart,
        });
      } catch (err: any) {
        console.warn("[IncidentSpecialist] Groq single-report analysis warning:", err?.message);
      }
    }

    // ─── Stage 3: Incident Aggregation & Pattern Detection ───
    let totalActive = dbIncidents.length;
    try {
      const countRows = await query<any>(
        "SELECT COUNT(*) as total FROM incidents WHERE city = ? AND status NOT IN ('RESOLVED', 'CLOSED')",
        [city]
      );
      if (countRows && countRows[0]?.total !== undefined) {
        totalActive = Number(countRows[0].total);
      }
    } catch {
      // Keep dbIncidents.length
    }

    let criticalCount = dbIncidents.filter((i) => i.severity === "CRITICAL" || i.operational_priority === "CRITICAL").length;
    try {
      const critRows = await query<any>(
        "SELECT COUNT(*) as total FROM incidents WHERE city = ? AND (severity = 'CRITICAL' OR operational_priority = 'CRITICAL')",
        [city]
      );
      if (critRows && critRows[0]?.total !== undefined) {
        criticalCount = Number(critRows[0].total);
      }
    } catch {
      // Keep in-memory count
    }

    const criticalIncidents = dbIncidents.filter((i) => i.severity === "CRITICAL" || i.operational_priority === "CRITICAL");
    const highIncidents = dbIncidents.filter((i) => i.severity === "HIGH" || i.operational_priority === "HIGH");

    // Department Breakdown
    const deptCount: Record<string, number> = {};
    for (const inc of dbIncidents) {
      const dept = inc.primary_department || "general_administration";
      deptCount[dept] = (deptCount[dept] || 0) + 1;
    }

    // Hotspot Location Breakdown
    const locationClusters: Record<string, number> = {};
    for (const inc of dbIncidents) {
      const loc = inc.location_text || (inc.title.includes("Kurla") ? "Kurla" : inc.title.includes("Hindmata") ? "Hindmata" : inc.title.includes("Sion") ? "Sion" : "General Urban Corridor");
      locationClusters[loc] = (locationClusters[loc] || 0) + 1;
    }

    const topHotspots = Object.entries(locationClusters)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);

    // ─── Stage 4: Synthesize Comprehensive Markdown Response ───
    let markdownContent = `### 📋 Incident Analysis & Civic Operations Intelligence (${city.toUpperCase()})

**Active Incident Overview:**
- **Total Registered Civic Incidents**: **${totalActive}** reports in database.
- **Critical Severity Reports**: **${criticalIncidents.length}** cases requiring immediate response.
- **High Operational Priority**: **${highIncidents.length}** cases assigned to emergency crews.

| Department | Active Incidents | Priority Focus |
|---|---|---|
${Object.entries(deptCount).slice(0, 6).map(([dept, count]) => `| **${dept.replace(/_/g, " ").toUpperCase()}** | ${count} | ${count > 5 ? "🔴 HIGH BACKLOG" : "🟡 MONITORING"} |`).join("\n")}
`;

    if (analyzedSpecificReport) {
      markdownContent += `
#### 🔍 Real-Time Triage for User Report
- **Category**: ${analyzedSpecificReport.mainCategory} (${analyzedSpecificReport.subcategory})
- **Calculated Severity**: **${analyzedSpecificReport.severity?.score}/100** (${analyzedSpecificReport.severity?.level?.toUpperCase()})
- **Primary Reason**: ${analyzedSpecificReport.severity?.reason}
- **Mandatory Departments**: ${analyzedSpecificReport.requiredDepartments?.map((d: any) => `\`${d.departmentType}\` (${d.reason})`).join(", ")}
${analyzedSpecificReport.mismatch ? `\n> ⚠️ **Routing Mismatch**: ${analyzedSpecificReport.mismatchReason}` : ""}
`;
    }

    if (criticalIncidents.length > 0) {
      markdownContent += `
#### 🚨 Top High-Priority Civic Incidents
${criticalIncidents.slice(0, 3).map((inc) => `- **[${inc.public_reference || inc.id.slice(0, 10)}] ${inc.title}**
  * Department: \`${inc.primary_department}\` | Severity: **${inc.severity}** | Registered: ${new Date(inc.created_at).toLocaleString()}`).join("\n")}
`;
    }

    markdownContent += `
#### 📍 Spatial Hotspot Clusters
${topHotspots.map(([loc, count]) => `- **${loc}**: ${count} clustered incidents (drainage blockages, localized flooding, road craters)`).join("\n")}

*Data Source: MCGM / BMC Civic Operations Database & 17-Department Automated Routing Engine.*`;

    // Structured Findings
    const findings: SpecialistAgentResult["findings"] = [];
    for (const inc of criticalIncidents.slice(0, 3)) {
      findings.push({
        title: `Critical Civic Incident: ${inc.public_reference || inc.id.slice(0, 8)}`,
        description: inc.title,
        severity: "CRITICAL",
        location: {
          name: inc.location_text || "Mumbai Municipal Area",
        },
        evidenceIds: [inc.public_reference || inc.id],
        confidence: 0.98,
      });
    }

    if (topHotspots.length > 0) {
      findings.push({
        title: "Spatial Incident Clustering Detected",
        description: `Multiple citizen reports cluster around ${topHotspots.map(([l, c]) => `${l} (${c} incidents)`).join(", ")}.`,
        severity: "HIGH",
        location: { name: topHotspots[0][0] },
        evidenceIds: ["TIDB-INCIDENTS-CLUSTER"],
        confidence: 0.94,
      });
    }

    const recommendations: SpecialistAgentResult["recommendations"] = [
      {
        title: "Emergency Field Crew Dispatch",
        description: "Dispatch standby municipal response vehicles to high-density incident clusters in Kurla and Sion.",
        department: "Disaster Management Cell",
        priority: "CRITICAL",
        approvalRequired: true,
      },
      {
        title: "Stormwater Drainage Pipe Clearing",
        description: "Clear reported clogged culverts and open manholes in Drainage Department queue.",
        department: "Storm Water Drains",
        priority: "HIGH",
        approvalRequired: false,
      },
      {
        title: "Inter-Departmental Escalation",
        description: "Escalate tree-fall and electrical wire incidents to BEST and Garden Department.",
        department: "Electrical & Garden Dept",
        priority: "HIGH",
        approvalRequired: false,
      },
    ];

    const dataSources: SpecialistAgentResult["dataSources"] = [
      {
        sourceId: "tidb-incidents-table",
        sourceName: "TiDB Cloud Serverless Civic Incidents Table",
        dataType: "Citizen & Field Officer Civic Incident Reports",
        retrievedAt: new Date().toISOString(),
        freshness: "FRESH",
        provenance: "LIVE",
      },
      {
        sourceId: "groq-17-dept-routing",
        sourceName: "Groq LLaMA 3.3 17-Department Operational Routing Engine",
        dataType: "Automated Civic Classification & Mismatch Detection",
        retrievedAt: new Date().toISOString(),
        freshness: "FRESH",
        provenance: "DERIVED",
      },
    ];

    const limitations = [
      "Incident records reflect citizen-submitted and field-reported grievances; unpopulated wards may have unrecorded issues.",
      "Severity scores are calibrated using deterministic municipal keywords and LLM multi-factor triage.",
    ];

    const specialistResult: SpecialistAgentResult = {
      taskId: task.id,
      agentId: "incident",
      agentName: "Incident Analysis Agent",
      status: "COMPLETED",
      summary: `Analyzed ${totalActive} civic incidents. ${criticalIncidents.length} critical issues identified across ${Object.keys(deptCount).length} municipal departments.`,
      content: markdownContent,
      findings,
      dataSources,
      recommendations,
      limitations,
      rawPayload: {
        totalActive,
        criticalCount: criticalIncidents.length,
        departmentBreakdown: deptCount,
        topHotspots,
        criticalIncidents: criticalIncidents.slice(0, 5),
      },
    };

    const completed = await completeTask(
      task.id,
      markdownContent.slice(0, 480),
      specialistResult
    );

    return {
      taskId: task.id,
      agentId: "incident",
      content: markdownContent,
      specialistResult,
      task: completed || task,
    };
  } catch (err: any) {
    const errorMsg = err?.message || String(err);
    const failed = await failTask(task.id, errorMsg);

    const fallbackResult: SpecialistAgentResult = {
      taskId: task.id,
      agentId: "incident",
      agentName: "Incident Analysis Agent",
      status: "FAILED",
      summary: "Incident analysis encountered an error.",
      content: `⚠️ **Incident Analysis Error**: ${errorMsg}`,
      findings: [],
      dataSources: [],
      recommendations: [],
      limitations: [errorMsg],
    };

    return {
      taskId: task.id,
      agentId: "incident",
      content: `⚠️ **Incident Analysis Error**: ${errorMsg}`,
      specialistResult: fallbackResult,
      task: failed || task,
    };
  }
}
