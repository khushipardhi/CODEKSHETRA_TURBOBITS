/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Citizen Area Selector Modal
   Privacy-first manual neighborhood picker with optional GPS.
   ════════════════════════════════════════════════════════ */

"use client";

import React, { useState } from "react";
import { useAreaContext } from "./area-context";
import { useCityContext } from "@/components/providers/city-provider";

export function AreaSelectorModal() {
  const { cityConfig } = useCityContext();
  const {
    selectedArea,
    localities,
    selectArea,
    detectGpsLocation,
    isSelectorOpen,
    closeSelector,
  } = useAreaContext();

  const [detecting, setDetecting] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<string | null>(null);
  const [conflictCity, setConflictCity] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  if (!isSelectorOpen) return null;

  const handleGps = async () => {
    setDetecting(true);
    setGpsStatus(null);
    setConflictCity(null);
    const res = await detectGpsLocation();
    setDetecting(false);
    setGpsStatus(res.message);
    if (res.conflictCity) {
      setConflictCity(res.conflictCity);
    }
  };

  const filteredLocalities = localities.filter((loc) =>
    loc.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-surface-0 border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-text-primary">
              Choose Your Neighborhood
            </h3>
            <p className="text-xs text-text-tertiary mt-0.5">
              Select your local area in {cityConfig.name} for tailored forecasts and shelter advisories
            </p>
          </div>
          <button
            onClick={closeSelector}
            className="w-8 h-8 rounded-full flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-surface-2 transition-colors cursor-pointer"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* GPS Quick Button */}
        <div className="p-4 border-b border-border bg-surface-1/50">
          <button
            onClick={handleGps}
            disabled={detecting}
            className="w-full py-2.5 px-4 rounded-xl bg-accent/10 hover:bg-accent/20 border border-accent/30 text-accent text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <span>{detecting ? "📡" : "📍"}</span>
            <span>{detecting ? "Locating device coordinates..." : "Detect My Nearest Area via GPS"}</span>
          </button>
          {gpsStatus && (
            <div className={`mt-2 p-2 rounded-xl text-[11px] text-center font-medium ${
              gpsStatus.includes("denied") || gpsStatus.includes("outside") || gpsStatus.includes("Unable")
                ? "bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 font-semibold"
                : "bg-surface-2 text-text-secondary border border-border"
            }`}>
              {gpsStatus}
            </div>
          )}
          {conflictCity && (
            <div className="mt-2.5 p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center">
              <a
                href={`/${conflictCity}/dashboard`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs transition-colors cursor-pointer"
              >
                <span>Switch to {conflictCity.toUpperCase()} Intelligence ↗</span>
              </a>
            </div>
          )}
          <p className="text-[10px] text-text-tertiary text-center mt-1.5">
            🔒 Privacy First: Location is evaluated locally. We do not track or store your real-time movements.
          </p>
        </div>

        {/* Search */}
        <div className="px-4 py-2 border-b border-border/50">
          <input
            type="text"
            placeholder={`Search ${cityConfig.name} localities...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-surface-1 border border-border text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent"
          />
        </div>

        {/* Localities List */}
        <div className="p-2 overflow-y-auto space-y-1 flex-1">
          {filteredLocalities.map((loc) => {
            const isSelected = selectedArea.startsWith(loc.name);
            return (
              <button
                key={loc.name}
                onClick={() => selectArea(loc.name, loc.coords, false)}
                className={`w-full px-3.5 py-2.5 rounded-xl text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-accent text-white font-bold"
                    : "text-text-primary hover:bg-surface-2 font-medium"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-sm">📍</span>
                  <span>{loc.name}</span>
                </div>
                {isSelected && <span className="text-xs">✓</span>}
              </button>
            );
          })}

          {filteredLocalities.length === 0 && (
            <div className="py-8 text-center text-xs text-text-tertiary">
              No matching areas found in {cityConfig.name}.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-border bg-surface-1/30 flex justify-end">
          <button
            onClick={closeSelector}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold text-text-tertiary hover:text-text-primary transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
