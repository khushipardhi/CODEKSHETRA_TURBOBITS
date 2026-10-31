/* ════════════════════════════════════════════════════════
   Track Report Page — look up by reference ID
   ════════════════════════════════════════════════════════ */

"use client";

import { useState } from "react";
import { Navbar, Footer } from "@/components/layout/navbar";
import { Button, Card, Input, EmptyState, Badge } from "@/components/ui";
import {
  SearchIcon,
  FileTextIcon,
  ClockIcon,
  CheckCircleIcon,
  BuildingIcon,
} from "@/components/ui/icons";

/* Demo tracking data — in production this comes from authenticated API */
const demoData: Record<
  string,
  {
    reference: string;
    title: string;
    status: string;
    statusLabel: string;
    createdAt: string;
    departments: string[];
    timeline: { label: string; time: string; done: boolean }[];
  }
> = {
  "NC-2026-000001": {
    reference: "NC-2026-000001",
    title: "Large pothole on Wardha Road near Manish Nagar",
    status: "IN_PROGRESS",
    statusLabel: "In Progress",
    createdAt: "2026-08-14",
    departments: ["Roads & Public Works"],
    timeline: [
      { label: "Submitted", time: "Aug 14, 10:30 AM", done: true },
      { label: "Received by department", time: "Aug 14, 10:45 AM", done: true },
      { label: "Worker assigned", time: "Aug 14, 11:00 AM", done: true },
      { label: "Work in progress", time: "Aug 14, 2:00 PM", done: true },
      { label: "Resolved", time: "", done: false },
    ],
  },
};

export default function TrackPage() {
  const [refId, setRefId] = useState("");
  const [result, setResult] = useState<(typeof demoData)[string] | null>(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = () => {
    setLoading(true);
    setSearched(true);
    // Simulate API delay
    setTimeout(() => {
      setResult(demoData[refId.toUpperCase().trim()] || null);
      setLoading(false);
    }, 800);
  };

  const statusVariant = (status: string) => {
    switch (status) {
      case "RESOLVED":
        return "success" as const;
      case "IN_PROGRESS":
        return "accent" as const;
      case "ROUTED":
        return "medium" as const;
      default:
        return "default" as const;
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-10 fade-in">
            <h1 className="text-3xl font-bold mb-3 tracking-tight">
              Track Your Report
            </h1>
            <p className="text-text-tertiary max-w-md mx-auto">
              Enter your report reference ID to see its current status and progress.
            </p>
          </div>

          {/* Search Box */}
          <div className="flex gap-3 mb-10 fade-in" style={{ animationDelay: "0.1s" }}>
            <Input
              placeholder="e.g. NC-2026-000001"
              value={refId}
              onChange={(e) => setRefId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              icon={<SearchIcon size={16} />}
              className="flex-1"
            />
            <Button
              onClick={handleSearch}
              loading={loading}
              disabled={!refId.trim()}
            >
              Track
            </Button>
          </div>

          {/* Result */}
          {loading && (
            <Card className="fade-in">
              <div className="space-y-3">
                <div className="skeleton h-5 w-1/3" />
                <div className="skeleton h-4 w-2/3" />
                <div className="skeleton h-4 w-1/2" />
              </div>
            </Card>
          )}

          {!loading && searched && !result && (
            <EmptyState
              icon={<FileTextIcon size={28} />}
              title="Report Not Found"
              description="We couldn't find a report with that reference ID. Please check the ID and try again."
            />
          )}

          {!loading && result && (
            <Card className="fade-in" padding="lg">
              {/* Header */}
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <p className="text-xs text-text-tertiary font-mono mb-1">
                    {result.reference}
                  </p>
                  <h2 className="text-lg font-semibold">{result.title}</h2>
                </div>
                <Badge variant={statusVariant(result.status)}>
                  {result.statusLabel}
                </Badge>
              </div>

              {/* Departments */}
              <div className="flex items-center gap-2 mb-6 text-sm text-text-secondary">
                <BuildingIcon size={16} className="text-text-tertiary" />
                {result.departments.join(", ")}
              </div>

              {/* Timeline */}
              <div className="border-t border-divider pt-6">
                <h3 className="text-sm font-semibold text-text-secondary mb-4">
                  Progress Timeline
                </h3>
                <div className="space-y-0">
                  {result.timeline.map((step, i) => (
                    <div key={i} className="flex items-start gap-3 pb-4 last:pb-0">
                      {/* Dot and line */}
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-3 h-3 rounded-full flex-shrink-0 ${
                            step.done
                              ? "bg-accent"
                              : "bg-surface-3 border border-border"
                          }`}
                        />
                        {i < result.timeline.length - 1 && (
                          <div
                            className={`w-px h-8 ${
                              step.done ? "bg-accent/30" : "bg-border"
                            }`}
                          />
                        )}
                      </div>
                      {/* Content */}
                      <div className="-mt-0.5">
                        <p
                          className={`text-sm font-medium ${
                            step.done ? "text-text-primary" : "text-text-tertiary"
                          }`}
                        >
                          {step.label}
                        </p>
                        {step.time && (
                          <p className="text-xs text-text-tertiary mt-0.5">
                            {step.time}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Demo hint */}
          <p className="text-center text-xs text-text-tertiary mt-8 fade-in" style={{ animationDelay: "0.3s" }}>
            Demo: Try &ldquo;NC-2026-000001&rdquo; to see a sample tracking result
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
