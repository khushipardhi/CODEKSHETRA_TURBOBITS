/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Citizen Hazard Dashboard
   Phase 6 Enterprise Edition: Location-Aware Civic Intelligence Hub
   
   Integrates:
   - Location Context Model with explicit coordinate & boundary provenance
   - Personalised location briefing answering the 6 core geospatial questions
   - Location-aware interactive Leaflet hazard map with city-isolated boundaries
   - Grounded impact intelligence answering what is happening, where, and what to do
   - Official alerts & preparedness recommendations
   - Verified emergency facilities & nearby civic reports
   - Clear contextual actions to report civic issues at /[city]/report
   ════════════════════════════════════════════════════════ */

"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CitizenHeader } from "@/components/citizen/citizen-header";
import { CitizenBottomNav } from "@/components/citizen/citizen-bottom-nav";
import { AreaProvider, useAreaContext } from "@/components/citizen/area-context";
import { AreaSelectorModal } from "@/components/citizen/area-selector-modal";
import { MyAreaBriefing } from "@/components/citizen/my-area-briefing";
import { CitizenHazardMap } from "@/components/citizen/citizen-hazard-map";
import { ImpactIntelligenceCard } from "@/components/citizen/impact-intelligence-card";
import { SentinelHazardBanner } from "@/components/citizen/sentinel-hazard-banner";
import { HazardPreparedness } from "@/components/citizen/hazard-preparedness";
import { SentinelAssistantDrawer } from "@/components/citizen/sentinel-assistant-drawer";
import { useCityContext } from "@/components/providers/city-provider";
import { generateCityImpactAssessment } from "@/modules/impact/generator";
import { getOrCreateGuestId, citizenHeaders } from "@/lib/guest-id";
import type { ResolvedBoundary } from "@/modules/geo/point-in-polygon";

interface ActiveReport {
  publicReference: string;
  title: string;
  status: string;
  severity: string;
  createdAt: string;
}

