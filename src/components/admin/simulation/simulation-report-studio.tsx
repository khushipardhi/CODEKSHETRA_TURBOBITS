/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Dedicated Simulation Report Studio
   Phase 4 Enterprise Edition: Full-Width Executive Reporting & Ward Dossiers
   ════════════════════════════════════════════════════════ */

"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type {
  CanonicalSimulationDossier,
  MunicipalActionItem,
  DossierWardDetailedAnalysis,
} from "@/modules/dossier/contracts";
import {
  MUMBAI_CANONICAL_WARDS,
  canonicalWardId,
  isMatchingWard,
} from "@/modules/geo/canonical-gis";
import { MarkdownView } from "@/components/ui/markdown-view";

interface IconProps {
  size?: number;
  className?: string;
}

function ArrowLeftIcon({ size = 16, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function PrinterIcon({ size = 16, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  );
}

function DownloadIcon({ size = 16, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function AlertTriangleIcon({ size = 16, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function RefreshCwIcon({ size = 16, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
    </svg>
  );
}

function FileTextIcon({ size = 16, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function CheckIcon({ size = 16, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ShieldAlertIcon({ size = 16, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function ClockIcon({ size = 16, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

export interface DossierHistoryItem {
  dossierId: string;
  generatedAtIso: string;
  scenarioId: string;
  scenarioTitle: string;
  timeStepHours: number;
  overallAlertLevel: string;
  selectedWardId?: string;
  peakWardName: string;
  peakScore: number;
  overallAIState: string;
}

// 24 Canonical Mumbai BMC Administrative Wards
const CANONICAL_MUMBAI_WARDS = Object.values(MUMBAI_CANONICAL_WARDS).map((w) => ({
  id: w.id,
  shortCode: w.shortCode,
  name: w.name,
  zone: w.zoneCode,
}));

export function SimulationReportStudio() {
  const searchParams = useSearchParams();

  // Read URL query parameters
  const qScenario = searchParams?.get("scenario") || "rainfall_waterlogging";
  const qTime = searchParams?.get("t") ? parseFloat(searchParams.get("t")!) : 1.0;
  const qWard = canonicalWardId(searchParams?.get("ward") || "L", "mumbai");
  const qScope = (searchParams?.get("scope") as "citywide" | "ward_detail" | "comparative") || "citywide";
  const qBaseline = searchParams?.get("baseline") || "current_live";
  const qRainfallRate = searchParams?.get("rainfallRate");
  const qTide = searchParams?.get("astronomicalTide");
  const qSiltation = searchParams?.get("siltation");
  const qProfile = searchParams?.get("rainfallProfile");
  const qMissing = searchParams?.get("missing") === "1";
  const qDossierId = searchParams?.get("dossierId");

  // State management
  const [dossier, setDossier] = useState<CanonicalSimulationDossier | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWardId, setSelectedWardId] = useState<string>(qWard);
  const [comparisonWardId, setComparisonWardId] = useState<string>("F/N");
  const [reportScope, setReportScope] = useState<"citywide" | "ward_detail" | "comparative">(qScope);
  const [activeSection, setActiveSection] = useState<string>("sec-exec");
  const [isAdvisoryModalOpen, setIsAdvisoryModalOpen] = useState<boolean>(false);
  const [isAiAuditModalOpen, setIsAiAuditModalOpen] = useState<boolean>(false);
  const [copiedAdvisory, setCopiedAdvisory] = useState<boolean>(false);

  // History & Archive Drawer State
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [historyList, setHistoryList] = useState<DossierHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const [historySearch, setHistorySearch] = useState<string>("");

  // Report-Aware AI Q&A State
  const [isReportQaOpen, setIsReportQaOpen] = useState<boolean>(false);
  const [reportQaInput, setReportQaInput] = useState<string>("");
  const [reportQaLoading, setReportQaLoading] = useState<boolean>(false);
  const [reportQaMessages, setReportQaMessages] = useState<Array<{
    role: "user" | "assistant";
    content: string;
    timestamp: string;
    citedSections?: string[];
    citedSources?: string[];
    citedWards?: string[];
    roleAudit?: any;
  }>>([]);

  // Initialize Report QA greeting when dossier loads
  useEffect(() => {
    if (dossier) {
      setReportQaMessages([
        {
          role: "assistant",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          content: `Hello! I am your **Sentinel Report Assistant** for dossier **${dossier.dossierId}**.\n\nI have indexed the full **${dossier.executiveSummary?.scenarioTitle}** run (+${dossier.timeStepHours}h horizon) across all 24 wards, including Copernicus GLO-30 DEM depression sinks, pump capacities, and critical hospital assets.\n\n*What would you like to verify or investigate about this simulation?*`,
          citedSections: ["Executive Summary", "Ward Priority Rankings"],
        },
      ]);
    }
  }, [dossier?.dossierId]);

  const handleSendReportQa = async (queryText?: string) => {
    const text = (queryText || reportQaInput).trim();
    if (!text || !dossier || reportQaLoading) return;

    const userMsg = {
      role: "user" as const,
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setReportQaMessages((prev) => [...prev, userMsg]);
    setReportQaInput("");
    setReportQaLoading(true);

    try {
      const res = await fetch("/api/admin/simulation/report-qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dossierId: dossier.dossierId,
          dossier,
          question: text,
          selectedWard: selectedWardId,
          conversationHistory: reportQaMessages.slice(-4).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setReportQaMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: json.data.answer,
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              citedSections: json.data.citedSections,
              citedSources: json.data.citedSources,
              citedWards: json.data.citedWards,
              roleAudit: json.data.roleAudit,
            },
          ]);
        }
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch (err: any) {
      console.error("[ReportQA] Error:", err);
      setReportQaMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Unable to query Report QA reasoning service. Please check administrative connectivity.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setReportQaLoading(false);
    }
  };

  // Synchronize browser URL query parameters without triggering full reload
  const syncUrlWithState = (
    newDossierId?: string,
    newWardId?: string,
    newScope?: "citywide" | "ward_detail" | "comparative"
  ) => {
    if (typeof window === "undefined") return;
    try {
      const currentUrl = new URL(window.location.href);
      const targetDossierId = newDossierId || dossier?.dossierId || qDossierId;
      if (targetDossierId) {
        currentUrl.searchParams.set("dossierId", targetDossierId);
      }
      const targetWard = newWardId || selectedWardId;
      if (targetWard) {
        currentUrl.searchParams.set("ward", targetWard);
      }
      const targetScope = newScope || reportScope;
      if (targetScope) {
        currentUrl.searchParams.set("scope", targetScope);
      }
      window.history.replaceState(null, "", currentUrl.toString());
    } catch {
      // ignore
    }
  };

  // Construct parameter payload for generation
  const parametersApplied = useMemo(() => {
    const params: Record<string, number> = {};
    if (qRainfallRate && !isNaN(Number(qRainfallRate))) params.rainfallRateMmH = Number(qRainfallRate);
    if (qTide && !isNaN(Number(qTide))) params.astronomicalTideM = Number(qTide);
    if (qSiltation && !isNaN(Number(qSiltation))) params.drainageSiltationPct = Number(qSiltation);
    if (qProfile && !isNaN(Number(qProfile))) params.rainfallProfile = Number(qProfile);
    return params;
  }, [qRainfallRate, qTide, qSiltation, qProfile]);

  // Check if loaded dossier differs from active URL scenario parameters
  const isScenarioOutOfDate = useMemo(() => {
    if (!dossier) return false;
    if (dossier.scenarioId !== qScenario) return true;
    if (Math.abs(dossier.timeStepHours - qTime) > 0.01) return true;
    if (dossier.parametersApplied && parametersApplied) {
      for (const [k, v] of Object.entries(parametersApplied)) {
        if (dossier.parametersApplied[k] !== undefined && dossier.parametersApplied[k] !== v) {
          return true;
        }
      }
    }
    return false;
  }, [dossier, qScenario, qTime, parametersApplied]);

  // Load or generate dossier
  const loadOrGenerateDossier = async (forceRegenerate: boolean = false) => {
    setLoading(true);
    setError(null);
    try {
      if (qDossierId && !forceRegenerate) {
        const getRes = await fetch(`/api/admin/simulation/dossier?dossierId=${encodeURIComponent(qDossierId)}`);
        const getData = await getRes.json();
        if (getData.success && getData.dossier) {
          setDossier(getData.dossier);
          if (getData.dossier.selectedWardId && !searchParams?.get("ward")) {
            setSelectedWardId(getData.dossier.selectedWardId);
          }
          syncUrlWithState(getData.dossier.dossierId, selectedWardId, reportScope);
          setLoading(false);
          return;
        }
      }

      // Generate new dossier via API
      const res = await fetch("/api/admin/simulation/dossier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenarioId: qScenario,
          parametersApplied: Object.keys(parametersApplied).length > 0 ? parametersApplied : undefined,
          timeStepHours: qTime,
          selectedWardId,
          forceDeterministic: false,
        }),
      });

      const data = await res.json();
      if (data.success && data.dossier) {
        setDossier(data.dossier);
        syncUrlWithState(data.dossier.dossierId, selectedWardId, reportScope);
      } else {
        throw new Error(data.error || "Failed to compile simulation dossier");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrGenerateDossier(false);
  }, [qScenario, qTime, qDossierId]);

  // Handle explicit user ward selection with URL state preservation
  const handleSelectWard = (wardId: string) => {
    const canonical = canonicalWardId(wardId, "mumbai");
    setSelectedWardId(canonical);
    syncUrlWithState(dossier?.dossierId, canonical, reportScope);
  };

  // Handle report scope switcher with URL state preservation
  const handleSelectScope = (scope: "citywide" | "ward_detail" | "comparative") => {
    setReportScope(scope);
    syncUrlWithState(dossier?.dossierId, selectedWardId, scope);
  };

  // Load list of past simulation dossiers for History Drawer
  const loadHistoryList = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch("/api/admin/simulation/dossier?limit=30");
      const data = await res.json();
      if (data.success && Array.isArray(data.dossiers)) {
        setHistoryList(data.dossiers);
      }
    } catch (err) {
      console.warn("Failed to load dossier history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Load a historical dossier from archive into active view
  const handleSelectHistoryDossier = async (histDossierId: string) => {
    setLoading(true);
    setIsHistoryOpen(false);
    try {
      const res = await fetch(`/api/admin/simulation/dossier?dossierId=${encodeURIComponent(histDossierId)}`);
      const data = await res.json();
      if (data.success && data.dossier) {
        setDossier(data.dossier);
        if (data.dossier.selectedWardId) {
          setSelectedWardId(data.dossier.selectedWardId);
        }
        syncUrlWithState(data.dossier.dossierId, data.dossier.selectedWardId || selectedWardId, reportScope);
      } else {
        throw new Error(data.error || "Failed to load selected historical dossier");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Filtered historical dossiers for search
  const filteredHistory = useMemo(() => {
    if (!historySearch.trim()) return historyList;
    const q = historySearch.toLowerCase();
    return historyList.filter(
      (h) =>
        h.dossierId.toLowerCase().includes(q) ||
        h.scenarioTitle.toLowerCase().includes(q) ||
        h.scenarioId.toLowerCase().includes(q) ||
        h.peakWardName.toLowerCase().includes(q)
    );
  }, [historyList, historySearch]);

  // Return path link back to spatial simulation map with exact parameters
  const mapReturnUrl = useMemo(() => {
    const params = new URLSearchParams();
    params.set("scenario", qScenario);
    params.set("t", String(qTime));
    params.set("ward", selectedWardId);
    if (qBaseline) params.set("baseline", qBaseline);
    if (qRainfallRate) params.set("rainfallRate", qRainfallRate);
    if (qTide) params.set("astronomicalTide", qTide);
    if (qSiltation) params.set("siltation", qSiltation);
    if (qProfile) params.set("rainfallProfile", qProfile);
    if (qMissing) params.set("missing", "1");
    return `/admin/mumbai/simulation?${params.toString()}`;
  }, [qScenario, qTime, selectedWardId, qBaseline, qRainfallRate, qTide, qSiltation, qProfile, qMissing]);

  // Selected ward dossier analysis from dossier
  const selectedWardDossier: DossierWardDetailedAnalysis | null = useMemo(() => {
    if (!dossier) return null;
    return (
      dossier.rankedWardsAnalysis?.find((w) => isMatchingWard(w.wardId, selectedWardId, "mumbai")) ||
      dossier.wardDetailedAnalysis ||
      null
    );
  }, [dossier, selectedWardId]);

  // Comparison ward dossier analysis
  const comparisonWardDossier: DossierWardDetailedAnalysis | null = useMemo(() => {
    if (!dossier) return null;
    return dossier.rankedWardsAnalysis?.find((w) => isMatchingWard(w.wardId, comparisonWardId, "mumbai")) || null;
  }, [dossier, comparisonWardId]);

  // Export handlers
  const handleExportCSV = () => {
    if (!dossier) return;
    window.open(`/api/admin/simulation/dossier?dossierId=${encodeURIComponent(dossier.dossierId)}&format=csv`, "_blank");
  };

  const handleExportJSON = () => {
    if (!dossier) return;
    const blob = new Blob([JSON.stringify(dossier, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${dossier.dossierId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pdfSuccess, setPdfSuccess] = useState<boolean>(false);

  const handleDownloadPdf = async () => {
    if (!dossier) return;
    setIsGeneratingPdf(true);
    setPdfError(null);
    setPdfSuccess(false);

    try {
      const res = await fetch(
        `/api/admin/reports/simulation-pdf?dossierId=${encodeURIComponent(dossier.dossierId)}&ward=${encodeURIComponent(selectedWardId)}&scope=${encodeURIComponent(reportScope)}`
      );
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${res.status}: Failed to generate simulation PDF`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${dossier.dossierId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setPdfSuccess(true);
      setTimeout(() => setPdfSuccess(false), 3500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[ReportStudio] PDF download error:", err);
      setPdfError(msg);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  // Draft administrative advisory text
  const advisoryDraftText = useMemo(() => {
    if (!dossier) return "";
    const ex = dossier.executiveSummary;
    const topWards = ex.highestPriorityWards
      .slice(0, 3)
      .map((w) => `Ward ${w.wardId} (${w.wardName}) - Score ${w.score} [${w.tier}]`)
      .join("\n  • ");
    return `MUNICIPAL CORPORATION OF GREATER MUMBAI (MCGM)
DISASTER MANAGEMENT CELL • EMERGENCIES & STORMWATER ADVISORY
DOCUMENT REFERENCE: ${dossier.dossierId}
DATE / TIME: ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST
SCENARIO EVALUATION: ${ex.scenarioTitle} (Simulation Horizon: T+${ex.selectedHorizonHours}h)
OVERALL MUNICIPAL ALERT STATUS: ${ex.overallAlertLevel}

1. EXECUTIVE SITUATION OVERVIEW:
${ex.keyFindings.map((k) => `• ${k}`).join("\n")}

2. PRIORITY INTERVENTION WARDS:
  • ${topWards}

3. URGENT OPERATIONAL DIRECTIVES:
  • Stormwater Drains (SWD): Keep all 41 high-capacity diesel pump sets at Love Grove, Cleveland Bunder, Britannia, and Haji Ali staffed and primed for tidal lockout backpressure.
  • Traffic Police & Roads: Pre-position road safety alerts and detours at chronic depression hotspots (Hindmata, Kurla Bail Bazar, Milan Subway).
  • Public Health (PHD): Ensure backup generator elevation and dry sump pump operations at tertiary medical centers in high-risk zones.

LEGAL & ADMINISTRATIVE DISCLAIMER:
This document is a computer-assisted hydrodynamic screening advisory based on Copernicus GLO-30 DEM topography and BRIMSTOWAD design benchmarks. It does NOT constitute automated execution or public alarm dispatch. Official municipal action requires executive authorization by the Municipal Commissioner / Disaster Management Officer.`;
  }, [dossier]);

  const handleCopyAdvisory = async () => {
    try {
      await navigator.clipboard.writeText(advisoryDraftText);
      setCopiedAdvisory(true);
      setTimeout(() => setCopiedAdvisory(false), 2500);
    } catch {
      // Fallback
    }
  };

  if (loading && !dossier) {
    return (
      <div className="w-full min-h-[80vh] flex flex-col items-center justify-center p-8 bg-canvas">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-base font-black text-text-primary tracking-tight">
          Compiling Canonical Simulation Dossier...
        </h2>
        <p className="text-xs text-text-tertiary mt-1">
          Synthesizing 24 BMC wards, Copernicus GLO-30 DEM profiles, and disaggregated hydrological traces
        </p>
      </div>
    );
  }

  if (error || !dossier) {
    return (
      <div className="w-full min-h-[80vh] flex items-center justify-center p-8 bg-canvas">
        <div className="max-w-lg w-full p-6 rounded-3xl bg-card border border-divider shadow-xl space-y-4">
          <div className="flex items-center gap-3 text-red-600">
            <AlertTriangleIcon size={24} />
            <h2 className="text-base font-black">Simulation Dossier Compilation Failed</h2>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">
            {error || "An unexpected error occurred while compiling the simulation report."}
          </p>
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => loadOrGenerateDossier(true)}
              className="px-4 py-2 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary-hover transition-colors"
            >
              Retry Compilation
            </button>
            <Link
              href={mapReturnUrl}
              className="px-4 py-2 rounded-xl border border-divider bg-surface font-bold text-xs text-text-primary hover:bg-surface-elevated transition-colors"
            >
              Return to Simulation Map
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const ex = dossier.executiveSummary;
  const cond = dossier.conditionsAndInputs;
  const meth = dossier.methodologyAndCalculation;
  const city = dossier.citywideAssessment;
  const gov = dossier.limitationsAndGovernance;

  return (
    <div className="w-full min-h-screen bg-canvas text-text-primary pb-20 print-container">
      {/* ─── TOP ADMINISTRATIVE APP SHELL HEADER (Hidden on Print) ─── */}
      <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-divider px-4 sm:px-8 py-3 no-print">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Left: Return Path & Breadcrumb */}
          <div className="flex items-center gap-3">
            <Link
              href={mapReturnUrl}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-divider bg-surface hover:bg-surface-elevated text-xs font-bold text-text-secondary hover:text-text-primary transition-colors cursor-pointer group"
              title="Return to interactive GIS spatial simulation map with exact scenario and ward settings"
            >
              <ArrowLeftIcon size={14} className="group-hover:-translate-x-0.5 transition-transform" />
              <span>Return to Simulation Map</span>
            </Link>
            <div className="h-4 w-px bg-divider hidden sm:block" />
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-tertiary">
                SIMULATION REPORT STUDIO
              </span>
              <span className="text-text-tertiary">/</span>
              <span className="text-xs font-bold text-text-primary truncate max-w-xs">
                {ex.scenarioTitle}
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-primary/10 text-primary border border-primary/20">
                T+{ex.selectedHorizonHours}h
              </span>
            </div>
          </div>

          {/* Right: Actions Toolbar */}
          <div className="flex items-center gap-2">
            <button
              id="btn-dossier-archive"
              aria-label="View Simulation Dossier Archive"
              onClick={() => {
                setIsHistoryOpen(true);
                loadHistoryList();
              }}
              className="px-3 py-1.5 rounded-xl border border-divider bg-surface hover:bg-surface-elevated text-text-primary text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Browse, compare and load previously persisted simulation dossiers from archive"
            >
              <ClockIcon size={14} className="text-primary" />
              <span className="hidden sm:inline">Dossier Archive</span>
            </button>

            <button
              id="btn-ai-audits"
              aria-label="View AI Governance Audits"
              onClick={() => setIsAiAuditModalOpen(true)}
              className="px-3 py-1.5 rounded-xl border border-divider bg-surface hover:bg-surface-elevated text-text-primary text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Inspect 3-role Groq AI audits, grounding sources, and contradiction flags"
            >
              <ShieldAlertIcon size={14} className="text-primary" />
              <span className="hidden sm:inline">AI Audits</span>
            </button>

            <button
              id="btn-ask-report-ai"
              aria-label="Ask AI about this report"
              onClick={() => setIsReportQaOpen(true)}
              className="px-3 py-1.5 rounded-xl border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Ask AI about this simulation report snapshot"
            >
              <span>🤖</span>
              <span className="hidden sm:inline">Ask Report AI</span>
            </button>

            <button
              onClick={() => setIsAdvisoryModalOpen(true)}
              className="px-3 py-1.5 rounded-xl border border-divider bg-surface hover:bg-surface-elevated text-text-primary text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Draft an administrative advisory text for municipal departments"
            >
              <FileTextIcon size={14} className="text-primary" />
              <span className="hidden sm:inline">Draft Advisory</span>
            </button>

            <button
              id="btn-download-pdf-dossier"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-50"
              title="Generate and download multi-page publication-grade PDF report with vector maps"
            >
              {isGeneratingPdf ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Compiling PDF...</span>
                </>
              ) : pdfSuccess ? (
                <>
                  <CheckIcon size={14} className="text-emerald-300" />
                  <span>PDF Ready!</span>
                </>
              ) : (
                <>
                  <DownloadIcon size={14} />
                  <span>Export PDF</span>
                </>
              )}
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl border border-divider bg-surface hover:bg-surface-elevated text-text-primary text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Browser print preview"
            >
              <PrinterIcon size={14} />
              <span className="hidden sm:inline">Print</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-xl border border-divider bg-surface hover:bg-surface-elevated text-text-primary text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Download 24-ward tabular results in CSV format"
            >
              <DownloadIcon size={14} />
              <span className="hidden sm:inline">CSV</span>
            </button>

            <button
              onClick={handleExportJSON}
              className="px-3 py-1.5 rounded-xl border border-divider bg-surface hover:bg-surface-elevated text-text-primary text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Download structured JSON with complete metadata"
            >
              <DownloadIcon size={14} />
              <span className="hidden sm:inline">JSON</span>
            </button>

            <button
              onClick={() => loadOrGenerateDossier(true)}
              className="p-1.5 rounded-xl border border-divider bg-surface hover:bg-surface-elevated text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              title="Regenerate report from latest calculation state"
            >
              <RefreshCwIcon size={14} />
            </button>
          </div>
        </div>

        {/* PDF Generation Error Banner */}
        {pdfError && (
          <div className="mt-3 p-2.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 text-xs flex items-center justify-between">
            <span>Failed to generate PDF: {pdfError}</span>
            <button onClick={() => setPdfError(null)} className="font-bold hover:underline">Dismiss</button>
          </div>
        )}

        {/* Outdated Snapshot Banner */}
        {isScenarioOutOfDate && (
          <div className="mt-3 p-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangleIcon size={16} className="text-amber-500 shrink-0" />
              <span>
                <strong>Snapshot Outdated:</strong> Simulation inputs have changed since this report was compiled.
              </span>
            </div>
            <button
              onClick={() => loadOrGenerateDossier(true)}
              className="px-2 py-0.5 rounded-md bg-amber-500/20 hover:bg-amber-500/30 font-bold transition-colors cursor-pointer"
            >
              Regenerate
            </button>
          </div>
        )}
      </header>

      {/* ─── PRINT ONLY OFFICIAL MUNICIPAL HEADER ─── */}
      <div className="print-only p-6 border-b-2 border-slate-900 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black uppercase tracking-wider text-slate-900">
              MUNICIPAL CORPORATION OF GREATER MUMBAI (MCGM / BMC)
            </h1>
            <h2 className="text-sm font-bold text-slate-700 mt-1">
              DISASTER MANAGEMENT DEPARTMENT • SPATIAL SIMULATION EXECUTIVE DOSSIER
            </h2>
            <p className="text-xs font-mono text-slate-600 mt-1">
              Document ID: {dossier.dossierId} • Generated: {new Date(dossier.generatedAtIso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST
            </p>
          </div>
          <div className="text-right">
            <span className="inline-block px-3 py-1 border-2 border-slate-900 font-mono font-black text-xs uppercase">
              {ex.overallAlertLevel}
            </span>
            <p className="text-[10px] font-mono text-slate-500 mt-1">
              TIER: {ex.modelTier}
            </p>
          </div>
        </div>
      </div>

      {/* ─── MAIN REPORT CONTAINER ─── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 pt-6 space-y-8">
        {/* ─── SCENARIO OUT OF DATE / CHANGED BANNER ─── */}
        {isScenarioOutOfDate && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print animate-fadeIn">
            <div className="flex items-start sm:items-center gap-2.5">
              <AlertTriangleIcon size={18} className="text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <strong>Report Out of Date:</strong> This report reflects Scenario <code>{dossier.scenarioId}</code> at T+{dossier.timeStepHours}h, but your active URL selection is Scenario <code>{qScenario}</code> at T+{qTime}h.
              </div>
            </div>
            <button
              onClick={() => loadOrGenerateDossier(true)}
              className="px-3.5 py-1.5 rounded-xl bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 transition-colors shrink-0 cursor-pointer"
            >
              Regenerate for Active Scenario ↻
            </button>
          </div>
        )}

        {/* ─── COVER / HEADER DOCUMENT CARD ─── */}
        <section className="bg-card rounded-3xl border border-divider shadow-sm p-6 sm:p-8 space-y-6 avoid-break">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                  {ex.city} • {ex.municipalAuthority}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-surface-elevated text-text-secondary border border-divider">
                  SCHEMA V{dossier.schemaVersion}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider text-white ${
                    ex.overallAlertLevel === "RED_WARNING"
                      ? "bg-red-600"
                      : ex.overallAlertLevel === "ORANGE_ALERT"
                      ? "bg-amber-600"
                      : ex.overallAlertLevel === "YELLOW_WATCH"
                      ? "bg-yellow-600"
                      : "bg-emerald-600"
                  }`}
                >
                  {ex.overallAlertLevel}
                </span>
                <span
                  id="badge-ai-state"
                  onClick={() => setIsAiAuditModalOpen(true)}
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider cursor-pointer border ${
                    gov.aiGovernance.overallAIState === "ALL_OPERATIONAL"
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                      : gov.aiGovernance.overallAIState === "PARTIAL_DEGRADED"
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                      : "bg-blue-500/10 text-blue-600 border-blue-500/30"
                  }`}
                  title="Click to view AI Role Health and Audits"
                >
                  AI: {gov.aiGovernance.overallAIState}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight">
                {ex.scenarioTitle}
              </h1>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed max-w-3xl">
                Dedicated municipal hydrodynamic screening report evaluating rainfall excess, Copernicus GLO-30 DEM topographic depressions, BRIMSTOWAD drainage capacity, and astronomical tidal lockout across Greater Mumbai&apos;s 24 canonical administrative wards.
              </p>
              {gov.aiGovernance.overallAIState === "PARTIAL_DEGRADED" && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between no-print">
                  <div className="flex items-center gap-2">
                    <ShieldAlertIcon size={14} className="shrink-0 text-amber-600" />
                    <span>Role 1 operating in deterministic fallback; Roles 2 &amp; 3 operational via Groq. Zero calculated values altered.</span>
                  </div>
                  <button
                    onClick={() => setIsAiAuditModalOpen(true)}
                    className="font-bold underline text-[11px] shrink-0 ml-2 cursor-pointer hover:text-amber-900 dark:hover:text-amber-200"
                  >
                    View Role Telemetry →
                  </button>
                </div>
              )}
            </div>

            {/* Scope Switcher (City-Wide vs Ward Dossier vs Comparative) & Ward Dropdown */}
            <div className="shrink-0 flex flex-col sm:flex-row lg:flex-col gap-2 no-print">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary font-mono">
                Report Analysis Scope:
              </span>
              <div className="inline-flex p-1 bg-surface-elevated rounded-2xl border border-divider text-xs">
                <button
                  id="tab-scope-citywide"
                  onClick={() => handleSelectScope("citywide")}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    reportScope === "citywide"
                      ? "bg-card text-primary shadow-xs"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  City-Wide Overview
                </button>
                <button
                  id="tab-scope-ward"
                  onClick={() => handleSelectScope("ward_detail")}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    reportScope === "ward_detail"
                      ? "bg-card text-primary shadow-xs"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  Ward Dossier: Ward {selectedWardId}
                </button>
                <button
                  id="tab-scope-compare"
                  onClick={() => handleSelectScope("comparative")}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    reportScope === "comparative"
                      ? "bg-card text-primary shadow-xs"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  Multi-Ward Compare
                </button>
              </div>

              {/* Instant Canonical Ward Selector Dropdown */}
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] font-mono text-text-tertiary uppercase font-bold">
                  Focus Ward:
                </span>
                <select
                  id="select-studio-focus-ward"
                  value={selectedWardId}
                  onChange={(e) => handleSelectWard(e.target.value)}
                  className="text-xs font-bold bg-surface border border-divider rounded-xl px-2.5 py-1 text-text-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  {CANONICAL_MUMBAI_WARDS.map((w) => (
                    <option key={w.id} value={w.id}>
                      Ward {w.id} ({w.shortCode}) — {w.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-4 border-t border-divider text-xs">
            <div className="p-3 rounded-2xl bg-surface border border-divider">
              <span className="text-[10px] font-mono text-text-tertiary block uppercase font-bold">Document ID</span>
              <span className="font-mono font-bold text-text-primary truncate block mt-0.5">{dossier.dossierId}</span>
            </div>
            <div className="p-3 rounded-2xl bg-surface border border-divider">
              <span className="text-[10px] font-mono text-text-tertiary block uppercase font-bold">Time Window</span>
              <span className="font-mono font-bold text-text-primary block mt-0.5">T+{ex.selectedHorizonHours}h ({ex.timeZone})</span>
            </div>
            <div className="p-3 rounded-2xl bg-surface border border-divider">
              <span className="text-[10px] font-mono text-text-tertiary block uppercase font-bold">Model Tier</span>
              <span className="font-mono font-bold text-primary block mt-0.5">{ex.modelTier}</span>
            </div>
            <div className="p-3 rounded-2xl bg-surface border border-divider">
              <span className="text-[10px] font-mono text-text-tertiary block uppercase font-bold">Data Quality Tier</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 block mt-0.5">
                {cond.missingOrStaleInputs.length === 0 ? "VERIFIED_OPERATIONAL" : "PARTIALLY_CALIBRATED"}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-surface border border-divider">
              <span className="text-[10px] font-mono text-text-tertiary block uppercase font-bold">Evaluation Basis</span>
              <span className="font-bold text-text-primary block mt-0.5">24 BMC Wards (100%)</span>
            </div>
            <div className="p-3 rounded-2xl bg-surface border border-divider">
              <span className="text-[10px] font-mono text-text-tertiary block uppercase font-bold">Input Hash</span>
              <span className="font-mono text-text-secondary truncate block mt-0.5">{dossier.rawInputHash}</span>
            </div>
          </div>
        </section>

        {/* ─── STICKY SECTION NAVIGATOR (Table of Contents - Hidden on Print) ─── */}
        <nav className="sticky top-16 z-30 bg-surface/90 backdrop-blur-md p-1.5 rounded-2xl border border-divider shadow-xs flex items-center gap-1 overflow-x-auto scrollbar-none text-xs font-bold no-print">
          {[
            { id: "sec-exec", label: "A. Executive Summary" },
            { id: "sec-conditions", label: "B. Conditions & Sources" },
            { id: "sec-formulas", label: "C. Scientific Trace" },
            { id: "sec-citywide", label: "D. City-Wide Assessment" },
            { id: "sec-ward", label: `E. Ward Dossier (${selectedWardId})` },
            { id: "sec-assets", label: "F. Population & Assets" },
            { id: "sec-actions", label: "G. Municipal Actions" },
            { id: "sec-governance", label: "H. Limitations & Governance" },
          ].map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={() => setActiveSection(item.id)}
              className={`px-3 py-1.5 rounded-xl transition-colors whitespace-nowrap cursor-pointer ${
                activeSection === item.id
                  ? "bg-primary text-primary-foreground"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-elevated"
              }`}
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* ═════════════════════════════════════════════════════════ */}
        {/* SECTION A: EXECUTIVE SUMMARY                              */}
        {/* ═════════════════════════════════════════════════════════ */}
        <section id="sec-exec" className="bg-card rounded-3xl border border-divider shadow-sm p-6 sm:p-8 space-y-6 avoid-break">
          <div className="flex items-center justify-between border-b border-divider pb-4">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-mono font-bold text-sm">
                A
              </span>
              <div>
                <h2 className="text-lg font-black text-text-primary tracking-tight">Executive Summary</h2>
                <span className="text-xs text-text-tertiary">Strategic Municipal Situation Briefing</span>
              </div>
            </div>
            <span className="text-[10px] font-mono text-text-tertiary">Section A • Core Briefing</span>
          </div>

          {/* Key Findings List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-tertiary font-mono">
              Key Verified Findings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {ex.keyFindings.map((finding, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-surface border border-divider flex items-start gap-3">
                  <span className="w-5 h-5 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    {finding}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Top 5 Priority Intervention Wards Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-tertiary font-mono">
                Top Priority Municipal Intervention Wards
              </h3>
              <span className="text-[10px] text-text-tertiary font-mono">Ranked by Waterlogging Susceptibility Index</span>
            </div>
            <div className="overflow-x-auto rounded-2xl border border-divider">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface border-b border-divider text-[11px] font-bold text-text-secondary uppercase">
                  <tr>
                    <th className="p-3">Rank</th>
                    <th className="p-3">Ward</th>
                    <th className="p-3">Score &amp; Unit</th>
                    <th className="p-3">Operational Tier</th>
                    <th className="p-3">Primary Physical Trigger</th>
                    <th className="p-3 text-right no-print">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-divider bg-card">
                  {ex.highestPriorityWards.map((w) => (
                    <tr key={w.wardId} className="hover:bg-surface transition-colors">
                      <td className="p-3 font-mono font-bold text-text-tertiary">#{w.rank}</td>
                      <td className="p-3">
                        <span className="font-bold text-text-primary block">Ward {w.wardId}</span>
                        <span className="text-[10px] text-text-tertiary">{w.wardName}</span>
                      </td>
                      <td className="p-3 font-mono font-black text-sm text-text-primary">
                        {w.score} <span className="text-[10px] font-normal text-text-tertiary">{w.unit}</span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono text-white ${
                            w.score >= 80 ? "bg-red-600" : w.score >= 60 ? "bg-orange-600" : "bg-amber-600"
                          }`}
                        >
                          {w.tier}
                        </span>
                      </td>
                      <td className="p-3 text-text-secondary text-xs">{w.primaryTrigger}</td>
                      <td className="p-3 text-right no-print">
                        <button
                          onClick={() => {
                            setSelectedWardId(w.wardId);
                            setReportScope("ward_detail");
                            const wardEl = document.getElementById("sec-ward");
                            if (wardEl) wardEl.scrollIntoView({ behavior: "smooth" });
                          }}
                          className="px-2.5 py-1 rounded-lg border border-divider bg-surface hover:bg-surface-elevated font-bold text-[11px] text-primary cursor-pointer"
                        >
                          Inspect Ward →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ═════════════════════════════════════════════════════════ */}
        {/* SECTION B: CONDITIONS & SOURCES                           */}
        {/* ═════════════════════════════════════════════════════════ */}
        <section id="sec-conditions" className="bg-card rounded-3xl border border-divider shadow-sm p-6 sm:p-8 space-y-6 avoid-break">
          <div className="flex items-center justify-between border-b border-divider pb-4">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-mono font-bold text-sm">
                B
              </span>
              <div>
                <h2 className="text-lg font-black text-text-primary tracking-tight">Conditions &amp; Source Records</h2>
                <span className="text-xs text-text-tertiary">Verified Physical Inputs &amp; User-Controlled Parameters</span>
              </div>
            </div>
            <span className="text-[10px] font-mono text-text-tertiary">Section B • Data Inputs</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Controlled Scenario Parameters */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-tertiary font-mono">
                Scenario Controlled Variables
              </h3>
              <div className="rounded-2xl border border-divider overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface border-b border-divider text-[10px] font-bold text-text-secondary uppercase">
                    <tr>
                      <th className="p-2.5">Parameter</th>
                      <th className="p-2.5">Value</th>
                      <th className="p-2.5">Unit</th>
                      <th className="p-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-divider bg-card">
                    {cond.userControlledInputs.map((u) => (
                      <tr key={u.id} className="hover:bg-surface transition-colors">
                        <td className="p-2.5 font-semibold text-text-primary">{u.name}</td>
                        <td className="p-2.5 font-mono font-bold text-primary">{u.value}</td>
                        <td className="p-2.5 text-text-tertiary font-mono">{u.unit}</td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-bold bg-primary/10 text-primary">
                            {u.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Live Environmental Observations & Marine Baseline */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-tertiary font-mono">
                Authoritative Environmental Observations
              </h3>
              <div className="rounded-2xl border border-divider overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface border-b border-divider text-[10px] font-bold text-text-secondary uppercase">
                    <tr>
                      <th className="p-2.5">Observation</th>
                      <th className="p-2.5">Value</th>
                      <th className="p-2.5">Source</th>
                      <th className="p-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-divider bg-card">
                    {cond.liveObservations.map((o) => (
                      <tr key={o.id} className="hover:bg-surface transition-colors">
                        <td className="p-2.5 font-semibold text-text-primary">{o.name}</td>
                        <td className="p-2.5 font-mono font-bold text-text-primary">{o.value} {o.unit}</td>
                        <td className="p-2.5 text-text-tertiary text-[11px]">{o.sourceName}</td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            {o.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Missing / Uncalibrated Inputs Disclaimer */}
          {cond.missingOrStaleInputs.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-xs">
                <AlertTriangleIcon size={16} />
                <span>Uncalibrated / Missing Telemetry Feeds</span>
              </div>
              <ul className="text-xs text-text-secondary space-y-1 list-disc pl-5">
                {cond.missingOrStaleInputs.map((m, idx) => (
                  <li key={idx}>
                    <strong>{m.variable}:</strong> {m.impactOnModel} (<em>Fallback applied:</em> {m.fallbackUsed})
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* ═════════════════════════════════════════════════════════ */}
        {/* SECTION C: SCIENTIFIC TRACE & FORMULAS                    */}
        {/* ═════════════════════════════════════════════════════════ */}
        <section id="sec-formulas" className="bg-card rounded-3xl border border-divider shadow-sm p-6 sm:p-8 space-y-6 avoid-break">
          <div className="flex items-center justify-between border-b border-divider pb-4">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-mono font-bold text-sm">
                C
              </span>
              <div>
                <h2 className="text-lg font-black text-text-primary tracking-tight">Scientific Methodology &amp; Mathematical Trace</h2>
                <span className="text-xs text-text-tertiary">Governing Hydrodynamic Formulations &amp; Disaggregated Terms</span>
              </div>
            </div>
            <span className="text-[10px] font-mono text-text-tertiary">Section C • Calculation Formulation</span>
          </div>

          {/* Model Specification Box */}
          <div className="p-4 rounded-2xl bg-surface border border-divider space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-text-primary">
                Model: {meth.modelName} (Version {meth.modelVersion})
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-primary/10 text-primary">
                {meth.readinessTier}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-canvas border border-divider font-mono text-xs text-text-primary overflow-x-auto">
              <code>{meth.formulaPlain}</code>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
              <div>
                <span className="text-text-tertiary block text-[10px] uppercase font-bold">Spatial Resolution</span>
                <span className="font-semibold text-text-primary">{meth.spatialResolution}</span>
              </div>
              <div>
                <span className="text-text-tertiary block text-[10px] uppercase font-bold">Temporal Resolution</span>
                <span className="font-semibold text-text-primary">{meth.temporalResolution}</span>
              </div>
              <div>
                <span className="text-text-tertiary block text-[10px] uppercase font-bold">Baseline Definition</span>
                <span className="font-semibold text-text-primary">{meth.baselineDefinition}</span>
              </div>
            </div>
          </div>

          {/* Variable Definitions Table */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-tertiary font-mono">
              Governing Equation Terms &amp; Normalization
            </h3>
            <div className="overflow-x-auto rounded-2xl border border-divider">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface border-b border-divider text-[10px] font-bold text-text-secondary uppercase">
                  <tr>
                    <th className="p-2.5">Term</th>
                    <th className="p-2.5">Name</th>
                    <th className="p-2.5">Unit</th>
                    <th className="p-2.5">Normalization &amp; Weight</th>
                    <th className="p-2.5">Physical Rationale</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-divider bg-card">
                  {meth.variableDefinitions.map((v) => (
                    <tr key={v.symbol} className="hover:bg-surface transition-colors">
                      <td className="p-2.5 font-mono font-bold text-primary">{v.symbol}</td>
                      <td className="p-2.5 font-semibold text-text-primary">{v.name}</td>
                      <td className="p-2.5 font-mono text-text-tertiary">{v.unit}</td>
                      <td className="p-2.5 font-mono text-xs">{v.effectiveWeight} ({v.normalizationMethod})</td>
                      <td className="p-2.5 text-text-secondary text-xs">{v.weightRationale}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Selected Ward Calculation Trace */}
          {meth.selectedWardCalculationTrace && (
            <div className="p-4 rounded-2xl bg-surface border border-divider space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-text-primary">
                  Step-by-Step Numerical Verification: Ward {meth.selectedWardCalculationTrace.wardId} ({meth.selectedWardCalculationTrace.wardName})
                </span>
                <span className="font-mono text-xs font-bold text-primary">
                  Final Score: {meth.selectedWardCalculationTrace.finalScore} / 100
                </span>
              </div>
              <ul className="space-y-1.5 font-mono text-xs text-text-secondary bg-canvas p-3 rounded-xl border border-divider">
                {meth.selectedWardCalculationTrace.stepByStepCalculations.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-primary font-bold">↳</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
              <p className="text-[11px] text-text-tertiary">
                <strong>Baseline Comparison:</strong> {meth.selectedWardCalculationTrace.baselineComparison}
              </p>
            </div>
          )}
        </section>

        {/* ═════════════════════════════════════════════════════════ */}
        {/* SECTION D: CITY-WIDE ASSESSMENT                           */}
        {/* ═════════════════════════════════════════════════════════ */}
        <section id="sec-citywide" className="bg-card rounded-3xl border border-divider shadow-sm p-6 sm:p-8 space-y-6 avoid-break">
          <div className="flex items-center justify-between border-b border-divider pb-4">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-mono font-bold text-sm">
                D
              </span>
              <div>
                <h2 className="text-lg font-black text-text-primary tracking-tight">City-Wide Municipal Screening (Level A)</h2>
                <span className="text-xs text-text-tertiary">24 Canonical Greater Mumbai Administrative Wards</span>
              </div>
            </div>
            <span className="text-[10px] font-mono text-text-tertiary">Section D • City-Wide Matrix</span>
          </div>

          {/* City Statistics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-surface border border-divider">
              <span className="text-[10px] font-mono uppercase font-bold text-text-tertiary block">Severe Hazard Tier</span>
              <span className="text-2xl font-black text-red-600 block mt-1">{city.tierDistribution.severeCount}</span>
              <span className="text-[10px] text-text-tertiary">Score &ge; 80 / 100</span>
            </div>
            <div className="p-4 rounded-2xl bg-surface border border-divider">
              <span className="text-[10px] font-mono uppercase font-bold text-text-tertiary block">High Choke Tier</span>
              <span className="text-2xl font-black text-orange-600 block mt-1">{city.tierDistribution.highCount}</span>
              <span className="text-[10px] text-text-tertiary">Score 60 – 79 / 100</span>
            </div>
            <div className="p-4 rounded-2xl bg-surface border border-divider">
              <span className="text-[10px] font-mono uppercase font-bold text-text-tertiary block">Moderate Watch</span>
              <span className="text-2xl font-black text-amber-600 block mt-1">{city.tierDistribution.moderateCount}</span>
              <span className="text-[10px] text-text-tertiary">Score 40 – 59 / 100</span>
            </div>
            <div className="p-4 rounded-2xl bg-surface border border-divider">
              <span className="text-[10px] font-mono uppercase font-bold text-text-tertiary block">Low / Minimal</span>
              <span className="text-2xl font-black text-emerald-600 block mt-1">{city.tierDistribution.lowCount}</span>
              <span className="text-[10px] text-text-tertiary">Score &lt; 40 / 100</span>
            </div>
          </div>

          {/* Full 24-Ward Ranking Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-tertiary font-mono">
                Complete 24-Ward Hydrodynamic Screening Matrix
              </h3>
              <span className="text-[10px] text-text-tertiary font-mono">Click any row to switch Ward Dossier view</span>
            </div>
            <div className="overflow-x-auto rounded-2xl border border-divider max-h-96">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-surface border-b border-divider text-[10px] font-bold text-text-secondary uppercase">
                  <tr>
                    <th className="p-2.5">Ward ID</th>
                    <th className="p-2.5">Ward Name</th>
                    <th className="p-2.5">Zone</th>
                    <th className="p-2.5">Score</th>
                    <th className="p-2.5">Tier</th>
                    <th className="p-2.5">Mean ASL</th>
                    <th className="p-2.5">Exposed Pop (Est.)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-divider bg-card">
                  {(dossier.rankedWardsAnalysis || []).map((ward) => {
                    const isSelected = isMatchingWard(ward.wardId, selectedWardId, "mumbai");
                    return (
                      <tr
                        key={ward.wardId}
                        onClick={() => {
                          const canonical = canonicalWardId(ward.wardId, "mumbai");
                          setSelectedWardId(canonical);
                          setReportScope("ward_detail");
                        }}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? "bg-primary/10 font-bold" : "hover:bg-surface"
                        }`}
                      >
                        <td className="p-2.5 font-mono font-bold text-primary">Ward {ward.wardId}</td>
                        <td className="p-2.5 text-text-primary">{ward.wardName}</td>
                        <td className="p-2.5 text-text-tertiary font-mono">{ward.zone}</td>
                        <td className="p-2.5 font-mono font-bold text-text-primary">{ward.score}</td>
                        <td className="p-2.5">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[9px] font-bold font-mono text-white ${
                              ward.score >= 80 ? "bg-red-600" : ward.score >= 60 ? "bg-orange-600" : "bg-amber-600"
                            }`}
                          >
                            {ward.severityTier}
                          </span>
                        </td>
                        <td className="p-2.5 font-mono text-text-secondary">~{ward.elevationMeanM}m</td>
                        <td className="p-2.5 font-mono text-text-secondary">
                          ~{ward.estimatedExposedPopulation.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ═════════════════════════════════════════════════════════ */}
        {/* SECTION E: WARD-LEVEL IMPACT DOSSIER (Level B)            */}
        {/* ═════════════════════════════════════════════════════════ */}
        <section id="sec-ward" className="bg-card rounded-3xl border border-divider shadow-sm p-6 sm:p-8 space-y-6 avoid-break">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-divider pb-4">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-mono font-bold text-sm">
                E
              </span>
              <div>
                <h2 className="text-lg font-black text-text-primary tracking-tight">
                  Ward Impact Dossier (Level B): Ward {selectedWardId}
                </h2>
                <span className="text-xs text-text-tertiary">
                  {selectedWardDossier?.wardName || `Ward ${selectedWardId}`}
                </span>
              </div>
            </div>

            {/* Ward Selector Dropdown (Hidden on Print) */}
            <div className="flex items-center gap-2 no-print">
              <span className="text-xs font-bold text-text-secondary">Switch Ward:</span>
              <select
                value={canonicalWardId(selectedWardId, "mumbai")}
                onChange={(e) => setSelectedWardId(canonicalWardId(e.target.value, "mumbai"))}
                className="px-3 py-1.5 rounded-xl border border-divider bg-surface text-text-primary text-xs font-bold focus:outline-hidden cursor-pointer"
              >
                {CANONICAL_MUMBAI_WARDS.map((w) => (
                  <option key={w.id} value={w.id}>
                    Ward {w.id} ({w.shortCode}) — {w.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedWardDossier && (
            <div className="space-y-6">
              {/* Ward Overview Header Bar */}
              <div className="p-4 rounded-2xl bg-surface border border-divider flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-primary/10 text-primary">
                      BMC WARD {selectedWardDossier.wardId} • {selectedWardDossier.zone}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-surface-elevated text-text-secondary border border-divider">
                      {selectedWardDossier.isCoastal ? "🌊 Coastal Frontage" : "🏔️ Inland Basin"}
                    </span>
                    {selectedWardDossier.saucerDepressions.length > 0 && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                        Topographic Saucer Sink Verified
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-black text-text-primary">
                    {selectedWardDossier.wardName}
                  </h3>
                  <p className="text-xs text-text-tertiary">
                    Waterways &amp; Basins: {selectedWardDossier.waterwaysAndBasins.join(" • ")} • Area: ~{selectedWardDossier.geographicAreaSqKm} km²
                  </p>
                </div>

                {/* Score Big Display */}
                <div className="text-right">
                  <span className="text-[10px] font-mono uppercase font-bold text-text-tertiary block">
                    Waterlogging Susceptibility Index (T={ex.selectedHorizonHours}h)
                  </span>
                  <div className="flex items-baseline justify-end gap-2 mt-0.5">
                    <span className="text-3xl font-black text-text-primary font-mono">
                      {selectedWardDossier.score}
                    </span>
                    <span className="text-xs text-text-tertiary font-mono">/ 100</span>
                  </div>
                  <span className="text-[11px] font-bold text-amber-600 block">
                    +{selectedWardDossier.deltaPercent}% vs Baseline
                  </span>
                </div>
              </div>

              {/* Physical & Terrain Quantities Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-surface border border-divider space-y-1">
                  <span className="text-[10px] font-mono uppercase font-bold text-text-tertiary block">Mean Elevation</span>
                  <span className="font-mono font-bold text-text-primary text-sm">
                    ~{selectedWardDossier.elevationMeanM}m ASL
                  </span>
                  <span className="text-[10px] text-text-tertiary block">Copernicus GLO-30 DEM</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-surface border border-divider space-y-1">
                  <span className="text-[10px] font-mono uppercase font-bold text-text-tertiary block">Baseline Score</span>
                  <span className="font-mono font-bold text-text-primary text-sm">
                    {selectedWardDossier.baselineValue}
                  </span>
                  <span className="text-[10px] text-text-tertiary block">Dry Weather Reference</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-surface border border-divider space-y-1">
                  <span className="text-[10px] font-mono uppercase font-bold text-text-tertiary block">Depression Sinks</span>
                  <span className="font-mono font-bold text-text-primary text-sm">
                    {selectedWardDossier.saucerDepressions.length} verified basins
                  </span>
                  <span className="text-[10px] text-text-tertiary block">Copernicus Relief Depth</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-surface border border-divider space-y-1">
                  <span className="text-[10px] font-mono uppercase font-bold text-text-tertiary block">Drainage Assets</span>
                  <span className="font-mono font-bold text-text-primary text-sm">
                    {selectedWardDossier.drainageAssets.pumpingStations.length} pumps / {selectedWardDossier.drainageAssets.outfallGates.length} gates
                  </span>
                  <span className="text-[10px] text-text-tertiary block">BRIMSTOWAD Network</span>
                </div>
              </div>

              {/* Verified Chronic Waterlogging Spots */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-text-tertiary font-mono">
                  Documented Chronic Waterlogging Observations ({selectedWardDossier.historicalHotspots.length})
                </h4>
                {selectedWardDossier.historicalHotspots.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {selectedWardDossier.historicalHotspots.map((h, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-surface border border-divider space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-text-primary text-xs">
                          <span className="w-2 h-2 rounded-full bg-red-500" />
                          <span>{h}</span>
                        </div>
                        <p className="text-[11px] text-text-secondary leading-tight">Documented localized waterlogging recurrence</p>
                        <span className="text-[10px] text-text-tertiary font-mono block">Recurrence: Annual Monsoon</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-text-tertiary italic p-3 rounded-xl bg-surface border border-divider">
                    No chronic MCGM monsoon flood hotspots catalogued in Ward {selectedWardId}.
                  </p>
                )}
              </div>
            </div>
          )}
        </section>

        {/* ═════════════════════════════════════════════════════════ */}
        {/* SECTION F: POPULATION & ASSET EXPOSURE ANALYSIS           */}
        {/* ═════════════════════════════════════════════════════════ */}
        <section id="sec-assets" className="bg-card rounded-3xl border border-divider shadow-sm p-6 sm:p-8 space-y-6 avoid-break">
          <div className="flex items-center justify-between border-b border-divider pb-4">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-mono font-bold text-sm">
                F
              </span>
              <div>
                <h2 className="text-lg font-black text-text-primary tracking-tight">Population &amp; Infrastructure Asset Exposure</h2>
                <span className="text-xs text-text-tertiary">Spatial Buffer Intersections &amp; Critical Infrastructure Audit</span>
              </div>
            </div>
            <span className="text-[10px] font-mono text-text-tertiary">Section F • Exposure Audit</span>
          </div>

          {/* Demographic Exposure Audit Box */}
          <div className="p-5 rounded-2xl bg-surface border border-divider space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-tertiary font-mono">
              Demographic Exposure Methodology &amp; Census Audit
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-canvas border border-divider">
                <span className="text-[10px] font-mono uppercase font-bold text-text-tertiary block">Ward Total Population</span>
                <span className="text-xl font-black text-text-primary font-mono block mt-1">
                  {selectedWardDossier?.populationEstimateTotal.toLocaleString() || "--"}
                </span>
                <span className="text-[10px] text-text-tertiary block mt-0.5">2011 BMC Census + 2026 Projection</span>
              </div>
              <div className="p-3.5 rounded-xl bg-canvas border border-divider">
                <span className="text-[10px] font-mono uppercase font-bold text-text-tertiary block">Estimated Spatial Exposure</span>
                <span className="text-xl font-black text-amber-600 font-mono block mt-1">
                  ~{selectedWardDossier?.estimatedExposedPopulation.toLocaleString() || "--"}
                </span>
                <span className="text-[10px] text-text-tertiary block mt-0.5">In Low-Lying Buffer (&le;5m ASL)</span>
              </div>
              <div className="p-3.5 rounded-xl bg-canvas border border-divider">
                <span className="text-[10px] font-mono uppercase font-bold text-text-tertiary block">Analytical Confidence</span>
                <span className="text-xl font-black text-emerald-600 block mt-1">Screening Buffer</span>
                <span className="text-[10px] text-text-tertiary block mt-0.5">Polygon Intersection (Non-Street)</span>
              </div>
            </div>
            <p className="text-[11px] text-text-tertiary italic leading-relaxed border-t border-divider pt-3">
              <strong>Mandatory Exposure Footnote:</strong> Population figures represent theoretical demographic spatial exposure within designated administrative ward polygons derived from 2011 Census aggregates and municipal development plans. This indicates potentially exposed residents in low-lying depression buffers, NOT confirmed casualties, evacuated, or displaced persons.
            </p>
          </div>

          {/* Infrastructure Assets Categorization Table */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-tertiary font-mono">
              Critical Infrastructure Categorization in Ward {selectedWardId}
            </h3>
            <div className="overflow-x-auto rounded-2xl border border-divider">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface border-b border-divider text-[10px] font-bold text-text-secondary uppercase">
                  <tr>
                    <th className="p-2.5">Asset Category</th>
                    <th className="p-2.5">Known Features in Database</th>
                    <th className="p-2.5">Intersecting Hazard Area</th>
                    <th className="p-2.5">Nearby Buffer (&lt;500m)</th>
                    <th className="p-2.5">Confirmed Affected</th>
                    <th className="p-2.5">Operational Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-divider bg-card">
                  <tr className="hover:bg-surface transition-colors">
                    <td className="p-2.5 font-bold text-text-primary">Tertiary Hospitals &amp; Trauma</td>
                    <td className="p-2.5 font-mono">{selectedWardDossier?.potentiallyExposedHospitals.length || 0}</td>
                    <td className="p-2.5 font-mono text-amber-600 font-bold">
                      {(selectedWardDossier?.potentiallyExposedHospitals.length || 0) > 0 ? 1 : 0}
                    </td>
                    <td className="p-2.5 font-mono">{selectedWardDossier?.potentiallyExposedHospitals.length || 0}</td>
                    <td className="p-2.5 font-mono font-bold text-text-tertiary">0 confirmed</td>
                    <td className="p-2.5 text-text-tertiary text-[11px]">Requires generator elevation check</td>
                  </tr>
                  <tr className="hover:bg-surface transition-colors">
                    <td className="p-2.5 font-bold text-text-primary">Arterial Road Corridors</td>
                    <td className="p-2.5 font-mono">{selectedWardDossier?.potentiallyExposedRoads.length || 0}</td>
                    <td className="p-2.5 font-mono text-amber-600 font-bold">
                      {selectedWardDossier?.potentiallyExposedRoads.length || 0}
                    </td>
                    <td className="p-2.5 font-mono">{selectedWardDossier?.potentiallyExposedRoads.length || 0}</td>
                    <td className="p-2.5 font-mono font-bold text-text-tertiary">0 confirmed</td>
                    <td className="p-2.5 text-text-tertiary text-[11px]">Traffic diversion protocols ready</td>
                  </tr>
                  <tr className="hover:bg-surface transition-colors">
                    <td className="p-2.5 font-bold text-text-primary">Stormwater Pumping Stations</td>
                    <td className="p-2.5 font-mono">{selectedWardDossier?.drainageAssets.pumpingStations.length || 0}</td>
                    <td className="p-2.5 font-mono text-emerald-600 font-bold">
                      {selectedWardDossier?.drainageAssets.pumpingStations.length || 0}
                    </td>
                    <td className="p-2.5 font-mono">{selectedWardDossier?.drainageAssets.pumpingStations.length || 0}</td>
                    <td className="p-2.5 font-mono font-bold text-text-tertiary">0 confirmed</td>
                    <td className="p-2.5 text-text-tertiary text-[11px]">Operating on diesel backup</td>
                  </tr>
                  <tr className="hover:bg-surface transition-colors">
                    <td className="p-2.5 font-bold text-text-primary">Topographic Saucer Basins</td>
                    <td className="p-2.5 font-mono">{selectedWardDossier?.saucerDepressions.length || 0}</td>
                    <td className="p-2.5 font-mono text-red-600 font-bold">
                      {selectedWardDossier?.saucerDepressions.length || 0}
                    </td>
                    <td className="p-2.5 font-mono">{selectedWardDossier?.saucerDepressions.length || 0}</td>
                    <td className="p-2.5 font-mono font-bold text-text-tertiary">0 confirmed</td>
                    <td className="p-2.5 text-text-tertiary text-[11px]">Copernicus DEM verified sink</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Known Hospitals List */}
          {selectedWardDossier && selectedWardDossier.potentiallyExposedHospitals.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-text-tertiary font-mono">
                Tertiary Medical Facilities in Ward {selectedWardId}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {selectedWardDossier.potentiallyExposedHospitals.map((h, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-surface border border-divider space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-text-primary">{h.name}</span>
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-mono bg-primary/10 text-primary">
                        {h.type}
                      </span>
                    </div>
                    <p className="text-[11px] text-text-tertiary">{h.address || "Ward Area Facility"}</p>
                    <span className="text-[10px] font-mono text-emerald-600 block">Status: NORMAL (Telemetry unconfirmed)</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ═════════════════════════════════════════════════════════ */}
        {/* SECTION G: RECOMMENDED MUNICIPAL ACTIONS                  */}
        {/* ═════════════════════════════════════════════════════════ */}
        <section id="sec-actions" className="bg-card rounded-3xl border border-divider shadow-sm p-6 sm:p-8 space-y-6 avoid-break">
          <div className="flex items-center justify-between border-b border-divider pb-4">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-mono font-bold text-sm">
                G
              </span>
              <div>
                <h2 className="text-lg font-black text-text-primary tracking-tight">Recommended Municipal Department Actions</h2>
                <span className="text-xs text-text-tertiary">Departmental Standard Operating Procedures &amp; Interventions</span>
              </div>
            </div>
            <span className="text-[10px] font-mono text-text-tertiary">Section G • Municipal Actions</span>
          </div>

          {/* Actions List by Department */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(dossier.recommendedActions || []).map((action: MunicipalActionItem) => (
              <div key={action.id} className="p-4 rounded-2xl bg-surface border border-divider space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-primary/10 text-primary border border-primary/20">
                      {action.departmentCode} • {action.departmentName}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[9px] font-bold font-mono text-white ${
                        action.priority === "CRITICAL"
                          ? "bg-red-600"
                          : action.priority === "HIGH"
                          ? "bg-orange-600"
                          : "bg-amber-600"
                      }`}
                    >
                      {action.priority}
                    </span>
                  </div>
                  <h4 className="text-xs font-black text-text-primary leading-snug">
                    {action.title}
                  </h4>
                  <p className="text-[11px] text-text-secondary leading-relaxed">
                    {action.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-divider space-y-1 text-[10px] font-mono text-text-tertiary">
                  <div><strong>Phase:</strong> {action.phase}</div>
                  <div><strong>Supporting Evidence:</strong> {action.supportingEvidence}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Legal Non-Dispatch Disclaimer */}
          <div className="p-4 rounded-2xl bg-surface-elevated border border-divider text-xs text-text-tertiary leading-relaxed space-y-1">
            <span className="font-bold text-text-secondary uppercase tracking-wider text-[10px] font-mono block">
              Administrative Discretion &amp; Non-Dispatch Policy
            </span>
            <p>
              The recommendations above are decision-support guidelines synthesized from physical scenario conditions and municipal standard operating procedures. Sentinel does NOT automatically dispatch emergency personnel, alter traffic signaling, or trigger public evacuations without affirmative manual command authorization.
            </p>
          </div>
        </section>

        {/* ═════════════════════════════════════════════════════════ */}
        {/* SECTION H: LIMITATIONS & GOVERNANCE                       */}
        {/* ═════════════════════════════════════════════════════════ */}
        <section id="sec-governance" className="bg-card rounded-3xl border border-divider shadow-sm p-6 sm:p-8 space-y-6 avoid-break">
          <div className="flex items-center justify-between border-b border-divider pb-4">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-mono font-bold text-sm">
                H
              </span>
              <div>
                <h2 className="text-lg font-black text-text-primary tracking-tight">Data Limitations, Provenance &amp; Governance</h2>
                <span className="text-xs text-text-tertiary">Source Catalogues &amp; Multi-Role Analytical Audits</span>
              </div>
            </div>
            <span className="text-[10px] font-mono text-text-tertiary">Section H • Governance</span>
          </div>

          {/* Source References Table */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-tertiary font-mono">
              Authoritative Source Datasets
            </h3>
            <div className="overflow-x-auto rounded-2xl border border-divider">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface border-b border-divider text-[10px] font-bold text-text-secondary uppercase">
                  <tr>
                    <th className="p-2.5">Dataset</th>
                    <th className="p-2.5">Publisher</th>
                    <th className="p-2.5">License / Provenance</th>
                    <th className="p-2.5">Retrieval Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-divider bg-card">
                  {gov.sourceReferences.map((s) => (
                    <tr key={s.id} className="hover:bg-surface transition-colors">
                      <td className="p-2.5 font-semibold text-text-primary">{s.title}</td>
                      <td className="p-2.5 text-text-secondary">{s.publisher}</td>
                      <td className="p-2.5 text-text-tertiary font-mono">{s.licenseOrProvenance}</td>
                      <td className="p-2.5 text-text-tertiary font-mono">{s.retrievalDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Multi-Role Analytical Audit Cards */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-tertiary font-mono">
              Multi-Role Analytical Engine Governance
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                gov.aiGovernance.role1EvidenceAnalyst,
                gov.aiGovernance.role2ImpactAnalyst,
                gov.aiGovernance.role3ReportEditor,
              ].map((role) => (
                <div key={role.roleIndex} className="p-3.5 rounded-2xl bg-surface border border-divider space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-text-primary">{role.roleName}</span>
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      ● {role.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-text-tertiary space-y-0.5 font-mono">
                    <div>Model: {role.modelConfigured}</div>
                    <div>Execution: {role.executionTimeMs} ms</div>
                    <div>Grounding Verified: {role.groundingVerification.sourceIdsVerified.length} sources</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═════════════════════════════════════════════════════════ */}
        {/* SECTION I: MULTI-WARD COMPARATIVE INTELLIGENCE            */}
        {/* ═════════════════════════════════════════════════════════ */}
        {reportScope === "comparative" && (
          <section className="bg-card rounded-3xl border border-divider shadow-sm p-6 sm:p-8 space-y-6 avoid-break animate-fadeIn">
            <div className="flex items-center justify-between border-b border-divider pb-4">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-mono font-bold text-sm">
                  I
                </span>
                <div>
                  <h2 className="text-lg font-black text-text-primary tracking-tight">Multi-Ward Comparative Intelligence</h2>
                  <span className="text-xs text-text-tertiary">Side-by-Side Spatial, Topographic &amp; Demographic Comparison</span>
                </div>
              </div>

              {/* Selector for Secondary Ward */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-text-secondary">Compare Against:</span>
                <select
                  value={comparisonWardId}
                  onChange={(e) => setComparisonWardId(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-divider bg-surface text-text-primary text-xs font-bold focus:outline-hidden cursor-pointer"
                >
                  {CANONICAL_MUMBAI_WARDS.map((w) => (
                    <option key={w.id} value={w.id}>
                      Ward {w.id} — {w.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Side-by-Side Comparison Table */}
            <div className="overflow-x-auto rounded-2xl border border-divider">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface border-b border-divider text-[10px] font-bold text-text-secondary uppercase">
                  <tr>
                    <th className="p-3">Attribute / Metric</th>
                    <th className="p-3 bg-primary/5 text-primary">Ward {selectedWardId} ({selectedWardDossier?.wardName})</th>
                    <th className="p-3 bg-surface-elevated">Ward {comparisonWardId} ({comparisonWardDossier?.wardName})</th>
                    <th className="p-3">Citywide Average / Standard</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-divider bg-card">
                  <tr className="hover:bg-surface">
                    <td className="p-3 font-semibold text-text-secondary">Zone &amp; Administration</td>
                    <td className="p-3 font-bold text-primary bg-primary/5">{selectedWardDossier?.zone}</td>
                    <td className="p-3 bg-surface-elevated">{comparisonWardDossier?.zone}</td>
                    <td className="p-3 text-text-tertiary">Zones I – VII</td>
                  </tr>
                  <tr className="hover:bg-surface">
                    <td className="p-3 font-semibold text-text-secondary">Geographic Area</td>
                    <td className="p-3 font-bold text-primary bg-primary/5">~{selectedWardDossier?.geographicAreaSqKm} km²</td>
                    <td className="p-3 bg-surface-elevated">~{comparisonWardDossier?.geographicAreaSqKm} km²</td>
                    <td className="p-3 text-text-tertiary">~18.2 km² (Average)</td>
                  </tr>
                  <tr className="hover:bg-surface">
                    <td className="p-3 font-semibold text-text-secondary">Mean Elevation</td>
                    <td className="p-3 font-mono font-bold text-primary bg-primary/5">
                      ~{selectedWardDossier?.elevationMeanM}m ASL
                    </td>
                    <td className="p-3 font-mono bg-surface-elevated">
                      ~{comparisonWardDossier?.elevationMeanM}m ASL
                    </td>
                    <td className="p-3 font-mono text-text-tertiary">~10.5m ASL (City Mean)</td>
                  </tr>
                  <tr className="hover:bg-surface">
                    <td className="p-3 font-semibold text-text-secondary">Susceptibility Score</td>
                    <td className="p-3 font-mono font-bold text-primary bg-primary/5">
                      {selectedWardDossier?.score} / 100
                    </td>
                    <td className="p-3 font-mono bg-surface-elevated">
                      {comparisonWardDossier?.score} / 100
                    </td>
                    <td className="p-3 font-mono text-text-tertiary">Mean: {city.citywideMeanScore}</td>
                  </tr>
                  <tr className="hover:bg-surface">
                    <td className="p-3 font-semibold text-text-secondary">Saucer Depression Basins</td>
                    <td className="p-3 font-mono font-bold text-primary bg-primary/5">
                      {selectedWardDossier?.saucerDepressions.length} verified basins
                    </td>
                    <td className="p-3 font-mono bg-surface-elevated">
                      {comparisonWardDossier?.saucerDepressions.length} verified basins
                    </td>
                    <td className="p-3 font-mono text-text-tertiary">Threshold &ge; 0.5m depth</td>
                  </tr>
                  <tr className="hover:bg-surface">
                    <td className="p-3 font-semibold text-text-secondary">Resident Population (2011 + 2026)</td>
                    <td className="p-3 font-mono font-bold text-primary bg-primary/5">
                      {selectedWardDossier?.populationEstimateTotal.toLocaleString()}
                    </td>
                    <td className="p-3 font-mono bg-surface-elevated">
                      {comparisonWardDossier?.populationEstimateTotal.toLocaleString()}
                    </td>
                    <td className="p-3 font-mono text-text-tertiary">~520,000 / ward</td>
                  </tr>
                  <tr className="hover:bg-surface">
                    <td className="p-3 font-semibold text-text-secondary">Estimated Low-Lying Exposure</td>
                    <td className="p-3 font-mono font-bold text-primary bg-primary/5">
                      ~{selectedWardDossier?.estimatedExposedPopulation.toLocaleString()}
                    </td>
                    <td className="p-3 font-mono bg-surface-elevated">
                      ~{comparisonWardDossier?.estimatedExposedPopulation.toLocaleString()}
                    </td>
                    <td className="p-3 font-mono text-text-tertiary">~18% buffer average</td>
                  </tr>
                  <tr className="hover:bg-surface">
                    <td className="p-3 font-semibold text-text-secondary">Chronic Hotspots Count</td>
                    <td className="p-3 font-mono font-bold text-primary bg-primary/5">
                      {selectedWardDossier?.historicalHotspots.length} spots
                    </td>
                    <td className="p-3 font-mono bg-surface-elevated">
                      {comparisonWardDossier?.historicalHotspots.length} spots
                    </td>
                    <td className="p-3 font-mono text-text-tertiary">35 Total Catalogued</td>
                  </tr>
                  <tr className="hover:bg-surface">
                    <td className="p-3 font-semibold text-text-secondary">Tertiary Medical Centers</td>
                    <td className="p-3 font-mono font-bold text-primary bg-primary/5">
                      {selectedWardDossier?.potentiallyExposedHospitals.length} facilities
                    </td>
                    <td className="p-3 font-mono bg-surface-elevated">
                      {comparisonWardDossier?.potentiallyExposedHospitals.length} facilities
                    </td>
                    <td className="p-3 font-mono text-text-tertiary">20 Catalogued</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>

      {/* ─── DRAFT ADMINISTRATIVE ADVISORY MODAL (Contextual Action) ─── */}
      {isAdvisoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl bg-card rounded-3xl border border-divider shadow-2xl p-6 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-divider pb-3">
              <div className="flex items-center gap-2">
                <FileTextIcon size={18} className="text-primary" />
                <h3 className="text-sm font-black text-text-primary uppercase tracking-tight font-mono">
                  Draft Administrative Emergency Advisory
                </h3>
              </div>
              <button
                onClick={() => setIsAdvisoryModalOpen(false)}
                className="w-7 h-7 rounded-lg hover:bg-surface text-text-tertiary hover:text-text-primary flex items-center justify-center text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-text-secondary">
              Pre-formatted operational briefing text ready for review or distribution to Municipal Disaster Management officers and department heads.
            </p>

            <div className="flex-1 overflow-y-auto p-4 rounded-2xl bg-surface border border-divider font-mono text-xs text-text-primary leading-relaxed whitespace-pre-wrap select-all">
              {advisoryDraftText}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-divider">
              <span className="text-[10px] text-text-tertiary font-mono">
                Mandatory non-dispatch legal disclaimer included in draft.
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyAdvisory}
                  className="px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedAdvisory ? (
                    <>
                      <CheckIcon size={14} />
                      <span>Copied to Clipboard!</span>
                    </>
                  ) : (
                    <span>Copy Advisory Text</span>
                  )}
                </button>
                <button
                  onClick={() => setIsAdvisoryModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl border border-divider bg-surface hover:bg-surface-elevated font-bold text-xs text-text-secondary cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── AI AUDITS & UNRESOLVED WARNINGS MODAL ─── */}
      {isAiAuditModalOpen && (
        <div id="ai-audit-modal" role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-3xl bg-card rounded-3xl border border-divider shadow-2xl p-6 space-y-5 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-divider pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlertIcon size={20} className="text-primary" />
                <div>
                  <h3 className="text-sm font-black text-text-primary uppercase tracking-tight font-mono">
                    Three-Role Groq AI Orchestration &amp; Grounding Audits
                  </h3>
                  <span className="text-[10px] text-text-tertiary font-mono">
                    State: {gov.aiGovernance.overallAIState} • Pipeline Duration: {gov.aiGovernance.orchestrationDurationMs}ms
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsAiAuditModalOpen(false)}
                className="w-7 h-7 rounded-lg hover:bg-surface text-text-tertiary hover:text-text-primary flex items-center justify-center text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {/* Role Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  gov.aiGovernance.role1EvidenceAnalyst,
                  gov.aiGovernance.role2ImpactAnalyst,
                  gov.aiGovernance.role3ReportEditor,
                ].map((role) => (
                  <div key={role.roleIndex} className="p-4 rounded-2xl bg-surface border border-divider space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-text-primary">{role.roleName}</span>
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-bold ${
                        role.status === "OPERATIONAL"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : role.status === "FAILED_AUTH"
                          ? "bg-red-500/10 text-red-600 dark:text-red-400"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      }`}>
                        ● {role.status}
                      </span>
                    </div>

                    <div className="text-[11px] text-text-secondary space-y-1 font-mono pt-1 border-t border-divider">
                      <div><strong>Configured:</strong> {role.modelConfigured}</div>
                      <div><strong>Executed:</strong> {role.modelUsed}</div>
                      <div><strong>Env Var:</strong> {role.envVarReferenced}</div>
                      <div><strong>Latency:</strong> {role.executionTimeMs} ms</div>
                      <div><strong>Verified Sources:</strong> {role.groundingVerification.sourceIdsVerified.length}</div>
                      <div><strong>Claims Rejected:</strong> {role.groundingVerification.unsupportedClaimsRejected}</div>
                      <div><strong>Flags:</strong> {role.groundingVerification.contradictionsFlagged}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Verified Sources Reference List */}
              <div className="p-4 rounded-2xl bg-surface border border-divider space-y-2 text-xs">
                <h4 className="font-bold text-text-primary uppercase tracking-wider text-[10px] font-mono">
                  Grounded Municipal Evidence Sources
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {gov.sourceReferences.map((s) => (
                    <span key={s.id} className="px-2.5 py-1 rounded-lg bg-surface-elevated border border-divider text-[10px] font-mono text-text-secondary">
                      {s.id}: {s.title}
                    </span>
                  ))}
                </div>
              </div>

              {/* Contradiction Flags & Editorial Review */}
              <div className="p-4 rounded-2xl bg-surface-elevated border border-divider space-y-2 text-xs">
                <h4 className="font-bold text-text-primary uppercase tracking-wider text-[10px] font-mono flex items-center justify-between">
                  <span>Editorial Review &amp; Unsupported Claim Interceptions</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                    ✓ Verified Grounding Invariants
                  </span>
                </h4>
                <p className="text-[11px] text-text-secondary leading-relaxed">
                  The Sentinel validation engine verifies all AI outputs against deterministic calculations before report rendering. Any claims of unconfirmed casualties, submerged hospitals without telemetry, or mismatched ward IDs are intercepted and sanitized.
                </p>
                <div className="pt-2 border-t border-divider text-[10px] font-mono text-text-tertiary">
                  Zero ungrounded risk numbers permitted in municipal dossiers.
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-divider">
              <span className="text-[10px] text-text-tertiary font-mono">
                Safe logging active: Credentials and personal data are never rendered or transmitted to browser.
              </span>
              <button
                onClick={() => setIsAiAuditModalOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs cursor-pointer hover:bg-primary-hover transition-colors"
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── DOSSIER ARCHIVE & RUN HISTORY MODAL ─── */}
      {isHistoryOpen && (
        <div id="dossier-history-modal" role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-4xl bg-card rounded-3xl border border-divider shadow-2xl p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-divider pb-3">
              <div className="flex items-center gap-2.5">
                <ClockIcon size={20} className="text-primary" />
                <div>
                  <h3 className="text-base font-black text-text-primary tracking-tight">
                    Simulation Dossier Archive &amp; Run History
                  </h3>
                  <p className="text-xs text-text-tertiary">
                    Inspect, compare, and recover previously executed simulation dossiers without recalculating.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="w-7 h-7 rounded-lg hover:bg-surface text-text-tertiary hover:text-text-primary flex items-center justify-center text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Search Filter */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <input
                  id="input-history-search"
                  type="text"
                  placeholder="Filter by scenario name, ward, or document ID..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="w-full text-xs bg-surface border border-divider rounded-xl px-3 py-2 text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <button
                onClick={loadHistoryList}
                className="px-3 py-2 rounded-xl border border-divider bg-surface hover:bg-surface-elevated text-xs font-bold flex items-center gap-1.5 cursor-pointer text-text-primary"
                title="Refresh history from server"
              >
                <RefreshCwIcon size={12} className={loadingHistory ? "animate-spin" : ""} />
                <span>Refresh</span>
              </button>
            </div>

            {/* History Table */}
            <div className="flex-1 overflow-y-auto border border-divider rounded-2xl bg-surface/40">
              {loadingHistory ? (
                <div className="p-12 flex flex-col items-center justify-center space-y-2">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-text-tertiary">Loading archived dossiers...</span>
                </div>
              ) : filteredHistory.length === 0 ? (
                <div className="p-12 text-center text-xs text-text-tertiary">
                  No dossiers found matching filter.
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-surface-elevated text-[10px] uppercase font-bold text-text-tertiary border-b border-divider">
                    <tr>
                      <th className="p-3">Dossier ID</th>
                      <th className="p-3">Scenario / Horizon</th>
                      <th className="p-3">Generated</th>
                      <th className="p-3">Alert Status</th>
                      <th className="p-3">Peak Risk Ward</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-divider font-mono">
                    {filteredHistory.map((item) => {
                      const isCurrent = item.dossierId === dossier?.dossierId;
                      return (
                        <tr
                          key={item.dossierId}
                          className={`hover:bg-surface-elevated/70 transition-colors ${
                            isCurrent ? "bg-primary/5" : ""
                          }`}
                        >
                          <td className="p-3 font-bold text-text-primary">
                            <span className="block truncate max-w-[140px]" title={item.dossierId}>
                              {item.dossierId}
                            </span>
                            {isCurrent && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-primary/20 text-primary font-bold">
                                CURRENT
                              </span>
                            )}
                          </td>
                          <td className="p-3 font-sans">
                            <span className="font-bold text-text-primary block">{item.scenarioTitle}</span>
                            <span className="text-[10px] text-text-tertiary font-mono">T+{item.timeStepHours}h Horizon</span>
                          </td>
                          <td className="p-3 text-text-secondary text-[11px]">
                            {new Date(item.generatedAtIso).toLocaleString("en-IN", {
                              timeZone: "Asia/Kolkata",
                              dateStyle: "short",
                              timeStyle: "short",
                            })}
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                item.overallAlertLevel === "RED_WARNING"
                                  ? "bg-red-500/15 text-red-600 border border-red-500/30"
                                  : item.overallAlertLevel === "ORANGE_ALERT"
                                  ? "bg-amber-500/15 text-amber-600 border border-amber-500/30"
                                  : item.overallAlertLevel === "YELLOW_WATCH"
                                  ? "bg-yellow-500/15 text-yellow-600 border border-yellow-500/30"
                                  : "bg-emerald-500/15 text-emerald-600 border border-emerald-500/30"
                              }`}
                            >
                              {item.overallAlertLevel.replace("_", " ")}
                            </span>
                          </td>
                          <td className="p-3 font-sans">
                            <span className="font-semibold text-text-primary">{item.peakWardName}</span>
                            <span className="text-[10px] font-mono text-text-tertiary block">
                              Score: {item.peakScore}/100
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleSelectHistoryDossier(item.dossierId)}
                              disabled={isCurrent}
                              className={`px-2.5 py-1 rounded-xl font-bold text-xs font-sans transition-colors cursor-pointer ${
                                isCurrent
                                  ? "opacity-40 cursor-not-allowed bg-surface border border-divider text-text-tertiary"
                                  : "bg-primary text-white hover:bg-primary-hover shadow-xs"
                              }`}
                            >
                              {isCurrent ? "Active" : "Load Report"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-text-tertiary pt-2 border-t border-divider">
              <span>{historyList.length} archived runs available in persistent storage.</span>
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="px-4 py-1.5 rounded-xl border border-divider bg-surface hover:bg-surface-elevated font-bold text-text-primary cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 4. Report-Aware AI Q&A Slide-over Drawer (Phase 7) ─── */}
      {isReportQaOpen && (
        <div
          className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end"
          role="dialog"
          aria-modal="true"
          aria-labelledby="report-qa-title"
        >
          <div className="w-full max-w-xl bg-surface border-l border-divider h-full flex flex-col shadow-2xl overflow-hidden font-sans">
            {/* Drawer Header */}
            <div className="shrink-0 p-4 border-b border-divider bg-surface-elevated flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary/15 text-primary border border-primary/25 flex items-center justify-center font-bold text-base">
                  🤖
                </div>
                <div>
                  <h3 id="report-qa-title" className="font-bold text-sm text-text-primary flex items-center gap-2">
                    <span>Report AI Advisor</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-primary/20 text-primary">
                      Role 3 Active
                    </span>
                  </h3>
                  <p className="text-[11px] text-text-secondary font-mono truncate max-w-xs">
                    Snapshot: {dossier.dossierId} · T+{dossier.timeStepHours}h
                  </p>
                </div>
              </div>

              <button
                id="btn-close-report-qa"
                onClick={() => setIsReportQaOpen(false)}
                className="p-1.5 rounded-xl hover:bg-surface border border-divider text-text-tertiary hover:text-text-primary text-sm font-bold cursor-pointer transition-colors"
                title="Close Report AI drawer"
              >
                ✕
              </button>
            </div>

            {/* Out-of-Date Warning (if applicable) */}
            {isScenarioOutOfDate && (
              <div className="shrink-0 p-3 bg-amber-500/10 border-b border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2">
                <span className="text-sm">⚠️</span>
                <p className="text-[11px] leading-snug">
                  <strong>Notice:</strong> Simulation inputs have changed since this dossier was compiled. The AI is answering strictly from this saved report snapshot.
                </p>
              </div>
            )}

            {/* Scrollable Q&A History */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {reportQaMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 rounded-lg bg-primary/15 text-primary border border-primary/25 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      🤖
                    </div>
                  )}

                  <div
                    className={`max-w-[88%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed overflow-hidden break-words ${
                      msg.role === "user"
                        ? "bg-primary text-white rounded-br-xs shadow-xs font-medium"
                        : "bg-surface-elevated border border-divider text-text-primary rounded-bl-xs shadow-2xs"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-text-tertiary mb-1 font-mono">
                      <span>{msg.role === "user" ? "Administrator" : "Sentinel Report Advisor"}</span>
                      <span>{msg.timestamp}</span>
                    </div>

                    {msg.role === "user" ? (
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    ) : (
                      <MarkdownView content={msg.content} />
                    )}

                    {/* Cited Sections & Sources */}
                    {msg.citedSections && msg.citedSections.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-divider/60 flex flex-wrap gap-1 items-center text-[10px]">
                        <span className="text-text-tertiary font-mono">Cites:</span>
                        {msg.citedSections.map((sec, sIdx) => (
                          <span
                            key={sIdx}
                            className="px-1.5 py-0.2 rounded bg-surface border border-divider text-text-secondary font-mono"
                          >
                            § {sec}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Role Audit Tag */}
                    {msg.roleAudit && (
                      <div className="mt-2 text-[9px] font-mono text-text-tertiary text-right">
                        {msg.roleAudit.modelUsed} · {msg.roleAudit.executionTimeMs}ms
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {reportQaLoading && (
                <div className="flex gap-2.5 justify-start">
                  <div className="w-7 h-7 rounded-lg bg-primary/15 text-primary border border-primary/25 flex items-center justify-center font-bold text-xs shrink-0">
                    🤖
                  </div>
                  <div className="p-3 rounded-2xl bg-surface-elevated border border-divider text-xs text-text-secondary flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                    <span>Cross-referencing ward rankings and spatial DEM...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Prompt Suggestion Chips */}
            <div className="shrink-0 p-3 border-t border-divider bg-surface-elevated/50 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {[
                `Why is Ward ${selectedWardId} ranked highest?`,
                "What data is missing or stale?",
                "Which critical assets require immediate review?",
                "Explain the runoff formulas used",
                "What administrative actions should be taken first?",
              ].map((chip, cIdx) => (
                <button
                  key={cIdx}
                  type="button"
                  onClick={() => handleSendReportQa(chip)}
                  disabled={reportQaLoading}
                  className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-surface hover:bg-surface-elevated text-text-secondary hover:text-text-primary border border-divider whitespace-nowrap transition-colors cursor-pointer shrink-0"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Bottom Composer */}
            <div className="shrink-0 p-3 border-t border-divider bg-surface flex items-center gap-2">
              <input
                id="input-report-qa"
                type="text"
                value={reportQaInput}
                onChange={(e) => setReportQaInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendReportQa();
                  }
                }}
                placeholder="Ask about this simulation report, ward scores, or formulas..."
                disabled={reportQaLoading}
                className="flex-1 bg-surface-elevated border border-divider rounded-xl px-3 py-2 text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-primary transition-colors"
              />
              <button
                id="btn-send-report-qa"
                onClick={() => handleSendReportQa()}
                disabled={!reportQaInput.trim() || reportQaLoading}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  reportQaInput.trim() && !reportQaLoading
                    ? "bg-primary text-white hover:bg-primary-hover shadow-xs"
                    : "bg-surface-elevated text-text-tertiary opacity-50 cursor-not-allowed border border-divider"
                }`}
              >
                Ask →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
