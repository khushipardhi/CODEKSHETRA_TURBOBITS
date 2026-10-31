/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Citizen Interactive Hazard Map
   Dynamic Next.js client wrapper with SSR disabled.
   ════════════════════════════════════════════════════════ */

"use client";

import dynamic from "next/dynamic";
import React from "react";
import type { CitizenHazardMapProps } from "./citizen-hazard-map-inner";

const MapInner = dynamic(() => import("./citizen-hazard-map-inner"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[460px] rounded-2xl border border-border bg-surface-1 flex flex-col items-center justify-center gap-3">
      <div className="w-8 h-8 rounded-full border-3 border-accent border-t-transparent animate-spin" />
      <p className="text-xs text-text-secondary font-medium">Loading interactive city hazard map...</p>
    </div>
  ),
});

export function CitizenHazardMap(props: CitizenHazardMapProps) {
  return <MapInner {...props} />;
}
