/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Spatial Simulation Engine
   Deterministic Multi-Hazard Numerical Engine for Mumbai.
   
   Enforces:
   - Mathematical scenario execution across all 24 canonical BMC Wards
   - Sluice gate backflow & tidal lock evaluation (4.5m threshold)
   - Dynamic time-dependent temporal evolution models
   - Low-lying saucer depression & drainage network weighting
   - Continuous spatial surface generation (IDW & Isobands)
   - Population exposure estimation with explicit demographic provenance
   - Structured Scenario Report generation
   - 100% testable, reproducible, and explainable
   ════════════════════════════════════════════════════════ */

import { bmcWardRegistry, type BmcWardRecord } from "../geo/ward-registry";
import { mumbaiAssetRegistry } from "../geo/mumbai-assets";
import {
  generateContinuousHazardSurface,
  type ContinuousSurfaceResult,
  type SpatialPointSample,
} from "../geo/spatial-surface";
import {
  SCENARIO_REGISTRY,
  type ScenarioDefinition,
} from "./scenario-registry";
import {
  type ModelReadinessTier,
  type DataQualityStatus,
  type WardImpactRecord,
  type SimulationTimeStepOutput,
  type StructuredScenarioReport,
} from "./contracts";
import { calculateHeatIndexCelsius } from "../hazards/derived-metrics";
import { generateCityConsequenceMatrix, type CityConsequenceMatrix } from "../impact/consequence-matrix";
import { generateWardDecisionSummary, type WardDecisionSummary } from "../decision-support/ward-advisory";
import { buildPipelineProvenance, type UnifiedPipelineProvenance } from "../pipeline/unified-intelligence";

export interface SimulationRequest {
  scenarioId: string;
  parameters: Record<string, number>;
  timeStepHours: number; // Current point in timeline (0 to durationHours)
  baselineMode: "current_live" | "dry_baseline" | "historical_july2005" | "historical_july2024";
  city?: string;
  simulateMissingInputs?: boolean;
}

export interface TemporalHydrologyState {
  timeStepHours: number;
  instantaneousRainfallRateMmH: number;
  accumulatedRainfallMm: number;
  astronomicalTideM: number;
  isSluiceLocked: boolean;
  gravityEfficiencyPct: number;
  profileType: "constant_rate" | "chicago_peak" | "historical_burst_2005" | "historical_burst_2024";
  hyetographSeries: { hour: number; rateMmH: number; accumMm: number; tideM: number }[];
}

export interface SimulationResult {
  scenarioId: string;
  scenarioTitle: string;
  modelVersion: string;
  modelTier: ModelReadinessTier;
  suitability: string;
  timeStepHours: number;
  maxDurationHours: number;
  baselineMode: string;
  parametersApplied: Record<string, number>;
  missingParameters: string[];
  qualityStatus: DataQualityStatus;
  continuousSurface: ContinuousSurfaceResult;
  rankedWards: WardImpactRecord[];
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
  auditTrail: {
    engineVersion: string;
    executedAt: string;
    executionTimeMs: number;
    scientificFormula: string;
    formulaVersion: string;
    limitations: string[];
    uncertaintyNote: string;
  };
  structuredReport: StructuredScenarioReport;
  consequenceMatrix?: CityConsequenceMatrix;
  highPriorityWardAdvisories?: WardDecisionSummary[];
  pipelineProvenance?: UnifiedPipelineProvenance;
  temporalHydrology?: TemporalHydrologyState;
}

/**
 * Compute continuous, physical time-dependent rainfall hyetograph and tidal curve
 */
