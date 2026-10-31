/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Hazard Scenario Registry
   Master Catalogue of Multi-Hazard Spatial Simulation Scenarios.
   
   Enforces:
   - 3-Tier Model Readiness Architecture
   - Explicit Parameter Contracts & Permitted Ranges
   - Scientific Formulas, Inputs & Required Datasets
   - Strict Disclaimers & Non-Hydrodynamic Screening Boundaries
   - Administrative Review vs Public Guidance Classification
   ════════════════════════════════════════════════════════ */

export type ModelReadinessTier =
  | "TIER_1_OBSERVED_FORECAST"      // Observed / forecast overlay without unverified inundation claims
  | "TIER_2_SCREENING_SIMULATION"   // Transparent, reproducible multi-variable screening index
  | "TIER_3_VALIDATED_HYDRODYNAMIC"; // Calibrated 2D hydrodynamic solver (Saint-Venant / Shallow Water)

export interface ScenarioParameterDef {
  key: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  description: string;
}

export interface ScenarioDefinition {
  id: string;
  title: string;
  category: "rainfall_waterlogging" | "coastal_surge" | "drainage" | "heat" | "wind" | "air_quality";
  tier: ModelReadinessTier;
  suitability: "ADMIN_EXPLORATORY_ANALYSIS" | "OPERATIONAL_SCREENING" | "PUBLIC_GUIDANCE";
  description: string;
  inputs: ScenarioParameterDef[];
  outputVariables: {
    key: string;
    label: string;
    unit: string;
    colorScale: "rainfall" | "susceptibility" | "heat" | "air_quality" | "coastal_surge" | "wind";
  }[];
  scientificFormula: string;
  assumptions: string[];
  limitations: string[];
  requiredDatasets: string[];
  recommendedActions: string[];
}

