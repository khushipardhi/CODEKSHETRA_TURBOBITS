/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Spatial Simulation Workspace
   Dedicated Map-First Workspace for Multi-Hazard Spatial Simulation.
   
   Features:
   - Map-First Visual Experience with Dynamic Leaflet Overlays
   - Real 24 BMC Ward Boundaries & Zero Rectangular Artifacts
   - Continuous Hazard Surfaces with Smooth Opacity & Color Ramps
   - Time-Dependent Playback Controls (Play, Pause, Step, Scrub, Speed)
   - Left Floating Parameter Drawer (Scenarios, Baselines, Sliders, Quality Testing)
   - Right Inspection Drawer:
       1. Ward Detail: Calculation trace, demographic exposure, hotspots, municipal actions
       2. Ranked List: 24-ward sorted impact table with click-to-focus
       3. Executive Dossier Report: Full structured scenario report with CSV export
       4. Formulas & Science: Mathematical formulas, assumptions, limitations
   - Actionable Administrative Handlers (Precautionary Advisory Drafts & Incident Desk link)
   - 3-Tier Model Readiness & Scientific Limitation Disclosures
   ════════════════════════════════════════════════════════ */

"use client";

import React, { useState, useEffect, useRef, useMemo, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  PlayIcon,
  PauseIcon,
  RotateCcwIcon,
  SlidersIcon,
  LayersIcon,
  ShieldAlertIcon,
  DownloadIcon,
  ActivityIcon,
  MapPinIcon,
  MapIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ClockIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
} from "@/components/ui/icons";
import { useCityContext } from "@/components/providers/city-provider";
import { CITIES, DEFAULT_CITY, type CityConfig } from "@/lib/city-context";
import { SCENARIO_REGISTRY, HISTORICAL_EVENTS, type ScenarioDefinition } from "@/modules/simulation/scenario-registry";
import type { SimulationResult } from "@/modules/simulation/engine";
import type { WardImpactRecord, StructuredScenarioReport, DataQualityStatus, SimulationTimeStepOutput } from "@/modules/simulation/contracts";
import { SimulationDossierPanel } from "./simulation-dossier-panel";
import { useSimulationPlayback } from "./use-simulation-playback";
import { canonicalWardId, isMatchingWard, MUMBAI_CANONICAL_WARDS } from "@/modules/geo/canonical-gis";

// Dynamically import Leaflet with SSR disabled
const LeafletMap = dynamic(() => import("./leaflet-simulation-map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-card">
      <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mb-3" />
      <p className="text-sm font-bold text-text-primary">Initializing Spatial Simulation Canvas...</p>
      <p className="text-xs text-text-tertiary">Compiling 24 BMC administrative wards and continuous hazard surfaces</p>
    </div>
  ),
});

function UnsupportedCitySimulationState({ cityConfig }: { cityConfig: CityConfig }) {
  return (
    <div className="flex-1 w-full h-full flex items-center justify-center p-6 bg-canvas overflow-y-auto">
      <div className="max-w-2xl w-full bg-card rounded-3xl border border-divider shadow-xl p-8 space-y-6 animate-fadeIn">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-600 dark:text-amber-400">
            <ShieldAlertIcon size={24} />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                GEOGRAPHIC SIMULATION CONTRACT • JURISDICTION NOTICE
              </span>
            </div>
            <h1 className="text-xl font-black text-text-primary tracking-tight">
              Spatial Flood Simulation Not Calibrated for {cityConfig.name} ({cityConfig.municipalAbbr})
            </h1>
            <p className="text-xs text-text-tertiary">
              Analytical boundary enforcement: Multi-hazard spatial flood simulation is scoped exclusively to Greater Mumbai (BMC).
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-divider bg-surface space-y-2.5 text-xs text-text-secondary leading-relaxed">
          <p>
            The Sentinel Spatial Simulation Lab executes screening models calibrated to municipal stormwater networks, astronomical tidal sluice gates, 24 canonical BMC wards, and high-resolution digital elevation models (GLO-30 / LiDAR).
          </p>
          <p>
            Currently, this detailed hydrodynamic screening model is <strong>only calibrated and verified for Greater Mumbai (BMC / MCGM)</strong>. Calibrated drainage corridors, pumping outfalls, and ward-level screening geometries for <strong>{cityConfig.name} ({cityConfig.municipalAbbr})</strong> are not yet operational.
          </p>
          <p className="text-text-tertiary italic">
            To prevent geographic confusion and protect municipal decision credibility, Mumbai&apos;s BMC ward boundaries, Mithi River vectors, and census metrics are strictly suppressed under {cityConfig.name}&apos;s jurisdiction.
          </p>
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary font-mono">
            Supported Capabilities for {cityConfig.name}
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <Link
              href={`/admin/${cityConfig.slug}/telemetry-lab`}
              className="p-3 rounded-2xl border border-divider bg-surface hover:bg-surface-elevated transition-colors flex items-center gap-3 group"
            >
              <ActivityIcon size={16} className="text-primary shrink-0" />
              <div>
                <span className="text-xs font-bold block text-text-primary group-hover:text-primary transition-colors">
                  Telemetry Lab
                </span>
                <span className="text-[11px] text-text-tertiary">
                  Live weather, AQI, heatwave and sensor telemetry
                </span>
              </div>
            </Link>

            <Link
              href={`/admin/${cityConfig.slug}/map`}
              className="p-3 rounded-2xl border border-divider bg-surface hover:bg-surface-elevated transition-colors flex items-center gap-3 group"
            >
              <MapIcon size={16} className="text-primary shrink-0" />
              <div>
                <span className="text-xs font-bold block text-text-primary group-hover:text-primary transition-colors">
                  Hazard &amp; Incident Map
                </span>
                <span className="text-[11px] text-text-tertiary">
                  Geospatial incident triage and emergency facilities
                </span>
              </div>
            </Link>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3 border-t border-divider">
          <Link
            href="/admin/mumbai/simulation"
            className="w-full sm:w-auto flex-1 py-2.5 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs text-center transition-colors shadow-xs flex items-center justify-center gap-2"
          >
            <span>Switch to Mumbai Simulation Lab →</span>
          </Link>
          <Link
            href={`/admin/${cityConfig.slug}`}
            className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-surface border border-divider hover:bg-surface-elevated text-text-primary font-bold text-xs text-center transition-colors"
          >
            Return to {cityConfig.name} Command Overview
          </Link>
        </div>
      </div>
    </div>
  );
}

