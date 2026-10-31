/* ════════════════════════════════════════════════════════
   AssemblyAI Speech Provider — 16kHz PCM Real-time & Fallback
   
   Bulletproof architecture:
   1. Real-time streaming via AssemblyAI WebSocket v3 (16kHz PCM)
   2. Seamless server-side AssemblyAI fallback via /api/speech/transcribe
      if WebSocket streaming produces no transcript
   3. Web Audio API capture with AudioWorklet + ScriptProcessor fallback
   4. High-fidelity 16kHz linear resampling and signed 16-bit PCM conversion
   ════════════════════════════════════════════════════════ */

import { StreamingTranscriber } from "assemblyai/streaming";
import {
  type ClientSpeechProvider,
  type RecordingState,
  type SpeechProviderConfig,
} from "./types";

const MAX_RECORDING_MS = 90_000;
const CHUNK_DURATION_MS = 150;

export class AssemblyAiProvider implements ClientSpeechProvider {
  readonly name = "assemblyai";

  private transcriber: StreamingTranscriber | null = null;
  private micStream: MediaStream | null = null;
  private audioCtx: AudioContext | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private scriptNode: ScriptProcessorNode | null = null;
  private dummyGain: GainNode | null = null;

  private isActive = false;
  private isStopping = false;
  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  sessionId: string | null = null;

  private committedText = "";
  private lastCommittedTurnOrder = -1;
  private currentTurnText = "";

  private pcmSampleBuffer: number[] = [];
  private samplesPerChunk = Math.round(16000 * (CHUNK_DURATION_MS / 1000));
  private recordedPcmChunks: ArrayBuffer[] = [];

  onResult: ((transcript: string, isFinal: boolean) => void) | null = null;
  onError: ((error: string) => void) | null = null;
  onStateChange: ((state: RecordingState) => void) | null = null;

  get isSupported(): boolean {
    return (
      typeof window !== "undefined" &&
      !!navigator.mediaDevices?.getUserMedia &&
      (typeof AudioContext !== "undefined" ||
        typeof (window as unknown as { webkitAudioContext: unknown }).webkitAudioContext !== "undefined")
    );
  }

