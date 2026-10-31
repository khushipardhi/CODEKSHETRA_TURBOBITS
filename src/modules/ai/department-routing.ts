/* ════════════════════════════════════════════════════════
   Department Routing Configuration
   AI recommends → App rules finalize
   Configurable, not hard-coded throughout source
   ════════════════════════════════════════════════════════ */

export interface DepartmentInfo {
  code: string;
  name: string;
  nameMarathi?: string;
  description: string;
  scope?: string;
  priorityBand?: string;
  slaHours?: number;
  subcategories?: string[];
  icon?: string;
}

/** All known departments */
export const DEPARTMENTS: DepartmentInfo[] = [
  {
    code: "police",
    name: "Police Department",
    nameMarathi: "पोलीस विभाग",
    description: "Law enforcement and public safety",
    scope: "Law & order, violent crimes, theft, physical threats, cyber fraud, public disturbances.",
    priorityBand: "IMMEDIATE_EMERGENCY",
    slaHours: 2,
    subcategories: ["Theft / Robbery", "Assault / Physical Harm", "Cyber Crime / Fraud", "Public Disturbance", "Missing Person", "Harassment"],
    icon: "🛡️",
  },
  {
    code: "traffic_police",
    name: "Traffic Police",
    nameMarathi: "वाहतूक पोलीस",
    description: "Traffic regulation and accident response",
    scope: "Live road accidents, severe traffic jams, reckless driving, illegal parking blocking major roads.",
    priorityBand: "IMMEDIATE_EMERGENCY",
    slaHours: 2,
    subcategories: ["Road Accident", "Major Traffic Jam", "Illegal Parking Obstruction", "Reckless Driving"],
    icon: "🚦",
  },
  {
    code: "fire_brigade",
    name: "Fire Brigade",
    nameMarathi: "अग्निशामक दल",
    description: "Fire suppression and rescue operations",
    scope: "Active structural fires, vehicular fires, chemical/gas leaks, building collapses, water rescue.",
    priorityBand: "IMMEDIATE_EMERGENCY",
    slaHours: 1,
    subcategories: ["Building Fire", "Gas Leak / Chemical Spill", "Building Collapse", "Water / Flood Rescue", "Vehicle Fire"],
    icon: "🔥",
  },
  {
    code: "health_dept",
    name: "Health Department",
    nameMarathi: "सार्वजनिक आरोग्य विभाग",
    description: "Public health and disease control",
    scope: "Disease outbreaks (dengue, malaria), food poisoning clusters, public sanitation hazards.",
    priorityBand: "URGENT",
    slaHours: 12,
    subcategories: ["Epidemic / Disease Outbreak", "Food Safety Violation", "Medical Waste Dumping", "Mosquito Breeding Site"],
    icon: "🏥",
  },
  {
    code: "ambulance",
    name: "Ambulance Services",
    nameMarathi: "रुग्णवाहिका सेवा",
    description: "Emergency medical transport",
    scope: "Critical medical emergencies requiring immediate patient transport (108 / 102).",
    priorityBand: "IMMEDIATE_EMERGENCY",
    slaHours: 1,
    subcategories: ["Critical Medical Trauma", "Cardiac / Stroke Emergency", "Accident Victim Transport"],
    icon: "🚑",
  },
  {
    code: "water_supply",
    name: "Water Supply Department",
    nameMarathi: "पाणी पुरवठा विभाग",
    description: "Municipal water supply management",
    scope: "Major pipeline bursts, contaminated/discolored tap water, zero pressure, illegal booster pumps.",
    priorityBand: "URGENT",
    slaHours: 8,
    subcategories: ["Pipeline Burst", "Contaminated Tap Water", "Zero Water Supply", "Water Tanker Request", "Illegal Booster Pump"],
    icon: "💧",
  },
  {
    code: "drainage",
    name: "Drainage Department",
    nameMarathi: "मलनिस्सारण विभाग",
    description: "Stormwater and sewage drainage",
    scope: "Open manholes, overflowing sewage lines, stormwater drain blockages causing localized inundation.",
    priorityBand: "URGENT",
    slaHours: 6,
    subcategories: ["Open / Missing Manhole", "Sewage Overflow on Road", "Stormwater Drain Choked", "Waterlogging Inundation"],
    icon: "🌊",
  },
  {
    code: "road_maintenance",
    name: "Road Maintenance / PWD",
    nameMarathi: "रस्ते देखभाल / सार्वजनिक बांधकाम",
    description: "Road repair and public works",
    scope: "Dangerous potholes, road cave-ins, broken medians, asphalt degradation, missing guardrails.",
    priorityBand: "STANDARD",
    slaHours: 24,
    subcategories: ["Dangerous Pothole", "Road Cave-in", "Broken Speed Breaker", "Damaged Divider / Median", "Footpath Encroachment"],
    icon: "🛣️",
  },
  {
    code: "traffic_management",
    name: "Traffic Management",
    nameMarathi: "वाहतूक व्यवस्थापन",
    description: "Signal maintenance and traffic flow",
    scope: "Non-functional traffic signals, damaged road signboards, missing reflective road studs/markings.",
    priorityBand: "STANDARD",
    slaHours: 12,
    subcategories: ["Traffic Signal Malfunction", "Missing / Broken Signboard", "Damaged Blinkers", "Road Zebra Markings"],
    icon: "🚥",
  },
  {
    code: "waste_management",
    name: "Waste Management",
    nameMarathi: "घनकचरा व्यवस्थापन",
    description: "Solid waste collection and disposal",
    scope: "Uncollected residential garbage, overflow of public garbage bins, dead animal disposal.",
    priorityBand: "STANDARD",
    slaHours: 12,
    subcategories: ["Garbage Dump on Road", "Overflowing Community Bin", "Dead Animal Removal", "Door-to-door Van Missed"],
    icon: "🗑️",
  },
  {
    code: "environment",
    name: "Environmental Department",
    nameMarathi: "पर्यावरण विभाग",
    description: "Environmental protection and green spaces",
    scope: "Illegal burning of garbage/leaves, industrial air emission violations, lake/river water pollution.",
    priorityBand: "STANDARD",
    slaHours: 24,
    subcategories: ["Open Garbage Burning", "Industrial Air Pollution", "Nag River / Lake Pollution", "Noise Pollution"],
    icon: "🌳",
  },
  {
    code: "electricity",
    name: "Electricity Department",
    nameMarathi: "विद्युत विभाग (MSEDCL / NMC)",
    description: "Power supply and street lighting",
    scope: "Sparking transformers, dangling live wires, widespread blackout, faulty streetlights.",
    priorityBand: "URGENT",
    slaHours: 4,
    subcategories: ["Dangling Live Wire", "Transformer Sparking / Explosion", "Streetlight Blackout", "Area Power Outage", "Open Feeder Pillar"],
    icon: "⚡",
  },
  {
    code: "disaster_management",
    name: "Disaster Management",
    nameMarathi: "आपत्ती व्यवस्थापन सेल",
    description: "Natural and man-made disaster response",
    scope: "City-wide flooding, severe cyclonic damage, chemical disasters, multi-agency mass rescue.",
    priorityBand: "IMMEDIATE_EMERGENCY",
    slaHours: 1,
    subcategories: ["Severe City Flooding", "Storm / Gale Damage", "Mass Casualty Incident", "Earthquake / Tremor"],
    icon: "🚨",
  },
  {
    code: "municipal_corp",
    name: "Municipal Corporation",
    nameMarathi: "नागपूर महानगरपालिका (NMC)",
    description: "General municipal services (NMC)",
    scope: "Illegal constructions, stray dog menace, public park maintenance, trade license grievances.",
    priorityBand: "STANDARD",
    slaHours: 48,
    subcategories: ["Unauthorized Construction", "Stray Dog Pack / Sterilization", "Public Park Maintenance", "Property Tax Grievance"],
    icon: "🏢",
  },
  {
    code: "public_works",
    name: "Public Works Department",
    nameMarathi: "सार्वजनिक बांधकाम विभाग",
    description: "Infrastructure and construction",
    scope: "Bridge structural defects, flyover cracks, public building collapse risks, government asset repair.",
    priorityBand: "URGENT",
    slaHours: 24,
    subcategories: ["Flyover / Bridge Structural Crack", "Government Building Damage", "Public Footover Bridge Issue"],
    icon: "🚧",
  },
  {
    code: "forest_wildlife",
    name: "Forest & Wildlife Department",
    nameMarathi: "वन व वन्यजीव विभाग",
    description: "Forest conservation, wildlife protection, tree-related issues",
    scope: "Dangerous overgrown trees falling, wild animal intrusions (leopards, snakes, monkeys), illegal tree felling.",
    priorityBand: "URGENT",
    slaHours: 6,
    subcategories: ["Fallen / Dangerous Tree", "Wild Animal / Snake Sighting", "Illegal Tree Cutting", "Forest Boundary Encroachment"],
    icon: "🌲",
  },
  {
    code: "women_child_dev",
    name: "Women & Child Development",
    nameMarathi: "महिला व बाल विकास विभाग",
    description: "Women's safety, child protection, domestic issues",
    scope: "Child labor, abandoned children, domestic violence assistance, women shelter support, counseling helplines.",
    priorityBand: "IMMEDIATE_EMERGENCY",
    slaHours: 2,
    subcategories: ["Child Labor Rescue", "Abandoned / Lost Child", "Domestic Abuse Support", "Women Helpline Assistance"],
    icon: "👩‍👧",
  },
];

