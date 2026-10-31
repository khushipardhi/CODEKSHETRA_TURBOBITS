/* ════════════════════════════════════════════════════════
   Admin Portal — Citizens Directory & User Management
   Live data from TiDB, Search, Zone filters, Report counts
   ════════════════════════════════════════════════════════ */

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card, Badge } from "@/components/ui";
import { UserIcon, SearchIcon, ShieldIcon, FileTextIcon } from "@/components/ui/icons";

interface AdminCitizen {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  wardZone: string | null;
  address: string | null;
  emergencyContact: string | null;
  bio: string | null;
  notificationEmailEnabled: boolean;
  avatarUrl: string | null;
  authProvider: "google" | "guest";
  totalReports: number;
  resolvedReports: number;
  createdAt: string;
  updatedAt: string;
}

export default function AdminUsersPage() {
  const [citizens, setCitizens] = useState<AdminCitizen[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [authFilter, setAuthFilter] = useState<"ALL" | "GOOGLE" | "GUEST">("ALL");
  const [selectedCitizen, setSelectedCitizen] = useState<AdminCitizen | null>(null);

  useEffect(() => {
    fetchCitizens();
  }, [search]);

  const fetchCitizens = async () => {
    setLoading(true);
    try {
      const q = search.trim() ? `?q=${encodeURIComponent(search.trim())}` : "";
      const res = await fetch(`/api/admin/citizens${q}`, {
        headers: { "x-admin-token": "admin" },
      });
      if (res.ok) {
        const data = await res.json();
        setCitizens(data.citizens || []);
      }
    } catch (err) {
      console.error("Failed to load citizens:", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = citizens.filter((c) => {
    if (authFilter === "GOOGLE") return c.authProvider === "google";
    if (authFilter === "GUEST") return c.authProvider === "guest";
    return true;
  });

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Citizens & User Directory
          </h1>
          <p className="text-sm text-text-tertiary mt-0.5">
            Registered Google citizens, guest reporters, and contact registry for Sentinel City Intelligence
          </p>
        </div>

        {/* Stats summary pill */}
        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 bg-surface-1 border border-border rounded-xl text-xs font-semibold">
            Total Users: <span className="text-accent font-bold">{citizens.length}</span>
          </div>
          <div className="px-3.5 py-1.5 bg-accent/10 text-accent rounded-xl text-xs font-bold">
            Google Verified: {citizens.filter((c) => c.authProvider === "google").length}
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <SearchIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, phone number, or Nagpur zone..."
            className="w-full pl-10 pr-4 py-2.5 bg-surface-0 border border-border rounded-xl text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 bg-surface-0 border border-border p-1 rounded-xl flex-shrink-0">
          <button
            onClick={() => setAuthFilter("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              authFilter === "ALL" ? "bg-accent text-white shadow-sm" : "text-text-tertiary hover:text-text-primary"
            }`}
          >
            All Users
          </button>
          <button
            onClick={() => setAuthFilter("GOOGLE")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              authFilter === "GOOGLE" ? "bg-accent text-white shadow-sm" : "text-text-tertiary hover:text-text-primary"
            }`}
          >
            Google Login
          </button>
          <button
            onClick={() => setAuthFilter("GUEST")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              authFilter === "GUEST" ? "bg-accent text-white shadow-sm" : "text-text-tertiary hover:text-text-primary"
            }`}
          >
            Guest Users
          </button>
        </div>
      </div>

      {/* Citizens Table */}
      <Card padding="none">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-text-tertiary">Loading citizen records...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-surface-1 flex items-center justify-center mx-auto mb-3 text-text-tertiary">
              <UserIcon size={24} />
            </div>
            <p className="text-sm font-bold text-text-primary">No citizens found</p>
            <p className="text-xs text-text-tertiary mt-1">
              Citizens will automatically appear here when they log in or submit civic reports.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-1 border-b border-divider text-text-tertiary text-[11px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Citizen</th>
                  <th className="px-4 py-3">Auth / Email</th>
                  <th className="px-4 py-3">Contact / Phone</th>
                  <th className="px-4 py-3">Zone / Ward</th>
                  <th className="px-4 py-3 text-center">Reports Filed</th>
                  <th className="px-4 py-3">Joined Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-surface-1/60 transition-colors">
                    {/* Citizen avatar + Name */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {c.avatarUrl ? (
                          <img
                            src={c.avatarUrl}
                            alt={c.name}
                            className="w-9 h-9 rounded-full object-cover border border-border"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-accent/10 text-accent font-bold text-xs flex items-center justify-center">
                            {c.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-text-primary text-xs sm:text-sm">{c.name}</p>
                          <p className="text-[10px] text-text-tertiary font-mono">ID: {c.id.slice(0, 10)}...</p>
                        </div>
                      </div>
                    </td>

                    {/* Email & Google status */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {c.authProvider === "google" ? (
                        <div>
                          <p className="text-xs font-medium text-text-primary">{c.email || "—"}</p>
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full mt-0.5">
                            ✓ Google Verified
                          </span>
                        </div>
                      ) : (
                        <div>
                          <p className="text-xs text-text-secondary">{c.email || "No email"}</p>
                          <span className="inline-flex items-center text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full mt-0.5">
                            Guest User
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Phone */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-xs text-text-primary">
                      {c.phone ? (
                        <span className="font-mono">{c.phone}</span>
                      ) : (
                        <span className="text-text-tertiary italic">Not provided</span>
                      )}
                    </td>

                    {/* Zone / Ward */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-xs">
                      {c.wardZone ? (
                        <span className="px-2.5 py-1 bg-surface-2 rounded-lg text-text-primary font-medium text-[11px]">
                          {c.wardZone}
                        </span>
                      ) : (
                        <span className="text-text-tertiary italic text-xs">Unassigned</span>
                      )}
                    </td>

                    {/* Reports Filed */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-full bg-accent/10 text-accent font-bold text-xs">
                          {c.totalReports}
                        </span>
                        {c.resolvedReports > 0 && (
                          <span className="text-[10px] text-success font-medium">
                            ({c.resolvedReports} resolved)
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Joined Date */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-xs text-text-tertiary">
                      {new Date(c.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-right">
                      <button
                        onClick={() => setSelectedCitizen(c)}
                        className="px-3 py-1 rounded-lg bg-surface-2 hover:bg-accent hover:text-white text-text-secondary text-xs font-semibold transition-all cursor-pointer"
                      >
                        View Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Citizen Details Modal */}
      {selectedCitizen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-0 border border-border rounded-3xl p-6 max-w-lg w-full shadow-2xl animate-scaleUp">
            <div className="flex items-start justify-between border-b border-border pb-4 mb-4">
              <div className="flex items-center gap-3">
                {selectedCitizen.avatarUrl ? (
                  <img
                    src={selectedCitizen.avatarUrl}
                    alt={selectedCitizen.name}
                    className="w-12 h-12 rounded-full object-cover border border-border"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-accent text-white text-lg font-bold flex items-center justify-center">
                    {selectedCitizen.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                    {selectedCitizen.name}
                    {selectedCitizen.authProvider === "google" && (
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full font-bold">
                        Google
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-text-secondary">{selectedCitizen.email || "No email"}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedCitizen(null)}
                className="w-8 h-8 rounded-full hover:bg-surface-2 flex items-center justify-center text-text-tertiary cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-1 p-3.5 rounded-2xl">
                <div>
                  <span className="text-text-tertiary block mb-0.5">Phone Number:</span>
                  <span className="font-semibold text-text-primary">{selectedCitizen.phone || "Not provided"}</span>
                </div>
                <div>
                  <span className="text-text-tertiary block mb-0.5">Nagpur Ward / Zone:</span>
                  <span className="font-semibold text-text-primary">{selectedCitizen.wardZone || "Not selected"}</span>
                </div>
              </div>

              <div>
                <span className="text-text-tertiary block mb-0.5">Home Address:</span>
                <p className="text-text-primary bg-surface-1 p-3 rounded-xl">
                  {selectedCitizen.address || "No address on file."}
                </p>
              </div>

              <div>
                <span className="text-text-tertiary block mb-0.5">Emergency Contact:</span>
                <p className="text-text-primary bg-surface-1 p-3 rounded-xl">
                  {selectedCitizen.emergencyContact || "No emergency contact specified."}
                </p>
              </div>

              {selectedCitizen.bio && (
                <div>
                  <span className="text-text-tertiary block mb-0.5">Citizen Notes / Bio:</span>
                  <p className="text-text-primary bg-surface-1 p-3 rounded-xl">{selectedCitizen.bio}</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-between pt-4 border-t border-border">
              <Link
                href={`/admin/incidents`}
                className="px-4 py-2 bg-accent text-white rounded-full text-xs font-bold hover:bg-accent-hover transition-colors inline-flex items-center gap-1.5"
              >
                <FileTextIcon size={14} />
                View All Incidents
              </Link>
              <button
                onClick={() => setSelectedCitizen(null)}
                className="px-4 py-2 rounded-full border border-border text-xs font-bold text-text-secondary hover:bg-surface-1 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
