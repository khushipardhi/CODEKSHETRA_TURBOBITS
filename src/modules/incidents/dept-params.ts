/* ════════════════════════════════════════════════════════
   Department Parameter Configuration
   Single source of truth for all dept-specific questions.
   AI picks max 3-4 from the pool per incident.
   Never asks what is already known.
   ════════════════════════════════════════════════════════ */

export type QuestionType = "chip" | "multi_chip" | "yesno" | "text" | "scale";

export interface DeptQuestion {
  id: string;
  question: string;
  type: QuestionType;
  options?: string[];
  placeholder?: string;
  required: boolean;
  /** If this substring appears in the user's description, skip this question */
  skipIfMentioned?: string[];
}

export interface DeptConfig {
  /** Category slug matching category-taxonomy.ts */
  categorySlug: string;
  /** Display name */
  name: string;
  /** Emoji icon */
  icon: string;
  /** Full pool of possible questions (AI picks ≤4 from this) */
  questionPool: DeptQuestion[];
  /** Always protect identity for this dept? */
  sensitiveByDefault: boolean;
}

/** All department parameter configurations */
export const DEPT_CONFIGS: Record<string, DeptConfig> = {
  emergency: {
    categorySlug: "emergency",
    name: "Emergency",
    icon: "🚨",
    sensitiveByDefault: false,
    questionPool: [
      {
        id: "who_affected",
        question: "Who is affected?",
        type: "chip",
        options: ["Only me", "Someone nearby", "Multiple people", "Not sure"],
        required: true,
        skipIfMentioned: ["i am", "my", "people are", "multiple"],
      },
      {
        id: "current_condition",
        question: "What is their current condition?",
        type: "chip",
        options: ["Conscious", "Unconscious", "Injured, needs help", "Unknown"],
        required: true,
        skipIfMentioned: ["unconscious", "conscious", "awake", "injured"],
      },
      {
        id: "exact_location",
        question: "Exact location or landmark?",
        type: "text",
        placeholder: "e.g. Gate 3, 2nd floor, near the lift",
        required: false,
        skipIfMentioned: ["floor", "room", "gate", "building"],
      },
      {
        id: "immediate_danger",
        question: "Is there immediate danger right now?",
        type: "yesno",
        options: ["Yes", "No", "Unsure"],
        required: true,
        skipIfMentioned: ["trapped", "dying", "danger", "emergency"],
      },
      {
        id: "help_en_route",
        question: "Has emergency help been called (112)?",
        type: "yesno",
        options: ["Yes, called", "No, not yet", "Calling now"],
        required: false,
        skipIfMentioned: ["called", "ambulance coming"],
      },
    ],
  },

  police_safety: {
    categorySlug: "police_safety",
    name: "Police & Safety",
    icon: "🛡️",
    sensitiveByDefault: true,
    questionPool: [
      {
        id: "timing",
        question: "When did this happen?",
        type: "chip",
        options: ["Right now", "Within the last hour", "Today", "Earlier"],
        required: true,
        skipIfMentioned: ["now", "just", "today", "yesterday", "ago", "tonight"],
      },
      {
        id: "victim_count",
        question: "How many people are involved/affected?",
        type: "chip",
        options: ["Only me", "2–5 people", "More than 5", "Not sure"],
        required: false,
        skipIfMentioned: ["me", "i was", "multiple people", "crowd"],
      },
      {
        id: "suspect_present",
        question: "Is the suspect/accused still present?",
        type: "chip",
        options: ["Yes, still here", "No, fled", "Unknown"],
        required: true,
        skipIfMentioned: ["fled", "ran", "still here", "gone"],
      },
      {
        id: "evidence",
        question: "Do you have any evidence?",
        type: "multi_chip",
        options: ["Photos", "Video", "Witness", "Documents", "None"],
        required: false,
      },
      {
        id: "protect_identity",
        question: "Should your identity be kept confidential?",
        type: "yesno",
        options: ["Yes, keep private", "No, it's fine"],
        required: false,
      },
      {
        id: "vehicle_number",
        question: "Vehicle number plate (if applicable)?",
        type: "text",
        placeholder: "e.g. MH31 AB 1234",
        required: false,
        skipIfMentioned: ["vehicle", "car", "bike", "auto"],
      },
    ],
  },

  fire_rescue: {
    categorySlug: "fire_rescue",
    name: "Fire & Rescue",
    icon: "🔥",
    sensitiveByDefault: false,
    questionPool: [
      {
        id: "fire_source",
        question: "What caused the fire?",
        type: "chip",
        options: ["Electrical", "Gas / LPG", "Cooking", "Unknown"],
        required: false,
        skipIfMentioned: ["gas", "electric", "lpg", "cooking", "stove", "wire"],
      },
      {
        id: "trapped",
        question: "Is anyone trapped or injured?",
        type: "chip",
        options: ["No one", "Yes — 1 person", "Yes — multiple people"],
        required: true,
        skipIfMentioned: ["trapped", "injured", "no one", "nobody", "inside"],
      },
      {
        id: "spreading",
        question: "Is the fire still spreading?",
        type: "chip",
        options: ["No, contained", "Yes, spreading", "Unsure"],
        required: true,
        skipIfMentioned: ["spreading", "contained", "controlled", "small"],
      },
      {
        id: "floor_location",
        question: "Which floor / area in the building?",
        type: "text",
        placeholder: "e.g. 3rd floor, flat 302, kitchen",
        required: false,
        skipIfMentioned: ["floor", "room", "kitchen", "ground", "basement"],
      },
      {
        id: "smoke_visibility",
        question: "How much smoke is visible?",
        type: "chip",
        options: ["None", "Light smoke", "Heavy smoke"],
        required: false,
        skipIfMentioned: ["smoke", "no smoke"],
      },
    ],
  },

  health_medical: {
    categorySlug: "health_medical",
    name: "Health & Medical",
    icon: "🏥",
    sensitiveByDefault: false,
    questionPool: [
      {
        id: "who_needs_help",
        question: "Who needs medical help?",
        type: "chip",
        options: ["Me", "Family member", "Stranger", "Multiple people"],
        required: true,
        skipIfMentioned: ["i ", "my", "someone", "people", "child", "elderly"],
      },
      {
        id: "condition",
        question: "What is the condition?",
        type: "chip",
        options: ["Unconscious", "Breathing difficulty", "Severe bleeding", "Chest pain", "Other"],
        required: true,
        skipIfMentioned: ["unconscious", "breathing", "bleeding", "chest", "pain"],
      },
      {
        id: "can_move",
        question: "Can the person move on their own?",
        type: "chip",
        options: ["Yes", "No", "With assistance"],
        required: true,
        skipIfMentioned: ["can't move", "cannot move", "walking", "lying"],
      },
      {
        id: "duration",
        question: "How long has this been happening?",
        type: "chip",
        options: ["Just now", "Less than 1 hour", "A few hours", "More than a day"],
        required: false,
        skipIfMentioned: ["minutes", "hours", "days", "since morning", "since yesterday"],
      },
    ],
  },

  water_drainage: {
    categorySlug: "water_drainage",
    name: "Water & Drainage",
    icon: "💧",
    sensitiveByDefault: false,
    questionPool: [
      {
        id: "issue_type",
        question: "What type of water issue?",
        type: "chip",
        options: ["No water supply", "Low pressure", "Dirty/contaminated water", "Pipe burst/leak", "Waterlogging", "Sewage overflow"],
        required: true,
        skipIfMentioned: ["no water", "pressure", "dirty", "contaminated", "leak", "waterlogging", "sewage"],
      },
      {
        id: "affected_area",
        question: "How wide is the impact?",
        type: "chip",
        options: ["Only my house/flat", "Entire building", "Entire street", "Larger area"],
        required: true,
        skipIfMentioned: ["entire area", "whole street", "only my", "building"],
      },
      {
        id: "duration",
        question: "For how long?",
        type: "chip",
        options: ["Since today", "2–3 days", "A week", "Ongoing issue"],
        required: true,
        skipIfMentioned: ["days", "week", "months", "since"],
      },
      {
        id: "road_affected",
        question: "Is road or traffic affected?",
        type: "yesno",
        options: ["Yes", "No"],
        required: false,
        skipIfMentioned: ["road", "traffic", "vehicles"],
      },
    ],
  },

  roads_traffic: {
    categorySlug: "roads_traffic",
    name: "Roads & Traffic",
    icon: "🚗",
    sensitiveByDefault: false,
    questionPool: [
      {
        id: "issue_type",
        question: "What is the road issue?",
        type: "chip",
        options: ["Pothole", "Damaged road", "Waterlogged road", "Open manhole", "Broken signal", "Fallen tree", "Street light out"],
        required: true,
        skipIfMentioned: ["pothole", "damaged", "waterlogged", "manhole", "signal", "tree", "light"],
      },
      {
        id: "blockage_level",
        question: "How is traffic affected?",
        type: "chip",
        options: ["Traffic still flowing", "Slow / congested", "Completely blocked"],
        required: true,
        skipIfMentioned: ["blocked", "slow", "congested", "traffic"],
      },
      {
        id: "injuries",
        question: "Any injuries or accidents?",
        type: "yesno",
        options: ["Yes", "No", "Not sure"],
        required: true,
        skipIfMentioned: ["injured", "accident", "crash", "hurt", "no injuries", "no accident"],
      },
      {
        id: "road_width_affected",
        question: "How much of the road is affected?",
        type: "chip",
        options: ["Partial lane", "Full lane", "Entire road"],
        required: false,
      },
    ],
  },

  waste_cleanliness: {
    categorySlug: "waste_cleanliness",
    name: "Waste & Cleanliness",
    icon: "🗑️",
    sensitiveByDefault: false,
    questionPool: [
      {
        id: "waste_type",
        question: "What kind of waste?",
        type: "chip",
        options: ["Garbage pile", "Overflowing bin", "Construction debris", "Animal carcass", "Open drain/defecation"],
        required: true,
        skipIfMentioned: ["garbage", "waste", "debris", "bin", "overflowing", "carcass"],
      },
      {
        id: "duration",
        question: "How long has this been there?",
        type: "chip",
        options: ["Since today", "A few days", "Over a week", "Long-standing issue"],
        required: true,
        skipIfMentioned: ["days", "week", "months", "since"],
      },
      {
        id: "size",
        question: "Approximate size of the dump?",
        type: "chip",
        options: ["Small (dustbin size)", "Medium (tempo load)", "Large (truck load)"],
        required: false,
      },
      {
        id: "near_water_food",
        question: "Is it near a water source or food market?",
        type: "yesno",
        options: ["Yes", "No", "Not sure"],
        required: false,
        skipIfMentioned: ["near water", "near food", "market", "well", "tap"],
      },
    ],
  },

  environment: {
    categorySlug: "environment",
    name: "Environment",
    icon: "🌿",
    sensitiveByDefault: false,
    questionPool: [
      {
        id: "issue_type",
        question: "What environmental issue?",
        type: "chip",
        options: ["Fallen tree", "Illegal construction", "Encroachment", "Air pollution", "Noise pollution", "Park/garden damage"],
        required: true,
        skipIfMentioned: ["tree", "construction", "encroach", "pollution", "noise", "park", "garden"],
      },
      {
        id: "road_blocked",
        question: "Is road or footpath blocked?",
        type: "yesno",
        options: ["Yes", "No"],
        required: false,
        skipIfMentioned: ["road blocked", "footpath", "path blocked"],
      },
      {
        id: "size",
        question: "Size / scale of the issue?",
        type: "chip",
        options: ["Small", "Medium", "Large / widespread"],
        required: false,
      },
      {
        id: "duration",
        question: "How long has this been going on?",
        type: "chip",
        options: ["Just happened", "Few hours", "Few days", "Long-standing"],
        required: false,
        skipIfMentioned: ["since", "days", "weeks", "hours"],
      },
    ],
  },
};

/**
 * Get department config by category slug.
 * Falls back to a generic minimal config if not found.
 */
export function getDeptConfig(categorySlug: string): DeptConfig | null {
  return DEPT_CONFIGS[categorySlug] ?? null;
}

/**
 * Get all dept configs as an array.
 */
export function getAllDeptConfigs(): DeptConfig[] {
  return Object.values(DEPT_CONFIGS);
}
