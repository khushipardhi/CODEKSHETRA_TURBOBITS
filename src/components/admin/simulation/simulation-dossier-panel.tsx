/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Canonical Simulation Dossier Panel
   Phase 3: Interactive 7-Section Municipal Dossier Studio
   ════════════════════════════════════════════════════════ */

"use client";

import React, { useState, useEffect, useMemo } from "react";
import type { CanonicalSimulationDossier } from "@/modules/dossier/contracts";
import type { SimulationTimeStepOutput } from "@/modules/simulation/contracts";

interface IconProps {
  size?: number;
  className?: string;
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

function SparklesIcon({ size = 16, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z" />
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

function CrosshairIcon({ size = 16, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <line x1="22" y1="12" x2="18" y2="12" />
      <line x1="6" y1="12" x2="2" y2="12" />
      <line x1="12" y1="6" x2="12" y2="2" />
      <line x1="12" y1="22" x2="12" y2="18" />
    </svg>
  );
}

interface SimulationDossierPanelProps {
  simOutput: SimulationTimeStepOutput;
  selectedWardId: string;
  onSelectWard: (wardId: string) => void;
  onHighlightWardOnMap?: (wardId: string) => void;
}

export function SimulationDossierPanel({
  simOutput,
  selectedWardId,
  onSelectWard,
  onHighlightWardOnMap,
}: SimulationDossierPanelProps) {
  const [dossier, setDossier] = useState<CanonicalSimulationDossier | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [viewScope, setViewScope] = useState<"citywide" | "ward_detail">("citywide");
  const [activeSection, setActiveSection] = useState<
    "exec" | "inputs" | "meth" | "city" | "ward" | "actions" | "provenance"
  >("exec");
  const [exportFormatOpen, setExportFormatOpen] = useState<boolean>(false);

  // Generate or regenerate dossier
  const handleGenerateDossier = async (forceDeterministic: boolean = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/simulation/dossier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenarioId: simOutput.activeScenarioId,
          parametersApplied: simOutput.parametersApplied,
          timeStepHours: simOutput.timeStepHours,
          selectedWardId,
          forceDeterministic,
        }),
      });