  async start(_config?: SpeechProviderConfig): Promise<void> {
    if (this.isActive) {
      console.warn("[AssemblyAI] Already active, ignoring start");
      return;
    }
    if (!this.isSupported) {
      this.onError?.("Microphone or Web Audio is not supported in this browser.");
      return;
    }

    await this.cleanup();

    this.isActive = true;
    this.isStopping = false;
    this.sessionId = crypto.randomUUID();
    this.committedText = "";
    this.lastCommittedTurnOrder = -1;
    this.currentTurnText = "";
    this.pcmSampleBuffer = [];
    this.recordedPcmChunks = [];

    const currentSessionId = this.sessionId;
    const s = currentSessionId.slice(0, 8);

    console.log(`[AssemblyAI][${s}] START recording session`);
    this.onStateChange?.("processing");

    try {
      // ── Step 1: Microphone ───────────────────────────────
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
      } catch (permErr: unknown) {
        const name = permErr instanceof Error ? permErr.name : String(permErr);
        console.error(`[AssemblyAI][${s}] Mic permission error: ${name}`);
        this.isActive = false;
        this.sessionId = null;

        if (name === "NotAllowedError" || name === "PermissionDeniedError") {
          this.onStateChange?.("permission_denied");
          this.onError?.("Microphone permission denied. Please allow access in browser settings.");
        } else if (name === "NotFoundError") {
          this.onStateChange?.("error");
          this.onError?.("No microphone found on this device.");
        } else {
          this.onStateChange?.("error");
          this.onError?.(`Microphone error: ${name}`);
        }
        return;
      }

      if (this.sessionId !== currentSessionId) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      this.micStream = stream;

      // ── Step 2: AudioContext & Audio Capture ─────────────
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

      let audioCtx: AudioContext;
      try {
        audioCtx = new AudioCtxClass({ sampleRate: 16000 });
      } catch {
        audioCtx = new AudioCtxClass();
      }
      this.audioCtx = audioCtx;

      if (audioCtx.state === "suspended") {
        await audioCtx.resume();
      }

      const nativeSampleRate = audioCtx.sampleRate;
      console.log(`[AssemblyAI][${s}] AudioContext active: native rate ${nativeSampleRate}Hz`);

      const sourceNode = audioCtx.createMediaStreamSource(stream);

      let wsReady = false;
      const pendingAudioBuffers: ArrayBuffer[] = [];

      const handleAudioData = (float32Samples: Float32Array) => {
        if (this.sessionId !== currentSessionId || !this.isActive) return;

        const resampled =
          nativeSampleRate === 16000
            ? float32Samples
            : resampleTo16k(float32Samples, nativeSampleRate);

        for (let i = 0; i < resampled.length; i++) {
          this.pcmSampleBuffer.push(resampled[i]);
        }

        while (this.pcmSampleBuffer.length >= this.samplesPerChunk) {
          const chunkSamples = new Float32Array(
            this.pcmSampleBuffer.splice(0, this.samplesPerChunk)
          );
          const pcmBuffer = float32ToPcm16(chunkSamples);

          // Save chunk for fallback
          this.recordedPcmChunks.push(pcmBuffer);

          if (wsReady && this.transcriber) {
            try {
              this.transcriber.sendAudio(pcmBuffer);
            } catch {
              /* socket closing */
            }
          } else {
            if (pendingAudioBuffers.length < 80) {
              pendingAudioBuffers.push(pcmBuffer);
            }
          }
        }
      };

      // Try AudioWorklet first, then ScriptProcessor
      let workletLoaded = false;
      if (audioCtx.audioWorklet) {
        try {
          const workletCode = `
            class AudioCaptureProcessor extends AudioWorkletProcessor {
              process(inputs) {
                const input = inputs[0];
                if (input && input[0]) {
                  this.port.postMessage(new Float32Array(input[0]));
                }
                return true;
              }
            }
            registerProcessor("audio-capture-processor", AudioCaptureProcessor);
          `;
          const blob = new Blob([workletCode], { type: "application/javascript" });
          const workletUrl = URL.createObjectURL(blob);
          await audioCtx.audioWorklet.addModule(workletUrl);
          URL.revokeObjectURL(workletUrl);

          if (this.sessionId !== currentSessionId) {
            await this.cleanup();
            return;
          }

          const workletNode = new AudioWorkletNode(audioCtx, "audio-capture-processor");
          workletNode.port.onmessage = (e) => {
            handleAudioData(e.data);
          };

          const dummyGain = audioCtx.createGain();
          dummyGain.gain.value = 0;
          sourceNode.connect(workletNode);
          workletNode.connect(dummyGain);
          dummyGain.connect(audioCtx.destination);

          this.workletNode = workletNode;
          this.dummyGain = dummyGain;
          workletLoaded = true;
        } catch (workletErr) {
          console.warn(`[AssemblyAI][${s}] AudioWorklet failed, using ScriptProcessor:`, workletErr);
        }
      }

      if (!workletLoaded) {
        const scriptNode = audioCtx.createScriptProcessor(4096, 1, 1);
        scriptNode.onaudioprocess = (e) => {
          const channel = e.inputBuffer.getChannelData(0);
          handleAudioData(channel);
        };
        sourceNode.connect(scriptNode);
        scriptNode.connect(audioCtx.destination);
        this.scriptNode = scriptNode;
      }

      // ── Step 3: AssemblyAI WebSocket Streaming ───────────
      this.onStateChange?.("recording");

      try {
        const tokenRes = await fetch("/api/speech/token", {
          signal: AbortSignal.timeout(6000),
        });
        if (tokenRes.ok) {
          const { token } = await tokenRes.json();
          if (token && this.sessionId === currentSessionId) {
            this.transcriber = new StreamingTranscriber({
              token,
              encoding: "pcm_s16le",
              sampleRate: 16000,
              includePartialTurns: true,
              connectTimeout: 8000,
            });

            this.transcriber.on("open", () => {
              if (this.sessionId !== currentSessionId) return;
              console.log(`[AssemblyAI][${s}] WebSocket stream OPEN`);
              wsReady = true;

              while (pendingAudioBuffers.length > 0) {
                const chunk = pendingAudioBuffers.shift()!;
                try {
                  this.transcriber?.sendAudio(chunk);
                } catch {
                  break;
                }
              }
            });

            this.transcriber.on("turn", (turn) => {
              if (this.sessionId !== currentSessionId) return;
              if (!turn.transcript) return;

              const { turn_order, end_of_turn, transcript } = turn;

              if (end_of_turn) {
                if (turn_order !== this.lastCommittedTurnOrder) {
                  this.committedText = this.committedText
                    ? `${this.committedText} ${transcript.trim()}`
                    : transcript.trim();
                  this.lastCommittedTurnOrder = turn_order;
                  this.currentTurnText = "";
                  console.log(`[AssemblyAI][${s}] Turn #${turn_order}: "${transcript.slice(0, 60)}"`);
                  this.onResult?.(this.committedText, true);
                }
              } else {
                this.currentTurnText = transcript.trim();
                const display = this.committedText
                  ? `${this.committedText} ${this.currentTurnText}`
                  : this.currentTurnText;
                this.onResult?.(display, false);
              }
            });

            this.transcriber.on("error", (err: Error) => {
              console.warn(`[AssemblyAI][${s}] WebSocket notice:`, err.message);
            });

            this.transcriber.connect().catch((e) => {
              console.warn(`[AssemblyAI][${s}] Streaming connect failed, will use batch fallback:`, e);
            });
          }
        }
      } catch (tokenErr) {
        console.warn(`[AssemblyAI][${s}] Token fetch warning:`, tokenErr);
      }

      // Safety timeout: max duration
      this.timeoutId = setTimeout(() => {
        if (this.sessionId === currentSessionId && this.isActive) {
          console.log(`[AssemblyAI][${s}] Maximum duration reached`);
          this.stop();
        }
      }, MAX_RECORDING_MS);

    } catch (err) {
      console.error("[AssemblyAI] Unexpected start error:", err);
      this.onError?.(err instanceof Error ? err.message : "Failed to start speech recognition.");
      this.onStateChange?.("error");
      await this.cleanup();
    }
  }

  async stop(): Promise<void> {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    if (!this.isActive) return;

    this.isStopping = true;
    const s = (this.sessionId || "").slice(0, 8);
    const currentSessionId = this.sessionId;
    console.log(`[AssemblyAI][${s}] STOP called`);

    // Flush any leftover samples in buffer
    if (this.pcmSampleBuffer.length > 0) {
      const leftover = new Float32Array(this.pcmSampleBuffer);
      this.pcmSampleBuffer = [];
      const pcm = float32ToPcm16(leftover);
      this.recordedPcmChunks.push(pcm);
      try {
        this.transcriber?.sendAudio(pcm);
      } catch { /* ignore */ }
    }

    // Check if live streaming already produced transcript
    const liveTranscript = [this.committedText, this.currentTurnText].filter(Boolean).join(" ").trim();
    if (liveTranscript) {
      console.log(`[AssemblyAI][${s}] Live transcript delivered: "${liveTranscript}"`);
      this.onResult?.(liveTranscript, true);
      this.onStateChange?.("idle");
      this.cleanup();
      return;
    }

    // ── Fallback: Server-side AssemblyAI transcription ────
    // If live streaming was quiet or didn't finalize, transcribe the captured audio via AssemblyAI
    if (this.recordedPcmChunks.length >= 3) {
      console.log(`[AssemblyAI][${s}] Running AssemblyAI server-side transcription with ${this.recordedPcmChunks.length} chunks...`);
      this.onStateChange?.("processing");

      const wavBlob = pcmChunksToWav(this.recordedPcmChunks);
      const formData = new FormData();
      formData.append("audio", wavBlob, "speech.wav");

      try {
        const res = await fetch("/api/speech/transcribe", {
          method: "POST",
          body: formData,
        });

        if (this.sessionId === currentSessionId) {
          if (res.ok) {
            const data = await res.json();
            const transcript = (data.transcript || "").trim();
            if (transcript) {
              console.log(`[AssemblyAI][${s}] Server AssemblyAI success: "${transcript}"`);
              this.onResult?.(transcript, true);
            } else {
              this.onError?.("No speech was detected. Please speak clearly and try again.");
            }
          } else {
            this.onError?.("Could not transcribe speech. Please type your report.");
          }
        }
      } catch (fetchErr) {
        console.error(`[AssemblyAI][${s}] Fallback transcribe error:`, fetchErr);
        if (this.sessionId === currentSessionId) {
          this.onError?.("Speech transcription service unreachable. Please type your report.");
        }
      }
    } else {
      this.onError?.("Recording too short. Please try again.");
    }

    this.onStateChange?.("idle");
    this.cleanup();
  }

  abort(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.cleanup();
  }

  private async cleanup(): Promise<void> {
    const s = (this.sessionId || "").slice(0, 8);
    this.isActive = false;
    this.isStopping = false;
    this.sessionId = null;
    this.committedText = "";
    this.lastCommittedTurnOrder = -1;
    this.currentTurnText = "";
    this.pcmSampleBuffer = [];
    this.recordedPcmChunks = [];

    if (this.workletNode) {
      try { this.workletNode.disconnect(); } catch { /* ignore */ }
      this.workletNode = null;
    }
    if (this.scriptNode) {
      try { this.scriptNode.disconnect(); } catch { /* ignore */ }
      this.scriptNode = null;
    }
    if (this.dummyGain) {
      try { this.dummyGain.disconnect(); } catch { /* ignore */ }
      this.dummyGain = null;
    }

    if (this.audioCtx) {
      try { await this.audioCtx.close(); } catch { /* ignore */ }
      this.audioCtx = null;
    }

    if (this.micStream) {
      this.micStream.getTracks().forEach((t) => t.stop());
      this.micStream = null;
    }

    if (this.transcriber) {
      try { this.transcriber.close(false); } catch { /* ignore */ }
      this.transcriber = null;
    }

    if (s) console.log(`[AssemblyAI][${s}] Session closed`);
    this.onStateChange?.("idle");
  }
}

