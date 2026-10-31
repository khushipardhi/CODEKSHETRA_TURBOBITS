/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Dossier Evidence Package Builder
   Phase 3: Deterministic Data Extraction for Groq AI Grounding
   ════════════════════════════════════════════════════════ */

import type { SimulationTimeStepOutput } from "../simulation/contracts";
import type { EvidencePackage } from "./contracts";
import { mumbaiAssetRegistry } from "../geo/mumbai-assets";
import { getScenarioDefinition } from "../simulation/scenario-registry";

export const CANONICAL_SOURCE_IDS = [
  "SRC_COPERNICUS_GLO30",
  "SRC_MCGM_HOTSPOTS_2024",
  "SRC_OPENMETEO_HRRR",
  "SRC_NDMA_SACHET_RSS",
  "SRC_CENSUS_2011_PROJECTED_2026",
  "SRC_MCGM_HOSPITALS_GIS",
  "SRC_MCGM_ROADS_GIS",
  "SRC_MCGM_SWD_PUMPS",
];

export function buildEvidencePackage(params: {
  simOutput: SimulationTimeStepOutput;
  selectedWardId?: string;
}): EvidencePackage {
  const { simOutput, selectedWardId } = params;
  const scenarioDef = getScenarioDefinition(simOutput.activeScenarioId);

  // Format applied parameters
  const parametersApplied: Record<string, { value: number; unit: string; label: string }> = {};
  if (scenarioDef) {
    for (const p of scenarioDef.inputs) {
      const val = simOutput.parametersApplied[p.key] ?? p.defaultValue;
      parametersApplied[p.key] = {
        value: val,
        unit: p.unit,
        label: p.label,
      };
    }
  }

  // Top 5 ranked wards
  const top5 = simOutput.rankedWards.slice(0, 5).map((w, idx) => {
    const infra = mumbaiAssetRegistry.getWardInfrastructure(w.wardId);
    return {
      rank: idx + 1,
      wardId: w.wardId,
      wardName: w.wardName,
      zone: w.zoneName,
      score: w.metricValue,
      unit: w.metricUnit,
      tier: w.tierLabel,
      deltaVsBaseline: w.deltaPercent,
      elevationMeanM: w.elevationMeanM,
      isCoastal: w.isCoastal,
      chronicHotspots: w.intersectingHotspots || [],
      pumpingStations: w.pumpingStations || [],
      hospitalsCount: infra.hospitals.length,
      hospitalNames: infra.hospitals.map((h) => h.name),
      roadsCount: infra.roads.length,
      roadNames: infra.roads.map((r) => r.name),
      depressionsCount: infra.lowLyingAreas.length,
      depressionNames: infra.lowLyingAreas.map((d) => d.name),
      populationEst: w.populationEst,
      estimatedExposedPopulation: w.estimatedExposedPopulation,
    };
  });

  // Selected ward detailed record
  let selectedWardDetail: EvidencePackage["selectedWardDetail"] = undefined;
  if (selectedWardId) {
    const wardRec = simOutput.rankedWards.find(
      (w) => w.wardId.toUpperCase() === selectedWardId.toUpperCase()
    );
    if (wardRec) {
      const infra = mumbaiAssetRegistry.getWardInfrastructure(wardRec.wardId);
      selectedWardDetail = {
        wardId: wardRec.wardId,
        wardName: wardRec.wardName,
        zone: wardRec.zoneName,
        score: wardRec.metricValue,
        baselineValue: wardRec.baselineValue,
        deltaPercent: wardRec.deltaPercent,
        elevationMeanM: wardRec.elevationMeanM,
        isCoastal: wardRec.isCoastal,
        drainageBasin: wardRec.drainageBasin,
        calculationTrace: wardRec.calculationTrace,
        hospitals: infra.hospitals.map((h) => ({
          name: h.name,
          type: h.facilityType,
          address: h.address,
        })),
        roads: infra.roads.map((r) => ({
          name: r.name,
          highwayType: r.highwayType,
          lanes: r.lanes,
        })),
        depressions: infra.lowLyingAreas.map((d) => ({
          name: d.name,
          elevationMeanM: d.elevationMeanM,
          areaSqM: d.areaSqM,
          source: d.source,
        })),
        hotspots: wardRec.intersectingHotspots || [],
        pumpingStations: wardRec.pumpingStations || [],
        populationEst: wardRec.populationEst,
        estimatedExposedPopulation: wardRec.estimatedExposedPopulation,
      };
    }
  }

  return {
    meta: {
      scenarioId: simOutput.activeScenarioId,
      scenarioTitle: scenarioDef ? scenarioDef.title : "Multi-Hazard Simulation",
      timeStepHours: simOutput.timeStepHours,
      timestampIso: simOutput.simulatedTimeIso,
      city: "Greater Mumbai",
      selectedWardId,
    },
    parametersApplied,
    citywideSummary: {
      totalWards: simOutput.summary.totalWardsEvaluated,
      meanScore: simOutput.summary.meanCityValue,
      peakScore: simOutput.summary.peakCityValue,
      peakWard: simOutput.summary.peakWardName,
      overallAlertLevel: simOutput.summary.overallAlertLevel,
      totalExposedPopEst: simOutput.summary.estimatedTotalExposedPopulation,
      severeCount: simOutput.summary.wardsInSevereTier,
    },
    topRankedWards: top5,
    selectedWardDetail,
    knownSourceIds: CANONICAL_SOURCE_IDS,
  };
}
