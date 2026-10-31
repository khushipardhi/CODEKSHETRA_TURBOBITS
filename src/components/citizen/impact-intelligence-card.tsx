/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Citizen Impact Intelligence Card
   Plain-language presentation of grounded impact assessment answering
   the 6 Core Geospatial Impact Questions.
   ════════════════════════════════════════════════════════ */

"use client";

import React, { useState } from "react";
import type { SharedImpactAssessment } from "@/modules/impact/contracts";
import Link from "next/link";

export interface ImpactIntelligenceCardProps {
  assessment: SharedImpactAssessment;
  city: string;
}

export function ImpactIntelligenceCard({ assessment, city }: ImpactIntelligenceCardProps) {
  const [expandedSection, setExpandedSection] = useState<number | null>(null);

  const toggleSection = (idx: number) => {
    setExpandedSection(expandedSection === idx ? null : idx);
  };

  const getAlertBadge = (level: string) => {
    switch (level) {
      case "RED_WARNING":
        return { label: "Red Warning", color: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-300" };
      case "ORANGE_ALERT":
        return { label: "Orange Alert", color: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-300" };
      case "YELLOW_WATCH":
        return { label: "Yellow Watch", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300 border-yellow-300" };
      default:
        return { label: "Normal Conditions", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300" };
    }
  };

  const badge = getAlertBadge(assessment.overallAlertLevel);

  return (
    <div className="bg-surface-0 border border-border rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border bg-surface-1/40">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-base">🛡️</span>
            <h3 className="font-bold text-text-primary text-sm">Grounded Environmental Impact Intelligence</h3>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badge.color}`}>
            {badge.label}
          </span>
        </div>
        <p className="text-xs text-text-secondary mt-1">
          {assessment.forecastHeadline}
        </p>
      </div>

      {/* The 6 Core Impact Questions Accordion / List */}
      <div className="divide-y divide-border/60 text-xs">
        {/* Q1: What is happening or forecast? */}
        <div className="p-4 space-y-1.5">
          <div className="flex items-center gap-2 text-text-primary font-bold">
            <span className="w-5 h-5 rounded-full bg-accent/10 text-accent flex items-center justify-center text-[10px] font-bold">1</span>
            <h4>What is happening or forecast to happen?</h4>
          </div>
          <p className="text-text-secondary leading-relaxed pl-7">
            {assessment.forecastDescription}
          </p>
        </div>

        {/* Q2: Area and time window */}
        <div className="p-4 space-y-1.5 bg-surface-1/20">
          <div className="flex items-center gap-2 text-text-primary font-bold">
            <span className="w-5 h-5 rounded-full bg-accent/10 text-accent flex items-center justify-center text-[10px] font-bold">2</span>
            <h4>Over what area and time window?</h4>
          </div>
          <p className="text-text-secondary leading-relaxed pl-7">
            {assessment.spatialExtentDescription}
          </p>
          <div className="pl-7 pt-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-surface-2 text-text-primary font-medium text-[11px]">
              ⏱ Time Window: {assessment.horizonTimeWindow}
            </span>
          </div>
        </div>

        {/* Q3: Evidence base */}
        <div className="p-4 space-y-1.5">
          <div className="flex items-center gap-2 text-text-primary font-bold">
            <span className="w-5 h-5 rounded-full bg-accent/10 text-accent flex items-center justify-center text-[10px] font-bold">3</span>
            <h4>What evidence supports this assessment?</h4>
          </div>
          <div className="pl-7 space-y-1 text-text-secondary">
            <p>• <strong>Telemetry Sources:</strong> {assessment.evidenceBase.telemetrySource}</p>
            <p>• <strong>Numerical Model:</strong> {assessment.evidenceBase.forecastModel}</p>
            <p>• <strong>Baseline Comparison:</strong> {assessment.evidenceBase.baselineComparison}</p>
            {assessment.evidenceBase.historicalContext && (
              <p>• <strong>Historical Analogue:</strong> {assessment.evidenceBase.historicalContext}</p>
            )}
          </div>
        </div>

        {/* Q4: What could be affected? */}
        <div className="p-4 space-y-2 bg-surface-1/20">
          <div className="flex items-center gap-2 text-text-primary font-bold">
            <span className="w-5 h-5 rounded-full bg-accent/10 text-accent flex items-center justify-center text-[10px] font-bold">4</span>
            <h4>What could be affected?</h4>
          </div>
          <div className="pl-7 space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <div className="p-2.5 rounded-xl bg-surface-0 border border-border">
                <span className="text-[10px] text-text-tertiary uppercase font-bold">Transit Corridors at Risk</span>
                <ul className="mt-1 space-y-0.5 text-text-secondary text-[11px]">
                  {assessment.potentialImpacts.transportCorridorsAffected.map((c, i) => (
                    <li key={i}>• {c}</li>
                  ))}
                </ul>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-0 border border-border">
                <span className="text-[10px] text-text-tertiary uppercase font-bold">Vulnerable Catchments</span>
                <ul className="mt-1 space-y-0.5 text-text-secondary text-[11px]">
                  {assessment.potentialImpacts.highestRiskWards.map((w, i) => (
                    <li key={i}>• {w.wardName}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Population Exposure Note */}
            <div className="p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60">
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-900 dark:text-blue-200">
                  Estimated Population in Buffer: {assessment.potentialImpacts.estimatedTotalExposedPopulation.toLocaleString()}
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-200/60 dark:bg-blue-900 text-blue-800 dark:text-blue-300 font-semibold">
                  Census Estimate
                </span>
              </div>
              <p className="text-[10px] text-blue-800 dark:text-blue-300 mt-1 leading-normal">
                {assessment.potentialImpacts.demographicMethodologyFootnote}
              </p>
            </div>
          </div>
        </div>

        {/* Q5: Certainty & limitations */}
        <div className="p-4 space-y-1.5">
          <div className="flex items-center gap-2 text-text-primary font-bold">
            <span className="w-5 h-5 rounded-full bg-accent/10 text-accent flex items-center justify-center text-[10px] font-bold">5</span>
            <h4>How certain is the assessment, and what is missing?</h4>
          </div>
          <div className="pl-7 space-y-1 text-text-secondary">
            <p>{assessment.certaintyAndLimitations.uncertaintyStatement}</p>
            <div className="pt-1">
              <p className="text-[10px] font-semibold text-text-tertiary uppercase">Information Currently Missing / Unavailable:</p>
              <ul className="mt-0.5 space-y-0.5 text-[11px]">
                {assessment.certaintyAndLimitations.missingInputs.map((m, i) => (
                  <li key={i}>• {m}</li>
                ))}
              </ul>
            </div>
            <p className="text-[10px] text-text-tertiary italic pt-1 border-t border-border/40 mt-1.5">
              {assessment.certaintyAndLimitations.disclaimer}
            </p>
          </div>
        </div>

        {/* Q6: Practical actions */}
        <div className="p-4 space-y-2 bg-surface-1/20">
          <div className="flex items-center gap-2 text-text-primary font-bold">
            <span className="w-5 h-5 rounded-full bg-accent/10 text-accent flex items-center justify-center text-[10px] font-bold">6</span>
            <h4>What practical action should be considered?</h4>
          </div>
          <div className="pl-7 space-y-2">
            <div className="space-y-1.5">
              {assessment.recommendedActions.citizenActions.map((act, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 mt-0.5 ${
                      act.importance === "MANDATORY"
                        ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                        : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                    }`}
                  >
                    {act.importance}
                  </span>
                  <span className="text-text-secondary">{act.instruction}</span>
                </div>
              ))}
            </div>

            {/* Contextual Action Button to Report Problem */}
            <div className="pt-2">
              <Link
                href={`/${city}/report?category=drainage_waterlogging&summary=${encodeURIComponent(
                  `Suspected waterlogging observed under current ${assessment.dominantHazard} advisory.`
                )}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent text-white font-semibold text-xs hover:bg-accent-hover transition-colors shadow-xs"
              >
                <span>Report Observed Flooding or Drainage Issue</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
