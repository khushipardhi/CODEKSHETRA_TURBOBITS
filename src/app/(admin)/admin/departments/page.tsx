/* ════════════════════════════════════════════════════════
   Admin Departments Management — All 17 City Departments
   Live TiDB Incident Counts · SLAs · Facilities · Status
   ════════════════════════════════════════════════════════ */

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card, Badge } from "@/components/ui";
import {
  BuildingIcon,
  CheckCircleIcon,
  ClockIcon,
  SearchIcon,
  FileTextIcon,
  AlertTriangleIcon,
} from "@/components/ui/icons";
import { useCityContext } from "@/components/providers/city-provider";

interface DepartmentItem {
  code: string;
  name: string;
  nameMarathi?: string;
  icon: string;
  description: string;
  scope: string;
  priorityBand: string;
  slaHours: number;
  status: string;
  activeIncidents: number;
  resolvedIncidents: number;
  totalIncidents: number;
  criticalCount: number;
  facilitiesCount: number;
}

export default function AdminDepartmentsPage() {
  const { city, cityConfig } = useCityContext();
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  useEffect(() => {
    fetchDepartments();
  }, [city]);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/departments?city=${city}`);
      if (res.ok) {
        const data = await res.json();
        setDepartments(data.departments || []);
      }
    } catch (err) {
      console.error("[AdminDepartments] Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = departments.filter((d) => {
    const q = search.toLowerCase();
    const matchesSearch =
      d.name.toLowerCase().includes(q) ||
      d.code.toLowerCase().includes(q) ||
      (d.nameMarathi && d.nameMarathi.includes(q)) ||
      d.description.toLowerCase().includes(q);

    const matchesPriority =
      priorityFilter === "ALL" || d.priorityBand === priorityFilter;

    return matchesSearch && matchesPriority;
  });

  const totalActive = departments.reduce((s, d) => s + d.activeIncidents, 0);
  const totalCritical = departments.reduce((s, d) => s + d.criticalCount, 0);

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            City Departments & Services
          </h1>
          <p className="text-sm text-text-tertiary mt-0.5">
            Monitor workloads, SLAs, and active incidents across all 17 municipal departments
          </p>
        </div>

        {/* Global summary pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-3.5 py-1.5 bg-surface-1 border border-border rounded-xl text-xs font-semibold">
            Total Departments: <span className="text-accent font-bold">17</span>
          </div>
          <div className="px-3.5 py-1.5 bg-warning-bg text-warning border border-warning-border rounded-xl text-xs font-bold">
            Active Workload: {totalActive}
          </div>
          {totalCritical > 0 && (
            <div className="px-3.5 py-1.5 bg-critical-bg text-critical border border-critical-border rounded-xl text-xs font-bold animate-pulse">
              🚨 Critical: {totalCritical}
            </div>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <SearchIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search department by name, Marathi title, or keyword..."
            className="w-full pl-10 pr-4 py-2.5 bg-surface-0 border border-border rounded-xl text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-1.5 bg-surface-0 border border-border p-1 rounded-xl flex-shrink-0">
          {[
            { id: "ALL", label: "All (17)" },
            { id: "IMMEDIATE_EMERGENCY", label: "Emergency" },
            { id: "URGENT", label: "Urgent" },
            { id: "STANDARD", label: "Standard" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setPriorityFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                priorityFilter === tab.id
                  ? "bg-accent text-white shadow-sm"
                  : "text-text-tertiary hover:text-text-primary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Departments Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-text-tertiary">Loading live department workloads...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-surface-0 border border-border rounded-3xl">
          <p className="text-sm font-bold text-text-primary">No departments match search query</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((dept) => {
            const isEmergency = dept.priorityBand === "IMMEDIATE_EMERGENCY";

            return (
              <div
                key={dept.code}
                className="bg-surface-0 border border-border hover:border-accent/40 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar with Icon & Status */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-surface-1 border border-border flex items-center justify-center text-2xl shadow-inner">
                      {dept.icon}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {dept.criticalCount > 0 && (
                        <span className="px-2 py-0.5 bg-critical-bg text-critical border border-critical/30 rounded-full text-[10px] font-bold">
                          {dept.criticalCount} Critical
                        </span>
                      )}
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          isEmergency
                            ? "bg-red-500/10 text-red-600 border-red-500/20"
                            : dept.priorityBand === "URGENT"
                              ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                              : "bg-surface-2 text-text-secondary border-border"
                        }`}
                      >
                        SLA: {dept.slaHours}h
                      </span>
                    </div>
                  </div>

                  {/* Department Names */}
                  <h3 className="text-base font-bold text-text-primary flex items-center gap-1.5">
                    {dept.name}
                  </h3>
                  {dept.nameMarathi && (
                    <p className="text-xs text-accent font-medium mt-0.5">
                      {dept.nameMarathi}
                    </p>
                  )}
                  <p className="text-xs text-text-tertiary mt-2 line-clamp-2 leading-relaxed">
                    {dept.description}
                  </p>
                </div>

                {/* Bottom Workload Metrics */}
                <div className="mt-4 pt-4 border-t border-border space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-surface-1 p-2 rounded-xl">
                      <p className="text-xs font-bold text-accent">{dept.activeIncidents}</p>
                      <p className="text-[9px] uppercase font-bold text-text-tertiary">Active</p>
                    </div>
                    <div className="bg-surface-1 p-2 rounded-xl">
                      <p className="text-xs font-bold text-success">{dept.resolvedIncidents}</p>
                      <p className="text-[9px] uppercase font-bold text-text-tertiary">Resolved</p>
                    </div>
                    <div className="bg-surface-1 p-2 rounded-xl">
                      <p className="text-xs font-bold text-text-primary">{dept.facilitiesCount}</p>
                      <p className="text-[9px] uppercase font-bold text-text-tertiary">Facilities</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-text-tertiary font-mono">
                      Code: {dept.code}
                    </span>
                    <Link
                      href={`/admin/${city}/incidents?search=${encodeURIComponent(dept.name)}`}
                      className="text-xs font-bold text-accent hover:underline flex items-center gap-1"
                    >
                      View Incidents →
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