export const SCENARIO_REGISTRY: Record<string, ScenarioDefinition> = {
  // ─── SCENARIO A: RAINFALL & WATERLOGGING SCREENING ────────────
  rainfall_waterlogging: {
    id: "rainfall_waterlogging",
    title: "Scenario A: Monsoon Downpour & Low-Lying Waterlogging",
    category: "rainfall_waterlogging",
    tier: "TIER_2_SCREENING_SIMULATION",
    suitability: "OPERATIONAL_SCREENING",
    description: "Evaluates localized urban waterlogging susceptibility across 24 BMC administrative wards by combining scenario precipitation rates, accumulated rainfall, impervious surface fractions, topographic depression depth, and proximity to major nullahs.",
    inputs: [
      {
        key: "rainfallRateMmH",
        label: "Scenario Precipitation Rate",
        unit: "mm/h",
        min: 0,
        max: 120,
        step: 5,
        defaultValue: 45,
        description: "Uniform or convective rainfall intensity across Greater Mumbai",
      },
      {
        key: "durationHours",
        label: "Event Duration",
        unit: "hours",
        min: 1,
        max: 12,
        step: 1,
        defaultValue: 3,
        description: "Duration of the high-intensity monsoon burst",
      },
      {
        key: "drainageBlockagePct",
        label: "Culvert & Nullah Siltation",
        unit: "%",
        min: 0,
        max: 75,
        step: 5,
        defaultValue: 15,
        description: "Estimated reduction in stormwater discharge capacity due to floating debris or pre-monsoon siltation",
      },
      {
        key: "rainfallProfile",
        label: "Temporal Rainfall Profile",
        unit: "profile",
        min: 0,
        max: 2,
        step: 1,
        defaultValue: 0,
        description: "0 = Constant Rate What-If; 1 = Chicago Convective Peak Storm; 2 = Historical 2005 Cloudburst Hyetograph",
      },
    ],
    outputVariables: [
      { key: "waterloggingSusceptibility", label: "Waterlogging Susceptibility Index", unit: "index (0-100)", colorScale: "susceptibility" },
      { key: "accumulatedRainfall", label: "Accumulated Rainfall", unit: "mm", colorScale: "rainfall" },
      { key: "runoffExcessMmH", label: "Runoff Generation Excess", unit: "mm/h", colorScale: "rainfall" },
    ],
    scientificFormula: "S_pond(t) = min(100, 0.35 * (P_excess(t) / 45 * 100) + 0.25 * D_topo + 0.20 * H_hotspot + 0.15 * d_drainage + 0.05 * S_accum(t))",
    assumptions: [
      "Impervious surface runoff coefficient I ranges from 0.70 to 0.92 across Mumbai wards (ESA WorldCover 10m).",
      "Base stormwater drainage design capacity C is calibrated to BRIMSTOWAD baseline (25 mm/h Island City; 50 mm/h Suburban).",
      "Topographic saucer depression factor D_topo derived from Copernicus 30m GLO-30 DEM sinks and slope gradients.",
      "Tidal sluice gate backwater lockout triggered when astronomical tide >= 4.5m Chart Datum.",
    ],
    limitations: [
      "Screening model only: Identifies relative spatial susceptibility and priority inspection zones.",
      "Does NOT predict exact water inundation depth in meters or flood wave arrival times in minutes.",
      "Lacks 2D Saint-Venant hydraulic routing; dynamic backwater curve effects are simplified.",
      "Copernicus 30m DEM provides basin-level screening; cannot independently predict curb-scale street ponding without micro-inlet elevations.",
    ],
    requiredDatasets: [
      "data/mumbai/mumbai_bmc_wards.geojson",
      "data/mumbai/terrain/mumbai_ward_terrain_profiles.json",
      "data/mumbai/flood_spatial/mumbai_flood_hotspots.geojson",
      "data/mumbai/flood_spatial/mumbai_public_drainage_network.geojson",
      "data/mumbai/flood_spatial/mumbai_low_lying_areas.geojson",
      "data/mumbai/flood_spatial/mumbai_impervious_surface.geojson",
    ],
    recommendedActions: [
      "Pre-position high-capacity mobile dewatering pumps at Hindmata, Gandhi Market, Milan Subway, and Andheri Subway.",
      "Alert MCGM Stormwater Drainage (SWD) control room and deploy ward cleanup crews to clear trash racks.",
      "Issue localized traffic diversion advisories for subways and low-lying railway underpasses.",
    ],
  },

  // ─── SCENARIO B: RAINFALL ACCUMULATION ────────────────────────
  rainfall_accumulation: {
    id: "rainfall_accumulation",
    title: "Scenario B: Multi-Horizon Precipitation Accumulation Field",
    category: "rainfall_waterlogging",
    tier: "TIER_1_OBSERVED_FORECAST",
    suitability: "PUBLIC_GUIDANCE",
    description: "Computes strictly verified 1h, 3h, 6h, 12h, and 24h continuous rolling rainfall fields without double counting or zero-filled fallbacks.",
    inputs: [
      {
        key: "hourlyPrecipMm",
        label: "Peak Hourly Precipitation",
        unit: "mm/h",
        min: 0,
        max: 100,
        step: 5,
        defaultValue: 35,
        description: "Hourly rain rate for progressive accumulation simulation",
      },
      {
        key: "timeStepHours",
        label: "Simulated Horizon",
        unit: "hours",
        min: 1,
        max: 24,
        step: 1,
        defaultValue: 6,
        description: "Accumulation aggregation window",
      },
    ],
    outputVariables: [
      { key: "rollingAccumulation", label: "Rolling Accumulated Rainfall", unit: "mm", colorScale: "rainfall" },
      { key: "rainIntensityTier", label: "IMD Rainfall Severity Tier", unit: "category", colorScale: "rainfall" },
    ],
    scientificFormula: "R_W[t] = sum_{k=0}^{W-1} P[t-k], where missing hours are explicitly flagged rather than treated as 0 mm.",
    assumptions: [
      "Spatial rainfall field interpolated across 24 BMC ward centroid feeds using Inverse Distance Weighting (alpha = 2).",
      "IMD rainfall classification: Moderate (15.6-64.4 mm/d), Heavy (64.5-115.5 mm/d), Very Heavy (115.6-204.4 mm/d), Extremely Heavy (> 204.4 mm/d).",
    ],
    limitations: [
      "Simplified spatial screening: Radar-derived spatial variability is approximated via inverse distance weighting of available point feeds without uncalibrated 3D atmospheric assimilation.",
    ],
    requiredDatasets: [
      "data/mumbai/mumbai_bmc_wards.geojson",
    ],
    recommendedActions: [
      "Activate MCGM Monsoon Control Desk when 3-hour accumulation exceeds 80 mm.",
    ],
  },

  // ─── SCENARIO C: COASTAL MONSOON SURGE & SLUICE LOCKOUT ───────
  coastal_monsoon_surge: {
    id: "coastal_monsoon_surge",
    title: "Scenario C: Arabian Sea High Tide & Storm Sluice Interlock",
    category: "coastal_surge",
    tier: "TIER_2_SCREENING_SIMULATION",
    suitability: "OPERATIONAL_SCREENING",
    description: "Simulates the combined coincidence of intense monsoon downpour with an astronomical high tide (> 4.5 meters). Evaluates the mandatory closure of gravity outfall floodgates at Lovegrove, Cleave Land, Haji Ali, and Britannia, forcing reliance on mechanical pumping.",
    inputs: [
      {
        key: "rainfallRateMmH",
        label: "Rainfall Intensity",
        unit: "mm/h",
        min: 10,
        max: 100,
        step: 5,
        defaultValue: 50,
        description: "Concurrent monsoon precipitation rate",
      },
      {
        key: "highTideMeters",
        label: "Astronomical High Tide Height",
        unit: "meters",
        min: 3.0,
        max: 5.5,
        step: 0.1,
        defaultValue: 4.65,
        description: "Predicted astronomical spring high tide level above Chart Datum (CD)",
      },
      {
        key: "waveSurgeMeters",
        label: "Arabian Sea Swell / Surge",
        unit: "meters",
        min: 0.5,
        max: 4.0,
        step: 0.2,
        defaultValue: 2.4,
        description: "Significant wave height and coastal surge elevation",
      },
    ],
    outputVariables: [
      { key: "sluiceLockoutSusceptibility", label: "Coastal Sluice Lockout Hazard", unit: "index (0-100)", colorScale: "coastal_surge" },
      { key: "waterloggingSusceptibility", label: "Compound Flood Risk", unit: "index (0-100)", colorScale: "susceptibility" },
    ],
    scientificFormula: "If HighTide >= 4.5m, SluiceState = CLOSED; ResidualDischarge = min(PumpingCapacity, Inflow); CoastalImpact = S_base * (1 + 0.65 * (HighTide - 4.5) / 1.0)",
    assumptions: [
      "All gravity outfalls along the 143 km Mumbai coastline must be shut when sea level exceeds 4.5m CD to prevent seawater backflow into municipal streets.",
      "Island City coastal wards (A, C, D, E, F/South, G/South) and Mahim Bay (G/North) experience severe discharge retardation.",
    ],
    limitations: [
      "Screening simulation: Tidal heights are based on astronomical tables and ECMWF WAM wave model estimates without calibrated 2D coastal hydrodynamic wave runup or overtopping models.",
      "Does not model coastal seawall overtopping or wave runup on promenades.",
    ],
    requiredDatasets: [
      "data/mumbai/mumbai_bmc_wards.geojson",
      "data/mumbai/flood_spatial/mumbai_drainage_structures.geojson",
      "data/mumbai/flood_spatial/mumbai_coastal_exposure.geojson",
    ],
    recommendedActions: [
      "Sound sirens and close all seaface floodgates at Lovegrove, Cleave Land, Haji Ali, and Britannia 30 minutes prior to high tide peak.",
      "Switch on all backup diesel generators at pumping stations; verify standby fuel capacity for 12 hours continuous run.",
      "Prohibit public and tourist access to Marine Drive, Worli Seaface, Dadar Chowpatty, and Bandstand during high tide window.",
    ],
  },

  // ─── SCENARIO D: DRAINAGE STRESS & CHOKEPOINT BLOCKAGE ────────
  drainage_stress_blockage: {
    id: "drainage_stress_blockage",
    title: "Scenario D: Drainage Corridor Siltation & Chokepoint Failure",
    category: "drainage",
    tier: "TIER_2_SCREENING_SIMULATION",
    suitability: "ADMIN_EXPLORATORY_ANALYSIS",
    description: "Enables municipal engineers to stress-test hypothetical chokepoints and trash-rack blockages along the Mithi River, Oshiwara River, Poisar River, and Dahisar River nullahs.",
    inputs: [
      {
        key: "rainfallRateMmH",
        label: "Precipitation Rate",
        unit: "mm/h",
        min: 10,
        max: 80,
        step: 5,
        defaultValue: 40,
        description: "Monsoon precipitation rate during drainage test",
      },
      {
        key: "corridorBlockagePct",
        label: "Major Nullah Blockage",
        unit: "%",
        min: 0,
        max: 80,
        step: 5,
        defaultValue: 35,
        description: "Hypothetical reduction in open nullah cross-sectional conveyance",
      },
    ],
    outputVariables: [
      { key: "drainageStressIndex", label: "Drainage Conveyance Stress", unit: "index (0-100)", colorScale: "susceptibility" },
    ],
    scientificFormula: "Stress = min(100, (Inflow / (Conveyance_base * (1 - Blockage))) * 50)",
    assumptions: [
      "Base conveyance derived from BMC BRIMSTOWAD master nullah cross-sections.",
      "Upstream wards along Mithi River (L Ward Kurla, Sakinaka, K/East) face rapid backwater accumulation.",
    ],
    limitations: [
      "Uncalibrated screening simulation: Blockage percentage is an exploratory scenario parameter, not a measured sensor state.",
    ],
    requiredDatasets: [
      "data/mumbai/mumbai_bmc_wards.geojson",
      "data/mumbai/flood_spatial/mumbai_public_drainage_network.geojson",
      "data/mumbai/flood_spatial/mumbai_bridges_culverts.geojson",
    ],
    recommendedActions: [
      "Dispatch hydraulic excavator pontoons to clear floating solid waste from Kurla Kamani and Mithi River Filter Basin.",
    ],
  },

  // ─── SCENARIO E: EXTREME HEAT STRESS & EXPOSURE ───────────────
  extreme_heat_stress: {
    id: "extreme_heat_stress",
    title: "Scenario E: Urban Heat Island & Extreme Thermal Exposure",
    category: "heat",
    tier: "TIER_2_SCREENING_SIMULATION",
    suitability: "OPERATIONAL_SCREENING",
    description: "Evaluates human thermal stress across dense urban settlements in Mumbai using the official NOAA Rothfusz Heat Index with Steadman adjustments and urban density factors.",
    inputs: [
      {
        key: "ambientTempC",
        label: "Ambient Temperature",
        unit: "°C",
        min: 25,
        max: 48,
        step: 0.5,
        defaultValue: 36.5,
        description: "Screening dry-bulb air temperature",
      },
      {
        key: "relativeHumidityPct",
        label: "Relative Humidity",
        unit: "%",
        min: 30,
        max: 95,
        step: 5,
        defaultValue: 75,
        description: "Coastal relative humidity",
      },
    ],
    outputVariables: [
      { key: "heatIndexCelsius", label: "NOAA Heat Index", unit: "°C", colorScale: "heat" },
      { key: "heatRiskTier", label: "Municipal HAP Risk Tier", unit: "tier", colorScale: "heat" },
    ],
    scientificFormula: "NOAA Rothfusz 9-term polynomial with Steadman low/high humidity adjustments + UHI urban building density penalty.",
    assumptions: [
      "Dense, informal settlements (M/East Govandi, L Kurla, G/North Dharavi) experience +1.5°C to +2.5°C microclimatic UHI heating.",
    ],
    limitations: [
      "Heat Index is a screening proxy for apparent temperature, NOT a clinically validated Wet Bulb Globe Temperature (WBGT) solar radiometer measurement.",
    ],
    requiredDatasets: [
      "data/mumbai/mumbai_bmc_wards.geojson",
    ],
    recommendedActions: [
      "Trigger Yellow / Orange Heat Action Plan (HAP) advisory; open air-conditioned cooling centers at municipal ward offices.",
      "Deploy drinking water tankers to outdoor labor hubs and construction zones.",
    ],
  },

  // ─── SCENARIO F: CYCLONIC WIND & SQUALL RISK ──────────────────
  cyclonic_wind_squall: {
    id: "cyclonic_wind_squall",
    title: "Scenario F: Coastal Gale, Wind Gust Exceedance & Squall Hazard",
    category: "wind",
    tier: "TIER_1_OBSERVED_FORECAST",
    suitability: "OPERATIONAL_SCREENING",
    description: "Evaluates structural wind hazard and squall danger from Arabian Sea cyclonic depressions along exposed coastal promenades and high-rise corridors.",
    inputs: [
      {
        key: "sustainedWindKmH",
        label: "Sustained Wind Speed (10m)",
        unit: "km/h",
        min: 10,
        max: 120,
        step: 5,
        defaultValue: 45,
        description: "10-meter sustained wind velocity",
      },
      {
        key: "gustFactor",
        label: "Gust-to-Sustained Ratio",
        unit: "ratio",
        min: 1.2,
        max: 2.2,
        step: 0.1,
        defaultValue: 1.6,
        description: "Peak gust acceleration factor",
      },
    ],
    outputVariables: [
      { key: "gustSpeedKmH", label: "Peak Wind Gusts", unit: "km/h", colorScale: "wind" },
      { key: "windSeverityTier", label: "Squall Danger Severity", unit: "category", colorScale: "wind" },
    ],
    scientificFormula: "Gust = SustainedWind * GustFactor; Squall Severity classified into Normal (<30), Breezy (30-50), Gale Warning (50-70), Severe Storm (>70 km/h).",
    assumptions: [
      "Western seafront wards (A, D, G/South, H/West, K/West, P/North) suffer zero aerodynamic sheltering from the open ocean.",
    ],
    limitations: [
      "Simplified screening estimation: Does NOT predict individual building structural failure or roof detachment; indicates broad aerodynamic boundary-layer exposure.",
    ],
    requiredDatasets: [
      "data/mumbai/mumbai_bmc_wards.geojson",
      "data/mumbai/flood_spatial/mumbai_coastal_exposure.geojson",
    ],
    recommendedActions: [
      "Halt tower crane operations at all construction sites across Greater Mumbai.",
      "Secure temporary hoardings, billboards, and metal roofing sheets along arterial roads.",
    ],
  },

  // ─── SCENARIO G: AIR QUALITY INVERSION & STAGNATION ───────────
  air_quality_stagnation: {
    id: "air_quality_stagnation",
    title: "Scenario G: Winter Meteorological Inversion & Air Stagnation",
    category: "air_quality",
    tier: "TIER_1_OBSERVED_FORECAST",
    suitability: "OPERATIONAL_SCREENING",
    description: "Simulates atmospheric inversion trapping industrial emissions, vehicular particulates, and combustion smoke in eastern and central Mumbai corridors.",
    inputs: [
      {
        key: "baselinePm25",
        label: "Ambient PM2.5 Concentration",
        unit: "µg/m³",
        min: 20,
        max: 350,
        step: 10,
        defaultValue: 120,
        description: "Background fine particulate concentration",
      },
      {
        key: "ventilationCoefficient",
        label: "Ventilation Factor (Boundary Layer x Wind)",
        unit: "index",
        min: 0.3,
        max: 2.0,
        step: 0.1,
        defaultValue: 0.6,
        description: "Atmospheric dispersion capacity (lower means stronger stagnation)",
      },
    ],
    outputVariables: [
      { key: "simulatedPm25", label: "Stagnation PM2.5 Concentration", unit: "µg/m³", colorScale: "air_quality" },
      { key: "usEpaAqi", label: "Simulated US EPA AQI", unit: "index", colorScale: "air_quality" },
    ],
    scientificFormula: "PM_stagnant = BaselinePM * (1 / max(0.3, VentilationFactor)); CPCB & US EPA AQI piecewise linear conversion.",
    assumptions: [
      "Industrial emissions in Trombay/Mahul (M/West) and Deonar (M/East) concentrate heavily under low boundary layer height.",
    ],
    limitations: [
      "Simplified box dispersion screening: Does not compute 3D chemistry or photochemical ozone generation.",
    ],
    requiredDatasets: [
      "data/mumbai/mumbai_bmc_wards.geojson",
    ],
    recommendedActions: [
      "Issue health advisory for sensitive groups (children, elderly, asthmatics) in Chembur, Govandi, and Kurla.",
      "Mandate water sprinkling on construction corridors along Eastern Express Highway and S.V. Road.",
    ],
  },
};

