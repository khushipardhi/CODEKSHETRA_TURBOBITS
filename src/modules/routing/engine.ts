/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Explainable Routing Engine
   Deterministic, verifiable decision layer for municipal incident routing.
   Evaluates taxonomy, GIS jurisdiction, hazard context, and dependencies.
   ════════════════════════════════════════════════════════ */

import {
  CitySlug,
  DepartmentRoutingRule,
  MASTER_ROUTING_RULES,
  isDepartmentConfiguredForCity,
  getCityDepartmentProfile,
} from "./registry";
import { CITIES, isLocationInCity, detectCityFromCoords } from "@/lib/city-context";

export interface RoutingEngineInput {
  city: string;
  category: string;
  subcategory?: string | null;
  hazardType?: string | null;
  severity?: string | null;
  isEmergency?: boolean;
  locationText?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  activeNearbyEventId?: string | null;
  actorRole?: string | null;
}

export interface RoutingDecision {
  matchedRuleId: string;
  ruleVersion: string;
  city: CitySlug;
  primaryDepartment: string;
  primaryDepartmentName: string;
  supportingDepartments: Array<{
    code: string;
    name: string;
  }>;
  dependencies: Array<{
    department: string;
    action: string;
    requiredBefore: string;
  }>;
  decisionExplanation: string;
  factsUsed: {
    city: string;
    category: string;
    subcategory?: string | null;
    hazardType?: string | null;
    severity?: string | null;
    isEmergency: boolean;
    locationText?: string | null;
    coordinates?: [number, number] | null;
    linkedEventId?: string | null;
  };
  missingFacts: string[];
  confidenceStatus: "HIGH" | "MEDIUM" | "REQUIRES_REVIEW" | "FALLBACK";
  assignmentMode: "AUTOMATIC" | "RECOMMENDED" | "AWAITING_APPROVAL";
  slaHours: number;
  ackMinutes: number;
  escalationTarget: string;
  isConfigurationGap: boolean;
  configurationGapReason?: string;
}

/**
 * Execute explainable routing decision.
 * Deterministic rules evaluate city context, taxonomy, GIS jurisdiction, and hazard signals.
 */
