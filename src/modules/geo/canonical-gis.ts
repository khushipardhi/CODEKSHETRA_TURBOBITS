/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Canonical GIS Identity & Spatial Resolver
   Phase 2: Authoritative Ward & Zonal Geometry Resolution
   
   Guarantees:
   - 100% deterministic spatial identity across all 24 Mumbai BMC wards
   - Pune (5 PMC zones) and Nagpur (10 NMC zones) city-isolated identity
   - Strict polygon bounding box calculation (Polygon & MultiPolygon)
   - Zero hardcoded coordinate jumping when valid geometry exists
   - Universal alias resolution (e.g. "F/S", "F/South", "FS" -> "F/South")
   ════════════════════════════════════════════════════════ */

export interface CanonicalWardMetadata {
  id: string; // Official Canonical ID: "A", "F/South", "L", etc.
  shortCode: string; // Display shorthand: "A", "F/S", "L", etc.
  name: string; // Full display name
  nameMr: string; // Marathi official designation
  zoneCode: string; // Parent Zone: "ZONE-I" to "ZONE-VII"
  officeCoords: [number, number]; // [lat, lng]
  isCoastal: boolean;
  drainageBasin: string;
}

/** 24 Canonical Greater Mumbai BMC Administrative Wards */
export const MUMBAI_CANONICAL_WARDS: Record<string, CanonicalWardMetadata> = {
  "A": {
    id: "A",
    shortCode: "A",
    name: "Ward A (Colaba / Fort / Churchgate)",
    nameMr: "ए विभाग (कुलाबा / फोर्ट / चर्चगेट)",
    zoneCode: "ZONE-I",
    officeCoords: [18.9328, 72.8364],
    isCoastal: true,
    drainageBasin: "Arabian Sea South & Mumbai Harbour Outfalls",
  },
  "B": {
    id: "B",
    shortCode: "B",
    name: "Ward B (Sandhurst Road / Dongri / Bhendi Bazar)",
    nameMr: "बी विभाग (सँडहर्स्ट रोड / डोंगरी / भेंडी बाजार)",
    zoneCode: "ZONE-I",
    officeCoords: [18.9567, 72.8384],
    isCoastal: false,
    drainageBasin: "Mumbai Harbour Central Outfall",
  },
  "C": {
    id: "C",
    shortCode: "C",
    name: "Ward C (Marine Lines / Kalbadevi / Bhuleshwar)",
    nameMr: "सी विभाग (मरीन लाइन्स / काळबादेवी / भुलेश्वर)",
    zoneCode: "ZONE-I",
    officeCoords: [18.9482, 72.8258],
    isCoastal: true,
    drainageBasin: "Back Bay / Marine Drive Coastal Outfall",
  },
  "D": {
    id: "D",
    shortCode: "D",
    name: "Ward D (Grant Road / Malabar Hill / Walkeshwar)",
    nameMr: "डी विभाग (ग्रँट रोड / मलबार हिल / वाळकेश्वर)",
    zoneCode: "ZONE-I",
    officeCoords: [18.9612, 72.8134],
    isCoastal: true,
    drainageBasin: "Malabar Hill Escarpment & Arabian Sea West",
  },
  "E": {
    id: "E",
    shortCode: "E",
    name: "Ward E (Byculla / Nagpada / Mazgaon)",
    nameMr: "ई विभाग (भायखळा / नागपाडा / माझगाव)",
    zoneCode: "ZONE-I",
    officeCoords: [18.9721, 72.8341],
    isCoastal: true,
    drainageBasin: "Mazgaon Docks & Eastern Waterways",
  },
  "F/South": {
    id: "F/South",
    shortCode: "F/S",
    name: "Ward F/South (Parel / Sewri / Naigaon)",
    nameMr: "एफ/दक्षिण विभाग (परळ / शिवडी / नायगाव)",
    zoneCode: "ZONE-II",
    officeCoords: [19.0020, 72.8420],
    isCoastal: true,
    drainageBasin: "Mahul Creek & Eastern Seaboard Outfall",
  },
  "F/North": {
    id: "F/North",
    shortCode: "F/N",
    name: "Ward F/North (Matunga / Sion / Wadala)",
    nameMr: "एफ/उत्तर विभाग (माटुंगा / सायन / वडाळा)",
    zoneCode: "ZONE-II",
    officeCoords: [19.0315, 72.8596],
    isCoastal: true,
    drainageBasin: "Mahul Creek & Sion-Matunga Drain Corridor",
  },
  "G/South": {
    id: "G/South",
    shortCode: "G/S",
    name: "Ward G/South (Worli / Lower Parel / Prabhadevi)",
    nameMr: "जी/दक्षिण विभाग (वरळी / लोअर परळ / प्रभादेवी)",
    zoneCode: "ZONE-II",
    officeCoords: [19.0012, 72.8194],
    isCoastal: true,
    drainageBasin: "Love Grove Outfall & Arabian Sea West",
  },
  "G/North": {
    id: "G/North",
    shortCode: "G/N",
    name: "Ward G/North (Dadar / Dharavi / Mahim)",
    nameMr: "जी/उत्तर विभाग (दादर / धारावी / माहीम)",
    zoneCode: "ZONE-II",
    officeCoords: [19.0345, 72.8421],
    isCoastal: true,
    drainageBasin: "Mithi River Estuary & Mahim Bay Outfall",
  },
  "H/East": {
    id: "H/East",
    shortCode: "H/E",
    name: "Ward H/East (Bandra East / Santacruz East / BKC)",
    nameMr: "एच/पूर्व विभाग (वांद्रे पूर्व / सांताक्रूझ पूर्व / बीकेसी)",
    zoneCode: "ZONE-III",
    officeCoords: [19.0621, 72.8524],
    isCoastal: false,
    drainageBasin: "Mithi River Central Channel & Vakola Nullah",
  },
  "H/West": {
    id: "H/West",
    shortCode: "H/W",
    name: "Ward H/West (Bandra West / Khar West / Santacruz West)",
    nameMr: "एच/पश्चिम विभाग (वांद्रे पश्चिम / खार पश्चिम / सांताक्रूझ पश्चिम)",
    zoneCode: "ZONE-III",
    officeCoords: [19.0584, 72.8361],
    isCoastal: true,
    drainageBasin: "Gazdarbandh Pumping Station & Arabian Sea",
  },
  "K/East": {
    id: "K/East",
    shortCode: "K/E",
    name: "Ward K/East (Andheri East / Marol / SEEPZ)",
    nameMr: "के/पूर्व विभाग (अंधेरी पूर्व / मरोळ / सीप्झ)",
    zoneCode: "ZONE-III",
    officeCoords: [19.1172, 72.8624],
    isCoastal: false,
    drainageBasin: "Upper Mithi River Basin & Oshiwara Tributary",
  },
  "K/West": {
    id: "K/West",
    shortCode: "K/W",
    name: "Ward K/West (Andheri West / Juhu / Versova)",
    nameMr: "के/पश्चिम विभाग (अंधेरी पश्चिम / जुहू / वर्सोवा)",
    zoneCode: "ZONE-III",
    officeCoords: [19.1305, 72.8335],
    isCoastal: true,
    drainageBasin: "Irla Nullah / Versova Creek Outfall",
  },
  "P/South": {
    id: "P/South",
    shortCode: "P/S",
    name: "Ward P/South (Goregaon / Aarey)",
    nameMr: "पी/दक्षिण विभाग (गोरेगाव / आरे)",
    zoneCode: "ZONE-IV",
    officeCoords: [19.1624, 72.8465],
    isCoastal: false,
    drainageBasin: "Oshiwara River Drainage Corridor",
  },
  "P/North": {
    id: "P/North",
    shortCode: "P/N",
    name: "Ward P/North (Malad / Madh Island / Marve)",
    nameMr: "पी/उत्तर विभाग (मालाड / मढ बेट / मार्वे)",
    zoneCode: "ZONE-IV",
    officeCoords: [19.1864, 72.8482],
    isCoastal: true,
    drainageBasin: "Malad Creek & Marve Beach Outfall",
  },
  "L": {
    id: "L",
    shortCode: "L",
    name: "Ward L (Kurla / Sakinaka / Asalpha)",
    nameMr: "एल विभाग (कुर्ला / साकीनाका / असल्फा)",
    zoneCode: "ZONE-V",
    officeCoords: [19.0664, 72.8845],
    isCoastal: false,
    drainageBasin: "Mithi River Mid-Stream (Kranti Nagar Basin)",
  },
  "M/East": {
    id: "M/East",
    shortCode: "M/E",
    name: "Ward M/East (Govandi / Mankhurd / Shivaji Nagar)",
    nameMr: "एम/पूर्व विभाग (गोवंडी / मानखुर्द / शिवाजी नगर)",
    zoneCode: "ZONE-V",
    officeCoords: [19.0521, 72.9214],
    isCoastal: true,
    drainageBasin: "Thane Creek Estuary & Vashi Channel",
  },
  "M/West": {
    id: "M/West",
    shortCode: "M/W",
    name: "Ward M/West (Chembur / Tilak Nagar / Mahul)",
    nameMr: "एम/पश्चिम विभाग (चेंबर / टिळक नगर / माहुल)",
    zoneCode: "ZONE-V",
    officeCoords: [19.0612, 72.8984],
    isCoastal: true,
    drainageBasin: "Mahul Creek & Eastern Freeway Outfall",
  },
  "N": {
    id: "N",
    shortCode: "N",
    name: "Ward N (Ghatkopar / Vikhroli West)",
    nameMr: "एन विभाग (घाटकोपर / विक्रोळी पश्चिम)",
    zoneCode: "ZONE-VI",
    officeCoords: [19.0864, 72.9084],
    isCoastal: false,
    drainageBasin: "Thane Creek Drainage Catchment",
  },
  "S": {
    id: "S",
    shortCode: "S",
    name: "Ward S (Bhandup / Kanjurmarg / Powai)",
    nameMr: "एस विभाग (भांडुप / कांजूरमार्ग / पवई)",
    zoneCode: "ZONE-VI",
    officeCoords: [19.1465, 72.9324],
    isCoastal: false,
    drainageBasin: "Powai Lake Basin & Kanjur Creek",
  },
  "T": {
    id: "T",
    shortCode: "T",
    name: "Ward T (Mulund / Nahur)",
    nameMr: "टी विभाग (मुलुंड / नाहूर)",
    zoneCode: "ZONE-VI",
    officeCoords: [19.1724, 72.9564],
    isCoastal: false,
    drainageBasin: "Thane Creek North / Mulund Outfall",
  },
  "R/South": {
    id: "R/South",
    shortCode: "R/S",
    name: "Ward R/South (Kandivali / Charkop)",
    nameMr: "आर/दक्षिण विभाग (कांदिवली / चारकोप)",
    zoneCode: "ZONE-VII",
    officeCoords: [19.2064, 72.8512],
    isCoastal: true,
    drainageBasin: "Poinsur River & Charkop Creek Basin",
  },
  "R/Central": {
    id: "R/Central",
    shortCode: "R/C",
    name: "Ward R/Central (Borivali / Gorai / Shimpoli)",
    nameMr: "आर/मध्य विभाग (बोरिवली / गोराई / शिंपोली)",
    zoneCode: "ZONE-VII",
    officeCoords: [19.2312, 72.8567],
    isCoastal: true,
    drainageBasin: "Gorai Creek & Dahisar River Catchment",
  },
  "R/North": {
    id: "R/North",
    shortCode: "R/N",
    name: "Ward R/North (Dahisar)",
    nameMr: "आर/उत्तर विभाग (दहीसर)",
    zoneCode: "ZONE-VII",
    officeCoords: [19.2567, 72.8594],
    isCoastal: true,
    drainageBasin: "Dahisar River & Mira-Bhayandar Boundary Outfall",
  },
};

