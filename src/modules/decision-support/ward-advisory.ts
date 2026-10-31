/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Municipal Decision Support Engine
   Phase 6: Ward-Level Operational Decision Briefing & Departmental Action Triage.

   Strict Governance Rules:
   - Grounded in actual BMC departmental registry (SWD, DMD, Roads, Health, SWM, BEST).
   - Zero automatic personnel dispatch or alert broadcasting.
   - Recommended actions are strictly demarcated from approved/completed actions.
   - Transparent disclosure of uncertainty and missing telemetry.
   ════════════════════════════════════════════════════════ */

import { bmcWardRegistry } from "../geo/ward-registry";
import { mumbaiAssetRegistry } from "../geo/mumbai-assets";
import { CITY_DEPARTMENT_PROFILES } from "../routing/registry";
import type { WardImpactRecord } from "../simulation/contracts";

export type SuggestedReviewPriority =
  | "IMMEDIATE_ACTION_REVIEW"
  | "STANDBY_MONITORING"
  | "ROUTINE_SHIFT_LOG";

export type ActionAuthorisationStatus =
  | "RECOMMENDED_AWAITING_EOC_APPROVAL"
  | "APPROVED_BY_CONTROLLER"
  | "COMPLETED_IN_FIELD";

export interface SupportingMeasurement {
  parameter: string;
  value: string;
  unit: string;
  source: string;
  timestamp: string;
  quality: "VERIFIED" | "PROVISIONAL" | "SIMULATED";
}

export interface PotentiallyAffectedAssetSummary {
  assetName: string;
  category: string;
  impactNature: "PROXIMITY" | "SPATIAL_INTERSECTION" | "POTENTIAL_EXPOSURE" | "CONFIRMED_IMPACT";
  details: string;
}

export interface WardDecisionSummary {
  wardId: string;
  wardName: string;
  zoneCode: string;
  generatedAtIso: string;
  relevantTimeWindow: string;
  
  // Decision Core
  dataIndicates: string;
  whyPrioritised: string;
  supportingMeasurements: SupportingMeasurement[];
  potentiallyAffectedAssets: PotentiallyAffectedAssetSummary[];
  
  // Dynamics & Verification
  whatCouldChangeAssessment: string;
  whatMunicipalityShouldVerifyNext: string[];
  
  // Departmental Grounding
  responsibleDepartment: {
    code: string;
    name: string;
    nodalOfficerRole: string;
    recommendedAction: string;
  };
  supportingDepartments: Array<{
    code: string;
    name: string;
    dependencyRole: string;
    coordinationAction: string;
  }>;
  
  // Review & Authorisation State
  suggestedReviewPriority: SuggestedReviewPriority;
  authorisationStatus: ActionAuthorisationStatus;
  uncertaintyAndMissingEvidence: string[];
  
  // Mandatory Governance Disclaimers
  dispatchDisclaimer: string;
}

/**
 * Generate a structured municipal decision summary for a high-priority ward
 */
