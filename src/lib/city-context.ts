/* ════════════════════════════════════════════════════════
   City Context — Multi-city configuration & context
   Single source of truth for ALL city metadata.
   
   City is derived from URL params, NOT localStorage.
   ════════════════════════════════════════════════════════ */

export type HazardType = "rainfall" | "flood" | "waterlogging" | "coastal_surge" | "river_flood" | "air_quality" | "heatwave" | "fire" | "earthquake";

export interface CityHazardCapabilities {
  enabledHazards: HazardType[];
  activeDataSources: string[];
  hasCoastalSurge: boolean;
  hasTerrainSinkModel: boolean;
  hasDrainageVectorNetwork: boolean;
  districtCode: string; // for NDMA SACHET
  emergencyHelpline: string;
  disasterControlRoomPhone: string;
  musterPoints: Array<{
    name: string;
    address: string;
    coords: [number, number];
    ward?: string;
    phone: string;
  }>;
  departmentRouting: Record<string, string>;
}

export interface CityConfig {
  id: string;
  slug: string;           // URL segment: nagpur, pune, mumbai
  name: string;
  state: string;
  label: string;           // "Nagpur, Maharashtra"
  center: [number, number]; // [lat, lng]
  zoom: number;
  bounds: [[number, number], [number, number]]; // [[SW_lat, SW_lng], [NE_lat, NE_lng]]
  dataDir: string;         // relative to data/ prefix
  refPrefix: string;       // incident reference prefix: NAG, PUN, MUM
  emoji: string;
  municipalBody: string;
  municipalAbbr: string;
  localities: Array<{ name: string; coords: [number, number] }>;
  hazardCapabilities: CityHazardCapabilities;
}

