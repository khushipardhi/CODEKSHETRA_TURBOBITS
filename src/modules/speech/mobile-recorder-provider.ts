/* ════════════════════════════════════════════════════════
   MobileRecorderProvider — Batch audio recording for Android

   WHY THIS EXISTS:
   AssemblyAI real-time WebSocket streaming is unreliable on
   Android Chrome because the browser throttles/terminates the
   underlying audio pipeline after 1-2 seconds. This is a
   well-known Android Chrome behaviour, not an app bug.

   THIS PROVIDER'S APPROACH:
   1. getUserMedia → MediaRecorder (runs reliably on Android)
   2. Record continuously while user speaks (timeslice keeps track alive)
   3. On STOP → combine all chunks into ONE blob
   4. POST blob to /api/speech/transcribe → get AssemblyAI job ID
   5. Poll /api/speech/transcribe?id=xxx until complete
   6. Deliver final transcript via onResult(text, true)

   DIAGNOSTIC LOGGING:
   Every significant lifecycle event logs [Mic][sessionId] to
   help diagnose any further issues in production.
   ════════════════════════════════════════════════════════ */

import {
  type ClientSpeechProvider,
  type RecordingState,
  type SpeechProviderConfig,
} from "./types";

const TIMESLICE_MS = 250;      // ondataavailable fires every 250ms — keeps track alive
const MAX_RECORDING_MS = 60_000;

export class MobileRecorderProvider implements ClientSpeechProvider {
  readonly name = "mobile-recorder";

  private micStream: MediaStream | null = null;
  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private mimeType = "";
  private isActive = false;
  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  sessionId: string | null = null;

  onResult: ((transcript: string, isFinal: boolean) => void) | null = null;
  onError: ((error: string) => void) | null = null;
  onStateChange: ((state: RecordingState) => void) | null = null;

  get isSupported(): boolean {
    return (
      typeof window !== "undefined" &&
      !!navigator.mediaDevices?.getUserMedia &&
      typeof MediaRecorder !== "undefined"
    );
  }

