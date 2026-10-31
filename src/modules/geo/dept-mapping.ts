/* ════════════════════════════════════════════════════════
   Geo Engine — Department → Dataset Mapping (Multi-City)
   Maps AI department codes to the correct GeoJSON
   dataset keys so we only search relevant files.
   
   Each city has its own mapping table.
   ════════════════════════════════════════════════════════ */

/**
 * Maps AI department codes (from department-routing.ts)
 * to GeoJSON dataset keys (filenames without .geojson extension).
 *
 * One department code can map to multiple datasets.
 * The geo router will search all mapped datasets and merge results.
 */
export const DEPT_TO_DATASET: Record<string, string[]> = {
  // Law enforcement
  police:             ["nagpur_city_police"],
  traffic_police:     ["nagpur_city_police", "nagpur_transport_dept_govt_only"],

  // Fire & rescue
  fire_brigade:       ["nagpur_fire_department"],

  // Health & medical (no dedicated dataset yet — fall back to zonal offices)
  health_dept:        ["nagpur_nmc_all_zonal_offices"],
  ambulance:          ["nagpur_nmc_all_zonal_offices"],

  // Water & drainage
  water_supply:       ["nagpur_nmc_water_works"],
  drainage:           ["nagpur_nmc_water_works"],

  // Roads & public works
  road_maintenance:   ["nagpur_nmc_pwd"],
  public_works:       ["nagpur_nmc_pwd"],

  // Traffic
  traffic_management: ["nagpur_transport_dept_govt_only"],

  // Waste
  waste_management:   ["nagpur_nmc_solid_waste_management"],

  // Electrical
  electricity:        ["nagpur_nmc_electrical"],

  // Environment
  environment:        ["nagpur_nmc_garden_environment"],

  // Municipal general
  municipal_corp:     ["nagpur_nmc_all_zonal_offices"],

  // Disaster management (search fire + police + zonal)
  disaster_management: [
    "nagpur_fire_department",
    "nagpur_city_police",
    "nagpur_nmc_all_zonal_offices",
  ],

  // Forest & Wildlife
  forest_wildlife: ["nagpur_territorial_forest_dept_clean"],

  // Women & Child Development
  women_child_dev: ["district_women_and_child_development_nagpur"],

  // Alias — women_child_safety is the code used in department-registry.ts
  women_child_safety: ["district_women_and_child_development_nagpur"],
};

/* ─── Per-city dataset mappings ──────────────────────── */

const PUNE_DEPT_TO_DATASET: Record<string, string[]> = {
  police:             ["pune_traffic_departments"],
  traffic_police:     ["pune_traffic_departments"],
  fire_brigade:       ["pune_fire_brigade_stations"],
  health_dept:        ["pune_health_department_coordinates"],
  ambulance:          ["pune_ambulance_departments"],
  water_supply:       ["pune_water_supply_department_coordinates"],
  drainage:           ["pune_drainage_department_coordinates"],
  road_maintenance:   ["pune_roads_and_pwd_departments"],
  public_works:       ["pune_roads_and_pwd_departments"],
  traffic_management: ["pune_traffic_departments"],
  waste_management:   ["pune_solid_waste_management_coordinates"],
  electricity:        ["pune_electrical_department_coordinates", "pune_electricity_departments"],
  environment:        ["pune_environment_departments"],
  municipal_corp:     ["pune_pmc_all_zonal_offices"],
  disaster_management: [
    "pune_fire_brigade_stations",
    "pune_traffic_departments",
    "pune_pmc_all_zonal_offices",
    "pune_disaster_management_departments",
  ],
  forest_wildlife:    ["pune_forest_department_coordinates"],
  women_child_dev:    ["pune_women_and_child_safety_departments"],
  women_child_safety: ["pune_women_and_child_safety_departments"],
};

const MUMBAI_DEPT_TO_DATASET: Record<string, string[]> = {
  police:             ["mumbai_city_police_clean"],
  traffic_police:     ["mumbai_city_police_clean", "mumbai_transport_dept_clean"],
  fire_brigade:       ["mumbai_fire_brigade_clean"],
  health_dept:        ["mumbai_health_dept_clean"],
  ambulance:          ["mumbai_health_dept_clean"],
  water_supply:       ["mumbai_water_works_clean"],
  drainage:           ["mumbai_water_works_clean"],
  road_maintenance:   ["mumbai_pwd_and_public_works_clean"],
  public_works:       ["mumbai_pwd_and_public_works_clean"],
  traffic_management: ["mumbai_transport_dept_clean"],
  waste_management:   ["mumbai_solid_waste_management_offices (1)"],
  electricity:        ["mumbai_electrical_depots_and_substations_clean"],
  environment:        ["mumbai_garden_and_environment_dept"],
  municipal_corp:     ["mumbai_bmc_all_zonal_offices"],
  disaster_management: [
    "mumbai_fire_brigade_clean",
    "mumbai_city_police_clean",
    "mumbai_bmc_all_zonal_offices",
  ],
  forest_wildlife:    ["mumbai_garden_and_environment_dept"],
  women_child_dev:    ["mumbai_bmc_all_zonal_offices"],
  women_child_safety: ["mumbai_bmc_all_zonal_offices"],
};

/** Per-city mapping table */
const CITY_DEPT_MAPPINGS: Record<string, Record<string, string[]>> = {
  nagpur: DEPT_TO_DATASET,
  pune:   PUNE_DEPT_TO_DATASET,
  mumbai: MUMBAI_DEPT_TO_DATASET,
};

/** Per-city fallback dataset (zonal offices) */
const CITY_FALLBACK_DATASET: Record<string, string> = {
  nagpur: "nagpur_nmc_all_zonal_offices",
  pune:   "pune_pmc_all_zonal_offices",
  mumbai: "mumbai_bmc_all_zonal_offices",
};

/**
 * Resolve which dataset keys to search for a given list of department codes.
 * Deduplicates across multiple department codes.
 * @param departmentCodes - Department codes from AI analysis
 * @param cityId - City ID (nagpur, pune, mumbai). Defaults to nagpur.
 */
export function resolveDatasets(departmentCodes: string[], cityId: string = "nagpur"): string[] {
  const mapping = CITY_DEPT_MAPPINGS[cityId] || DEPT_TO_DATASET;
  const fallback = CITY_FALLBACK_DATASET[cityId] || "nagpur_nmc_all_zonal_offices";
  const datasetKeys = new Set<string>();

  for (const code of departmentCodes) {
    const datasets = mapping[code];
    if (datasets) {
      for (const ds of datasets) {
        datasetKeys.add(ds);
      }
    } else {
      // Unknown department → search zonal offices as fallback
      datasetKeys.add(fallback);
    }
  }

  return [...datasetKeys];
}

/**
 * Get the user-facing department name for display.
 */
export function getDeptDisplayName(code: string): string {
  const names: Record<string, string> = {
    police: "Police",
    traffic_police: "Traffic Police",
    fire_brigade: "Fire & Rescue",
    health_dept: "Health Department",
    ambulance: "Ambulance Services",
    water_supply: "Water Supply",
    drainage: "Drainage",
    road_maintenance: "Road Maintenance (PWD)",
    public_works: "Public Works",
    traffic_management: "Traffic Management",
    waste_management: "Waste Management",
    electricity: "Electricity",
    environment: "Environment",
    municipal_corp: "Municipal Corporation",
    disaster_management: "Disaster Management",
    forest_wildlife: "Forest & Wildlife",
    women_child_dev: "Women & Child Development",
  };
  return names[code] || code.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
