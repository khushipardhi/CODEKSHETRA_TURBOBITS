/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Explainable Assessment Engine
   Deterministic 0-100 risk scoring rubric, contributing factors,
   demographic population exposure, and simulation disclosures.
   ════════════════════════════════════════════════════════ */

import { mumbaiFloodAdapter } from "./mumbai-flood-adapter";
import { CityWeatherTelemetry, CityMarineTelemetry, CityRiverFloodTelemetry } from "./connectors/types";

export interface RiskFactor {
  factor: string;
  weightPercent: number;
  value: string;
  scoreContribution: number;
  description: string;
}

export interface AssessmentResult {
  riskScore: number; // 0 to 100
  riskLevel: "LOW" | "MODERATE" | "HIGH" | "SEVERE" | "EXTREME";
  contributingFactors: RiskFactor[];
  explanation: string;
  affectedPopulationApprox: number;
  confidenceScore: number;
  uncertaintyDisclaimer: string;
  isSimulation: boolean;
  recommendedDepartment: string;
}

export interface AssessmentInput {
  city: "mumbai" | "pune" | "nagpur";
  latitude?: number;
  longitude?: number;
  weather: CityWeatherTelemetry;
  marine?: CityMarineTelemetry | null;
  riverDischarge?: CityRiverFloodTelemetry | null;
  activeNearbyReportsCount?: number;
  simulationScenario?: {
    rainfallRateMmH: number;
    durationHours: number;
    tidalSurgeMeters?: number;
  };
}