/**
 * Routing rules: subcategory/incident type → required departments
 * AI recommends departments, but these rules ensure completeness
 */
export const ROUTING_RULES: Record<string, string[]> = {
  // Emergency
  medical_emergency: ["ambulance", "health_dept", "police"],
  building_collapse: ["fire_brigade", "police", "ambulance", "disaster_management"],
  drowning: ["fire_brigade", "ambulance", "police"],
  gas_leak: ["fire_brigade", "police"],
  other_emergency: ["police", "ambulance"],

  // Police & Safety
  theft: ["police"],
  harassment: ["police"],
  assault: ["police", "ambulance"],
  suspicious_activity: ["police"],
  cyber_crime: ["police"],
  public_disturbance: ["police"],
  missing_person: ["police"],

  // Fire & Rescue
  active_fire: ["fire_brigade", "police", "ambulance"],
  smoke: ["fire_brigade"],
  gas_leak_fire: ["fire_brigade", "police"],
  rescue_needed: ["fire_brigade", "ambulance", "police"],

  // Health
  contaminated_water: ["health_dept", "water_supply"],
  disease_outbreak: ["health_dept"],
  food_safety: ["health_dept", "municipal_corp"],
  stray_animal: ["municipal_corp", "health_dept"],
  open_defecation: ["health_dept", "municipal_corp"],

  // Water & Drainage
  no_water_supply: ["water_supply"],
  water_leak: ["water_supply"],
  waterlogging: ["drainage", "road_maintenance", "traffic_management"],
  sewage_overflow: ["drainage", "health_dept"],
  blocked_drain: ["drainage"],

  // Roads & Traffic
  pothole: ["road_maintenance"],
  damaged_road: ["road_maintenance"],
  broken_signal: ["traffic_management"],
  road_blockage: ["road_maintenance", "traffic_police"],
  open_manhole: ["road_maintenance", "municipal_corp"],
  road_accident: ["police", "traffic_police", "ambulance"],
  street_light: ["electricity", "municipal_corp"],

  // Waste
  garbage_pile: ["waste_management"],
  missed_collection: ["waste_management"],
  overflowing_bin: ["waste_management"],
  construction_debris: ["waste_management", "municipal_corp"],
  public_toilet: ["municipal_corp", "health_dept"],

  // Environment
  fallen_tree: ["environment", "road_maintenance", "traffic_management"],
  park_damage: ["environment", "municipal_corp"],
  air_pollution: ["environment"],
  noise_pollution: ["environment", "police"],
  encroachment: ["municipal_corp", "police"],
  damaged_public_property: ["municipal_corp", "police"],

  // Forest & Wildlife
  animal_attack: ["forest_wildlife", "police", "ambulance"],
  wild_animal_sighting: ["forest_wildlife", "police"],
  illegal_logging: ["forest_wildlife", "police"],
  forest_fire: ["forest_wildlife", "fire_brigade", "disaster_management"],
  wildlife_conflict: ["forest_wildlife"],
  tree_fall: ["forest_wildlife", "road_maintenance", "municipal_corp"],
  illegal_hunting: ["forest_wildlife", "police"],

  // Women & Child Safety
  domestic_violence: ["women_child_dev", "police"],
  child_abuse: ["women_child_dev", "police"],
  missing_child: ["women_child_dev", "police"],
  eve_teasing: ["women_child_dev", "police"],
  dowry_harassment: ["women_child_dev", "police"],
  child_labor: ["women_child_dev", "police"],
  women_helpline: ["women_child_dev"],
};

