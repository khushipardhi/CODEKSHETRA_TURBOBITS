/* ════════════════════════════════════════════════════════
   Speech Provider Types
   Provider-agnostic speech-to-text abstraction
   ════════════════════════════════════════════════════════ */

/* eslint-disable @typescript-eslint/no-explicit-any */

export type RecordingState =
  | "idle"
  | "recording"
  | "processing"
  | "error"
  | "permission_denied";

export interface SpeechProviderConfig {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
}

/** Client-side speech provider interface */
export interface ClientSpeechProvider {
  readonly name: string;
  readonly isSupported: boolean;

  /** Unique ID for the current recording session */
  sessionId: string | null;

  start(config?: SpeechProviderConfig): void;
  stop(): void;
  abort(): void;

  onResult: ((transcript: string, isFinal: boolean) => void) | null;
  onError: ((error: string) => void) | null;
  onStateChange: ((state: RecordingState) => void) | null;
}

// Web Speech API type declarations (not in all TS libs)
type SpeechRecognitionType = any;

/**
 * Intelligently merges transcripts across progressive events, pauses, and restarts
 * without repetitive word stutter or duplicate phrases.
 */
export function mergeTranscripts(history: string, current: string): string {
  const h = (history || "").trim();
  const c = (current || "").trim();
  if (!h) return c;
  if (!c) return h;
  if (h === c) return c;

  const hLower = h.toLowerCase();
  const cLower = c.toLowerCase();

  // If current already starts with or equals history, current is the complete superset
  if (cLower.startsWith(hLower)) {
    return c;
  }

  // If history already ends with or equals current, history already contains it
  if (hLower.endsWith(cLower)) {
    return h;
  }

  // Check for suffix/prefix word-level overlap
  const hWords = h.split(/\s+/);
  const cWords = c.split(/\s+/);
  const maxOverlap = Math.min(hWords.length, cWords.length);

  for (let len = maxOverlap; len > 0; len--) {
    const hSuffix = hWords.slice(-len).join(" ").toLowerCase();
    const cPrefix = cWords.slice(0, len).join(" ").toLowerCase();
    if (hSuffix === cPrefix) {
      return hWords.concat(cWords.slice(len)).join(" ");
    }
  }

  // No overlap: cleanly join with space
  return `${h} ${c}`;
}

/** Browser Web Speech API provider — works offline, no API key needed */
export class BrowserSpeechProvider implements ClientSpeechProvider {
  readonly name = "browser";
  private recognition: SpeechRecognitionType | null = null;
  private isRecording = false;

  sessionId: string | null = null;

  onResult: ((transcript: string, isFinal: boolean) => void) | null = null;
  onError: ((error: string) => void) | null = null;
  onStateChange: ((state: RecordingState) => void) | null = null;

  get isSupported(): boolean {
    if (typeof window === "undefined") return false;
    return !!(
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    );
  }

  start(config?: SpeechProviderConfig): void {
    if (!this.isSupported) {
      this.onError?.("Speech recognition is not supported in this browser");
      return;
    }

    // Prevent duplicate sessions — clean up previous
    if (this.recognition) {
      try { this.recognition.abort(); } catch { /* ignore */ }
      this.recognition = null;
    }

    this.sessionId = crypto.randomUUID();
    this.isRecording = true;

    const SpeechRec =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    const currentSessionId = this.sessionId;
    const lang = config?.language || "en-IN";

    const rec = new SpeechRec();
    rec.lang = lang;
    // On Android/mobile, capture the exact spoken utterance chunk and stop when finished speaking
    rec.continuous = config?.continuous ?? false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      if (this.sessionId !== currentSessionId) return;
      this.onStateChange?.("recording");
    };

    rec.onresult = (event: any) => {
      if (this.sessionId !== currentSessionId) return;

      let finalChunk = "";
      let interimChunk = "";

      // Iterate through all results in the current recognition buffer
      for (let i = 0; i < event.results.length; i++) {
        const res = event.results[i];
        const text = (res[0]?.transcript || "").trim();
        if (!text) continue;

        if (res.isFinal) {
          finalChunk = finalChunk ? `${finalChunk} ${text}` : text;
        } else {
          interimChunk = interimChunk ? `${interimChunk} ${text}` : text;
        }
      }

      if (finalChunk) {
        // Deliver finalized chunk
        this.onResult?.(finalChunk, true);
      } else if (interimChunk) {
        // Send live progressive preview of current chunk
        this.onResult?.(interimChunk, false);
      }
    };

    rec.onerror = (event: any) => {
      if (this.sessionId !== currentSessionId) return;

      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        this.isRecording = false;
        this.onStateChange?.("permission_denied");
        this.onError?.("Microphone permission denied. Please allow microphone access.");
      } else if (event.error === "no-speech") {
        // Normal pause
      } else if (event.error === "aborted") {
        // User stopped
      } else {
        console.warn("[Speech] Web Speech notice:", event.error);
      }
    };

    rec.onend = () => {
      if (this.sessionId !== currentSessionId) return;
      this.isRecording = false;
      this.onStateChange?.("idle");
    };

    try {
      rec.start();
      this.recognition = rec;
    } catch (err) {
      console.warn("[Speech] rec.start error:", err);
    }
  }

  stop(): void {
    this.isRecording = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch { /* ignore */ }
    }
    this.onStateChange?.("idle");
  }

  abort(): void {
    this.isRecording = false;
    const rec = this.recognition;
    this.recognition = null;
    this.sessionId = null;

    if (rec) {
      try { rec.abort(); } catch { /* ignore */ }
    }
    this.onStateChange?.("idle");
  }
}
