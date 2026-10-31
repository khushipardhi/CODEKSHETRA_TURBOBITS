/* ════════════════════════════════════════════════════════
   Admin Incidents List — Live data from TiDB
   Filterable, paginated, real incident records
   ════════════════════════════════════════════════════════ */

"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, Badge, Input } from "@/components/ui";
import { SearchIcon } from "@/components/ui/icons";
import Link from "next/link";
import { useCityContext } from "@/components/providers/city-provider";

/* ─── Types ─── */
interface IncidentItem {
  id: string;
  publicReference: string;
  category: string | null;
  subcategory: string | null;
  status: string;
  severity: string | null;
  priorityScore: number | null;
  title: string | null;
  citizenSummary: string | null;
  locationText: string | null;
  isEmergency: boolean;
  createdAt: string;
  confirmedAt: string | null;
  departments: { code: string; name: string; status: string }[];
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/* ─── Helpers ─── */
const severityVariant = (s: string | null) => {
  switch (s) {
    case "CRITICAL": return "critical" as const;
    case "HIGH": return "high" as const;
    case "MEDIUM": return "medium" as const;
    case "LOW": return "low" as const;
    default: return "default" as const;
  }
};

const statusLabel = (s: string) => {
  const map: Record<string, string> = {
    DRAFT: "Draft", CONFIRMED: "Confirmed", ROUTED: "Routed",
    ASSIGNED: "Assigned", IN_PROGRESS: "In Progress",
    WORK_COMPLETED: "Work Complete", RESOLVED: "Resolved", CLOSED: "Closed",
  };
  return map[s] || s;
};

function timeAgo(dateStr: string): string {
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function AdminIncidentsPage() {
  const { city, cityConfig } = useCityContext();
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [incidents, setIncidents] = useState<IncidentItem[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchIncidents = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (city) params.set("city", city);
      if (severityFilter !== "ALL") params.set("severity", severityFilter);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (search) params.set("search", search);
      params.set("page", String(page));
      params.set("limit", "15");

      const res = await fetch(`/api/admin/incidents?${params}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setIncidents(data.incidents || []);
          setPagination(data.pagination || null);
        }
      }
    } catch (err) {
      console.error("[AdminIncidents] Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [city, severityFilter, statusFilter, search, page]);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [severityFilter, statusFilter, search, city]);

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">All Incidents — {cityConfig.name}</h1>
        <p className="text-sm text-text-tertiary mt-1">
          Manage and monitor all civic incident reports across {cityConfig.name}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Search by ID, title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={<SearchIcon size={16} />}
          className="flex-1"
        />
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="bg-surface-1 border border-border rounded-md px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent min-w-[140px]"
        >
          <option value="ALL">All Severity</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-surface-1 border border-border rounded-md px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent min-w-[140px]"
        >
          <option value="ALL">All Status</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="ROUTED">Routed</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="WORK_COMPLETED">Work Completed</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>

      {/* Results Count */}
      <p className="text-xs text-text-tertiary">
        {loading
          ? "Loading..."
          : pagination
          ? `Showing ${incidents.length} of ${pagination.total} incidents (page ${pagination.page}/${pagination.totalPages})`
          : `${incidents.length} incidents`}
      </p>

      {/* Incidents Table */}
      <Card padding="none">
        {/* Table Header */}
        <div className="hidden lg:grid grid-cols-[1fr_120px_120px_1fr_100px_80px] gap-4 px-6 py-3 border-b border-divider text-xs font-semibold text-text-tertiary uppercase tracking-wider">
          <span>Incident</span>
          <span>Severity</span>
          <span>Status</span>
          <span>Departments</span>
          <span>Priority</span>
          <span>Time</span>
        </div>

        {/* Loading */}
        {loading && (
          <div className="px-6 py-12 text-center">
            <div className="animate-spin inline-block w-6 h-6 border-2 border-accent border-t-transparent rounded-full mb-2" />
            <p className="text-sm text-text-tertiary">Loading incidents...</p>
          </div>
        )}

        {/* Empty */}
        {!loading && incidents.length === 0 && (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-text-tertiary">
              No incidents found. Citizen reports will appear here.
            </p>
          </div>
        )}

        {/* Table Rows */}
        {!loading && (
          <div className="divide-y divide-divider">
            {incidents.map((incident) => (
              <Link
                key={incident.publicReference}
                href={`/admin/${city}/incidents/${incident.publicReference}`}
                className="block lg:grid lg:grid-cols-[1fr_120px_120px_1fr_100px_80px] gap-4 px-6 py-4 hover:bg-surface-1 transition-colors"
              >
                {/* Incident */}
                <div className="min-w-0">
                  <p className="text-xs text-text-tertiary font-mono">{incident.publicReference}</p>
                  <p className="text-sm font-medium truncate mt-0.5">
                    {incident.title || "Untitled report"}
                  </p>
                  <p className="text-xs text-text-tertiary mt-0.5 lg:hidden">
                    {incident.departments.map((d) => d.name).join(" · ")} · {timeAgo(incident.createdAt)}
                  </p>
                </div>
                {/* Severity */}
                <div className="hidden lg:flex items-center">
                  <Badge variant={severityVariant(incident.severity)}>
                    {incident.severity || "—"}
                  </Badge>
                </div>
                {/* Status */}
                <div className="hidden lg:flex items-center">
                  <Badge variant="default">{statusLabel(incident.status)}</Badge>
                </div>
                {/* Departments */}
                <div className="hidden lg:flex items-center gap-1 flex-wrap">
                  {incident.departments.length > 0 ? (
                    incident.departments.map((d) => (
                      <span key={d.code} className="text-xs text-text-tertiary bg-surface-2 px-2 py-0.5 rounded">
                        {d.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-text-tertiary">—</span>
                  )}
                </div>
                {/* Priority */}
                <div className="hidden lg:flex items-center">
                  <span className="text-sm font-mono text-text-secondary">
                    {incident.priorityScore ?? "—"}
                  </span>
                </div>
                {/* Time */}
                <div className="hidden lg:flex items-center">
                  <span className="text-xs text-text-tertiary">{timeAgo(incident.createdAt)}</span>
                </div>

                {/* Mobile badges */}
                <div className="flex items-center gap-2 mt-2 lg:hidden">
                  <Badge variant={severityVariant(incident.severity)}>
                    {incident.severity || "—"}
                  </Badge>
                  <Badge variant="default">{statusLabel(incident.status)}</Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="px-3 py-1.5 text-sm bg-surface-1 border border-border rounded-lg disabled:opacity-30 hover:bg-surface-2 transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            ← Prev
          </button>
          <span className="text-sm text-text-tertiary px-3">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
            disabled={page >= pagination.totalPages}
            className="px-3 py-1.5 text-sm bg-surface-1 border border-border rounded-lg disabled:opacity-30 hover:bg-surface-2 transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