/** Universal Alias Dictionary for Greater Mumbai BMC Wards */
const MUMBAI_ALIAS_MAP: Record<string, string> = {
  // Single letter wards
  "a": "A", "ward a": "A", "ward-a": "A",
  "b": "B", "ward b": "B", "ward-b": "B",
  "c": "C", "ward c": "C", "ward-c": "C",
  "d": "D", "ward d": "D", "ward-d": "D",
  "e": "E", "ward e": "E", "ward-e": "E",
  "l": "L", "ward l": "L", "ward-l": "L",
  "n": "N", "ward n": "N", "ward-n": "N",
  "s": "S", "ward s": "S", "ward-s": "S",
  "t": "T", "ward t": "T", "ward-t": "T",

  // F wards
  "f/south": "F/South", "f-south": "F/South", "f_south": "F/South", "fsouth": "F/South",
  "f/s": "F/South", "f-s": "F/South", "fs": "F/South", "ward f/south": "F/South", "ward f/s": "F/South",
  "f/north": "F/North", "f-north": "F/North", "f_north": "F/North", "fnorth": "F/North",
  "f/n": "F/North", "f-n": "F/North", "fn": "F/North", "ward f/north": "F/North", "ward f/n": "F/North",

  // G wards
  "g/south": "G/South", "g-south": "G/South", "g_south": "G/South", "gsouth": "G/South",
  "g/s": "G/South", "g-s": "G/South", "gs": "G/South", "ward g/south": "G/South", "ward g/s": "G/South",
  "g/north": "G/North", "g-north": "G/North", "g_north": "G/North", "gnorth": "G/North",
  "g/n": "G/North", "g-n": "G/North", "gn": "G/North", "ward g/north": "G/North", "ward g/n": "G/North",

  // H wards
  "h/east": "H/East", "h-east": "H/East", "h_east": "H/East", "heast": "H/East",
  "h/e": "H/East", "h-e": "H/East", "he": "H/East", "ward h/east": "H/East", "ward h/e": "H/East",
  "h/west": "H/West", "h-west": "H/West", "h_west": "H/West", "hwest": "H/West",
  "h/w": "H/West", "h-w": "H/West", "hw": "H/West", "ward h/west": "H/West", "ward h/w": "H/West",

  // K wards
  "k/east": "K/East", "k-east": "K/East", "k_east": "K/East", "keast": "K/East",
  "k/e": "K/East", "k-e": "K/East", "ke": "K/East", "ward k/east": "K/East", "ward k/e": "K/East",
  "k/west": "K/West", "k-west": "K/West", "k_west": "K/West", "kwest": "K/West",
  "k/w": "K/West", "k-w": "K/West", "kw": "K/West", "ward k/west": "K/West", "ward k/w": "K/West",

  // P wards
  "p/south": "P/South", "p-south": "P/South", "p_south": "P/South", "psouth": "P/South",
  "p/s": "P/South", "p-s": "P/South", "ps": "P/South", "ward p/south": "P/South", "ward p/s": "P/South",
  "p/north": "P/North", "p-north": "P/North", "p_north": "P/North", "pnorth": "P/North",
  "p/n": "P/North", "p-n": "P/North", "pn": "P/North", "ward p/north": "P/North", "ward p/n": "P/North",

  // M wards
  "m/east": "M/East", "m-east": "M/East", "m_east": "M/East", "meast": "M/East",
  "m/e": "M/East", "m-e": "M/East", "me": "M/East", "ward m/east": "M/East", "ward m/e": "M/East",
  "m/west": "M/West", "m-west": "M/West", "m_west": "M/West", "mwest": "M/West",
  "m/w": "M/West", "m-w": "M/West", "mw": "M/West", "ward m/west": "M/West", "ward m/w": "M/West",

  // R wards
  "r/south": "R/South", "r-south": "R/South", "r_south": "R/South", "rsouth": "R/South",
  "r/s": "R/South", "r-s": "R/South", "rs": "R/South", "ward r/south": "R/South", "ward r/s": "R/South",
  "r/central": "R/Central", "r-central": "R/Central", "r_central": "R/Central", "rcentral": "R/Central",
  "r/c": "R/Central", "r-c": "R/Central", "rc": "R/Central", "ward r/central": "R/Central", "ward r/c": "R/Central",
  "r/north": "R/North", "r-north": "R/North", "r_north": "R/North", "rnorth": "R/North",
  "r/n": "R/North", "r-n": "R/North", "rn": "R/North", "ward r/north": "R/North", "ward r/n": "R/North",
};