// ══════════════════════════════════════════════════
// Helpers
// ══════════════════════════════════════════════════

function resampleTo16k(input: Float32Array, fromRate: number): Float32Array {
  if (fromRate === 16000) return input;
  const ratio = fromRate / 16000;
  const outLength = Math.round(input.length / ratio);
  const result = new Float32Array(outLength);

  for (let i = 0; i < outLength; i++) {
    const originalPos = i * ratio;
    const low = Math.floor(originalPos);
    const high = Math.min(low + 1, input.length - 1);
    const frac = originalPos - low;
    result[i] = input[low] * (1 - frac) + input[high] * frac;
  }
  return result;
}

function float32ToPcm16(input: Float32Array): ArrayBuffer {
  const buffer = new ArrayBuffer(input.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return buffer;
}

/**
 * Builds a standard 16kHz mono 16-bit PCM WAV file blob from raw PCM buffers.
 */
function pcmChunksToWav(chunks: ArrayBuffer[]): Blob {
  const totalAudioBytes = chunks.reduce((acc, c) => acc + c.byteLength, 0);
  const wavBuffer = new ArrayBuffer(44 + totalAudioBytes);
  const view = new DataView(wavBuffer);

  // RIFF header
  view.setUint32(0, 0x52494646, false); // "RIFF"
  view.setUint32(4, 36 + totalAudioBytes, true);
  view.setUint32(8, 0x57415645, false); // "WAVE"

  // fmt chunk
  view.setUint32(12, 0x666d7420, false); // "fmt "
  view.setUint32(16, 16, true); // SubChunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 = PCM)
  view.setUint16(22, 1, true); // NumChannels (1 = mono)
  view.setUint32(24, 16000, true); // SampleRate (16,000 Hz)
  view.setUint32(28, 32000, true); // ByteRate (16000 * 1 * 2)
  view.setUint16(32, 2, true); // BlockAlign (1 * 2)
  view.setUint16(34, 16, true); // BitsPerSample (16-bit)

  // data chunk
  view.setUint32(36, 0x64617461, false); // "data"
  view.setUint32(40, totalAudioBytes, true);

  const uint8 = new Uint8Array(wavBuffer);
  let offset = 44;
  for (const chunk of chunks) {
    uint8.set(new Uint8Array(chunk), offset);
    offset += chunk.byteLength;
  }

  return new Blob([wavBuffer], { type: "audio/wav" });
}
