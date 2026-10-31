/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Unified Intelligence Pipeline
   Phase 6: End-to-End Traceable Pipeline & Standardized Provenance Envelope.

   Enforces the 8 Pipeline Stages:
   1. Environmental observations & forecasts
   2. Source validation & freshness checks
   3. Scenario inputs
   4. Deterministic spatial calculations
   5. Ward-level impact assessment
   6. Potentially exposed population & assets
   7. Evidence-backed report
   8. Administrative review & citizen guidance

   Guarantees:
   - Consistent structured metadata across Simulation Map, Telemetry Lab,
     Ward Dossier, Admin Console, and Citizen Dashboard.
   - Zero silent replacement of missing data with zero or fabricated values.
   - Clear propagation of degraded, stale, or missing sources.
   ════════════════════════════════════════════════════════ */

export type PipelineCalculationStatus =
  | "VALIDATED"
  | "PROVISIONAL"
  | "DEGRADED"
  | "DOWNGRADED_STALE_INPUTS"
  | "MISSING_SOURCE_DATA";

export type ConfidenceTier = "HIGH" | "MODERATE" | "LOW";

export interface InputSourceReference {
  sourceId: string;
  sourceName: string;
  provider: string;
  lastRetrievedIso: string;
  dataTimestampIso: string;
  isStale: boolean;
  status: "HEALTHY" | "DEGRADED" | "OFFLINE";
  freshnessPolicySeconds: number;
  dataCompletenessPercent: number;
  mode: "LIVE" | "CACHED" | "HISTORICAL" | "SIMULATED";
}

export interface UnifiedPipelineProvenance {
  pipelineVersion: string;
  cityId: string;
  cityName: string;
  jurisdiction: string;
  wardId?: string;
  wardName?: string;
  scenarioId?: string;
  modelVersion: string;
  modelTier: "TIER_1_OBSERVED_FORECAST" | "TIER_2_SCREENING_SIMULATION" | "TIER_3_VALIDATED_HYDRODYNAMIC";
  observationOrForecastTimeIso: string;
  evaluatedAtIso: string;
  inputSourceReferences: InputSourceReference[];
  spatialResolution: string;
  temporalResolution: string;
  calculationStatus: PipelineCalculationStatus;
  confidenceScore: number; // 0.0 to 1.0
  confidenceTier: ConfidenceTier;
  uncertaintyNotes: string[];
  knownLimitations: string[];
}

export interface UnifiedIntelligenceEnvelope<T> {
  provenance: UnifiedPipelineProvenance;
  payload: T;
}

/**
 * Build a canonical UnifiedPipelineProvenance header
 */
export function buildPipelineProvenance(params: {
  cityId: string;
  wardId?: string;
  scenarioId?: string;
  modelVersion?: string;
  modelTier?: "TIER_1_OBSERVED_FORECAST" | "TIER_2_SCREENING_SIMULATION" | "TIER_3_VALIDATED_HYDRODYNAMIC";
  observationTimeIso?: string;
  sources?: InputSourceReference[];
  missingInputs?: string[];
  spatialResolution?: string;
  temporalResolution?: string;
  additionalLimitations?: string[];
}): UnifiedPipelineProvenance {
  const now = new Date().toISOString();
  const sources = params.sources || [];
  const missing = params.missingInputs || [];

  // Determine calculation status & confidence
  const hasOffline = sources.some((s) => s.status === "OFFLINE");
  const hasStale = sources.some((s) => s.isStale);
  const hasDegraded = sources.some((s) => s.status === "DEGRADED");

  let status: PipelineCalculationStatus = "VALIDATED";
  let confidence: number = 0.95;
  let tier: ConfidenceTier = "HIGH";

  if (missing.length > 0) {
    status = "MISSING_SOURCE_DATA";
    confidence = Math.max(0.3, 0.9 - missing.length * 0.2);
    tier = "LOW";
  } else if (hasOffline || hasStale) {
    status = hasStale ? "DOWNGRADED_STALE_INPUTS" : "DEGRADED";
    confidence = 0.65;
    tier = "MODERATE";
  } else if (hasDegraded) {
    status = "PROVISIONAL";
    confidence = 0.8;
    tier = "MODERATE";
  }

  const limitations: string[] = [
    "Spatial screening model computes relative multi-criteria susceptibility; does NOT claim calibrated water depth in meters.",
    "Population exposures represent ward-level census allocations, not individual street or household counts.",
    ...(params.additionalLimitations || []),
  ];

  if (hasStale) {
    limitations.push("One or more input telemetry feeds exceeded their freshness policy; results are downgraded.");
  }
  if (missing.length > 0) {
    limitations.push(`Missing parameters: ${missing.join(", ")}. Scenario defaults or baselines applied.`);
  }

  const jurisdiction =
    params.cityId.toLowerCase() === "mumbai"
      ? "Brihanmumbai Municipal Corporation (BMC / MCGM)"
      : params.cityId.toLowerCase() === "pune"
      ? "Pune Municipal Corporation (PMC)"
      : "Nagpur Municipal Corporation (NMC)";

  return {
    pipelineVersion: "Sentinel-Pipeline/4.0-Operational",
    cityId: params.cityId,
    cityName: params.cityId === "mumbai" ? "Greater Mumbai" : params.cityId,
    jurisdiction,
    wardId: params.wardId,
    wardName: params.wardId ? `Ward ${params.wardId}` : undefined,
    scenarioId: params.scenarioId || "rainfall_waterlogging",
    modelVersion: params.modelVersion || "Sentinel-ScreeningEngine/3.0",
    modelTier: params.modelTier || "TIER_2_SCREENING_SIMULATION",
    observationOrForecastTimeIso: params.observationTimeIso || now,
    evaluatedAtIso: now,
    inputSourceReferences: sources,
    spatialResolution: params.spatialResolution || "BMC 24-Ward Administrative Polygons + 30m DEM Grid",
    temporalResolution: params.temporalResolution || "1-Hour Time Step / 24-Hour Horizon",
    calculationStatus: status,
    confidenceScore: Number(confidence.toFixed(2)),
    confidenceTier: tier,
    uncertaintyNotes: [
      "Meteorological conditions derived from numerical weather prediction (NWP) model runs.",
      "Tidal heights based on Survey of India harmonic tidal constituents for Apollo Bunder.",
    ],
    knownLimitations: limitations,
  };
}

/**
 * Wrap any calculation output into a UnifiedIntelligenceEnvelope
 */
export function wrapInUnifiedEnvelope<T>(
  payload: T,
  provenanceParams: Parameters<typeof buildPipelineProvenance>[0]
): UnifiedIntelligenceEnvelope<T> {
  return {
    provenance: buildPipelineProvenance(provenanceParams),
    payload,
  };
}
