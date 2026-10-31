/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Simulation Data Contracts
   Standardized, typed contracts for multi-hazard spatial simulations.
   
   Enforces:
   - Complete provenance & auditability
   - Separation of observed, forecast, historical & scenario inputs
   - Model-readiness tier disclosures
   - Strict absence of unvalidated flood depth in meters
   - Full time-step state serialization
   - Ward impact & exposed population calculations
   - Structured Scenario Report generation
   ════════════════════════════════════════════════════════ */

import type { FeatureCollection } from "geojson";

export type ModelReadinessTier =
  | "TIER_1_OBSERVED_FORECAST"      // Direct observations / forecasts without unverified inundation claims
  | "TIER_2_SCREENING_SIMULATION"   // Transparent, reproducible multi-variable screening index
  | "TIER_3_VALIDATED_HYDRODYNAMIC"; // Calibrated 2D shallow water hydrodynamic solver

export type DataQualityStatus =
  | "VALIDATED"             // Verified sensor / AWS / official gauge feed
  | "PROVISIONAL"           // Live numerical model forecast (ECMWF / IMD / GFS)
  | "PARTIALLY_CALIBRATED"  // Exploratory screening formula with documented assumptions
  | "MISSING_SENSOR_FEED";  // Missing input with explicit transparent disclosure

export type BaselineMode =
  | "current_live"          // Current live telemetry / numerical forecast
  | "dry_baseline"          // Dry weather baseline (zero storm stress)
  | "historical_july2005"   // 26 July 2005 944mm cloudburst benchmark
  | "historical_july2024";  // 8 July 2024 268mm monsoon downpour benchmark

export interface ParameterProvenance {
  sourceType: "OBSERVED_SENSOR" | "NUMERICAL_FORECAST" | "HISTORICAL_REANALYSIS" | "SCENARIO_VARIABLE";
  providerName: string;
  nominalResolution: string;
  updateFrequency: string;
  referenceDataset?: string;
}

export interface ScenarioParameterDef {
  key: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  description: string;
  provenance: ParameterProvenance;
}

export interface ScenarioOutputVariable {
  key: string;
  label: string;
  unit: string;
  colorScale: "rainfall" | "susceptibility" | "heat" | "air_quality" | "coastal_surge" | "wind";
  description: string;
}

export interface SimulationScenarioContract {
  id: string;
  title: string;
  category: "rainfall_waterlogging" | "coastal_surge" | "drainage" | "heat" | "wind" | "air_quality";
  modelVersion: string;
  tier: ModelReadinessTier;
  suitability: "ADMIN_EXPLORATORY_ANALYSIS" | "OPERATIONAL_SCREENING" | "PUBLIC_GUIDANCE";
  city: string;
  geographicExtent: {
    name: string;
    swCorner: [number, number]; // [lat, lon]
    neCorner: [number, number]; // [lat, lon]
    totalAreaSqKm: number;
  };
  durationHours: number;
  timeStepResolutionHours: number;
  spatialResolutionMeters: number;
  description: string;
  inputs: ScenarioParameterDef[];
  outputVariables: ScenarioOutputVariable[];
  scientificFormula: string;
  formulaVersion: string;
  assumptions: string[];
  limitations: string[];
  requiredDatasets: string[];
  recommendedActions: string[];
}

export interface WardImpactRecord {
  wardId: string;
  wardName: string;
  zoneCode: string;
  zoneName: string;
  metricValue: number;
  metricUnit: string;
  metricLabel: string;
  baselineValue: number;
  deltaPercent: number;
  tierLabel: string;
  severityColor: string;
  isThresholdExceeded: boolean;
  thresholdSource: string;
  drainageBasin: string;
  elevationMeanM: number;
  isCoastal: boolean;
  
  // Exposure & Vulnerability
  populationEst: number;
  estimatedExposedPopulation: number;
  populationExposureMethod: string;
  exposureBreakdown?: {
    totalWardPopulation: number;
    insideScreeningZoneEst: number;
    intersectsDepressionZoneEst: number;
    closeToCorridorEst: number;
    confirmedAffected: number;
    allocationMethodology: string;
    censusReferenceYear: number;
    projectionYear: number;
  };
  terrainSummary?: {
    elevationMeanM: number;
    elevationMinM?: number;
    elevationMaxM?: number;
    slopeMeanDeg?: number;
    topographicWetnessIndex?: number;
    terrainClassification?: string;
    saucerSinksCount?: number;
    saucerAreaSqM?: number;
    demVerticalDatum: string;
    demResolutionM: number;
    demLimitations: string;
  };
  
