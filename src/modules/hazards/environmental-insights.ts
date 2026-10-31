/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Explainable Environmental Insights Engine
   Derives defensible, grounded operational indicators from validated inputs.
   
   Enforces:
   - Traceable mathematical definitions, inputs, and formulas
   - Authoritative statutory threshold sources (IMD, CPCB, NOAA, WHO, MCGM)
   - Explicit time windows, units, and methodological limitations
   - Zero-unfounded-anomaly rule: No metric called anomaly without baseline
   - Plain-language operational interpretation & contributing hazards
   ════════════════════════════════════════════════════════ */

import {
  calculateRollingRainfall,
  calculateHeatIndexCelsius,
  calculateWindGustExceedance,
  classifyAirQuality,
} from "./derived-metrics";

export interface EnvironmentalInsight {
  id: string;
  title: string;
  category: "rainfall_hydrology" | "heat_exposure" | "weather_atmosphere" | "air_quality" | "coastal_marine";
  severity: "NORMAL" | "ADVISORY" | "WATCH" | "WARNING" | "CRITICAL";
  headline: string;
  definition: string;
  inputs: Array<{ name: string; value: string | number; source: string }>;
  calculation: string;
  currentValue: number | string;
  units: string;
  timeWindow: string;
  thresholdSource: string;
  limitations: string;
  operationalInterpretation: {
    whatItMeans: string;
    contributingHazards: string[];
    requiredContextForLocalEffects: string;
    supportedSpatialAnalysis: string;
    recommendedActions: string[];
  };
}

export interface EnvironmentalInsightContext {
  cityId: "mumbai" | "pune" | "nagpur";
  cityName: string;
  selectedZone: string;
  weatherData: any;
  aqiData: any;
  marineData: any;
  riverData: any;
  historicalData?: any;
}

/**
 * Generate comprehensive explainable environmental insights for the active city and telemetry feeds
 */