export function computeHydrologyState(
  baseRainRate: number,
  durationHours: number,
  timeStepHours: number,
  profileChoice: number,
  baseTideM: number,
  baselineMode: string
): TemporalHydrologyState {
  let profileType: "constant_rate" | "chicago_peak" | "historical_burst_2005" | "historical_burst_2024" = "constant_rate";

  if (baselineMode === "historical_july2005" || profileChoice === 2) {
    profileType = "historical_burst_2005";
  } else if (baselineMode === "historical_july2024" || profileChoice === 3) {
    profileType = "historical_burst_2024";
  } else if (profileChoice === 1) {
    profileType = "chicago_peak";
  } else {
    profileType = "constant_rate";
  }

  // Rate function P(t)
  const getRateAt = (t: number): number => {
    if (t < 0 || t > durationHours + 0.1) return 0;
    if (profileType === "constant_rate") {
      return baseRainRate;
    }
    if (profileType === "chicago_peak") {
      const peakT = Math.max(1.0, durationHours * 0.35);
      const sigma = 1.15;
      const gaussian = Math.exp(-Math.pow(t - peakT, 2) / (2 * Math.pow(sigma, 2)));
      return Math.round((baseRainRate * (0.15 + 0.85 * gaussian)) * 10) / 10;
    }
    if (profileType === "historical_burst_2005") {
      // 26 July 2005 cloudburst profile
      const peakT = Math.min(3.0, durationHours * 0.5);
      const intensity = 35 + 110 * Math.exp(-Math.pow(t - peakT, 2) / 2.2);
      return Math.round(intensity * 10) / 10;
    }
    if (profileType === "historical_burst_2024") {
      // 8 July 2024 monsoon downpour profile
      const peakT = 1.0;
      const intensity = 25 + 60 * Math.exp(-Math.pow(t - peakT, 2) / 1.5);
      return Math.round(intensity * 10) / 10;
    }
    return baseRainRate;
  };

  // Tide function H(t) (12.42h semi-diurnal cycle peaking at t=2.5h)
  const getTideAt = (t: number): number => {
    // baseTideM is the peak astronomical spring tide of the diurnal cycle
    // Tidal oscillation range is ~2.5m between spring high and low water in Mumbai harbor
    const tide = baseTideM - 1.25 * (1 - Math.cos((2 * Math.PI * (t - 2.5)) / 12.42));
    return Math.round(tide * 100) / 100;
  };

  // Exact trapezoidal integration for accumulated rainfall R_accum(t) (dt = 0.05h)
  const dt = 0.05;
  let accum = 0;
  const numSteps = Math.round(Math.max(0, timeStepHours) / dt);
  for (let i = 0; i < numSteps; i++) {
    const t1 = i * dt;
    const t2 = (i + 1) * dt;
    accum += ((getRateAt(t1) + getRateAt(t2)) / 2) * dt;
  }
  const accumulatedRainfallMm = Math.round(accum * 10) / 10;
  const instantaneousRainfallRateMmH = getRateAt(timeStepHours);
  const astronomicalTideM = getTideAt(timeStepHours);
  const isSluiceLocked = astronomicalTideM >= 4.5;

  let gravityEfficiencyPct = 100;
  if (astronomicalTideM >= 4.5) {
    gravityEfficiencyPct = 15; // Locked out; only mechanical pumps
  } else if (astronomicalTideM >= 4.0) {
    gravityEfficiencyPct = Math.round(100 - ((astronomicalTideM - 4.0) / 0.5) * 75);
  }

  // Generate hyetograph series
  const hyetographSeries: { hour: number; rateMmH: number; accumMm: number; tideM: number }[] = [];
  let seriesAccum = 0;
  const stepCount = Math.round(durationHours * 2);
  for (let s = 0; s <= stepCount; s++) {
    const hr = s * 0.5;
    const rate = getRateAt(hr);
    if (s > 0) {
      seriesAccum += ((getRateAt((s - 1) * 0.5) + rate) / 2) * 0.5;
    }
    hyetographSeries.push({
      hour: hr,
      rateMmH: rate,
      accumMm: Math.round(seriesAccum * 10) / 10,
      tideM: getTideAt(hr),
    });
  }

  return {
    timeStepHours,
    instantaneousRainfallRateMmH,
    accumulatedRainfallMm,
    astronomicalTideM,
    isSluiceLocked,
    gravityEfficiencyPct,
    profileType,
    hyetographSeries,
  };
}