export const CITIES: Record<string, CityConfig> = {
  nagpur: {
    id: "nagpur",
    slug: "nagpur",
    name: "Nagpur",
    state: "Maharashtra",
    label: "Nagpur, Maharashtra",
    center: [21.1458, 79.0882],
    zoom: 12,
    bounds: [[20.8500, 78.7500], [21.4500, 79.4500]],
    dataDir: "geodata",
    refPrefix: "NAG",
    emoji: "🏛️",
    municipalBody: "Nagpur Municipal Corporation",
    municipalAbbr: "NMC",
    localities: [
      { name: "Zero Mile / Sitabuldi (Center)", coords: [21.1458, 79.0882] },
      { name: "Dharampeth / Ramdaspeth", coords: [21.1394, 79.0645] },
      { name: "Sadar / Civil Lines", coords: [21.1610, 79.0805] },
      { name: "Laxmi Nagar / Bajaj Nagar", coords: [21.1189, 79.0621] },
      { name: "Wardhaman Nagar / Itwari", coords: [21.1523, 79.1245] },
      { name: "Medical Square / Hanuman Nagar", coords: [21.1275, 79.0963] },
      { name: "MIHAN / Nagpur Airport", coords: [21.0592, 79.0558] },
      { name: "Kalamna / Pardi", coords: [21.1689, 79.1567] },
    ],
    hazardCapabilities: {
      enabledHazards: ["rainfall", "waterlogging", "heatwave", "air_quality"],
      activeDataSources: ["open_meteo_weather", "open_meteo_air_quality", "sachet_alerts", "nagpur_geodata"],
      hasCoastalSurge: false,
      hasTerrainSinkModel: false,
      hasDrainageVectorNetwork: false,
      districtCode: "Nagpur",
      emergencyHelpline: "0712-2567011",
      disasterControlRoomPhone: "0712-2567011",
      musterPoints: [
        { name: "NMC Headquarters Disaster Control Room", address: "Civil Lines, Nagpur - 440001", coords: [21.1558, 79.0782], phone: "0712-2567011" },
        { name: "Dharampeth Town Hall Shelter", address: "West High Court Road, Dharampeth", coords: [21.1394, 79.0645], phone: "0712-2532244" },
        { name: "East Nagpur Municipal Community Hall", address: "Wardhaman Nagar, Central Avenue", coords: [21.1523, 79.1245], phone: "0712-2766000" }
      ],
      departmentRouting: {
        rainfall: "drainage",
        waterlogging: "drainage",
        heatwave: "health_dept",
        air_quality: "health_dept",
        fire: "fire_brigade"
      }
    }
  },
  pune: {
    id: "pune",
    slug: "pune",
    name: "Pune",
    state: "Maharashtra",
    label: "Pune, Maharashtra",
    center: [18.5204, 73.8567],
    zoom: 12,
    bounds: [[18.3500, 73.7000], [18.7000, 74.1000]],
    dataDir: "pune",
    refPrefix: "PUN",
    emoji: "🏙️",
    municipalBody: "Pune Municipal Corporation",
    municipalAbbr: "PMC",
    localities: [
      { name: "Shivajinagar (Center)", coords: [18.5308, 73.8475] },
      { name: "Kothrud", coords: [18.5074, 73.8077] },
      { name: "Hinjewadi IT Park", coords: [18.5912, 73.7389] },
      { name: "Koregaon Park", coords: [18.5362, 73.8931] },
      { name: "Hadapsar", coords: [18.5089, 73.9260] },
      { name: "Pune Station", coords: [18.5285, 73.8742] },
      { name: "Pimpri-Chinchwad", coords: [18.6279, 73.8009] },
      { name: "Swargate", coords: [18.5018, 73.8636] },
    ],
    hazardCapabilities: {
      enabledHazards: ["rainfall", "waterlogging", "river_flood", "air_quality", "heatwave"],
      activeDataSources: ["open_meteo_weather", "open_meteo_flood", "open_meteo_air_quality", "sachet_alerts", "pune_civic_facilities"],
      hasCoastalSurge: false,
      hasTerrainSinkModel: false,
      hasDrainageVectorNetwork: false,
      districtCode: "Pune",
      emergencyHelpline: "020-25501000",
      disasterControlRoomPhone: "020-25501269",
      musterPoints: [
        { name: "PMC Main Building Disaster Cell", address: "Shivajinagar, Pune - 411005", coords: [18.5284, 73.8522], phone: "020-25501000" },
        { name: "Yashwantrao Chavan Natyagruha Shelter", address: "Kothrud, Pune - 411038", coords: [18.5042, 73.8115], phone: "020-25381816" },
        { name: "Hadapsar Ward Office Emergency Center", address: "Magarpatta Road, Hadapsar", coords: [18.5089, 73.9260], phone: "020-26890000" }
      ],
      departmentRouting: {
        rainfall: "drainage",
        waterlogging: "drainage",
        river_flood: "drainage",
        air_quality: "health_dept",
        heatwave: "health_dept",
        fire: "fire_brigade"
      }
    }
  },
  mumbai: {
    id: "mumbai",
    slug: "mumbai",
    name: "Mumbai",
    state: "Maharashtra",
    label: "Mumbai, Maharashtra",
    center: [19.0760, 72.8777],
    zoom: 11,
    bounds: [[18.8500, 72.7500], [19.3500, 73.0500]],
    dataDir: "mumbai",
    refPrefix: "MUM",
    emoji: "🌆",
    municipalBody: "Brihanmumbai Municipal Corporation",
    municipalAbbr: "BMC",
    localities: [
      { name: "CST / Fort (South Mumbai)", coords: [18.9398, 72.8354] },
      { name: "Bandra", coords: [19.0544, 72.8402] },
      { name: "Andheri", coords: [19.1197, 72.8464] },
      { name: "Dadar", coords: [19.0178, 72.8478] },
      { name: "Borivali", coords: [19.2307, 72.8567] },
      { name: "Thane", coords: [19.2183, 72.9781] },
      { name: "Navi Mumbai", coords: [19.0330, 73.0297] },
      { name: "Powai / IIT", coords: [19.1264, 72.9047] },
    ],
    hazardCapabilities: {
      enabledHazards: ["rainfall", "flood", "waterlogging", "coastal_surge", "air_quality", "heatwave"],
      activeDataSources: ["open_meteo_weather", "open_meteo_marine", "open_meteo_flood", "open_meteo_air_quality", "sachet_alerts", "mumbai_flood_vector"],
      hasCoastalSurge: true,
      hasTerrainSinkModel: true,
      hasDrainageVectorNetwork: true,
      districtCode: "Mumbai City",
      emergencyHelpline: "1916",
      disasterControlRoomPhone: "022-22694725",
      musterPoints: [
        { name: "BMC F/South Ward Office Disaster Center", address: "Dr. B.A. Road, Parel, Mumbai - 400012", coords: [19.0020, 72.8420], ward: "F/South", phone: "1916" },
        { name: "KEM Hospital Disaster Cell", address: "Acharya Donde Marg, Parel", coords: [19.0018, 72.8422], ward: "F/South", phone: "022-24107000" },
        { name: "BMC Andheri Sports Complex Shelter", address: "Veera Desai Road, Andheri West", coords: [19.1305, 72.8335], ward: "K/West", phone: "022-26239131" },
        { name: "Kurla Municipal School Shelter", address: "S.G. Barve Marg, Kurla West", coords: [19.0664, 72.8845], ward: "L", phone: "022-26505109" }
      ],
      departmentRouting: {
        rainfall: "drainage",
        flood: "drainage",
        waterlogging: "drainage",
        coastal_surge: "fire_brigade",
        air_quality: "health_dept",
        heatwave: "health_dept",
        fire: "fire_brigade"
      }
    }
  },
};

