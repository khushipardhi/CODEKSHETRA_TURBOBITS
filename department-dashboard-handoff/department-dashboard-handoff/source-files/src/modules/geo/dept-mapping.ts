/* ════════════════════════════════════════════════════════
   Geo Engine — Department → Dataset Mapping
   Maps AI department codes to the correct GeoJSON
   dataset keys so we only search relevant files.
   ════════════════════════════════════════════════════════ */

/**
 * Maps AI department codes (from department-routing.ts & registry)
 * to GeoJSON dataset keys (filenames without .geojson extension).
 */
export const DEPT_TO_DATASET: Record<string, string[]> = {
  // Law enforcement
  police:                 ["nagpur_city_police"],
  traffic_police:         ["nagpur_city_police", "nagpur_transport_dept_govt_only"],
  traffic_management:     ["nagpur_transport_dept_govt_only"],

  // Fire & rescue
  fire_brigade:           ["nagpur_fire_department"],

  // Health & medical
  health_dept:            ["nagpur_nmc_all_zonal_offices"],
  ambulance:              ["nagpur_nmc_all_zonal_offices"],

  // Water & drainage
  water_supply:           ["nagpur_nmc_water_works"],
  drainage:               ["nagpur_nmc_water_works"],

  // Roads & public works
  road_maintenance:       ["nagpur_nmc_pwd"],
  public_works:           ["nagpur_nmc_pwd"],

  // Waste & Environment
  waste_management:       ["nagpur_nmc_solid_waste_management"],
  environment:            ["nagpur_nmc_garden_environment"],

  // Electrical
  electrical_services:    ["nagpur_nmc_electrical"],
  electricity:            ["nagpur_nmc_electrical"],

  // Forest & Wildlife
  forest_wildlife:        ["nagpur_territorial_forest_dept_clean"],

  // Women & Child Safety
  women_child_safety:     ["district_women_and_child_development_nagpur"],

  // Municipal general & Administration
  municipal_corp:         ["nagpur_nmc_all_zonal_offices"],

  // Disaster management (search fire + police + zonal)
  disaster_management: [
    "nagpur_fire_department",
    "nagpur_city_police",
    "nagpur_nmc_all_zonal_offices",
  ],
};

/**
 * Resolve which dataset keys to search for a given list of department codes.
 * Deduplicates across multiple department codes.
 */
export function resolveDatasets(departmentCodes: string[]): string[] {
  const datasetKeys = new Set<string>();

  for (const code of departmentCodes) {
    const datasets = DEPT_TO_DATASET[code];
    if (datasets) {
      for (const ds of datasets) {
        datasetKeys.add(ds);
      }
    } else {
      // Unknown department → search zonal offices as fallback
      datasetKeys.add("nagpur_nmc_all_zonal_offices");
    }
  }

  return [...datasetKeys];
}

/**
 * Get the user-facing department name for display.
 */
export function getDeptDisplayName(code: string): string {
  const names: Record<string, string> = {
    police: "City Police",
    traffic_police: "Traffic Police",
    traffic_management: "Traffic Management",
    fire_brigade: "Fire & Rescue",
    health_dept: "Health Department",
    ambulance: "Ambulance Services",
    water_supply: "Water Supply",
    drainage: "Drainage",
    road_maintenance: "Road Maintenance (PWD)",
    public_works: "Public Works",
    waste_management: "Waste Management",
    environment: "Environment",
    electrical_services: "Electrical Services",
    electricity: "Electricity Department",
    forest_wildlife: "Forest & Wildlife",
    women_child_safety: "Women & Child Safety",
    municipal_corp: "Municipal Corporation (NMC)",
    disaster_management: "Disaster Management",
  };
  return names[code] || code.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
