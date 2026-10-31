"use client";

import React from "react";
import Link from "next/link";
import {
  ShieldIcon,
  BuildingIcon,
  MapIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  MicrophoneIcon,
  KeyboardIcon,
} from "@/components/ui/icons";

interface CivicOperationsSectionProps {
  citySlug: string;
}

export function CivicOperationsSection({ citySlug }: CivicOperationsSectionProps) {
  const steps = [
    {
      num: "01",
      title: "Citizen Hazard Report",
      subtitle: "Voice or Text Multi-Modal Entry",
      desc: "Citizens report localized waterlogging, tree falls, or drainage blockages via voice or text with GPS pin capture.",
    },
    {
      num: "02",
      title: "Deterministic Triage",
      subtitle: "Taxonomy & Severity Keyed",
      desc: "Our classification engine maps the report against 14 municipal hazard taxonomies and calculates initial severity.",
    },
    {
      num: "03",
      title: "Department Routing",
      subtitle: "Authoritative Jurisdiction",
      desc: "Automatically assigned to BMC Stormwater Drains, Solid Waste, Health, Roads, or Fire Brigade without bureaucracy.",
    },
    {
      num: "04",
      title: "Geofenced Work Order",
      subtitle: "Field Worker Task Queue",
      desc: "Department workers receive geofenced task notifications with navigation routes and required equipment lists.",
    },
    {
      num: "05",
      title: "Supervisor Verification",
      subtitle: "Immutable Audit Trail",
      desc: "Proof-of-work before/after photos and supervisor sign-off are required to transition task status to closed in TiDB.",
    },
  ];

  return (
    <section className="py-20 sm:py-24 border-t border-border bg-surface-0 dark:bg-[#070b12]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-600 dark:text-blue-400 mb-3">
            <span>GROUND-TRUTH SENSOR NETWORK</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-text-primary tracking-tight mb-4">
            Civic Reporting as an Operational Risk Signal
          </h2>
          <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
            Citizen reports are not isolated complaints. In Sentinel, every civic submission serves as
            a ground-truth sensor reading that validates numerical models and triggers accountable departmental dispatch.
          </p>
        </div>

        {/* 5-Step Civic Workflow Stepper */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-14">
          {steps.map((s, idx) => (
            <div
              key={s.num}
              className="p-5 rounded-2xl bg-surface-1 dark:bg-[#0c1220] border border-border flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs font-bold text-primary">{s.num}</span>
                  <span className="text-[10px] font-mono text-text-tertiary">STAGE</span>
                </div>
                <h3 className="text-sm font-bold text-text-primary mb-1">{s.title}</h3>
                <div className="text-[11px] font-medium text-primary mb-2">{s.subtitle}</div>
                <p className="text-xs text-text-secondary leading-relaxed">{s.desc}</p>
              </div>

              {idx < 4 && (
                <div className="pt-3 text-right text-text-tertiary hidden md:block">
                  <ArrowRightIcon size={14} className="inline opacity-40" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Action Dual Banner */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* For Citizens */}
          <div className="p-6 sm:p-7 rounded-2xl bg-surface-1 dark:bg-[#0c1220] border border-border flex flex-col justify-between">
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <MicrophoneIcon size={18} />
                </div>
                <h4 className="text-base font-bold text-text-primary">
                  Citizen Reporting Portal
                </h4>
              </div>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                Notice street waterlogging, a fallen branch, or an overflowing drain? Submit a voice or
                text report with exact location pin. Track resolution progress in real time.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href={`/${citySlug}/report`}
                className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover shadow-xs transition-all"
              >
                File a Civic Report →
              </Link>
              <Link
                href="/track"
                className="px-4 py-2.5 rounded-xl bg-surface-2 hover:bg-surface-3 border border-border text-xs font-semibold text-text-primary transition-all"
              >
                Track Existing Report
              </Link>
            </div>
          </div>

          {/* For Municipal Operations */}
          <div className="p-6 sm:p-7 rounded-2xl bg-surface-1 dark:bg-[#0c1220] border border-border flex flex-col justify-between">
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center">
                  <BuildingIcon size={18} />
                </div>
                <h4 className="text-base font-bold text-text-primary">
                  Department Operations Console
                </h4>
              </div>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                Municipal department officers can triage incoming work orders, assign field workers,
                monitor SLA breach countdowns, and verify resolution evidence before closing tickets.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/department"
                className="px-5 py-2.5 rounded-xl bg-text-primary text-canvas text-xs font-bold hover:opacity-90 shadow-xs transition-all"
              >
                Enter Department Console →
              </Link>
              <Link
                href="/admin"
                className="px-4 py-2.5 rounded-xl bg-surface-2 hover:bg-surface-3 border border-border text-xs font-semibold text-text-primary transition-all"
              >
                Admin Command Centre
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