export class SimulationEngine {
  /**
   * Execute a deterministic simulation run for a given time step and scenario
   */
  execute(req: SimulationRequest): SimulationResult {
    const startTime = Date.now();
    const scenario = SCENARIO_REGISTRY[req.scenarioId] || SCENARIO_REGISTRY.rainfall_waterlogging;
    const timeStep = Math.max(0, req.timeStepHours || 0);

    const wards = bmcWardRegistry.getAllWards();
    const samples: SpatialPointSample[] = [];
    const wardImpacts: WardImpactRecord[] = [];
    const missingParams: string[] = [];

    // Parse parameters with scenario defaults and detect missing ones
    const rawParams = { ...(req.parameters || {}) };

    // Support parameter aliases for robust API and hydrological model compatibility
    if (typeof (rawParams as any).instantaneousRainfallRateMmH === "number" && typeof rawParams.rainfallRateMmH !== "number") {
      rawParams.rainfallRateMmH = (rawParams as any).instantaneousRainfallRateMmH;
    }
    if (typeof (rawParams as any).astronomicalTideM === "number" && typeof rawParams.highTideMeters !== "number") {
      rawParams.highTideMeters = (rawParams as any).astronomicalTideM;
    }

    const params: Record<string, number> = {};

    for (const inputDef of scenario.inputs) {
      if (typeof rawParams[inputDef.key] === "number" && !isNaN(rawParams[inputDef.key])) {
        params[inputDef.key] = rawParams[inputDef.key];
      } else {
        params[inputDef.key] = inputDef.defaultValue;
        missingParams.push(inputDef.key);
      }
    }

    // Preserve any explicit parameters passed outside scenario.inputs
    for (const [k, v] of Object.entries(rawParams)) {
      if (typeof v === "number" && !isNaN(v) && params[k] === undefined) {
        params[k] = v;
      }
    }

    const duration = params.durationHours || 6;
    const baseRainRate = params.rainfallRateMmH || params.hourlyPrecipMm || 45;
    const baseTideM = params.highTideMeters ?? params.astronomicalTideM ?? (scenario.id === "coastal_monsoon_surge" ? 4.65 : 3.8);
    const profileChoice = params.rainfallProfile || (req.baselineMode === "historical_july2005" ? 2 : req.baselineMode === "historical_july2024" ? 3 : 0);

    const hydro = computeHydrologyState(
      baseRainRate,
      duration,
      timeStep,
      profileChoice,
      baseTideM,
      req.baselineMode
    );

    const effectiveTimeRatio = Math.min(1.0, timeStep / Math.max(1, duration));

    const qualityStatus: DataQualityStatus = missingParams.length > 0
      ? "PARTIALLY_CALIBRATED"
      : req.baselineMode === "current_live"
      ? "PROVISIONAL"
      : "VALIDATED";

    // Evaluate each ward
    for (const ward of wards) {
      let wardQuality: DataQualityStatus = qualityStatus;
      if (req.simulateMissingInputs && (ward.id === "M/East" || ward.id === "T")) {
        wardQuality = "MISSING_SENSOR_FEED";
      }

      const evaluation = this.evaluateWardForScenario(
        scenario,
        ward,
        params,
        timeStep,
        effectiveTimeRatio,
        req.baselineMode,
        wardQuality,
        hydro
      );
      wardImpacts.push(evaluation);

      samples.push({
        id: ward.id,
        name: ward.name,
        lat: ward.officeCoords[0],
        lon: ward.officeCoords[1],
        value: evaluation.metricValue,
      });
    }

    // Sort wards descending by impact metric
    wardImpacts.sort((a, b) => b.metricValue - a.metricValue);

    // Primary output variable definition
    const primaryOutput = scenario.outputVariables[0];

    // Generate continuous spatial surface
    const surface = generateContinuousHazardSurface(
      primaryOutput.key,
      primaryOutput.label,
      primaryOutput.unit,
      samples,
      primaryOutput.colorScale,
      scenario.tier
    );

    // Compute summary stats
    const values = wardImpacts.map((w) => w.metricValue);
    const meanVal = Math.round((values.reduce((acc, v) => acc + v, 0) / values.length) * 10) / 10;
    const peakVal = values[0] || 0;
    const peakWardName = wardImpacts[0]?.wardName || "N/A";
    const totalExposedPop = wardImpacts.reduce((sum, w) => sum + w.estimatedExposedPopulation, 0);

    const severeCount = wardImpacts.filter((w) =>
      w.tierLabel.toLowerCase().includes("severe") ||
      w.tierLabel.toLowerCase().includes("extreme") ||
      w.tierLabel.toLowerCase().includes("hazardous")
    ).length;

    const highCount = wardImpacts.filter((w) =>
      w.tierLabel.toLowerCase().includes("high") ||
      w.tierLabel.toLowerCase().includes("danger") ||
      w.tierLabel.toLowerCase().includes("very heavy")
    ).length;

    const modCount = wardImpacts.filter((w) =>
      w.tierLabel.toLowerCase().includes("moderate") ||
      w.tierLabel.toLowerCase().includes("heavy") ||
      w.tierLabel.toLowerCase().includes("caution")
    ).length;

    let overallAlert: "GREEN_NORMAL" | "YELLOW_WATCH" | "ORANGE_ALERT" | "RED_WARNING" = "GREEN_NORMAL";
    if (severeCount >= 2 || peakVal >= 80) overallAlert = "RED_WARNING";
    else if (highCount >= 3 || peakVal >= 60) overallAlert = "ORANGE_ALERT";
    else if (modCount >= 4 || peakVal >= 35) overallAlert = "YELLOW_WATCH";

    const executionTimeMs = Date.now() - startTime;

    const structuredReport = this.buildStructuredReport(
      scenario,
      params,
      req.baselineMode,
      timeStep,
      duration,
      overallAlert,
      meanVal,
      peakVal,
      peakWardName,
      totalExposedPop,
      severeCount,
      wardImpacts,
      primaryOutput.unit
    );

    return {
      scenarioId: scenario.id,
      scenarioTitle: scenario.title,
      modelVersion: "v3.2-mumbai-calibrated",
      modelTier: scenario.tier,
      suitability: scenario.suitability,
      timeStepHours: timeStep,
      maxDurationHours: duration,
      baselineMode: req.baselineMode,
      parametersApplied: params,
      missingParameters: missingParams,
      qualityStatus,
      continuousSurface: surface,
      rankedWards: wardImpacts,
      summary: {
        totalWardsEvaluated: wardImpacts.length,
        wardsInSevereTier: severeCount,
        wardsInHighTier: highCount,
        wardsInModerateTier: modCount,
        meanCityValue: meanVal,
        peakCityValue: peakVal,
        peakWardName,
        overallAlertLevel: overallAlert,
        estimatedTotalExposedPopulation: totalExposedPop,
      },
      auditTrail: {
        engineVersion: "Sentinel-SimulationEngine/3.2",
        executedAt: new Date().toISOString(),
        executionTimeMs,
        scientificFormula: scenario.scientificFormula,
        formulaVersion: "2026.1-BRIMSTOWAD-NOAA",
        limitations: scenario.limitations,
        uncertaintyNote: "Screening simulation provides relative spatial prioritization. Does NOT assert street-level water depth in meters without calibrated 2D Saint-Venant solver.",
      },
      structuredReport,
      consequenceMatrix: generateCityConsequenceMatrix(wardImpacts, scenario.id),
      highPriorityWardAdvisories: wardImpacts
        .filter((w) => w.metricValue >= 45.0)
        .slice(0, 4)
        .map((w) =>
          generateWardDecisionSummary(w.wardId, w, {
            precipitationRateMmH: hydro.instantaneousRainfallRateMmH,
            astronomicalTideM: hydro.astronomicalTideM,
            drainageBlockagePct: params.drainageBlockagePct,
            timeStepHours: timeStep,
          })
        ),
      pipelineProvenance: buildPipelineProvenance({
        cityId: req.city || "mumbai",
        scenarioId: scenario.id,
        modelVersion: "v3.2-mumbai-calibrated",
        missingInputs: missingParams,
      }),
      temporalHydrology: hydro,
    };
  }

