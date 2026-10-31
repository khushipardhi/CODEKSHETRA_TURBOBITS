"use client";

import React from "react";
import Link from "next/link";
import { ArrowRightIcon, SparklesIcon, BuildingIcon, MapIcon } from "@/components/ui/icons";

interface ClosingCtaSectionProps {
  citySlug: string;
}

export function ClosingCtaSection({ citySlug }: ClosingCtaSectionProps) {
  return (
    <section className="py-20 sm:py-24 border-t border-border bg-surface-0 dark:bg-[#070b12]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="p-10 sm:p-14 rounded-3xl bg-gradient-to-b from-surface-1 to-surface-2/60 dark:from-[#0d1424] dark:to-[#080d18] border border-border shadow-xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
            <SparklesIcon size={14} />
            <span>OPERATIONAL MUNICIPAL INTELLIGENCE</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-text-primary tracking-tight leading-tight max-w-2xl mx-auto">
            Ready to Anticipate Risk and Act With Evidence?
          </h2>

          <p className="text-sm sm:text-base text-text-secondary max-w-xl mx-auto leading-relaxed">
            Access municipal telemetry, run hydrodynamic screening scenarios, consult Sentinel AI,
            or submit field hazard reports on one synchronized platform.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href={`/admin/${citySlug}/simulation`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-primary text-white hover:bg-primary-hover text-sm font-bold rounded-xl shadow-md transition-all"
            >
              <span>Launch Simulation Lab</span>
              <ArrowRightIcon size={16} />
            </Link>

            <Link
              href={`/${citySlug}/dashboard`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-surface-0 dark:bg-[#111927] hover:bg-surface-2 text-text-primary text-sm font-bold rounded-xl border border-border shadow-xs transition-all"
            >
              <MapIcon size={16} />
              <span>Open Citizen Dashboard</span>
            </Link>

            <Link
              href="/admin"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 text-xs sm:text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors"
            >
              <BuildingIcon size={16} />
              <span>Command Console</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
