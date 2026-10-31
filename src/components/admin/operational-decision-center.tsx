/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Admin Operational Decision Center
   Full administrative review interface for explainable routing,
   department assignments, SLA monitoring, and dependency management.
   ════════════════════════════════════════════════════════ */

"use client";

import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui";
import { useCityContext } from "@/components/providers/city-provider";
import { DEPARTMENT_REGISTRY } from "@/lib/department-registry";

interface RoutingReviewItem {
  id: string;
  incidentId: string;
  publicReference?: string;
  title?: string;
  severity?: string;
  city: string;
  category: string;
  subcategory?: string | null;
  matchedRuleId: string;
  primaryDepartment: string;
  supportingDepartments: Array<{ code: string; name: string }>;
  decisionExplanation: string;
  confidenceStatus: "HIGH" | "MEDIUM" | "REQUIRES_REVIEW" | "FALLBACK";
  assignmentMode: "AUTOMATIC" | "RECOMMENDED" | "AWAITING_APPROVAL";
  isOverridden: boolean;
  createdAt: string;
}

interface OverdueTaskItem {
  id: string;
  incidentId: string;
  publicReference: string;
  city: string;
  title: string;
  departmentCode: string;
  departmentName: string;
  role: string;
  operationalPriority: string;
  status: string;
  sla: {
    ackTargetMinutes: number;
    resolutionTargetHours: number;
    isAckOverdue: boolean;
    isResolutionOverdue: boolean;
    ackTimeRemainingMinutes: number;
    resolutionTimeRemainingMinutes: number;
    warningIndicator: boolean;
    escalationRequired: boolean;
    escalationRecipient: string;
  };
}

interface BlockedTaskItem {
  id: string;
  incidentId: string;
  publicReference: string;
  city: string;
  title: string;
  departmentCode: string;
  departmentName: string;
  role: string;
  dependsOnDepartment: string | null;
  blockedReason: string | null;
  status: string;
}

interface ConfigurationGapItem {
  id: string;
  city: string;
  category: string;
  subcategory?: string | null;
  primaryDepartment: string;
  explanation: string;
  missingFacts: string[];
  createdAt: string;
}

interface DecisionCenterData {
  kpis: {
    totalRoutingDecisions: number;
    pendingReviewsCount: number;
    activeTasksCount: number;
    overdueTasksCount: number;
    blockedTasksCount: number;
    configurationGapsCount: number;
    overridesCount: number;
  };
  pendingReviews: RoutingReviewItem[];
  overdueTasks: OverdueTaskItem[];
  blockedTasks: BlockedTaskItem[];
  configurationGaps: ConfigurationGapItem[];
}

