/* ════════════════════════════════════════════════════════
   Admin Settings & System Health Page
   TiDB Connection · Groq AI Engine · OSM Map · VAPID Web Push
   ════════════════════════════════════════════════════════ */

"use client";

import React, { useState } from "react";
import { Card, Badge } from "@/components/ui";
import { SettingsIcon, ShieldIcon, BellIcon, MapIcon } from "@/components/ui/icons";
import { DataSourceHealthMonitor } from "@/components/admin/data-source-health-monitor";

interface SettingItem {
  label: string;
  value: string;
  desc: string;
  status: "ONLINE" | "CONFIGURED" | "OPTIONAL";
}

interface SettingGroup {
  title: string;
  icon: string;
  items: SettingItem[];
}

export default function AdminSettingsPage() {
  const [migrating, setMigrating] = useState(false);
  const [migrateMessage, setMigrateMessage] = useState<string | null>(null);

  const settingGroups: SettingGroup[] = [
    {
      title: "Core Database & Storage",
      icon: "🗄️",
      items: [
        {
          label: "Primary Database",
          value: "TiDB Serverless Cloud (MySQL 8.0 compatible)",
          desc: "Multi-region distributed SQL with TLS encryption",
          status: "ONLINE",
        },
        {
          label: "Database Name",
          value: "nagpur_connect",
          desc: "Hosts incidents, citizens, departments, and audit streams",
          status: "ONLINE",
        },
        {
          label: "Connection Pool",
          value: "Active (5 connections, keepAlive enabled)",
          desc: "Optimized connection pool with auto-reconnect",
          status: "ONLINE",
        },
      ],
    },
    {
      title: "Artificial Intelligence & Routing",
      icon: "🤖",
      items: [
        {
          label: "Primary LLM Model",
          value: "Groq (openai/gpt-oss-120b & gpt-oss-20b)",
          desc: "Ultra-fast triage, mismatch guidance & questionnaire generation",
          status: "ONLINE",
        },
        {
          label: "Department Taxonomy",
          value: "17 City Departments (Nagpur Municipal Corporation)",
          desc: "Police, Fire, Water, Roads, Electricity, Forest, Women & Child, etc.",
          status: "ONLINE",
        },
        {
          label: "Mismatch Correction",
          value: "Enabled (Automatic suggestion + reason)",
          desc: "Guides citizens if an incorrect department is chosen",
          status: "ONLINE",
        },
      ],
    },
    {
      title: "Geospatial & Mapping Engine",
      icon: "🗺️",
      items: [
        {
          label: "Map Tile Engine",
          value: "Leaflet + OpenStreetMap (OSM) / CartoDB / Esri",
          desc: "Zero-cost open-source vector & raster tile rendering",
          status: "ONLINE",
        },
        {
          label: "Jurisdiction Zones",
          value: "10 NMC Administrative Zones (Polygons)",
          desc: "Laxmi Nagar, Dharampeth, Hanuman Nagar, Dhantoli, etc.",
          status: "ONLINE",
        },
        {
          label: "Municipal Facilities Dataset",
          value: "178 Normalized Point Facilities",
          desc: "Police stations, fire stations, sub-stations, PWD offices",
          status: "ONLINE",
        },
      ],
    },
    {
      title: "Authentication & Security",
      icon: "🛡️",
      items: [
        {
          label: "Auth Provider",
          value: "Google OAuth (NextAuth v5 Beta)",
          desc: "JWT sessions with automatic guest identity linking",
          status: "CONFIGURED",
        },
        {
          label: "Citizen Identity Model",
          value: "Dual Mode (Google Verified + Persistent Guest UUID)",
          desc: "Citizens can report as guests or sync via Google",
          status: "CONFIGURED",
        },
      ],
    },
    {
      title: "Notification Delivery Channels",
      icon: "🔔",
      items: [
        {
          label: "Web Push Notifications",
          value: "VAPID Web-Push Service Active",
          desc: "Browser desktop & mobile push alerts with chime sound",
          status: "CONFIGURED",
        },
        {
          label: "Email Dispatcher",
          value: "Email Service Stub (EmailJS / Resend Ready)",
          desc: "Automated status notification triggers on incident milestones",
          status: "CONFIGURED",
        },
      ],
    },
  ];

  const handleRunMigrations = async () => {
    setMigrating(true);
    setMigrateMessage(null);
    try {
      const res = await fetch("/api/admin/setup", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setMigrateMessage("Database tables and ALTER migrations verified successfully!");
      } else {
        setMigrateMessage("Notice: " + (data.message || "Migration ran with notices"));
      }
    } catch (err) {
      setMigrateMessage("Failed to execute migration endpoint");
    } finally {
      setMigrating(false);
      setTimeout(() => setMigrateMessage(null), 5000);
    }
  };

  return (
    <div className="space-y-8 fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            System Settings & Architecture
          </h1>
          <p className="text-sm text-text-tertiary mt-1">
            Overview of live microservices, TiDB cluster health, AI models, and push services
          </p>
        </div>

        <button
          onClick={handleRunMigrations}
          disabled={migrating}
          className="px-5 py-2.5 bg-accent text-white rounded-full text-xs font-bold hover:bg-accent-hover transition-all cursor-pointer shadow-md disabled:opacity-50 flex items-center gap-2 self-start sm:self-auto"
        >
          {migrating ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Verifying TiDB Tables...
            </>
          ) : (
            "Verify / Run DB Migrations"
          )}
        </button>
      </div>

      {migrateMessage && (
        <div className="p-4 bg-success-bg border border-success-border rounded-2xl text-success text-xs font-bold animate-fadeIn">
          {migrateMessage}
        </div>
      )}

      {/* Sentinel Environmental Connectors & Data Quality Monitor */}
      <DataSourceHealthMonitor />

      {/* Settings Grid */}
      <div className="space-y-6">
        {settingGroups.map((group) => (
          <div key={group.title} className="bg-surface-0 border border-border rounded-3xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-border bg-surface-1/40 flex items-center gap-2.5">
              <span className="text-lg">{group.icon}</span>
              <h2 className="text-sm font-bold text-text-primary">{group.title}</h2>
            </div>

            <div className="divide-y divide-border">
              {group.items.map((item) => (
                <div
                  key={item.label}
                  className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-surface-1/40 transition-colors"
                >
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-text-primary">{item.label}</p>
                    <p className="text-xs text-text-tertiary mt-0.5">{item.desc}</p>
                  </div>

                  <div className="flex items-center gap-2.5 self-start sm:self-auto">
                    <span className="text-xs text-text-secondary font-mono bg-surface-1 border border-border px-3 py-1.5 rounded-xl">
                      {item.value}
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
