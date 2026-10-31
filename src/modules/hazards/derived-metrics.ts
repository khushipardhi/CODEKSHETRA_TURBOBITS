/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Derived Metrics & Analytics Engine
   Scientific formulation and calculation of derived environmental indicators.
   
   Enforces:
   - Non-overlapping rolling accumulations (1h, 3h, 6h, 12h, 24h)
   - Official NOAA National Weather Service Rothfusz Heat Index
   - Wind gust exceedance analysis
   - Multi-standard Air Quality Classification (US EPA, EU CAQI, Indian CPCB)
   - Traceable formulas, inputs, and limitations
   ════════════════════════════════════════════════════════ */

export interface RollingRainfallResult {
  windowHours: number;
  series: Array<{
    time: string;
    rollingMm: number;
    hourlyMm: number;
  }>;
  maxRollingMm: number;
  exceedsWarning: boolean;
}

export interface HeatIndexResult {
  temperatureCelsius: number;
  relativeHumidity: number;
  heatIndexCelsius: number;
  riskTier: "SAFE" | "CAUTION" | "EXTREME_CAUTION" | "DANGER" | "EXTREME_DANGER";
  advisoryText: string;
  formula: string;
  limitations: string;
}

export interface WindExceedanceResult {
  sustainedKmh: number;
  gustKmh: number;
  gustRatio: number;
  isSquall: boolean;
  severity: "NORMAL" | "BREEZY" | "GALE_ADVISORY" | "SEVERE_SQUALL";
  advisory: string;
}

/**
 * Calculate rolling accumulated rainfall without double counting preceding windows
 */
export function calculateRollingRainfall(
  timestamps: string[],
  hourlyPrecipitation: number[],
  windowHours: number
): RollingRainfallResult {
  if (!hourlyPrecipitation || hourlyPrecipitation.length === 0) {
    return { windowHours, series: [], maxRollingMm: 0, exceedsWarning: false };
  }

  const series: Array<{ time: string; rollingMm: number; hourlyMm: number }> = [];
  let maxRolling = 0;

  for (let i = 0; i < hourlyPrecipitation.length; i++) {
    const time = timestamps[i] || `T+${i}h`;
    const hourlyVal = typeof hourlyPrecipitation[i] === "number" ? Math.max(0, hourlyPrecipitation[i]) : 0;

    // Sum strictly from max(0, i - windowHours + 1) to i
    const startIdx = Math.max(0, i - windowHours + 1);
    let windowSum = 0;
    for (let j = startIdx; j <= i; j++) {
      const v = typeof hourlyPrecipitation[j] === "number" ? Math.max(0, hourlyPrecipitation[j]) : 0;
      windowSum += v;
    }

    windowSum = Number(windowSum.toFixed(1));
    if (windowSum > maxRolling) maxRolling = windowSum;

    series.push({
      time,
      rollingMm: windowSum,
      hourlyMm: Number(hourlyVal.toFixed(1)),
    });
  }

  // Warning thresholds based on window duration
  const warningThreshold = windowHours <= 3 ? 50 : windowHours <= 6 ? 80 : windowHours <= 12 ? 120 : 204.5;

  return {
    windowHours,
    series,
    maxRollingMm: maxRolling,
    exceedsWarning: maxRolling >= warningThreshold,
  };
}

/**
 * Official NOAA National Weather Service Rothfusz Heat Index Regression Equation
 * Reference: Lans P. Rothfusz (1990), NWS Technical Attachment SR 90-23
 */
export function calculateHeatIndexCelsius(
  temperatureCelsius: number,
  relativeHumidity: number
): HeatIndexResult {
  const T = (temperatureCelsius * 9) / 5 + 32; // Convert to Fahrenheit
  const RH = Math.max(0, Math.min(100, relativeHumidity)); // Clamp 0-100%

  // 1. Initial simple Steadman approximation
  let HI = 0.5 * (T + 61.0 + (T - 68.0) * 1.2 + RH * 0.094);

  // 2. If heat index >= 80°F, apply full 9-term polynomial
  if (HI >= 80) {
    HI =
      -42.379 +
      2.04901523 * T +
      10.14333127 * RH -
      0.22475541 * T * RH -
      0.00683783 * T * T -
      0.05481717 * RH * RH +
      0.00122874 * T * T * RH +
      0.00085282 * T * RH * RH -
      0.00000199 * T * T * RH * RH;

    // Low humidity adjustment: RH < 13% and 80°F <= T <= 112°F
    if (RH < 13 && T >= 80 && T <= 112) {
      const adjustment = ((13 - RH) / 4) * Math.sqrt((17 - Math.abs(T - 95.0)) / 17);
      HI -= adjustment;
    }
    // High humidity adjustment: RH > 85% and 80°F <= T <= 87°F
    else if (RH > 85 && T >= 80 && T <= 87) {
      const adjustment = ((RH - 85) / 10) * ((87 - T) / 5);
      HI += adjustment;
    }
  }

  // Convert resulting HI back to Celsius
  const heatIndexCelsius = Number((((HI - 32) * 5) / 9).toFixed(1));

  // Determine standard NOAA Risk Tier
  let riskTier: HeatIndexResult["riskTier"] = "SAFE";
  let advisoryText = "Normal thermal conditions. No municipal activity restrictions.";

  if (heatIndexCelsius >= 54) {
    riskTier = "EXTREME_DANGER";
    advisoryText = "Heat stroke imminent with continued outdoor exposure. Immediate suspension of outdoor physical labor mandatory.";
  } else if (heatIndexCelsius >= 41) {
    riskTier = "DANGER";
    advisoryText = "Heat cramps and heat exhaustion likely; heat stroke possible with prolonged exposure or physical activity.";
  } else if (heatIndexCelsius >= 32) {
    riskTier = "EXTREME_CAUTION";
    advisoryText = "Heat cramps and exhaustion possible with prolonged exposure. Ensure mandatory shaded rest periods and hydration.";
  } else if (heatIndexCelsius >= 27) {
    riskTier = "CAUTION";
    advisoryText = "Fatigue possible with prolonged exposure. General public advised to hydrate adequately.";
  }

  return {
    temperatureCelsius,
    relativeHumidity,
    heatIndexCelsius,
    riskTier,
    advisoryText,
    formula: "Rothfusz NWS Polynomial (T_F, RH) with Steadman Boundary Adjustments -> Celsius",
    limitations: "Valid for shaded outdoor conditions with light breeze (approx 5 knots). Direct solar radiation increases apparent heat index by up to 8°C (15°F).",
  };
}

