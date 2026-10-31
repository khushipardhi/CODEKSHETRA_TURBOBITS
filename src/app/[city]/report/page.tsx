/* ════════════════════════════════════════════════════════
   /[city]/report — Dedicated Citizen Civic Reporting Page
   Distinct destination for reporting civic issues, reviewing
   AI classification, department routing, and tracking incidents.
   ════════════════════════════════════════════════════════ */

"use client";

import React, { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { CitizenHeader } from "@/components/citizen/citizen-header";
import { CitizenBottomNav } from "@/components/citizen/citizen-bottom-nav";
import { AreaProvider } from "@/components/citizen/area-context";
import { CivicReportingView } from "@/components/citizen/civic-reporting-view";

function ReportPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const city = (params?.city as string) || "mumbai";

  const cat = searchParams.get("category") || undefined;
  const loc = searchParams.get("location") || undefined;
  const ward = searchParams.get("ward") || undefined;
  const summary = searchParams.get("summary") || undefined;

  return (
    <div className="min-h-screen bg-canvas">
      <CitizenHeader />

      <main className="max-w-lg mx-auto px-4 pb-32 pt-4">
        <CivicReportingView
          initialCategory={cat}
          initialLocation={loc || (ward ? `Ward ${ward}, Mumbai` : undefined)}
          initialSummary={summary}
        />
      </main>

      <CitizenBottomNav />
    </div>
  );
}

export default function CityReportPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-text-tertiary">
          Loading Civic Reporting...
        </div>
      }
    >
      <AreaProvider>
        <ReportPageContent />
      </AreaProvider>
    </Suspense>
  );
}
