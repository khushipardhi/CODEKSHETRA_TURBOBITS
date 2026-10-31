/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Canonical Simulation Dossier Contracts
   Phase 3 Enterprise Edition: Evidence-Grounded Municipal Intelligence
   ════════════════════════════════════════════════════════ */

import type { ModelReadinessTier } from "../simulation/contracts";

export const DOSSIER_SCHEMA_VERSION = "3.0.0";
export const MUNICIPAL_AUTHORITY = "Municipal Corporation of Greater Mumbai (MCGM / BMC)";
export const JURISDICTION_SCOPE = "Greater Mumbai (24 Administrative Wards)";

export type AIRoleStatus =
  | "OPERATIONAL"
  | "PARTIAL"
  | "FALLBACK_DETERMINISTIC"
  | "DISABLED"
  | "FAILED_AUTH"
  | "FAILED_TIMEOUT"
  | "FAILED_VALIDATION";

export type InputProvenanceType =
  | "LIVE_OBSERVATION"
  | "PUBLISHED_FORECAST"
  | "HISTORICAL_BENCHMARK"
  | "USER_SIMULATION"
  | "DERIVED_DETERMINISTIC"
  | "UNAVAILABLE";

export interface DossierInputItem {
  id: string;
  name: string;
  category: InputProvenanceType;
  value: string | number;
  unit: string;
  sourceName: string;
  sourceUrl?: string;
  retrievedAt: string;
  spatialResolution: string;
  temporalCoverage: string;
  status: "ACTIVE" | "CACHED" | "SIMULATED" | "UNAVAILABLE";
  notes?: string;
}

export interface DossierExecutiveSummary {
  city: string;
  municipalAuthority: string;
  scenarioId: string;
  scenarioTitle: string;
  scenarioType: string;
  analysisStartTimeIso: string;
  selectedHorizonHours: number;
  timeZone: string; // e.g. "IST (UTC+05:30)"
  modelTier: ModelReadinessTier;
  modelVersion: string;
  overallAlertLevel: "GREEN_NORMAL" | "YELLOW_WATCH" | "ORANGE_ALERT" | "RED_WARNING";
  keyFindings: string[];
  highestPriorityWards: {
    rank: number;
    wardId: string;
    wardName: string;
    score: number;
    unit: string;
    tier: string;
    primaryTrigger: string;
  }[];
  mainPotentiallyAffectedAssets: {
    category: string;
    count: number;
    prominentItems: string[];
    caveat: string;
  }[];
  criticalLimitations: string[];
  immediateReviewPriorities: string[];
}

export interface DossierConditionsAndInputs {
  liveObservations: DossierInputItem[];
  publishedForecasts: DossierInputItem[];
  historicalReferences: DossierInputItem[];
  userControlledInputs: DossierInputItem[];
  derivedVariables: DossierInputItem[];
  missingOrStaleInputs: {
    variable: string;
    expectedSource: string;
    impactOnModel: string;
    fallbackUsed: string;
  }[];
}

export interface DossierMethodologyAndCalculation {
  modelName: string;
  modelVersion: string;
  readinessTier: ModelReadinessTier;
  formulaLatex: string;
  formulaPlain: string;
  variableDefinitions: {
    symbol: string;
    name: string;
    unit: string;
    normalizationMethod: string;
    effectiveWeight: string;
    weightRationale: string;
  }[];
  baselineDefinition: string;
  spatialResolution: string;
  temporalResolution: string;
  coreAssumptions: string[];
  validationStatus: string;
  operationalThresholds: {
    tier: string;
    range: string;
    color: string;
    recommendedAdministrativePosture: string;
  }[];
  selectedWardCalculationTrace?: {
    wardId: string;
    wardName: string;
    stepByStepCalculations: string[];
    finalScore: number;
    baselineComparison: string;
  };
}

