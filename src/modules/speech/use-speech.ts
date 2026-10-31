/* ════════════════════════════════════════════════════════
   useSpeech — React hook for voice input
   
   Provider Hierarchy:
   1. PRIMARY: AssemblyAiProvider
      Real-time 16kHz PCM streaming directly to AssemblyAI v3 WebSocket.
      Provides live progressive transcription on Windows, Mac, Linux, and Android.
      No 12-second cutoffs. Continuous until user stops or 90s safety timeout.
      
   2. SECONDARY: MobileRecorderProvider (AssemblyAI batch)
      MediaRecorder captures audio and POSTs to /api/speech/transcribe.
      Fallback if WebSocket streaming is blocked by strict firewalls or mobile network.
      
   3. TERTIARY: BrowserSpeechProvider
      Offline Web Speech API fallback.
   ════════════════════════════════════════════════════════ */

"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
  BrowserSpeechProvider,
  type ClientSpeechProvider,
  type RecordingState,
} from "./types";

interface UseSpeechReturn {
  state: RecordingState;
  isRecording: boolean;
  transcript: string;
  interimTranscript: string;
  isSupported: boolean;
  providerName: string;
  permissionDenied: boolean;
  isMobile: boolean;
  startRecording: () => void;
  stopRecording: () => void;
  resetTranscript: () => void;
  error: string | null;
}

function detectMobile(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

export function useSpeech(language = "en-IN"): UseSpeechReturn {
  const [state, setState] = useState<RecordingState>("idle");
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [providerName, setProviderName] = useState("assemblyai");
  const isMobile = useMemo(() => detectMobile(), []);

  const providerRef = useRef<ClientSpeechProvider | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  const wireCallbacks = useCallback((provider: ClientSpeechProvider) => {
    provider.onResult = (text: string, isFinal: boolean) => {
      // Discard results from obsolete sessions
      if (provider.sessionId !== sessionIdRef.current) return;

      if (isFinal) {
        const trimmed = text.trim();
        if (!trimmed) return;
        setTranscript(trimmed);
        setInterimTranscript("");
      } else {
        // Live partial updates
        setInterimTranscript(text.trim());
      }
    };

    provider.onError = (err: string) => {
      console.warn(`[Speech] ${provider.name} error:`, err);
      setError(err);
    };

    provider.onStateChange = (newState: RecordingState) => {
      setState(newState);
      if (newState === "recording") {
        setError(null);
      }
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      providerRef.current?.abort();
      providerRef.current = null;
    };
  }, []);

  const isSupported =
    typeof window !== "undefined" &&
    !!(
      navigator.mediaDevices?.getUserMedia ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).SpeechRecognition ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).webkitSpeechRecognition
    );

  const permissionDenied = state === "permission_denied";

  const startRecording = useCallback(async () => {
    setError(null);
    setInterimTranscript("");
    setTranscript("");
    setState("processing");

    const newSessionId = crypto.randomUUID();
    sessionIdRef.current = newSessionId;

    if (providerRef.current) {
      providerRef.current.abort();
      providerRef.current = null;
    }

    // ── PRIMARY: AssemblyAI Real-Time Streaming v3 (16kHz PCM) ──
    try {
      const { AssemblyAiProvider } = await import("./assembly-ai-provider");
      const aai = new AssemblyAiProvider();
      if (aai.isSupported) {
        wireCallbacks(aai);
        providerRef.current = aai;
        setProviderName("assemblyai");

        if (sessionIdRef.current !== newSessionId) {
          setState("idle");
          return;
        }

        await aai.start({ language });
        sessionIdRef.current = aai.sessionId;
        return;
      }
    } catch (aaiErr) {
      console.warn("[Speech] AssemblyAI streaming failed, trying audio recorder fallback:", aaiErr);
    }

    // ── SECONDARY: Audio Recorder + AssemblyAI API (/api/speech/transcribe) ──
    try {
      const { MobileRecorderProvider } = await import("./mobile-recorder-provider");
      const recorder = new MobileRecorderProvider();
      if (recorder.isSupported) {
        wireCallbacks(recorder);
        providerRef.current = recorder;
        setProviderName("recorder-batch");

        if (sessionIdRef.current !== newSessionId) {
          setState("idle");
          return;
        }

        await recorder.start({ language });
        sessionIdRef.current = recorder.sessionId;
        return;
      }
    } catch (recorderErr) {
      console.warn("[Speech] Batch audio recorder failed, trying native browser speech:", recorderErr);
    }

    // ── TERTIARY: Native Web Speech API ──
    const browser = new BrowserSpeechProvider();
    if (browser.isSupported) {
      try {
        wireCallbacks(browser);
        providerRef.current = browser;
        setProviderName("browser");

        if (sessionIdRef.current !== newSessionId) {
          setState("idle");
          return;
        }

        browser.start({ language, continuous: true, interimResults: true });
        sessionIdRef.current = browser.sessionId;
        return;
      } catch (browserErr) {
        console.error("[Speech] All voice recognition options failed:", browserErr);
      }
    }

    setError("Voice input is not supported in this browser. Please type your report instead.");
    setState("error");
  }, [language, wireCallbacks]);

  const stopRecording = useCallback(() => {
    providerRef.current?.stop();
    setInterimTranscript("");
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
    setError(null);
    setState("idle");
    sessionIdRef.current = null;
  }, []);

  return {
    state,
    isRecording: state === "recording",
    transcript,
    interimTranscript,
    isSupported,
    providerName,
    permissionDenied,
    isMobile,
    startRecording,
    stopRecording,
    resetTranscript,
    error,
  };
}
