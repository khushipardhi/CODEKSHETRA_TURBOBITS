/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — PDF Report Contracts
   Phase 4: Structured Data Contracts for Publication-Grade PDFs
   ════════════════════════════════════════════════════════ */

import type { ModelReadinessTier } from "../simulation/contracts";
import type { CanonicalSimulationDossier } from "../dossier/contracts";

export interface PDFGenerationOptions {
  format?: "A4" | "Letter";
  landscape?: boolean;
  printBackground?: boolean;
  margin?: {
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
  };
  displayHeaderFooter?: boolean;
  headerTemplate?: string;
  footerTemplate?: string;
}

export interface SimulationReportDocument {
  documentId: string;
  dossierId: string;
  classification: "OFFICIAL_MUNICIPAL_ADVISORY" | "INTERNAL_SCREENING_ONLY";
  city: string;
  jurisdiction: string;
  municipalAuthority: string;
  scenarioId: string;
  scenarioTitle: string;
  scenarioType: string;
  modelTier: ModelReadinessTier;
  modelVersion: string;
  generatedAtIso: string;
  selectedHorizonHours: number;
  timeZone: string;
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
  citywideAssessment: {
    totalWardsEvaluated: number;
    citywideMeanScore: number;
    peakWard: { wardId: string; wardName: string; score: number };
    totalEstimatedExposedPopulation: number;
    populationExposureMethodology: string;
    tierDistribution: {
      severeCount: number;
      highCount: number;
      moderateCount: number;
      lowCount: number;
    };
  };
  allWardsTable: {
    rank: number;
    wardId: string;
    wardName: string;
    score: number;
    severityTier: string;
    primaryDriver: string;
    elevationMeanM: number;
    estimatedExposedPopulation: number;
    criticalAssetsCount: number;
  }[];
  selectedWardAnalysis?: {
    wardId: string;
    wardName: string;
    zone: string;
    elevationMeanM: number;
    isCoastal: boolean;
    drainageBasins: string[];
    saucerDepressions: { name: string; elevationMinM: number }[];
    score: number;
    severityTier: string;
    historicalHotspots: string[];
    potentiallyExposedHospitals: { name: string; type: string }[];
    potentiallyExposedRoads: string[];
    estimatedExposedPopulation: number;
    totalPopulation: number;
    stepByStepCalculations: string[];
  };
  conditionsAndInputs: {
    liveObservations: { name: string; value: string | number; unit: string; source: string; status: string }[];
    userControlledInputs: { name: string; value: string | number; unit: string; notes?: string }[];
    missingOrStaleInputs: { variable: string; impactOnModel: string; fallbackUsed: string }[];
  };
  methodology: {
    modelName: string;
    formulaPlain: string;
    formulaLatex: string;
    baselineDefinition: string;
    spatialResolution: string;
    temporalResolution: string;
    validationStatus: string;
    coreAssumptions: string[];
    operationalThresholds: { tier: string; range: string; color: string; posture: string }[];
  };
  recommendedActions: {
    phase: string;
    departmentCode: string;
    departmentName: string;
    title: string;
    targetWards: string[];
    priority: "CRITICAL" | "HIGH" | "MEDIUM" | "ROUTINE";
    prerequisites: string[];
    rationale: string;
  }[];
  governanceAndLimitations: {
    aiGovernanceState: string;
    aiRoles: { role: string; status: string; model: string }[];
    authoritativeSources: { name: string; publisher: string; cadence: string }[];
    generalDisclaimer: string;
    nonDispatchDisclaimer: string;
  };
  vectorMapSvg?: string;
}

export interface TelemetryReportDocument {
  documentId: string;
  city: string;
  cityName: string;
  municipalAuthority: string;
  category: string;
  categoryLabel: string;
  selectedZone: string;
  generatedAtIso: string;
  timeRange: {
    start: string;
    end: string;
    resolution: string;
  };
  sourceHealth: {
    provider: string;
    status: string;
    freshness: string;
    latencyMs: number;
    endpointDisclosure: string;
  };
  keyCurrentMetrics: {
    id: string;
    name: string;
    value: number | string;
    unit: string;
    status: string;
    statusColor: string;
    referenceThreshold?: string;
  }[];
  charts: {
    id: string;
    title: string;
    subtitle?: string;
    unit: string;
    svgString: string;
    thresholds?: { value: number; label: string; color: string }[];
  }[];
  tabularData: {
    columns: string[];
    rows: (string | number)[][];
    totalRows: number;
    truncated: boolean;
  };
  parameterDefinitions: {
    code: string;
    name: string;
    unit: string;
    category: string;
    source: string;
    description: string;
    thresholdCitation?: string;
  }[];
  environmentalInsights: string[];
  missingDataDisclosures: string[];
  limitations: string[];
}
