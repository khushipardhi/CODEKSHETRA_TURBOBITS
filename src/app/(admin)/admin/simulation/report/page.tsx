/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Simulation Report Studio Page
   /admin/simulation/report
   Dedicated Full-Width Municipal Dossier & Reporting Workspace.
   ════════════════════════════════════════════════════════ */

"use client";

import React, { Suspense } from "react";
import { SimulationReportStudio } from "@/components/admin/simulation/simulation-report-studio";

export default function AdminSimulationReportPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full min-h-screen flex flex-col items-center justify-center p-8 bg-canvas">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <h2 className="text-base font-black text-text-primary tracking-tight">
            Initializing Dedicated Report Studio...
          </h2>
          <p className="text-xs text-text-tertiary mt-1">
            Loading canonical simulation dossier and municipal asset databases
          </p>
        </div>
      }
    >
      <SimulationReportStudio />
    </Suspense>
  );
}
