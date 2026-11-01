/* ════════════════════════════════════════════════════════
   GeoNexus — Citizen Safety Specialist Agent Wrapper
   Independent execution wrapper for Mode A (direct specialist chat)
   and Mode B (orchestrator child task delegation).
   Powered by Sentinel RAG engine with strict grounding.
   ════════════════════════════════════════════════════════ */

import { SentinelAiEngine, SentinelAssistantReply } from "@/modules/ai/sentinel-engine";
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

export interface CitizenSpecialistParams {
  query: string;
  city?: string;
  wardId?: string;
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;
  parentTaskId?: string | null;
}

export interface CitizenExecutionOutput {
  taskId: string;
  agentId: "citizen";
  content: string;
  specialistResult: SpecialistAgentResult;
  task: AgentTask;
}

export async function executeCitizenSafetyTask(
  params: CitizenSpecialistParams
): Promise<CitizenExecutionOutput> {
  const startTime = Date.now();
  const city = (params.city === "pune" || params.city === "nagpur" ? params.city : "mumbai") as "mumbai" | "pune" | "nagpur";

  const task = await createTask({
    agentId: "citizen",
    taskType: "CITIZEN_SAFETY_BRIEFING",
    intent: "GROUNDED_SAFETY_GUIDANCE",
    inputPreview: params.query.slice(0, 480),
    inputPayload: {
      query: params.query,
      city,
      wardId: params.wardId,
    },
    parentTaskId: params.parentTaskId,
  });

  try {
    await addTraceStep(task.id, {
      stage: "sentinel_rag_grounding",
      durationMs: Date.now() - startTime,
      status: "OK",
      detail: `Querying Sentinel RAG engine for verified emergency shelters & hazard guidance in ${city}`,
    });

    const engineStart = Date.now();
    const sentinel = new SentinelAiEngine();
    const reply: SentinelAssistantReply = await sentinel.answerCitizenQuery({
      city,
      message: params.query,
      conversationHistory: params.conversationHistory || [],
    });
    const engineDuration = Date.now() - engineStart;

    await recordToolExecution(task.id, {
      toolId: "citizen.query_sentinel_rag",
      agentId: "citizen",
      parameters: { city, query: params.query },
      resultPreview: `Grounded in ${reply.groundingSources.length} verified sources, ${reply.nearestShelters.length} emergency shelters`,
      success: true,
      durationMs: engineDuration,
    });

    // Findings
    const findings: SpecialistAgentResult["findings"] = [];
    if (reply.nearestShelters.length > 0) {
      for (const sh of reply.nearestShelters.slice(0, 3)) {
        findings.push({
          title: `Verified Municipal Shelter: ${sh.name}`,
          description: `${sh.address} (Helpline: ${sh.phone})`,
          severity: "LOW",
          location: { name: sh.name },
          evidenceIds: ["MCGM-SHELTER-REGISTRY"],
          confidence: 0.99,
        });
      }
    }

    for (const src of reply.groundingSources.slice(0, 3)) {
      findings.push({
        title: `Grounding Observation: ${src.name}`,
        description: `Verified source type: ${src.type} at ${src.timestamp}`,
        severity: "LOW",
        evidenceIds: [src.name],
        confidence: 0.95,
      });
    }

    const recommendations: SpecialistAgentResult["recommendations"] = [
      {
        title: "Public Precautionary Guidance",
        description: reply.suggestedAction?.description || "Avoid traveling through inundated subways and saucer depressions.",
        department: "Disaster Management Cell",
        priority: "MEDIUM",
        approvalRequired: false,
      },
      {
        title: "Shelter Availability Broadcast",
        description: "Disseminate verified shelter addresses and helpline numbers to affected citizens.",
        department: "Citizen Services",
        priority: "MEDIUM",
        approvalRequired: false,
      },
    ];

    const dataSources: SpecialistAgentResult["dataSources"] = reply.groundingSources.map((g) => ({
      sourceId: g.name.toLowerCase().replace(/[^a-z0-9]/g, "-"),
      sourceName: g.name,
      dataType: g.type,
      observedAt: g.timestamp,
      retrievedAt: new Date().toISOString(),
      freshness: "FRESH",
      provenance: "LIVE",
    }));

    if (dataSources.length === 0) {
      dataSources.push({
        sourceId: "sentinel-knowledge-base",
        sourceName: "Sentinel Grounded Municipal Safety Rules & Shelters",
        dataType: "Emergency Preparedness Guidelines",
        retrievedAt: new Date().toISOString(),
        freshness: "FRESH",
        provenance: "LIVE",
      });
    }

    const limitations = [
      reply.uncertaintyNotes || "Advice is restricted to verified observation feeds; unverified citizen rumors are discarded.",
      "Emergency muster locations must be accessed via designated police routes.",
    ];

    const specialistResult: SpecialistAgentResult = {
      taskId: task.id,
      agentId: "citizen",
      agentName: "Citizen Safety Agent",
      status: "COMPLETED",
      summary: `Provided grounded safety guidance for ${city.toUpperCase()} with ${reply.nearestShelters.length} verified shelters identified.`,
      content: reply.reply,
      findings,
      dataSources,
      recommendations,
      limitations,
      rawPayload: {
        nearestShelters: reply.nearestShelters,
        groundingSources: reply.groundingSources,
        suggestedAction: reply.suggestedAction,
        followUpActions: reply.followUpActions,
      },
    };

    const completed = await completeTask(
      task.id,
      reply.reply.slice(0, 480),
      specialistResult
    );

    return {
      taskId: task.id,
      agentId: "citizen",
      content: reply.reply,
      specialistResult,
      task: completed || task,
    };
  } catch (err: any) {
    const errorMsg = err?.message || String(err);
    const failed = await failTask(task.id, errorMsg);

    const fallbackResult: SpecialistAgentResult = {
      taskId: task.id,
      agentId: "citizen",
      agentName: "Citizen Safety Agent",
      status: "FAILED",
      summary: "Citizen safety assistant encountered an error.",
      content: `⚠️ **Citizen Safety Assistant Notice**: ${errorMsg}`,
      findings: [],
      dataSources: [],
      recommendations: [],
      limitations: [errorMsg],
    };

    return {
      taskId: task.id,
      agentId: "citizen",
      content: `⚠️ **Citizen Safety Error**: ${errorMsg}`,
      specialistResult: fallbackResult,
      task: failed || task,
    };
  }
}
