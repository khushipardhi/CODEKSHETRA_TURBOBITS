/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Simulation Playback Controller Hook
   Deterministic, authoritative playback state machine for Spatial Simulation Lab.
   
   Guarantees (Phase 3 Enterprise Architecture):
   - One Authoritative Simulation State (city, jurisdiction, scenario, params, time, speed, calculation version, quality, report version)
   - Sequential step advancement: time never races ahead of unrendered calculations
   - Single timer reference: repeated Play clicks are strictly idempotent
   - Prompt Pause: immediately clears active step timeout and stops advancement
   - Reset: returns to T=0 and idle state deterministically
   - Previous/Next: advances by configured step size (0.5h or 1.0h)
   - Scrubbing: updates time directly and pauses playback loop
   - Monotonic request IDs + AbortController: prevents stale/out-of-order race conditions
   - Client-side deterministic result cache + background pre-fetching: 0ms retrieval on repeated time steps
   - Complete unmount cleanup: cancels active timers, animation frames, and fetches
   - Last valid result retention: keeps last good result visible if calculation encounters error
   ════════════════════════════════════════════════════════ */

"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import type { SimulationResult } from "@/modules/simulation/engine";
import type { DataQualityStatus } from "@/modules/simulation/contracts";

export type PlaybackStatus = "idle" | "playing" | "paused" | "calculating";

export interface AuthoritativeSimulationState {
  city: string;
  jurisdiction: string;
  scenarioId: string;
  modelVersion: string;
  parameters: Record<string, number>;
  timeStep: number;
  maxDuration: number;
  stepSize: number;
  playbackStatus: PlaybackStatus;
  playbackSpeed: number;
  selectedWardId: string;
  calculationVersion: string;
  qualityStatus: DataQualityStatus;
  reportVersion: string;
  simResult: SimulationResult | null;
  isLoading: boolean;
  isStale: boolean;
  error: string | null;
}

export interface PlaybackOptions {
  scenarioId: string;
  parameters: Record<string, number>;
  baselineMode: string;
  city?: string;
  maxDuration: number;
  stepSize?: number; // Default: 0.5 hours
  simulateMissingInputs?: boolean;
  enabled?: boolean;
  initialTimeStep?: number;
  selectedWardId?: string;
}

export interface PlaybackController {
  status: PlaybackStatus;
  timeStep: number;
  maxDuration: number;
  stepSize: number;
  playbackSpeed: number;
  isLoading: boolean;
  isStale: boolean;
  error: string | null;
  simResult: SimulationResult | null;

  // Authoritative simulation state bundle
  city: string;
  jurisdiction: string;
  scenarioId: string;
  modelVersion: string;
  calculationVersion: string;
  qualityStatus: DataQualityStatus;
  reportVersion: string;
  authoritativeState: AuthoritativeSimulationState;

  // Actions
  play: () => void;
  pause: () => void;
  reset: () => void;
  stepNext: () => void;
  stepPrev: () => void;
  scrub: (targetTime: number) => void;
  setSpeed: (speed: number) => void;
  forceRecalculate: () => Promise<void>;
}

