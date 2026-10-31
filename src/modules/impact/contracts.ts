/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Impact Assessment Contract
   Shared schema representing grounded impact intelligence
   across Citizen and Admin workspaces.

   Answers the 6 Core Geospatial Impact Questions:
   1. What is happening or forecast to happen?
   2. Over what area and time window?
   3. What evidence supports this assessment?
   4. What could be affected (wards, assets, exposed population)?
   5. How certain is the assessment and what data is missing?
   6. What practical action should be considered?
   ════════════════════════════════════════════════════════ */

export interface AffectedWardSummary {
  wardId: string;
  wardName: string;
  zoneCode: string;
  severityLevel: "NORMAL" | "ADVISORY" | "WATCH" | "WARNING";
  metricValue: number;
  metricUnit: string;
  metricLabel: string;
  deltaVsBaselinePercent: number;
  
  // What could be affected
  estimatedExposedPopulation: number;
  populationProvenance: string;
  intersectingHotspots: string[];
  drainageAssets: string[];
  verifiedFacilitiesCount: number;

  // Plain-Language & Technical Explanations
  plainLanguageSummary: string;
  technicalSummary: string;
  recommendedAction: string;
}

export interface SharedImpactAssessment {
  assessmentId: string;
  cityId: string;
  cityName: string;
  evaluatedAtIso: string;
  horizonTimeWindow: string; // e.g. "Next 3 to 6 Hours (16:00 - 22:00 IST)"
  dominantHazard: string;
  overallAlertLevel: "GREEN_NORMAL" | "YELLOW_WATCH" | "ORANGE_ALERT" | "RED_WARNING";

  // Question 1: What is happening or forecast?
  forecastHeadline: string;
  forecastDescription: string;

  // Question 2: Over what area and time window?
  spatialExtentDescription: string;
  timeWindowHours: number;

  // Question 3: What evidence supports this assessment?
  evidenceBase: {
    telemetrySource: string;
    forecastModel: string;
    baselineComparison: string;
    historicalContext?: string;
    activeAlertsCount: number;
    recentCitizenReportsCount: number;
  };

  // Question 4: What could be affected?
  potentialImpacts: {
    totalWardsAffected: number;
    highestRiskWards: AffectedWardSummary[];
    transportCorridorsAffected: string[];
    drainageCorridorsStressed: string[];
    estimatedTotalExposedPopulation: number;
    demographicMethodologyFootnote: string;
  };

  // Question 5: Certainty & missing information
  certaintyAndLimitations: {
    certaintyTier: "HIGH_CERTAINTY_OBSERVED" | "MODERATE_CERTAINTY_SCREENING" | "LOW_CERTAINTY_EXPLORATORY";
    missingInputs: string[];
    uncertaintyStatement: string;
    disclaimer: string;
  };

  // Question 6: What practical actions should be considered?
  recommendedActions: {
    citizenActions: Array<{
      category: "SAFETY" | "TRAVEL" | "HOUSEHOLD" | "HEALTH";
      instruction: string;
      importance: "MANDATORY" | "PRECAUTIONARY" | "INFO";
    }>;
    municipalActions: Array<{
      department: string;
      action: string;
      urgency: "IMMEDIATE" | "STANDBY" | "ROUTINE";
    }>;
  };
}