  /**
   * Evaluate a single ward based on scenario mathematical formulation
   */
  private evaluateWardForScenario(
    scenario: ScenarioDefinition,
    ward: BmcWardRecord,
    params: Record<string, number>,
    timeStep: number,
    timeRatio: number,
    baselineMode: string,
    qualityStatus: DataQualityStatus,
    hydro: TemporalHydrologyState
  ): WardImpactRecord {
    let metricValue = 0;
    let baselineValue = 0;
    let metricUnit = "";
    let metricLabel = "";
    let tierLabel = "Low";
    let severityColor = "#22c55e";
    let isExceeded = false;
    let thresholdSource = "MCGM Standard";
    let recommendedAction = "Maintain standard ward surveillance.";
    let calculationTrace = "";

    const isHistorical2005 = baselineMode === "historical_july2005";
    const isHistorical2024 = baselineMode === "historical_july2024";
    const isDryBaseline = baselineMode === "dry_baseline";
    const duration = params.durationHours || 6;

    // Ward terrain attributes derived from Copernicus DEM & ESA WorldCover
    const terrain = ward.terrain;
    const isSaucer = terrain?.isSaucerDepression ?? ["F/South", "F/North", "H/West", "K/West", "L"].includes(ward.id);
    const elevationMeanM = terrain?.elevationMeanM ?? ward.elevationMeanM;
    const depthM = terrain?.maxDepressionDepthM ?? (isSaucer ? 3.0 : 1.0);
    const slopeDeg = terrain?.slopeMeanDeg ?? 1.5;
    const impFraction = terrain?.imperviousFraction ?? 0.82;
    const hasMithi = terrain?.hasMithiCorridor ?? ["L", "H/East", "G/North", "K/East"].includes(ward.id);
    const nominalDrain = terrain?.nominalDrainCapacityMmH ?? (["A", "B", "C", "D", "E", "F/South", "F/North", "G/South", "G/North"].includes(ward.id) ? 25 : 50);

    switch (scenario.id) {
      // ─── SCENARIO A: RAINFALL & WATERLOGGING SCREENING ────────
      case "rainfall_waterlogging": {
        metricUnit = "index (0-100)";
        metricLabel = "Waterlogging Susceptibility";

        const rainRate = isHistorical2005 ? 120 : isHistorical2024 ? 75 : hydro.instantaneousRainfallRateMmH;
        const accumRain = hydro.accumulatedRainfallMm;
        const blockage = (params.drainageBlockagePct || 15) / 100;

        // Tidal gravity outfall efficiency
        let wardTideFactor = 1.0;
        if (ward.isCoastal) {
          wardTideFactor = hydro.gravityEfficiencyPct / 100;
        } else if (hasMithi) {
          wardTideFactor = Math.max(0.40, hydro.gravityEfficiencyPct / 100);
        }

        // Effective drainage discharge capacity
        const effDrainCapacity = nominalDrain * (1 - blockage) * wardTideFactor;

        // Generated runoff rate & net excess
        const generatedRunoff = rainRate * impFraction;
        const runoffExcess = Math.max(0, generatedRunoff - effDrainCapacity);
        const runoffExcessScore = Math.min(35, (runoffExcess / 45) * 35);

        // Topographic depression penalty (Copernicus DEM saucer sinks & slope gradient)
        const topoPenalty = isSaucer
          ? (18 + Math.min(10, depthM * 3.5) + (slopeDeg <= 1.0 ? 3 : 0))
          : (elevationMeanM < 6 ? 12 : (elevationMeanM < 10 ? 6 : 2));

        // Historical recurring hotspot weighting
        const hotspotCount = ward.floodHotspots.length;
        const hotspotWeight = Math.min(20, hotspotCount * 6);

        // Drainage corridor proximity & conveyance stress
        const drainageStress = ((hasMithi ? 18 : (ward.isCoastal ? 12 : 6)) * (1 + blockage));

        // Accumulated depression storage buildup
        const accumStorageFactor = Math.min(15, (accumRain * impFraction / 120) * (isSaucer ? 1.5 : 0.8));

        const rawScore = runoffExcessScore + topoPenalty + hotspotWeight + drainageStress + accumStorageFactor;
        metricValue = Math.min(100, Math.max(0, Math.round(rawScore * 10) / 10));
        baselineValue = isDryBaseline ? 10 : 25;

        calculationTrace = `Score = [RunoffExcess(${runoffExcess.toFixed(1)} mm/h over Cap ${effDrainCapacity.toFixed(1)}) → ${runoffExcessScore.toFixed(1)}pts + TopoSink(${topoPenalty.toFixed(1)}, El:${elevationMeanM}m) + Hotspots(${hotspotWeight}) + Drainage(${drainageStress.toFixed(1)}${hasMithi ? " [Mithi]" : ""}) + Storage(${accumStorageFactor.toFixed(1)}, Acc:${accumRain}mm)] = ${metricValue}`;

        if (metricValue >= 80) {
          tierLabel = "Severe Inundation Hazard";
          severityColor = "#991b1b";
          isExceeded = true;
          thresholdSource = "MCGM Monsoon Threshold (>80)";
          recommendedAction = `Immediate dispatch of high-capacity pumps to ${ward.floodHotspots[0] || ward.name}. Alert SWD team.`;
        } else if (metricValue >= 60) {
          tierLabel = "High Sinking / Choke";
          severityColor = "#ef4444";
          isExceeded = true;
          thresholdSource = "MCGM Critical Chokepoint (>60)";
          recommendedAction = `Pre-position mobile dewatering units along ${ward.drainageBasin}. Clear trash racks.`;
        } else if (metricValue >= 40) {
          tierLabel = "Moderate Waterlogging";
          severityColor = "#f97316";
          thresholdSource = "Precautionary Threshold (>40)";
          recommendedAction = "Station traffic wardens near railway subways and low-lying intersections.";
        } else {
          tierLabel = "Low Inundation Risk";
          severityColor = "#22c55e";
          recommendedAction = "Routine drainage inspection.";
        }
        break;
      }

      // ─── SCENARIO B: RAINFALL ACCUMULATION ────────────────────
      case "rainfall_accumulation": {
        metricUnit = "mm";
        metricLabel = "Rolling Accumulated Rainfall";

        const baseAccum = hydro.accumulatedRainfallMm;
        // Spatial variation across wards (North vs South orographic gradient)
        const spatialFactor = ward.zoneCode === "ZONE-II" || ward.zoneCode === "ZONE-III" ? 1.25 : 1.0;
        metricValue = Math.round(baseAccum * spatialFactor * 10) / 10;
        baselineValue = 15;

        calculationTrace = `Accumulation = Base(${baseAccum} mm) × SpatialOrographic(${spatialFactor.toFixed(2)}) = ${metricValue} mm (at T=${timeStep}h, Instantaneous Rate: ${hydro.instantaneousRainfallRateMmH} mm/h)`;

        if (metricValue >= 204.4) {
          tierLabel = "Extremely Heavy (>204.4 mm)";
          severityColor = "#dc2626";
          isExceeded = true;
          thresholdSource = "IMD Red Alert Warning (>204.4 mm)";
          recommendedAction = "Issue Red Alert to Commissioner. Coordinate shelter readiness.";
        } else if (metricValue >= 115.6) {
          tierLabel = "Very Heavy (115.6-204.4 mm)";
          severityColor = "#7c3aed";
          isExceeded = true;
          thresholdSource = "IMD Orange Alert Warning (>115.6 mm)";
          recommendedAction = "Activate emergency response teams and municipal school shelters.";
        } else if (metricValue >= 64.5) {
          tierLabel = "Heavy (64.5-115.5 mm)";
          severityColor = "#1d4ed8";
          thresholdSource = "IMD Yellow Watch (>64.5 mm)";
          recommendedAction = "Monitor low-lying arterial roads.";
        } else {
          tierLabel = "Moderate (<64.5 mm)";
          severityColor = "#3b82f6";
          recommendedAction = "Standard surveillance.";
        }
        break;
      }

      // ─── SCENARIO C: COASTAL SURGE & SLUICE LOCKOUT ───────────
      case "coastal_monsoon_surge": {
        metricUnit = "index (0-100)";
        metricLabel = "Compound Tidal Sluice Risk";

        const tideProgression = hydro.astronomicalTideM;
        const isSluiceLocked = hydro.isSluiceLocked;
        const coastalVulnerability = ward.isCoastal ? 25 : (hasMithi ? 18 : 8);
        const lockPenalty = isSluiceLocked && (ward.isCoastal || hasMithi) ? 45 : 0;
        const rainLoad = Math.min(30, (hydro.instantaneousRainfallRateMmH / 60) * 30);

        metricValue = Math.min(100, Math.round((coastalVulnerability + lockPenalty + rainLoad) * 10) / 10);
        baselineValue = 30;

        calculationTrace = `Risk = CoastalVuln(${coastalVulnerability}) + SluiceLock(${lockPenalty}, Tide: ${tideProgression.toFixed(2)}m CD${isSluiceLocked ? " [SLUICE GATES LOCKED OUT]" : ""}) + RainLoad(${rainLoad.toFixed(1)}) = ${metricValue}`;

        if (metricValue >= 75) {
          tierLabel = "Severe Inundation Hazard";
          severityColor = "#991b1b";
          isExceeded = true;
          thresholdSource = "MCGM Floodgate Lockout Protocol (>4.5m Tide)";
          recommendedAction = `Shut floodgates at ${ward.pumpingStations[0] || "Coastal Outfalls"} to block sea ingress; run mechanical pumps at maximum capacity.`;
        } else if (metricValue >= 50) {
          tierLabel = "High Sinking / Choke";
          severityColor = "#ef4444";
          thresholdSource = "Coastal Tidal Sluice Alert";
          recommendedAction = "Pre-position mobile pumps at seaface junctions.";
        } else {
          tierLabel = "Moderate Waterlogging";
          severityColor = "#f97316";
          recommendedAction = "Inspect tidal gates and storm sluices.";
        }
        break;
      }

      // ─── SCENARIO D: DRAINAGE STRESS & CHOKEPOINT BLOCKAGE ────
      case "drainage_stress_blockage": {
        metricUnit = "index (0-100)";
        metricLabel = "Drainage Conveyance Stress";

        const rainRate = hydro.instantaneousRainfallRateMmH;
        const blockagePct = (params.corridorBlockagePct || 35) / 100;
        const isSuburbanCreek = ["K/West", "P/South", "P/North", "R/South", "R/Central", "R/North"].includes(ward.id);
        const nullahWeight = hasMithi ? 35 : isSuburbanCreek ? 22 : 12;

        const effectiveConveyance = Math.max(0.2, 1.0 - blockagePct);
        const hydraulicStress = (rainRate / 50) * (1 / effectiveConveyance) * 20;
        const timeFactor = 0.45 + 0.55 * Math.min(1.0, Math.pow(Math.max(0, timeStep) / Math.max(1, duration), 0.75));

        metricValue = Math.min(100, Math.round((nullahWeight + hydraulicStress) * timeFactor * 10) / 10);
        baselineValue = 25;

        calculationTrace = `ConveyanceStress = [NullahWeight(${nullahWeight}) + HeadStress(${hydraulicStress.toFixed(1)})] × TimeFactor(${timeFactor.toFixed(2)}) = ${metricValue}`;

        if (metricValue >= 70) {
          tierLabel = "Critical Drainage Choke";
          severityColor = "#991b1b";
          isExceeded = true;
          thresholdSource = "BRIMSTOWAD Chokepoint Threshold (>70)";
          recommendedAction = `Dispatch hydraulic pontoon excavators to clear trash-racks along ${ward.drainageBasin}.`;
        } else if (metricValue >= 45) {
          tierLabel = "High Hydraulic Siltation";
          severityColor = "#ef4444";
          thresholdSource = "SWD Siltation Advisory (>45)";
          recommendedAction = "Inspect culverts and deploy suction tankers to clear blocked gratings.";
        } else {
          tierLabel = "Moderate Conveyance";
          severityColor = "#eab308";
          recommendedAction = "Normal waterway monitoring.";
        }
        break;
      }

      // ─── SCENARIO E: EXTREME HEAT STRESS ──────────────────────
      case "extreme_heat_stress": {
        metricUnit = "°C";
        metricLabel = "NOAA Heat Index";

        const temp = params.ambientTempC || 36.5;
        const rh = params.relativeHumidityPct || 75;

        // Diurnal thermal progression peaking at ~14:00 (mid-event)
        const diurnalCycle = 2.0 * Math.sin((Math.PI * Math.max(0, timeStep - 1)) / 7);
        const currentTemp = temp + diurnalCycle;

        // UHI heating factor in dense slum/industrial wards
        const uhiDelta = ["M/East", "L", "G/North", "E"].includes(ward.id) ? 2.0 : 0.5;
        const hi = calculateHeatIndexCelsius(currentTemp + uhiDelta, rh);

        metricValue = hi.heatIndexCelsius;
        baselineValue = 29.5;
        tierLabel = hi.riskTier;

        calculationTrace = `HeatIndex = NOAA_Rothfusz(T=${(currentTemp + uhiDelta).toFixed(1)}°C, RH=${rh}%) = ${metricValue}°C`;

        if (metricValue >= 54) {
          severityColor = "#b91c1c";
          isExceeded = true;
          thresholdSource = "NOAA Extreme Danger (>54°C)";
          recommendedAction = "Declare Red Heat Alert; suspend outdoor construction labor between 11 AM - 4 PM.";
        } else if (metricValue >= 41) {
          severityColor = "#f87171";
          isExceeded = true;
          thresholdSource = "NOAA Danger (>41°C)";
          recommendedAction = "Open cooling shelters at ward office; deploy mobile ORS and water tankers.";
        } else if (metricValue >= 32) {
          severityColor = "#fb923c";
          thresholdSource = "NOAA Extreme Caution (32-41°C)";
          recommendedAction = "Advise hydration and shade for vulnerable citizens.";
        } else {
          severityColor = "#fde047";
          recommendedAction = "Normal thermal advisory.";
        }
        break;
      }

      // ─── SCENARIO F: CYCLONIC WIND & SQUALL RISK ──────────────
      case "cyclonic_wind_squall": {
        metricUnit = "km/h";
        metricLabel = "Peak Wind Gusts";

        const sustained = params.sustainedWindKmH || 45;
        const gustFactor = params.gustFactor || 1.6;

        // Coastal unsheltered exposure factor
        const coastalFactor = ward.isCoastal ? 1.25 : 0.95;
        const timeFactor = 0.8 + 0.4 * Math.sin((Math.PI * timeStep) / 6);

        metricValue = Math.round(sustained * gustFactor * coastalFactor * timeFactor * 10) / 10;
        baselineValue = 22.0;

        calculationTrace = `Gust = Sustained(${sustained} km/h) × GustRatio(${gustFactor}) × CoastalShelter(${coastalFactor}) × TimeCurve(${timeFactor.toFixed(2)}) = ${metricValue} km/h`;

        if (metricValue >= 70) {
          tierLabel = "Severe Gale Warning (>70 km/h)";
          severityColor = "#991b1b";
          isExceeded = true;
          thresholdSource = "IMD Cyclonic Gale Warning (>70 km/h)";
          recommendedAction = "Halt construction cranes; secure billboards and tin roofs across the ward.";
        } else if (metricValue >= 50) {
          tierLabel = "Gale Advisory (50-70 km/h)";
          severityColor = "#ef4444";
          thresholdSource = "Coastal Squall Watch (>50 km/h)";
          recommendedAction = "Restrict access to promenades, piers, and beaches.";
        } else {
          tierLabel = "Moderate Breeze (<50 km/h)";
          severityColor = "#22c55e";
          recommendedAction = "Routine coastal surveillance.";
        }
        break;
      }

      // ─── SCENARIO G: AIR QUALITY INVERSION & STAGNATION ───────
      case "air_quality_stagnation": {
        metricUnit = "µg/m³";
        metricLabel = "Stagnation PM2.5 Concentration";

        const basePm25 = params.baselinePm25 || 120;
        const ventCoeff = Math.max(0.3, params.ventilationCoefficient || 0.6);

        // Industrial & traffic emission penalty (eastern & central corridors)
        const industrialPenalty = ["M/East", "M/West", "L", "N", "E"].includes(ward.id) ? 35 : 10;
        const inversionBuildup = (1 / ventCoeff) * (0.8 + 0.4 * (1 - timeRatio));

        metricValue = Math.round((basePm25 * inversionBuildup + industrialPenalty) * 10) / 10;
        baselineValue = 65;

        calculationTrace = `PM2.5 = [Base(${basePm25}) × Inversion(${inversionBuildup.toFixed(2)}) + IndustrialPenalty(${industrialPenalty})] = ${metricValue} µg/m³`;

        if (metricValue >= 250) {
          tierLabel = "Severe / Hazardous PM2.5 (>250)";
          severityColor = "#7f1d1d";
          isExceeded = true;
          thresholdSource = "CPCB / NAAQS Emergency Threshold (>250 µg/m³)";
          recommendedAction = "Mandate water sprinkling on roads; restrict diesel truck movement and outdoor schools.";
        } else if (metricValue >= 120) {
          tierLabel = "Very Poor PM2.5 (120-250)";
          severityColor = "#ef4444";
          thresholdSource = "CPCB Very Poor Level (>120 µg/m³)";
          recommendedAction = "Issue advisory for elderly and asthmatics to avoid morning outdoor exertion.";
        } else {
          tierLabel = "Moderate / Poor PM2.5";
          severityColor = "#eab308";
          recommendedAction = "Routine air quality monitoring.";
        }
        break;
      }

      // ─── DEFAULT FALLBACK ────────────────────────────────────
      default: {
        metricUnit = "index (0-100)";
        metricLabel = "Hazard Exposure Score";
        metricValue = 40;
        baselineValue = 20;
        tierLabel = "Moderate";
        severityColor = "#f97316";
        recommendedAction = "Routine monitoring.";
        calculationTrace = "Default baseline screening evaluation.";
      }
    }

    if (qualityStatus === "MISSING_SENSOR_FEED") {
      tierLabel = "Sensor Feed Offline";
      severityColor = "#94a3b8"; // Distinct neutral slate
      metricValue = 0;
      isExceeded = false;
      calculationTrace = "Automatic telemetry feed failure: sensor gateway reporting packet timeout >180s. Transparent neutral no-data style applied.";
      recommendedAction = "Dispatch IoT field maintenance crew to inspect solar battery and telemetry gateway antenna.";
    }

    const deltaPercent = baselineValue > 0
      ? Math.round(((metricValue - baselineValue) / baselineValue) * 100)
      : 0;

    const infra = mumbaiAssetRegistry.getWardInfrastructure(ward.id);
    const exposureSummary = infra.exposureSummary;

    // Defensible exposed population: bounded by actual low-lying saucer depressions
    const severityFactor = metricValue >= 80 ? 1.0 : metricValue >= 60 ? 0.75 : metricValue >= 40 ? 0.45 : metricValue >= 20 ? 0.15 : 0;
    const baseDepressionPop = exposureSummary ? exposureSummary.intersectsDepressionZoneEst : Math.round(ward.populationEst * 0.12);
    const estimatedExposedPopulation = Math.round(baseDepressionPop * severityFactor);

    return {
      wardId: ward.id,
      wardName: ward.name,
      zoneCode: ward.zoneCode,
      zoneName: ward.zoneName,
      metricValue,
      metricUnit,
      metricLabel,
      baselineValue,
      deltaPercent,
      tierLabel,
      severityColor,
      isThresholdExceeded: isExceeded,
      thresholdSource,
      drainageBasin: ward.drainageBasin,
      elevationMeanM,
      isCoastal: ward.isCoastal,
      populationEst: ward.populationEst,
      estimatedExposedPopulation,
      populationExposureMethod: "Areal interpolation of BMC 2011 Census ward populations projected to 2026 intersected with Copernicus GLO-30 DEM depression polygons. Indicates screening zone exposure, NOT confirmed casualties or displaced individuals.",
      exposureBreakdown: exposureSummary,
      terrainSummary: {
        elevationMeanM,
        elevationMinM: terrain?.elevationMinM,
        elevationMaxM: terrain?.elevationMaxM,
        slopeMeanDeg: slopeDeg,
        topographicWetnessIndex: terrain?.topographicWetnessIndex,
        terrainClassification: terrain?.terrainClassification,
        saucerSinksCount: terrain?.saucerDepressionCount || infra.lowLyingAreas.length,
        saucerAreaSqM: terrain?.saucerDepressionAreaSqM,
        demVerticalDatum: "EGM2008 (Mean Sea Level ASL)",
        demResolutionM: 30,
        demLimitations: "Copernicus GLO-30 DEM (~30m mesh) provides macro-topographic basin elevation and saucer depression screening. It is NOT survey-grade street-level LiDAR and cannot independently predict curb-scale ponding without micro-catchment inlet connectivity.",
      },
      intersectingHotspots: ward.floodHotspots,
      pumpingStations: ward.pumpingStations,
      potentiallyExposedHospitals: infra.hospitals.map((h) => ({
        name: h.name,
        type: h.facilityType,
        relationship: h.relationship,
        address: h.address,
        nearestDepression: h.nearestDepression,
        elevationEstimateM: h.elevationEstimateM,
      })),
      potentiallyExposedRoads: infra.roads.map((r) => ({
        name: r.name,
        highwayType: r.highwayType,
        lanes: r.lanes,
        lengthM: r.lengthM,
        intersectsDepression: r.intersectsDepression,
      })),
      lowLyingDepressions: infra.lowLyingAreas.map((l) => ({
        name: l.name,
        elevationMeanM: l.elevationMeanM,
        areaSqM: l.areaSqM,
        source: l.source,
      })),
      disaggregatedVariables: {
        physicalInputs: {
          precipitationRateMmH: hydro.instantaneousRainfallRateMmH,
          accumulatedPrecipMm: hydro.accumulatedRainfallMm,
          astronomicalTideM: hydro.astronomicalTideM,
          ambientTempC: params.ambientTempC,
          windGustKmH: params.gustSpeedKmH,
          pm25Baseline: params.baselinePm25,
          gravityOutfallEfficiencyPct: ward.isCoastal ? hydro.gravityEfficiencyPct : (hasMithi ? Math.max(40, hydro.gravityEfficiencyPct) : 100),
          isSluiceGateLockedOut: hydro.isSluiceLocked && (ward.isCoastal || hasMithi),
          instantaneousRunoffMmH: Math.round((hydro.instantaneousRainfallRateMmH * impFraction) * 10) / 10,
          netRunoffExcessMmH: Math.max(0, Math.round(((hydro.instantaneousRainfallRateMmH * impFraction) - (nominalDrain * (1 - (params.drainageBlockagePct || 15) / 100))) * 10) / 10),
        },
        spatialCharacteristics: {
          elevationMeanM,
          elevationMinM: terrain?.elevationMinM,
          elevationMaxM: terrain?.elevationMaxM,
          slopeMeanDeg: slopeDeg,
          topographicWetnessIndex: terrain?.topographicWetnessIndex,
          isCoastal: ward.isCoastal,
          isSaucerDepression: isSaucer,
          saucerDepressionCount: terrain?.saucerDepressionCount,
          maxDepressionDepthM: depthM,
          hasMithiCorridor: hasMithi,
          imperviousFraction: impFraction,
          nominalDrainCapacityMmH: nominalDrain,
          terrainClassification: terrain?.terrainClassification,
        },
        historicalEvidence: {
          chronicHotspotCount: infra.hotspots.length,
          hotspotLocations: infra.hotspots.map((h) => h.name),
          historicalDepth2005M: ward.id === "L" ? "2.5m - 3.2m (2005 Cloudburst)" : ward.id === "F/South" ? "1.8m - 2.2m (Hindmata 2005)" : undefined,
        },
        hypotheticalParameters: {
          drainageBlockagePct: params.drainageBlockagePct,
          simulatedDurationHours: duration,
          rainfallProfile: hydro.profileType,
        },
        modelAssumptions: [
          `Rainfall profile: ${hydro.profileType} (${hydro.instantaneousRainfallRateMmH} mm/h current rate, ${hydro.accumulatedRainfallMm} mm accumulated).`,
          `Drainage standard: BRIMSTOWAD baseline (${nominalDrain} mm/h nominal capacity).`,
          "Gravity outfall floodgate lockout protocol triggered at astronomical tide >= 4.5m Chart Datum.",
          "Topographic saucer depression weighting based on Copernicus GLO-30 DEM sink analysis.",
          "Screening index represents relative municipal prioritization, NOT physical 2D flood depth in meters.",
        ],
        screeningScoreVsInundationDisclaimer:
          "Tier 2 Screening Simulation: This score is a normalized screening index (0-100) reflecting compound multi-factor vulnerability. It is NOT a calibrated hydrodynamic prediction of water depth in meters or confirmed inundation probability.",
      },
      calculationTrace,
      qualityStatus,
      recommendedAction,
    };
  }