  private selectMimeType(): string {
    const candidates = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
      "audio/ogg",
      "audio/mp4",
    ];
    for (const mime of candidates) {
      if (MediaRecorder.isTypeSupported(mime)) {
        return mime;
      }
    }
    return ""; // Let browser decide
  }

  async start(_config?: SpeechProviderConfig): Promise<void> {
    if (this.isActive) {
      console.warn("[Mic] Already active, ignoring start");
      return;
    }
    if (!this.isSupported) {
      this.onError?.("Microphone recording not supported on this device.");
      return;
    }

    await this.cleanupInternal();

    this.isActive = true;
    this.sessionId = crypto.randomUUID();
    this.chunks = [];
    const sessionId = this.sessionId;
    const s = sessionId.slice(0, 8);

    console.log(`[Mic][${s}] START`);
    this.onStateChange?.("processing");

    try {
      // ── Microphone ──────────────────────────────────────
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
      } catch (err: unknown) {
        const name = err instanceof Error ? err.name : String(err);
        console.error(`[Mic][${s}] getUserMedia failed: ${name}`);
        if (name === "NotAllowedError" || name === "PermissionDeniedError") {
          this.onStateChange?.("permission_denied");
          this.onError?.("Microphone permission denied. Please allow access in your browser settings.");
        } else if (name === "NotFoundError") {
          this.onStateChange?.("error");
          this.onError?.("No microphone found on this device.");
        } else if (name === "NotReadableError") {
          this.onStateChange?.("error");
          this.onError?.("Microphone is in use by another app.");
        } else {
          this.onStateChange?.("error");
          this.onError?.(`Microphone error: ${name}`);
        }
        this.isActive = false;
        this.sessionId = null;
        return;
      }

      if (this.sessionId !== sessionId) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      this.micStream = stream;
      const track = stream.getAudioTracks()[0];
      console.log(`[Mic][${s}] stream active — track readyState: ${track?.readyState}`);

      // Watch for unexpected track termination
      track?.addEventListener("ended", () => {
        console.warn(`[Mic][${s}] track ENDED unexpectedly`);
        if (this.isActive && this.sessionId === sessionId) {
          this.onError?.(
            "Microphone connection was interrupted. Please try again."
          );
          this.onStateChange?.("error");
          this.isActive = false;
        }
      });

      // ── MediaRecorder ────────────────────────────────────
      this.mimeType = this.selectMimeType();
      console.log(`[Mic][${s}] mimeType selected: "${this.mimeType}"`);

      const recOpts: MediaRecorderOptions = {
        audioBitsPerSecond: 32000,
      };
      if (this.mimeType) recOpts.mimeType = this.mimeType;

      this.recorder = new MediaRecorder(stream, recOpts);

      this.recorder.ondataavailable = (e) => {
        if (this.sessionId !== sessionId) return;
        console.log(
          `[Mic][${s}] dataavailable — size: ${e.data?.size ?? 0}B, ` +
          `recorder: ${this.recorder?.state}, track: ${track?.readyState}`
        );
        if (e.data && e.data.size > 0) {
          this.chunks.push(e.data);
        }
      };

      this.recorder.onerror = (e) => {
        console.error(`[Mic][${s}] MediaRecorder error:`, e);
        if (this.sessionId !== sessionId) return;
        this.onError?.("Recording error. Please try again.");
        this.onStateChange?.("error");
        this.isActive = false;
      };

      this.recorder.onstart = () => {
        if (this.sessionId !== sessionId) return;
        console.log(`[Mic][${s}] MediaRecorder RECORDING`);
        this.onStateChange?.("recording");
      };

      this.recorder.onstop = async () => {
        console.log(`[Mic][${s}] MediaRecorder STOP — chunks: ${this.chunks.length}`);
        if (this.sessionId !== sessionId) return;

        if (this.chunks.length === 0) {
          console.warn(`[Mic][${s}] No audio chunks — nothing recorded`);
          this.onError?.("No audio was captured. Please try again.");
          this.onStateChange?.("idle");
          this.isActive = false;
          return;
        }

        // Combine all chunks into ONE complete blob
        const blobType = this.mimeType || this.recorder?.mimeType || "audio/webm";
        const audioBlob = new Blob(this.chunks, { type: blobType });
        console.log(`[Mic][${s}] blob size: ${audioBlob.size}B, type: "${audioBlob.type}"`);

        if (audioBlob.size < 1000) {
          console.warn(`[Mic][${s}] Blob too small — likely no actual audio`);
          this.onError?.("The recording was too short. Please try again.");
          this.onStateChange?.("idle");
          this.isActive = false;
          return;
        }

        // Switch UI to "processing" while we transcribe
        this.onStateChange?.("processing");
        console.log(`[Mic][${s}] transcription started`);

        await this.transcribeBlob(audioBlob, sessionId, s);
      };

      // Start recording — timeslice fires ondataavailable every 250ms,
      // which also keeps the Android audio track alive
      this.recorder.start(TIMESLICE_MS);

      // Safety: max recording duration
      this.timeoutId = setTimeout(() => {
        if (this.sessionId === sessionId && this.isActive) {
          console.log(`[Mic][${s}] max duration reached — auto-stopping`);
          this.stop();
        }
      }, MAX_RECORDING_MS);

    } catch (err) {
      console.error(`[Mic][${s}] Unexpected start error:`, err);
      this.onError?.(err instanceof Error ? err.message : "Recording failed.");
      this.onStateChange?.("error");
      this.isActive = false;
    }
  }

  /** Send blob to /api/speech/transcribe (Groq Whisper) — returns in 1-3s */
  private async transcribeBlob(
    blob: Blob,
    sessionId: string,
    s: string
  ): Promise<void> {
    try {
      const form = new FormData();
      form.append("audio", blob, "recording.webm");

      console.log(`[Mic][${s}] transcription started — ${blob.size}B`);

      const res = await fetch("/api/speech/transcribe", {
        method: "POST",
        body: form,
        signal: AbortSignal.timeout(25_000), // 25s hard timeout
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const transcript = (data.transcript || "").trim();
      console.log(`[Mic][${s}] transcription completed: "${transcript.slice(0, 80)}"`);

      if (this.sessionId !== sessionId) return;

      if (transcript) {
        this.onResult?.(transcript, true);
      } else {
        this.onError?.("No speech detected. Please speak clearly and try again.");
      }

      this.onStateChange?.("idle");
      this.isActive = false;

    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error(`[Mic][${s}] transcription error: ${msg}`);
      if (this.sessionId === sessionId) {
        this.onError?.(
          "Speech transcription failed. You can type your report instead."
        );
        this.onStateChange?.("idle");
        this.isActive = false;
      }
    }
  }


  stop(): void {
    const s = (this.sessionId || "").slice(0, 8);
    console.log(`[Mic][${s}] STOP called — recorder: ${this.recorder?.state}`);

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    if (!this.isActive) return;

    if (this.recorder && this.recorder.state === "recording") {
      // requestData flushes any buffered partial chunk before stopping
      try { this.recorder.requestData(); } catch { /* ignore */ }
      this.recorder.stop();
      // onstop fires async → transcribeBlob runs
    } else {
      this.onStateChange?.("idle");
      this.isActive = false;
    }
  }

  abort(): void {
    console.log(`[Mic][${(this.sessionId || "").slice(0, 8)}] ABORT`);
    this.cleanupInternal();
  }

  private async cleanupInternal(): Promise<void> {
    const s = (this.sessionId || "").slice(0, 8);

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    this.isActive = false;
    this.sessionId = null;
    this.chunks = [];

    if (this.recorder && this.recorder.state !== "inactive") {
      try { this.recorder.stop(); } catch { /* ignore */ }
    }
    this.recorder = null;

    if (this.micStream) {
      this.micStream.getTracks().forEach((t) => t.stop());
      this.micStream = null;
    }

    if (s) console.log(`[Mic][${s}] CLEANED UP`);
    this.onStateChange?.("idle");
  }
}
