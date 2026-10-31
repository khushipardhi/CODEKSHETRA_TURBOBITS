"use client";

import React from "react";
import Link from "next/link";
import {
  ActivityIcon,
  MapIcon,
  SparklesIcon,
  FileTextIcon,
  ShieldIcon,
  ArrowRightIcon,
} from "@/components/ui/icons";

interface ConnectedCapabilitiesProps {
  citySlug: string;
}

export function ConnectedCapabilities({ citySlug }: ConnectedCapabilitiesProps) {
  const capabilities = [
    {
      step: "01",
      pillar: "Observe",
      icon: <ActivityIcon size={22} />,
      title: "Environmental Telemetry",
      summary:
        "Assimilation of 64 physical parameters from numerical weather prediction (ECMWF IFS, GFS), CPCB air quality, and marine wave models.",
      signals: ["Precipitation Rate", "NOAA Heat Index", "PM2.5 / PM10", "Tidal Heights"],
      link: `/admin/${citySlug}/telemetry-lab`,
      cta: "View Telemetry Lab",
    },
    {
      step: "02",
      pillar: "Understand",
      icon: <MapIcon size={22} />,
      title: "Geospatial & Ward Context",
      summary:
        "Topographic mapping over Copernicus GLO-30 DEM (~30m), 24 BMC administrative wards, and 219 critical municipal facilities.",
      signals: ["Ward Polygons", "Saucer Sink Basins", "Outfall Sluice Gates", "Emergency Shelters"],
      link: `/admin/map`,
      cta: "Explore GIS Map",
    },
    {
      step: "03",
      pillar: "Simulate",
      icon: <SparklesIcon size={22} />,
      title: "Spatial Hydrodynamics",
      summary:
        "Tier 2 screening model calculating rainfall-runoff accumulation via the Rational Method (Q = C · I · A) and astronomical tide sluice lockout.",
      signals: ["Scenario Playback", "Time-Step Horizon", "Ward Risk Ranking", "Depression Retention"],
      link: `/admin/${citySlug}/simulation`,
      cta: "Open Simulation Lab",
    },
    {
      step: "04",
      pillar: "Decide",
      icon: <FileTextIcon size={22} />,
      title: "AI Synthesis & Reporting",
      summary:
        "Multi-role Groq LLM synthesis producing publication-grade vector PDF dossiers with mathematical calculation traces and vector charts.",
      signals: ["City Overviews", "Ward Dossiers", "Vector SVG Charts", "Evidence Links"],
      link: `/admin/${citySlug}/simulation/report`,
      cta: "Open Report Studio",
    },
    {
      step: "05",
      pillar: "Respond",
      icon: <ShieldIcon size={22} />,
      title: "Civic & Dept Operations",
      summary:
        "Deterministic routing of citizen hazard reports to BMC Stormwater Drains, Solid Waste, and Health with supervisor verification.",
      signals: ["Citizen Voice/Text", "Department Dispatch", "SLA Timers", "Immutable Audit"],
      link: `/department`,
      cta: "Inspect Operations",
    },
  ];

  return (
    <section id="capabilities" className="py-20 sm:py-24 border-t border-border bg-surface-0/60 dark:bg-[#070b12]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-1 border border-border text-xs font-semibold text-text-secondary mb-3">
            <span>THE FIVE-PILLAR SYSTEM</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-text-primary tracking-tight mb-4">
            One Unified Architecture. Five Interconnected Capabilities.
          </h2>
          <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
            Sentinel City Intelligence is not a disjointed set of tools. Environmental observations
            inform spatial models; models ground AI analysis; and evidence drives municipal response.
          </p>
        </div>

        {/* 5-Pillar Connected Grid */}
        <div className="relative">
          {/* Subtle Desktop Connector Line */}
          <div className="hidden xl:block absolute top-1/2 left-8 right-8 h-0.5 bg-border -translate-y-16 z-0" />

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 relative z-10">
            {capabilities.map((cap) => (
              <div
                key={cap.step}
                className="flex flex-col justify-between p-5 rounded-2xl bg-surface-0 dark:bg-[#0d1424] border border-border hover:border-primary/40 hover:shadow-md transition-all group"
              >
                <div>
                  {/* Step & Pillar Tag */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-surface-2 text-text-secondary">
                      {cap.step}
                    </span>
                    <span className="text-xs font-black uppercase tracking-wider text-primary">
                      {cap.pillar}
                    </span>
                  </div>

                  {/* Icon & Title */}
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    {cap.icon}
                  </div>
                  <h3 className="text-base font-bold text-text-primary mb-2">
                    {cap.title}
                  </h3>

                  {/* Summary */}
                  <p className="text-xs text-text-secondary leading-relaxed mb-4">
                    {cap.summary}
                  </p>

                  {/* Signal Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {cap.signals.map((sig) => (
                      <span
                        key={sig}
                        className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-surface-1 dark:bg-[#111927] border border-border/80 text-text-tertiary"
                      >
                        {sig}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Card Link CTA */}
                <Link
                  href={cap.link}
                  className="inline-flex items-center justify-between w-full pt-3 border-t border-border text-xs font-semibold text-primary group-hover:text-primary-hover transition-colors"
                >
                  <span>{cap.cta}</span>
                  <ArrowRightIcon size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
