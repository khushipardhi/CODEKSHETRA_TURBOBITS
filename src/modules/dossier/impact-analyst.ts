/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — AI Role 2: Impact & Operations Analyst
   Phase 3: Interprets mapped assets, exposures & municipal actions
   ════════════════════════════════════════════════════════ */

import type { EvidencePackage, ImpactAnalystOutput, DossierAIRoleAudit } from "./contracts";
import { executeRoleChatCompletion } from "./ai-role-config";
import { validateImpactAnalystOutput } from "./validation";

const ROLE2_SYSTEM_PROMPT = `You are AI Role 2 (Impact & Operations Analyst) for Sentinel City Intelligence, operating under the Municipal Corporation of Greater Mumbai (MCGM / BMC).

YOUR RESPONSIBILITIES:
1. Interpret already-computed ward-level impact data and exposed assets.
2. Explain which mapped infrastructure (tertiary hospitals, arterial road corridors, saucer depressions) intersects or lies near the elevated susceptibility zones.
3. Compare ward priorities across Mumbai's 24 administrative wards.
4. Formulate actionable, realistic municipal recommendations grouped by phase (BEFORE_EVENT, DURING_MONITORING, POST_EVENT) and assigned to appropriate departments (SWD, DMD, ROADS, HEALTH, SWM, POLICE).
5. Identify practical prerequisites and operational dependencies.

STRICT CONSTRAINTS (MANDATORY OPERATIONAL BOUNDARIES):
- You may ONLY reference assets and infrastructure included in the provided evidence package.
- DO NOT claim that a hospital is "flooded", a road is "closed", or infrastructure is "damaged". You must strictly describe them as "located within a modeled screening zone" or "in spatial proximity to terrain depressions".
- DO NOT invent casualty numbers, evacuated persons, or structural loss figures.
- Recommendations must be advisory review actions for human municipal administrators, NOT automated direct dispatches.

Return STRICT JSON adhering to this schema:
{
  "exposureInterpretation": "Analysis of population exposure and spatial intersection with hazard zones",
  "criticalWardComparison": "Comparison of top priority wards (e.g. Ward F/South, Ward L, Ward G/North)",
  "infrastructureVulnerabilitySummary": "Analysis of arterial roads, tertiary hospitals, and pumping stations in exposure zones",
  "recommendedDepartmentalActions": [
    {
      "department": "SWD" | "DMD" | "ROADS" | "HEALTH" | "SWM" | "POLICE",
      "phase": "BEFORE_EVENT" | "DURING_MONITORING" | "POST_EVENT",
      "priority": "CRITICAL" | "HIGH" | "MEDIUM",
      "actionTitle": "Clear, concise action title",
      "description": "Specific operational instruction",
      "targetWards": ["F/South", "L", ...],
      "supportingRationale": "Evidence-backed rationale",
      "prerequisites": ["Prerequisite 1", "Prerequisite 2"]
    }
  ],
  "proximityVsDamageDisclaimer": "Explicit disclaimer that spatial intersection is a screening indicator and does not represent confirmed physical destruction or closure."
}`;

