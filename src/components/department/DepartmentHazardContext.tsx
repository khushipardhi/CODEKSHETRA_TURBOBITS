/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Department Hazard Context Module
   Injects tailored multi-hazard telemetry & evidence into department desks.
   ════════════════════════════════════════════════════════ */

"use client";

import React, { useState, useEffect } from "react";
import { useCityContext } from "@/components/providers/city-provider";

interface DepartmentHazardContextProps {
  city: string;
  departmentCode: string;
}

export function DepartmentHazardContext({ city, departmentCode }: DepartmentHazardContextProps) {
  const { cityConfig } = useCityContext();
  const [feed, setFeed] = useState<any>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/hazards/feed?city=${city}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success) setFeed(json.data);
        }
      } catch (err) {
        console.warn("[DeptHazardContext] Error:", err);
      }
    }
    load();
  }, [city]);

  if (!feed) return null;

  const weather = feed.currentTelemetry?.weather;
  const aqi = feed.currentTelemetry?.airQuality;
  const assessment = feed.assessment;
  const activeAlerts = feed.activeAlerts || [];

  // Tailor advice to department type
  const isDrainage = departmentCode === "drainage" || departmentCode === "water_supply";
  const isFire = departmentCode === "fire_brigade";
  const isHealth = departmentCode === "health_dept";
  const isRoads = departmentCode === "road_maintenance" || departmentCode === "pwd";

  return (
    <div className="mb-6 p-4 rounded-2xl bg-surface-1 border border-border shadow-xs animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">🛡️</span>
          <div>
            <h3 className="font-bold text-sm text-text-primary leading-tight">
              Sentinel Operational Hazard Context
            </h3>
            <p className="text-[11px] text-text-tertiary">
              Live environmental telemetry grounded for {cityConfig.name} operations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase ${
            (assessment?.riskScore || 0) >= 75
              ? "bg-rose-500/20 text-rose-600 border border-rose-500/30"
              : (assessment?.riskScore || 0) >= 60
              ? "bg-amber-500/20 text-amber-600 border border-amber-500/30"
              : "bg-emerald-500/20 text-emerald-600 border border-emerald-500/30"
          }`}>
            Risk: {assessment ? `${assessment.riskScore}/100 (${assessment.riskLevel})` : "LOW"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
        <div className="p-2.5 rounded-xl bg-surface-0 border border-border/80">
          <p className="text-[10px] uppercase font-bold text-text-tertiary">Rainfall Rate</p>
          <p className="text-sm font-bold text-text-primary font-mono mt-0.5">
            {weather ? `${weather.rainfallRateMmH.toFixed(1)} mm/h` : "0.0 mm/h"}
          </p>
          <p className="text-[10px] text-text-tertiary">24h: {weather?.forecast24hTotalMm || 0}mm</p>
        </div>

        <div className="p-2.5 rounded-xl bg-surface-0 border border-border/80">
          <p className="text-[10px] uppercase font-bold text-text-tertiary">Air Quality Index</p>
          <p className="text-sm font-bold text-text-primary font-mono mt-0.5">
            AQI {aqi?.usAqi || 75}
          </p>
          <p className="text-[10px] text-text-tertiary">{aqi?.category || "Moderate"}</p>
        </div>

        <div className="p-2.5 rounded-xl bg-surface-0 border border-border/80">
          <p className="text-[10px] uppercase font-bold text-text-tertiary">Published Warnings</p>
          <p className="text-sm font-bold text-text-primary font-mono mt-0.5">
            {activeAlerts.length} Active
          </p>
          <p className="text-[10px] text-text-tertiary">Municipal broadcast</p>
        </div>

        <div className="p-2.5 rounded-xl bg-surface-0 border border-border/80">
          <p className="text-[10px] uppercase font-bold text-text-tertiary">Muster Center</p>
          <p className="text-xs font-bold text-text-primary truncate mt-0.5">
            {cityConfig.hazardCapabilities?.musterPoints?.[0]?.name || "Disaster Cell"}
          </p>
          <p className="text-[10px] text-text-tertiary font-mono">
            {cityConfig.hazardCapabilities?.emergencyHelpline || "1916"}
          </p>
        </div>
      </div>

      {/* Tailored Department Advisory */}
      <div className="mt-3 p-3 rounded-xl bg-surface-0 border border-border text-xs text-text-secondary leading-relaxed">
        {isDrainage && (
          <p>
            <strong className="text-text-primary">🌊 Drainage Roster Protocol:</strong> Monitor stormwater nullahs and low-lying depression basins. Inspect trash racks at pumping stations if precipitation exceeds 25 mm/h.
          </p>
        )}
        {isFire && (
          <p>
            <strong className="text-text-primary">🚒 Rescue Readiness Protocol:</strong> High-water rescue teams on standby for low-lying waterlogged underpasses. Verify inflatable rescue dinghies and de-watering pump fuel reserves.
          </p>
        )}
        {isHealth && (
          <p>
            <strong className="text-text-primary">🏥 Public Health Protocol:</strong> Review emergency ward beds and hydration packets. Monitor air particulate levels and post-monsoon stagnant water pooling sites for anti-larval spraying.
          </p>
        )}
        {isRoads && (
          <p>
            <strong className="text-text-primary">🚧 Public Works Protocol:</strong> Pre-deploy asphalt cold-mix crews and barricades for recurrent flood bottlenecks. Maintain lane closures around deep excavation sites.
          </p>
        )}
        {!isDrainage && !isFire && !isHealth && !isRoads && (
          <p>
            <strong className="text-text-primary">📋 Municipal Protocol:</strong> Maintain standard emergency coordination with the {cityConfig.municipalAbbr} Central Disaster Management Control Room.
          </p>
        )}
      </div>
    </div>
  );
}