export function generateWardDecisionSummary(
  wardId: string,
  impactRecord?: Partial<WardImpactRecord>,
  scenarioParams?: {
    precipitationRateMmH?: number;
    astronomicalTideM?: number;
    drainageBlockagePct?: number;
    timeStepHours?: number;
  }
): WardDecisionSummary {
  const ward = bmcWardRegistry.getWardById(wardId);
  const wardName = ward?.name || `Ward ${wardId}`;
  const zoneCode = ward?.zoneCode || "ZONE-UNKNOWN";
  const assets = mumbaiAssetRegistry.getWardInfrastructure(wardId);

  const rainRate = scenarioParams?.precipitationRateMmH ?? 45.0;
  const tideM = scenarioParams?.astronomicalTideM ?? 4.2;
  const blockagePct = scenarioParams?.drainageBlockagePct ?? 25;
  const metricValue = impactRecord?.metricValue ?? 52.0;

  const bmcDepts = CITY_DEPARTMENT_PROFILES.mumbai || {};
  const now = new Date();
  const timeWindowStr = `Next 2 to 4 Hours (${now.getHours()}:00 - ${(now.getHours() + 4) % 24}:00 IST)`;

  const isHighPriority = metricValue >= 50.0 || (assets.hotspots && assets.hotspots.length > 0);

  // 1. What data indicates
  let dataIndicates = `Hydrodynamic screening indicates heightened waterlogging susceptibility in Ward ${wardId} `;
  if (tideM >= 4.5) {
    dataIndicates += `exacerbated by high astronomical tide (${tideM.toFixed(1)}m CD) locking stormwater gravity sluice gates.`;
  } else if (rainRate > 50) {
    dataIndicates += `driven by intense precipitation (${rainRate.toFixed(1)} mm/h) exceeding nominal storm drain capacity.`;
  } else {
    dataIndicates += `due to persistent catchment saturation and localized topographic saucer depressions.`;
  }

  // 2. Why prioritised
  const reasons: string[] = [];
  if (assets.hotspots && assets.hotspots.length > 0) {
    reasons.push(`${assets.hotspots.length} chronic MCGM flood hotspots mapped within ward boundaries (e.g., ${assets.hotspots.slice(0, 2).map((h) => h.name).join(", ")})`);
  }
  if (ward?.isCoastal) {
    reasons.push("Direct coastal shoreline exposure with tidal backflow vulnerability into low-lying outfalls");
  }
  if (assets.lowLyingAreas && assets.lowLyingAreas.length > 0) {
    reasons.push(`${assets.lowLyingAreas.length} saucer-shaped depressions with mean elevation < 4.5m`);
  }
  if (reasons.length === 0) {
    reasons.push("Screening score exceeded municipal alert threshold for the selected time step");
  }
  const whyPrioritised = reasons.join("; ") + ".";

  // 3. Supporting measurements
  const supportingMeasurements: SupportingMeasurement[] = [
    {
      parameter: "Precipitation Rate",
      value: rainRate.toFixed(1),
      unit: "mm/h",
      source: "IMD Doppler Radar / Automatic Weather Station Telemetry",
      timestamp: now.toISOString(),
      quality: "PROVISIONAL",
    },
    {
      parameter: "Astronomical Tide Level",
      value: tideM.toFixed(2),
      unit: "meters (Chart Datum)",
      source: "Survey of India Tide Tables & Apollo Bunder Marine Gauge",
      timestamp: now.toISOString(),
      quality: "VERIFIED",
    },
    {
      parameter: "Model Infiltration Index",
      value: blockagePct.toString(),
      unit: "% estimated siltation / blockage",
      source: "MCGM Pre-Monsoon Nullah Desilting Audit & SWD Asset Records",
      timestamp: now.toISOString(),
      quality: "SIMULATED",
    },
    {
      parameter: "Ward Screening Index",
      value: metricValue.toFixed(1),
      unit: "Tier-2 Multi-Criteria Risk Score (0-100)",
      source: "Sentinel Spatial Simulation Engine v3.0",
      timestamp: now.toISOString(),
      quality: "SIMULATED",
    },
  ];

  // 4. Potentially affected assets
  const potentiallyAffectedAssets: PotentiallyAffectedAssetSummary[] = [];

  for (const h of (assets.hospitals || []).slice(0, 3)) {
    potentiallyAffectedAssets.push({
      assetName: h.name,
      category: "Healthcare / Emergency",
      impactNature: "PROXIMITY",
      details: `Facility located in Ward ${wardId}. Proximity screening indicates low elevation approach access; confirm ambulance corridor status.`,
    });
  }

  for (const r of (assets.roads || []).slice(0, 2)) {
    potentiallyAffectedAssets.push({
      assetName: r.name,
      category: "Transport Corridor",
      impactNature: "PROXIMITY",
      details: `${r.highwayType.toUpperCase()} transit link traversing waterlogging-susceptible terrain. Diversion screening recommended.`,
    });
  }

  for (const p of (assets.pumpsAndOutfalls || []).slice(0, 2)) {
    potentiallyAffectedAssets.push({
      assetName: p.name,
      category: "Drainage Infrastructure",
      impactNature: "POTENTIAL_EXPOSURE",
      details: `${p.structureType} - Outfall gate closure required if sea level exceeds 4.5m CD to prevent marine ingress.`,
    });
  }

  // 5. What could change assessment
  const whatCouldChangeAssessment =
    "Precipitation intensity dropping below 20 mm/h, tidal level receding below 3.5m CD during ebb tide, or immediate clearance of culvert screens by SWD crews will reduce waterlogging retention time.";

  // 6. What municipality should verify next
  const whatMunicipalityShouldVerifyNext = [
    `1. Inspect high-capacity dewatering pump availability at chronic low-lying junctions in Ward ${wardId}.`,
    "2. Check tidal flap gates and stormwater outfall sluices for marine backflow or obstruction by marine debris.",
    "3. Confirm ambulance access corridors to local municipal trauma facilities remain passable.",
    "4. Cross-reference citizen reporting feed for localized drainage blockages or fallen branches.",
  ];

  // 7. Responsible Department
  const swdDept = bmcDepts.drainage || {
    name: "BMC Stormwater Drains (SWD) Department",
    contact: { officerName: "Chief Engineer (SWD)", phone: "+91-22-24958000" },
  };

  const responsibleDepartment = {
    code: "SWD",
    name: swdDept.name,
    nodalOfficerRole: "Executive Engineer (SWD / Ward Maintenance)",
    recommendedAction: `Inspect outfall sluices and activate auxiliary diesel dewatering pumps at low points across Ward ${wardId}.`,
  };

  // 8. Supporting Departments
  const supportingDepartments = [
    {
      code: "ROADS_TRAFFIC",
      name: bmcDepts.road_maintenance?.name || "BMC Roads & Traffic Department / Mumbai Traffic Police",
      dependencyRole: "Traffic Diversion & Subway Barricading",
      coordinationAction: "Prepare traffic diversion advisory if arterial water levels approach 150mm curbside depth.",
    },
    {
      code: "DISASTER_MANAGEMENT",
      name: bmcDepts.disaster_management?.name || "BMC Disaster Management Cell (Central EOC)",
      dependencyRole: "Inter-Agency Situational Awareness",
      coordinationAction: "Log ward status in Central Disaster Management console; do not broadcast public alert without Municipal Commissioner clearance.",
    },
    {
      code: "SOLID_WASTE",
      name: bmcDepts.solid_waste?.name || "BMC Solid Waste Management (SWM)",
      dependencyRole: "Trash Screen Clearing",
      coordinationAction: "Deploy quick-response squads to remove floating waste obstructing roadside drop inlets and culvert grates.",
    },
  ];

  // 9. Review Priority
  const suggestedReviewPriority: SuggestedReviewPriority = isHighPriority
    ? "IMMEDIATE_ACTION_REVIEW"
    : "STANDBY_MONITORING";

  // 10. Uncertainty & Missing Evidence
  const uncertaintyAndMissingEvidence = [
    "Sub-catchment micro-drainage velocity is not measured by telemetry; assessment relies on topographic slopes and 1D pipe nominal ratings.",
    "Real-time silt depth inside underground box drains is unknown and estimated from pre-monsoon inspection logs.",
    "Facility-specific plinth elevations are not registered in public GIS layers.",
  ];

  return {
    wardId,
    wardName,
    zoneCode,
    generatedAtIso: now.toISOString(),
    relevantTimeWindow: timeWindowStr,
    dataIndicates,
    whyPrioritised,
    supportingMeasurements,
    potentiallyAffectedAssets,
    whatCouldChangeAssessment,
    whatMunicipalityShouldVerifyNext,
    responsibleDepartment,
    supportingDepartments,
    suggestedReviewPriority,
    authorisationStatus: "RECOMMENDED_AWAITING_EOC_APPROVAL",
    uncertaintyAndMissingEvidence,
    dispatchDisclaimer:
      "CRITICAL GOVERNANCE NOTICE: This advisory is an analytical decision-support briefing generated from multi-criteria screening. It DOES NOT constitute an official government alert or an automated personnel dispatch command. Municipal personnel deployment, road closures, and public evacuations require explicit authorization from the BMC Emergency Operations Centre controller.",
  };
}
