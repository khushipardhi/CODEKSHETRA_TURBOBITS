/* ════════════════════════════════════════════════════════
   Admin Audit Log — Live Activity & System Trail
   Chronological events from TiDB incident_status_history
   ════════════════════════════════════════════════════════ */

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card, Badge } from "@/components/ui";
import { ClockIcon, UserIcon, ShieldIcon, SearchIcon } from "@/components/ui/icons";
import { useCityContext } from "@/components/providers/city-provider";

interface AuditEntry {
  id: string;
  event: string;
  actor: string;
  target: string;
  targetId: string;
  detail: string;
  timestamp: string;
}

const eventBadgeVariant = (event: string) => {
  if (event.includes("RESOLVED") || event.includes("CLOSED")) return "success" as const;
  if (event.includes("IN_PROGRESS") || event.includes("ASSIGNED") || event.includes("ROUTED")) return "accent" as const;
  if (event.includes("SUBMITTED")) return "default" as const;
  return "warning" as const;
};

export default function AdminAuditPage() {
  const { city, cityConfig } = useCityContext();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchAuditLogs();
  }, [city]);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/audit?city=${city}&limit=60`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.events || []);
      }
    } catch (err) {
      console.error("[AdminAudit] Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = entries.filter((e) => {
    const q = search.toLowerCase();
    return (
      e.event.toLowerCase().includes(q) ||
      e.actor.toLowerCase().includes(q) ||
      e.target.toLowerCase().includes(q) ||
      e.detail.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            System Audit & Operation Logs
          </h1>
          <p className="text-sm text-text-tertiary mt-1">
            Immutable chronological record of incident lifecycle, AI triage, and status transitions
          </p>
        </div>

        <button
          onClick={fetchAuditLogs}
          className="px-4 py-2 bg-surface-1 hover:bg-surface-2 border border-border rounded-xl text-xs font-bold text-text-primary transition-all cursor-pointer shadow-sm self-start sm:self-auto"
        >
          🔄 Refresh Stream
        </button>
      </div>

      {/* Search Filter */}
      <div className="relative">
        <SearchIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter audit events by reference ID, actor, or description..."
          className="w-full pl-10 pr-4 py-2.5 bg-surface-0 border border-border rounded-xl text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
      </div>

      {/* Audit List */}
      <div className="bg-surface-0 border border-border rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-text-tertiary">Loading live audit trail...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-surface-1 flex items-center justify-center mx-auto mb-3 text-text-tertiary">
              <ShieldIcon size={24} />
            </div>
            <p className="text-sm font-bold text-text-primary">No audit records found</p>
            <p className="text-xs text-text-tertiary mt-1">
              Events will automatically appear here as citizens report issues and officers process them.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((entry) => (
              <div
                key={entry.id}
                className="px-6 py-4 hover:bg-surface-1/60 transition-colors flex items-start justify-between gap-4 flex-wrap sm:flex-nowrap"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-9 h-9 rounded-2xl bg-surface-1 border border-border flex items-center justify-center text-accent flex-shrink-0 mt-0.5 shadow-sm">
                    <ShieldIcon size={16} />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Badge variant={eventBadgeVariant(entry.event)}>
                        {entry.event.replace(/_/g, " ")}
                      </Badge>

                      <Link
                        href={`/admin/incidents?search=${encodeURIComponent(entry.targetId)}`}
                        className="text-xs font-mono font-bold text-accent hover:underline"
                      >
                        → {entry.target}
                      </Link>
                    </div>

                    <p className="text-xs sm:text-sm text-text-primary leading-relaxed">
                      {entry.detail}
                    </p>

                    <div className="flex items-center gap-2 mt-1.5 text-[11px] text-text-tertiary">
                      <UserIcon size={12} />
                      <span>{entry.actor}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[11px] font-semibold text-text-tertiary flex-shrink-0">
                  <ClockIcon size={13} />
                  <span>
                    {new Date(entry.timestamp).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
