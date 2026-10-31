"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ActivityIcon,
  MapIcon,
  AlertTriangleIcon,
  SparklesIcon,
  ShieldIcon,
  FileTextIcon,
  ArrowRightIcon,
  CheckCircleIcon,
} from "@/components/ui/icons";

interface InteractiveIntelligenceCanvasProps {
  citySlug: string;
}

export function InteractiveIntelligenceCanvas({ citySlug }: InteractiveIntelligenceCanvasProps) {
  const [activeLayer, setActiveLayer] = useState<number>(0);

  const layers = [
    {
      id: "observations",
      title: "Environmental Observations",
      badge: "LIVE ATMOSPHERIC FEEDS",
      icon: <ActivityIcon size={18} />,
      heading: "ECMWF IFS, Open-Meteo & CPCB Sensor Feeds",
      description:
        "High-cadence atmospheric numerical model grids (0.1° / ~11 km) and national ambient air quality telemetry assimilated at 15-minute intervals.",
      metrics: [
        { label: "Surface Air Temp", value: "27.8 °C", unit: "ECMWF IFS", status: "NORMAL" },
        { label: "Hourly Precipitation", value: "0.0 mm/h", unit: "Open-Meteo", status: "DRY" },
        { label: "Fine Particulate (PM2.5)", value: "60.8 µg/m³", unit: "CPCB NAAQS", status: "MODERATE" },
        { label: "Astronomical Tide Level", value: "3.20 m CD", unit: "INCOIS Model", status: "EBB PHASE" },
      ],
      provenance: "Open-Meteo & ECMWF IFS Reanalysis · WGS-84 Grid · Updated 15m ago",
      workspaceUrl: `/admin/${citySlug}/telemetry-lab`,
      workspaceLabel: "Explore Full Telemetry Lab",
      schematicSvg: (
        <g>
          {/* Atmospheric Grid Mesh */}
          <rect x="20" y="20" width="360" height="200" fill="none" stroke="#0284c7" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.3" />
          <line x1="140" y1="20" x2="140" y2="220" stroke="#0284c7" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.3" />
          <line x1="260" y1="20" x2="260" y2="220" stroke="#0284c7" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.3" />
          <line x1="20" y1="90" x2="380" y2="90" stroke="#0284c7" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.3" />
          <line x1="20" y1="150" x2="380" y2="150" stroke="#0284c7" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.3" />
          {/* Weather Isobars */}
          <ellipse cx="200" cy="120" rx="90" ry="60" fill="#0284c7" fillOpacity="0.08" stroke="#0284c7" strokeWidth="1.5" />
          <ellipse cx="200" cy="120" rx="140" ry="90" fill="none" stroke="#38bdf8" strokeWidth="1" strokeDasharray="4 2" />
          <text x="180" y="105" fill="#0284c7" fontSize="10" fontWeight="bold">1012 hPa</text>
          <circle cx="200" cy="120" r="4" fill="#0284c7" />
          <text x="185" y="138" fill="#0284c7" fontSize="8">Santacruz AWS Grid Point</text>
        </g>
      ),
    },
    {
      id: "geography",
      title: "Geographic & Ward Context",
      badge: "CANONICAL MUNICIPAL TOPOLOGY",
      icon: <MapIcon size={18} />,
      heading: "24 BMC Wards & 219 Critical Municipal Assets",
      description:
        "Topological boundaries validated against official MCGM administrative shapefiles. 219 unclustered facilities mapped with exact coordinates and attributes.",
      metrics: [
        { label: "Administrative Wards", value: "24 Wards", unit: "Wards A to T", status: "VERIFIED" },
        { label: "Municipal Facilities", value: "219 Assets", unit: "Pumping, Depots, Fire", status: "MAPPED" },
        { label: "Coordinate Reference", value: "EPSG:4326", unit: "RFC 7946 GeoJSON", status: "STANDARDS" },
        { label: "Zonal Boundaries", value: "7 Zones", unit: "MCGM Complete Coastal", status: "ISOLATED" },
      ],
      provenance: "MCGM GIS Department & BharatMaps · CC BY-SA 4.0 · 24 Polygons",
      workspaceUrl: `/admin/map`,
      workspaceLabel: "Inspect Municipal GIS Layers",
      schematicSvg: (
        <g>
          {/* 24 Wards Polygons */}
          <polygon points="120,30 180,25 195,65 140,75" fill="#f8fafc" fillOpacity="0.15" stroke="#64748b" strokeWidth="1" />
          <polygon points="140,75 210,65 230,115 160,125" fill="#f8fafc" fillOpacity="0.25" stroke="#64748b" strokeWidth="1" />
          <polygon points="160,125 240,115 255,170 180,180" fill="#f8fafc" fillOpacity="0.15" stroke="#64748b" strokeWidth="1" />
          <polygon points="180,180 250,170 230,225 170,220" fill="#f8fafc" fillOpacity="0.20" stroke="#64748b" strokeWidth="1" />
          {/* Facility Markers */}
          <circle cx="165" cy="95" r="5" fill="#0284c7" />
          <circle cx="205" cy="140" r="5" fill="#dc2626" />
          <circle cx="190" cy="195" r="5" fill="#16a34a" />
          <circle cx="150" cy="50" r="5" fill="#d97706" />
          <text x="175" y="99" fill="#0284c7" fontSize="8" fontWeight="bold">SWD Pumping Station</text>
          <text x="215" y="144" fill="#dc2626" fontSize="8" fontWeight="bold">Fire Command Hq</text>
        </g>
      ),
    },
    {
      id: "hazards",
      title: "Hazard Analysis & Sluices",
      badge: "CHRONIC HOTSPOTS & LOCKOUT",
      icon: <AlertTriangleIcon size={18} />,
      heading: "Inundation Vulnerability & Gravity Sluice Mechanics",
      description:
        "Identifies chronic low-elevation waterlogging sinks (Bail Bazar, Hindmata, Milan Subway) and gravity drainage throttling during Arabian Sea tidal high water.",
      metrics: [
        { label: "Mithi River Outfall", value: "Locked", unit: "Tide ≥ 4.5m CD", status: "THROTTLED" },
        { label: "Chronic Inundation Sinks", value: "14 Locations", unit: "Historically Verified", status: "MONITORED" },
        { label: "Discharge Efficiency", value: "15 %", unit: "Spring High Water", status: "RESTRICTED" },
        { label: "Backwater Length", value: "4.2 km", unit: "Mithi Estuary Channel", status: "SURCHARGED" },
      ],
      provenance: "INCOIS Tidal Tables & BMC Disaster Management Cell Historical Records",
      workspaceUrl: `/admin/${citySlug}/simulation`,
      workspaceLabel: "View Hazard Hotspot Analysis",
      schematicSvg: (
        <g>
          {/* River Estuary Vector */}
          <path d="M 120 40 Q 180 100 170 140 T 210 220" fill="none" stroke="#0284c7" strokeWidth="6" opacity="0.4" />
          {/* Sluice Gate Indicator */}
          <rect x="195" y="180" width="28" height="10" fill="#dc2626" rx="2" />
          <text x="230" y="188" fill="#dc2626" fontSize="8" fontWeight="bold">Sluice Lockout (High Tide)</text>
          {/* Chronic Hotspots Rings */}
          <circle cx="170" cy="100" r="14" fill="#ea580c" fillOpacity="0.25" stroke="#ea580c" strokeWidth="1.5" />
          <text x="110" y="103" fill="#ea580c" fontSize="8" fontWeight="bold">Bail Bazar Sink</text>
          <circle cx="170" cy="150" r="12" fill="#dc2626" fillOpacity="0.25" stroke="#dc2626" strokeWidth="1.5" />
          <text x="100" y="153" fill="#dc2626" fontSize="8" fontWeight="bold">Hindmata Basin</text>
        </g>
      ),
    },
    {
      id: "simulation",
      title: "Simulation Outputs & Saucers",
      badge: "TIER 2 HYDRODYNAMIC SCREENING",
      icon: <SparklesIcon size={18} />,
      heading: "Copernicus DEM Runoff Accumulation (Q = C · I · A)",
      description:
        "Deterministic mathematical model integrating ESA WorldCover impervious runoff coefficients with 30m Copernicus GLO-30 DEM depression depths.",
      metrics: [
        { label: "Top Inundated Ward", value: "Ward L (Kurla)", unit: "Depression: 6.9m ASL", status: "CRITICAL" },
        { label: "Secondary Risk Ward", value: "Ward F/North", unit: "Depression: 4.2m ASL", status: "ELEVATED" },
        { label: "Simulation Time-Step", value: "T = 3.0 Hours", unit: "Peak Inundation", status: "ACTIVE" },
        { label: "Mathematical Basis", value: "Rational Runoff", unit: "Q = C · I · A", status: "VERIFIED" },
      ],
      provenance: "Copernicus GLO-30 DEM (ESA 30m) & Rational Hydrology Engine",
      workspaceUrl: `/admin/${citySlug}/simulation`,
      workspaceLabel: "Launch Simulation Workspace",
      schematicSvg: (
        <g>
          {/* Gradient Inundation Raster Fill */}
          <rect x="60" y="40" width="280" height="160" rx="16" fill="url(#inundationGrad)" opacity="0.35" />
          <defs>
            <radialGradient id="inundationGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#dc2626" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#ea580c" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.1" />
            </radialGradient>
          </defs>
          <circle cx="200" cy="115" r="28" fill="#dc2626" fillOpacity="0.4" stroke="#dc2626" strokeWidth="2" />
          <text x="160" y="118" fill="#ffffff" fontSize="9" fontWeight="bold">Ward L Depression</text>
          <text x="165" y="130" fill="#ffffff" fontSize="7">Depth: +42% vs Base</text>
        </g>
      ),
    },
    {
      id: "operations",
      title: "Civic Records & Operations",
      badge: "GROUND-TRUTH & DISPATCH",
      icon: <ShieldIcon size={18} />,
      heading: "Citizen Hazard Reports & Municipal Work Orders",
      description:
        "Citizen voice/text field reports route deterministically to BMC Stormwater Drains, Solid Waste, and Health with geofenced task management.",
      metrics: [
        { label: "Citizen Reports", value: "Active", unit: "Voice & Text", status: "TRIAGED" },
        { label: "Routing Engine", value: "Deterministic", unit: "Taxonomy Keyed", status: "AUTOMATED" },
        { label: "State Machines", value: "Non-Bypassable", unit: "Supervisor Verified", status: "ENFORCED" },
        { label: "Audit Ledger", value: "TiDB Serverless", unit: "21 Tables Active", status: "IMMUTABLE" },
      ],
      provenance: "TiDB Cloud Serverless MySQL & Municipal Routing Matrix",
      workspaceUrl: `/department`,
      workspaceLabel: "Open Department Operations",
      schematicSvg: (
        <g>
          {/* Citizen Incident Nodes */}
          <circle cx="150" cy="70" r="8" fill="#ea580c" />
          <circle cx="230" cy="130" r="8" fill="#dc2626" />
          <circle cx="170" cy="180" r="8" fill="#0284c7" />
          {/* Dispatch Routing Connectors */}
          <path d="M 150 70 L 280 50" stroke="#ea580c" strokeWidth="1.5" strokeDasharray="3 3" />
          <path d="M 230 130 L 280 120" stroke="#dc2626" strokeWidth="1.5" strokeDasharray="3 3" />
          <path d="M 170 180 L 280 190" stroke="#0284c7" strokeWidth="1.5" strokeDasharray="3 3" />
          <rect x="270" y="38" width="95" height="24" rx="4" fill="#ea580c" fillOpacity="0.15" stroke="#ea580c" />
          <text x="276" y="53" fill="#ea580c" fontSize="8" fontWeight="bold">BMC Stormwater Drains</text>
          <rect x="270" y="108" width="95" height="24" rx="4" fill="#dc2626" fillOpacity="0.15" stroke="#dc2626" />
          <text x="276" y="123" fill="#dc2626" fontSize="8" fontWeight="bold">Fire & Rescue Service</text>
          <rect x="270" y="178" width="95" height="24" rx="4" fill="#0284c7" fillOpacity="0.15" stroke="#0284c7" />
          <text x="276" y="193" fill="#0284c7" fontSize="8" fontWeight="bold">Solid Waste Mgmt</text>
        </g>
      ),
    },
    {
      id: "reports",
      title: "Evidence-Linked Reports",
      badge: "PUBLICATION VECTOR PDFS",
      icon: <FileTextIcon size={18} />,
      heading: "Automated Municipal Briefings & Vector Dossiers",
      description:
        "Generates multi-page vector PDF dossiers with standalone SVG maps, chronological rainfall charts, ward matrix tables, and sensor outage disclosures.",
      metrics: [
        { label: "City Overview PDF", value: "630 KB", unit: "4 Pages ISO A4", status: "VALIDATED" },
        { label: "Ward L Dossier PDF", value: "633 KB", unit: "3 Pages Deep Dive", status: "VALIDATED" },
        { label: "Telemetry PDF", value: "263 KB", unit: "2 Pages with Charts", status: "VALIDATED" },
        { label: "Vector Map Engine", value: "1200 DPI", unit: "Zero Screen Scraping", status: "HIGH RES" },
      ],
      provenance: "Puppeteer Vector Renderer · ISO A4 Strict Layout · Print Media Rules",
      workspaceUrl: `/admin/${citySlug}/simulation/report`,
      workspaceLabel: "Open Simulation Report Studio",
      schematicSvg: (
        <g>
          {/* Document Sheet Schematic */}
          <rect x="130" y="25" width="140" height="190" rx="6" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
          {/* Document Header Band */}
          <rect x="140" y="35" width="120" height="14" fill="#0f172a" rx="2" />
          <text x="145" y="45" fill="#ffffff" fontSize="6" fontWeight="bold">MUMBAI DISASTER MANAGEMENT</text>
          {/* Vector Map Placeholder */}
          <rect x="140" y="55" width="120" height="60" fill="#f1f5f9" stroke="#e2e8f0" rx="3" />
          <circle cx="200" cy="85" r="14" fill="#ea580c" fillOpacity="0.3" stroke="#ea580c" strokeWidth="1" />
          <text x="180" y="88" fill="#ea580c" fontSize="6" fontWeight="bold">Vector Map Layer</text>
          {/* Document Text Lines */}
          <line x1="140" y1="125" x2="250" y2="125" stroke="#94a3b8" strokeWidth="2" />
          <line x1="140" y1="133" x2="230" y2="133" stroke="#cbd5e1" strokeWidth="2" />
          <line x1="140" y1="141" x2="240" y2="141" stroke="#cbd5e1" strokeWidth="2" />
          {/* Metric Box */}
          <rect x="140" y="152" width="55" height="22" rx="3" fill="#f8fafc" stroke="#e2e8f0" />
          <rect x="205" y="152" width="55" height="22" rx="3" fill="#f8fafc" stroke="#e2e8f0" />
          <text x="146" y="166" fill="#0f172a" fontSize="7" fontWeight="bold">64.5 mm/h</text>
          <text x="211" y="166" fill="#dc2626" fontSize="7" fontWeight="bold">Tier 2 Risk</text>
        </g>
      ),
    },
  ];

  const current = layers[activeLayer];

  return (
    <section id="interactive-canvas" className="py-20 sm:py-24 border-t border-border bg-surface-0 dark:bg-[#070b12]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Title */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary mb-3">
            <span>INTERACTIVE EXPLORER</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-text-primary tracking-tight mb-4">
            Interactive City Intelligence Canvas
          </h2>
          <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
            Select an intelligence layer below to explore how physical telemetry, municipal GIS,
            hydrodynamic simulations, and field operations synchronize into one system.
          </p>
        </div>

        {/* Layer Selector Bar */}
        <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
          {layers.map((l, idx) => (
            <button
              key={l.id}
              onClick={() => setActiveLayer(idx)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeLayer === idx
                  ? "bg-primary text-white shadow-sm border border-primary"
                  : "bg-surface-1 dark:bg-[#111927] hover:bg-surface-2 text-text-secondary border border-border"
              }`}
            >
              <span>{l.icon}</span>
              <span>{l.title}</span>
            </button>
          ))}
        </div>

        {/* Dynamic Display Canvas */}
        <div className="rounded-2xl border border-border bg-surface-1/40 dark:bg-[#0c1220] p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center shadow-lg">
          {/* Left 7 Cols: Interactive SVG Schematic */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center">
            <div className="relative w-full h-72 sm:h-88 rounded-xl bg-surface-0 dark:bg-[#080d18] border border-border flex items-center justify-center p-4 overflow-hidden shadow-inner">
              {/* Subtle grid background */}
              <div
                className="absolute inset-0 opacity-10 dark:opacity-15 pointer-events-none"
                style={{
                  backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)",
                  backgroundSize: "16px 16px",
                }}
              />

              {/* Render Selected Layer SVG */}
              <svg className="w-full h-full max-h-[300px]" viewBox="0 0 400 240">
                {current.schematicSvg}
              </svg>

              {/* Top Layer Stamp */}
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded bg-surface-1/90 dark:bg-[#111927]/90 border border-border text-[10px] font-mono font-bold text-text-secondary">
                LAYER {activeLayer + 1}: {current.badge}
              </div>

              {/* Bottom Scope Stamp */}
              <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded bg-surface-1/90 dark:bg-[#111927]/90 border border-border text-[10px] font-mono text-text-tertiary">
                Scope: Greater Mumbai (24 Wards)
              </div>
            </div>
          </div>

          {/* Right 5 Cols: Layer Dossier & Actions */}
          <div className="lg:col-span-5 space-y-5">
            <div>
              <span className="text-xs font-mono font-bold text-primary tracking-wider uppercase">
                {current.badge}
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-text-primary mt-1 mb-2">
                {current.heading}
              </h3>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                {current.description}
              </p>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              {current.metrics.map((m) => (
                <div key={m.label} className="p-3 rounded-xl bg-surface-0 dark:bg-[#111927] border border-border">
                  <div className="text-[10px] font-semibold text-text-tertiary uppercase truncate">
                    {m.label}
                  </div>
                  <div className="text-base font-bold font-mono text-text-primary mt-0.5">
                    {m.value}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-text-tertiary mt-1">
                    <span>{m.unit}</span>
                    <span className="font-semibold text-primary">{m.status}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Provenance Disclosure */}
            <div className="p-3 rounded-lg bg-surface-2/60 dark:bg-[#0f172a] border border-border text-[11px] text-text-tertiary flex items-start gap-2">
              <CheckCircleIcon size={14} className="text-emerald-500 shrink-0 mt-0.5" />
              <span>{current.provenance}</span>
            </div>

            {/* Direct Link to Corresponding Workspace */}
            <Link
              href={current.workspaceUrl}
              className="inline-flex items-center justify-center gap-2 w-full py-3 px-5 rounded-xl bg-primary text-white text-xs sm:text-sm font-bold hover:bg-primary-hover shadow-sm transition-all"
            >
              <span>{current.workspaceLabel}</span>
              <ArrowRightIcon size={16} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
