/* ════════════════════════════════════════════════════════
   /[city]/my-area — Dedicated Citizen "My Area" Destination
   Focuses on the citizen's neighborhood, ward boundaries,
   hyperlocal conditions, trustworthy facilities, and quick reporting.
   ════════════════════════════════════════════════════════ */

"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CitizenHeader } from "@/components/citizen/citizen-header";
import { CitizenBottomNav } from "@/components/citizen/citizen-bottom-nav";
import { AreaProvider, useAreaContext } from "@/components/citizen/area-context";
import { AreaSelectorModal } from "@/components/citizen/area-selector-modal";
import { MyAreaBriefing } from "@/components/citizen/my-area-briefing";
import { SentinelHazardBanner } from "@/components/citizen/sentinel-hazard-banner";
import { useCityContext } from "@/components/providers/city-provider";

function MyAreaPageContent() {
  const router = useRouter();
  const { city, cityConfig } = useCityContext();
  const {
    selectedArea,
    areaCoords,
    resolvedWard,
    locationContext,
    openSelector,
  } = useAreaContext();

  const getMethodBadge = () => {
    switch (locationContext.selectionMethod) {
      case "GPS_DEVICE":
        return { label: "🛰️ Verified Device GPS", cls: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" };
      case "MANUAL_SELECTOR":
        return { label: "📍 Citizen Selected Locality", cls: "bg-accent/15 text-accent border-accent/25" };
      default:
        return { label: "🏛️ City Baseline (Default)", cls: "bg-surface-2 text-text-tertiary border-border" };
    }
  };

  const methodBadge = getMethodBadge();

  return (
    <div className="min-h-screen bg-canvas text-text-primary">
      <CitizenHeader />

      <main className="max-w-4xl mx-auto px-4 pb-32 pt-4 space-y-5">
        {/* Advisory ticker if active */}
        <SentinelHazardBanner onOpenAssistant={() => router.push(`/${city}/sentinel`)} />

        {/* Locality Header Card */}
        <div className="p-4 sm:p-5 rounded-3xl bg-surface-0 border border-border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xl">📍</span>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-text-primary">
                {selectedArea}
              </h1>
              {resolvedWard && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-accent/15 text-accent border border-accent/25">
                  {city === "mumbai" ? `BMC Ward ${resolvedWard.id}` : resolvedWard.name}
                </span>
              )}
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${methodBadge.cls}`}>
                {methodBadge.label}
              </span>
            </div>

            <p className="text-xs text-text-tertiary">
              Hyperlocal environmental intelligence, municipal jurisdiction, and community safety status for {cityConfig.name}.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={openSelector}
              className="px-3.5 py-2 rounded-xl bg-surface-1 hover:bg-surface-2 text-text-primary border border-border font-semibold text-xs transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5"
            >
              <span>Change Locality</span>
              <span>⇄</span>
            </button>
            <Link
              href={`/${city}/dashboard#hazard-map`}
              className="px-3.5 py-2 rounded-xl bg-accent/10 hover:bg-accent/20 text-accent font-semibold text-xs transition-colors border border-accent/20 flex items-center gap-1"
            >
              <span>View Full Map</span>
              <span>🗺️</span>
            </Link>
          </div>
        </div>

        {/* Location Scope Notice if Outside City */}
        {locationContext.supportStatus !== "SUPPORTED" && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2.5">
            <span className="text-base shrink-0">⚠️</span>
            <div className="flex-1">
              <span className="font-bold">Jurisdiction Notice: </span>
              <span>{locationContext.statusMessage}</span>
            </div>
            <button
              onClick={openSelector}
              className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 font-bold text-[11px] cursor-pointer"
            >
              Pick Locality
            </button>
          </div>
        )}

        {/* Primary Hyperlocal Briefing */}
        <MyAreaBriefing
          onReportSimilarIssue={(category, loc) => {
            router.push(
              `/${city}/report?category=${encodeURIComponent(category)}&location=${encodeURIComponent(loc)}${
                resolvedWard ? `&ward=${encodeURIComponent(resolvedWard.id)}` : ""
              }`
            );
          }}
          onOpenAssistant={() => router.push(`/${city}/sentinel`)}
        />

        {/* Contextual Civic Report CTA Banner */}
        <div className="p-5 rounded-3xl bg-gradient-to-r from-accent/10 via-blue-500/5 to-transparent border border-accent/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div>
            <h3 className="font-bold text-text-primary text-sm flex items-center gap-1.5">
              <span>📢</span>
              <span>Report an Issue in {selectedArea}</span>
            </h3>
            <p className="text-xs text-text-secondary mt-0.5 max-w-md">
              Waterlogging, damaged drain culverts, or road potholes are dispatched immediately to {cityConfig.municipalAbbr} engineering teams.
            </p>
          </div>
          <Link
            href={`/${city}/report?location=${encodeURIComponent(selectedArea)}&lat=${areaCoords[0]}&lon=${areaCoords[1]}${
              resolvedWard ? `&ward=${encodeURIComponent(resolvedWard.id)}` : ""
            }&category=water_drainage`}
            className="px-4 py-2.5 rounded-xl bg-accent text-white font-bold text-xs hover:bg-accent-hover transition-colors shadow-sm shrink-0 flex items-center gap-1.5 cursor-pointer"
          >
            <span>Report Issue Here</span>
            <span>→</span>
          </Link>
        </div>

        {/* Quick Nav Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <Link
            href={`/${city}/dashboard`}
            className="p-4 rounded-2xl bg-surface-0 border border-border hover:border-accent/40 transition-all flex items-center gap-3 shadow-xs group"
          >
            <div className="w-10 h-10 rounded-xl bg-surface-1 group-hover:bg-accent/10 flex items-center justify-center text-lg text-accent transition-colors">
              🧭
            </div>
            <div>
              <p className="text-xs font-bold text-text-primary group-hover:text-accent transition-colors">Hazard Dashboard</p>
              <p className="text-[11px] text-text-tertiary">Citywide map & overview</p>
            </div>
          </Link>

          <Link
            href={`/${city}/alerts`}
            className="p-4 rounded-2xl bg-surface-0 border border-border hover:border-accent/40 transition-all flex items-center gap-3 shadow-xs group"
          >
            <div className="w-10 h-10 rounded-xl bg-surface-1 group-hover:bg-accent/10 flex items-center justify-center text-lg text-accent transition-colors">
              🚨
            </div>
            <div>
              <p className="text-xs font-bold text-text-primary group-hover:text-accent transition-colors">Official Alerts</p>
              <p className="text-[11px] text-text-tertiary">Active CAP warnings</p>
            </div>
          </Link>

          <Link
            href={`/${city}/sentinel`}
            className="p-4 rounded-2xl bg-surface-0 border border-border hover:border-accent/40 transition-all flex items-center gap-3 shadow-xs group"
          >
            <div className="w-10 h-10 rounded-xl bg-surface-1 group-hover:bg-accent/10 flex items-center justify-center text-lg text-accent transition-colors">
              🛡️
            </div>
            <div>
              <p className="text-xs font-bold text-text-primary group-hover:text-accent transition-colors">Sentinel AI</p>
              <p className="text-[11px] text-text-tertiary">Ask safety questions</p>
            </div>
          </Link>
        </div>

        <AreaSelectorModal />
      </main>

      <CitizenBottomNav />
    </div>
  );
}

export default function MyAreaPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-text-tertiary">
          Loading My Area Intelligence...
        </div>
      }
    >
      <AreaProvider>
        <MyAreaPageContent />
      </AreaProvider>
    </Suspense>
  );
}
