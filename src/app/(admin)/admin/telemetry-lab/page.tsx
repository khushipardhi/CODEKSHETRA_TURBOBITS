/* ════════════════════════════════════════════════════════
   /admin/telemetry-lab — Admin Environmental Telemetry Lab
   Dedicated workspace for environmental data discovery,
   multi-parameter analytics, zone comparison, and historical replay.
   ════════════════════════════════════════════════════════ */

"use client";

import React, { Suspense } from "react";
import { TelemetryLabView } from "@/components/admin/telemetry-lab/telemetry-lab-view";

export default function TelemetryLabPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full h-96 flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2" />
          <p className="text-xs text-text-tertiary">Loading Environmental Telemetry Console...</p>
        </div>
      }
    >
      <TelemetryLabView />
    </Suspense>
  );
}