export function evaluateRoutingDecision(input: RoutingEngineInput): RoutingDecision {
  const normalizedCity = (input.city || "").toLowerCase() as CitySlug;
  const validCities: CitySlug[] = ["mumbai", "pune", "nagpur"];
  const isCityValid = validCities.includes(normalizedCity);
  const city: CitySlug = isCityValid ? normalizedCity : "nagpur";

  const missingFacts: string[] = [];
  const category = (input.category || "").toLowerCase().trim();
  const subcategory = (input.subcategory || "").toLowerCase().trim();
  const hazardType = (input.hazardType || "").toLowerCase().trim();
  const isEmergency = !!input.isEmergency;
  const lat = input.latitude;
  const lon = input.longitude;

  if (!input.locationText && (lat == null || lon == null)) {
    missingFacts.push("Missing verified incident location coordinates or address text");
  }

  // 1. Boundary & Jurisdiction Check
  let jurisdictionConflict = false;
  let conflictDetectedCity: string | null = null;
  let isOutsideMunicipalBounds = false;

  if (lat != null && lon != null && isCityValid) {
    const isInside = isLocationInCity(lat, lon, city);
    if (!isInside) {
      isOutsideMunicipalBounds = true;
      conflictDetectedCity = detectCityFromCoords(lat, lon);
      if (conflictDetectedCity && conflictDetectedCity !== city) {
        jurisdictionConflict = true;
        missingFacts.push(
          `Coordinates (${lat.toFixed(3)}, ${lon.toFixed(3)}) are in ${conflictDetectedCity.toUpperCase()}, but selected city is ${city.toUpperCase()}`
        );
      } else {
        missingFacts.push(
          `Coordinates (${lat.toFixed(3)}, ${lon.toFixed(3)}) fall outside ${city.toUpperCase()} municipal jurisdiction boundary`
        );
      }
    }
  }

  // Canonical taxonomy aliases for deterministic rule evaluation
  const TAXONOMY_ALIASES: Record<string, { category: string; subcategory?: string }> = {
    water_logging: { category: "water_drainage", subcategory: "waterlogging" },
    waterlogging: { category: "water_drainage", subcategory: "waterlogging" },
    flooding: { category: "water_drainage", subcategory: "waterlogging" },
    blocked_drain: { category: "water_drainage", subcategory: "blocked_drain" },
    drainage: { category: "water_drainage", subcategory: "blocked_drain" },
    culvert_blockage: { category: "water_drainage", subcategory: "blocked_drain" },
    sewage_overflow: { category: "water_drainage", subcategory: "sewage_overflow" },
    pipeline_burst: { category: "water_drainage", subcategory: "pipeline_burst" },
    pothole: { category: "roads_traffic", subcategory: "pothole" },
    road_damage: { category: "roads_traffic", subcategory: "damaged_road" },
    road_cave_in: { category: "roads_traffic", subcategory: "road_cave_in" },
    debris_obstruction: { category: "roads_traffic", subcategory: "road_blockage" },
    live_wire: { category: "electricity", subcategory: "dangling_wire" },
    electrical: { category: "electricity", subcategory: "dangling_wire" },
    power_outage: { category: "electricity", subcategory: "sparking_transformer" },
    transformer_spark: { category: "electricity", subcategory: "sparking_transformer" },
    fire_breakout: { category: "fire_rescue", subcategory: "active_fire" },
    fire: { category: "fire_rescue", subcategory: "active_fire" },
    gas_leak: { category: "fire_rescue", subcategory: "gas_leak" },
    chemical_spill: { category: "fire_rescue", subcategory: "gas_leak" },
    garbage_dump: { category: "waste_cleanliness", subcategory: "garbage_pile" },
    solid_waste: { category: "waste_cleanliness", subcategory: "garbage_pile" },
    carcass_removal: { category: "waste_cleanliness", subcategory: "dead_animal" },
    fallen_tree: { category: "environment", subcategory: "fallen_tree" },
    tree_fall: { category: "environment", subcategory: "fallen_tree" },
  };

  let effectiveCategory = category;
  let effectiveSubcategory = subcategory;

  if (TAXONOMY_ALIASES[category]) {
    effectiveCategory = TAXONOMY_ALIASES[category].category;
    if (!effectiveSubcategory && TAXONOMY_ALIASES[category].subcategory) {
      effectiveSubcategory = TAXONOMY_ALIASES[category].subcategory!;
    }
  }
  if (TAXONOMY_ALIASES[subcategory]) {
    if (!effectiveCategory) effectiveCategory = TAXONOMY_ALIASES[subcategory].category;
    if (TAXONOMY_ALIASES[subcategory].subcategory) {
      effectiveSubcategory = TAXONOMY_ALIASES[subcategory].subcategory!;
    }
  }

  // 2. Candidate Rule Matching
  // Prioritize city-specific rules first, then generic multi-city rules
  let matchedRule: DepartmentRoutingRule | null = null;

  for (const rule of MASTER_ROUTING_RULES) {
    if (rule.city !== city && rule.city !== "all") continue;

    // Check hazardType match if specified
    if (hazardType && rule.hazardType && rule.hazardType === hazardType) {
      matchedRule = rule;
      break;
    }

    // Check category match
    const categoryMatches =
      rule.category === effectiveCategory ||
      rule.category === category ||
      rule.subcategories.includes(category);

    if (categoryMatches) {
      // Check subcategory match
      const subcategoryMatches =
        effectiveSubcategory &&
        (rule.subcategories.includes(effectiveSubcategory) ||
          rule.subcategories.includes(subcategory));

      if (subcategoryMatches) {
        matchedRule = rule;
        break;
      }
      // If no subcategory match yet, store as candidate
      if (!matchedRule) {
        matchedRule = rule;
      }
    }
  }

  // 3. Fallback Handling if No Rule Matched
  if (!matchedRule) {
    const defaultDept = "disaster_management";
    const profile = getCityDepartmentProfile(city, defaultDept);
    const primaryName = profile?.name || "Municipal Disaster Management Cell";

    return {
      matchedRuleId: "RULE-FALLBACK-UNMAPPED",
      ruleVersion: "v1.0",
      city,
      primaryDepartment: defaultDept,
      primaryDepartmentName: primaryName,
      supportingDepartments: [],
      dependencies: [],
      decisionExplanation: `No specific routing rule matched category '${category}' and subcategory '${subcategory}'. Routed to ${primaryName} as central triage queue for human administrative review.`,
      factsUsed: {
        city,
        category,
        subcategory,
        hazardType,
        severity: input.severity,
        isEmergency,
        locationText: input.locationText,
        coordinates: lat != null && lon != null ? [lat, lon] : null,
        linkedEventId: input.activeNearbyEventId,
      },
      missingFacts: [...missingFacts, "Unrecognized civic taxonomy or unmapped department rule"],
      confidenceStatus: "FALLBACK",
      assignmentMode: "AWAITING_APPROVAL",
      slaHours: 24,
      ackMinutes: 120,
      escalationTarget: "Municipal Central Triage Desk",
      isConfigurationGap: true,
      configurationGapReason: `No routing rule defined for category '${category}' in ${city.toUpperCase()}`,
    };
  }

  // 4. Verify Department Configuration for the City
  const isPrimaryConfigured = isDepartmentConfiguredForCity(city, matchedRule.primaryDepartment);
  if (!isPrimaryConfigured) {
    // Configuration Gap: Rule requests a department that doesn't exist in this city
    const fallbackDept = "disaster_management";
    const fallbackProfile = getCityDepartmentProfile(city, fallbackDept);
    const fallbackName = fallbackProfile?.name || "Municipal Control Cell";

    return {
      matchedRuleId: matchedRule.ruleId,
      ruleVersion: "v1.0",
      city,
      primaryDepartment: fallbackDept,
      primaryDepartmentName: fallbackName,
      supportingDepartments: [],
      dependencies: [],
      decisionExplanation: `Configuration Gap Detected: Rule ${matchedRule.ruleId} requires department '${matchedRule.primaryDepartment}', but it is not configured in ${city.toUpperCase()}. Diverted to ${fallbackName} for manual assignment.`,
      factsUsed: {
        city,
        category,
        subcategory,
        hazardType,
        severity: input.severity,
        isEmergency,
        locationText: input.locationText,
        coordinates: lat != null && lon != null ? [lat, lon] : null,
        linkedEventId: input.activeNearbyEventId,
      },
      missingFacts: [...missingFacts, `Department '${matchedRule.primaryDepartment}' is missing from ${city.toUpperCase()} municipal registry`],
      confidenceStatus: "REQUIRES_REVIEW",
      assignmentMode: "AWAITING_APPROVAL",
      slaHours: 12,
      ackMinutes: 60,
      escalationTarget: "Municipal IT & Operations Administrator",
      isConfigurationGap: true,
      configurationGapReason: `Department '${matchedRule.primaryDepartment}' is not registered in ${city.toUpperCase()}`,
    };
  }

  // 5. Filter Supporting Departments to genuinely configured departments in this city
  const supportingDepts: Array<{ code: string; name: string }> = [];
  for (const suppCode of matchedRule.supportingDepartments) {
    if (isDepartmentConfiguredForCity(city, suppCode)) {
      const p = getCityDepartmentProfile(city, suppCode);
      supportingDepts.push({
        code: suppCode,
        name: p?.name || suppCode.replace(/_/g, " "),
      });
    }
  }

  const primaryProfile = getCityDepartmentProfile(city, matchedRule.primaryDepartment);
  const primaryName = primaryProfile?.name || matchedRule.primaryDepartment.replace(/_/g, " ");

  // 6. Assess Confidence and Assignment Mode
  let confidenceStatus: "HIGH" | "MEDIUM" | "REQUIRES_REVIEW" | "FALLBACK" = "HIGH";
  let assignmentMode: "AUTOMATIC" | "RECOMMENDED" | "AWAITING_APPROVAL" = matchedRule.assignmentMode;

  if (jurisdictionConflict || isOutsideMunicipalBounds) {
    confidenceStatus = "REQUIRES_REVIEW";
    assignmentMode = "AWAITING_APPROVAL";
  } else if (missingFacts.length > 0) {
    confidenceStatus = "MEDIUM";
  }

  if (isEmergency && assignmentMode !== "AUTOMATIC") {
    // Severe emergencies require immediate dispatch but marked high visibility
    assignmentMode = "AUTOMATIC";
  }

  // 7. Generate Plain-Language Explanation
  const explanationParts: string[] = [
    `Recommended Primary Department: ${primaryName} (${primaryProfile?.municipalBody || city.toUpperCase()}).`,
    `Reason: ${matchedRule.reasonTemplate}`,
  ];

  if (supportingDepts.length > 0) {
    explanationParts.push(
      `Supporting Departments Required: ${supportingDepts.map((d) => d.name).join(", ")}.`
    );
  }

  if (matchedRule.dependencies && matchedRule.dependencies.length > 0) {
    const depDescriptions = matchedRule.dependencies
      .map(
        (dep) =>
          `${dep.department.replace(/_/g, " ")} must complete '${dep.action.replace(/_/g, " ")}' before '${dep.requiredBefore.replace(/_/g, " ")}' can proceed`
      )
      .join("; ");
    explanationParts.push(`Operational Dependencies: ${depDescriptions}.`);
  }

  if (input.activeNearbyEventId) {
    explanationParts.push(
      `Linked to active candidate hazard event ${input.activeNearbyEventId}; tasks consolidated under single incident history to prevent duplicate work orders.`
    );
  }

  if (jurisdictionConflict) {
    explanationParts.push(
      `WARNING: Location coordinates (${lat?.toFixed(3)}, ${lon?.toFixed(3)}) are in ${conflictDetectedCity?.toUpperCase()}, while active context is ${city.toUpperCase()}. Awaiting administrative jurisdiction confirmation.`
    );
  } else if (isOutsideMunicipalBounds) {
    explanationParts.push(
      `NOTICE: Location coordinates fall outside standard municipal boundary. Administrative approval required before dispatch.`
    );
  }

  const decisionExplanation = explanationParts.join(" ");

  return {
    matchedRuleId: matchedRule.ruleId,
    ruleVersion: "v1.0",
    city,
    primaryDepartment: matchedRule.primaryDepartment,
    primaryDepartmentName: primaryName,
    supportingDepartments: supportingDepts,
    dependencies: matchedRule.dependencies || [],
    decisionExplanation,
    factsUsed: {
      city,
      category,
      subcategory,
      hazardType,
      severity: input.severity,
      isEmergency,
      locationText: input.locationText,
      coordinates: lat != null && lon != null ? [lat, lon] : null,
      linkedEventId: input.activeNearbyEventId,
    },
    missingFacts,
    confidenceStatus,
    assignmentMode,
    slaHours: matchedRule.slaHours,
    ackMinutes: matchedRule.ackMinutes,
    escalationTarget: matchedRule.escalationTarget,
    isConfigurationGap: false,
  };
}