  /**
   * Build structured scenario report for executive review and export
   */
  private buildStructuredReport(
    scenario: ScenarioDefinition,
    params: Record<string, number>,
    baselineMode: string,
    timeStep: number,
    duration: number,
    overallAlert: string,
    meanVal: number,
    peakVal: number,
    peakWardName: string,
    totalExposedPop: number,
    severeWardsCount: number,
    wardImpacts: WardImpactRecord[],
    primaryUnit: string
  ): StructuredScenarioReport {
    const formattedParams: Record<string, { value: number; unit: string; label: string }> = {};
    for (const input of scenario.inputs) {
      formattedParams[input.key] = {
        value: params[input.key] ?? input.defaultValue,
        unit: input.unit,
        label: input.label,
      };
    }

    const topRankedWards = wardImpacts.slice(0, 5).map((w, idx) => ({
      rank: idx + 1,
      wardId: w.wardId,
      wardName: w.wardName,
      zone: w.zoneCode,
      score: w.metricValue,
      unit: w.metricUnit,
      tier: w.tierLabel,
      deltaVsBaseline: w.deltaPercent,
      topHotspots: w.intersectingHotspots.slice(0, 3),
      action: w.recommendedAction,
    }));

    return {
      reportId: `REP-SIM-${scenario.id.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
      generatedAt: new Date().toISOString(),
      scenarioId: scenario.id,
      scenarioTitle: scenario.title,
      modelVersion: "v3.2-mumbai-calibrated",
      modelTier: scenario.tier,
      city: "Mumbai (BMC)",
      baselineMode,
      timeStepSelected: timeStep,
      durationHours: duration,
      parametersApplied: formattedParams,
      overallAlertLevel: overallAlert,
      citywideSummary: {
        meanValue: meanVal,
        peakValue: peakVal,
        peakWard: peakWardName,
        totalExposedPopEst: totalExposedPop,
        severeWardsCount,
      },
      topRankedWards,
      assumptions: scenario.assumptions,
      missingDataAndLimitations: scenario.limitations,
      operationalReviewRecommendations: scenario.recommendedActions,
      disclaimer: "This simulation is an operational screening product (Tier 2). It provides spatial prioritization for municipal staff review. It does NOT assert calibrated water depth in meters or replace official IMD/MCGM emergency broadcasts.",
    };
  }
}

export const simulationEngine = new SimulationEngine();

export function runSimulationTimeStep(params: {
  scenarioId: string;
  timeStepHours: number;
  customParameters?: Record<string, number>;
  selectedWardId?: string;
  baselineMode?: "current_live" | "dry_baseline" | "historical_july2005" | "historical_july2024";
}): SimulationTimeStepOutput {
  const result = simulationEngine.execute({
    scenarioId: params.scenarioId,
    parameters: params.customParameters || {},
    timeStepHours: params.timeStepHours,
    baselineMode: params.baselineMode || "current_live",
  });

  return {
    timeStepHours: result.timeStepHours,
    simulatedTimeIso: new Date().toISOString(),
    timeRatio: result.timeStepHours / (result.maxDurationHours || 1),
    activeScenarioId: result.scenarioId,
    modelVersion: result.modelVersion,
    parametersApplied: result.parametersApplied,
    qualityStatus: result.qualityStatus,
    missingParameters: result.missingParameters,
    continuousSurfaceIsobands: result.continuousSurface.isobandsGeoJSON,
    rankedWards: result.rankedWards,
    summary: result.summary,
    auditTrail: {
      engineVersion: result.auditTrail.engineVersion,
      executedAt: result.auditTrail.executedAt,
      executionTimeMs: result.auditTrail.executionTimeMs,
      scientificFormula: result.auditTrail.scientificFormula,
      limitations: result.auditTrail.limitations,
      uncertaintyNote: result.auditTrail.uncertaintyNote,
    },
  };
}