export interface HistoricalEvent {
  id: string;
  title: string;
  date: string;
  peakRainfall24h: number;
  peakHourlyRain: number;
  peakTideMeters: number;
  durationHours: number;
  description: string;
  defaultParameters: Record<string, number>;
  provenance: string;
}

export const HISTORICAL_EVENTS: HistoricalEvent[] = [
  {
    id: "historical_july2005",
    title: "26 July 2005 Extreme Mumbai Cloudburst",
    date: "2005-07-26",
    peakRainfall24h: 944,
    peakHourlyRain: 120,
    peakTideMeters: 4.48,
    durationHours: 12,
    description: "Historic mesoscale cloudburst over Greater Mumbai resulting in Mithi River overflow, catastrophic inundation of Hindmata, Kurla, Sakinaka, and airport shutdown.",
    defaultParameters: {
      rainfallRateMmH: 95,
      durationHours: 12,
      drainageBlockagePct: 35,
      highTideMeters: 4.5,
    },
    provenance: "IMD Santacruz / Colaba Historical Weather Archive & BRIMSTOWAD Incident Audit",
  },
  {
    id: "historical_july2024",
    title: "8 July 2024 Monsoon Downpour & High Tide",
    date: "2024-07-08",
    peakRainfall24h: 268,
    peakHourlyRain: 65,
    peakTideMeters: 4.35,
    durationHours: 6,
    description: "Sustained monsoon burst coinciding with 4.35m high tide, causing severe waterlogging at Gandhi Market, Milan Subway, and suburban rail disruption.",
    defaultParameters: {
      rainfallRateMmH: 60,
      durationHours: 6,
      drainageBlockagePct: 20,
      highTideMeters: 4.35,
    },
    provenance: "MCGM Automatic Weather Stations (AWS) & Open-Meteo Historical Archive",
  },
];

export function getScenarioDefinition(id: string): ScenarioDefinition | undefined {
  return SCENARIO_REGISTRY[id];
}