export interface DossierCitywideAssessment {
  totalWardsEvaluated: number;
  totalWardsExcluded: number;
  dataCompletenessPct: number;
  tierDistribution: {
    severeCount: number;
    highCount: number;
    moderateCount: number;
    lowCount: number;
  };
  citywideMeanScore: number;
  citywidePeakScore: number;
  peakWard: {
    wardId: string;
    wardName: string;
    score: number;
  };
  totalEstimatedExposedPopulation: number;
  populationExposureMethodology: string;
  assetExposureSummary: {
    hospitalsInProximityCount: number;
    arterialRoadCorridorsCount: number;
    lowLyingDepressionsCount: number;
  };
  verifiedIncidentsAndObservations: {
    chronicWaterloggingHotspotsEvaluated: number;
    activeNdmaBulletinsCount: number;
  };
  coverageGapsAndUncertainties: string[];
}

export interface DossierWardDetailedAnalysis {
  wardId: string;
  wardName: string;
  zone: string;
  geographicAreaSqKm: number;
  elevationMeanM: number;
  isCoastal: boolean;
  waterwaysAndBasins: string[];
  saucerDepressions: {
    name: string;
    elevationMinM: number;
    areaSqM: number;
    source: string;
  }[];
  score: number;
  metricUnit: string;
  severityTier: string;
  baselineValue: number;
  deltaPercent: number;
  calculationTrace: string;
  historicalHotspots: string[];
  potentiallyExposedHospitals: {
    name: string;
    type: string;
    proximityNote: string;
    address?: string;
  }[];
  potentiallyExposedRoads: {
    name: string;
    highwayType: string;
    lanes: number;
  }[];
  drainageAssets: {
    pumpingStations: string[];
    outfallGates: string[];
  };
  populationEstimateTotal: number;
  estimatedExposedPopulation: number;
  exposureMethodologyAndCaveat: string;
  dataCompletenessAndUncertainty: string[];
  suggestedAdministrativeActions: string[];
}

export interface MunicipalActionItem {
  id: string;
  phase: "BEFORE_EVENT" | "DURING_MONITORING" | "POST_EVENT";
  departmentCode: "SWD" | "DMD" | "ROADS" | "HEALTH" | "SWM" | "POLICE";
  departmentName: string;
  title: string;
  description: string;
  priority: "CRITICAL" | "HIGH" | "MEDIUM";
  targetWards: string[];
  supportingEvidence: string;
  prerequisites: string[];
  suggestedFollowUp: string;
  nonDispatchDisclaimer: string;
}

export interface DossierAIRoleAudit {
  roleName: "Evidence Analyst" | "Impact & Operations Analyst" | "Report Editor & Quality Reviewer";
  roleIndex: 1 | 2 | 3;
  modelConfigured: string;
  modelUsed?: string;
  envVarReferenced: string;
  hasValidCredential: boolean;
  status: AIRoleStatus;
  executionTimeMs: number;
  error?: string;
  groundingVerification: {
    sourceIdsVerified: string[];
    unsupportedClaimsRejected: number;
    contradictionsFlagged: number;
  };
}

export interface DossierLimitationsAndGovernance {
  sourceReferences: {
    id: string;
    title: string;
    publisher: string;
    licenseOrProvenance: string;
    retrievalDate: string;
  }[];
  aiGovernance: {
    role1EvidenceAnalyst: DossierAIRoleAudit;
    role2ImpactAnalyst: DossierAIRoleAudit;
    role3ReportEditor: DossierAIRoleAudit;
    orchestrationDurationMs: number;
    overallAIState: "ALL_OPERATIONAL" | "PARTIAL_DEGRADED" | "DETERMINISTIC_FALLBACK";
  };
  knownDataGaps: string[];
  scientificDisclaimers: string[];
  administrativeDisclaimer: string;
}