export function assessCityRisk(input: AssessmentInput): AssessmentResult {
  const { city, weather, marine, riverDischarge, activeNearbyReportsCount = 0, simulationScenario } = input;
  const isSimulation = !!simulationScenario;

  const lat = input.latitude ?? (city === "mumbai" ? 19.0760 : city === "pune" ? 18.5204 : 21.1458);
  const lon = input.longitude ?? (city === "mumbai" ? 72.8777 : city === "pune" ? 73.8567 : 79.0882);

  const rainRate = simulationScenario ? simulationScenario.rainfallRateMmH : weather.rainfallRateMmH;
  const contributingFactors: RiskFactor[] = [];

  let totalScore = 0;

  if (city === "mumbai") {
    // MUMBAI HYDROLOGICAL MODEL
    const hydro = mumbaiFloodAdapter.evaluateLocation(lat, lon);

    // 1. Rainfall intensity (weight 35%)
    let rainScore = 0;
    if (rainRate > 50) rainScore = 100;
    else if (rainRate > 25) rainScore = 70;
    else if (rainRate > 10) rainScore = 30;
    else if (rainRate > 2) rainScore = 10;

    const rainContribution = Math.round(rainScore * 0.35);
    totalScore += rainContribution;
    contributingFactors.push({
      factor: "Precipitation Intensity",
      weightPercent: 35,
      value: `${rainRate.toFixed(1)} mm/hr`,
      scoreContribution: rainContribution,
      description: rainRate > 30 ? "Heavy localized downpour exceeding drainage intake capacity" : "Moderate or light rainfall within normal threshold",
    });

    // 2. Topographic Depression Sink (weight 20%)
    let sinkScore = 0;
    if (hydro.isLowLyingSink) {
      sinkScore = (hydro.depressionDepthMeters ?? 1.0) >= 1.0 ? 100 : 60;
    }
    const sinkContribution = Math.round(sinkScore * 0.20);
    totalScore += sinkContribution;
    contributingFactors.push({
      factor: "Topographic Elevation Sink",
      weightPercent: 20,
      value: hydro.isLowLyingSink ? `Inside Sink (${hydro.sinkName || "Low-Lying Basin"})` : "Natural High Ground",
      scoreContribution: sinkContribution,
      description: hydro.isLowLyingSink ? "Topographic depression prone to gravitational pooling" : "Naturally elevated terrain with positive drainage runoff",
    });

    // 3. Historical Recurrent Hotspot Proximity (weight 20%)
    let hotspotScore = 0;
    if (hydro.nearestHotspot.distanceMeters <= 250) hotspotScore = 100;
    else if (hydro.nearestHotspot.distanceMeters <= 600) hotspotScore = 55;
    else if (hydro.nearestHotspot.distanceMeters <= 1200) hotspotScore = 20;

    const hotspotContribution = Math.round(hotspotScore * 0.20);
    totalScore += hotspotContribution;
    contributingFactors.push({
      factor: "Recurrent Waterlogging Hotspot",
      weightPercent: 20,
      value: `${hydro.nearestHotspot.name} (${hydro.nearestHotspot.distanceMeters}m)`,
      scoreContribution: hotspotContribution,
      description: hydro.nearestHotspot.distanceMeters <= 600 ? `Within immediate influence of recurrent flood chokepoint (${hydro.nearestHotspot.recurrence})` : "Outside critical buffer of historical waterlogging hotspots",
    });

    // 4. Coastal Wave Surge / High Tide (weight 15%)
    const waveHeight = simulationScenario?.tidalSurgeMeters ?? (marine?.waveHeightMeters ?? 0.6);
    let tideScore = 0;
    if (hydro.isCoastalZone) {
      if (waveHeight >= 2.5) tideScore = 100;
      else if (waveHeight >= 1.5) tideScore = 60;
      else if (waveHeight >= 1.0) tideScore = 30;
    }
    const tideContribution = Math.round(tideScore * 0.15);
    totalScore += tideContribution;
    contributingFactors.push({
      factor: "Coastal Wave Surge & Tidal Lock",
      weightPercent: 15,
      value: hydro.isCoastalZone ? `${waveHeight.toFixed(1)}m Wave Height` : "Inland (>1km from coast)",
      scoreContribution: tideContribution,
      description: hydro.isCoastalZone && waveHeight >= 1.5 ? "High coastal swell preventing gravitational nullah gravity outfall" : "Normal coastal discharge conditions or inland location",
    });

    // 5. Active Citizen Reports (weight 10%)
    const reportsScore = Math.min(100, activeNearbyReportsCount * 25);
    const reportsContribution = Math.round(reportsScore * 0.10);
    totalScore += reportsContribution;
    contributingFactors.push({
      factor: "Active Verified Civic Reports",
      weightPercent: 10,
      value: `${activeNearbyReportsCount} reports logged`,
      scoreContribution: reportsContribution,
      description: activeNearbyReportsCount > 0 ? "Confirmed ground waterlogging reports from citizens" : "No active waterlogging reports in current ward",
    });

  } else if (city === "pune") {
    // PUNE INLAND & RIVER MODEL
    // 1. Rainfall rate (40%)
    const rainScore = rainRate > 40 ? 100 : rainRate > 20 ? 60 : rainRate > 5 ? 25 : 0;
    const rainContrib = Math.round(rainScore * 0.40);
    totalScore += rainContrib;
    contributingFactors.push({
      factor: "Precipitation Rate",
      weightPercent: 40,
      value: `${rainRate.toFixed(1)} mm/hr`,
      scoreContribution: rainContrib,
      description: rainRate > 20 ? "Heavy monsoon downpour over Mutha river basin" : "Normal rainfall",
    });

    // 2. River Discharge (30%)
    const discharge = riverDischarge?.riverDischargeM3s ?? 15;
    const dischargeScore = discharge > 100 ? 100 : discharge > 50 ? 65 : discharge > 25 ? 30 : 0;
    const dischargeContrib = Math.round(dischargeScore * 0.30);
    totalScore += dischargeContrib;
    contributingFactors.push({
      factor: "Mula-Mutha River Discharge",
      weightPercent: 30,
      value: `${discharge.toFixed(1)} m³/s`,
      scoreContribution: dischargeContrib,
      description: discharge > 50 ? "Elevated river flow; riverside ghats at risk" : "River discharge within regulated capacity",
    });

    // 3. Citizen Reports (30%)
    const reportsScore = Math.min(100, activeNearbyReportsCount * 30);
    const reportsContrib = Math.round(reportsScore * 0.30);
    totalScore += reportsContrib;
    contributingFactors.push({
      factor: "Citizen Road & Water Reports",
      weightPercent: 30,
      value: `${activeNearbyReportsCount} active reports`,
      scoreContribution: reportsContrib,
      description: activeNearbyReportsCount > 0 ? "Civic waterlogging reports near Sinhagad or Karve Road" : "Normal civic flow",
    });

  } else {
    // NAGPUR URBAN MODEL
    // 1. Rainfall / Stormwater (50%)
    const rainScore = rainRate > 45 ? 100 : rainRate > 20 ? 65 : rainRate > 5 ? 25 : 0;
    const rainContrib = Math.round(rainScore * 0.50);
    totalScore += rainContrib;
    contributingFactors.push({
      factor: "Stormwater Rainfall Rate",
      weightPercent: 50,
      value: `${rainRate.toFixed(1)} mm/hr`,
      scoreContribution: rainContrib,
      description: rainRate > 25 ? "Intense storm exceeding Nag river and Pili river runoff" : "Normal precipitation",
    });

    // 2. Heatwave / Temperature (30%)
    const temp = weather.temperatureCelsius;
    const effectiveTemp = temp ?? 28;
    const heatScore = effectiveTemp >= 45 ? 100 : effectiveTemp >= 42 ? 70 : effectiveTemp >= 38 ? 35 : 0;
    const heatContrib = Math.round(heatScore * 0.30);
    totalScore += heatContrib;
    contributingFactors.push({
      factor: "Heatwave Index",
      weightPercent: 30,
      value: temp !== null ? `${temp.toFixed(1)}°C` : "Unavailable",
      scoreContribution: heatContrib,
      description: effectiveTemp >= 42 ? "Extreme heat alert; risk of dehydration and heatstroke" : "Normal seasonal temperature",
    });

    // 3. Citizen Reports (20%)
    const reportsScore = Math.min(100, activeNearbyReportsCount * 25);
    const reportsContrib = Math.round(reportsScore * 0.20);
    totalScore += reportsContrib;
    contributingFactors.push({
      factor: "Civic Hazard Reports",
      weightPercent: 20,
      value: `${activeNearbyReportsCount} active reports`,
      scoreContribution: reportsContrib,
      description: activeNearbyReportsCount > 0 ? "Civic complaints registered with NMC" : "Clear civic status",
    });
  }

  // Cap total score to 100
  const finalScore = Math.min(100, Math.max(0, totalScore));

  // Determine Risk Level
  let riskLevel: AssessmentResult["riskLevel"] = "LOW";
  if (finalScore >= 90) riskLevel = "EXTREME";
  else if (finalScore >= 75) riskLevel = "SEVERE";
  else if (finalScore >= 60) riskLevel = "HIGH";
  else if (finalScore >= 30) riskLevel = "MODERATE";

  // Estimated demographic population exposure (ward level baseline ~35k-50k per affected zone)
  let affectedPopulationApprox = 0;
  if (riskLevel === "EXTREME") affectedPopulationApprox = 85000;
  else if (riskLevel === "SEVERE") affectedPopulationApprox = 48000;
  else if (riskLevel === "HIGH") affectedPopulationApprox = 18000;
  else if (riskLevel === "MODERATE") affectedPopulationApprox = 5000;

  // Department recommendation
  let recommendedDepartment = "drainage";
  if (weather.temperatureCelsius !== null && weather.temperatureCelsius >= 42) recommendedDepartment = "health_dept";
  else if (riskLevel === "EXTREME" || riskLevel === "SEVERE") recommendedDepartment = "fire_brigade";

  // Explanation narrative
  const explanation = isSimulation
    ? `[SIMULATION SCENARIO] Under a simulated ${rainRate} mm/h precipitation model, composite risk evaluates to ${finalScore}/100 (${riskLevel}). Primary stress factor: ${contributingFactors[0]?.factor}.`
    : `Composite multi-hazard risk for ${city.toUpperCase()} evaluates to ${finalScore}/100 (${riskLevel}). Key drivers: ${contributingFactors.map(f => `${f.factor} (${f.value})`).slice(0, 3).join(", ")}.`;

  return {
    riskScore: finalScore,
    riskLevel,
    contributingFactors,
    explanation,
    affectedPopulationApprox,
    confidenceScore: isSimulation ? 0.85 : 0.95,
    uncertaintyDisclaimer: isSimulation
      ? "SIMULATION SCENARIO: Illustrative stress-test based on synthetic input parameters. Not an active emergency."
      : "Ground observations may exhibit micro-climatic variation. Subsurface stormwater pipe pressures are unmodeled.",
    isSimulation,
    recommendedDepartment,
  };
}