function SimulationWorkspaceInner() {
  const routeParams = useParams();
  const searchParams = useSearchParams();
  const routeCity = (routeParams?.city as string) || "";

  let contextCity = "mumbai";
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const cityCtx = useCityContext();
    if (cityCtx?.city) contextCity = cityCtx.city;
  } catch {}

  const activeCity = routeCity || contextCity || "mumbai";
  const isMumbaiSupported = activeCity === "mumbai";
  const cityConfig = CITIES[activeCity] || CITIES[DEFAULT_CITY];

  const qScenario = searchParams?.get("scenario");
  const qBaseline = searchParams?.get("baseline");
  const qTime = searchParams?.get("t");
  const qWard = searchParams?.get("ward");
  const qTab = searchParams?.get("tab");
  const qZones = searchParams?.get("zones");
  const qMissing = searchParams?.get("missing") === "1";

  // Scenario & Baseline Selection
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(qScenario || "rainfall_waterlogging");
  const [baselineMode, setBaselineMode] = useState<string>(qBaseline || "current_live");

  // Parameter State
  const activeScenario = SCENARIO_REGISTRY[selectedScenarioId] || SCENARIO_REGISTRY.rainfall_waterlogging;
  const [params, setParams] = useState<Record<string, number>>({});
  const [simulateMissingInputs, setSimulateMissingInputs] = useState<boolean>(qMissing);

  // Initialize parameters when scenario changes
  useEffect(() => {
    const initialParams: Record<string, number> = {};
    for (const input of activeScenario.inputs) {
      const qVal = searchParams?.get(input.key);
      initialParams[input.key] = qVal !== null && qVal !== undefined && !isNaN(Number(qVal)) ? Number(qVal) : input.defaultValue;
    }
    setParams(initialParams);
  }, [selectedScenarioId, searchParams]);

  // Selected Ward for Deep Inspection & Canonical Navigation
  const [selectedWardId, setSelectedWardId] = useState<string>(qWard || "L");
  const [wardFocusTrigger, setWardFocusTrigger] = useState<number>(1);

  // Authoritative ward selection handler: updates identity and triggers bounding box focus
  const handleSelectWard = React.useCallback((wardId: string, forceFocus = true) => {
    const canonical = canonicalWardId(wardId, "mumbai") || wardId;
    setSelectedWardId(canonical);
    if (forceFocus) {
      setWardFocusTrigger((prev) => prev + 1);
    }
  }, []);

  const [rightPanelTab, setRightPanelTab] = useState<"ward_detail" | "ranked" | "model_meta">(
    qTab === "ranked" || qTab === "model_meta" ? qTab : "ward_detail"
  );

  // Executive Dossier Full Modal State (keeps right drawer uncluttered)
  const [isDossierModalOpen, setIsDossierModalOpen] = useState<boolean>(qTab === "report");

  // Floating Layer Manager State
  const [layerManagerOpen, setLayerManagerOpen] = useState<boolean>(false);

  // UI Drawer Toggles
  const [controlsOpen, setControlsOpen] = useState<boolean>(true);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(true);

  // Auto-close drawers on mobile on initial mount
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setControlsOpen(false);
      setDrawerOpen(false);
    }
  }, []);

  // Responsive drawer toggle handlers
  const handleToggleControls = () => {
    const nextState = !controlsOpen;
    setControlsOpen(nextState);
    if (nextState && typeof window !== "undefined" && window.innerWidth < 768) {
      setDrawerOpen(false);
    }
  };

  const handleToggleDrawer = () => {
    const nextState = !drawerOpen;
    setDrawerOpen(nextState);
    if (nextState && typeof window !== "undefined" && window.innerWidth < 768) {
      setControlsOpen(false);
    }
  };

  // Representation Mode: Continuous Isobands vs Administrative Choropleth vs Hybrid
  const [surfaceMode, setSurfaceMode] = useState<"isoband" | "choropleth" | "hybrid">("hybrid");

  // Basemap Tile Provider & Legend Toggle
  const [basemapProvider, setBasemapProvider] = useState<"osm" | "carto-light" | "carto-dark" | "satellite">("osm");
  const [isLegendExpanded, setIsLegendExpanded] = useState<boolean>(true);

  // Layer Toggles
  const [showSurface, setShowSurface] = useState<boolean>(true);
  const [showWards, setShowWards] = useState<boolean>(true);
  const [showZones, setShowZones] = useState<boolean>(qZones === "1");
  const [showRivers, setShowRivers] = useState<boolean>(true);
  const [showHotspots, setShowHotspots] = useState<boolean>(true);
  const [showPumps, setShowPumps] = useState<boolean>(true);
  const [showRoads, setShowRoads] = useState<boolean>(true);
  const [showDepressions, setShowDepressions] = useState<boolean>(true);
  const [showHospitals, setShowHospitals] = useState<boolean>(true);
  const [showBridges, setShowBridges] = useState<boolean>(true);
  const [showCoastal, setShowCoastal] = useState<boolean>(true);
  const [filterToSelectedWard, setFilterToSelectedWard] = useState<boolean>(false);

  // Action / Advisory Feedback
  const [advisoryDraftNotice, setAdvisoryDraftNotice] = useState<string | null>(null);

  // Maximum timeline duration
  const maxDuration = params.durationHours || 6;

  // Authoritative Deterministic Playback Controller Hook
  const playback = useSimulationPlayback({
    scenarioId: selectedScenarioId,
    parameters: params,
    baselineMode,
    city: "mumbai",
    maxDuration,
    stepSize: 0.5,
    simulateMissingInputs,
    enabled: isMumbaiSupported,
    initialTimeStep: qTime ? parseFloat(qTime) : 1,
    selectedWardId,
  });

  const { timeStep, simResult, isLoading: loading } = playback;

  // Selected ward record from result matching canonical identity
  const selectedWardRecord: WardImpactRecord | undefined = useMemo(() => {
    if (!simResult?.rankedWards) return undefined;
    return (
      simResult.rankedWards.find((w) => isMatchingWard(w.wardId, selectedWardId, "mumbai")) ||
      simResult.rankedWards[0]
    );
  }, [simResult, selectedWardId]);

  // Synchronize canonical ward selection to URL search params without page reload
  useEffect(() => {
    if (typeof window !== "undefined" && selectedWardId) {
      const canonical = canonicalWardId(selectedWardId, "mumbai");
      const url = new URL(window.location.href);
      if (url.searchParams.get("ward") !== canonical) {
        url.searchParams.set("ward", canonical);
        window.history.replaceState(null, "", url.toString());
      }
    }
  }, [selectedWardId]);

  // Memoized SimulationTimeStepOutput for Canonical Dossier Studio
  const dossierSimOutput = useMemo<SimulationTimeStepOutput | null>(() => {
    if (!simResult) return null;
    return {
      timeStepHours: simResult.timeStepHours,
      simulatedTimeIso: new Date().toISOString(),
      timeRatio: simResult.timeStepHours / (simResult.maxDurationHours || 1),
      activeScenarioId: simResult.scenarioId,
      modelVersion: simResult.modelVersion,
      parametersApplied: simResult.parametersApplied,
      qualityStatus: simResult.qualityStatus,
      missingParameters: simResult.missingParameters,
      continuousSurfaceIsobands: simResult.continuousSurface.isobandsGeoJSON,
      rankedWards: simResult.rankedWards,
      summary: simResult.summary,
      auditTrail: {
        engineVersion: simResult.auditTrail.engineVersion,
        executedAt: simResult.auditTrail.executedAt,
        executionTimeMs: simResult.auditTrail.executionTimeMs,
        scientificFormula: simResult.auditTrail.scientificFormula,
        limitations: simResult.auditTrail.limitations,
        uncertaintyNote: simResult.auditTrail.uncertaintyNote,
      },
    };
  }, [simResult]);

  // Draft Advisory Action Handler
  const handleDraftAdvisory = (ward: WardImpactRecord) => {
    setAdvisoryDraftNotice(
      `Draft Precautionary Advisory logged for Ward ${ward.wardId} (${ward.wardName}): Action "${ward.recommendedAction}". Routed to Admin Incident Desk with pre-authorization pending.`
    );
    setTimeout(() => setAdvisoryDraftNotice(null), 8000);
  };

  // Export CSV Dossier
  const handleExportCSV = () => {
    if (!simResult) return;
    const rows = [
      ["# SENTINEL CITY INTELLIGENCE — MULTI-HAZARD SIMULATION DOSSIER"],
      [`Scenario: ${simResult.scenarioTitle} (${simResult.scenarioId})`],
      [`Model Version: ${simResult.modelVersion} | Readiness Tier: ${simResult.modelTier}`],
      [`Time Step: T = ${timeStep}h / ${maxDuration}h | Baseline: ${simResult.baselineMode}`],
      [`Quality Status: ${simResult.qualityStatus} | Overall Alert: ${simResult.summary.overallAlertLevel}`],
      [`Timestamp (UTC): ${new Date().toISOString()}`],
      [],
      ["Rank", "Ward ID", "Ward Name", "Zone", "Metric Score", "Unit", "Baseline", "Delta %", "Tier", "Threshold Exceeded", "Exposed Population Est.", "Drainage Basin", "Elevation (m)", "Recommended Action", "Calculation Trace"],
      ...simResult.rankedWards.map((w, idx) => [
        idx + 1,
        w.wardId,
        `"${w.wardName}"`,
        w.zoneCode,
        w.metricValue,
        w.metricUnit,
        w.baselineValue,
        `${w.deltaPercent}%`,
        `"${w.tierLabel}"`,
        w.isThresholdExceeded ? "YES" : "NO",
        w.estimatedExposedPopulation,
        `"${w.drainageBasin}"`,
        w.elevationMeanM,
        `"${w.recommendedAction.replace(/"/g, '""')}"`,
        `"${w.calculationTrace.replace(/"/g, '""')}"`,
      ]),
    ];
    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sentinel_${selectedScenarioId}_t${timeStep}h_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Ward JSON
  const handleExportWardJSON = (ward: WardImpactRecord) => {
    const jsonStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(ward, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", jsonStr);
    link.setAttribute("download", `ward_${ward.wardId}_impact_t${timeStep}h.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Dedicated Full-Width Report Studio Deep-Link (Citywide overview default)
  const reportUrl = useMemo(() => {
    const p = new URLSearchParams();
    p.set("scenario", selectedScenarioId);
    p.set("t", String(timeStep));
    p.set("ward", selectedWardId);
    if (baselineMode) p.set("baseline", baselineMode);
    for (const [k, v] of Object.entries(params)) {
      p.set(k, String(v));
    }
    if (simulateMissingInputs) p.set("missing", "1");
    return `/admin/mumbai/simulation/report?${p.toString()}`;
  }, [selectedScenarioId, timeStep, selectedWardId, baselineMode, params, simulateMissingInputs]);

  // Dedicated Ward Dossier Report Studio Deep-Link
  const wardReportUrl = useMemo(() => {
    const p = new URLSearchParams();
    p.set("scenario", selectedScenarioId);
    p.set("t", String(timeStep));
    p.set("ward", selectedWardId);
    p.set("scope", "ward_detail");
    if (baselineMode) p.set("baseline", baselineMode);
    for (const [k, v] of Object.entries(params)) {
      p.set(k, String(v));
    }
    if (simulateMissingInputs) p.set("missing", "1");
    return `/admin/mumbai/simulation/report?${p.toString()}`;
  }, [selectedScenarioId, timeStep, selectedWardId, baselineMode, params, simulateMissingInputs]);

  if (!isMumbaiSupported) {
    return <UnsupportedCitySimulationState cityConfig={cityConfig} />;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-68px)] w-full overflow-hidden bg-background select-none">
      {/* ─── TOP STATUS & PLAYBACK RIBBON (STABLE 3-COLUMN GRID: ZERO BOUNCE) ─── */}
      <header className="h-14 border-b border-divider bg-card px-3 sm:px-4 grid grid-cols-[1fr_auto_1fr] items-center shrink-0 z-20 gap-2">
        {/* Left: Breadcrumbs, Model Readiness & Fixed-Width Status Slot */}
        <div className="justify-self-start flex items-center gap-2.5 min-w-0 overflow-hidden">
          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                playback.status === "playing"
                  ? "bg-amber-500 animate-ping"
                  : "bg-primary"
              }`}
            />
            <h1 className="text-xs font-black tracking-tight text-text-primary uppercase font-mono whitespace-nowrap hidden sm:inline-block">
              Spatial Simulation Lab
            </h1>

            {/* Stable reserved space for calculation / sync state (w-[135px]) */}
            <div className="w-[135px] h-6 flex items-center justify-center shrink-0">
              {playback.status === "calculating" ? (
                <span className="w-full flex items-center justify-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping shrink-0" />
                  CALCULATING...
                </span>
              ) : (
                <span className="w-full flex items-center justify-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  MESH SYNCED
                </span>
              )}
            </div>
          </div>

          <div className="hidden 2xl:flex items-center gap-2 whitespace-nowrap shrink-0">
            <span className="text-divider">/</span>
            {simResult?.modelTier === "TIER_1_OBSERVED_FORECAST" && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                TIER 1 — OBSERVED / FORECAST
              </span>
            )}
            {simResult?.modelTier === "TIER_2_SCREENING_SIMULATION" && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                TIER 2 — SCREENING (NON-HYDRODYNAMIC)
              </span>
            )}
            {simResult?.modelTier === "TIER_3_VALIDATED_HYDRODYNAMIC" && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20">
                TIER 3 — VALIDATED 2D MODEL
              </span>
            )}

            {/* Data Quality Status */}
            {simResult?.qualityStatus === "VALIDATED" && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                DATA: VALIDATED
              </span>
            )}
            {simResult?.qualityStatus === "PROVISIONAL" && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                DATA: PROVISIONAL
              </span>
            )}
            {simResult?.qualityStatus === "PARTIALLY_CALIBRATED" && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                DATA: PARTIAL CALIBRATION
              </span>
            )}

            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono text-text-tertiary border border-divider">
              0.01° Grid (~1.1 km)
            </span>
          </div>
        </div>

        {/* Center: Authoritative Playback Controls (STABLE WIDTH, TABULAR NUMS, DEAD-CENTER GRID ANCHOR) */}
        <div className="justify-self-center flex items-center gap-1 sm:gap-1.5 bg-surface px-2.5 sm:px-3 py-1 rounded-2xl border border-divider shadow-xs shrink-0">
          {/* Reset */}
          <button
            onClick={playback.reset}
            title="Reset to T=0"
            className="w-7 sm:w-8 h-7 flex items-center justify-center rounded-lg hover:bg-surface-elevated text-text-secondary hover:text-text-primary transition-colors cursor-pointer shrink-0"
          >
            <RotateCcwIcon size={14} />
          </button>

          {/* Step Back */}
          <button
            onClick={playback.stepPrev}
            disabled={playback.timeStep <= 0}
            title="Step Back 0.5h"
            className="w-8 sm:w-9 h-7 text-xs font-bold hover:bg-surface-elevated text-text-secondary disabled:opacity-30 rounded-md transition-colors cursor-pointer shrink-0 text-center"
          >
            -1h
          </button>

          {/* Authoritative Play/Pause with FIXED 84px width */}
          <button
            onClick={() => {
              if (playback.status === "playing") {
                playback.pause();
              } else {
                playback.play();
              }
            }}
            className={`w-[84px] h-7 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-colors shadow-xs shrink-0 cursor-pointer ${
              playback.status === "playing"
                ? "bg-amber-500 text-white hover:bg-amber-600"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
          >
            {playback.status === "playing" ? <PauseIcon size={12} /> : <PlayIcon size={12} />}
            <span className="w-11 text-left font-mono">{playback.status === "playing" ? "PAUSE" : "PLAY"}</span>
          </button>

          {/* Step Forward */}
          <button
            onClick={playback.stepNext}
            disabled={playback.timeStep >= maxDuration}
            title="Step Forward 0.5h"
            className="w-8 sm:w-9 h-7 text-xs font-bold hover:bg-surface-elevated text-text-secondary disabled:opacity-30 rounded-md transition-colors cursor-pointer shrink-0 text-center"
          >
            +1h
          </button>

          <div className="h-4 w-px bg-divider mx-0.5 shrink-0" />

          {/* Speed Selector */}
          <div className="flex items-center gap-0.5 text-[10px] font-mono font-bold shrink-0">
            {[1, 2, 5].map((spd) => (
              <button
                key={spd}
                onClick={() => playback.setSpeed(spd)}
                className={`w-6 h-6 flex items-center justify-center rounded-md transition-colors cursor-pointer ${
                  playback.playbackSpeed === spd
                    ? "bg-primary/10 text-primary font-black"
                    : "text-text-tertiary hover:text-text-secondary"
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-divider mx-0.5 shrink-0" />

          {/* Step Pill with TABULAR NUMERALS & FIXED 125px WIDTH */}
          <span className="w-[125px] h-6 flex items-center justify-center text-xs font-mono font-black tabular-nums text-primary px-2 rounded-lg bg-primary/10 shrink-0">
            T = {playback.timeStep.toFixed(1)}h / {maxDuration}h
          </span>
        </div>

        {/* Right: Alert Level & Panel Toggles */}
        <div className="justify-self-end flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Reserved Alert Badge Slot: Fixed width w-[130px] */}
          <div className="w-[130px] flex items-center justify-center shrink-0">
            {simResult?.summary.overallAlertLevel === "RED_WARNING" && (
              <span className="w-full text-center px-2 py-1 rounded-xl text-xs font-black bg-red-500/15 text-red-600 border border-red-500/30 flex items-center justify-center gap-1.5 whitespace-nowrap animate-pulse">
                <ShieldAlertIcon size={14} /> RED ALERT
              </span>
            )}
            {simResult?.summary.overallAlertLevel === "ORANGE_ALERT" && (
              <span className="w-full text-center px-2 py-1 rounded-xl text-xs font-black bg-amber-500/15 text-amber-600 border border-amber-500/30 flex items-center justify-center gap-1.5 whitespace-nowrap">
                <ShieldAlertIcon size={14} /> ORANGE WATCH
              </span>
            )}
            {simResult?.summary.overallAlertLevel === "YELLOW_WATCH" && (
              <span className="w-full text-center px-2 py-1 rounded-xl text-xs font-black bg-yellow-500/15 text-yellow-600 border border-yellow-500/30 flex items-center justify-center whitespace-nowrap">
                YELLOW ADVISORY
              </span>
            )}
            {(simResult?.summary.overallAlertLevel === "GREEN_NORMAL" || !simResult) && (
              <span className="w-full text-center px-2 py-1 rounded-xl text-xs font-black bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 flex items-center justify-center whitespace-nowrap">
                NORMAL
              </span>
            )}
          </div>

          {/* GIS Layer Manager Button */}
          <button
            onClick={() => setLayerManagerOpen(!layerManagerOpen)}
            className={`px-2.5 py-1.5 rounded-xl border border-divider text-xs font-bold flex items-center gap-1.5 transition-colors ${
              layerManagerOpen
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-surface hover:bg-surface-elevated text-text-primary"
            }`}
            title="Toggle GIS Spatial Layer Manager"
          >
            <LayersIcon size={14} />
            <span className="hidden sm:inline">Layers</span>
          </button>

          {/* Dedicated Executive Report Studio Link */}
          <Link
            href={reportUrl}
            className="px-2.5 py-1.5 rounded-xl border border-divider text-xs font-bold flex items-center gap-1.5 transition-colors bg-surface hover:bg-surface-elevated text-text-primary"
            title="Open Dedicated Full-Width Simulation Report Studio (Sections A through H)"
          >
            <span className="text-primary font-bold">📄</span>
            <span className="hidden sm:inline">Report Studio ↗</span>
          </Link>

          {/* Layout Presets for Space Maximization */}
          <div className="hidden xl:flex items-center bg-surface p-0.5 rounded-xl border border-divider text-xs">
            <button
              onClick={() => {
                setControlsOpen(false);
                setDrawerOpen(false);
              }}
              title="Panoramic Full Map View (Maximizes map canvas to 100%)"
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                !controlsOpen && !drawerOpen
                  ? "bg-card text-primary shadow-xs font-bold"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Full Map
            </button>
            <button
              onClick={() => {
                setControlsOpen(true);
                setDrawerOpen(false);
              }}
              title="Scenario Inputs Focus"
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                controlsOpen && !drawerOpen
                  ? "bg-card text-primary shadow-xs font-bold"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Inputs
            </button>
            <button
              onClick={() => {
                setControlsOpen(false);
                setDrawerOpen(true);
              }}
              title="Ward Inspection Focus"
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                !controlsOpen && drawerOpen
                  ? "bg-card text-primary shadow-xs font-bold"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Wards
            </button>
            <button
              onClick={() => {
                setControlsOpen(true);
                setDrawerOpen(true);
              }}
              title="Studio Dual Panel Analysis"
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                controlsOpen && drawerOpen
                  ? "bg-card text-primary shadow-xs font-bold"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Studio
            </button>
          </div>

          <button
            onClick={handleToggleControls}
            className={`p-2 rounded-xl border border-divider text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              controlsOpen ? "bg-surface-elevated text-primary" : "bg-surface text-text-secondary"
            }`}
            title="Toggle Scenario Inputs Panel"
          >
            <SlidersIcon size={14} />
          </button>

          <button
            onClick={handleToggleDrawer}
            className={`p-2 rounded-xl border border-divider text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              drawerOpen ? "bg-surface-elevated text-primary" : "bg-surface text-text-secondary"
            }`}
            title="Toggle Ward Inspection Drawer"
          >
            <MapPinIcon size={14} />
          </button>
        </div>
      </header>

      {/* Advisory Draft Banner Notification */}
      {advisoryDraftNotice && (
        <div className="bg-emerald-500/15 border-b border-emerald-500/30 px-6 py-2.5 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between z-30 animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircleIcon size={16} className="text-emerald-600 shrink-0" />
            <span className="font-semibold">{advisoryDraftNotice}</span>
          </div>
          <button onClick={() => setAdvisoryDraftNotice(null)} className="text-xs font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Missing Input Alert Notice */}
      {simResult?.missingParameters && simResult.missingParameters.length > 0 && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-6 py-2 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between z-30">
          <div className="flex items-center gap-2">
            <AlertTriangleIcon size={16} className="text-amber-600 shrink-0" />
            <span>
              <strong>Partial Data Ingestion:</strong> Missing parameters [
              {simResult.missingParameters.join(", ")}]. Engine evaluated using verified BRIMSTOWAD/IMD defaults. Quality tier: <strong>PARTIALLY_CALIBRATED</strong>.
            </span>
          </div>
        </div>
      )}

      {/* ─── MAIN MAP & FLOATING WORKSPACE PANELS ───────────────── */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        {/* LEAFLET INTERACTIVE MAP (PRIMARY VISUAL ELEMENT) */}
        <LeafletMap
          isobandsGeoJSON={simResult?.continuousSurface?.isobandsGeoJSON}
          selectedWardId={selectedWardId}
          wardFocusTrigger={wardFocusTrigger}
          onSelectWard={(wardId) => {
            handleSelectWard(wardId, true);
            setRightPanelTab("ward_detail");
            if (!drawerOpen) setDrawerOpen(true);
          }}
          filterToSelectedWard={filterToSelectedWard}
          surfaceMode={surfaceMode}
          wardImpacts={simResult?.rankedWards}
          layerVisibility={{
            showSurface,
            showWards,
            showZones,
            showRivers,
            showHotspots,
            showPumps,
            showRoads,
            showDepressions,
            showHospitals,
            showBridges,
            showCoastal,
          }}
          controlsOpen={controlsOpen}
          drawerOpen={drawerOpen}
          basemapProvider={basemapProvider}
        />

        {/* ─── FLOATING GIS LAYER MANAGER POPOVER ────────────────── */}
        {layerManagerOpen && (
          <div className="absolute top-4 left-4 md:left-20 z-30 w-84 max-h-[calc(100%-80px)] bg-white/98 dark:bg-slate-900/98 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col animate-fadeIn backdrop-blur-md">
            <div className="p-3.5 border-b border-divider flex items-center justify-between bg-surface/50">
              <div className="flex items-center gap-2">
                <LayersIcon size={16} className="text-primary" />
                <div>
                  <h3 className="font-black text-xs text-text-primary uppercase tracking-tight font-mono">
                    GIS Spatial Layer Manager
                  </h3>
                  <span className="text-[10px] text-text-tertiary">10 Calibrated GIS Layers • Mumbai BMC</span>
                </div>
              </div>
              <button
                onClick={() => setLayerManagerOpen(false)}
                className="w-7 h-7 rounded-lg hover:bg-surface-elevated text-text-tertiary hover:text-text-primary text-xs flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4 text-xs scrollbar-none">
              {/* Category 0: Basemap Tile Provider */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary font-mono block">
                  Basemap Cartography
                </span>
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-surface rounded-xl border border-divider text-[11px]">
                  {[
                    { id: "osm", label: "OpenStreetMap", icon: "🌐" },
                    { id: "carto-light", label: "Clean Light", icon: "☀️" },
                    { id: "carto-dark", label: "Dark Matter", icon: "🌙" },
                    { id: "satellite", label: "Satellite", icon: "🛰️" },
                  ].map((bm) => (
                    <button
                      key={bm.id}
                      type="button"
                      onClick={() => setBasemapProvider(bm.id as any)}
                      className={`py-1.5 px-2 rounded-lg font-bold flex items-center gap-1.5 transition-all text-left ${
                        basemapProvider === bm.id
                          ? "bg-card text-primary shadow-xs border border-primary/20"
                          : "text-text-secondary hover:text-text-primary hover:bg-surface-elevated"
                      }`}
                    >
                      <span>{bm.icon}</span>
                      <span className="truncate">{bm.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Category 1: Administrative */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary font-mono block">
                  1. Administrative Boundaries
                </span>
                <div className="space-y-1.5">
                  <label className="flex items-center justify-between p-2 rounded-xl bg-surface border border-divider hover:bg-surface-elevated cursor-pointer">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-xs bg-blue-600" />
                      <div>
                        <span className="font-bold text-text-primary block leading-tight">24 BMC Wards</span>
                        <span className="text-[10px] text-text-tertiary">Canonical polygon boundaries & pop.</span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={showWards}
                      onChange={(e) => setShowWards(e.target.checked)}
                      className="rounded accent-primary"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2 rounded-xl bg-surface border border-divider hover:bg-surface-elevated cursor-pointer">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-xs bg-purple-600" />
                      <div>
                        <span className="font-bold text-text-primary block leading-tight">BMC Zones (I–VII)</span>
                        <span className="text-[10px] text-text-tertiary">Parent municipal administrative zones</span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={showZones}
                      onChange={(e) => setShowZones(e.target.checked)}
                      className="rounded accent-purple-600"
                    />
                  </label>
                </div>
              </div>

              {/* Category 2: Hydrology & Drainage */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary font-mono block">
                  2. Hydrology & Waterways
                </span>
                <div className="space-y-1.5">
                  <label className="flex items-center justify-between p-2 rounded-xl bg-surface border border-divider hover:bg-surface-elevated cursor-pointer">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                      <div>
                        <span className="font-bold text-text-primary block leading-tight">Mithi River & Nullahs</span>
                        <span className="text-[10px] text-text-tertiary">Natural surface drainage corridors</span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={showRivers}
                      onChange={(e) => setShowRivers(e.target.checked)}
                      className="rounded accent-sky-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2 rounded-xl bg-surface border border-divider hover:bg-surface-elevated cursor-pointer">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                      <div>
                        <span className="font-bold text-text-primary block leading-tight">Stormwater Pumps (41)</span>
                        <span className="text-[10px] text-text-tertiary">BRIMSTOWAD outfalls & pump stations</span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={showPumps}
                      onChange={(e) => setShowPumps(e.target.checked)}
                      className="rounded accent-cyan-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2 rounded-xl bg-surface border border-divider hover:bg-surface-elevated cursor-pointer">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-xs bg-teal-600" />
                      <div>
                        <span className="font-bold text-text-primary block leading-tight">Coastal Exposure</span>
                        <span className="text-[10px] text-text-tertiary">Arabian Sea open coast & tidal creeks</span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={showCoastal}
                      onChange={(e) => setShowCoastal(e.target.checked)}
                      className="rounded accent-teal-600"
                    />
                  </label>
                </div>
              </div>

              {/* Category 3: Topography & Hazards */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary font-mono block">
                  3. Topography & Hazards
                </span>
                <div className="space-y-1.5">
                  <label className="flex items-center justify-between p-2 rounded-xl bg-surface border border-divider hover:bg-surface-elevated cursor-pointer">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                      <div>
                        <span className="font-bold text-text-primary block leading-tight">Flood Hotspots (35)</span>
                        <span className="text-[10px] text-text-tertiary">Chronic waterlogging points</span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={showHotspots}
                      onChange={(e) => setShowHotspots(e.target.checked)}
                      className="rounded accent-red-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2 rounded-xl bg-surface border border-divider hover:bg-surface-elevated cursor-pointer">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-xs bg-amber-500" />
                      <div>
                        <span className="font-bold text-text-primary block leading-tight">DEM Sinks (15)</span>
                        <span className="text-[10px] text-text-tertiary">Copernicus GLO-30 saucer depressions</span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={showDepressions}
                      onChange={(e) => setShowDepressions(e.target.checked)}
                      className="rounded accent-amber-500"
                    />
                  </label>
                </div>
              </div>

              {/* Category 4: Critical Infrastructure */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary font-mono block">
                  4. Critical Infrastructure
                </span>
                <div className="space-y-1.5">
                  <label className="flex items-center justify-between p-2 rounded-xl bg-surface border border-divider hover:bg-surface-elevated cursor-pointer">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-xs bg-slate-700 dark:bg-slate-300" />
                      <div>
                        <span className="font-bold text-text-primary block leading-tight">Arterial Roads (78)</span>
                        <span className="text-[10px] text-text-tertiary">Expressways & arterial corridors</span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={showRoads}
                      onChange={(e) => setShowRoads(e.target.checked)}
                      className="rounded accent-slate-700"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2 rounded-xl bg-surface border border-divider hover:bg-surface-elevated cursor-pointer">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                      <div>
                        <span className="font-bold text-text-primary block leading-tight">Bridges & Culverts (14)</span>
                        <span className="text-[10px] text-text-tertiary">Sea links, causeways & river bridges</span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={showBridges}
                      onChange={(e) => setShowBridges(e.target.checked)}
                      className="rounded accent-purple-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2 rounded-xl bg-surface border border-divider hover:bg-surface-elevated cursor-pointer">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <div>
                        <span className="font-bold text-text-primary block leading-tight">Emergency Hospitals (20)</span>
                        <span className="text-[10px] text-text-tertiary">Disaster medical relief facilities</span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={showHospitals}
                      onChange={(e) => setShowHospitals(e.target.checked)}
                      className="rounded accent-emerald-500"
                    />
                  </label>
                </div>
              </div>

              {/* Category 5: Hazard Surface Output & Mode */}
              <div className="space-y-2 pt-2 border-t border-divider">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary font-mono block">
                  5. Hazard Surface & Representation
                </span>
                <label className="flex items-center justify-between p-2 rounded-xl bg-surface border border-divider hover:bg-surface-elevated cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-xs bg-primary" />
                    <div>
                      <span className="font-bold text-text-primary block leading-tight">Simulated Hazard Field</span>
                      <span className="text-[10px] text-text-tertiary">IDW continuous isoband field</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={showSurface}
                    onChange={(e) => setShowSurface(e.target.checked)}
                    className="rounded accent-primary"
                  />
                </label>

                <div className="grid grid-cols-3 gap-1 p-1 bg-surface rounded-xl border border-divider text-[10px]">
                  <button
                    type="button"
                    onClick={() => setSurfaceMode("isoband")}
                    className={`py-1.5 px-1 rounded-lg font-bold transition-all text-center ${
                      surfaceMode === "isoband"
                        ? "bg-card text-primary shadow-xs"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    Isobands
                  </button>
                  <button
                    type="button"
                    onClick={() => setSurfaceMode("choropleth")}
                    className={`py-1.5 px-1 rounded-lg font-bold transition-all text-center ${
                      surfaceMode === "choropleth"
                        ? "bg-card text-primary shadow-xs"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    Choropleth
                  </button>
                  <button
                    type="button"
                    onClick={() => setSurfaceMode("hybrid")}
                    className={`py-1.5 px-1 rounded-lg font-bold transition-all text-center ${
                      surfaceMode === "hybrid"
                        ? "bg-card text-primary shadow-xs"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    Hybrid
                  </button>
                </div>

                <label className="flex items-center gap-2 cursor-pointer bg-surface/80 p-2 rounded-xl border border-divider">
                  <input
                    type="checkbox"
                    checked={filterToSelectedWard}
                    onChange={(e) => setFilterToSelectedWard(e.target.checked)}
                    className="rounded accent-primary"
                  />
                  <div className="text-[11px] leading-tight">
                    <span className="font-bold text-text-primary block">Focus Markers on Ward {selectedWardId}</span>
                    <span className="text-[10px] text-text-tertiary">Declutter by isolating active ward.</span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* ─── FLOATING MINI-PILL: SCENARIO QUICK-EXPAND ───────── */}
        {!controlsOpen && (
          <button
            onClick={() => setControlsOpen(true)}
            className="absolute top-3 left-3 md:top-4 md:left-4 z-10 flex items-center gap-1.5 md:gap-2 px-2.5 py-1.5 md:px-3.5 md:py-2 bg-white/98 dark:bg-slate-900/98 hover:bg-white text-slate-900 dark:text-slate-100 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xl text-[11px] md:text-xs font-bold transition-all hover:scale-102 cursor-pointer group animate-fadeIn max-w-[50%] sm:max-w-xs"
            title="Expand Scenario Inputs"
          >
            <div className="w-5 h-5 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
              <SlidersIcon size={12} />
            </div>
            <span className="truncate">{activeScenario.title}</span>
            <span className="font-mono text-[9px] md:text-[10px] px-1.5 py-0.5 rounded-md bg-surface text-text-secondary border border-divider shrink-0">
              T={timeStep.toFixed(1)}h
            </span>
          </button>
        )}

        {/* ─── FLOATING MINI-PILL: WARD INSPECTION QUICK-EXPAND ── */}
        {!drawerOpen && (
          <button
            onClick={() => setDrawerOpen(true)}
            className="absolute top-3 right-3 md:top-4 md:right-4 z-10 flex items-center gap-1.5 md:gap-2 px-2.5 py-1.5 md:px-3.5 md:py-2 bg-white/98 dark:bg-slate-900/98 hover:bg-white text-slate-900 dark:text-slate-100 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xl text-[11px] md:text-xs font-bold transition-all hover:scale-102 cursor-pointer group animate-fadeIn max-w-[48%] sm:max-w-xs"
            title="Expand Ward Detail Inspection"
          >
            <div className="w-5 h-5 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
              <MapPinIcon size={12} />
            </div>
            <span className="truncate">Ward {selectedWardRecord?.wardId || selectedWardId}</span>
            {selectedWardRecord && (
              <span
                className="font-mono text-[9px] md:text-[10px] px-1.5 py-0.5 rounded-md text-white font-bold shrink-0"
                style={{ backgroundColor: selectedWardRecord.severityColor || "#3b82f6" }}
              >
                {selectedWardRecord.metricValue}
              </span>
            )}
          </button>
        )}

        {/* ─── LEFT FLOATING PANEL: SCENARIO PARAMETERS ─────────── */}
        {controlsOpen && (
          <aside className="absolute top-4 left-4 w-[calc(100%-32px)] md:w-84 max-h-[calc(100%-80px)] bg-white/98 dark:bg-slate-900/98 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col z-10 transition-all">
            <div className="p-4 border-b border-divider flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SlidersIcon size={14} className="text-primary" />
                <h2 className="text-xs font-black tracking-tight text-text-primary uppercase font-mono">
                  Scenario Parameters
                </h2>
              </div>
              <button
                onClick={() => setControlsOpen(false)}
                className="text-text-tertiary hover:text-text-primary text-xs"
              >
                ✕
              </button>
            </div>

            <div className="p-4 pb-12 space-y-4 overflow-y-auto scrollbar-none text-xs flex-1">
              {/* Scenario Selection */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">
                  Hazard Scenario
                </label>
                <select
                  value={selectedScenarioId}
                  onChange={(e) => setSelectedScenarioId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-divider bg-surface text-text-primary font-semibold text-xs focus:outline-hidden"
                >
                  {Object.values(SCENARIO_REGISTRY).map((sc) => (
                    <option key={sc.id} value={sc.id}>
                      {sc.title}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-text-tertiary leading-tight">{activeScenario.description}</p>
              </div>

              {/* Baseline Selection */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">
                  Baseline Context
                </label>
                <select
                  value={baselineMode}
                  onChange={(e) => {
                    const mode = e.target.value;
                    setBaselineMode(mode);
                    if (mode.startsWith("historical")) {
                      const ev = HISTORICAL_EVENTS.find((h) => h.id === mode);
                      if (ev) setParams(ev.defaultParameters);
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-divider bg-surface text-text-primary font-semibold text-xs focus:outline-hidden"
                >
                  <option value="current_live">Current Live Numerical Forecast</option>
                  <option value="dry_baseline">Dry Meteorological Baseline (0 mm)</option>
                  <option value="historical_july2005">26 July 2005 Extreme Cloudburst (944 mm)</option>
                  <option value="historical_july2024">8 July 2024 Monsoon Downpour (268 mm)</option>
                </select>
              </div>

              {/* Dynamic Parameter Sliders */}
              <div className="pt-2 border-t border-divider space-y-3.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary block font-mono">
                  Controlled Inputs & Variables
                </span>

                {activeScenario.inputs.map((inp) => {
                  const val = params[inp.key] ?? inp.defaultValue;

                  if (inp.key === "rainfallProfile") {
                    return (
                      <div key={inp.key} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-text-primary">{inp.label}</span>
                          <span className="text-[10px] font-mono text-primary font-bold">Hyetograph</span>
                        </div>
                        <select
                          value={val}
                          onChange={(e) =>
                            setParams((prev) => ({
                              ...prev,
                              [inp.key]: parseInt(e.target.value, 10),
                            }))
                          }
                          className="w-full text-xs p-2 rounded-xl border border-divider bg-surface font-semibold text-text-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20 cursor-pointer"
                        >
                          <option value="0">Constant Rate What-If (Uniform)</option>
                          <option value="1">Chicago Convective Peak (Burst at T=2h)</option>
                          <option value="2">26 July 2005 Cloudburst Benchmark</option>
                        </select>
                        <p className="text-[10px] text-text-tertiary leading-tight">{inp.description}</p>
                      </div>
                    );
                  }

                  return (
                    <div key={inp.key} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-text-primary">{inp.label}</span>
                        <span className="font-mono font-bold text-primary">
                          {val} {inp.unit}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={inp.min}
                        max={inp.max}
                        step={inp.step}
                        value={val}
                        onChange={(e) =>
                          setParams((prev) => ({
                            ...prev,
                            [inp.key]: parseFloat(e.target.value),
                          }))
                        }
                        className="w-full accent-primary h-1.5 rounded-lg bg-surface cursor-pointer"
                      />
                      <p className="text-[10px] text-text-tertiary leading-tight">{inp.description}</p>
                    </div>
                  );
                })}
              </div>

              {/* Missing Inputs & Quality Stress Testing */}
              <div className="pt-2 border-t border-divider space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary block font-mono">
                  Data Contract Quality Testing
                </span>
                <label className="flex items-center gap-2 cursor-pointer bg-surface p-2 rounded-xl border border-divider">
                  <input
                    type="checkbox"
                    checked={simulateMissingInputs}
                    onChange={(e) => setSimulateMissingInputs(e.target.checked)}
                    className="rounded accent-amber-500"
                  />
                  <div className="text-[11px] leading-tight">
                    <span className="font-bold text-text-primary block">Simulate Missing Sensor Inputs</span>
                    <span className="text-[10px] text-text-tertiary">
                      Tests fallback handling and transparent PARTIALLY_CALIBRATED reporting.
                    </span>
                  </div>
                </label>
              </div>

              {/* Representation Mode Selector */}
              <div className="pt-2 border-t border-divider space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary block font-mono">
                    Representation Mode
                  </span>
                  <span className="text-[9px] font-mono text-primary font-bold">
                    {surfaceMode === "isoband" ? "Continuous Grid" : surfaceMode === "choropleth" ? "Admin Choropleth" : "Dual Hybrid"}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1 p-1 bg-surface rounded-xl border border-divider text-[10px]">
                  <button
                    type="button"
                    onClick={() => setSurfaceMode("isoband")}
                    className={`py-1.5 px-2 rounded-lg font-bold transition-all text-center ${
                      surfaceMode === "isoband"
                        ? "bg-card text-primary shadow-xs"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                    title="Interpolated continuous hazard surface (0.01° grid)"
                  >
                    Isobands
                  </button>
                  <button
                    type="button"
                    onClick={() => setSurfaceMode("choropleth")}
                    className={`py-1.5 px-2 rounded-lg font-bold transition-all text-center ${
                      surfaceMode === "choropleth"
                        ? "bg-card text-primary shadow-xs"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                    title="Discrete administrative ward choropleth polygons"
                  >
                    Choropleth
                  </button>
                  <button
                    type="button"
                    onClick={() => setSurfaceMode("hybrid")}
                    className={`py-1.5 px-2 rounded-lg font-bold transition-all text-center ${
                      surfaceMode === "hybrid"
                        ? "bg-card text-primary shadow-xs"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                    title="Dual continuous surface with translucent ward fills"
                  >
                    Hybrid
                  </button>
                </div>
                <p className="text-[9px] text-text-tertiary leading-tight">
                  {surfaceMode === "isoband" && "Continuous raster grid: Displays interpolated spatial variation across Greater Mumbai."}
                  {surfaceMode === "choropleth" && "Administrative ward fills: Displays discrete municipal triage ranking per 24 BMC wards."}
                  {surfaceMode === "hybrid" && "Hybrid: Continuous environmental gradient overlaid with translucent administrative severity fills."}
                </p>
              </div>

              {/* Layer Toggles */}
              <div className="pt-2 border-t border-divider space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary block font-mono">
                  Map Spatial Layers
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showSurface}
                      onChange={(e) => setShowSurface(e.target.checked)}
                      className="rounded accent-primary"
                    />
                    <span>Hazard Surface</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showWards}
                      onChange={(e) => setShowWards(e.target.checked)}
                      className="rounded accent-primary"
                    />
                    <span>BMC Wards</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showZones}
                      onChange={(e) => setShowZones(e.target.checked)}
                      className="rounded accent-purple-600"
                    />
                    <span>BMC Zones (I–VII)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showRivers}
                      onChange={(e) => setShowRivers(e.target.checked)}
                      className="rounded accent-primary"
                    />
                    <span>Rivers & Nullahs</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showHotspots}
                      onChange={(e) => setShowHotspots(e.target.checked)}
                      className="rounded accent-primary"
                    />
                    <span>Hotspots (35)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showPumps}
                      onChange={(e) => setShowPumps(e.target.checked)}
                      className="rounded accent-primary"
                    />
                    <span>Pumps (41)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showRoads}
                      onChange={(e) => setShowRoads(e.target.checked)}
                      className="rounded accent-amber-500"
                    />
                    <span>Arterial Roads (78)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showDepressions}
                      onChange={(e) => setShowDepressions(e.target.checked)}
                      className="rounded accent-cyan-500"
                    />
                    <span>DEM Saucers (15)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer col-span-2">
                    <input
                      type="checkbox"
                      checked={showHospitals}
                      onChange={(e) => setShowHospitals(e.target.checked)}
                      className="rounded accent-rose-500"
                    />
                    <span>Emergency Hospitals (20)</span>
                  </label>
                </div>

                {/* Focus Filter Toggle */}
                <label className="flex items-center gap-2 cursor-pointer bg-surface/80 p-2 rounded-xl border border-divider mt-2">
                  <input
                    type="checkbox"
                    checked={filterToSelectedWard}
                    onChange={(e) => setFilterToSelectedWard(e.target.checked)}
                    className="rounded accent-primary"
                  />
                  <div className="text-[11px] leading-tight">
                    <span className="font-bold text-text-primary block">Focus Markers on Ward {selectedWardId}</span>
                    <span className="text-[10px] text-text-tertiary">
                      Declutter map by filtering hotspots and pumps exclusively to the inspected ward.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Quick Actions Footer */}
            <div className="p-3 border-t border-divider bg-surface/50 flex items-center justify-between">
              <button
                onClick={handleExportCSV}
                className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-surface border border-divider hover:bg-surface-elevated text-text-primary flex items-center justify-center gap-2 transition-all shadow-xs"
              >
                <DownloadIcon size={14} />
                <span>Export Dossier (CSV)</span>
              </button>
            </div>
          </aside>
        )}

        {/* ─── RIGHT COLLAPSIBLE DRAWER: WARD IMPACT & INSPECTION ── */}
        {drawerOpen && (
          <aside className="absolute top-4 right-4 w-[calc(100%-32px)] md:w-92 max-h-[calc(100%-80px)] bg-white/98 dark:bg-slate-900/98 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col z-10 transition-all">
            {/* Drawer Tabs */}
            <div className="flex items-center border-b border-divider text-xs">
              <button
                onClick={() => setRightPanelTab("ward_detail")}
                className={`flex-1 py-3 font-bold text-center border-b-2 transition-colors ${
                  rightPanelTab === "ward_detail"
                    ? "border-primary text-primary bg-primary/5"
                    : "border-transparent text-text-secondary hover:text-text-primary"
                }`}
              >
                Ward Detail
              </button>
              <button
                onClick={() => setRightPanelTab("ranked")}
                className={`flex-1 py-3 font-bold text-center border-b-2 transition-colors ${
                  rightPanelTab === "ranked"
                    ? "border-primary text-primary bg-primary/5"
                    : "border-transparent text-text-secondary hover:text-text-primary"
                }`}
              >
                Ranked ({simResult?.rankedWards?.length || 24})
              </button>
              <button
                onClick={() => setRightPanelTab("model_meta")}
                className={`flex-1 py-3 font-bold text-center border-b-2 transition-colors ${
                  rightPanelTab === "model_meta"
                    ? "border-primary text-primary bg-primary/5"
                    : "border-transparent text-text-secondary hover:text-text-primary"
                }`}
              >
                Formulas
              </button>
              <button
                onClick={() => setDrawerOpen(false)}
                className="px-3 text-text-tertiary hover:text-text-primary text-xs"
              >
                ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto scrollbar-none flex-1 space-y-4 text-xs">
              {/* TAB 1: SELECTED WARD DEEP DIVE */}
              {rightPanelTab === "ward_detail" && selectedWardRecord && (
                <div className="space-y-4">
                  {/* Executive Report Studio Concise Card */}
                  <div className={`p-3.5 rounded-2xl border space-y-2.5 transition-colors ${
                    playback.isStale
                      ? "border-amber-500/30 bg-amber-500/5"
                      : "border-primary/20 bg-primary/5"
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary block font-mono">
                          Executive Scenario Dossier
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-text-primary">
                            Full 7-Section Report (T={playback.simResult?.timeStepHours ?? playback.timeStep}h)
                          </span>
                        </div>
                      </div>
                      {playback.isStale ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1">
                          <AlertTriangleIcon size={10} /> OUTDATED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> SYNCED
                        </span>
                      )}
                    </div>
                    {playback.isStale ? (
                      <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-snug">
                        ⚠️ Inputs or timeline advanced (now at T={playback.timeStep}h). Report reflects T={playback.simResult?.timeStepHours}h.
                      </p>
                    ) : (
                      <p className="text-[11px] text-text-secondary leading-snug">
                        View dedicated full-width intelligence with demographic exposure, critical assets, and municipal action directives.
                      </p>
                    )}
                    <div className="flex items-center gap-2 pt-1">
                      <Link
                        href={reportUrl}
                        className="flex-1 py-1.5 px-3 rounded-xl bg-primary text-primary-foreground font-bold text-xs text-center hover:bg-primary/90 transition-colors shadow-xs cursor-pointer inline-block"
                        title="Navigate to full-width dedicated Report Studio workspace"
                      >
                        Open Full Report Studio ↗
                      </Link>
                      <button
                        onClick={() => setIsDossierModalOpen(true)}
                        className="py-1.5 px-2.5 rounded-xl border border-divider bg-surface hover:bg-surface-elevated text-text-secondary font-bold text-xs transition-colors cursor-pointer"
                        title="Quick Preview Overlay"
                      >
                        Quick Modal
                      </button>
                    </div>
                  </div>

                  {/* Quick Ward Selector Dropdown */}
                  <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-surface border border-divider">
                    <span className="text-[10px] font-bold text-text-secondary uppercase">Ward Select:</span>
                    <select
                      value={canonicalWardId(selectedWardId, "mumbai")}
                      onChange={(e) => handleSelectWard(e.target.value, true)}
                      className="px-2.5 py-1.5 rounded-lg border border-divider bg-card text-text-primary text-xs font-bold focus:outline-hidden cursor-pointer"
                    >
                      {Object.values(MUMBAI_CANONICAL_WARDS).map((w) => (
                        <option key={w.id} value={w.id}>
                          Ward {w.id} ({w.shortCode}) — {w.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Ward Header with Locate Map Trigger */}
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-primary/10 text-primary border border-primary/20">
                        BMC WARD {selectedWardRecord.wardId} • {selectedWardRecord.zoneCode}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleSelectWard(selectedWardRecord.wardId, true)}
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-surface border border-divider hover:bg-surface-elevated text-text-secondary hover:text-text-primary transition-colors cursor-pointer flex items-center gap-1"
                          title="Center and fit map to this ward's polygon boundaries"
                        >
                          <MapPinIcon size={11} className="text-primary" />
                          <span>Locate</span>
                        </button>
                        <span
                          className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono text-white"
                          style={{ backgroundColor: selectedWardRecord.severityColor }}
                        >
                          {selectedWardRecord.tierLabel}
                        </span>
                      </div>
                    </div>
                    <h3 className="text-base font-black text-text-primary mt-1">
                      {selectedWardRecord.wardName}
                    </h3>
                    <p className="text-[11px] text-text-tertiary mt-0.5">
                      Drainage: {selectedWardRecord.drainageBasin} • Elevation: ~{selectedWardRecord.elevationMeanM}m ASL • {selectedWardRecord.isCoastal ? "🌊 Coastal Outfall" : "🏔️ Inland Basin"}
                    </p>
                  </div>

                  {/* Impact Metric Gauge Box */}
                  <div className="p-4 rounded-2xl border border-divider bg-surface space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                      {selectedWardRecord.metricLabel} (T={timeStep}h)
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black font-mono text-text-primary">
                        {selectedWardRecord.metricValue}
                      </span>
                      <span className="text-xs text-text-tertiary font-bold">{selectedWardRecord.metricUnit}</span>
                      <span className="text-xs font-mono font-bold text-red-500 ml-auto">
                        +{selectedWardRecord.deltaPercent}% vs baseline
                      </span>
                    </div>

                    {selectedWardRecord.isThresholdExceeded && (
                      <p className="text-[10px] text-red-600 dark:text-red-400 font-semibold flex items-center gap-1 pt-1 border-t border-divider">
                        ⚠️ Threshold Exceeded: {selectedWardRecord.thresholdSource}
                      </p>
                    )}
                  </div>

                  {/* Demographic Exposure Estimation */}
                  <div className="p-3.5 rounded-2xl border border-divider bg-surface space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                        Demographic Exposure Breakdown
                      </span>
                      <span className="text-[9px] font-mono font-bold text-primary">2011 Census / 2026 Proj</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
                      <div className="p-2 rounded-xl bg-card border border-divider">
                        <span className="text-text-secondary block text-[9px] font-mono">1. Total Ward Pop:</span>
                        <span className="text-xs font-mono font-black text-text-primary">
                          {selectedWardRecord.populationEst.toLocaleString()}
                        </span>
                        <span className="text-[9px] text-text-tertiary block mt-0.5">BMC Census 2011 Baseline</span>
                      </div>
                      <div className="p-2 rounded-xl bg-card border border-divider">
                        <span className="text-text-secondary block text-[9px] font-mono">2. Screening Zone Pop:</span>
                        <span className="text-xs font-mono font-black text-amber-600 dark:text-amber-400">
                          ~{(selectedWardRecord.exposureBreakdown?.insideScreeningZoneEst ?? selectedWardRecord.populationEst).toLocaleString()}
                        </span>
                        <span className="text-[9px] text-text-tertiary block mt-0.5">Municipal Advisory Area</span>
                      </div>
                      <div className="p-2 rounded-xl bg-card border border-divider">
                        <span className="text-text-secondary block text-[9px] font-mono">3. In DEM Saucer Sinks:</span>
                        <span className="text-xs font-mono font-black text-rose-600 dark:text-rose-400">
                          ~{(selectedWardRecord.exposureBreakdown?.intersectsDepressionZoneEst ?? selectedWardRecord.estimatedExposedPopulation).toLocaleString()}
                        </span>
                        <span className="text-[9px] text-text-tertiary block mt-0.5">Areal Depression Weight</span>
                      </div>
                      <div className="p-2 rounded-xl bg-card border border-divider">
                        <span className="text-text-secondary block text-[9px] font-mono">4. Confirmed Affected:</span>
                        <span className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400">
                          0 (Unconfirmed)
                        </span>
                        <span className="text-[9px] text-text-tertiary block mt-0.5">Requires Ground Recon</span>
                      </div>
                    </div>

                    <p className="text-[9px] text-text-tertiary italic leading-normal pt-1 border-t border-divider">
                      Method: {selectedWardRecord.populationExposureMethod}
                    </p>
                  </div>

                  {/* Terrain & Digital Elevation Profile (Copernicus DEM GLO-30) */}
                  <div className="p-3.5 rounded-2xl border border-divider bg-surface space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                        Terrain & Elevation Profile
                      </span>
                      <span className="text-[9px] font-mono text-cyan-600 dark:text-cyan-400 font-bold">
                        Copernicus GLO-30 DEM
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 text-[10px] pt-1">
                      <div className="p-2 rounded-xl bg-card border border-divider text-center">
                        <span className="text-[9px] text-text-tertiary block font-mono">Min Elev</span>
                        <span className="text-xs font-mono font-black text-text-primary">
                          {selectedWardRecord.terrainSummary?.elevationMinM ?? "3.5"}m
                        </span>
                        <span className="text-[8px] text-text-tertiary block">ASL (EGM2008)</span>
                      </div>
                      <div className="p-2 rounded-xl bg-card border border-divider text-center">
                        <span className="text-[9px] text-text-tertiary block font-mono">Mean Elev</span>
                        <span className="text-xs font-mono font-black text-text-primary">
                          ~{selectedWardRecord.elevationMeanM}m
                        </span>
                        <span className="text-[8px] text-text-tertiary block">Ward Average</span>
                      </div>
                      <div className="p-2 rounded-xl bg-card border border-divider text-center">
                        <span className="text-[9px] text-text-tertiary block font-mono">Max Relief</span>
                        <span className="text-xs font-mono font-black text-text-primary">
                          {selectedWardRecord.terrainSummary?.elevationMaxM ?? "18.0"}m
                        </span>
                        <span className="text-[8px] text-text-tertiary block">Peak Ridge</span>
                      </div>
                    </div>

                    <div className="space-y-1 text-[10px] text-text-secondary pt-1 border-t border-divider">
                      <div className="flex items-center justify-between">
                        <span>Average Surface Slope:</span>
                        <span className="font-mono font-bold text-text-primary">
                          {selectedWardRecord.terrainSummary?.slopeMeanDeg ?? 1.2}° ({selectedWardRecord.terrainSummary?.slopeMeanDeg && selectedWardRecord.terrainSummary.slopeMeanDeg > 4 ? "Steep Runoff" : "Low Conveyance"})
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Topographic Wetness Index (TWI):</span>
                        <span className="font-mono font-bold text-text-primary">
                          {selectedWardRecord.terrainSummary?.topographicWetnessIndex ?? 12.0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Saucer Depression Basins:</span>
                        <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                          {selectedWardRecord.terrainSummary?.saucerSinksCount ?? selectedWardRecord.lowLyingDepressions?.length ?? 0} mapped
                        </span>
                      </div>
                    </div>

                    <div className="p-2 rounded-xl bg-surface-elevated text-[9px] text-text-tertiary border border-divider leading-relaxed">
                      ℹ️ <strong>30m DEM Scientific Disclosure:</strong> Copernicus 30m DEM provides macro-basin topography and gravitational pooling screening. It is NOT survey-grade street-level LiDAR and cannot independently predict curb-scale ponding without micro-catchment inlet connectivity.
                    </div>
                  </div>

                  {/* Exact Mathematical Calculation Trace */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary block font-mono">
                      Mathematical Formulation Trace
                    </span>
                    <div className="p-3 rounded-xl border border-divider bg-surface font-mono text-[10px] text-text-primary leading-relaxed break-words whitespace-pre-wrap overflow-x-auto select-text">
                      {selectedWardRecord.calculationTrace}
                    </div>
                  </div>

                  {/* Disaggregated Variables: Physical Inputs, Terrain, Historical Evidence, Assumptions */}
                  {selectedWardRecord.disaggregatedVariables && (
                    <div className="p-3.5 rounded-2xl border border-divider bg-surface space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                          Variable Disaggregation (Traceability)
                        </span>
                        <span className="text-[9px] font-mono text-primary font-bold">Audit Separation</span>
                      </div>

                      {/* 1. Physical / Environmental Inputs */}
                      <div className="space-y-1 text-[10px] border-t border-divider pt-1.5">
                        <span className="font-bold text-text-secondary block font-mono">1. Physical / Environmental Inputs:</span>
                        <div className="grid grid-cols-2 gap-1 text-text-primary pl-2">
                          {selectedWardRecord.disaggregatedVariables.physicalInputs.precipitationRateMmH !== undefined && (
                            <div>Rain Rate: <span className="font-mono font-bold">{selectedWardRecord.disaggregatedVariables.physicalInputs.precipitationRateMmH} mm/h</span></div>
                          )}
                          {selectedWardRecord.disaggregatedVariables.physicalInputs.accumulatedPrecipMm !== undefined && (
                            <div>Accumulated: <span className="font-mono font-bold">{selectedWardRecord.disaggregatedVariables.physicalInputs.accumulatedPrecipMm} mm</span></div>
                          )}
                          {selectedWardRecord.disaggregatedVariables.physicalInputs.astronomicalTideM !== undefined && (
                            <div>Tide Level: <span className="font-mono font-bold">{selectedWardRecord.disaggregatedVariables.physicalInputs.astronomicalTideM}m CD</span></div>
                          )}
                          {selectedWardRecord.disaggregatedVariables.physicalInputs.gravityOutfallEfficiencyPct !== undefined && (
                            <div>Gravity Efficiency: <span className="font-mono font-bold">{selectedWardRecord.disaggregatedVariables.physicalInputs.gravityOutfallEfficiencyPct}%</span></div>
                          )}
                          {selectedWardRecord.disaggregatedVariables.physicalInputs.instantaneousRunoffMmH !== undefined && (
                            <div>Runoff Generated: <span className="font-mono font-bold">{selectedWardRecord.disaggregatedVariables.physicalInputs.instantaneousRunoffMmH} mm/h</span></div>
                          )}
                          {selectedWardRecord.disaggregatedVariables.physicalInputs.netRunoffExcessMmH !== undefined && (
                            <div>Net Excess: <span className="font-mono font-bold text-red-600 dark:text-red-400">{selectedWardRecord.disaggregatedVariables.physicalInputs.netRunoffExcessMmH} mm/h</span></div>
                          )}
                          {selectedWardRecord.disaggregatedVariables.physicalInputs.isSluiceGateLockedOut !== undefined && (
                            <div className="col-span-2 text-[9px] font-bold font-mono">
                              Sluice State: <span className={selectedWardRecord.disaggregatedVariables.physicalInputs.isSluiceGateLockedOut ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}>
                                {selectedWardRecord.disaggregatedVariables.physicalInputs.isSluiceGateLockedOut ? "LOCKED OUT (Tide >= 4.5m)" : "OPEN (Gravity Outflow)"}
                              </span>
                            </div>
                          )}
                          {selectedWardRecord.disaggregatedVariables.physicalInputs.ambientTempC !== undefined && (
                            <div>Ambient Temp: <span className="font-mono font-bold">{selectedWardRecord.disaggregatedVariables.physicalInputs.ambientTempC}°C</span></div>
                          )}
                          {selectedWardRecord.disaggregatedVariables.physicalInputs.windGustKmH !== undefined && (
                            <div>Wind Gust: <span className="font-mono font-bold">{selectedWardRecord.disaggregatedVariables.physicalInputs.windGustKmH} km/h</span></div>
                          )}
                          {selectedWardRecord.disaggregatedVariables.physicalInputs.pm25Baseline !== undefined && (
                            <div>PM2.5: <span className="font-mono font-bold">{selectedWardRecord.disaggregatedVariables.physicalInputs.pm25Baseline} µg/m³</span></div>
                          )}
                        </div>
                      </div>

                      {/* 2. Spatial Terrain Characteristics */}
                      <div className="space-y-1 text-[10px] border-t border-divider pt-1.5">
                        <span className="font-bold text-text-secondary block font-mono">2. Spatial Terrain (Copernicus DEM & ESA WorldCover):</span>
                        <div className="grid grid-cols-2 gap-1 text-text-primary pl-2">
                          <div>Mean Elev: <span className="font-mono font-bold">{selectedWardRecord.disaggregatedVariables.spatialCharacteristics.elevationMeanM}m ASL</span></div>
                          {selectedWardRecord.disaggregatedVariables.spatialCharacteristics.elevationMinM !== undefined && (
                            <div>Min Elev: <span className="font-mono font-bold">{selectedWardRecord.disaggregatedVariables.spatialCharacteristics.elevationMinM}m ASL</span></div>
                          )}
                          {selectedWardRecord.disaggregatedVariables.spatialCharacteristics.slopeMeanDeg !== undefined && (
                            <div>Slope: <span className="font-mono font-bold">{selectedWardRecord.disaggregatedVariables.spatialCharacteristics.slopeMeanDeg}°</span></div>
                          )}
                          {selectedWardRecord.disaggregatedVariables.spatialCharacteristics.topographicWetnessIndex !== undefined && (
                            <div>TWI: <span className="font-mono font-bold">{selectedWardRecord.disaggregatedVariables.spatialCharacteristics.topographicWetnessIndex}</span></div>
                          )}
                          {selectedWardRecord.disaggregatedVariables.spatialCharacteristics.imperviousFraction !== undefined && (
                            <div>Impervious: <span className="font-mono font-bold">{Math.round(selectedWardRecord.disaggregatedVariables.spatialCharacteristics.imperviousFraction * 100)}%</span></div>
                          )}
                          {selectedWardRecord.disaggregatedVariables.spatialCharacteristics.nominalDrainCapacityMmH !== undefined && (
                            <div>Nominal Cap: <span className="font-mono font-bold">{selectedWardRecord.disaggregatedVariables.spatialCharacteristics.nominalDrainCapacityMmH} mm/h</span></div>
                          )}
                          <div>DEM Saucer Sink: <span className="font-mono font-bold">{selectedWardRecord.disaggregatedVariables.spatialCharacteristics.isSaucerDepression ? "Verified Saucer Basin" : "Normal Relief"}</span></div>
                          <div>Mithi Basin: <span className="font-mono font-bold">{selectedWardRecord.disaggregatedVariables.spatialCharacteristics.hasMithiCorridor ? "Direct Riparian" : "Secondary Basin"}</span></div>
                          {selectedWardRecord.disaggregatedVariables.spatialCharacteristics.terrainClassification && (
                            <div className="col-span-2 text-[9px] text-text-tertiary italic">
                              Class: {selectedWardRecord.disaggregatedVariables.spatialCharacteristics.terrainClassification}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 3. Historical Incident Evidence */}
                      <div className="space-y-1 text-[10px] border-t border-divider pt-1.5">
                        <span className="font-bold text-text-secondary block font-mono">3. Historical Incident Evidence:</span>
                        <div className="text-text-primary pl-2 space-y-0.5">
                          <div>Chronic Hotspots: <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{selectedWardRecord.disaggregatedVariables.historicalEvidence.chronicHotspotCount} documented points</span></div>
                          {selectedWardRecord.disaggregatedVariables.historicalEvidence.historicalDepth2005M && (
                            <div className="text-[9px] text-text-tertiary">2005 Reference: {selectedWardRecord.disaggregatedVariables.historicalEvidence.historicalDepth2005M}</div>
                          )}
                        </div>
                      </div>

                      {/* 4. Model Assumptions & Engineering Constants */}
                      <div className="space-y-1 text-[10px] border-t border-divider pt-1.5">
                        <span className="font-bold text-text-secondary block font-mono">4. Parameters & Assumptions:</span>
                        <div className="text-text-primary pl-2 space-y-0.5">
                          <div>Drainage Blockage: <span className="font-mono font-bold">{selectedWardRecord.disaggregatedVariables.hypotheticalParameters.drainageBlockagePct ?? 0}%</span></div>
                          <div>Simulated Horizon: <span className="font-mono font-bold">{selectedWardRecord.disaggregatedVariables.hypotheticalParameters.simulatedDurationHours}h</span></div>
                          <ul className="list-disc pl-3 text-[9px] text-text-tertiary leading-tight pt-1">
                            {selectedWardRecord.disaggregatedVariables.modelAssumptions.map((ass, i) => (
                              <li key={i}>{ass}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Scientific Disclaimer */}
                      <div className="p-2 rounded-xl bg-surface-elevated text-[9px] text-text-tertiary border border-divider leading-relaxed">
                        ℹ️ <strong>Administrative Screening Disclaimer:</strong> {selectedWardRecord.disaggregatedVariables.screeningScoreVsInundationDisclaimer}
                      </div>
                    </div>
                  )}

                  {/* Intersecting Recurring Hotspots & Pumping Stations */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase text-text-secondary tracking-wider">
                        Municipal Hotspots & Drainage
                      </span>
                      <span className="text-[10px] font-mono text-primary font-bold">
                        Pumps: {selectedWardRecord.pumpingStations.length}
                      </span>
                    </div>
                    {selectedWardRecord.intersectingHotspots.length > 0 ? (
                      <div className="space-y-1">
                        {selectedWardRecord.intersectingHotspots.map((hs, i) => (
                          <div
                            key={i}
                            className="p-2 rounded-xl border border-divider bg-surface/50 text-[11px] flex items-center gap-2"
                          >
                            <span className="text-red-500 text-xs">🚨</span>
                            <span className="font-semibold text-text-primary">{hs}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-text-tertiary italic">No major recurrent hotspots in this ward.</p>
                    )}
                  </div>

                  {/* Mapped Critical Infrastructure Assets */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase text-text-secondary tracking-wider">
                        Mapped Infrastructure Assets
                      </span>
                      <span className="text-[10px] font-mono text-primary font-bold">
                        {(selectedWardRecord.potentiallyExposedHospitals?.length || 0) + (selectedWardRecord.potentiallyExposedRoads?.length || 0)} mapped
                      </span>
                    </div>

                    {/* Emergency Hospitals */}
                    {selectedWardRecord.potentiallyExposedHospitals && selectedWardRecord.potentiallyExposedHospitals.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-text-tertiary block font-mono">Emergency Hospitals (Screening Zone):</span>
                        {selectedWardRecord.potentiallyExposedHospitals.map((h, i) => (
                          <div key={i} className="p-2 rounded-xl border border-rose-500/20 bg-rose-500/5 text-[11px] space-y-0.5">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-rose-700 dark:text-rose-300">🏥 {h.name}</span>
                              <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-600 border border-rose-500/20">
                                {h.relationship.replace(/_/g, " ")}
                              </span>
                            </div>
                            <p className="text-[10px] text-text-tertiary">{h.type} • {h.address || "Greater Mumbai"}</p>
                            <p className="text-[9px] text-text-tertiary italic">Proximity result: Facility inside screening zone; does not confirm physical damage or closure.</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Arterial Corridors */}
                    {selectedWardRecord.potentiallyExposedRoads && selectedWardRecord.potentiallyExposedRoads.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-text-tertiary block font-mono">Arterial Road Corridors ({selectedWardRecord.potentiallyExposedRoads.length}):</span>
                        <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                          {selectedWardRecord.potentiallyExposedRoads.map((r, i) => (
                            <div key={i} className="p-2 rounded-xl border border-divider bg-surface text-[10px] flex items-center justify-between">
                              <div>
                                <span className="font-bold text-text-primary block">🛣️ {r.name}</span>
                                <span className="text-[9px] text-text-tertiary font-mono">{r.highwayType} • {r.lanes} lanes • {r.lengthM ? `~${Math.round(r.lengthM / 100) / 10} km` : "Corridor"}</span>
                              </div>
                              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border bg-amber-500/10 text-amber-600 border-amber-500/20">
                                SCREENING CORRIDOR
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Copernicus DEM Depressions */}
                    {selectedWardRecord.lowLyingDepressions && selectedWardRecord.lowLyingDepressions.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-text-tertiary block font-mono">Copernicus DEM Saucer Sinks:</span>
                        {selectedWardRecord.lowLyingDepressions.map((d, i) => (
                          <div key={i} className="p-2 rounded-xl border border-cyan-500/20 bg-cyan-500/5 text-[10px] flex items-center justify-between">
                            <div>
                              <span className="font-bold text-cyan-700 dark:text-cyan-300">🔻 {d.name}</span>
                              <span className="text-[9px] text-text-tertiary block font-mono">Source: {d.source} • Area: ~{Math.round(d.areaSqM / 1000) / 1000} km²</span>
                            </div>
                            <span className="text-[9px] font-mono font-bold text-cyan-600">{d.elevationMeanM}m Mean ASL</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Recommended Municipal Action & Evidence */}
                  <div className="p-3.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 space-y-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1">
                      🚨 Recommended Municipal Action
                    </span>
                    <p className="text-xs font-semibold text-amber-900 dark:text-amber-200 leading-relaxed">
                      {selectedWardRecord.recommendedAction}
                    </p>
                    <p className="text-[10px] text-amber-800 dark:text-amber-300 italic pt-1 border-t border-amber-500/20">
                      Basis: Sluice gate lockout and low-lying topography backflow.
                    </p>
                  </div>

                  {/* Operational Action Handlers */}
                  <div className="space-y-2 pt-2 border-t border-divider">
                    <Link
                      id="btn-open-ward-report-studio"
                      href={wardReportUrl}
                      className="w-full py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-1.5 transition-all shadow-xs"
                      title="Open full-width persistent Report Studio focused on this ward dossier"
                    >
                      <span className="text-sm">📄</span>
                      <span>Open Full Report Studio (Ward {selectedWardRecord.wardId}) ↗</span>
                    </Link>
                    <button
                      onClick={() => handleDraftAdvisory(selectedWardRecord)}
                      className="w-full py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-xs"
                    >
                      Draft Precautionary Advisory
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        href={`/admin/incidents?ward=${selectedWardRecord.wardId}`}
                        className="py-2 rounded-xl text-xs font-bold border border-divider bg-surface hover:bg-surface-elevated text-text-secondary text-center transition-all"
                      >
                        Incident Desk
                      </Link>
                      <button
                        onClick={() => handleExportWardJSON(selectedWardRecord)}
                        className="py-2 rounded-xl text-xs font-bold border border-divider bg-surface hover:bg-surface-elevated text-text-secondary transition-all"
                      >
                        Export JSON
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: RANKED WARDS LIST */}
              {rightPanelTab === "ranked" && simResult && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-text-tertiary mb-1">
                    <span>Ranked by severity at T={playback.timeStep.toFixed(1)}h</span>
                    <span>24 Canonical Wards</span>
                  </div>
                  {simResult.rankedWards.map((w, idx) => (
                    <div
                      key={w.wardId}
                      onClick={() => {
                        handleSelectWard(w.wardId, true);
                        setRightPanelTab("ward_detail");
                      }}
                      className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        isMatchingWard(selectedWardId, w.wardId, "mumbai")
                          ? "border-primary bg-primary/10 shadow-xs"
                          : "border-divider bg-surface hover:bg-surface-elevated"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-surface-elevated text-[10px] font-mono font-bold flex items-center justify-center text-text-secondary">
                          {idx + 1}
                        </span>
                        <div>
                          <span className="font-bold text-xs text-text-primary block leading-tight">
                            {w.wardName}
                          </span>
                          <span className="text-[10px] text-text-tertiary font-mono">
                            Ward {w.wardId} • Zone {w.zoneCode} • ~{w.elevationMeanM}m
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-mono font-black text-text-primary block">
                          {w.metricValue} {w.metricUnit.split(" ")[0]}
                        </span>
                        <span
                          className="px-1.5 py-0.2 rounded text-[9px] font-bold text-white inline-block mt-0.5"
                          style={{ backgroundColor: w.severityColor }}
                        >
                          {w.tierLabel.split(" ")[0]}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 3: SCIENTIFIC MODEL METADATA & DISCLAIMERS */}
              {rightPanelTab === "model_meta" && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary font-mono">
                      Mathematical Formulation
                    </span>
                    <div className="p-3 rounded-xl border border-divider bg-surface font-mono text-[11px] text-text-primary overflow-x-auto leading-relaxed">
                      {activeScenario.scientificFormula}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary font-mono">
                      Model Assumptions
                    </span>
                    <ul className="list-disc pl-4 space-y-1 text-[11px] text-text-secondary leading-relaxed">
                      {activeScenario.assumptions.map((as, i) => (
                        <li key={i}>{as}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3.5 rounded-2xl border border-red-500/20 bg-red-500/10 space-y-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-red-600 dark:text-red-400">
                      ⚠️ Scientific Limitation Disclaimer
                    </span>
                    <ul className="list-disc pl-4 space-y-1 text-[11px] text-red-800 dark:text-red-300 leading-relaxed">
                      {activeScenario.limitations.map((lim, i) => (
                        <li key={i}>{lim}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary font-mono">
                      Required Geographic Datasets
                    </span>
                    <div className="p-2 rounded-xl border border-divider bg-surface font-mono text-[10px] text-text-secondary space-y-1">
                      {activeScenario.requiredDatasets.map((ds, i) => (
                        <div key={i} className="truncate">
                          📁 {ds}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}

        {/* ─── CARTOGRAPHIC GIS HAZARD LEGEND (DESKTOP & MOBILE RESPONSIVE) ────────── */}
        {simResult && (
          <div
            className={`absolute bottom-20 ${
              controlsOpen ? "left-4 md:left-[22.5rem]" : "left-4"
            } bg-white/98 dark:bg-slate-900/98 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xl z-20 text-xs transition-all backdrop-blur-md overflow-hidden ${
              isLegendExpanded ? "max-w-xs p-3.5 space-y-2.5" : "p-2 max-w-[200px]"
            }`}
          >
            {/* Header with Metric Label, Unit and Collapse Toggle */}
            <div className="flex items-center justify-between gap-2 border-b border-divider pb-1.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2 h-2 rounded-full bg-primary shrink-0 animate-pulse" />
                <span className="font-bold text-text-primary text-[11px] truncate">
                  {simResult.continuousSurface?.variableLabel || "Hazard Assessment"}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-[10px] font-mono font-bold text-primary px-1.5 py-0.5 rounded bg-primary/10">
                  {simResult.continuousSurface?.unit || "Index"}
                </span>
                <button
                  type="button"
                  onClick={() => setIsLegendExpanded(!isLegendExpanded)}
                  className="w-5 h-5 flex items-center justify-center rounded hover:bg-surface-elevated text-text-secondary text-[11px] font-bold cursor-pointer transition-colors"
                  title={isLegendExpanded ? "Collapse Legend" : "Expand Legend"}
                >
                  {isLegendExpanded ? "−" : "+"}
                </button>
              </div>
            </div>

            {isLegendExpanded && (
              <>
                {/* Active Representation & Model Tier Subtitle */}
                <div className="flex items-center justify-between text-[9px] font-mono text-text-tertiary">
                  <span className="px-1.5 py-0.5 rounded bg-surface border border-divider">
                    Mode: {surfaceMode === "choropleth" ? "Admin Choropleth" : surfaceMode === "isoband" ? "Continuous Grid" : "Dual Hybrid"}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-surface border border-divider text-amber-600 dark:text-amber-400 font-bold">
                    {simResult.modelTier === "TIER_1_OBSERVED_FORECAST" ? "Tier 1: Observed" : "Tier 2: Screening"}
                  </span>
                </div>

                {/* Perceptually Ordered Color Ramp Tiers */}
                <div className="space-y-1">
                  {simResult.continuousSurface?.colorScale.map((tier, i) => (
                    <div key={i} className="flex items-center gap-2 text-[10px]">
                      <span
                        className="w-4 h-3 rounded-xs shrink-0 shadow-2xs border border-black/10"
                        style={{ backgroundColor: tier.color, opacity: Math.max(0.70, tier.fillOpacity) }}
                      />
                      <span className="text-text-secondary leading-tight truncate">{tier.label}</span>
                    </div>
                  ))}

                  {/* Explicit No-Data Swatch Distinct from Safe/Zero */}
                  <div className="flex items-center gap-2 text-[10px] pt-0.5">
                    <span
                      className="w-4 h-3 rounded-xs shrink-0 shadow-2xs border border-slate-400 border-dashed"
                      style={{ backgroundColor: "#94a3b8", opacity: 0.55 }}
                    />
                    <span className="text-slate-600 dark:text-slate-400 italic leading-tight">
                      No Data / Sensor Offline
                    </span>
                  </div>
                </div>

                {/* Calculation Provenance & Boundary Constraints */}
                <div className="pt-1.5 border-t border-divider space-y-0.5 text-[9px] text-text-tertiary font-mono">
                  <div className="flex items-center justify-between">
                    <span>Simulated: T={timeStep.toFixed(1)}h / {maxDuration}h</span>
                    <span>Mesh: 502 Cells (~1km)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>DEM: Copernicus 30m GLO-30</span>
                    <span>Datum: EGM2008 ASL</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>
                      {simResult.auditTrail?.executedAt
                        ? `Calc: ${new Date(simResult.auditTrail.executedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`
                        : "Calc: Dynamic"}
                    </span>
                    <span>Mask: BMC 24 Wards</span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ─── BOTTOM SCRUBBABLE TIMELINE BAR ─────────────────────── */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-11/12 max-w-2xl bg-white/98 dark:bg-slate-900/98 px-5 py-2.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xl z-10 flex flex-col gap-1.5 backdrop-blur-md">
          <div className="flex items-center justify-between text-[11px] font-mono text-text-secondary">
            <div className="flex items-center gap-2">
              <span className="font-bold text-text-primary flex items-center gap-1">
                <ClockIcon size={13} className="text-primary" />
                T = {timeStep.toFixed(1)}h / {maxDuration}h
              </span>
              {simResult?.temporalHydrology && (
                <span className="px-1.5 py-0.2 rounded bg-primary/10 text-primary text-[10px] font-bold">
                  {simResult.temporalHydrology.profileType === "constant_rate" ? "Constant Rate" :
                   simResult.temporalHydrology.profileType === "chicago_peak" ? "Chicago Peak Burst" :
                   simResult.temporalHydrology.profileType === "historical_burst_2005" ? "2005 Cloudburst" : "2024 Monsoon Burst"}
                </span>
              )}
            </div>

            {simResult?.temporalHydrology && (
              <div className="flex items-center gap-2 text-[10px]">
                <span title="Instantaneous Rainfall Rate" className="font-mono">🌧️ {simResult.temporalHydrology.instantaneousRainfallRateMmH} mm/h</span>
                <span className="text-text-tertiary">|</span>
                <span title="Rolling Accumulated Rainfall" className="font-mono">∑ {simResult.temporalHydrology.accumulatedRainfallMm} mm</span>
                <span className="text-text-tertiary">|</span>
                <span title="Astronomical Tide Level" className={`font-mono ${simResult.temporalHydrology.isSluiceLocked ? "text-red-500 font-bold" : "text-sky-600 dark:text-sky-400 font-bold"}`}>
                  🌊 {simResult.temporalHydrology.astronomicalTideM}m CD {simResult.temporalHydrology.isSluiceLocked ? "(LOCKED)" : "(OPEN)"}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-text-tertiary shrink-0">0h</span>
            <div className="flex-1 relative flex items-center">
              <input
                type="range"
                min={0}
                max={maxDuration}
                step={0.5}
                value={playback.timeStep}
                onChange={(e) => {
                  playback.scrub(parseFloat(e.target.value));
                }}
                className="w-full accent-primary h-2 rounded-lg bg-surface cursor-pointer z-10"
              />
            </div>
            <span className="text-[10px] font-mono text-text-tertiary shrink-0">{maxDuration}h</span>
          </div>
        </div>
      </div>

      {/* ─── FULL EXECUTIVE DOSSIER REPORT MODAL ─────────────────── */}
      {isDossierModalOpen && dossierSimOutput && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-5xl h-[92vh] bg-card rounded-3xl border border-divider shadow-2xl flex flex-col overflow-hidden">
            <div className="px-6 py-3.5 border-b border-divider flex items-center justify-between shrink-0 bg-surface">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  📄
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-black text-text-primary">
                      Multi-Hazard Simulation Executive Dossier
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-primary/10 text-primary border border-primary/20">
                      {dossierSimOutput.activeScenarioId} • T={dossierSimOutput.timeStepHours}h
                    </span>
                    {playback.isStale && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1">
                        <AlertTriangleIcon size={12} /> REPORT OUTDATED
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-tertiary">
                    Executive Dossier &amp; Municipal Decision-Support Intelligence (Sections A through G)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportCSV}
                  className="px-3 py-1.5 rounded-xl border border-divider bg-surface hover:bg-surface-elevated text-text-primary text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <DownloadIcon size={14} />
                  <span>Export CSV</span>
                </button>
                <button
                  onClick={() => setIsDossierModalOpen(false)}
                  className="w-8 h-8 rounded-xl border border-divider bg-surface hover:bg-surface-elevated text-text-secondary hover:text-text-primary flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <SimulationDossierPanel
                simOutput={dossierSimOutput}
                selectedWardId={selectedWardId}
                onSelectWard={(wId) => handleSelectWard(wId, true)}
                onHighlightWardOnMap={(wId) => {
                  handleSelectWard(wId, true);
                  setIsDossierModalOpen(false);
                  setRightPanelTab("ward_detail");
                  setDrawerOpen(true);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function SimulationMapWorkspace() {
  return (
    <Suspense
      fallback={
        <div className="w-full h-full flex flex-col items-center justify-center bg-card">
          <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm font-bold text-text-primary">Loading Spatial Simulation Canvas...</p>
        </div>
      }
    >
      <SimulationWorkspaceInner />
    </Suspense>
  );
}
