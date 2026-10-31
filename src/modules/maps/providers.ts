/* ════════════════════════════════════════════════════════
   Map Provider Interface
   Provider-agnostic contract for map rendering
   ════════════════════════════════════════════════════════ */

export interface MapProvider {
  readonly providerName: string;

  /** Get public token for client-side map rendering */
  getPublicToken(): string;

  /** Geocode an address string to coordinates */
  geocode?(address: string): Promise<GeocodeResult | null>;

  /** Reverse geocode coordinates to address */
  reverseGeocode?(lat: number, lng: number): Promise<GeocodeResult | null>;
}

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  locality?: string;
  ward?: string;
  confidence: number;
  provider: string;
}

/** Map DTO for safe marker payloads — never raw incident rows */
export interface MapMarkerDTO {
  id: string;
  latitude: number;
  longitude: number;
  severity: string;
  title: string;
  status: string;
  /** Only included for authorized viewers */
  incidentRef?: string;
  category?: string;
}

/** Fixture map provider for development */
export class FixtureMapProvider implements MapProvider {
  readonly providerName = "fixture";

  getPublicToken(): string {
    return "fixture-token";
  }
}