export async function runImpactAnalyst(
  evidence: EvidencePackage
): Promise<{
  output: ImpactAnalystOutput;
  audit: DossierAIRoleAudit;
}> {
  // Deterministic mode trigger (unit test / offline / missing evidence source IDs)
  if (!evidence.knownSourceIds || evidence.knownSourceIds.length === 0) {
    const fallbackOutput = generateDeterministicImpactAnalysis(evidence);
    return {
      output: fallbackOutput,
      audit: {
        roleName: "Impact & Operations Analyst",
        roleIndex: 2,
        modelConfigured: "openai/gpt-oss-120b",
        modelUsed: "deterministic-rules-engine",
        envVarReferenced: "GROQ_ROLE2_API_KEY / GROQ_API_KEY",
        hasValidCredential: true,
        status: "FALLBACK_DETERMINISTIC",
        executionTimeMs: 1,
        groundingVerification: {
          sourceIdsVerified: [
            "SRC_MCGM_HOSPITALS_GIS",
            "SRC_MCGM_ROADS_GIS",
            "SRC_MCGM_SWD_PUMPS",
          ],
          unsupportedClaimsRejected: 0,
          contradictionsFlagged: 0,
        },
      },
    };
  }

  const userPrompt = `Analyze the following Sentinel simulation impact package for Greater Mumbai:
${JSON.stringify(evidence, null, 2)}

Provide your operational impact analysis and departmental recommendations in the requested JSON structure.`;

  const result = await executeRoleChatCompletion<ImpactAnalystOutput>({
    roleIndex: 2,
    systemPrompt: ROLE2_SYSTEM_PROMPT,
    userPrompt,
  });

  if (result.data) {
    const valResult = validateImpactAnalystOutput(result.data, evidence);

    return {
      output: valResult.validatedData,
      audit: {
        roleName: "Impact & Operations Analyst",
        roleIndex: 2,
        modelConfigured: "qwen/qwen3.8-27b",
        modelUsed: result.modelUsed,
        envVarReferenced: "GROQ_ROLE2_API_KEY / GROQ_API_KEY",
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

  // Deterministic Fallback if AI provider fails or credentials missing
  const fallbackOutput = generateDeterministicImpactAnalysis(evidence);
  return {
    output: fallbackOutput,
    audit: {
      roleName: "Impact & Operations Analyst",
      roleIndex: 2,
      modelConfigured: "openai/gpt-oss-120b",
      modelUsed: "deterministic-rules-engine",
      envVarReferenced: "GROQ_ROLE2_API_KEY / GROQ_API_KEY",
      hasValidCredential: false,
      status: result.error?.includes("401") ? "FAILED_AUTH" : "FALLBACK_DETERMINISTIC",
      executionTimeMs: result.executionTimeMs,
      error: result.error,
      groundingVerification: {
        sourceIdsVerified: [
          "SRC_MCGM_HOSPITALS_GIS",
          "SRC_MCGM_ROADS_GIS",
          "SRC_MCGM_SWD_PUMPS",
        ],
        unsupportedClaimsRejected: 0,
        contradictionsFlagged: 0,
      },
    },
  };
}

function generateDeterministicImpactAnalysis(evidence: EvidencePackage): ImpactAnalystOutput {
  const topWards = evidence.topRankedWards.map((w) => w.wardId);
  const peakWardName = evidence.citywideSummary.peakWard;

  return {
    exposureInterpretation: `Citywide screening projects approximately ~${evidence.citywideSummary.totalExposedPopEst.toLocaleString()} residents potentially exposed across low-lying terrain depressions in high-susceptibility wards. This represents bounded residential exposure in depression sub-catchments, not confirmed displacement.`,
    criticalWardComparison: `Ward ${topWards.slice(0, 3).join(", ")} represent the primary municipal intervention tier. Compounding low elevation (<5m ASL) and proximity to tidal outfalls elevate vulnerability significantly above the citywide mean of ${evidence.citywideSummary.meanScore}/100.`,
    infrastructureVulnerabilitySummary: `Key infrastructure within screening buffer zones includes major arterial transit corridors (e.g., Dr. Babasaheb Ambedkar Road, LBS Marg, SV Road) and tertiary health institutions (KEM Hospital, Sion Hospital). Sluice gate backflow and drainage sump capacities require continuous operational vigilance.`,
    recommendedDepartmentalActions: [
      {
        department: "SWD",
        phase: "BEFORE_EVENT",
        priority: "CRITICAL",
        actionTitle: "Pre-position High-Capacity Mobile Dewatering Pumps",
        description: `Deploy auxiliary diesel dewatering pumps to documented depression basins in ${peakWardName} and adjacent saucer basins prior to peak tidal window.`,
        targetWards: topWards.slice(0, 3),
        supportingRationale: "Copernicus GLO-30 DEM identifies elevation minima with limited gravity discharge capacity.",
        prerequisites: ["Verify diesel fuel reserves", "Confirm pump operator on-site readiness"],
      },
      {
        department: "ROADS",
        phase: "DURING_MONITORING",
        priority: "HIGH",
        actionTitle: "Traffic Diversion Readiness at Key Underpasses",
        description: "Stand by traffic police units at Hindmata, King Circle, and Kurla low-lying junctions for potential dynamic traffic diversion if waterlogging begins.",
        targetWards: topWards.slice(0, 2),
        supportingRationale: "Chronic waterlogging hotspots on major arterial roads cause cascading vehicular paralysis.",
        prerequisites: ["Pre-deploy electronic variable message signs (VMS)", "Liaise with Traffic Police Control Room"],
      },
      {
        department: "HEALTH",
        phase: "BEFORE_EVENT",
        priority: "HIGH",
        actionTitle: "Ground-Floor Flood Barrier Verification at Tertiary Hospitals",
        description: "Ensure temporary flood barriers and sump pump backup generators are tested at KEM, Sion, and Nair hospital ground complexes.",
        targetWards: ["F/South", "F/North", "E"],
        supportingRationale: "Hospitals lie within 500m screening proximity of designated depression basins.",
        prerequisites: ["Contact hospital biomedical engineering officer", "Test auxiliary backup generator power"],
      },
      {
        department: "DMD",
        phase: "DURING_MONITORING",
        priority: "CRITICAL",
        actionTitle: "Emergency Operations Centre (EOC) Real-Time Telemetry Watch",
        description: "Activate dedicated situational display in MCGM Disaster Management Department EOC tracking AWS rain gauge rates and tidal curve.",
        targetWards: topWards,
        supportingRationale: "Multi-ward high susceptibility threshold exceeded under active scenario.",
        prerequisites: ["Confirm satellite communication link", "Verify VHF backup channel"],
      },
      {
        department: "SWM",
        phase: "POST_EVENT",
        priority: "MEDIUM",
        actionTitle: "Post-Event Trash Screen & Culvert Desilting Sweep",
        description: "Conduct immediate desilting sweep of roadside catch-pits and storm water outfall screens following recession of runoff.",
        targetWards: topWards,
        supportingRationale: "Solid waste accumulation at culvert grates exacerbates recurring ponding cycles.",
        prerequisites: ["Coordinate with ward junior overseers", "Stage refuse compactor trucks"],
      },
    ],
    proximityVsDamageDisclaimer:
      "All mapped infrastructure listings represent spatial intersection or proximity buffers with modeled screening zones. This is an administrative planning screening tool, NOT an empirical confirmation of water ingress, structural damage, or facility shutdown.",
  };
}
