"use client";

import React from "react";
import Link from "next/link";
import {
  FileTextIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  MapIcon,
  ChartIcon,
  ShieldIcon,
} from "@/components/ui/icons";

interface ReportingDecisionSupportSectionProps {
  citySlug: string;
}

export function ReportingDecisionSupportSection({ citySlug }: ReportingDecisionSupportSectionProps) {
  const reports = [
    {
      title: "City-Wide Simulation Overview (Level A)",
      description: "Executive summary, 24 BMC ward susceptibility matrix, aggregate residential buffer exposure, and municipal consequence SOPs.",
      pages: "4 Pages · ISO A4",
      fileSize: "630 KB",
      href: "/api/admin/reports/simulation-pdf?dossierId=DOS-COASTAL_MONSOON_SURGE-T6H-MVE9F1AC&scope=citywide",
      previewBadge: "EXECUTIVE BRIEFING",
    },
    {
      title: "Deep Ward-Level Dossier: Ward L (Level B)",
      description: "Detailed hydrological analysis of Kurla saucer depression (6.9m ASL), Rational formula calculation trace, and Bail Bazar hotspot.",
      pages: "3 Pages · ISO A4",
      fileSize: "634 KB",
      href: "/api/admin/reports/simulation-pdf?dossierId=DOS-COASTAL_MONSOON_SURGE-T6H-MVE9F1AC&ward=L&scope=ward_detail",
      previewBadge: "DEEP WARD AUDIT",
    },
    {
      title: "Multi-Hazard Telemetry Overview Dossier",
      description: "64-parameter audit matrix, 7-point quality diagnostics, NOAA Rothfusz Heat Index, and standalone SVG vector time-series charts.",
      pages: "2 Pages · ISO A4",
      fileSize: "264 KB",
      href: "/api/admin/reports/telemetry-pdf?city=mumbai&tab=overview",
      previewBadge: "SENSOR ASSIMILATION",
    },
    {
      title: "Precipitation & Hydrology Telemetry Report",
      description: "Hourly precipitation intensity, probability curves, and IMD statutory threshold indicator lines (64.5 mm/h Very Heavy).",
      pages: "2 Pages · ISO A4",
      fileSize: "248 KB",
      href: "/api/admin/reports/telemetry-pdf?city=mumbai&tab=rainfall",
      previewBadge: "HYDROLOGY PROFILE",
    },
  ];

  return (
    <section className="py-20 sm:py-24 border-t border-border bg-surface-1/40 dark:bg-[#060a10]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-3">
              <span>DECISION SUPPORT & DOSSIERS</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-text-primary tracking-tight mb-3">
              Publication-Grade Reports & Vector PDF Exports
            </h2>
            <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
              Every simulation run and telemetry snapshot can be exported into an immutable,
              multi-page vector PDF dossier. Designed strictly for municipal disaster management
              coordination with zero browser screen-scraping artifacts.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            <Link
              href={`/admin/${citySlug}/simulation/report`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white text-xs sm:text-sm font-bold hover:bg-primary-hover shadow-md transition-all"
            >
              <span>Launch Report Studio Workspace</span>
              <ArrowRightIcon size={16} />
            </Link>
          </div>
        </div>

        {/* 4 Report Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
          {reports.map((r) => (
            <div
              key={r.title}
              className="p-5 rounded-2xl bg-surface-0 dark:bg-[#0c1220] border border-border hover:border-primary/40 shadow-xs transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-surface-2 text-text-secondary uppercase">
                    {r.previewBadge}
                  </span>
                  <span className="text-[10px] font-mono text-text-tertiary">
                    {r.pages}
                  </span>
                </div>

                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-3">
                  <FileTextIcon size={20} />
                </div>

                <h3 className="text-sm font-bold text-text-primary mb-2 line-clamp-2">
                  {r.title}
                </h3>
                <p className="text-xs text-text-secondary leading-relaxed mb-4 line-clamp-3">
                  {r.description}
                </p>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-between">
                <span className="text-[11px] font-mono text-text-tertiary">{r.fileSize}</span>
                <a
                  href={r.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                >
                  <span>Download PDF</span>
                  <ArrowRightIcon size={12} />
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Report Studio Highlight Box */}
        <div className="rounded-2xl border border-border bg-surface-0 dark:bg-[#0c1220] p-6 sm:p-8 flex flex-col lg:flex-row items-center justify-between gap-6 shadow-md">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <h4 className="text-base font-bold text-text-primary">
                Full-Width Simulation Report Studio Available
              </h4>
            </div>
            <p className="text-xs sm:text-sm text-text-secondary max-w-2xl leading-relaxed">
              Access the dedicated 1280px full-width Report Studio with sticky section navigation
              (Sections A through H), interactive 24-ward ranking matrix, and instant export to
              Markdown, CSV, and vector PDF formats.
            </p>
          </div>

          <Link
            href={`/admin/${citySlug}/simulation/report`}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-text-primary text-canvas text-xs font-bold hover:opacity-90 text-center transition-all shrink-0"
          >
            Open Dedicated Report Studio →
          </Link>
        </div>
      </div>
    </section>
  );
}