export function OperationalDecisionCenter() {
  const { city, cityConfig } = useCityContext();
  const [data, setData] = useState<DecisionCenterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"reviews" | "overdue" | "blocked" | "gaps">("reviews");

  // Override Modal state
  const [reviewingItem, setReviewingItem] = useState<RoutingReviewItem | null>(null);
  const [selectedDept, setSelectedDept] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/routing/decisions?city=${city}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setData(json);
        }
      }
    } catch (err) {
      console.error("[DecisionCenter] Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [city]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenOverride = (item: RoutingReviewItem) => {
    setReviewingItem(item);
    setSelectedDept(item.primaryDepartment);
    setOverrideReason("");
    setActionSuccess(null);
  };

  const handleConfirmOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingItem || !selectedDept || !overrideReason) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/routing/override", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          incidentId: reviewingItem.incidentId,
          overrideDepartment: selectedDept,
          actorId: "admin_ops",
          actorName: "City Command Supervisor",
          reason: overrideReason,
          city,
        }),
      });

      if (res.ok) {
        setActionSuccess(`Routing updated to ${selectedDept}. Audit record created.`);
        setTimeout(() => {
          setReviewingItem(null);
          loadData();
        }, 1200);
      }
    } catch (err) {
      console.error("[DecisionCenter] Override error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-surface-0 border border-border rounded-2xl p-5 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500 text-lg">⚡</span>
            <h3 className="text-base font-bold text-text-primary tracking-tight">
              Operational Decision & Incident Routing Center
            </h3>
            <Badge variant="default" className="text-[10px] font-mono uppercase">
              {cityConfig?.name || city} Jurisdiction
            </Badge>
          </div>
          <p className="text-xs text-text-tertiary mt-1">
            Deterministic rule engine with multi-department coordination, task dependencies, and SLA escalation tracking.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-border hover:bg-surface-1 text-text-secondary transition-colors"
        >
          {loading ? "Refreshing..." : "↻ Refresh Queue"}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          onClick={() => setActiveTab("reviews")}
          className={`p-3 rounded-xl border text-left transition-all ${
            activeTab === "reviews"
              ? "bg-amber-500/10 border-amber-500/40"
              : "bg-surface-1 border-border hover:border-text-tertiary"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-text-tertiary">Pending Reviews</span>
            <span className="text-xs">⚖️</span>
          </div>
          <div className="text-xl font-bold text-text-primary mt-1">
            {data?.kpis.pendingReviewsCount ?? 0}
          </div>
          <div className="text-[10px] text-amber-600 font-medium mt-0.5">
            Requires Admin Confirmation
          </div>
        </button>

        <button
          onClick={() => setActiveTab("overdue")}
          className={`p-3 rounded-xl border text-left transition-all ${
            activeTab === "overdue"
              ? "bg-rose-500/10 border-rose-500/40"
              : "bg-surface-1 border-border hover:border-text-tertiary"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-text-tertiary">Overdue Tasks</span>
            <span className="text-xs">⏰</span>
          </div>
          <div className="text-xl font-bold text-text-primary mt-1">
            {data?.kpis.overdueTasksCount ?? 0}
          </div>
          <div className="text-[10px] text-rose-600 font-medium mt-0.5">
            SLA Breach Escalations
          </div>
        </button>

        <button
          onClick={() => setActiveTab("blocked")}
          className={`p-3 rounded-xl border text-left transition-all ${
            activeTab === "blocked"
              ? "bg-violet-500/10 border-violet-500/40"
              : "bg-surface-1 border-border hover:border-text-tertiary"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-text-tertiary">Blocked Tasks</span>
            <span className="text-xs">🔒</span>
          </div>
          <div className="text-xl font-bold text-text-primary mt-1">
            {data?.kpis.blockedTasksCount ?? 0}
          </div>
          <div className="text-[10px] text-violet-600 font-medium mt-0.5">
            Cross-Agency Dependencies
          </div>
        </button>

        <button
          onClick={() => setActiveTab("gaps")}
          className={`p-3 rounded-xl border text-left transition-all ${
            activeTab === "gaps"
              ? "bg-blue-500/10 border-blue-500/40"
              : "bg-surface-1 border-border hover:border-text-tertiary"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-text-tertiary">Config Gaps</span>
            <span className="text-xs">🔍</span>
          </div>
          <div className="text-xl font-bold text-text-primary mt-1">
            {data?.kpis.configurationGapsCount ?? 0}
          </div>
          <div className="text-[10px] text-blue-600 font-medium mt-0.5">
            Unmapped Jurisdictions
          </div>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="space-y-3">
        {/* TAB 1: PENDING REVIEWS */}
        {activeTab === "reviews" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-text-secondary">
                Routing Decisions Awaiting Administrative Review ({data?.pendingReviews.length || 0})
              </span>
            </div>

            {data?.pendingReviews.length === 0 ? (
              <div className="text-center py-10 bg-surface-1 rounded-xl border border-dashed border-border text-xs text-text-tertiary">
                ✓ All incident routing decisions have been verified and confirmed.
              </div>
            ) : (
              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {data?.pendingReviews.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 bg-surface-1 rounded-xl border border-border hover:border-indigo-500/30 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-surface-2 border border-border text-text-primary">
                          {item.publicReference || "INCIDENT"}
                        </span>
                        <Badge
                          variant={item.confidenceStatus === "REQUIRES_REVIEW" ? "warning" : "default"}
                          className="text-[9px] font-bold uppercase"
                        >
                          {item.confidenceStatus}
                        </Badge>
                        <span className="text-[10px] font-semibold text-text-tertiary">
                          Matched: <code className="text-indigo-500">{item.matchedRuleId}</code>
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-text-primary truncate">
                        {item.title || `${item.category} / ${item.subcategory || "General"}`}
                      </h4>

                      <p className="text-[11px] text-text-secondary leading-relaxed line-clamp-2">
                        {item.decisionExplanation}
                      </p>

                      <div className="flex items-center gap-2 text-[10px] text-text-tertiary">
                        <span>Proposed: <strong className="text-text-primary uppercase">{item.primaryDepartment}</strong></span>
                        {item.supportingDepartments?.length > 0 && (
                          <span>· Supporting: {item.supportingDepartments.map(s => s.name).join(", ")}</span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenOverride(item)}
                      className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
                    >
                      Inspect & Override ↗
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: OVERDUE SLA TASKS */}
        {activeTab === "overdue" && (
          <div className="space-y-2">
            <span className="text-xs font-bold text-text-secondary">
              Overdue Tasks & Escalation Breaches ({data?.overdueTasks.length || 0})
            </span>

            {data?.overdueTasks.length === 0 ? (
              <div className="text-center py-10 bg-surface-1 rounded-xl border border-dashed border-border text-xs text-text-tertiary">
                ✓ Zero overdue tasks. All municipal SLA deadlines are being met within targets.
              </div>
            ) : (
              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {data?.overdueTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-3.5 bg-rose-500/5 rounded-xl border border-rose-500/30 flex flex-col md:flex-row md:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-700">
                          {task.publicReference}
                        </span>
                        <span className="text-xs font-bold text-text-primary">{task.title}</span>
                        <Badge variant="critical" className="text-[9px]">
                          {task.operationalPriority}
                        </Badge>
                      </div>

                      <p className="text-[11px] text-text-secondary">
                        Department: <strong>{task.departmentName}</strong> ({task.role}) · Status: {task.status}
                      </p>

                      <div className="flex items-center gap-3 text-[10px] text-rose-600 font-semibold">
                        {task.sla.isAckOverdue && (
                          <span>⚠️ Acknowledgement Overdue ({Math.abs(task.sla.ackTimeRemainingMinutes)}m ago)</span>
                        )}
                        {task.sla.isResolutionOverdue && (
                          <span>🚨 Resolution Target Exceeded ({Math.abs(task.sla.resolutionTimeRemainingMinutes)}m)</span>
                        )}
                        <span>Escalation: {task.sla.escalationRecipient}</span>
                      </div>
                    </div>

                    <a
                      href={`/department/${city}/${task.departmentCode}/tasks`}
                      className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg border border-rose-500/40 text-rose-700 hover:bg-rose-500/10 transition-colors"
                    >
                      View in Desk →
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: BLOCKED TASKS */}
        {activeTab === "blocked" && (
          <div className="space-y-2">
            <span className="text-xs font-bold text-text-secondary">
              Cross-Agency Blocked Dependencies ({data?.blockedTasks.length || 0})
            </span>

            {data?.blockedTasks.length === 0 ? (
              <div className="text-center py-10 bg-surface-1 rounded-xl border border-dashed border-border text-xs text-text-tertiary">
                ✓ No tasks are currently blocked. All supporting agency dependencies are flowing freely.
              </div>
            ) : (
              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {data?.blockedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-3.5 bg-violet-500/5 rounded-xl border border-violet-500/30 flex flex-col md:flex-row md:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-700">
                          {task.publicReference}
                        </span>
                        <span className="text-xs font-bold text-text-primary">{task.title}</span>
                      </div>

                      <p className="text-[11px] text-text-secondary">
                        Blocked Department: <strong>{task.departmentName}</strong> ({task.role})
                      </p>

                      <div className="text-[11px] text-violet-700 font-medium">
                        🔒 Reason: {task.blockedReason || "Awaiting prerequisite agency action."}
                        {task.dependsOnDepartment && (
                          <span className="ml-1 font-bold">(Prerequisite Dept: {task.dependsOnDepartment})</span>
                        )}
                      </div>
                    </div>

                    <a
                      href={`/department/${city}/${task.departmentCode}/tasks`}
                      className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg border border-violet-500/40 text-violet-700 hover:bg-violet-500/10 transition-colors"
                    >
                      Manage Task →
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: CONFIGURATION GAPS */}
        {activeTab === "gaps" && (
          <div className="space-y-2">
            <span className="text-xs font-bold text-text-secondary">
              Municipal Configuration & Boundary Gaps ({data?.configurationGaps.length || 0})
            </span>

            {data?.configurationGaps.length === 0 ? (
              <div className="text-center py-10 bg-surface-1 rounded-xl border border-dashed border-border text-xs text-text-tertiary">
                ✓ Zero configuration gaps. All categories and coordinates map cleanly to registered municipal bodies.
              </div>
            ) : (
              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {data?.configurationGaps.map((gap) => (
                  <div
                    key={gap.id}
                    className="p-3.5 bg-blue-500/5 rounded-xl border border-blue-500/30 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-text-primary">
                        Category: {gap.category} {gap.subcategory ? `· Subcategory: ${gap.subcategory}` : ""}
                      </span>
                      <span className="text-[10px] text-text-tertiary">
                        {new Date(gap.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-[11px] text-text-secondary">
                      {gap.explanation}
                    </p>

                    <div className="text-[10px] text-blue-600 font-semibold">
                      Missing: {gap.missingFacts.join("; ")}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* OVERRIDE MODAL */}
      {reviewingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-surface-0 border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-text-primary">
                  Review & Override Department Routing
                </h3>
                <p className="text-[11px] text-text-tertiary mt-0.5">
                  Reference: {reviewingItem.publicReference || reviewingItem.incidentId}
                </p>
              </div>
              <button
                onClick={() => setReviewingItem(null)}
                className="text-text-tertiary hover:text-text-primary p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmOverride} className="p-5 space-y-4 overflow-y-auto flex-1">
              {actionSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-600 font-bold">
                  ✓ {actionSuccess}
                </div>
              )}

              <div className="p-3 rounded-xl bg-surface-1 border border-border space-y-1.5 text-xs">
                <div className="font-semibold text-text-primary">Rule Matched:</div>
                <div className="font-mono text-indigo-500 text-[11px]">{reviewingItem.matchedRuleId}</div>
                <div className="text-text-secondary leading-relaxed text-[11px]">
                  {reviewingItem.decisionExplanation}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-text-secondary">
                  Target Municipal Department
                </label>
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-1 border border-border text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {Object.values(DEPARTMENT_REGISTRY).map((d) => (
                    <option key={d.code} value={d.code}>
                      {d.icon} {d.name} ({d.shortName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-text-secondary">
                  Override Rationale / Justification <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Record authoritative operational rationale for reassigning department..."
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-1 border border-border text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setReviewingItem(null)}
                  className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-text-secondary hover:bg-surface-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !overrideReason}
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Confirm & Reassign"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