      const data = await res.json();
      if (data.success && data.dossier) {
        setDossier(data.dossier);
      } else {
        throw new Error(data.error || "Failed to generate simulation dossier");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Auto-generate initial deterministic dossier on first mount
  useEffect(() => {
    if (!dossier) {
      handleGenerateDossier(false);
    }
  }, [simOutput.activeScenarioId]);

  // Handle export download
  const handleExport = (format: "markdown" | "csv" | "json") => {
    if (!dossier) return;
    setExportFormatOpen(false);

    if (format === "json") {
      const blob = new Blob([JSON.stringify(dossier, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${dossier.dossierId}.json`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    window.open(
      `/api/admin/simulation/dossier?dossierId=${dossier.dossierId}&format=${format}`,
      "_blank"
    );
  };

  const isStale = useMemo(() => {
    if (!dossier) return false;
    if (dossier.scenarioId !== simOutput.activeScenarioId) return true;
    if (Math.abs(dossier.timeStepHours - simOutput.timeStepHours) > 0.01) return true;
    if (dossier.parametersApplied && simOutput.parametersApplied) {
      for (const [k, v] of Object.entries(simOutput.parametersApplied)) {
        if (dossier.parametersApplied[k] !== undefined && dossier.parametersApplied[k] !== v) {
          return true;
        }
      }
    }
    return false;
  }, [dossier, simOutput]);

  return (
    <div className="space-y-4 text-text-primary">
      {/* Dossier Studio Header & Controls */}
      <div className="p-3.5 rounded-2xl border border-divider bg-surface space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <FileTextIcon size={16} />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-text-primary">
                Simulation Dossier Studio
              </h3>
              <span className="text-[10px] text-text-tertiary font-mono block">
                Phase 3 Evidence-Grounded Municipal Intelligence
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Export Dropdown */}
            <div className="relative">
              <button
                onClick={() => setExportFormatOpen(!exportFormatOpen)}
                disabled={!dossier || loading}
                className="px-2.5 py-1.5 rounded-xl border border-divider bg-surface-elevated hover:bg-surface text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <DownloadIcon size={13} />
                <span>Export</span>
              </button>

              {exportFormatOpen && (
                <div className="absolute right-0 mt-1 w-44 rounded-xl border border-divider bg-surface shadow-xl py-1 z-30 text-xs">
                  <button
                    onClick={() => handleExport("markdown")}
                    className="w-full px-3 py-2 text-left hover:bg-surface-elevated flex items-center justify-between"
                  >
                    <span>Markdown Report</span>
                    <span className="text-[10px] font-mono text-text-tertiary">.md</span>
                  </button>
                  <button
                    onClick={() => handleExport("csv")}
                    className="w-full px-3 py-2 text-left hover:bg-surface-elevated flex items-center justify-between"
                  >
                    <span>Municipal CSV</span>
                    <span className="text-[10px] font-mono text-text-tertiary">.csv</span>
                  </button>
                  <button
                    onClick={() => handleExport("json")}
                    className="w-full px-3 py-2 text-left hover:bg-surface-elevated flex items-center justify-between"
                  >
                    <span>Structured JSON</span>
                    <span className="text-[10px] font-mono text-text-tertiary">.json</span>
                  </button>
                </div>
              )}
            </div>

            {/* Generate Button */}
            <button
              onClick={() => handleGenerateDossier(false)}
              disabled={loading}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50"
            >
              <SparklesIcon size={13} />
              <span>{loading ? "Synthesizing..." : "Run AI Dossier"}</span>
            </button>
          </div>
        </div>

        {/* Stale Warning Banner */}
        {isStale && (
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangleIcon size={14} className="shrink-0" />
              <span>
                Scenario parameters or time step modified since last dossier generation.
              </span>
            </div>
            <button
              onClick={() => handleGenerateDossier(false)}
              className="text-[11px] font-bold underline hover:no-underline shrink-0"
            >
              Refresh Dossier
            </button>
          </div>
        )}

        {/* 3-Role AI Governance Health Bar */}
        {dossier && (
          <div className="grid grid-cols-3 gap-1.5 text-[10px] font-mono pt-1 border-t border-divider">
            <div className="p-2 rounded-lg bg-surface-elevated border border-divider space-y-0.5">
              <div className="flex items-center justify-between text-text-tertiary font-bold">
                <span>ROLE 1: EVIDENCE</span>
                <span
                  className={
                    dossier.limitationsAndGovernance.aiGovernance.role1EvidenceAnalyst.status ===
                    "OPERATIONAL"
                      ? "text-emerald-500"
                      : "text-amber-500"
                  }
                >
                  ● {dossier.limitationsAndGovernance.aiGovernance.role1EvidenceAnalyst.status}
                </span>
              </div>
              <span className="text-text-primary block truncate">
                {dossier.limitationsAndGovernance.aiGovernance.role1EvidenceAnalyst.modelUsed}
              </span>
            </div>

            <div className="p-2 rounded-lg bg-surface-elevated border border-divider space-y-0.5">
              <div className="flex items-center justify-between text-text-tertiary font-bold">
                <span>ROLE 2: IMPACT</span>
                <span
                  className={
                    dossier.limitationsAndGovernance.aiGovernance.role2ImpactAnalyst.status ===
                    "OPERATIONAL"
                      ? "text-emerald-500"
                      : "text-amber-500"
                  }
                >
                  ● {dossier.limitationsAndGovernance.aiGovernance.role2ImpactAnalyst.status}
                </span>
              </div>
              <span className="text-text-primary block truncate">
                {dossier.limitationsAndGovernance.aiGovernance.role2ImpactAnalyst.modelUsed}
              </span>
            </div>

            <div className="p-2 rounded-lg bg-surface-elevated border border-divider space-y-0.5">
              <div className="flex items-center justify-between text-text-tertiary font-bold">
                <span>ROLE 3: EDITOR</span>
                <span
                  className={
                    dossier.limitationsAndGovernance.aiGovernance.role3ReportEditor.status ===
                    "OPERATIONAL"
                      ? "text-emerald-500"
                      : "text-amber-500"
                  }
                >
                  ● {dossier.limitationsAndGovernance.aiGovernance.role3ReportEditor.status}
                </span>
              </div>
              <span className="text-text-primary block truncate">
                {dossier.limitationsAndGovernance.aiGovernance.role3ReportEditor.modelUsed}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Scope Switcher: City-Wide vs Ward Detailed */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-surface-elevated border border-divider text-xs">
        <button
          onClick={() => {
            setViewScope("citywide");
            setActiveSection("exec");
          }}
          className={`flex-1 py-1.5 rounded-lg font-bold text-center transition-colors ${
            viewScope === "citywide"
              ? "bg-surface text-primary shadow-xs"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          City-Wide Overview (24 Wards)
        </button>
        <button
          onClick={() => {
            setViewScope("ward_detail");
            setActiveSection("ward");
          }}
          className={`flex-1 py-1.5 rounded-lg font-bold text-center transition-colors ${
            viewScope === "ward_detail"
              ? "bg-surface text-primary shadow-xs"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          Ward Detailed: Ward {selectedWardId}
        </button>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 pb-1 text-[11px] font-mono">
        {[
          { id: "exec", num: "A", label: "Executive Summary" },
          { id: "inputs", num: "B", label: "Inputs & Conditions" },
          { id: "meth", num: "C", label: "Scientific Trace" },
          { id: "city", num: "D", label: "Citywide Screening" },
          { id: "ward", num: "E", label: "Ward Deep-Dive" },
          { id: "actions", num: "F", label: "Municipal Actions" },
          { id: "provenance", num: "G", label: "Data Provenance" },
        ].map((sec) => (
          <button
            key={sec.id}
            onClick={() => setActiveSection(sec.id as any)}
            className={`px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all text-xs cursor-pointer ${
              activeSection === sec.id
                ? "bg-primary text-white shadow-sm border border-primary font-black"
                : "bg-surface border border-border text-text-secondary hover:text-text-primary hover:bg-surface-1"
            }`}
          >
            <span
              className={`w-4 h-4 rounded-full text-[10px] font-mono font-bold flex items-center justify-center ${
                activeSection === sec.id
                  ? "bg-white/20 text-white"
                  : "bg-surface-2 text-text-tertiary"
              }`}
            >
              {sec.num}
            </span>
            <span>{sec.label}</span>
          </button>
        ))}
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="p-8 rounded-2xl border border-divider bg-surface text-center space-y-3">
          <div className="w-8 h-8 mx-auto border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-text-primary">
            Orchestrating 3-Role Groq Municipal Pipeline...
          </p>
          <span className="text-[11px] text-text-secondary block">
            Evidence Analyst (Role 1) → Impact Analyst (Role 2) → Report Editor (Role 3)
          </span>
        </div>
      )}

      {/* Error Banner */}
      {error && !loading && (
        <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs space-y-1">
          <span className="font-bold block">Dossier Generation Error</span>
          <p className="text-[11px] leading-tight">{error}</p>
        </div>
      )}

      {/* Active Section Content */}
      {dossier && !loading && (
        <div className="space-y-4">
          {/* SECTION A: EXECUTIVE SUMMARY */}
          {activeSection === "exec" && (
            <div className="space-y-3">
              {/* Context Card */}
              <div className="p-3.5 rounded-2xl border border-divider bg-surface space-y-2">
                <div className="flex items-center justify-between text-[10px] font-mono text-text-tertiary">
                  <span>DOC: {dossier.dossierId}</span>
                  <span>T={dossier.timeStepHours}h (IST)</span>
                </div>
                <h4 className="text-sm font-black text-text-primary">
                  {dossier.executiveSummary.scenarioTitle}
                </h4>
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2 py-0.5 rounded-md bg-red-500/10 text-red-600 dark:text-red-400 font-bold font-mono">
                    {dossier.executiveSummary.overallAlertLevel}
                  </span>
                  <span className="text-text-secondary text-[11px]">
                    {dossier.executiveSummary.modelTier} • {dossier.executiveSummary.modelVersion}
                  </span>
                </div>
              </div>

              {/* Verified Key Findings */}
              <div className="p-3.5 rounded-2xl border border-divider bg-surface space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary font-mono block">
                  Executive Briefing Findings
                </span>
                <ul className="space-y-1.5 text-xs text-text-primary leading-relaxed">
                  {dossier.executiveSummary.keyFindings.map((finding, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-primary font-bold shrink-0 mt-0.5">●</span>
                      <span>{finding}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Priority Intervention Wards Table */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary font-mono block">
                  Top Priority Wards (Interactive Navigation)
                </span>
                <div className="space-y-1.5">
                  {dossier.executiveSummary.highestPriorityWards.map((w) => (
                    <div
                      key={w.wardId}
                      onClick={() => {
                        onSelectWard(w.wardId);
                        if (onHighlightWardOnMap) onHighlightWardOnMap(w.wardId);
                      }}
                      className="p-2.5 rounded-xl border border-divider bg-surface hover:bg-surface-elevated transition-colors cursor-pointer flex items-center justify-between"
                    >
                      <div>
                        <span className="font-bold text-xs text-text-primary block">
                          #{w.rank} Ward {w.wardId} — {w.wardName}
                        </span>
                        <span className="text-[10px] text-text-tertiary block">
                          Trigger: {w.primaryTrigger}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-xs text-red-600 dark:text-red-400 block">
                          {w.score} {w.unit}
                        </span>
                        <span className="text-[10px] text-text-secondary font-mono">
                          {w.tier}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Infrastructure Summary Cards */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary font-mono block">
                  Potentially Exposed Mapped Assets
                </span>
                <div className="grid grid-cols-1 gap-2 text-xs">
                  {dossier.executiveSummary.mainPotentiallyAffectedAssets.map((asset, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl border border-divider bg-surface space-y-1"
                    >
                      <div className="flex items-center justify-between font-bold text-text-primary">
                        <span>{asset.category}</span>
                        <span className="font-mono text-primary">{asset.count} units</span>
                      </div>
                      <p className="text-[11px] text-text-secondary">
                        {asset.prominentItems.join(", ")}
                      </p>
                      <span className="text-[10px] text-text-tertiary italic block">
                        {asset.caveat}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SECTION B: CONDITIONS AND INPUTS */}
          {activeSection === "inputs" && (
            <div className="space-y-3">
              {/* Live Observations Table */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary font-mono block">
                  1. Live Observations
                </span>
                <div className="rounded-xl border border-divider overflow-hidden bg-surface text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-surface-elevated text-text-secondary font-mono text-[10px] border-b border-divider">
                      <tr>
                        <th className="p-2">Variable</th>
                        <th className="p-2">Value</th>
                        <th className="p-2">Source</th>
                        <th className="p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-divider font-mono text-[11px]">
                      {dossier.conditionsAndInputs.liveObservations.map((o) => (
                        <tr key={o.id}>
                          <td className="p-2 font-bold text-text-primary">{o.name}</td>
                          <td className="p-2 text-primary font-bold">
                            {o.value} {o.unit}
                          </td>
                          <td className="p-2 text-text-tertiary">{o.sourceName}</td>
                          <td className="p-2">
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-bold text-[9px]">
                              {o.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* User Controlled Parameters Table */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary font-mono block">
                  2. User-Controlled Scenario Parameters
                </span>
                <div className="rounded-xl border border-divider overflow-hidden bg-surface text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-surface-elevated text-text-secondary font-mono text-[10px] border-b border-divider">
                      <tr>
                        <th className="p-2">Parameter</th>
                        <th className="p-2">Applied Value</th>
                        <th className="p-2">Classification</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-divider font-mono text-[11px]">
                      {dossier.conditionsAndInputs.userControlledInputs.map((p) => (
                        <tr key={p.id}>
                          <td className="p-2 font-bold text-text-primary">{p.name}</td>
                          <td className="p-2 text-primary font-bold">
                            {p.value} {p.unit}
                          </td>
                          <td className="p-2 text-text-tertiary">{p.category}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Missing or Uncalibrated Inputs */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary font-mono block">
                  3. Missing / Stale Inputs & Assumptions
                </span>
                <div className="space-y-1.5">
                  {dossier.conditionsAndInputs.missingOrStaleInputs.map((m, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-xl border border-divider bg-surface text-xs space-y-1"
                    >
                      <span className="font-bold text-text-primary block">{m.variable}</span>
                      <p className="text-[11px] text-text-secondary">{m.impactOnModel}</p>
                      <span className="text-[10px] font-mono text-primary block">
                        Fallback Applied: {m.fallbackUsed}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SECTION C: METHODOLOGY & CALCULATION */}
          {activeSection === "meth" && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl border border-divider bg-surface space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary font-mono block">
                  Mathematical Formulation
                </span>
                <div className="p-3 rounded-xl bg-surface-elevated font-mono text-xs text-text-primary overflow-x-auto">
                  <code>{dossier.methodologyAndCalculation.formulaPlain}</code>
                </div>
                <p className="text-[11px] text-text-secondary leading-relaxed">
                  Formula computes dimensionless susceptibility index (0-100) combining rainfall forcing, Copernicus GLO-30 topographic elevation minima, MCGM chronic waterlogging density, and drainage blockage.
                </p>
              </div>

              {/* Variable Weights Table */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary font-mono block">
                  Variable Definitions & Weighting Audit
                </span>
                <div className="rounded-xl border border-divider overflow-hidden bg-surface text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-surface-elevated text-text-secondary font-mono text-[10px] border-b border-divider">
                      <tr>
                        <th className="p-2">Variable</th>
                        <th className="p-2">Weight</th>
                        <th className="p-2">Rationale</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-divider text-[11px]">
                      {dossier.methodologyAndCalculation.variableDefinitions.map((v) => (
                        <tr key={v.symbol}>
                          <td className="p-2 font-mono font-bold text-text-primary">
                            {v.symbol} — {v.name}
                          </td>
                          <td className="p-2 font-mono font-bold text-primary">
                            {v.effectiveWeight}
                          </td>
                          <td className="p-2 text-text-secondary text-[10px]">
                            {v.weightRationale}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Selected Ward Calculation Trace */}
              {dossier.methodologyAndCalculation.selectedWardCalculationTrace && (
                <div className="p-3 rounded-xl border border-divider bg-surface space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-text-primary">
                      Ward {dossier.methodologyAndCalculation.selectedWardCalculationTrace.wardId} Trace
                    </span>
                    <span className="text-xs font-mono font-bold text-primary">
                      Final Score: {dossier.methodologyAndCalculation.selectedWardCalculationTrace.finalScore}/100
                    </span>
                  </div>
                  <ul className="space-y-1 text-xs text-text-secondary font-mono">
                    {dossier.methodologyAndCalculation.selectedWardCalculationTrace.stepByStepCalculations.map(
                      (step, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-text-tertiary">›</span>
                          <span>{step}</span>
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* SECTION D: CITY-WIDE SCREENING */}
          {activeSection === "city" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-xl border border-divider bg-surface">
                  <span className="text-[10px] text-text-tertiary block font-bold font-mono">
                    WARDS ASSESSED
                  </span>
                  <span className="text-sm font-mono font-black text-text-primary mt-0.5 block">
                    {dossier.citywideAssessment.totalWardsEvaluated} / 24 Wards
                  </span>
                  <span className="text-[10px] text-emerald-500 font-mono">100% Coverage</span>
                </div>

                <div className="p-3 rounded-xl border border-divider bg-surface">
                  <span className="text-[10px] text-text-tertiary block font-bold font-mono">
                    PEAK INTERVENTION WARD
                  </span>
                  <span className="text-sm font-mono font-black text-red-600 dark:text-red-400 mt-0.5 block truncate">
                    {dossier.citywideAssessment.peakWard.wardName}
                  </span>
                  <span className="text-[10px] text-text-tertiary font-mono">
                    Score: {dossier.citywideAssessment.peakWard.score}/100
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-divider bg-surface">
                  <span className="text-[10px] text-text-tertiary block font-bold font-mono">
                    CITYWIDE MEAN
                  </span>
                  <span className="text-sm font-mono font-black text-text-primary mt-0.5 block">
                    {dossier.citywideAssessment.citywideMeanScore} / 100
                  </span>
                  <span className="text-[10px] text-text-tertiary font-mono">Multi-Hazard Index</span>
                </div>

                <div className="p-3 rounded-xl border border-divider bg-surface">
                  <span className="text-[10px] text-text-tertiary block font-bold font-mono">
                    BUFFER POPULATION EXPOSURE
                  </span>
                  <span className="text-sm font-mono font-black text-text-primary mt-0.5 block">
                    ~{dossier.citywideAssessment.totalEstimatedExposedPopulation.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-text-tertiary font-mono">2011/2026 Proj</span>
                </div>
              </div>

              {/* Tier Distribution */}
              <div className="p-3.5 rounded-2xl border border-divider bg-surface space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary font-mono block">
                  Municipal Screening Tier Distribution
                </span>
                <div className="grid grid-cols-4 gap-1.5 text-center text-xs font-mono">
                  <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20">
                    <span className="text-[9px] text-red-600 font-bold block">SEVERE</span>
                    <span className="text-sm font-black text-red-600 block">
                      {dossier.citywideAssessment.tierDistribution.severeCount}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/20">
                    <span className="text-[9px] text-orange-600 font-bold block">HIGH</span>
                    <span className="text-sm font-black text-orange-600 block">
                      {dossier.citywideAssessment.tierDistribution.highCount}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                    <span className="text-[9px] text-yellow-600 font-bold block">MODERATE</span>
                    <span className="text-sm font-black text-yellow-600 block">
                      {dossier.citywideAssessment.tierDistribution.moderateCount}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <span className="text-[9px] text-emerald-600 font-bold block">LOW</span>
                    <span className="text-sm font-black text-emerald-600 block">
                      {dossier.citywideAssessment.tierDistribution.lowCount}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION E: WARD DETAILED */}
          {activeSection === "ward" && (
            <div className="space-y-3">
              {dossier.wardDetailedAnalysis ? (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl border border-divider bg-surface space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-black text-text-primary">
                        Ward {dossier.wardDetailedAnalysis.wardId} — {dossier.wardDetailedAnalysis.wardName}
                      </h4>
                      <span className="font-mono text-xs font-bold text-red-600 dark:text-red-400">
                        {dossier.wardDetailedAnalysis.score} / 100
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-text-secondary">
                      <span>Zone: {dossier.wardDetailedAnalysis.zone}</span>
                      <span>•</span>
                      <span>Mean Elevation: {dossier.wardDetailedAnalysis.elevationMeanM}m ASL</span>
                      <span>•</span>
                      <span>{dossier.wardDetailedAnalysis.isCoastal ? "Coastal" : "Inland"}</span>
                    </div>
                  </div>

                  {/* Topographic Depressions */}
                  <div className="p-3 rounded-xl border border-divider bg-surface space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary font-mono block">
                      Copernicus GLO-30 Depression Sinks
                    </span>
                    {dossier.wardDetailedAnalysis.saucerDepressions.length > 0 ? (
                      <ul className="space-y-1 text-xs">
                        {dossier.wardDetailedAnalysis.saucerDepressions.map((dep, i) => (
                          <li key={i} className="flex items-center justify-between">
                            <span className="font-bold text-text-primary">{dep.name}</span>
                            <span className="font-mono text-primary text-[11px]">
                              Min: {dep.elevationMinM}m ASL (~{(dep.areaSqM / 10000).toFixed(1)} ha)
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-xs text-text-tertiary italic">
                        No major saucer depressions in this ward polygon.
                      </span>
                    )}
                  </div>

                  {/* Potentially Exposed Hospitals */}
                  <div className="p-3 rounded-xl border border-divider bg-surface space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary font-mono block">
                      Tertiary Hospitals in Proximity Buffer
                    </span>
                    {dossier.wardDetailedAnalysis.potentiallyExposedHospitals.length > 0 ? (
                      <div className="space-y-1">
                        {dossier.wardDetailedAnalysis.potentiallyExposedHospitals.map((h, i) => (
                          <div key={i} className="text-xs">
                            <span className="font-bold text-text-primary">{h.name}</span>{" "}
                            <span className="text-[10px] text-text-tertiary">({h.type})</span>
                            <span className="text-[10px] text-amber-600 block italic">
                              {h.proximityNote}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-text-tertiary italic">
                        No tertiary hospital GIS coordinates located in immediate depression buffer.
                      </span>
                    )}
                  </div>

                  {/* Arterial Roads */}
                  <div className="p-3 rounded-xl border border-divider bg-surface space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary font-mono block">
                      Intersecting Arterial Transit Corridors
                    </span>
                    {dossier.wardDetailedAnalysis.potentiallyExposedRoads.length > 0 ? (
                      <div className="space-y-1">
                        {dossier.wardDetailedAnalysis.potentiallyExposedRoads.map((r, i) => (
                          <div key={i} className="text-xs flex items-center justify-between">
                            <span className="font-bold text-text-primary">{r.name}</span>
                            <span className="text-[10px] font-mono text-text-tertiary">
                              {r.lanes} lanes ({r.highwayType})
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-text-tertiary italic">
                        No primary arterial road intersections recorded in this ward segment.
                      </span>
                    )}
                  </div>

                  {/* Actions for this Ward */}
                  <div className="flex items-center gap-2 pt-2">
                    {onHighlightWardOnMap && (
                      <button
                        onClick={() => onHighlightWardOnMap(dossier.wardDetailedAnalysis!.wardId)}
                        className="flex-1 py-2 rounded-xl border border-divider bg-surface-elevated hover:bg-surface text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <CrosshairIcon size={13} />
                        <span>Focus on Map</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-text-tertiary">
                  Select a ward from the map or ranking list to view detailed ward impact report.
                </div>
              )}
            </div>
          )}

          {/* SECTION F: MUNICIPAL ACTIONS */}
          {activeSection === "actions" && (
            <div className="space-y-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary font-mono block">
                Departmental Action Review Matrix
              </span>
              {dossier.recommendedActions.map((action) => (
                <div
                  key={action.id}
                  className="p-3 rounded-xl border border-divider bg-surface space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-bold font-mono text-[10px]">
                        {action.departmentCode}
                      </span>
                      <span className="text-xs font-bold text-text-primary">
                        {action.title}
                      </span>
                    </div>
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        action.priority === "CRITICAL"
                          ? "bg-red-500/10 text-red-600"
                          : action.priority === "HIGH"
                          ? "bg-orange-500/10 text-orange-600"
                          : "bg-yellow-500/10 text-yellow-600"
                      }`}
                    >
                      {action.priority}
                    </span>
                  </div>

                  <p className="text-xs text-text-secondary leading-relaxed">
                    {action.description}
                  </p>

                  <div className="text-[10px] text-text-tertiary space-y-0.5 font-mono pt-1 border-t border-divider">
                    <div>Target Wards: {action.targetWards.join(", ")}</div>
                    <div>Prerequisites: {action.prerequisites.join("; ")}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* SECTION G: DATA PROVENANCE & GOVERNANCE */}
          {activeSection === "provenance" && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl border border-divider bg-surface space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary font-mono block">
                  Authoritative Spatial Data Sources Cited
                </span>
                <ul className="space-y-1.5 text-xs text-text-secondary">
                  {dossier.limitationsAndGovernance.sourceReferences.map((ref) => (
                    <li key={ref.id} className="border-b border-divider/50 pb-1.5 last:border-0">
                      <span className="font-bold text-text-primary block">
                        [{ref.id}] {ref.title}
                      </span>
                      <span className="text-[10px] text-text-tertiary block">
                        Publisher: {ref.publisher} • License: {ref.licenseOrProvenance}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Scientific Disclaimers */}
              <div className="p-3 rounded-xl bg-surface border border-divider space-y-2 text-xs">
                <span className="font-bold text-amber-600 dark:text-amber-400 block font-mono text-[10px]">
                  MUNICIPAL SCREENING DISCLAIMERS
                </span>
                {dossier.limitationsAndGovernance.scientificDisclaimers.map((disc, i) => (
                  <p key={i} className="text-[11px] text-text-secondary leading-tight">
                    • {disc}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
