/* ════════════════════════════════════════════════════════
   Department Registry — Single source of truth
   Maps department codes → display names, icons, colors,
   incident types. Derived from GeoJSON data files and
   AI routing codes.
   ════════════════════════════════════════════════════════ */

export interface DepartmentInfo {
  code: string;
  name: string;
  shortName: string;
  icon: string;
  color: string;
  bgColor: string;
  geoJsonFile: string | null;
  /** Department category slugs this handles */
  categories: string[];
}

export const DEPARTMENT_REGISTRY: Record<string, DepartmentInfo> = {
  police: {
    code: "police",
    name: "City Police Department",
    shortName: "Police",
    icon: "🛡️",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    geoJsonFile: "nagpur_city_police.geojson",
    categories: ["police_safety"],
  },
  traffic_police: {
    code: "traffic_police",
    name: "Traffic Police",
    shortName: "Traffic",
    icon: "🚦",
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    geoJsonFile: null,
    categories: ["roads_traffic"],
  },
  fire_brigade: {
    code: "fire_brigade",
    name: "Fire Brigade",
    shortName: "Fire",
    icon: "🔥",
    color: "text-red-600",
    bgColor: "bg-red-50",
    geoJsonFile: "nagpur_fire_department.geojson",
    categories: ["fire_rescue"],
  },
  health_dept: {
    code: "health_dept",
    name: "Health Department",
    shortName: "Health",
    icon: "🏥",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    geoJsonFile: null,
    categories: ["health_medical"],
  },
  ambulance: {
    code: "ambulance",
    name: "Ambulance Services",
    shortName: "Ambulance",
    icon: "🚑",
    color: "text-red-500",
    bgColor: "bg-red-50",
    geoJsonFile: null,
    categories: ["health_medical", "emergency"],
  },
  water_supply: {
    code: "water_supply",
    name: "Water Supply Department",
    shortName: "Water",
    icon: "💧",
    color: "text-cyan-600",
    bgColor: "bg-cyan-50",
    geoJsonFile: "nagpur_nmc_water_works.geojson",
    categories: ["water_drainage"],
  },
  drainage: {
    code: "drainage",
    name: "Drainage Department",
    shortName: "Drainage",
    icon: "🌊",
    color: "text-teal-600",
    bgColor: "bg-teal-50",
    geoJsonFile: null,
    categories: ["water_drainage"],
  },
  road_maintenance: {
    code: "road_maintenance",
    name: "Road Maintenance / PWD",
    shortName: "Roads",
    icon: "🛣️",
    color: "text-gray-600",
    bgColor: "bg-gray-50",
    geoJsonFile: "nagpur_nmc_pwd.geojson",
    categories: ["roads_traffic"],
  },
  traffic_management: {
    code: "traffic_management",
    name: "Traffic Management",
    shortName: "Traffic Mgmt",
    icon: "🚗",
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    geoJsonFile: "nagpur_transport_dept_govt_only.geojson",
    categories: ["roads_traffic"],
  },
  waste_management: {
    code: "waste_management",
    name: "Waste Management",
    shortName: "Waste",
    icon: "🗑️",
    color: "text-lime-700",
    bgColor: "bg-lime-50",
    geoJsonFile: "nagpur_nmc_solid_waste_management.geojson",
    categories: ["waste_cleanliness"],
  },
  environment: {
    code: "environment",
    name: "Environmental Department",
    shortName: "Environment",
    icon: "🌿",
    color: "text-green-600",
    bgColor: "bg-green-50",
    geoJsonFile: "nagpur_nmc_garden_environment.geojson",
    categories: ["environment"],
  },
  electricity: {
    code: "electricity",
    name: "Electricity Department",
    shortName: "Electricity",
    icon: "⚡",
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
    geoJsonFile: "nagpur_nmc_electrical.geojson",
    categories: [],
  },
  disaster_management: {
    code: "disaster_management",
    name: "Disaster Management",
    shortName: "Disaster",
    icon: "🚨",
    color: "text-rose-600",
    bgColor: "bg-rose-50",
    geoJsonFile: null,
    categories: ["emergency"],
  },
  municipal_corp: {
    code: "municipal_corp",
    name: "Municipal Corporation (NMC)",
    shortName: "NMC",
    icon: "🏛️",
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
    geoJsonFile: "nagpur_nmc_all_zonal_offices.geojson",
    categories: [],
  },
  public_works: {
    code: "public_works",
    name: "Public Works Department",
    shortName: "PWD",
    icon: "🏗️",
    color: "text-stone-600",
    bgColor: "bg-stone-50",
    geoJsonFile: "nagpur_nmc_pwd.geojson",
    categories: [],
  },
  forest_wildlife: {
    code: "forest_wildlife",
    name: "Forest & Wildlife",
    shortName: "Forest",
    icon: "🐅",
    color: "text-emerald-700",
    bgColor: "bg-emerald-50",
    geoJsonFile: "nagpur_territorial_forest_dept_clean.geojson",
    categories: ["animal_wildlife", "environment"],
  },
  women_child_safety: {
    code: "women_child_safety",
    name: "Women & Child Safety",
    shortName: "W&C Safety",
    icon: "🛡️",
    color: "text-fuchsia-600",
    bgColor: "bg-fuchsia-50",
    geoJsonFile: "district_women_and_child_development_nagpur.geojson",
    categories: ["safety", "emergency"],
  },
};

/** Get department info by code */
export function getDepartmentInfo(code: string): DepartmentInfo | null {
  return DEPARTMENT_REGISTRY[code] ?? null;
}

/** Get all departments as array */
export function getAllDepartments(): DepartmentInfo[] {
  return Object.values(DEPARTMENT_REGISTRY);
}

/** Get departments that handle a specific category */
export function getDepartmentsForCategory(categorySlug: string): DepartmentInfo[] {
  return Object.values(DEPARTMENT_REGISTRY).filter(
    (d) => d.categories.includes(categorySlug)
  );
}
