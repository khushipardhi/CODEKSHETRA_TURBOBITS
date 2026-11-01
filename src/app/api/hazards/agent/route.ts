/* ════════════════════════════════════════════════════════
   GeoNexus — Agentic Simulation API Route
   POST /api/hazards/agent
   
   Accepts natural language simulation requests and returns
   structured results with AI-generated interpretation.
   ════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { runAgentSimulation, type AgentSimulationResponse } from "@/modules/ai/simulation-agent";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, city = "mumbai", conversationHistory, workspaceState } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing required 'message' field." },
        { status: 400 }
      );
    }

    if (city && city.toLowerCase() !== "mumbai") {
      return NextResponse.json(
        {
          success: false,
          error: `Agent simulation is currently only calibrated for 'mumbai'. City '${city}' is not supported.`,
          supportedCities: ["mumbai"],
        },
        { status: 400 }
      );
    }

    const result: AgentSimulationResponse = await runAgentSimulation({
      message,
      city,
      conversationHistory,
      workspaceState,
    });

    return NextResponse.json({
      success: true,
      data: {
        plan: result.plan,
        interpretation: result.interpretation,
        wardHighlights: result.wardHighlights,
        dataSummary: result.dataSummary,
        comparisonSeries: result.comparisonSeries,
        infrastructureResults: result.infrastructureResults,
        datasetResults: result.datasetResults,
        suggestedFollowUps: result.suggestedFollowUps,
        executionTimeMs: result.executionTimeMs,
        agentMode: result.agentMode,
        verifiedDatasets: result.verifiedDatasets,
        toolsExecuted: result.toolsExecuted,
        // Include simulation summary without the full GeoJSON payload for lighter responses
        simulationSummary: result.simulationResult
          ? {
              scenarioId: result.simulationResult.scenarioId,
              scenarioTitle: result.simulationResult.scenarioTitle,
              modelTier: result.simulationResult.modelTier,
              summary: result.simulationResult.summary,
              auditTrail: result.simulationResult.auditTrail,
              baselineMode: result.simulationResult.baselineMode,
              parametersApplied: result.simulationResult.parametersApplied,
            }
          : null,
        comparisonSummary: result.comparisonResult
          ? {
              scenarioId: result.comparisonResult.scenarioId,
              scenarioTitle: result.comparisonResult.scenarioTitle,
              modelTier: result.comparisonResult.modelTier,
              summary: result.comparisonResult.summary,
            }
          : null,
      },
      meta: {
        timestamp: new Date().toISOString(),
        agentVersion: "GeoNexus-SimulationAgent/2.0",
        engineVersion: "Sentinel-SimulationEngine/3.0",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[API /api/hazards/agent] Error:", message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: "/api/hazards/agent",
    version: "1.0",
    description: "GeoNexus Agentic Simulation Engine — Natural language to hazard simulation",
    usage: {
      method: "POST",
      body: {
        message: "string (required) — Natural language simulation request",
        city: "string (optional, default: 'mumbai')",
      },
    },
    examplePrompts: [
      "Simulate monsoon rainfall at 60mm/h for 4 hours",
      "What happens if 2005-level rainfall hits Mumbai today?",
      "Compare waterlogging vs coastal surge risks",
      "Which wards are most vulnerable to drainage blockage?",
      "How many flood hotspots does the platform track?",
      "Show me the air quality stagnation scenario for winter",
    ],
    capabilities: [
      "Natural language → simulation parameter extraction",
      "Multi-scenario comparison",
      "Historical event replay (26 July 2005, 8 July 2024)",
      "Data-aware responses from integrated Mumbai datasets",
      "AI-generated situational intelligence interpretation",
      "Contextual follow-up suggestions",
    ],
  });
}