/**
 * Authoritatively resolves any ward identifier or alias into its canonical ID.
 * Returns the exact canonical string (e.g. "F/South", "L", "ZONE-1") or normalized trimmed string.
 */
export function canonicalWardId(rawId: string | undefined | null, city: string = "mumbai"): string {
  if (!rawId || typeof rawId !== "string") return "";
  const cleaned = rawId.trim();
  if (!cleaned) return "";

  const normCity = (city || "mumbai").toLowerCase().trim();

  if (normCity === "mumbai") {
    // 1. Direct hit on canonical ID
    if (MUMBAI_CANONICAL_WARDS[cleaned]) {
      return MUMBAI_CANONICAL_WARDS[cleaned].id;
    }
    // 2. Direct hit on alias map (case-insensitive)
    const lower = cleaned.toLowerCase();
    if (MUMBAI_ALIAS_MAP[lower]) {
      return MUMBAI_ALIAS_MAP[lower];
    }
    // 3. Strip leading "Ward" or "Ward "
    const stripped = lower.replace(/^ward\s*[-_/]?\s*/i, "").trim();
    if (MUMBAI_ALIAS_MAP[stripped]) {
      return MUMBAI_ALIAS_MAP[stripped];
    }
    // 4. Return uppercase as fallback
    return cleaned.toUpperCase();
  }

  if (normCity === "pune") {
    const lower = cleaned.toLowerCase();
    const match = lower.match(/(?:zone|perimandal)?\s*[-_]?\s*(\d+)/i);
    if (match) {
      return `ZONE-${parseInt(match[1], 10)}`;
    }
    return cleaned.toUpperCase();
  }

  if (normCity === "nagpur") {
    const lower = cleaned.toLowerCase();
    if (lower.startsWith("ngp-zpoly-")) {
      const numStr = lower.replace("ngp-zpoly-", "");
      return `ZONE-${parseInt(numStr, 10)}`;
    }
    const match = lower.match(/zone\s*[-_]?\s*(\d+)/i);
    if (match) {
      return `ZONE-${parseInt(match[1], 10)}`;
    }
    const digits = lower.match(/^(\d+)$/);
    if (digits) {
      return `ZONE-${parseInt(digits[1], 10)}`;
    }
    return cleaned.toUpperCase();
  }

  return cleaned;
}

