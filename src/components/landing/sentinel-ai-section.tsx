"use client";

import React from "react";
import Link from "next/link";
import {
  SparklesIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  MapIcon,
  FileTextIcon,
  ShieldIcon,
  UserIcon,
} from "@/components/ui/icons";

interface SentinelAiSectionProps {
  citySlug: string;
}

export function SentinelAiSection({ citySlug }: SentinelAiSectionProps) {
  return (
    <section id="sentinel-ai" className="py-20 sm:py-24 border-t border-border bg-surface-0 dark:bg-[#070b12]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left 5 Cols: Narrative Description & Principles */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs font-semibold text-purple-600 dark:text-purple-400">
              <SparklesIcon size={14} />
              <span>GROUNDED CONVERSATIONAL REASONING</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-extrabold text-text-primary tracking-tight leading-tight">
              Sentinel AI: Interpreting Evidence, Not Generating Fiction.
            </h2>

            <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
              Unlike generic chatbots, Sentinel AI operates on verified municipal data payloads.
              It synthesizes live numerical weather predictions, spatial ward contours, and disaster
              management guidelines to provide clear, actionable answers.
            </p>

            {/* Principles Checklist */}
            <div className="space-y-3 text-xs sm:text-sm text-text-secondary">
              <div className="flex items-start gap-2.5">
                <CheckCircleIcon size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Strict Source Grounding:</strong> Answers cite specific data sources
                  (ECMWF, Open-Meteo, Copernicus DEM, BMC GIS) with timestamps.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircleIcon size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Anti-Hallucination Guardrails:</strong> Runtime validation intercepts
                  foreign city leakage, invented citations, and numerical contradictions.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircleIcon size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Direct Action Linkage:</strong> Every recommendation links directly to
                  verified municipal shelters, ward dossiers, or civic reporting channels.
                </span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href={`/${citySlug}/sentinel`}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-primary text-white text-xs sm:text-sm font-bold hover:bg-primary-hover shadow-md transition-all"
              >
                <span>Consult Sentinel AI Assistant</span>
                <ArrowRightIcon size={16} />
              </Link>
            </div>
          </div>

          {/* Right 7 Cols: Realistic Conversational Preview */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-border bg-surface-1/60 dark:bg-[#0c1220] p-5 sm:p-7 shadow-xl space-y-4">
              {/* Chat Header Bar */}
              <div className="flex items-center justify-between pb-3 border-b border-border text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <SparklesIcon size={16} />
                  </div>
                  <div>
                    <div className="font-bold text-text-primary">Sentinel AI Assistant</div>
                    <div className="text-[10px] text-text-tertiary">
                      Context: Greater Mumbai · Ward L (Kurla)
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-2 text-text-secondary">
                  DEMONSTRATION PREVIEW
                </span>
              </div>

              {/* Message 1: Citizen Query */}
              <div className="flex items-start gap-3 justify-end">
                <div className="max-w-md p-3.5 rounded-2xl rounded-tr-xs bg-primary text-white text-xs sm:text-sm leading-relaxed shadow-xs">
                  &ldquo;I live near Bail Bazar in Kurla (Ward L). It&apos;s raining heavily. Should I be
                  concerned about street waterlogging right now?&rdquo;
                </div>
                <div className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center shrink-0 text-text-secondary">
                  <UserIcon size={16} />
                </div>
              </div>

              {/* Message 2: Sentinel AI Structured Response */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <SparklesIcon size={16} />
                </div>

                <div className="max-w-lg p-4 sm:p-5 rounded-2xl rounded-tl-xs bg-surface-0 dark:bg-[#111927] border border-border text-xs sm:text-sm text-text-primary space-y-3 shadow-xs">
                  <div className="font-semibold text-text-primary">
                    Based on current ECMWF atmospheric observations and the Mumbai Tier 2 Hydrodynamic Model:
                  </div>

                  {/* Structured Bullet Points */}
                  <ul className="space-y-1.5 text-text-secondary text-xs list-disc pl-4">
                    <li>
                      <strong>Current Rainfall:</strong> 0.0 mm/h recorded at Santacruz radar grid; however, the active monsoon scenario forecasts an incoming band (64.5 mm/h).
                    </li>
                    <li>
                      <strong>Tidal Lockout:</strong> High spring tide peaks at <strong>4.62m CD at 14:15 IST</strong>. When tides exceed 4.5m, Mithi river outfall sluice gates close, causing backwater pooling in low-lying depressions.
                    </li>
                    <li>
                      <strong>Topographic Exposure:</strong> Bail Bazar sits in a low-lying saucer depression at <strong>6.9m ASL</strong>, where historical runoff accumulates within 45 minutes of heavy rain.
                    </li>
                  </ul>

                  {/* Grounded Citation & Action Chips */}
                  <div className="pt-2 border-t border-border/80 space-y-2">
                    <div className="text-[10px] font-mono text-text-tertiary">
                      Sources: ECMWF IFS (2026-10-22T06:00Z) · Copernicus GLO-30 DEM · INCOIS Tide Table
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      <Link
                        href={`/admin/${citySlug}/simulation/report`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 text-[11px] font-semibold text-text-primary transition-colors"
                      >
                        <FileTextIcon size={13} />
                        <span>Inspect Ward L Dossier</span>
                      </Link>

                      <Link
                        href={`/${citySlug}/dashboard`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold"
                      >
                        <MapIcon size={13} />
                        <span>Nearest Shelter: Kurla High School</span>
                      </Link>

                      <Link
                        href={`/${citySlug}/report`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 text-[11px] font-semibold"
                      >
                        <ShieldIcon size={13} />
                        <span>Report Waterlogging</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chat Input Placeholder Bar */}
              <div className="flex items-center gap-2 p-2 rounded-xl bg-surface-0 dark:bg-[#111927] border border-border">
                <input
                  type="text"
                  readOnly
                  placeholder="Ask a question about weather, hazards, or ward shelters..."
                  className="w-full bg-transparent text-xs text-text-tertiary px-2 focus:outline-none cursor-default"
                />
                <Link
                  href={`/${citySlug}/sentinel`}
                  className="px-3.5 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary-hover shrink-0"
                >
                  Ask
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
