"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui";
import Link from "next/link";

interface DeptWorkload {
  code: string;
  name: string;
  active: number;
  pending: number;
  resolved: number;
}

const DEPT_META: Record<string, { icon: string; name: string; tag: string }> = {
  fire_brigade: { icon: "🔥", name: "Fire Brigade", tag: "Emergency Fire & Rescue Operations" },
  police: { icon: "🛡️", name: "City Police", tag: "Law Enforcement & Zonal Patrols" },
  health_dept: { icon: "🏥", name: "Health Dept", tag: "Public Health & Hospital Network" },
  ambulance: { icon: "🚑", name: "Ambulance Services", tag: "108 Critical ALS Medical Transport" },
  road_maintenance: { icon: "🛣️", name: "Roads / PWD", tag: "Asphalt Patching & Infrastructure" },
  public_works: { icon: "🏗️", name: "Public Works", tag: "Civil Works & Engineering Projects" },
  water_supply: { icon: "💧", name: "Water Supply", tag: "Pench & Kanhan Pumping Network" },
  drainage: { icon: "🌊", name: "Drainage", tag: "Stormwater & Sewer Line Clearing" },
  traffic_police: { icon: "🚦", name: "Traffic Police", tag: "Corridor Clearance & Enforcement" },
  traffic_management: { icon: "🚗", name: "Traffic Mgmt", tag: "Smart Signal Control & VMS" },
  forest_wildlife: { icon: "🐅", name: "Forest & Wildlife", tag: "Gorewada Range & Conflict Cell" },
  women_child_safety: { icon: "🛡️", name: "Women & Child Safety", tag: "DWCD, Sakhi OSC & Bharosa Cell" },
  electrical_services: { icon: "⚡", name: "Electrical Services", tag: "11kV Power Feeder & Lighting" },
  electricity: { icon: "⚡", name: "Electricity Dept", tag: "Substation Grid & Transformers" },
  waste_management: { icon: "🗑️", name: "Waste Management", tag: "Solid Waste & Compactor Tippers" },
  environment: { icon: "🌿", name: "Environment", tag: "Tree Protection & Horticulture" },
  disaster_management: { icon: "🚨", name: "Disaster Mgmt", tag: "Nag River Flood & Civil Crisis" },
  municipal_corp: { icon: "🏛️", name: "NMC Zonal HQ", tag: "Central Municipal Administration" },
};

const ALL_DEPT_CODES = Object.keys(DEPT_META);

export default function DepartmentHub() {
  const [deptWorkloads, setDeptWorkloads] = useState<DeptWorkload[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/stats");
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.departments) {
            setDeptWorkloads(data.departments);
          }
        }
      } catch {
        // Non-fatal
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const workloadMap = new Map(deptWorkloads.map((d) => [d.code, d]));
  const allDepts = ALL_DEPT_CODES.map((code) => {
    const meta = DEPT_META[code];
    const workload = workloadMap.get(code);
    return {
      code,
      icon: meta.icon,
      name: meta.name,
      tag: meta.tag,
      active: workload?.active || 0,
      pending: workload?.pending || 0,
      resolved: workload?.resolved || 0,
      total: (workload?.active || 0) + (workload?.pending || 0) + (workload?.resolved || 0),
    };
  });

  allDepts.sort((a, b) => b.total - a.total);

  return (
    <div className="space-y-8 pb-16 w-full max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-accent"></span>
            <span className="text-xs font-bold text-accent tracking-widest uppercase">
              Nagpur Connect • Central Command Hub
            </span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">
            Department Operations Portals
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Access dedicated portals with live incident queues, verified stations from geodata, and task dispatch pipelines
          </p>
        </div>
      </div>

      {loading && (
        <div className="text-center py-16 text-slate-400">
          <div className="animate-spin inline-block w-8 h-8 border-2 border-accent border-t-transparent rounded-full mb-3" />
          <p className="text-sm font-medium">Connecting to department registries...</p>
        </div>
      )}

      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {allDepts.map((dept) => {
            const pct = dept.total > 0 ? Math.round((dept.resolved / dept.total) * 100) : 0;

            return (
              <Link key={dept.code} href={`/department/${dept.code}`} className="block group">
                <div className="relative rounded-2xl p-5 bg-white border border-slate-200 hover:border-slate-300 shadow-xs hover:shadow-md transition-all duration-200 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-2xl shadow-xs group-hover:scale-105 transition-transform">
                        {dept.icon}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900 group-hover:text-accent transition-colors">
                          {dept.name}
                        </h3>
                        <p className="text-[11px] text-slate-500 font-medium">{dept.tag}</p>
                      </div>
                    </div>
                    {dept.pending > 0 && (
                      <Badge variant="high" className="text-[10px] font-bold">
                        {dept.pending} Live
                      </Badge>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-amber-600 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> {dept.active} Active
                      </span>
                      <span className="text-emerald-600 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> {dept.resolved} Resolved
                      </span>
                    </div>

                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(10, pct)}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span className="font-mono text-[10px]">/{dept.code}</span>
                    <span className="text-accent font-bold group-hover:translate-x-0.5 transition-transform">
                      Open Dedicated Portal →
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