  // Physical & Municipal Infrastructure
  intersectingHotspots: string[];
  pumpingStations: string[];
  potentiallyExposedHospitals?: {
    name: string;
    type: string;
    relationship: string;
    address?: string;
    nearestDepression?: string;
    elevationEstimateM?: number;
  }[];
  potentiallyExposedRoads?: {
    name: string;
    highwayType: string;
    lanes: number;
    lengthM?: number;
    intersectsDepression?: boolean;
  }[];
  lowLyingDepressions?: {
    name: string;
    elevationMeanM: number;
    areaSqM: number;
    source: string;
  }[];

  // Disaggregated Model Variables (Separation of physical inputs, spatial terrain, history, assumptions, and scores)
  disaggregatedVariables?: {
    physicalInputs: {
      precipitationRateMmH?: number;
      accumulatedPrecipMm?: number;
      astronomicalTideM?: number;
      ambientTempC?: number;
      windGustKmH?: number;
      pm25Baseline?: number;
      gravityOutfallEfficiencyPct?: number;
      isSluiceGateLockedOut?: boolean;
      instantaneousRunoffMmH?: number;
      netRunoffExcessMmH?: number;
    };
    spatialCharacteristics: {
      elevationMeanM: number;
      elevationMinM?: number;
      elevationMaxM?: number;
      slopeMeanDeg?: number;
      topographicWetnessIndex?: number;
      isCoastal: boolean;
      isSaucerDepression: boolean;
      saucerDepressionCount?: number;
      maxDepressionDepthM?: number;
      hasMithiCorridor: boolean;
      imperviousFraction?: number;
      nominalDrainCapacityMmH?: number;
      terrainClassification?: string;
    };
    historicalEvidence: {
      chronicHotspotCount: number;
      hotspotLocations?: string[];
      historicalDepth2005M?: string;
    };
    hypotheticalParameters: {
      drainageBlockagePct?: number;
      simulatedDurationHours: number;
      rainfallProfile?: string;
    };
    modelAssumptions: string[];
    screeningScoreVsInundationDisclaimer: string;
  };
  
  // Traceability & Actions
  calculationTrace: string;
  qualityStatus: DataQualityStatus;
  recommendedAction: string;
}

export interface SimulationTimeStepOutput {
  timeStepHours: number;
  simulatedTimeIso: string;
  timeRatio: number;
  activeScenarioId: string;
  modelVersion: string;
  parametersApplied: Record<string, number>;
  qualityStatus: DataQualityStatus;
  missingParameters: string[];
  
  // Spatial Fields
  continuousSurfaceIsobands: FeatureCollection;
  rankedWards: WardImpactRecord[];
  
  // Citywide Aggregates
  summary: {
    totalWardsEvaluated: number;
    wardsInSevereTier: number;
    wardsInHighTier: number;
    wardsInModerateTier: number;
    meanCityValue: number;
    peakCityValue: number;
    peakWardName: string;
    overallAlertLevel: "GREEN_NORMAL" | "YELLOW_WATCH" | "ORANGE_ALERT" | "RED_WARNING";
    estimatedTotalExposedPopulation: number;
  };
  
  // Audit & Science
  auditTrail: {
    engineVersion: string;
    executedAt: string;
    executionTimeMs: number;
    scientificFormula: string;
    limitations: string[];
    uncertaintyNote: string;
  };
}

export interface StructuredScenarioReport {
  reportId: string;
  generatedAt: string;
  scenarioId: string;
  scenarioTitle: string;
  modelVersion: string;
  modelTier: ModelReadinessTier;
  city: string;
  baselineMode: string;
  timeStepSelected: number;
  durationHours: number;
  parametersApplied: Record<string, { value: number; unit: string; label: string }>;
  overallAlertLevel: string;
  citywideSummary: {
    meanValue: number;
    peakValue: number;
    peakWard: string;
    totalExposedPopEst: number;
    severeWardsCount: number;
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
    topHotspots: string[];
    action: string;
  }[];
  assumptions: string[];
  missingDataAndLimitations: string[];
  operationalReviewRecommendations: string[];
  disclaimer: string;
}
