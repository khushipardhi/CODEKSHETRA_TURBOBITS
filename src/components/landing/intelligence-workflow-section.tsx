"use client";

import React from "react";
import {
  ActivityIcon,
  MapIcon,
  SparklesIcon,
  FileTextIcon,
  ShieldIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
} from "@/components/ui/icons";

export function IntelligenceWorkflowSection() {
  const steps = [
    {
      step: "01",
      name: "Data Sources",
      badge: "PHYSICAL & SENSOR",
      icon: <ActivityIcon size={20} />,
      desc: "Numerical weather models (ECMWF, GFS), CPCB ambient air quality, astronomical tides (INCOIS), and citizen observations.",
      distinction: "Observations ≠ Forecasts (Numerical models predict; sensors observe real state).",
    },
    {
      step: "02",
      name: "Geographic Context",
      badge: "SPATIAL TOPOLOGY",
      icon: <MapIcon size={20} />,
      desc: "Assimilation into 24 BMC administrative wards, Copernicus 30m DEM terrain, and 219 unclustered municipal facilities.",
      distinction: "Grid Averages ≠ Hyper-Local Curbs (11 km grid cells do not resolve 15cm street curbs).",
    },
    {
      step: "03",
      name: "Analysis & Simulation",
      badge: "HYDRODYNAMICS",
      icon: <SparklesIcon size={20} />,
      desc: "Rational Runoff calculation (Q = C · I · A), topographic saucer sink depth retention, and tidal sluice gate lockout efficiency.",
      distinction: "Screening Models ≠ Real-Time Floods (Simulations assess susceptibility, not confirmed depth).",
    },
    {
      step: "04",
      name: "Evidence-Based Interpretation",
      badge: "GROQ AI SYNTHESIS",
      icon: <FileTextIcon size={20} />,
      desc: "Multi-role Groq LLM reasoning (Evidence Analyst, Impact Analyst, Report Editor) with runtime anti-hallucination guardrails.",
      distinction: "AI Explanations ≠ Statutory Alarms (AI interprets evidence; only BMC Disaster Cell issues orders).",
    },
    {
      step: "05",
      name: "Review & Action",
      badge: "MUNICIPAL DISPATCH",
      icon: <ShieldIcon size={20} />,
      desc: "Deterministic routing to Stormwater Drains, Health, Solid Waste, and Fire with supervisor proof-of-work state machines.",
      distinction: "Workflows Require Human Review (Automated triage assists; human supervisors verify closure).",
    },
  ];

  return (
    <section className="py-20 sm:py-24 border-t border-border bg-surface-1/40 dark:bg-[#060a10]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary mb-3">
            <span>OPERATIONAL RIGOR</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-text-primary tracking-tight mb-4">
            How the Intelligence Workflow Operates
          </h2>
          <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
            From raw numerical model grids to verified field dispatch, each transformation step is
            deterministic, source-grounded, and mathematically accountable.
          </p>
        </div>

        {/* 5-Stage Stepper Flow */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 relative mb-12">
          {steps.map((s, idx) => (
            <div
              key={s.step}
              className="p-5 rounded-2xl bg-surface-0 dark:bg-[#0c1220] border border-border flex flex-col justify-between shadow-xs hover:border-primary/40 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-surface-2 text-text-secondary">
                    {s.step}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-primary uppercase">
                    {s.badge}
                  </span>
                </div>

                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                  {s.icon}
                </div>
                <h3 className="text-sm font-bold text-text-primary mb-2">{s.name}</h3>
                <p className="text-xs text-text-secondary leading-relaxed mb-4">
                  {s.desc}
                </p>
              </div>

              {/* Distinction / Transparency Box */}
              <div className="p-2.5 rounded-lg bg-surface-1 dark:bg-[#111927] border border-border/80 text-[11px] text-text-tertiary flex items-start gap-1.5">
                <AlertTriangleIcon size={14} className="text-amber-500 shrink-0 mt-0.5" />
                <span className="font-medium">{s.distinction}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Accountability & Honesty Callout Banner */}
        <div className="p-6 rounded-2xl bg-surface-0 dark:bg-[#0c1220] border border-border flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
              <CheckCircleIcon size={24} />
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-bold text-text-primary">
                Scientific Honesty & Operational Transparency
              </h4>
              <p className="text-xs text-text-secondary">
                We believe software credibility requires knowing what a model can and cannot do.
                Screening tiers, sensor latencies, and missing feeds are prominently disclosed on every screen.
              </p>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-full bg-surface-2 text-text-secondary">
              ZERO FABRICATED METRICS
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