export const CITY_SLUGS = Object.keys(CITIES) as string[];
export const DEFAULT_CITY = "nagpur";

/** Validate a city slug */
export function isValidCity(slug: string | undefined | null): slug is string {
  return typeof slug === "string" && slug in CITIES;
}

/** Get a city config by slug. Returns null for invalid slugs. */
export function getCityConfig(slug: string | undefined | null): CityConfig | null {
  if (!slug || !CITIES[slug]) return null;
  return CITIES[slug];
}

/** Get a city config by slug, with default fallback. */
export function getCityConfigOrDefault(slug: string | undefined | null): CityConfig {
  return CITIES[slug || DEFAULT_CITY] || CITIES[DEFAULT_CITY];
}

/** Get hazard capabilities for a city */
export function getCityHazardCapabilities(slug: string | undefined | null): CityHazardCapabilities {
  const config = getCityConfigOrDefault(slug);
  return config.hazardCapabilities;
}

/** Check if a specific hazard type is enabled for a city */
export function isHazardEnabledForCity(slug: string | undefined | null, hazardType: string): boolean {
  const caps = getCityHazardCapabilities(slug);
  return caps.enabledHazards.includes(hazardType as HazardType);
}

/**
 * Check if GPS coordinates are within a city's bounding box.
 * Returns true if coords fall inside the city's bounds.
 */
export function isLocationInCity(lat: number, lng: number, citySlug: string): boolean {
  const city = CITIES[citySlug];
  if (!city) return false;
  const [[swLat, swLng], [neLat, neLng]] = city.bounds;
  return lat >= swLat && lat <= neLat && lng >= swLng && lng <= neLng;
}

/**
 * Detect which city a GPS coordinate belongs to.
 * Returns the city slug or null if outside all cities.
 */
export function detectCityFromCoords(lat: number, lng: number): string | null {
  for (const slug of Object.keys(CITIES)) {
    if (isLocationInCity(lat, lng, slug)) return slug;
  }
  return null;
}

// ─── Legacy localStorage support (for initial city selection only) ──

const STORAGE_KEY = "urban-link-city";

export function getStoredCityId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored && CITIES[stored] ? stored : null;
  } catch {
    return null;
  }
}

export function setStoredCityId(cityId: string): void {
  if (typeof window === "undefined") return;
  if (!CITIES[cityId]) return;
  try {
    localStorage.setItem(STORAGE_KEY, cityId);
    document.cookie = `${STORAGE_KEY}=${cityId}; path=/; max-age=31536000; SameSite=Lax`;
  } catch {}
}

export const getSelectedCityId = getStoredCityId;
export const setSelectedCityId = setStoredCityId;
export function hasCitySelected(): boolean {
  return getStoredCityId() !== null;
}