export interface CanonicalSimulationDossier {
  dossierId: string;
  generatedAtIso: string;
  schemaVersion: string;
  scenarioId: string;
  timeStepHours: number;
  selectedWardId?: string;
  parametersApplied?: Record<string, number>;
  executiveSummary: DossierExecutiveSummary;
  conditionsAndInputs: DossierConditionsAndInputs;
  methodologyAndCalculation: DossierMethodologyAndCalculation;
  citywideAssessment: DossierCitywideAssessment;
  wardDetailedAnalysis?: DossierWardDetailedAnalysis;
  rankedWardsAnalysis: DossierWardDetailedAnalysis[];
  recommendedActions: MunicipalActionItem[];
  limitationsAndGovernance: DossierLimitationsAndGovernance;
  rawInputHash: string;
  // Phase 6 Operational Additions
  consequenceMatrix?: any;
  wardConsequenceMatrix?: any;
  wardDecisionSummary?: any;
  pipelineProvenance?: any;
}

/** Minimal typed evidence package passed to AI roles */
export interface EvidencePackage {
  meta: {
    scenarioId: string;
    scenarioTitle: string;
    timeStepHours: number;
    timestampIso: string;
    city: string;
    selectedWardId?: string;
  };
  parametersApplied: Record<string, { value: number; unit: string; label: string }>;
  citywideSummary: {
    totalWards: number;
    meanScore: number;
    peakScore: number;
    peakWard: string;
    overallAlertLevel: string;
    totalExposedPopEst: number;
    severeCount: number;
  };
  topRankedWards: {
    rank: number;
    wardId: string;
    wardName: string;
    zone: string;
    score: number;
    unit: string;
    tier: string;
    deltaVsBaseline: number;
    elevationMeanM: number;
    isCoastal: boolean;
    chronicHotspots: string[];
    pumpingStations: string[];
    hospitalsCount: number;
    hospitalNames: string[];
    roadsCount: number;
    roadNames: string[];
    depressionsCount: number;
    depressionNames: string[];
    populationEst: number;
    estimatedExposedPopulation: number;
  }[];
  selectedWardDetail?: {
    wardId: string;
    wardName: string;
    zone: string;
    score: number;
    baselineValue: number;
    deltaPercent: number;
    elevationMeanM: number;
    isCoastal: boolean;
    drainageBasin: string;
    calculationTrace: string;
    hospitals: { name: string; type: string; address?: string }[];
    roads: { name: string; highwayType: string; lanes: number }[];
    depressions: { name: string; elevationMeanM: number; areaSqM: number; source: string }[];
    hotspots: string[];
    pumpingStations: string[];
    populationEst: number;
    estimatedExposedPopulation: number;
  };
  knownSourceIds: string[];
}

/** Role 1 Output Contract */
export interface EvidenceAnalystOutput {
  narrativeOverview: string;
  environmentalInterpretation: string;
  scenarioParameterAnalysis: string;
  keySupportingEvidence: string[];
  missingOrStaleDataNotes: string[];
  citedSourceIds: string[];
  confidenceScore: number; // 0 to 1
}

/** Role 2 Output Contract */
export interface ImpactAnalystOutput {
  exposureInterpretation: string;
  criticalWardComparison: string;
  infrastructureVulnerabilitySummary: string;
  recommendedDepartmentalActions: {
    department: "SWD" | "DMD" | "ROADS" | "HEALTH" | "SWM" | "POLICE";
    phase: "BEFORE_EVENT" | "DURING_MONITORING" | "POST_EVENT";
    priority: "CRITICAL" | "HIGH" | "MEDIUM";
    actionTitle: string;
    description: string;
    targetWards: string[];
    supportingRationale: string;
    prerequisites: string[];
  }[];
  proximityVsDamageDisclaimer: string;
}

/** Role 3 Output Contract */
export interface ReportEditorOutput {
  executiveSummarySynthesis: string;
  editorialCommentary: string;
  contradictionFlags: string[];
  unsupportedClaimsRemoved: string[];
  verifiedKeyFindings: string[];
  editorialReviewPassed: boolean;
}
