/* ════════════════════════════════════════════════════════
   Category Taxonomy — Single source of truth
   8 citizen-facing categories + subcategories
   Used by: CategoryGrid, AI engine, department routing
   ════════════════════════════════════════════════════════ */

export interface Subcategory {
  slug: string;
  name: string;
  keywords: string[];
}

export interface Category {
  slug: string;
  name: string;
  description: string;
  icon: string; // SVG path data or emoji
  subcategories: Subcategory[];
  defaultDepartments: string[];
  locationRequired: boolean;
  photoRecommended: boolean;
  isEmergency: boolean;
  identityProtection: boolean;
}

export const CATEGORIES: Category[] = [
  {
    slug: "emergency",
    name: "Emergency",
    description: "Immediate life-threatening danger",
    icon: "🚨",
    subcategories: [
      { slug: "medical_emergency", name: "Medical Emergency", keywords: ["heart attack", "unconscious", "bleeding", "choking"] },
      { slug: "building_collapse", name: "Building Collapse", keywords: ["collapse", "fallen", "structure"] },
      { slug: "drowning", name: "Drowning / Water Rescue", keywords: ["drowning", "flood", "trapped"] },
      { slug: "gas_leak", name: "Gas Leak / Chemical", keywords: ["gas", "chemical", "smell", "leak"] },
      { slug: "other_emergency", name: "Other Emergency", keywords: [] },
    ],
    defaultDepartments: ["ambulance", "police", "fire_brigade", "disaster_management"],
    locationRequired: true,
    photoRecommended: false,
    isEmergency: true,
    identityProtection: false,
  },
  {
    slug: "police_safety",
    name: "Police & Safety",
    description: "Crime, theft, harassment, suspicious activity",
    icon: "🛡️",
    subcategories: [
      { slug: "theft", name: "Theft / Robbery", keywords: ["stolen", "robbed", "theft", "burglar"] },
      { slug: "harassment", name: "Harassment", keywords: ["harass", "stalk", "threaten"] },
      { slug: "assault", name: "Assault / Violence", keywords: ["attack", "beat", "assault", "fight"] },
      { slug: "suspicious_activity", name: "Suspicious Activity", keywords: ["suspicious", "strange", "unknown"] },
      { slug: "cyber_crime", name: "Cyber Crime / Fraud", keywords: ["UPI", "fraud", "scam", "hack", "online", "cyber", "OTP"] },
      { slug: "public_disturbance", name: "Public Disturbance", keywords: ["noise", "nuisance", "disturbance", "drunk"] },
      { slug: "missing_person", name: "Missing Person", keywords: ["missing", "lost", "child", "elderly"] },
    ],
    defaultDepartments: ["police"],
    locationRequired: true,
    photoRecommended: true,
    isEmergency: false,
    identityProtection: true,
  },
  {
    slug: "fire_rescue",
    name: "Fire & Rescue",
    description: "Fire, gas leak, structural collapse, rescue",
    icon: "🔥",
    subcategories: [
      { slug: "active_fire", name: "Active Fire", keywords: ["fire", "burning", "flames"] },
      { slug: "smoke", name: "Smoke / Suspected Fire", keywords: ["smoke", "smoldering"] },
      { slug: "gas_leak_fire", name: "Gas Leak", keywords: ["gas", "lpg", "cylinder"] },
      { slug: "rescue_needed", name: "Rescue Needed", keywords: ["trapped", "stuck", "rescue"] },
    ],
    defaultDepartments: ["fire_brigade", "police", "ambulance"],
    locationRequired: true,
    photoRecommended: true,
    isEmergency: true,
    identityProtection: false,
  },
  {
    slug: "health_medical",
    name: "Health & Medical",
    description: "Health hazard, contamination, medical emergency",
    icon: "🏥",
    subcategories: [
      { slug: "contaminated_water", name: "Contaminated Water", keywords: ["dirty water", "contaminated", "color", "smell"] },
      { slug: "disease_outbreak", name: "Disease / Outbreak", keywords: ["dengue", "malaria", "fever", "epidemic"] },
      { slug: "food_safety", name: "Food Safety Concern", keywords: ["food poisoning", "expired", "unhygienic"] },
      { slug: "stray_animal", name: "Stray Animal / Dog Bite", keywords: ["dog", "stray", "bite", "animal"] },
      { slug: "open_defecation", name: "Open Defecation", keywords: ["defecation", "urination"] },
    ],
    defaultDepartments: ["health_dept"],
    locationRequired: true,
    photoRecommended: true,
    isEmergency: false,
    identityProtection: false,
  },
  {
    slug: "water_drainage",
    name: "Water & Drainage",
    description: "Water supply, leaks, flooding, sewage, drainage",
    icon: "💧",
    subcategories: [
      { slug: "no_water_supply", name: "No Water Supply", keywords: ["no water", "dry tap", "water cut"] },
      { slug: "water_leak", name: "Water Leak / Pipe Burst", keywords: ["leak", "burst", "pipe", "broken"] },
      { slug: "waterlogging", name: "Waterlogging / Flooding", keywords: ["waterlog", "flood", "standing water", "submerged"] },
      { slug: "sewage_overflow", name: "Sewage Overflow", keywords: ["sewage", "drain", "overflow", "stink"] },
      { slug: "blocked_drain", name: "Blocked Drain", keywords: ["blocked", "clogged", "choked"] },
    ],
    defaultDepartments: ["water_supply", "drainage"],
    locationRequired: true,
    photoRecommended: true,
    isEmergency: false,
    identityProtection: false,
  },
  {
    slug: "roads_traffic",
    name: "Roads & Traffic",
    description: "Potholes, road damage, traffic signals, accidents",
    icon: "🛣️",
    subcategories: [
      { slug: "pothole", name: "Pothole", keywords: ["pothole", "hole", "crater"] },
      { slug: "damaged_road", name: "Damaged Road Surface", keywords: ["damaged", "broken", "cracked", "uneven"] },
      { slug: "broken_signal", name: "Broken Traffic Signal", keywords: ["signal", "traffic light", "not working"] },
      { slug: "road_blockage", name: "Road Blockage", keywords: ["blocked", "obstruction", "barrier"] },
      { slug: "open_manhole", name: "Open Manhole", keywords: ["manhole", "open", "missing cover"] },
      { slug: "road_accident", name: "Road Accident", keywords: ["accident", "collision", "crash", "hit"] },
      { slug: "street_light", name: "Street Light Issue", keywords: ["street light", "dark", "bulb", "lamp"] },
    ],
    defaultDepartments: ["road_maintenance"],
    locationRequired: true,
    photoRecommended: true,
    isEmergency: false,
    identityProtection: false,
  },
  {
    slug: "waste_cleanliness",
    name: "Waste & Cleanliness",
    description: "Garbage, illegal dumping, sanitation",
    icon: "🗑️",
    subcategories: [
      { slug: "garbage_pile", name: "Garbage Pile / Dumping", keywords: ["garbage", "trash", "dump", "waste"] },
      { slug: "missed_collection", name: "Missed Garbage Collection", keywords: ["not collected", "missed", "pickup"] },
      { slug: "overflowing_bin", name: "Overflowing Dustbin", keywords: ["dustbin", "overflowing", "full"] },
      { slug: "construction_debris", name: "Construction Debris", keywords: ["debris", "construction", "rubble"] },
      { slug: "public_toilet", name: "Unclean Public Toilet", keywords: ["toilet", "restroom", "dirty"] },
    ],
    defaultDepartments: ["waste_management", "municipal_corp"],
    locationRequired: true,
    photoRecommended: true,
    isEmergency: false,
    identityProtection: false,
  },
  {
    slug: "environment_public_spaces",
    name: "Environment & Public Spaces",
    description: "Trees, parks, pollution, public infrastructure",
    icon: "🌳",
    subcategories: [
      { slug: "fallen_tree", name: "Fallen / Dangerous Tree", keywords: ["tree", "fallen", "branch", "leaning"] },
      { slug: "park_damage", name: "Park / Garden Damage", keywords: ["park", "garden", "bench", "playground"] },
      { slug: "air_pollution", name: "Air Pollution / Smoke", keywords: ["pollution", "smoke", "burning", "factory"] },
      { slug: "noise_pollution", name: "Noise Pollution", keywords: ["noise", "loud", "music", "construction"] },
      { slug: "encroachment", name: "Encroachment / Illegal Construction", keywords: ["encroachment", "illegal", "footpath", "unauthorized"] },
      { slug: "damaged_public_property", name: "Damaged Public Property", keywords: ["damaged", "broken", "vandalized", "graffiti"] },
    ],
    defaultDepartments: ["environment", "municipal_corp"],
    locationRequired: true,
    photoRecommended: true,
    isEmergency: false,
    identityProtection: false,
  },
];

/** Find a category by slug */
export function getCategoryBySlug(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

/** Find a subcategory across all categories */
export function findSubcategory(slug: string): { category: Category; subcategory: Subcategory } | undefined {
  for (const cat of CATEGORIES) {
    const sub = cat.subcategories.find((s) => s.slug === slug);
    if (sub) return { category: cat, subcategory: sub };
  }
  return undefined;
}

/** Get all category slugs for AI prompt */
export function getCategorySlugsForAI(): string[] {
  return CATEGORIES.map((c) => c.slug);
}

/** Get all subcategory slugs for AI prompt */
export function getSubcategorySlugsForAI(): string[] {
  return CATEGORIES.flatMap((c) => c.subcategories.map((s) => s.slug));
}
