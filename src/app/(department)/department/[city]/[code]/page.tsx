/* ════════════════════════════════════════════════════════
   Department Operations Console — /department/[city]/[code]
   City-scoped Real KPI data + Critical Alerts + Facilities
   ════════════════════════════════════════════════════════ */

"use client";

import { useState, useEffect, use } from "react";
import { DepartmentHeader } from "@/components/department/DepartmentHeader";
import { DepartmentSubNav } from "@/components/department/DepartmentSubNav";
import { DepartmentStats } from "@/components/department/DepartmentStats";
import { CriticalIncidentPanel } from "@/components/department/CriticalIncidentPanel";
import { DepartmentOpsModule } from "@/components/department/DepartmentOpsModule";
import { DepartmentHazardContext } from "@/components/department/DepartmentHazardContext";
import { DEPARTMENT_REGISTRY } from "@/lib/department-registry";
import { useCityContext } from "@/components/providers/city-provider";

interface DeptKPI {
  total: number;
  active: number;
  pending: number;
  resolved: number;
  critical: number;
  todayCount: number;
  resolutionRate: number;
}

interface CriticalIncident {
  id: string;
  trackingId: string;
  category: string;
  location: string;
  affectedCount?: number;
  status: string;
}

export default function CityDepartmentOperationsConsole({
  params,
}: {
  params: Promise<{ city: string; code: string }>;
}) {
  const { city, code } = use(params);
  const { cityConfig } = useCityContext();
  const dept = DEPARTMENT_REGISTRY[code] || { name: code, icon: "📋" };

  const [kpi, setKpi] = useState<DeptKPI | null>(null);
  const [criticalIncidents, setCriticalIncidents] = useState<CriticalIncident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        // Fetch KPIs scoped to this city
        const statsRes = await fetch(`/api/department/${code}/stats?city=${city}`);
        if (statsRes.ok) {
          const d = await statsRes.json();
          if (d.success) setKpi(d.kpi);
        }

        // Fetch critical incidents scoped to this city
        const incRes = await fetch(
          `/api/department/${code}/incidents?limit=10&status=&city=${city}`
        );
        if (incRes.ok) {
          const d = await incRes.json();
          if (d.success && d.incidents) {
            const critical = d.incidents
              .filter(
                (inc: any) =>
                  (inc.severity === "CRITICAL" || inc.severity === "HIGH") &&
                  inc.deptStatus !== "RESOLVED" &&
                  inc.deptStatus !== "CLOSED"
              )
              .map((inc: any) => ({
                id: inc.incidentId || inc.id || inc.publicReference,
                trackingId: inc.publicReference || inc.trackingId,
                category: inc.title && inc.title.trim() && !inc.title.toLowerCase().includes("untitled")
                  ? inc.title.trim()
                  : inc.citizenSummary || inc.category || "Emergency Civic Report",
                location: inc.locationText || inc.location || cityConfig.name,
                status: inc.deptStatus || inc.status || "ROUTED",
              }));
            setCriticalIncidents(critical);
          }
        }
      } catch (err) {
        console.error("[DeptOps] Load error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [city, code, cityConfig.name]);

  return (
    <div className="space-y-6 fade-in">
      <DepartmentHeader
        departmentName={`${dept.name} (${cityConfig.name})`}
        departmentIcon={dept.icon}
        criticalCount={kpi?.critical || 0}
      />

      <DepartmentSubNav departmentCode={code} city={city} />

      {/* Sentinel Multi-Hazard Context & Operational Protocol */}
      <DepartmentHazardContext city={city} departmentCode={code} />

      {loading && (
        <div className="text-center py-16 text-slate-400">
          <div className="animate-spin inline-block w-8 h-8 border-2 border-accent border-t-transparent rounded-full mb-3" />
          <p className="text-sm font-medium">Loading {cityConfig.name} operational data...</p>
        </div>
      )}

      {!loading && kpi && (
        <>
          <DepartmentStats
            total={kpi.total}
            active={kpi.active}
            pending={kpi.pending}
            resolved={kpi.resolved}
            resolutionRate={kpi.resolutionRate}
          />

          <CriticalIncidentPanel
            incidents={criticalIncidents}
            onViewIncident={(id) => {
              window.location.href = `/department/${city}/${code}/incidents`;
            }}
          />

          <DepartmentOpsModule
            departmentCode={code}
            departmentName={dept.name}
            city={city}
          />
        </>
      )}

      {!loading && !kpi && (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-2">
          <span className="text-4xl block">📭</span>
          <h3 className="text-base font-bold text-slate-900">No Data Available in {cityConfig.name}</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No incidents have been routed to {dept.name} in {cityConfig.name} yet.
          </p>
        </div>
      )}
    </div>
  );
}
