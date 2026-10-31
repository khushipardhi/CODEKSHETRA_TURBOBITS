/* ════════════════════════════════════════════════════════
   IncidentDraft — Client-side report composition state
   Accumulates citizen input BEFORE any AI call
   ════════════════════════════════════════════════════════ */

export interface IncidentDraft {
  /** The citizen's report text (from typing or speech transcript) */
  text: string;
  /** Attached photo files */
  photos: File[];
  /** Location text (address/landmark) */
  locationText: string;
  /** GPS coordinates if available */
  latitude: number | null;
  longitude: number | null;
  /** Pre-selected category from grid (optional hint for AI) */
  selectedCategory: string | null;
  /** How the draft was started */
  source: "text" | "voice" | "category";
}

export function createEmptyDraft(): IncidentDraft {
  return {
    text: "",
    photos: [],
    locationText: "",
    latitude: null,
    longitude: null,
    selectedCategory: null,
    source: "text",
  };
}

/** Minimum requirements before AI analysis can run */
export function isDraftReadyForAnalysis(draft: IncidentDraft): boolean {
  return draft.text.trim().length >= 10;
}