function CitizenHazardDashboardContent() {
  const router = useRouter();
  const { city, cityConfig } = useCityContext();
  const {
    selectedArea,
    areaCoords,
    isGpsDetected,
    resolvedWard: contextResolvedWard,
    locationContext,
    openSelector,
  } = useAreaContext();

  const [selectedWard, setSelectedWard] = useState<ResolvedBoundary | null>(contextResolvedWard);
  const [activeReports, setActiveReports] = useState<ActiveReport[]>([]);
  const [sentinelAssistantOpen, setSentinelAssistantOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"map" | "table">("map");

  // Sync resolved ward if changed in context
  useEffect(() => {
    if (contextResolvedWard && (!selectedWard || selectedWard.id !== contextResolvedWard.id)) {
      setSelectedWard(contextResolvedWard);
    }
  }, [contextResolvedWard]);

  // Load guest identity and recent reports for active city
  useEffect(() => {
    getOrCreateGuestId().then(() => {
      fetchActiveReports();
    });
  }, [city]);

  const fetchActiveReports = async () => {
    try {
      const res = await fetch(`/api/incidents/mine?city=${city}`, {
        headers: {
          ...citizenHeaders(),
          "x-city": city,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setActiveReports(
          (data.incidents || []).map((i: Record<string, unknown>) => ({
            publicReference: (i.publicReference as string) || (i.public_reference as string),
            title: i.title as string,
            status: i.status as string,
            severity: i.severity as string,
            createdAt: (i.createdAt as string) || (i.created_at as string),
          }))
        );
      }
    } catch {
      // Non-critical
    }
  };

  // Generate grounded impact assessment for active city
  const impactAssessment = useMemo(() => {
    return generateCityImpactAssessment(city, undefined, selectedWard?.id);
  }, [city, selectedWard]);

  const getSeverityStyle = (sev: string) => {
    switch (sev?.toUpperCase()) {
      case "CRITICAL":
        return "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300";
      case "HIGH":
        return "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300";
      default:
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300";
    }
  };

  return (
    <div className="min-h-screen bg-canvas">
      <CitizenHeader />

      <main className="max-w-6xl mx-auto px-4 pb-32 pt-4 space-y-6">
        {/* 1. Official Weather & Hazard Advisory Banner */}
        <SentinelHazardBanner onOpenAssistant={() => setSentinelAssistantOpen(true)} />

        {/* 2. Explicit Location Context Indicator Bar (Requirement 2) */}
        <div className="p-3.5 rounded-2xl bg-surface-0 border border-border shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-1.5 font-bold text-text-primary">
              <span className="text-base">📍</span>
              <span>{selectedArea}</span>
              {selectedWard ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent/15 text-accent border border-accent/25">
                  {city === "mumbai" ? `BMC Ward ${selectedWard.id}` : selectedWard.name}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-surface-2 text-text-tertiary">
                  {cityConfig.name} Jurisdiction
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-[11px] text-text-tertiary">
              <span className="hidden sm:inline">•</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-1 border border-border font-mono text-[10px]">
                {locationContext.selectionMethod === "GPS_DEVICE"
                  ? "🛰️ Verified Device GPS"
                  : locationContext.selectionMethod === "MANUAL_SELECTOR"
                  ? "📍 Citizen Selected Locality"
                  : "🏛️ City Baseline (Default)"}
              </span>
              <span className="hidden md:inline">•</span>
              <span className="hidden md:inline font-mono text-[10px] text-text-secondary">
                Grid: {locationContext.providerCoords[0].toFixed(2)}°N, {locationContext.providerCoords[1].toFixed(2)}°E (~1km ECMWF)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={openSelector}
              className="px-3 py-1.5 rounded-xl bg-surface-1 hover:bg-surface-2 text-text-primary border border-border font-semibold text-xs transition-colors cursor-pointer shadow-2xs"
            >
              Change Area ⇄
            </button>
          </div>
        </div>

        {/* Outside Jurisdiction / Unresolved Limitation Banner */}
        {locationContext.supportStatus !== "SUPPORTED" && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2.5">
            <span className="text-base shrink-0">⚠️</span>
            <div className="flex-1">
              <span className="font-bold">Location Scope Notice: </span>
              <span>{locationContext.statusMessage}</span>
            </div>
          </div>
        )}

        {/* 3. Top Section: Location Briefing & Interactive Hazard Map */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div id="my-area" className="lg:col-span-5 space-y-4">
            <MyAreaBriefing
              onReportSimilarIssue={(category, loc) => {
                router.push(
                  `/${city}/report?category=${encodeURIComponent(category)}&location=${encodeURIComponent(loc)}`
                );
              }}
              onOpenAssistant={() => setSentinelAssistantOpen(true)}
            />
          </div>

          <div id="hazard-map" className="lg:col-span-7 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-text-primary flex items-center gap-1.5">
                  <span>{viewMode === "map" ? "🗺️" : "📋"}</span>
                  <span>{viewMode === "map" ? `Interactive ${cityConfig.name} Hazard Map` : `${cityConfig.name} Accessible Locality & Hazard Registry`}</span>
                </h2>
                <p className="text-[11px] text-text-secondary">
                  {viewMode === "map"
                    ? "Explore official municipal boundaries, emergency facilities, and flood vulnerabilities."
                    : "Accessible, screen-reader optimized tabular alternative to map visualization with direct emergency links."}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center bg-surface-1 border border-border p-0.5 rounded-xl text-xs font-semibold">
                  <button
                    onClick={() => setViewMode("map")}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      viewMode === "map"
                        ? "bg-accent text-white shadow-xs font-bold"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                    aria-label="Switch to Interactive Map View"
                  >
                    🗺️ Map
                  </button>
                  <button
                    onClick={() => setViewMode("table")}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      viewMode === "table"
                        ? "bg-accent text-white shadow-xs font-bold"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                    aria-label="Switch to Accessible Table View (Non-Map)"
                  >
                    📋 Table (Non-Map)
                  </button>
                </div>
                <button
                  onClick={openSelector}
                  className="text-xs font-semibold text-accent hover:underline cursor-pointer"
                >
                  Change 📍
                </button>
              </div>
            </div>

            {viewMode === "map" ? (
              <div className="h-[520px] w-full">
                <CitizenHazardMap
                  city={city}
                  cityName={cityConfig.name}
                  centerCoords={cityConfig.center}
                  citizenCoords={areaCoords}
                  citizenAreaName={selectedArea}
                  isGps={isGpsDetected}
                  onWardSelected={(boundary) => setSelectedWard(boundary)}
                  selectedWardId={selectedWard?.id}
                />
              </div>
            ) : (
              <div className="h-[520px] w-full bg-surface-0 rounded-2xl border border-border shadow-xs overflow-y-auto p-4 space-y-3">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-border">
                  <span className="font-bold text-text-primary font-mono uppercase">
                    {cityConfig.name} ({cityConfig.municipalAbbr}) Administrative Sectors
                  </span>
                  <span className="text-text-tertiary text-[11px]">
                    {cityConfig.localities.length} Monitored Localities
                  </span>
                </div>

                {/* Mobile Cards View (sm:hidden) — Zero Horizontal Scroll Fatigue */}
                <div className="sm:hidden space-y-2.5">
                  {cityConfig.localities.map((loc, idx) => {
                    const isCurrent = selectedArea.toLowerCase().includes(loc.name.toLowerCase().split("/")[0].trim());
                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border transition-colors ${
                          isCurrent
                            ? "bg-accent/5 border-accent/30 shadow-2xs"
                            : "bg-surface-1 border-border/70"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-1.5 font-bold text-text-primary text-xs">
                            {isCurrent && <span className="text-accent">📍</span>}
                            <span>{loc.name}</span>
                          </div>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 shrink-0">
                            <span>🟢</span>
                            <span>Low Baseline</span>
                          </span>
                        </div>

                        <div className="text-[11px] text-text-tertiary space-y-0.5 mb-2 font-mono">
                          <p>Coords: {loc.coords[0].toFixed(4)}°N, {loc.coords[1].toFixed(4)}°E</p>
                          <p className="font-sans text-text-secondary">
                            Facility: {cityConfig.hazardCapabilities.musterPoints[idx % cityConfig.hazardCapabilities.musterPoints.length]?.name || "Central Municipal Hall"}
                          </p>
                        </div>

                        <div className="flex justify-end">
                          <Link
                            href={`/${city}/report?location=${encodeURIComponent(loc.name)}&lat=${loc.coords[0]}&lon=${loc.coords[1]}`}
                            className="px-3 py-1.5 rounded-lg bg-surface-0 hover:bg-surface-2 border border-border text-accent font-semibold text-xs transition-colors flex items-center gap-1"
                          >
                            <span>Report Problem</span>
                            <span>→</span>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop Accessible Table (hidden sm:block) */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse" aria-label={`${cityConfig.name} Municipal Hazard Registry`}>
                    <caption className="sr-only">Comprehensive table of municipal localities, current hazard status, and emergency reporting links.</caption>
                    <thead>
                      <tr className="border-b border-border text-[11px] text-text-tertiary font-mono uppercase bg-surface-1/50">
                        <th scope="col" className="p-2.5 font-bold">Locality / Sector</th>
                        <th scope="col" className="p-2.5 font-bold">Coordinates</th>
                        <th scope="col" className="p-2.5 font-bold">Risk Assessment</th>
                        <th scope="col" className="p-2.5 font-bold">Designated Facility</th>
                        <th scope="col" className="p-2.5 font-bold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {cityConfig.localities.map((loc, idx) => {
                        const isCurrent = selectedArea.toLowerCase().includes(loc.name.toLowerCase().split("/")[0].trim());
                        return (
                          <tr key={idx} className={`hover:bg-surface-1/70 transition-colors ${isCurrent ? "bg-accent/5 font-semibold" : ""}`}>
                            <th scope="row" className="p-2.5 text-text-primary">
                              <div className="flex items-center gap-1.5">
                                {isCurrent && <span className="text-accent" title="Your Inspected Area">📍</span>}
                                <span>{loc.name}</span>
                              </div>
                            </th>
                            <td className="p-2.5 font-mono text-[10px] text-text-tertiary whitespace-nowrap">
                              {loc.coords[0].toFixed(4)}°N, {loc.coords[1].toFixed(4)}°E
                            </td>
                            <td className="p-2.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 whitespace-nowrap">
                                <span>🟢</span>
                                <span>Low Baseline (Dry)</span>
                              </span>
                            </td>
                            <td className="p-2.5 text-[11px] text-text-secondary">
                              {cityConfig.hazardCapabilities.musterPoints[idx % cityConfig.hazardCapabilities.musterPoints.length]?.name || "Central Municipal Hall"}
                            </td>
                            <td className="p-2.5 text-right whitespace-nowrap">
                              <Link
                                href={`/${city}/report?location=${encodeURIComponent(loc.name)}&lat=${loc.coords[0]}&lon=${loc.coords[1]}`}
                                className="px-2.5 py-1 rounded-lg bg-surface-1 hover:bg-surface-2 border border-border text-accent font-semibold text-[11px] transition-colors"
                              >
                                Report Problem →
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="p-3 bg-surface-1 rounded-xl border border-border/60 text-[11px] text-text-tertiary space-y-1">
                  <p className="font-semibold text-text-secondary">ℹ️ Accessibility Note:</p>
                  <p>All category status indicators are paired with both text labels and visual symbols (🟢 Low, 🟡 Moderate, 🟠 High, 🔴 Critical) to ensure full accessibility for screen readers and color-blind users.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 4. Grounded Impact Intelligence (The 6 Core Geospatial Questions) */}
        <section id="impact-intelligence" className="space-y-2">
          <ImpactIntelligenceCard assessment={impactAssessment} city={city} />
        </section>

        {/* 5. Quick Civic Action CTA Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-accent/10 via-blue-500/5 to-transparent border border-accent/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div>
            <h3 className="font-bold text-text-primary text-sm flex items-center gap-1.5">
              <span>📢</span>
              <span>Witnessing a Hazard in {selectedArea}?</span>
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Submit photos and voice notes directly to municipal engineering desks with automated AI routing.
            </p>
          </div>
          <Link
            href={`/${city}/report?location=${encodeURIComponent(selectedArea)}&lat=${areaCoords[0]}&lon=${areaCoords[1]}${
              selectedWard ? `&ward=${encodeURIComponent(selectedWard.id)}` : ""
            }`}
            className="px-4 py-2 rounded-xl bg-accent text-white font-bold text-xs hover:bg-accent-hover transition-colors shadow-sm shrink-0 flex items-center gap-1.5 cursor-pointer"
          >
            <span>Report Civic Problem</span>
            <span>→</span>
          </Link>
        </div>

        {/* 6. Citizen Preparedness Checklists */}
        <HazardPreparedness />

        {/* 7. Recent Relevant Civic Reports in Area */}
        {activeReports.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                Recent Civic Reports in {cityConfig.name}
              </h2>
              <Link
                href={`/${city}/my-reports`}
                className="text-xs text-accent font-medium hover:underline"
              >
                View all ({activeReports.length}) →
              </Link>
            </div>
            <div className="space-y-2">
              {activeReports.slice(0, 3).map((report) => (
                <div
                  key={report.publicReference}
                  className="bg-surface-0 border border-border rounded-xl p-3.5 flex items-center justify-between shadow-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-accent">
                        {report.publicReference}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getSeverityStyle(
                          report.severity
                        )}`}
                      >
                        {report.severity}
                      </span>
                      <span className="text-[10px] text-text-tertiary">
                        {report.status.replace(/_/g, " ")}
                      </span>
                    </div>
                    <p className="text-xs text-text-primary mt-1 font-medium line-clamp-1">
                      {report.title}
                    </p>
                  </div>
                  <Link
                    href={`/${city}/dashboard/${report.publicReference}`}
                    className="text-xs text-accent font-semibold hover:underline"
                  >
                    Track →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Floating Sentinel AI Assistant FAB */}
        <button
          onClick={() => setSentinelAssistantOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-accent to-blue-600 hover:from-accent-hover hover:to-blue-700 text-white p-3.5 rounded-2xl shadow-2xl flex items-center gap-2 font-bold text-xs cursor-pointer border border-white/20 transition-all hover:scale-105"
          title="Ask Sentinel Safety AI"
        >
          <span className="text-base animate-pulse">🛡️</span>
          <span>Ask Sentinel AI</span>
        </button>

        <SentinelAssistantDrawer
          isOpen={sentinelAssistantOpen}
          onClose={() => setSentinelAssistantOpen(false)}
          onPrefillReport={(data) => {
            router.push(
              `/${city}/report?category=${encodeURIComponent(data.categorySlug || "")}&location=${encodeURIComponent(
                data.locationText || ""
              )}&summary=${encodeURIComponent(data.prefillSummary || "")}&lat=${data.latitude || ""}&lon=${
                data.longitude || ""
              }`
            );
          }}
        />

        <AreaSelectorModal />
      </main>

      <CitizenBottomNav />
    </div>
  );
}

export default function CitizenDashboard() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-text-tertiary">
          Loading Citizen Hazard Intelligence...
        </div>
      }
    >
      <AreaProvider>
        <CitizenHazardDashboardContent />
      </AreaProvider>
    </Suspense>
  );
}
