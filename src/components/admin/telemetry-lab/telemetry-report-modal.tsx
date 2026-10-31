/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Telemetry PDF Report Modal
   Phase 4: Parameter Selection & PDF Generation Workspace
   ════════════════════════════════════════════════════════ */

"use client";

import React, { useState } from "react";
import { DownloadIcon, CheckCircleIcon, AlertTriangleIcon } from "@/components/ui/icons";

interface TelemetryReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  city: string;
  cityName: string;
  localities: { name: string; coords: [number, number] }[];
  currentTab: string;
  currentZone: string;
}

export function TelemetryReportModal({
  isOpen,
  onClose,
  city,
  cityName,
  localities,
  currentTab,
  currentZone,
}: TelemetryReportModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>(
    ["rainfall", "weather", "air_quality", "heat", "marine", "soil"].includes(currentTab)
      ? currentTab
      : "overview"
  );
  const [selectedZone, setSelectedZone] = useState<string>(currentZone || "");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const categories = [
    { id: "overview", label: "Multi-Hazard Overview", icon: "🌐", desc: "Consolidated synthesis across all meteorological & hydrological feeds" },
    { id: "rainfall", label: "Rainfall & Hydrology", icon: "🌧️", desc: "Precipitation rates, rain accumulation, runoff risks & IMD thresholds" },
    { id: "weather", label: "Weather & Atmosphere", icon: "🌡️", desc: "Diurnal temperature, dew point, surface pressure & wind gusts" },
    { id: "air_quality", label: "Air Quality & Particulates", icon: "💨", desc: "PM2.5, PM10, nitrogen dioxide & NAAQS standard exceedances" },
    { id: "heat", label: "Heat & Human Exposure", icon: "🔥", desc: "NOAA Heat Index, apparent thermal curves & hyperthermia risk" },
    { id: "marine", label: "Coastal & Marine", icon: "🌊", desc: "Significant wave height, swell dynamics & tidal backpressure" },
  ];

  const handleGeneratePdf = async () => {
    setIsGenerating(true);
    setError(null);
    setSuccess(false);

    try {
      const params = new URLSearchParams({
        city,
        tab: selectedCategory,
      });
      if (selectedZone) {
        params.set("zone", selectedZone);
      }

      const res = await fetch(`/api/admin/reports/telemetry-pdf?${params.toString()}`);
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${res.status}: Failed to generate telemetry report`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const zonePart = selectedZone ? `-${selectedZone.replace(/\s+/g, "_")}` : "";
      a.download = `TEL-${city.toUpperCase()}-${selectedCategory.toUpperCase()}${zonePart}-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[TelemetryModal] PDF generation failed:", err);
      setError(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-3xl border border-divider bg-card shadow-2xl p-6 space-y-5">
        
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                PUBLICATION EXPORT
              </span>
              <span className="text-xs text-text-tertiary">Official Telemetry Dossier</span>
            </div>
            <h2 className="text-xl font-black text-text-primary tracking-tight mt-1">
              Generate Telemetry Lab PDF Report
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Exports a multi-page, publication-grade scientific PDF document with vector figures, threshold indicators, and structured observation tables.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-surface-elevated text-text-tertiary hover:text-text-primary text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
            <AlertTriangleIcon size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Category Picker */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-text-primary uppercase tracking-wider">
            1. Select Analytical Scope
          </label>
          <div className="grid grid-cols-2 gap-2">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/20 ring-2 ring-blue-500/20"
                      : "border-divider bg-surface hover:bg-surface-elevated"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{cat.icon}</span>
                    <span className="text-xs font-bold text-text-primary">{cat.label}</span>
                  </div>
                  <p className="text-[10px] text-text-tertiary mt-1 leading-snug">
                    {cat.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Location / Zone Picker */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-text-primary uppercase tracking-wider">
            2. Station Coordinates & Locality
          </label>
          <div className="flex items-center gap-3">
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="flex-1 p-2.5 rounded-xl border border-divider bg-surface text-text-primary text-xs font-semibold focus:outline-hidden"
            >
              <option value="">{cityName} (City Center Coords)</option>
              {localities.map((loc) => (
                <option key={loc.name} value={loc.name}>
                  {loc.name} (Effective Grid Cell)
                </option>
              ))}
            </select>
            <div className="text-[11px] text-text-tertiary font-mono">
              48-Hour Horizon
            </div>
          </div>
        </div>

        {/* Report Inclusions Summary */}
        <div className="p-3.5 rounded-2xl border border-divider bg-surface-elevated text-xs space-y-1.5">
          <div className="font-bold text-text-primary">Dossier Inclusions:</div>
          <div className="grid grid-cols-2 gap-2 text-[11px] text-text-secondary">
            <div>✓ Official Municipal Insignia & Header</div>
            <div>✓ Vector SVG Time-Series Figures</div>
            <div>✓ Hourly Ground Observation Table</div>
            <div>✓ Statutory Threshold Indicators</div>
            <div>✓ Data Freshness & Station Audit</div>
            <div>✓ Scientific Methodology & Caveats</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-divider">
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="px-4 py-2 rounded-xl border border-divider text-xs font-bold text-text-secondary hover:text-text-primary cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            id="btn-confirm-generate-telemetry-pdf"
            onClick={handleGeneratePdf}
            disabled={isGenerating}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Compiling Multi-Page PDF...</span>
              </>
            ) : success ? (
              <>
                <CheckCircleIcon size={14} className="text-emerald-300" />
                <span>Downloaded Successfully!</span>
              </>
            ) : (
              <>
                <DownloadIcon size={14} />
                <span>Generate & Download PDF</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