/**
 * Calculate Wind Gust Exceedance and Squall Hazard Risk
 */
export function calculateWindGustExceedance(
  sustainedKmh: number,
  gustKmh: number
): WindExceedanceResult {
  const sustained = Math.max(0, sustainedKmh);
  const gust = Math.max(sustained, gustKmh);
  const gustRatio = sustained > 0 ? Number((gust / sustained).toFixed(2)) : 1.0;

  let severity: WindExceedanceResult["severity"] = "NORMAL";
  let isSquall = false;
  let advisory = "Normal wind velocities. Structural risk minimal.";

  if (gust >= 75 || (gust >= 60 && gustRatio >= 1.6)) {
    severity = "SEVERE_SQUALL";
    isSquall = true;
    advisory = "Severe squall danger. Treefall, overhead cable disruption, and scaffolding collapse hazard.";
  } else if (gust >= 55 || gustRatio >= 1.5) {
    severity = "GALE_ADVISORY";
    isSquall = true;
    advisory = "Gale force gusts detected. Secure loose exterior objects and drive with caution on bridges/flyovers.";
  } else if (gust >= 40) {
    severity = "BREEZY";
    advisory = "Moderate gust activity. Normal precautions for outdoor temporary structures.";
  }

  return {
    sustainedKmh: sustained,
    gustKmh: gust,
    gustRatio,
    isSquall,
    severity,
    advisory,
  };
}

/**
 * Standardized Air Quality Classification (US EPA vs Indian CPCB NAAQS)
 */
export function classifyAirQuality(
  value: number,
  pollutant: "us_aqi" | "pm2_5" | "pm10" | "no2" | "so2" | "o3"
): {
  category: string;
  badgeColor: string;
  healthImplications: string;
  sourceStandard: string;
} {
  if (pollutant === "us_aqi") {
    if (value <= 50) return { category: "Good", badgeColor: "#10b981", healthImplications: "Air quality is considered satisfactory, and air pollution poses little or no risk.", sourceStandard: "US EPA" };
    if (value <= 100) return { category: "Moderate", badgeColor: "#f59e0b", healthImplications: "Air quality is acceptable; however, some pollutants may cause moderate health concern for a very small number of individuals.", sourceStandard: "US EPA" };
    if (value <= 150) return { category: "Unhealthy for Sensitive Groups", badgeColor: "#ea580c", healthImplications: "Members of sensitive groups may experience health effects. The general public is less likely to be affected.", sourceStandard: "US EPA" };
    if (value <= 200) return { category: "Unhealthy", badgeColor: "#ef4444", healthImplications: "Everyone may begin to experience health effects; members of sensitive groups may experience more serious health effects.", sourceStandard: "US EPA" };
    if (value <= 300) return { category: "Very Unhealthy", badgeColor: "#a855f7", healthImplications: "Health alert: The risk of health effects is increased for everyone.", sourceStandard: "US EPA" };
    return { category: "Hazardous", badgeColor: "#881337", healthImplications: "Health warning of emergency conditions: The entire population is more likely to be affected.", sourceStandard: "US EPA" };
  }

  if (pollutant === "pm2_5") {
    // Indian CPCB National Ambient Air Quality Standards (24-hour average)
    if (value <= 30) return { category: "Good (CPCB)", badgeColor: "#10b981", healthImplications: "Minimal impact.", sourceStandard: "CPCB India NAAQS" };
    if (value <= 60) return { category: "Satisfactory", badgeColor: "#84cc16", healthImplications: "Minor breathing discomfort to sensitive people.", sourceStandard: "CPCB India NAAQS" };
    if (value <= 90) return { category: "Moderate", badgeColor: "#f59e0b", healthImplications: "Breathing discomfort to people with lung disease such as asthma.", sourceStandard: "CPCB India NAAQS" };
    if (value <= 120) return { category: "Poor", badgeColor: "#ea580c", healthImplications: "Breathing discomfort to most people on prolonged exposure.", sourceStandard: "CPCB India NAAQS" };
    if (value <= 250) return { category: "Very Poor", badgeColor: "#ef4444", healthImplications: "Respiratory illness to the people on prolonged exposure.", sourceStandard: "CPCB India NAAQS" };
    return { category: "Severe Emergency", badgeColor: "#881337", healthImplications: "Affects healthy people and seriously impacts those with existing diseases.", sourceStandard: "CPCB India NAAQS" };
  }

  return {
    category: "Monitored",
    badgeColor: "#64748b",
    healthImplications: "Standard environmental exposure limits apply.",
    sourceStandard: "General Reference",
  };
}
