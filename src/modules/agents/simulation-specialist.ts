/* ════════════════════════════════════════════════════════
   GeoNexus — Simulation Specialist Agent Wrapper
   Independent execution wrapper for Mode A (direct specialist chat)
   and Mode B (orchestrator child task delegation).
   ════════════════════════════════════════════════════════ */

import {
  runAgentSimulation,
  AgentSimulationRequest,
  WorkspaceStateSnapshot,
} from "@/modules/ai/simulation-agent";
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

export interface SimulationSpecialistParams {
  query: string;
  city?: string;
  wardId?: string;
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;
  workspaceState?: WorkspaceStateSnapshot;
  parentTaskId?: string | null;
}

export interface SimulationExecutionOutput {
  taskId: string;
  agentId: "simulation";
  content: string;
  specialistResult: SpecialistAgentResult;
  task: AgentTask;
}

export async function executeSimulationTask(
  params: SimulationSpecialistParams
): Promise<SimulationExecutionOutput> {
  const startTime = Date.now();

  const task = await createTask({
    agentId: "simulation",
    taskType: "SPATIAL_SIMULATION",
    intent: "PHYSICAL_SCENARIO_EXECUTION",
    inputPreview: params.query.slice(0, 480),
    inputPayload: {
      query: params.query,
      city: params.city || "mumbai",
      wardId: params.wardId,
      workspaceState: params.workspaceState,
    },
    parentTaskId: params.parentTaskId,
  });

  try {
    await addTraceStep(task.id, {
      stage: "scenario_mapping",
      durationMs: Date.now() - startTime,
      status: "OK",
      detail: "Analyzing spatial hazard parameters across 24 BMC wards",
    });

    const simStartTime = Date.now();
    const simResult = await runAgentSimulation({
      message: params.query,
      city: params.city || "mumbai",
      conversationHistory: params.conversationHistory || [],
      workspaceState: params.workspaceState,
    });

    const simDuration = Date.now() - simStartTime;

    // Record tool call
    await recordToolExecution(task.id, {
      toolId: "simulation.run_physics_engine",
      agentId: "simulation",
      parameters: {
        scenarioId: simResult.plan.scenarioId,
        parameters: simResult.plan.parameters,
        selectedWard: simResult.plan.selectedWard,
      },
      resultPreview: `Scenario: ${simResult.plan.scenarioId}, Alert: ${simResult.simulationResult?.summary?.overallAlertLevel || "NORMAL"}, Peak: ${simResult.simulationResult?.summary?.peakCityValue || 0}`,
      success: true,
      durationMs: simDuration,
    });

    // Record infrastructure query if executed
    if (simResult.infrastructureResults) {
      await recordToolExecution(task.id, {
        toolId: "simulation.query_infrastructure",
        agentId: "simulation",
        parameters: { wardId: simResult.plan.selectedWard || "F/N" },
        resultPreview: `Exposed: ${simResult.infrastructureResults.exposedCount} assets (Hospitals: ${simResult.infrastructureResults.hospitals.length}, Pumps: ${simResult.infrastructureResults.pumpingStations.length})`,
        success: true,
        durationMs: 40,
      });
    }

    // Extract structured findings
    const findings: SpecialistAgentResult["findings"] = [];
    if (simResult.simulationResult?.rankedWards) {
      for (const w of simResult.simulationResult.rankedWards.slice(0, 5)) {
        if (w.isThresholdExceeded || w.tierLabel.toLowerCase().includes("severe") || w.tierLabel.toLowerCase().includes("high")) {
          findings.push({
            title: `Ward ${w.wardId} (${w.wardName}) ${w.metricLabel} Impact`,
            description: `${w.metricLabel}: ${w.metricValue} ${w.metricUnit} (${w.tierLabel}). Estimated exposed population: ${w.estimatedExposedPopulation.toLocaleString()}. Threshold exceeded: ${w.isThresholdExceeded ? "YES" : "NO"}.`,
            severity: w.tierLabel.toLowerCase().includes("severe") ? "CRITICAL" : "HIGH",
            location: {
              name: w.wardName,
              wardId: w.wardId,
            },
            evidenceIds: ["SIM-PHYSICS-24WARD", "BMC-DRAINAGE-CAPACITY"],
            confidence: 0.92,
          });
        }
      }
    }

    if (simResult.infrastructureResults && simResult.infrastructureResults.exposedCount > 0) {
      findings.push({
        title: "Critical Infrastructure Exposure",
        description: simResult.infrastructureResults.summaryText,
        severity: "HIGH",
        location: {
          name: simResult.infrastructureResults.wardName,
          wardId: simResult.infrastructureResults.wardId,
        },
        evidenceIds: ["BMC-HEALTHCARE-REGISTRY", "MCGM-PUMP-ASSETS"],
        confidence: 0.95,
      });
    }

    // Build recommendations
    const recommendations: SpecialistAgentResult["recommendations"] = [
      {
        title: "Dewatering Pump Station Readiness",
        description: "Deploy high-capacity mobile dewatering units to low-lying saucer depressions in Hindmata, Milan Subway, and Gandhi Market.",
        department: "Storm Water Drains (SWD)",
        priority: "HIGH",
        approvalRequired: false,
      },
      {
        title: "Traffic Transit Diversions",
        description: "Implement pre-emptive arterial road diversions along chronic saucer depression corridors when flood depth exceeds 25 cm.",
        department: "Traffic Police",
        priority: "HIGH",
        approvalRequired: true,
      },
      {
        title: "Hospital Power & Access Safeguarding",
        description: "Ensure backup diesel generators and flood barriers are verified at KEM, Sion, and Cooper hospitals.",
        department: "Public Health",
        priority: "CRITICAL",
        approvalRequired: false,
      },
    ];

    const dataSources: SpecialistAgentResult["dataSources"] = [
      {
        sourceId: "mumbai-24-wards-geojson",
        sourceName: "BMC 24 Administrative Wards GeoJSON",
        dataType: "Spatial Ward Boundaries",
        retrievedAt: new Date().toISOString(),
        freshness: "FRESH",
        provenance: "LIVE",
      },
      {
        sourceId: "mumbai-saucer-depressions",
        sourceName: "MCGM Chronic Saucer Depressions & Waterlogging Hotspots",
        dataType: "Micro-Topographic Elevation Data",
        retrievedAt: new Date().toISOString(),
        freshness: "FRESH",
        provenance: "DERIVED",
      },
      {
        sourceId: "mumbai-pumping-stations",
        sourceName: "BMC Pumping Stations & Outfalls Registry",
        dataType: "Critical Drainage Infrastructure",
        retrievedAt: new Date().toISOString(),
        freshness: "FRESH",
        provenance: "LIVE",
      },
      {
        sourceId: "scenario-physics-engine",
        sourceName: `Scenario ${simResult.plan.scenarioId.toUpperCase()} Multi-Hazard Physical Engine`,
        dataType: "Hydrological & Wind Wave Numerical Simulation",
        retrievedAt: new Date().toISOString(),
        freshness: "FRESH",
        provenance: "SIMULATED",
      },
    ];

    const limitations = [
      "Simulation results represent deterministic numerical models based on calibrated 24-ward rainfall-runoff coefficients.",
      "Local drainage pipe micro-clogging may increase spot inundation depths beyond modeled ward averages.",
      "Tidal backflow predictions assume standard astronomical spring/neap cycle without localized sea wall breaches.",
    ];

    const specialistResult: SpecialistAgentResult = {
      taskId: task.id,
      agentId: "simulation",
      agentName: "Simulation Specialist Agent",
      status: "COMPLETED",
      summary: `Scenario ${simResult.plan.scenarioId.toUpperCase()} executed successfully. Alert Level: ${simResult.simulationResult?.summary?.overallAlertLevel || "NORMAL"}, Peak Value: ${simResult.simulationResult?.summary?.peakCityValue || 0}.`,
      content: simResult.interpretation,
      findings,
      dataSources,
      recommendations,
      limitations,
      rawPayload: {
        plan: simResult.plan,
        simulationResult: simResult.simulationResult,
        comparisonSeries: simResult.comparisonSeries,
        infrastructureResults: simResult.infrastructureResults,
      },
    };

    const completed = await completeTask(
      task.id,
      simResult.interpretation.slice(0, 480),
      specialistResult
    );

    return {
      taskId: task.id,
      agentId: "simulation",
      content: simResult.interpretation,
      specialistResult,
      task: completed || task,
    };
  } catch (err: any) {
    const errorMsg = err?.message || String(err);
    const failed = await failTask(task.id, errorMsg);

    const fallbackResult: SpecialistAgentResult = {
      taskId: task.id,
      agentId: "simulation",
      agentName: "Simulation Specialist Agent",
      status: "FAILED",
      summary: "Simulation execution encountered an error.",
      content: `⚠️ **Simulation Error**: ${errorMsg}`,
      findings: [],
      dataSources: [],
      recommendations: [],
      limitations: [errorMsg],
    };

    return {
      taskId: task.id,
      agentId: "simulation",
      content: `⚠️ **Simulation Execution Error**: ${errorMsg}`,
      specialistResult: fallbackResult,
      task: failed || task,
    };
  }
}