/** Priority thresholds — configurable */
export const PRIORITY_BANDS = {
  LOW: { min: 0, max: 30, label: "Low" },
  MEDIUM: { min: 31, max: 60, label: "Medium" },
  HIGH: { min: 61, max: 80, label: "High" },
  CRITICAL: { min: 81, max: 100, label: "Critical" },
} as const;

export type PriorityBand = keyof typeof PRIORITY_BANDS;

/** Determine priority band from score */
export function getPriorityBand(score: number): PriorityBand {
  if (score >= PRIORITY_BANDS.CRITICAL.min) return "CRITICAL";
  if (score >= PRIORITY_BANDS.HIGH.min) return "HIGH";
  if (score >= PRIORITY_BANDS.MEDIUM.min) return "MEDIUM";
  return "LOW";
}

/** Resolve departments for a given subcategory, merging AI recommendations */
export function resolveDepartments(
  subcategorySlug: string | null,
  aiRecommended: string[]
): string[] {
  const rulesDepts = subcategorySlug
    ? ROUTING_RULES[subcategorySlug] || []
    : [];

  // Merge: routing rules + AI recommendations, deduplicated
  const merged = new Set([...rulesDepts, ...aiRecommended]);
  
  // Validate: only allow known department codes
  const validCodes = new Set(DEPARTMENTS.map((d) => d.code));
  return [...merged].filter((code) => validCodes.has(code));
}

/** Get department info by code */
export function getDepartmentByCode(code: string): DepartmentInfo | undefined {
  return DEPARTMENTS.find((d) => d.code === code);
}

/** Format department name from code */
export function formatDepartmentName(code: string): string {
  return getDepartmentByCode(code)?.name || code.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