/**
 * Checks whether two ward/zone IDs match under the canonical identity system.
 */
export function isMatchingWard(
  idA: string | undefined | null,
  idB: string | undefined | null,
  city: string = "mumbai"
): boolean {
  if (!idA || !idB) return false;
  const canonicalA = canonicalWardId(idA, city);
  const canonicalB = canonicalWardId(idB, city);
  return canonicalA.length > 0 && canonicalA === canonicalB;
}

/**
 * Searches a GeoJSON FeatureCollection for a feature matching the target ward.
 * Inspects all possible properties: ward_id, wardId, shortCode, id, name, zone_code, etc.
 */
export function findMatchingWardFeature(
  geoJson: any,
  targetWardId: string | undefined | null,
  city: string = "mumbai"
): any | null {
  if (!geoJson || !geoJson.features || !targetWardId) return null;
  const targetCanonical = canonicalWardId(targetWardId, city);
  if (!targetCanonical) return null;

  for (const feature of geoJson.features) {
    const p = feature.properties || {};
    const candidates = [
      p.ward_id,
      p.wardId,
      p.shortCode,
      p.short_code,
      p.id,
      feature.id,
      p.name,
      p.wardName,
      p.zone_code,
      p.zoneCode,
      p.zone_number !== undefined ? `ZONE-${p.zone_number}` : undefined,
      p.zone_id !== undefined ? `ZONE-${p.zone_id}` : undefined,
    ];

    for (const cand of candidates) {
      if (cand && isMatchingWard(String(cand), targetCanonical, city)) {
        return feature;
      }
    }
  }

  return null;
}