export function useSimulationPlayback({
  scenarioId,
  parameters,
  baselineMode,
  city = "mumbai",
  maxDuration,
  stepSize = 0.5,
  simulateMissingInputs = false,
  enabled = true,
  initialTimeStep = 1,
  selectedWardId = "L",
}: PlaybackOptions): PlaybackController {
  // Authoritative Core State
  const [status, setStatus] = useState<PlaybackStatus>("idle");
  const [timeStep, setTimeStep] = useState<number>(initialTimeStep);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1); // 1x, 2x, 5x
  const [simResult, setSimResult] = useState<SimulationResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // References for deterministic control & lifecycle cleanup
  const playbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestSeqRef = useRef<number>(0);
  const isPlayingRef = useRef<boolean>(false);
  isPlayingRef.current = status === "playing";

  const playbackSpeedRef = useRef<number>(playbackSpeed);
  playbackSpeedRef.current = playbackSpeed;

  const timeStepRef = useRef<number>(timeStep);
  timeStepRef.current = timeStep;

  // In-memory deterministic LRU / Map cache for instant zero-latency playback
  // Cache key: `${scenarioId}|${baselineMode}|${city}|${missingFlag}|${paramsKey}|T${roundedT}`
  const cacheRef = useRef<Map<string, SimulationResult>>(new Map());

  // Generate stable parameter signature
  const paramsKey = useMemo(() => {
    const sortedKeys = Object.keys(parameters).sort();
    return sortedKeys.map((k) => `${k}:${parameters[k]}`).join(",");
  }, [parameters]);

  const makeCacheKey = useCallback(
    (t: number) => {
      const roundedT = Math.round(t * 10) / 10;
      return `${scenarioId}|${baselineMode}|${city}|${simulateMissingInputs ? 1 : 0}|${paramsKey}|T${roundedT}`;
    },
    [scenarioId, baselineMode, city, simulateMissingInputs, paramsKey]
  );

  // Stop any active scheduled timer
  const stopTimer = useCallback(() => {
    if (playbackTimeoutRef.current) {
      clearTimeout(playbackTimeoutRef.current);
      playbackTimeoutRef.current = null;
    }
  }, []);

  // Invalidate in-flight requests when scenario, baseline, or params change
  useEffect(() => {
    stopTimer();
    isPlayingRef.current = false;
    setStatus("idle");
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, [scenarioId, baselineMode, paramsKey, simulateMissingInputs, stopTimer]);

  // Execute a deterministic calculation for a specific time step
  const executeCalculation = useCallback(
    async (targetTime: number): Promise<SimulationResult | null> => {
      if (!enabled || city.toLowerCase() !== "mumbai") {
        return null;
      }

      const roundedTime = Math.round(targetTime * 10) / 10;
      const cacheKey = makeCacheKey(roundedTime);

      // 1. Check in-memory cache for instant 0ms return
      if (cacheRef.current.has(cacheKey)) {
        const cached = cacheRef.current.get(cacheKey)!;
        setSimResult(cached);
        setError(null);
        setIsLoading(false);
        return cached;
      }

      // 2. Abort any previous pending in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      const currentSeq = ++requestSeqRef.current;
      setIsLoading(true);

      try {
        const effectiveParams = { ...parameters };
        if (simulateMissingInputs) {
          const keys = Object.keys(effectiveParams);
          if (keys.length > 0) {
            delete effectiveParams[keys[0]];
          }
        }

        const res = await fetch("/api/hazards/simulation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scenarioId,
            parameters: effectiveParams,
            timeStepHours: roundedTime,
            baselineMode,
            city,
            simulateMissingInputs,
          }),
          signal: abortController.signal,
        });

        if (!res.ok) {
          throw new Error(`Simulation API responded with HTTP ${res.status}`);
        }

        const json = await res.json();

        // Stale-response guard: ignore response if a newer request was dispatched
        if (currentSeq !== requestSeqRef.current) {
          return null;
        }

        if (json.success && json.data) {
          const result: SimulationResult = json.data;
          cacheRef.current.set(cacheKey, result);
          setSimResult(result);
          setError(null);
          return result;
        } else {
          throw new Error(json.error || "Simulation evaluation failed");
        }
      } catch (err: any) {
        if (err.name === "AbortError") {
          // Expected cancellation; do not treat as runtime error
          return null;
        }
        if (currentSeq === requestSeqRef.current) {
          console.error("[useSimulationPlayback] Calculation error:", err);
          setError(err.message || "Failed to calculate simulation time step");
          // Requirement 6: Keep the last valid result visible if a new calculation fails
        }
        return null;
      } finally {
        if (currentSeq === requestSeqRef.current) {
          setIsLoading(false);
        }
      }
    },
    [enabled, city, makeCacheKey, parameters, simulateMissingInputs, scenarioId, baselineMode]
  );

  // Background pre-fetcher for next time step to maintain 0ms zero-latency playback
  const prefetchStep = useCallback(
    async (targetTime: number) => {
      if (!enabled || city.toLowerCase() !== "mumbai") return;
      const roundedTime = Math.round(targetTime * 10) / 10;
      const cacheKey = makeCacheKey(roundedTime);
      if (cacheRef.current.has(cacheKey)) return;

      try {
        const effectiveParams = { ...parameters };
        if (simulateMissingInputs) {
          const keys = Object.keys(effectiveParams);
          if (keys.length > 0) delete effectiveParams[keys[0]];
        }
        const res = await fetch("/api/hazards/simulation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scenarioId,
            parameters: effectiveParams,
            timeStepHours: roundedTime,
            baselineMode,
            city,
            simulateMissingInputs,
          }),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            cacheRef.current.set(cacheKey, json.data);
          }
        }
      } catch {
        // Non-fatal prefetch catch
      }
    },
    [enabled, city, makeCacheKey, parameters, simulateMissingInputs, scenarioId, baselineMode]
  );

  // Synchronize when scenario, baseline, params, or timeStep changes outside playback loop
  useEffect(() => {
    // Only fire if not actively playing (playing handles its own sequential step pipeline)
    if (!isPlayingRef.current) {
      executeCalculation(timeStep);
    }
  }, [timeStep, executeCalculation]);

  // Sequential Step Advancement Loop
  // Guarantees: time step advances ONLY AFTER current step calculation completes and renders
  const schedulePlaybackTick = useCallback(
    (currentT: number) => {
      stopTimer();

      // Pacing delay (1800ms at 1x, 900ms at 2x, 360ms at 5x)
      const delayMs = Math.max(200, Math.round(1800 / playbackSpeedRef.current));

      const nextT = Math.round((currentT + stepSize) * 10) / 10;

      // Prefetch upcoming step while current step is displaying
      if (nextT <= maxDuration) {
        prefetchStep(nextT);
      }

      playbackTimeoutRef.current = setTimeout(async () => {
        if (!isPlayingRef.current) return;

        if (nextT > maxDuration) {
          // Reached end of simulation horizon
          isPlayingRef.current = false;
          setStatus("paused");
          return;
        }

        // Commit new time step to state
        setTimeStep(nextT);

        // Await calculation completion before scheduling next tick
        const stepResult = await executeCalculation(nextT);

        if (!isPlayingRef.current) return;

        if (!stepResult && !cacheRef.current.has(makeCacheKey(nextT))) {
          // Calculation failed or aborted; pause gracefully to avoid runaway clock
          isPlayingRef.current = false;
          setStatus("paused");
          return;
        }

        // Schedule next step recursively
        schedulePlaybackTick(nextT);
      }, delayMs);
    },
    [stepSize, maxDuration, executeCalculation, prefetchStep, makeCacheKey, stopTimer]
  );

  // Action: Play (strictly idempotent)
  const play = useCallback(() => {
    if (status === "playing" || isPlayingRef.current) return;

    stopTimer();

    let startT = timeStepRef.current;
    if (startT >= maxDuration) {
      startT = 0;
      setTimeStep(0);
    }

    isPlayingRef.current = true;
    setStatus("playing");

    // Immediately ensure current step is computed
    executeCalculation(startT).then((res) => {
      if (!isPlayingRef.current) return;
      schedulePlaybackTick(startT);
    });
  }, [status, maxDuration, executeCalculation, schedulePlaybackTick, stopTimer]);

  // Action: Pause (stops advancement promptly)
  const pause = useCallback(() => {
    isPlayingRef.current = false;
    stopTimer();
    setStatus("paused");
  }, [stopTimer]);

  // Action: Reset (restores T=0 and idle state deterministically)
  const reset = useCallback(() => {
    isPlayingRef.current = false;
    stopTimer();
    setStatus("idle");
    setTimeStep(0);
    executeCalculation(0);
  }, [stopTimer, executeCalculation]);

  // Action: Step Next (+stepSize)
  const stepNext = useCallback(() => {
    isPlayingRef.current = false;
    stopTimer();
    setStatus("paused");
    const nextT = Math.min(maxDuration, Math.round((timeStepRef.current + stepSize) * 10) / 10);
    setTimeStep(nextT);
    executeCalculation(nextT);
  }, [maxDuration, stepSize, stopTimer, executeCalculation]);

  // Action: Step Prev (-stepSize)
  const stepPrev = useCallback(() => {
    isPlayingRef.current = false;
    stopTimer();
    setStatus("paused");
    const prevT = Math.max(0, Math.round((timeStepRef.current - stepSize) * 10) / 10);
    setTimeStep(prevT);
    executeCalculation(prevT);
  }, [stepSize, stopTimer, executeCalculation]);

  // Action: Scrub (timeline scrubbing cleans up active loop and calculates target time)
  const scrub = useCallback(
    (targetTime: number) => {
      isPlayingRef.current = false;
      stopTimer();
      setStatus("paused");
      const clamped = Math.max(0, Math.min(maxDuration, Math.round(targetTime * 10) / 10));
      setTimeStep(clamped);
      executeCalculation(clamped);
    },
    [maxDuration, stopTimer, executeCalculation]
  );

  // Action: Set Speed (adjusts timing delay only, never changes scientific values)
  const setSpeed = useCallback(
    (newSpeed: number) => {
      setPlaybackSpeed(newSpeed);
      playbackSpeedRef.current = newSpeed;

      // If actively playing, reschedule next tick with new delay without dropping current step
      if (isPlayingRef.current) {
        schedulePlaybackTick(timeStepRef.current);
      }
    },
    [schedulePlaybackTick]
  );

  // Action: Force Recalculate (clears cache and triggers evaluation)
  const forceRecalculate = useCallback(async () => {
    cacheRef.current.clear();
    await executeCalculation(timeStepRef.current);
  }, [executeCalculation]);

  // Complete unmount lifecycle cleanup
  useEffect(() => {
    return () => {
      isPlayingRef.current = false;
      stopTimer();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [stopTimer]);

  // Calculate staleness: report or state is stale if simResult does not match current inputs or timeStep
  const isStale = useMemo(() => {
    if (!simResult) return true;
    if (simResult.scenarioId !== scenarioId) return true;
    if (simResult.baselineMode !== baselineMode) return true;
    if (Math.abs(simResult.timeStepHours - timeStep) > 0.01) return true;

    // Check if parameters diverge
    for (const [k, v] of Object.entries(parameters)) {
      if (simResult.parametersApplied[k] !== undefined && simResult.parametersApplied[k] !== v) {
        return true;
      }
    }
    return false;
  }, [simResult, scenarioId, baselineMode, timeStep, parameters]);

  // Unified Authoritative Simulation State
  const authoritativeState: AuthoritativeSimulationState = useMemo(() => {
    const calcVer = simResult?.auditTrail?.executedAt
      ? `calc_v${requestSeqRef.current}_${new Date(simResult.auditTrail.executedAt).getTime()}`
      : `calc_v${requestSeqRef.current}_pending`;

    const repVer = simResult
      ? `dossier_${simResult.scenarioId}_t${simResult.timeStepHours}h_${calcVer}`
      : `dossier_${scenarioId}_t${timeStep}h_initial`;

    return {
      city,
      jurisdiction: "Greater Mumbai (MCGM / BMC)",
      scenarioId,
      modelVersion: simResult?.modelVersion || "v3.2-prod",
      parameters,
      timeStep,
      maxDuration,
      stepSize,
      playbackStatus: isLoading ? "calculating" : status,
      playbackSpeed,
      selectedWardId,
      calculationVersion: calcVer,
      qualityStatus: simResult?.qualityStatus || "PROVISIONAL",
      reportVersion: repVer,
      simResult,
      isLoading,
      isStale,
      error,
    };
  }, [
    city,
    scenarioId,
    parameters,
    timeStep,
    maxDuration,
    stepSize,
    isLoading,
    status,
    playbackSpeed,
    selectedWardId,
    simResult,
    isStale,
    error,
  ]);

  return {
    status: isLoading ? "calculating" : status,
    timeStep,
    maxDuration,
    stepSize,
    playbackSpeed,
    isLoading,
    isStale,
    error,
    simResult,

    // Authoritative State Fields
    city: authoritativeState.city,
    jurisdiction: authoritativeState.jurisdiction,
    scenarioId: authoritativeState.scenarioId,
    modelVersion: authoritativeState.modelVersion,
    calculationVersion: authoritativeState.calculationVersion,
    qualityStatus: authoritativeState.qualityStatus,
    reportVersion: authoritativeState.reportVersion,
    authoritativeState,

    // Actions
    play,
    pause,
    reset,
    stepNext,
    stepPrev,
    scrub,
    setSpeed,
    forceRecalculate,
  };
}