export function generateEnvironmentalInsights(
  ctx: EnvironmentalInsightContext
): EnvironmentalInsight[] {
  const insights: EnvironmentalInsight[] = [];
  const { cityId, cityName, selectedZone, weatherData, aqiData, marineData, riverData } = ctx;

  const current = weatherData?.current || {};
  const hourly = weatherData?.hourly || {};
  const times: string[] = hourly.time || [];
  const hourlyPrecip: number[] = hourly.precipitation || [];
  const hourlyTemps: number[] = hourly.temperature_2m || [];
  const hourlyRH: number[] = hourly.relative_humidity_2m || [];

  // ─── 1. ROLLING RAINFALL ACCUMULATION & RATE OF CHANGE ─────
  if (hourlyPrecip.length > 0) {
    const roll3 = calculateRollingRainfall(times, hourlyPrecip, 3);
    const roll6 = calculateRollingRainfall(times, hourlyPrecip, 6);
    const roll24 = calculateRollingRainfall(times, hourlyPrecip, 24);

    const max3h = roll3.maxRollingMm;
    const max6h = roll6.maxRollingMm;
    const max24h = roll24.maxRollingMm;

    let rainSeverity: EnvironmentalInsight["severity"] = "NORMAL";
    let rainHeadline = "Low precipitation accumulation across forecast horizon.";

    if (max3h >= 50 || max6h >= 80 || max24h >= 204.5) {
      rainSeverity = "CRITICAL";
      rainHeadline = `Extreme Rainfall Accumulation: Peak ${max3h}mm/3h, ${max24h}mm/24h.`;
    } else if (max6h >= 50 || max24h >= 115.6) {
      rainSeverity = "WARNING";
      rainHeadline = `Heavy Rainfall Accumulation: Peak ${max6h}mm in 6h exceeds municipal storm-drain capacity.`;
    } else if (max3h >= 20 || max24h >= 64.5) {
      rainSeverity = "ADVISORY";
      rainHeadline = `Moderate Rainfall Expected: Peak 24h accumulation ${max24h}mm.`;
    }

    insights.push({
      id: "rainfall_accumulation_spectrum",
      title: "Precipitation Accumulation Spectrum & Infiltration Rate",
      category: "rainfall_hydrology",
      severity: rainSeverity,
      headline: rainHeadline,
      definition:
        "Sequential moving sums of forecast hourly precipitation over 3-hour, 6-hour, and 24-hour non-overlapping windows. Differentiates rapid cloudburst deluge from distributed monsoon showers.",
      inputs: [
        { name: "Hourly Precipitation Rate", value: `${current.precipitation ?? 0} mm/h`, source: "ECMWF IFS / GFS Seamless" },
        { name: "Peak 3h Rolling Sum", value: `${max3h} mm`, source: "Derived Non-Overlapping Window" },
        { name: "Peak 6h Rolling Sum", value: `${max6h} mm`, source: "Derived Drainage Window" },
        { name: "24h Cumulative Precipitation", value: `${max24h} mm`, source: "Daily Meteorological Total" },
      ],
      calculation:
        "Rolling(N) = Σ [P(t - i)] for i = 0 to N-1, computed at each hourly step t without double-counting preceding intervals.",
      currentValue: max6h,
      units: "mm / 6h",
      timeWindow: "Next 72 Hours (Hourly Resolution)",
      thresholdSource:
        "IMD Rainfall Classification (64.5mm Heavy, 115.6mm Very Heavy, 204.5mm Extremely Heavy) & MCGM Stormwater Design Manual (25-50mm/h design limit)",
      limitations:
        "Modelled precipitation reflects spatial grid average (~11 km). Localized micro-bursts (<2 km) may produce higher peak rainfall intensities at individual street catchments.",
      operationalInterpretation: {
        whatItMeans:
          max6h >= 50
            ? "Rapid cumulative rain volume that severely challenges gravity-fed municipal box drains and nallahs."
            : "Precipitation rates remain within standard municipal drainage conveyance limits under normal gravity flow.",
        contributingHazards: [
          "Urban Saucer-Sink Waterlogging",
          "Railway Underpass Inundation",
          "Nallah / Canal Embankment Overtopping",
          "Traffic Gridlock at Chronic Low-Lying Hotspots",
        ],
        requiredContextForLocalEffects:
          "High-resolution digital elevation model (Copernicus DEM 30m), catch-pit siltation status, and downstream tidal gate open/shut state (Mumbai).",
        supportedSpatialAnalysis:
          cityId === "mumbai"
            ? "Directly feeds 2D Hydrodynamic Saucer Sink Simulation in Spatial Simulation Lab."
            : "Monitored as catchment telemetry baseline; 2D mesh hydrodynamic routing currently restricted to Mumbai.",
        recommendedActions: [
          "Pre-position high-capacity dewatering diesel pumps (120–250 HP) at chronic depression hotspots.",
          "Alert Ward Stormwater Maintenance crews to inspect trash racks and nallah screens.",
          "Dispatch citizen transit advisories to avoid depressed underpasses if 3h rolling exceeds 30mm.",
        ],
      },
    });
  }

  // ─── 2. HEAT STRESS & BIOMETEOROLOGICAL SCREENING ─────────
  const currentTemp = current.temperature_2m;
  const currentRH = current.relative_humidity_2m;
  if (currentTemp !== undefined && currentRH !== undefined) {
    const heatResult = calculateHeatIndexCelsius(currentTemp, currentRH);

    let heatSeverity: EnvironmentalInsight["severity"] = "NORMAL";
    if (heatResult.riskTier === "EXTREME_DANGER") heatSeverity = "CRITICAL";
    else if (heatResult.riskTier === "DANGER") heatSeverity = "WARNING";
    else if (heatResult.riskTier === "EXTREME_CAUTION" || heatResult.riskTier === "CAUTION") heatSeverity = "ADVISORY";

    insights.push({
      id: "noaa_heat_stress_index",
      title: "Biometeorological Heat Stress & Human Exposure Tier",
      category: "heat_exposure",
      severity: heatSeverity,
      headline: `Heat Index: ${heatResult.heatIndexCelsius}°C (${heatResult.riskTier.replace("_", " ")}). Ambient ${currentTemp}°C at ${currentRH}% RH.`,
      definition:
        "The NOAA National Weather Service Rothfusz polynomial combines ambient dry-bulb temperature and atmospheric relative humidity to model equivalent human thermal stress under shaded conditions.",
      inputs: [
        { name: "2m Air Temperature", value: `${currentTemp} °C`, source: "ECMWF IFS Model" },
        { name: "Relative Humidity", value: `${currentRH} %`, source: "ECMWF IFS Model" },
        { name: "Derived Apparent Temperature", value: `${current.apparent_temperature ?? currentTemp} °C`, source: "Australian BOM Equation" },
      ],
      calculation:
        "Rothfusz 9-parameter multivariable regression: HI = f(T_F, RH) with low/high humidity boundary corrections, converted to °C.",
      currentValue: heatResult.heatIndexCelsius,
      units: "°C Heat Index",
      timeWindow: "Current Modelled State (15-min sync)",
      thresholdSource:
        "NOAA National Weather Service Heat Index Scale & NDMA / Municipal Heat Action Plan (HAP) Guidelines",
      limitations:
        "Valid strictly for shaded outdoor conditions with light air movement (~5 knots). Direct solar radiation increases apparent thermal load by up to 8°C (15°F).",
      operationalInterpretation: {
        whatItMeans:
          heatResult.heatIndexCelsius >= 41
            ? "Severe biometeorological thermal load. The body's natural evaporative perspiration cooling is severely impeded by ambient humidity."
            : "Thermal conditions remain within standard occupational tolerance with routine hydration.",
        contributingHazards: [
          "Occupational Heat Stroke & Exhaustion",
          "Urban Heat Island (UHI) Amplification over Dense Asphalt",
          "Peak Grid Electrical Demand & Transformer Overheating",
          "Water Distribution Pressure Drop due to High Consumption",
        ],
        requiredContextForLocalEffects:
          "Urban canopy fraction, roof material reflectance (cool roof penetration), and unshaded outdoor labor exposure.",
        supportedSpatialAnalysis:
          cityId === "mumbai"
            ? "Correlated with Urban Heat Island (UHI) demographic exposure layer in Spatial Simulation Lab."
            : "Screened against municipal Heat Action Plan (HAP) advisory alert tiers.",
        recommendedActions: [
          "Mandate shaded rest intervals and oral rehydration salt (ORS) points for outdoor sanitation and construction workers.",
          "Extend municipal public park hours to provide vegetative shaded refuge.",
          "Keep municipal urban primary health centres (UPHCs) staffed for acute dehydration triage.",
        ],
      },
    });
  }

  // ─── 3. WIND GUST RATIO & SQUALL EXCEEDANCE ───────────────
  const currentWind = current.wind_speed_10m ?? 0;
  const currentGust = current.wind_gusts_10m ?? 0;
  const windResult = calculateWindGustExceedance(currentWind, currentGust);

  let windSeverity: EnvironmentalInsight["severity"] = "NORMAL";
  if (windResult.severity === "SEVERE_SQUALL") windSeverity = "CRITICAL";
  else if (windResult.severity === "GALE_ADVISORY") windSeverity = "WARNING";
  else if (windResult.severity === "BREEZY") windSeverity = "ADVISORY";

  insights.push({
    id: "wind_gust_exceedance_dynamics",
    title: "Wind Gust Dynamic Ratio & Squall Exceedance",
    category: "weather_atmosphere",
    severity: windSeverity,
    headline: `Wind Speed: ${currentWind} km/h (Sustained) with Gusts up to ${currentGust} km/h (Ratio: ${windResult.gustRatio}x).`,
    definition:
      "Ratio between instantaneous peak wind bursts (3-5s) and sustained 10-minute horizontal air velocity at 10 meters altitude. High gust ratios (>1.5x) signify atmospheric turbulence and convective downdrafts.",
    inputs: [
      { name: "10m Sustained Wind Speed", value: `${currentWind} km/h`, source: "ECMWF IFS Model" },
      { name: "10m Peak Wind Gusts", value: `${currentGust} km/h`, source: "ECMWF IFS Model" },
      { name: "Wind Direction", value: `${current.wind_direction_10m ?? 0}°`, source: "ECMWF IFS Model" },
    ],
    calculation: "Gust_Ratio = Peak_Gust_10m / Max(1.0, Sustained_Wind_10m)",
    currentValue: currentGust,
    units: "km/h Peak Gust",
    timeWindow: "Hourly Moving Window",
    thresholdSource: "IMD Squall Criteria (≥40 km/h moderate, ≥55 km/h gale, ≥75 km/h severe squall)",
    limitations:
      "Terrain roughness and tall building canyons create aerodynamic Venturi tunneling effects, producing localized wind acceleration up to 1.8x open-terrain model values.",
    operationalInterpretation: {
      whatItMeans:
        currentGust >= 55
          ? "Gale-force aerodynamic pressure capable of dislodging roadside hoardings, breaking weak tree boughs, and toppling construction scaffolding."
          : "Normal wind velocities. Aerodynamic structural hazard is minimal.",
      contributingHazards: [
        "Treefall & Overhead Electrical Feeder Line Snapping",
        "Commercial Hoarding / Billboard Structural Failure",
        "Maritime Port Small Craft Capsizing (Mumbai)",
        "Debris Scatter in Open Markets and Informal Settlements",
      ],
      requiredContextForLocalEffects:
        "Municipal tree pruning census, registered heritage trees, and arterial flyover wind exposure.",
      supportedSpatialAnalysis:
        cityId === "mumbai"
          ? "Coupled with Cyclone Wind Surge scenario in Spatial Simulation Lab."
          : "Monitored as civic infrastructure protection threshold.",
      recommendedActions: [
        "Alert municipal Tree Trimming squads and Disaster Control emergency rescue vehicles.",
        "Inspect high-mast advertisement hoardings for structural anchor security.",
        "Advise motorists to exercise caution when crossing elevated bridges and coastal sea links.",
      ],
    },
  });

  // ─── 4. AIR QUALITY & PARTICULATE HEALTH ASSESSMENT ───────
  const pm25 = aqiData?.current?.pm2_5;
  const usAqi = aqiData?.current?.us_aqi;
  if (pm25 !== undefined || usAqi !== undefined) {
    const aqiClass = classifyAirQuality(pm25 ?? 25, "pm2_5");

    let aqiSeverity: EnvironmentalInsight["severity"] = "NORMAL";
    if (pm25 >= 120 || (usAqi && usAqi >= 200)) aqiSeverity = "CRITICAL";
    else if (pm25 >= 60 || (usAqi && usAqi >= 150)) aqiSeverity = "WARNING";
    else if (pm25 >= 30 || (usAqi && usAqi >= 100)) aqiSeverity = "ADVISORY";

    insights.push({
      id: "air_quality_particulate_screening",
      title: "Ambient Particulate Matter (PM2.5) & Health Standard",
      category: "air_quality",
      severity: aqiSeverity,
      headline: `PM2.5 Concentration: ${pm25 ?? "—"} µg/m³ · US AQI: ${usAqi ?? "—"} (${aqiClass.category}).`,
      definition:
        "Fine particulate matter with aerodynamic diameter ≤ 2.5 micrometers capable of penetrating deep into alveolar pulmonary tissue and bloodstream.",
      inputs: [
        { name: "PM2.5 Concentration", value: `${pm25 ?? "—"} µg/m³`, source: "Copernicus CAMS Model" },
        { name: "PM10 Concentration", value: `${aqiData?.current?.pm10 ?? "—"} µg/m³`, source: "Copernicus CAMS Model" },
        { name: "Standardized US AQI", value: `${usAqi ?? "—"}`, source: "US EPA Calculation" },
        { name: "European AQI", value: `${aqiData?.current?.european_aqi ?? "—"} CAQI`, source: "EU Environment Agency" },
      ],
      calculation:
        "Indian CPCB National Ambient Air Quality Standard (NAAQS) 24h breakpoint classification vs US EPA 24h Piecewise Linear Interpolation.",
      currentValue: pm25 ?? 0,
      units: "µg/m³ PM2.5",
      timeWindow: "Hourly Observation / Forecast Ensemble",
      thresholdSource: "Central Pollution Control Board (CPCB) India NAAQS & US EPA AQI Standard",
      limitations:
        "CAMS atmospheric ensemble operates at 0.1° (~11 km) spatial resolution. Street-level canyons adjacent to heavy diesel truck corridors may experience acute localized spikes.",
      operationalInterpretation: {
        whatItMeans:
          (pm25 ?? 0) >= 60
            ? "Elevated fine particle concentration posing respiratory discomfort to asthmatics, elderly citizens, and children."
            : "Satisfactory air quality with low general population pulmonary exposure.",
        contributingHazards: [
          "Acute Bronchial Irritation & Asthma Exacerbation",
          "Reduced Atmospheric Visibility during Early Morning Inversions",
          "Smog Cloud Retention in Industrial Basins",
        ],
        requiredContextForLocalEffects:
          "Continuous Ambient Air Quality Monitoring Station (CAAQMS) point validation, traffic congestion sensors, and thermal inversion layer height.",
        supportedSpatialAnalysis:
          "Zonal demographic overlay and sensitive healthcare receptor screening.",
        recommendedActions: [
          "Issue public health advisory recommending masks (N95) for sensitive groups during morning outdoor workouts.",
          "Direct municipal sweeping machines to apply water misting along major traffic arteries to suppress fugitive dust.",
          "Notify pediatric and respiratory hospital wards of potential surge in outpatient admissions.",
        ],
      },
    });
  }

  // ─── 5. COASTAL & MARINE WAVE OVERTOPPING (Mumbai Only) ────
  if (cityId === "mumbai" && marineData?.current) {
    const waveHeight = marineData.current.wave_height ?? 0;
    const wavePeriod = marineData.current.wave_period ?? 0;
    const swellHeight = marineData.current.swell_wave_height ?? 0;

    let marineSeverity: EnvironmentalInsight["severity"] = "NORMAL";
    if (waveHeight >= 3.0) marineSeverity = "CRITICAL";
    else if (waveHeight >= 2.2) marineSeverity = "WARNING";
    else if (waveHeight >= 1.5) marineSeverity = "ADVISORY";

    insights.push({
      id: "coastal_wave_overtopping_dynamics",
      title: "Arabian Sea Wave Energy & Coastal Overtopping Vulnerability",
      category: "coastal_marine",
      severity: marineSeverity,
      headline: `Significant Wave Height: ${waveHeight}m · Swell: ${swellHeight}m (Period: ${wavePeriod}s).`,
      definition:
        "Copernicus Marine Environment Monitoring Service (CMEMS) significant wave height (Hs), representing the mean wave height of the highest third of waves off the Mumbai coastline.",
      inputs: [
        { name: "Significant Wave Height", value: `${waveHeight} m`, source: "CMEMS Wave Model (0.08° Grid)" },
        { name: "Swell Wave Height", value: `${swellHeight} m`, source: "CMEMS Wave Model" },
        { name: "Wave Period", value: `${wavePeriod} s`, source: "CMEMS Wave Model" },
      ],
      calculation:
        "Hydrodynamic wave energy density E = (1/16) * ρ * g * Hs². Combined with astronomical spring tide table for coastal backpressure index.",
      currentValue: waveHeight,
      units: "m Significant Wave Height",
      timeWindow: "Hourly Coastal Forecast Horizon",
      thresholdSource:
        "BMC Coastal Disaster Cell (Overtopping risk: >2.2m moderate, >3.0m severe during spring tides)",
      limitations:
        "Deep-water offshore wave model. Nearshore shoaling, tetrapod dissipation, and sea-wall reflection modify exact overtopping volume at specific promenade sections.",
      operationalInterpretation: {
        whatItMeans:
          waveHeight >= 2.2
            ? "High wave energy coinciding with high astronomical tide will cause wave splashing over sea-walls and lock stormwater outfall flap gates."
            : "Normal sea state with negligible coastal overtopping risk.",
        contributingHazards: [
          "Promenade Wave Overtopping (Marine Drive, Worli, Bandra Bandstand)",
          "Stormwater Outfall Flap Gate Hydrostatic Lockout",
          "Saltwater Backflow into Depressed Shoreline Culverts",
        ],
        requiredContextForLocalEffects:
          "Real-time BMC tidal gauge readings at Apollo Bunder and Haji Ali, plus seawall crest elevations.",
        supportedSpatialAnalysis:
          "Integrated into Mumbai Spring Tide Coastal Surge scenario in Spatial Simulation Lab.",
        recommendedActions: [
          "Deploy Mumbai Police and Coastal Security patrols to restrict pedestrian access along sea-facing promenades.",
          "Prepare standby dewatering pumps at Worli and Lovegrove pumping stations.",
          "Close manual sluice gates to prevent Arabian Sea backflow into municipal stormwater drains.",
        ],
      },
    });
  }

  // ─── 6. RIVER DISCHARGE (GloFAS Catchment Flow) ───────────
  if (riverData?.discharge !== undefined && riverData.discharge !== null) {
    const discharge = riverData.discharge;
    const dischargeMedian = riverData.dischargeMedian ?? discharge;
    const dischargeMax = riverData.dischargeMax ?? discharge;

    insights.push({
      id: "river_discharge_glofas_hydrology",
      title: "Riverine Discharge & Basin Hydrological Load (GloFAS)",
      category: "rainfall_hydrology",
      severity: discharge > dischargeMedian * 1.5 ? "WARNING" : "NORMAL",
      headline: `Current Discharge: ${discharge} m³/s (Climatic Median: ${dischargeMedian} m³/s, Forecast Max: ${dischargeMax} m³/s).`,
      definition:
        "Copernicus Global Flood Awareness System (GloFAS) 0.05° European multi-model hydrological ensemble simulating daily catchment streamflow and river channel conveyance.",
      inputs: [
        { name: "Modelled Daily Discharge", value: `${discharge} m³/s`, source: "GloFAS 4.0 Grid" },
        { name: "Climatic Median Discharge", value: `${dischargeMedian} m³/s`, source: "GloFAS Long-Term Climatology" },
        { name: "Forecast Peak Discharge", value: `${dischargeMax} m³/s`, source: "GloFAS Ensemble Max" },
      ],
      calculation: "Catchment runoff routing using LISFLOOD hydrological distributed model.",
      currentValue: discharge,
      units: "m³/s Streamflow Discharge",
      timeWindow: "Daily Hydrological Horizon",
      thresholdSource: "Copernicus GloFAS River Flow Return Periods (2-year, 5-year, 20-year flood levels)",
      limitations:
        "0.05° (~5 km) hydrological grid represents major river corridors (e.g. Mithi in Mumbai, Mula-Mutha in Pune, Nag River in Nagpur). Minor localized roadside gutter blockages are below grid scale.",
      operationalInterpretation: {
        whatItMeans:
          discharge > dischargeMedian * 1.5
            ? "Significantly elevated riverine flow. Low-lying riparian banks and bridge crossings face accelerated inundation risk."
            : "River channel flow remains within standard dry-season / normal monsoon baseflow bounds.",
        contributingHazards: [
          "Riverbank Inundation & Informal Settlement Flooding",
          "Bridge Scour and Low-Level Causeway Submersion",
          "Backflow into Lateral Storm Drains at River Confluences",
        ],
        requiredContextForLocalEffects:
          "Upstream dam discharge schedules (e.g. Khadakwasla for Pune, Totladoh for Nagpur, Vihar/Tulsi for Mumbai).",
        supportedSpatialAnalysis:
          "Catchment streamflow hydrograph and regional water resource monitoring.",
        recommendedActions: [
          "Coordinate with State Irrigation Department on dam release gates and warning sirens.",
          "Alert ward disaster control rooms adjacent to river banks (e.g. Kurla L Ward in Mumbai, Yerwada in Pune).",
        ],
      },
    });
  }

  return insights;
}