/**
 * Computes the accurate geographic bounding box [[minLat, minLng], [maxLat, maxLng]]
 * from a GeoJSON Polygon or MultiPolygon geometry.
 *
 * Accounts for:
 * - GeoJSON [longitude, latitude] coordinate order
 * - Single Polygons with exterior and interior rings (holes)
 * - MultiPolygons with multiple discrete landmasses (e.g. Madh Island in Ward P/North)
 * - Coordinate bounds validation and protection against zero/inverted bounds
 */
export function computeGeometryBounds(geometry: any): [[number, number], [number, number]] | null {
  if (!geometry || !geometry.coordinates) return null;

  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;

  const processPoint = (coord: any) => {
    if (!Array.isArray(coord) || coord.length < 2) return;
    const lng = Number(coord[0]);
    const lat = Number(coord[1]);
    if (isNaN(lat) || isNaN(lng)) return;

    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
  };

  const traverse = (coords: any, depth: number) => {
    if (!Array.isArray(coords)) return;
    if (typeof coords[0] === "number" && typeof coords[1] === "number") {
      processPoint(coords);
      return;
    }
    for (const sub of coords) {
      traverse(sub, depth + 1);
    }
  };

  traverse(geometry.coordinates, 0);

  if (minLat === Infinity || maxLat === -Infinity || minLng === Infinity || maxLng === -Infinity) {
    return null;
  }

  // Ensure minimum non-zero bounding box dimension (~100m)
  if (minLat === maxLat) {
    minLat -= 0.001;
    maxLat += 0.001;
  }
  if (minLng === maxLng) {
    minLng -= 0.001;
    maxLng += 0.001;
  }

  return [
    [minLat, minLng],
    [maxLat, maxLng],
  ];
}

/**
 * Calculates center coordinate [lat, lng] from a geometry or bounds.
 */
export function computeGeometryCenter(geometry: any): [number, number] | null {
  const bounds = computeGeometryBounds(geometry);
  if (!bounds) return null;
  const [[minLat, minLng], [maxLat, maxLng]] = bounds;
  return [(minLat + maxLat) / 2, (minLng + maxLng) / 2];
}
