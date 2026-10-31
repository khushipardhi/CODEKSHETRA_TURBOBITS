"use client";

import React from "react";
import Link from "next/link";
import {
  BuildingIcon,
  MapIcon,
  ActivityIcon,
  SparklesIcon,
  FileTextIcon,
  ShieldIcon,
  ArrowRightIcon,
  UserIcon,
} from "@/components/ui/icons";

interface WorkspacesDirectorySectionProps {
  citySlug: string;
}

export function WorkspacesDirectorySection({ citySlug }: WorkspacesDirectorySectionProps) {
  const workspaces = [
    {
      title: "Admin Command Centre",
      role: "MUNICIPAL LEADERSHIP",
      roleBadge: "ADMIN",
      route: "/admin",
      icon: <BuildingIcon size={22} />,
      desc: "Executive operational overview displaying citywide KPIs, active incident queues, SLA breach monitors, and department dispatch status.",
      accent: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    },
    {
      title: "Hazard & Incident Map",
      role: "GIS & OPERATIONS",
      roleBadge: "OPERATIONAL",
      route: `/admin/map`,
      icon: <MapIcon size={22} />,
      desc: "Interactive Leaflet GIS console featuring default OpenStreetMap streaming, 219 unclustered facilities, and layer toggles.",
      accent: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      title: "Environmental Telemetry Lab",
      role: "DATA ANALYSTS",
      roleBadge: "ANALYTICS",
      route: `/admin/${citySlug}/telemetry-lab`,
      icon: <ActivityIcon size={22} />,
      desc: "Comprehensive 64-parameter matrix auditing weather, hydrology, air quality, and marine wave models with threshold tracking.",
      accent: "text-sky-500 bg-sky-500/10 border-sky-500/20",
    },
    {
      title: "Spatial Simulation Lab",
      role: "DISASTER PLANNERS",
      roleBadge: "SIMULATION",
      route: `/admin/${citySlug}/simulation`,
      icon: <SparklesIcon size={22} />,
      desc: "Tier 2 Hydrodynamic Screening workspace evaluating Copernicus DEM saucer sinks, rainfall hyetographs, and tidal sluice lockouts.",
      accent: "text-orange-500 bg-orange-500/10 border-orange-500/20",
    },
    {
      title: "Simulation Report Studio",
      role: "DECISION SUPPORT",
      roleBadge: "REPORTING",
      route: `/admin/${citySlug}/simulation/report`,
      icon: <FileTextIcon size={22} />,
      desc: "Full-width 1280px workspace generating publication-grade multi-page vector PDF dossiers, 24-ward matrix tables, and vector charts.",
      accent: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
    },
    {
      title: "Sentinel AI Assistant",
      role: "PUBLIC & OFFICIALS",
      roleBadge: "AI REASONING",
      route: `/${citySlug}/sentinel`,
      icon: <SparklesIcon size={22} />,
      desc: "Conversational assistant grounded in municipal datasets, explaining uncertainty, localized weather, and nearest public shelters.",
      accent: "text-purple-500 bg-purple-500/10 border-purple-500/20",
    },
    {
      title: "Citizen Hazard Dashboard",
      role: "RESIDENTS & VISITORS",
      roleBadge: "PUBLIC ACCESS",
      route: `/${citySlug}/dashboard`,
      icon: <UserIcon size={22} />,
      desc: "Localized area briefing, ray-casting ward location context, nearest designated emergency shelters, and accessible non-map table view.",
      accent: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    },
    {
      title: "Civic Reports Portal",
      role: "COMMUNITY REPORTING",
      roleBadge: "FIELD INPUT",
      route: `/${citySlug}/report`,
      icon: <ShieldIcon size={22} />,
      desc: "Multi-modal voice and text hazard reporting interface routing issues deterministically to responsible municipal departments.",
      accent: "text-rose-500 bg-rose-500/10 border-rose-500/20",
    },
  ];

  return (
    <section id="workspaces" className="py-20 sm:py-24 border-t border-border bg-surface-1/40 dark:bg-[#060a10]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary mb-3">
            <span>PLATFORM DIRECTORY</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-text-primary tracking-tight mb-4">
            Explore the Workspaces
          </h2>
          <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
            Sentinel provides distinct, purpose-built workspaces tailored for citizens, municipal
            planners, GIS engineers, department supervisors, and emergency commanders.
          </p>
        </div>

        {/* 8-Card Directory Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {workspaces.map((ws) => (
            <Link
              key={ws.title}
              href={ws.route}
              className="p-5 rounded-2xl bg-surface-0 dark:bg-[#0c1220] border border-border hover:border-primary/40 hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${ws.accent}`}>
                    {ws.icon}
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-surface-2 text-text-secondary">
                    {ws.roleBadge}
                  </span>
                </div>

                <div className="text-[10px] font-mono font-bold text-text-tertiary uppercase tracking-wider mb-1">
                  {ws.role}
                </div>
                <h3 className="text-base font-bold text-text-primary mb-2 group-hover:text-primary transition-colors">
                  {ws.title}
                </h3>
                <p className="text-xs text-text-secondary leading-relaxed mb-4">
                  {ws.desc}
                </p>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-between text-xs font-semibold text-primary">
                <span>Enter Workspace</span>
                <ArrowRightIcon size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
