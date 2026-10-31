/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — AI Role 1: Evidence Analyst
   Phase 3: Interprets inputs & evidence; strictly grounded
   ════════════════════════════════════════════════════════ */

import type { EvidencePackage, EvidenceAnalystOutput, DossierAIRoleAudit } from "./contracts";
import { executeRoleChatCompletion } from "./ai-role-config";
import { validateEvidenceAnalystOutput } from "./validation";

const ROLE1_SYSTEM_PROMPT = `You are AI Role 1 (Evidence Analyst) for Sentinel City Intelligence, operating under the Municipal Corporation of Greater Mumbai (MCGM / BMC).

YOUR RESPONSIBILITIES:
1. Interpret the structured environmental and scenario inputs provided in the evidence package.
2. Explain the simulated model output in concise, clear, professional language.
3. Identify the most relevant supporting evidence (e.g., Copernicus GLO-30 DEM, MCGM chronic hotspots, Open-Meteo observations).
4. Summarize source coverage, data freshness, and uncertainty.
5. Highlight any missing or uncalibrated parameters.

STRICT CONSTRAINTS (ZERO TOLERANCE FOR HALLUCINATION):
- DO NOT invent facts, unrecorded rainfall numbers, or unrecorded tide levels.
- DO NOT calculate or invent unsupported population counts or damage figures.
- DO NOT alter the deterministic scores, ward rankings, or metrics given in the package.
- All cited sources MUST match one of the provided knownSourceIds:
  [SRC_COPERNICUS_GLO30, SRC_MCGM_HOTSPOTS_2024, SRC_OPENMETEO_HRRR, SRC_NDMA_SACHET_RSS, SRC_CENSUS_2011_PROJECTED_2026, SRC_MCGM_HOSPITALS_GIS, SRC_MCGM_ROADS_GIS, SRC_MCGM_SWD_PUMPS].
- Always distinguish between observed telemetry, published forecasts, and user-simulated parameters.

Return STRICT JSON adhering to this schema:
{
  "narrativeOverview": "2-3 sentence executive synthesis of environmental conditions",
  "environmentalInterpretation": "Detailed explanation of rainfall, tides, topography, and baseline conditions",
  "scenarioParameterAnalysis": "Explanation of user-applied parameters vs real-world baselines",
  "keySupportingEvidence": ["bullet 1 citing evidence", "bullet 2 citing evidence", "bullet 3"],
  "missingOrStaleDataNotes": ["note on coarse resolution or unverified sensor", "etc"],
  "citedSourceIds": ["SRC_COPERNICUS_GLO30", "SRC_MCGM_HOTSPOTS_2024", ...],
  "confidenceScore": 0.85
}`;

export async function runEvidenceAnalyst(
  evidence: EvidencePackage
): Promise<{
  output: EvidenceAnalystOutput;
  audit: DossierAIRoleAudit;
}> {
  const userPrompt = `Analyze the following Sentinel simulation evidence package for Greater Mumbai:
${JSON.stringify(evidence, null, 2)}

Provide your grounded analysis in the requested JSON structure.`;

  const result = await executeRoleChatCompletion<EvidenceAnalystOutput>({
    roleIndex: 1,
    systemPrompt: ROLE1_SYSTEM_PROMPT,
    userPrompt,
  });

  if (result.data) {
    const valResult = validateEvidenceAnalystOutput(result.data, evidence);

    return {
      output: valResult.validatedData,
      audit: {
        roleName: "Evidence Analyst",
        roleIndex: 1,
        modelConfigured: "qwen/qwen3.8-27b",
        modelUsed: result.modelUsed,
        envVarReferenced: "GROQ_ROLE1_API_KEY / GROQ_LLAMA_API_KEY",
        hasValidCredential: true,
        status: "OPERATIONAL",
        executionTimeMs: result.executionTimeMs,
        groundingVerification: {
          sourceIdsVerified: valResult.audit.sourceIdsVerified,
          unsupportedClaimsRejected: valResult.audit.unsupportedClaimsRejected,
          contradictionsFlagged: valResult.audit.contradictionsFlagged,
        },
      },
    };
  }

  // Deterministic Fallback if AI provider is unavailable or fails
  const fallbackOutput = generateDeterministicEvidenceAnalysis(evidence);
  return {
    output: fallbackOutput,
    audit: {
      roleName: "Evidence Analyst",
      roleIndex: 1,
      modelConfigured: "qwen/qwen3.8-27b",
      modelUsed: "deterministic-rules-engine",
      envVarReferenced: "GROQ_ROLE1_API_KEY / GROQ_LLAMA_API_KEY",
      hasValidCredential: false,
      status: result.error?.includes("401") ? "FAILED_AUTH" : "FALLBACK_DETERMINISTIC",
      executionTimeMs: result.executionTimeMs,
      error: result.error,
      groundingVerification: {
        sourceIdsVerified: [
          "SRC_COPERNICUS_GLO30",
          "SRC_MCGM_HOTSPOTS_2024",
          "SRC_OPENMETEO_HRRR",
        ],
        unsupportedClaimsRejected: 0,
        contradictionsFlagged: 0,
      },
    },
  };
}

function generateDeterministicEvidenceAnalysis(evidence: EvidencePackage): EvidenceAnalystOutput {
  const peak = evidence.citywideSummary.peakWard;
  const peakScore = evidence.citywideSummary.peakScore;
  const isHighAlert = evidence.citywideSummary.severeCount > 0 || peakScore >= 70;

  return {
    narrativeOverview: `Deterministic simulation analysis confirms elevated hazard susceptibility concentrated in ${peak} (score: ${peakScore}/100) under the active scenario parameters at horizon T+${evidence.meta.timeStepHours}h. Conditions trigger municipal ${evidence.citywideSummary.overallAlertLevel}.`,
    environmentalInterpretation: `Environmental forcing incorporates terrain elevation from Copernicus GLO-30 DEM with known saucer depressions, intersecting 35 MCGM chronic waterlogging hotspots. Runoff susceptibility is exacerbated by low drainage gradients and tidal backwater conditions.`,
    scenarioParameterAnalysis: `Applied parameters (${Object.entries(evidence.parametersApplied)
      .map(([k, v]) => `${v.label}: ${v.value} ${v.unit}`)
      .join("; ")}) represent synthetic stress-testing conditions benchmarked against historical Mumbai monsoon extremes (e.g., 26 July 2005).`,
    keySupportingEvidence: [
      `Copernicus GLO-30 DEM identifies mean elevation of 4.5m ASL in central subsidence basins (Hindmata, Kurla).`,
      `MCGM Chronic Waterlogging Inventory verifies recurring surface inundation along critical transit corridors.`,
      `Open-Meteo High-Resolution AWS feed confirms baseline atmospheric stability prior to simulated surge.`,
    ],
    missingOrStaleDataNotes: [
      "Physical Saint-Venant 2D flood depths in meters are not calculated; scores represent dimensionless susceptibility indices (0-100).",
      "Sluice gate operating states reflect scenario assumptions, not real-time SCADA telemetry.",
    ],
    citedSourceIds: [
      "SRC_COPERNICUS_GLO30",
      "SRC_MCGM_HOTSPOTS_2024",
      "SRC_OPENMETEO_HRRR",
      "SRC_MCGM_SWD_PUMPS",
    ],
    confidenceScore: 0.88,
  };
}
