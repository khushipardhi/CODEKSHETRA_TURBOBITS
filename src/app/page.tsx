/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Public Landing Page (Homepage)
   Understand Your City. Anticipate Risk. Act With Evidence.
   ════════════════════════════════════════════════════════ */

"use client";

import React from "react";
import { CitySelectorModal, useCityGate } from "@/components/ui/city-selector";
import { CITIES, DEFAULT_CITY } from "@/lib/city-context";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { HeroSection } from "@/components/landing/hero-section";
import { ConnectedCapabilities } from "@/components/landing/connected-capabilities";
import { PlatformOverview } from "@/components/landing/platform-overview";
import { InteractiveIntelligenceCanvas } from "@/components/landing/interactive-intelligence-canvas";
import { SimulationDifferentiatorSection } from "@/components/landing/simulation-differentiator-section";
import { TelemetryShowcaseSection } from "@/components/landing/telemetry-showcase-section";
import { IntelligenceWorkflowSection } from "@/components/landing/intelligence-workflow-section";
import { SentinelAiSection } from "@/components/landing/sentinel-ai-section";
import { ReportingDecisionSupportSection } from "@/components/landing/reporting-decision-support-section";
import { CivicOperationsSection } from "@/components/landing/civic-operations-section";
import { WorkspacesDirectorySection } from "@/components/landing/workspaces-directory-section";
import { SupportedCitiesSection } from "@/components/landing/supported-cities-section";
import { DataMethodologySection } from "@/components/landing/data-methodology-section";
import { ClosingCtaSection } from "@/components/landing/closing-cta-section";
import { LandingFooter } from "@/components/landing/landing-footer";

export default function HomePage() {
  const { showSelector, selectedCity, checked, handleSelect, openSelector, closeSelector } = useCityGate();
  const activeCity = selectedCity || CITIES[DEFAULT_CITY];
  const citySlug = activeCity.slug || "mumbai";

  // Prevent flash of unselected city until localStorage is checked
  if (!checked) return null;

  return (
    <>
      {/* ─── Top Sticky Navigation Bar ─── */}
      <LandingNavbar onOpenCitySelector={openSelector} selectedCityId={activeCity.id} />

      {/* ─── Modal for City Selection ─── */}
      <CitySelectorModal
        open={showSelector}
        onSelect={handleSelect}
        dismissible={!!selectedCity}
        onClose={closeSelector}
      />

      <main className="min-h-screen bg-canvas text-text-primary selection:bg-primary/20 selection:text-primary">
        {/* 1. Hero Section */}
        <HeroSection city={activeCity} onOpenCitySelector={openSelector} />

        {/* 2. Five Connected Capabilities Flow (Observe -> Understand -> Simulate -> Decide -> Respond) */}
        <ConnectedCapabilities citySlug={citySlug} />

        {/* 3. Platform Overview (One City. Multiple Intelligence Layers.) */}
        <PlatformOverview citySlug={citySlug} />

        {/* 4. Central Interactive City Intelligence Canvas */}
        <InteractiveIntelligenceCanvas citySlug={citySlug} />

        {/* 5. Spatial Simulation Lab as Core Differentiator */}
        <SimulationDifferentiatorSection citySlug={citySlug} />

        {/* 6. Telemetry Lab Showcase & 64 Parameters */}
        <TelemetryShowcaseSection citySlug={citySlug} />

        {/* 7. Intelligence Workflow & Honesty Demarcations */}
        <IntelligenceWorkflowSection />

        {/* 8. Sentinel AI Grounded Reasoning */}
        <SentinelAiSection citySlug={citySlug} />

        {/* 9. Reporting Studio & Vector PDF Dossiers */}
        <ReportingDecisionSupportSection citySlug={citySlug} />

        {/* 10. Civic Reporting & Department Operations */}
        <CivicOperationsSection citySlug={citySlug} />

        {/* 11. Workspaces Directory (8 Destinations) */}
        <WorkspacesDirectorySection citySlug={citySlug} />

        {/* 12. Supported Cities Jurisdiction Matrix */}
        <SupportedCitiesSection onSelectCity={handleSelect} />

        {/* 13. Data Provenance & Scientific Methodology */}
        <DataMethodologySection />

        {/* 14. Closing Call to Action */}
        <ClosingCtaSection citySlug={citySlug} />
      </main>

      {/* 15. Comprehensive Municipal Footer */}
      <LandingFooter citySlug={citySlug} />
    </>
  );
}
