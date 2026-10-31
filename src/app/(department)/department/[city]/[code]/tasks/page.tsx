/* ════════════════════════════════════════════════════════
   Department Tasks & Dispatch — /department/[code]/tasks
   Operational Kanban pipeline from TiDB with multi-department coordination,
   explainable routing context, blocked dependency management, and SLA tracking.
   ════════════════════════════════════════════════════════ */

"use client";

import { useState, useEffect, useCallback, use } from "react";
import { Badge } from "@/components/ui";
import { DepartmentHeader } from "@/components/department/DepartmentHeader";
import { DepartmentSubNav } from "@/components/department/DepartmentSubNav";
import { DEPARTMENT_REGISTRY } from "@/lib/department-registry";
import { useCityContext } from "@/components/providers/city-provider";

interface TaskItem {
  id: string;
  trackingId: string;
  title: string;
  status: string;
  role?: string;
  dependsOnDepartment?: string | null;
  isBlocked?: boolean;
  blockedReason?: string | null;
  routingReason?: string | null;
  decisionExplanation?: string | null;
  matchedRuleId?: string | null;
  assignedWorkerId?: string | null;
  assignedWorkerName?: string | null;
  actionNotes?: string | null;
  priority: number;
  location: string;
  createdAt: string;
  severity: string;
  operationalPriority?: string;
  sla?: {
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

interface WorkerOption {
  id: string;
  name: string;
  role: string;
  zone: string;
  status: string;
}

const COLUMNS = [
  { key: "ROUTED", label: "📥 Incoming / Routed", color: "border-blue-400", bg: "bg-blue-50" },
  { key: "ASSIGNED", label: "👷 Assigned / Accepted", color: "border-amber-400", bg: "bg-amber-50" },
  { key: "IN_PROGRESS", label: "⚡ In Progress", color: "border-violet-400", bg: "bg-violet-50" },
  { key: "RESOLVED", label: "✅ Resolved", color: "border-emerald-400", bg: "bg-emerald-50" },
];

function timeAgo(dateStr: string): string {
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function TasksPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const { city, cityConfig } = useCityContext();
  const dept = DEPARTMENT_REGISTRY[code] || { name: code, icon: "📋" };

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [criticalCount, setCriticalCount] = useState(0);

  // Assignment Modal
  const [assigningTask, setAssigningTask] = useState<TaskItem | null>(null);
  const [workers, setWorkers] = useState<WorkerOption[]>([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState("");
  const [assignNotes, setAssignNotes] = useState("");
  const [dispatching, setDispatching] = useState(false);

  // Block Modal
  const [blockingTask, setBlockingTask] = useState<TaskItem | null>(null);
  const [blockReason, setBlockReason] = useState("");
  const [dependsOnDept, setDependsOnDept] = useState("");

  // Resolve Modal
  const [resolvingTask, setResolvingTask] = useState<TaskItem | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [resolutionUrl, setResolutionUrl] = useState("");

  // Inspect Reasoning Modal
  const [inspectingTask, setInspectingTask] = useState<TaskItem | null>(null);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/department/${code}/tasks?city=${city}`);
      if (res.ok) {
        const d = await res.json();
        if (d.success) {
          setTasks(d.tasks || []);
        }
      }

      const statsRes = await fetch(`/api/department/${code}/stats?city=${city}`);
      if (statsRes.ok) {
        const s = await statsRes.json();
        if (s.success) setCriticalCount(s.kpi.critical || 0);
      }
    } catch (err) {
      console.error("[Tasks] Load error:", err);
    } finally {
      setLoading(false);
    }
  }, [code, city]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Fetch department workers when opening assignment modal
  const openAssignModal = async (task: TaskItem) => {
    setAssigningTask(task);
    setAssignNotes("");
    try {
      const res = await fetch(`/api/department/${code}/workers/manage?city=${city}`);
      if (res.ok) {
        const d = await res.json();
        const list: WorkerOption[] = d.workers || [];
        setWorkers(list);
        if (list.length > 0) {
          setSelectedWorkerId(list[0].id);
        }
      }
    } catch (err) {
      console.error("[Tasks] Failed to load workers:", err);
    }
  };

  const handleDispatchWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningTask || !selectedWorkerId) return;

    setDispatching(true);
    try {
      const worker = workers.find((w) => w.id === selectedWorkerId);
      const res = await fetch(`/api/department/${code}/tasks`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          incidentId: assigningTask.id,
          action: "ASSIGN",
          workerId: selectedWorkerId,
          workerName: worker ? worker.name : selectedWorkerId,
          notes: assignNotes || `Assigned to field worker ${worker?.name || selectedWorkerId}`,
        }),
      });

      if (res.ok) {
        setAssigningTask(null);
        await loadTasks();
      }
    } catch (err) {
      console.error("[Tasks] Dispatch error:", err);
    } finally {
      setDispatching(false);
    }
  };

  const handleTaskAction = async (
    taskId: string,
    action: "ACKNOWLEDGE" | "ACCEPT" | "ASSIGN" | "BLOCK" | "UNBLOCK" | "RESOLVE" | "REJECT",
    payload?: Record<string, unknown>
  ) => {
    try {
      const res = await fetch(`/api/department/${code}/tasks`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          incidentId: taskId,
          action,
          ...payload,
        }),
      });
      if (res.ok) {
        await loadTasks();
      }
    } catch (err) {
      console.error("[Tasks] Action error:", err);
    }
  };

  const handleSubmitBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockingTask || !blockReason) return;
    await handleTaskAction(blockingTask.id, "BLOCK", {
      blockedReason: blockReason,
      dependsOnDept: dependsOnDept || undefined,
    });
    setBlockingTask(null);
    setBlockReason("");
    setDependsOnDept("");
  };

  const handleSubmitResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingTask) return;
    await handleTaskAction(resolvingTask.id, "RESOLVE", {
      notes: resolutionNotes || "Task work completed successfully.",
      resolutionEvidenceUrl: resolutionUrl || undefined,
    });
    setResolvingTask(null);
    setResolutionNotes("");
    setResolutionUrl("");
  };

  const grouped = COLUMNS.map((col) => ({
    ...col,
    items: tasks.filter((t) => t.status === col.key),
  }));

  return (
    <div className="space-y-6 fade-in">
      <DepartmentHeader
        departmentName={`${dept.name} (${cityConfig.name})`}
        departmentIcon={dept.icon}
        criticalCount={criticalCount}
      />

      <DepartmentSubNav departmentCode={code} city={city} />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-black text-slate-900 tracking-tight">
            Tasks & Dispatch Operations Pipeline
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {tasks.length} total operational tasks · Multi-department coordination with SLA escalation tracking
          </p>
        </div>
      </div>

      {loading && (
        <div className="text-center py-16 text-slate-400">
          <div className="animate-spin inline-block w-8 h-8 border-2 border-accent border-t-transparent rounded-full mb-3" />
          <p className="text-sm font-medium">Loading task pipeline...</p>
        </div>
      )}

      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {grouped.map((col) => (
            <div key={col.key} className="flex flex-col">
              <div
                className={`flex items-center justify-between px-4 py-2.5 rounded-t-xl border-t-[3px] ${col.color} bg-white border border-slate-200`}
              >
                <span className="text-xs font-bold text-slate-700">{col.label}</span>
                <Badge variant="default" className="text-[10px] font-bold">
                  {col.items.length}
                </Badge>
              </div>

              <div className="flex-1 space-y-2 p-2 bg-slate-50/50 border border-t-0 border-slate-200 rounded-b-xl min-h-[200px]">
                {col.items.length === 0 && (
                  <div className="text-center py-8 text-xs text-slate-400">No tasks in this stage</div>
                )}
                {col.items.map((task) => (
                  <div
                    key={task.id}
                    className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-sm transition-shadow space-y-2.5"
                  >
                    {/* Header: Tracking Ref, Role, and Priority */}
                    <div className="flex items-center justify-between gap-1.5 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          {task.trackingId}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                            task.role === "PRIMARY"
                              ? "bg-blue-100 text-blue-800 border border-blue-200"
                              : "bg-purple-100 text-purple-800 border border-purple-200"
                          }`}
                        >
                          {task.role || "PRIMARY"}
                        </span>
                      </div>

                      {task.severity === "CRITICAL" && (
                        <span className="text-[9px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                          CRITICAL
                        </span>
                      )}
                    </div>

                    {/* Blocked Warning Banner */}
                    {task.isBlocked && (
                      <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[10px] space-y-1">
                        <div className="font-bold flex items-center justify-between">
                          <span>🔒 BLOCKED TASK</span>
                          <button
                            onClick={() => handleTaskAction(task.id, "UNBLOCK")}
                            className="text-[9px] underline font-bold text-amber-900 hover:text-amber-700 cursor-pointer"
                          >
                            Unblock Prerequisite ✓
                          </button>
                        </div>
                        <p className="line-clamp-2 leading-tight">
                          {task.blockedReason || "Awaiting supporting agency action."}
                        </p>
                      </div>
                    )}

                    {/* SLA Status Indicator */}
                    {task.sla && (
                      <div className="flex items-center justify-between text-[10px] px-2 py-1 rounded bg-slate-50 border border-slate-100">
                        <span className="text-slate-500 font-medium">SLA Deadline:</span>
                        {task.sla.isResolutionOverdue ? (
                          <span className="font-bold text-rose-600">
                            ⚠️ OVERDUE by {Math.abs(task.sla.resolutionTimeRemainingMinutes)}m
                          </span>
                        ) : task.sla.warningIndicator ? (
                          <span className="font-bold text-amber-600">
                            ⏳ {task.sla.resolutionTimeRemainingMinutes}m left (&gt;75% elapsed)
                          </span>
                        ) : (
                          <span className="font-medium text-emerald-600">
                            ✓ {task.sla.resolutionTimeRemainingMinutes}m left
                          </span>
                        )}
                      </div>
                    )}

                    <h4 className="text-xs font-bold text-slate-900 line-clamp-2">{task.title}</h4>

                    {task.assignedWorkerName && (
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-50 border border-amber-200/60 text-[10px] text-amber-900 font-semibold">
                        <span>👷</span>
                        <span className="truncate">Assigned: {task.assignedWorkerName}</span>
                      </div>
                    )}

                    {task.location && (
                      <p className="text-[11px] text-slate-500 truncate">📍 {task.location}</p>
                    )}

                    {/* Reasoning Snippet Trigger */}
                    {task.decisionExplanation && (
                      <button
                        onClick={() => setInspectingTask(task)}
                        className="text-[10px] text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 underline text-left"
                      >
                        <span>⚖️ Why was this routed here?</span>
                      </button>
                    )}

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                      <span className="text-[10px] text-slate-400 font-medium">{timeAgo(task.createdAt)}</span>
                      <span
                        className={`text-[10px] font-bold ${
                          task.priority >= 80
                            ? "text-rose-600"
                            : task.priority >= 50
                            ? "text-amber-600"
                            : "text-slate-500"
                        }`}
                      >
                        P{task.priority}
                      </span>
                    </div>

                    {/* Operational Action Buttons */}
                    <div className="pt-2 space-y-1.5 border-t border-slate-100">
                      {task.status === "ROUTED" && (
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            onClick={() => handleTaskAction(task.id, "ACKNOWLEDGE")}
                            className="py-1.5 px-2 text-[10px] font-bold rounded-lg border border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer text-center"
                          >
                            Acknowledge
                          </button>
                          <button
                            onClick={() => handleTaskAction(task.id, "ACCEPT")}
                            className="py-1.5 px-2 text-[10px] font-bold rounded-lg bg-accent text-white hover:bg-accent-hover transition-colors cursor-pointer shadow-xs text-center"
                          >
                            Accept Task →
                          </button>
                        </div>
                      )}

                      {(task.status === "ROUTED" || task.status === "ASSIGNED") && (
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            onClick={() => openAssignModal(task)}
                            className="py-1.5 px-2 text-[10px] font-bold rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1"
                          >
                            <span>👷</span> Dispatch →
                          </button>
                          <button
                            onClick={() => {
                              setBlockingTask(task);
                              setBlockReason("");
                              setDependsOnDept("");
                            }}
                            className="py-1.5 px-2 text-[10px] font-bold rounded-lg border border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100 transition-colors cursor-pointer"
                          >
                            Mark Blocked 🔒
                          </button>
                        </div>
                      )}

                      {task.status === "IN_PROGRESS" && (
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            onClick={() => {
                              setResolvingTask(task);
                              setResolutionNotes("");
                              setResolutionUrl("");
                            }}
                            className="py-1.5 px-2 text-[10px] font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors cursor-pointer shadow-xs text-center"
                          >
                            Resolve ✓
                          </button>
                          <button
                            onClick={() => {
                              setBlockingTask(task);
                              setBlockReason("");
                              setDependsOnDept("");
                            }}
                            className="py-1.5 px-2 text-[10px] font-bold rounded-lg border border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100 transition-colors cursor-pointer text-center"
                          >
                            Block Task 🔒
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL 1: ASSIGN WORKER */}
      {assigningTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="font-display font-black text-slate-900 text-sm">Dispatch Field Worker</h3>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">{assigningTask.trackingId}</p>
              </div>
              <button
                onClick={() => setAssigningTask(null)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDispatchWorker} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Registered Worker</label>
                {workers.length === 0 ? (
                  <p className="text-xs text-slate-500">No field workers registered for this department.</p>
                ) : (
                  <select
                    value={selectedWorkerId}
                    onChange={(e) => setSelectedWorkerId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent font-medium bg-white"
                  >
                    {workers.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.role}) · Zone: {w.zone}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Dispatch Instructions</label>
                <textarea
                  rows={2}
                  value={assignNotes}
                  onChange={(e) => setAssignNotes(e.target.value)}
                  placeholder="e.g. Inspect culvert gate, clear debris, photograph before and after..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAssigningTask(null)}
                  className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={dispatching || !selectedWorkerId}
                  className="px-4 py-1.5 text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 rounded-lg disabled:opacity-50"
                >
                  {dispatching ? "Dispatching..." : "Confirm Dispatch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: MARK BLOCKED TASK */}
      {blockingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-amber-50/50">
              <div>
                <h3 className="font-display font-black text-amber-900 text-sm">Report Task Blocked</h3>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">{blockingTask.trackingId}</p>
              </div>
              <button
                onClick={() => setBlockingTask(null)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitBlock} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reason for Blockage <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="e.g. Awaiting fallen tree clearing by Garden Department before road repairs can commence..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Prerequisite Supporting Department (Optional)
                </label>
                <select
                  value={dependsOnDept}
                  onChange={(e) => setDependsOnDept(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                >
                  <option value="">None / External</option>
                  {Object.values(DEPARTMENT_REGISTRY).map((d) => (
                    <option key={d.code} value={d.code}>
                      {d.icon} {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setBlockingTask(null)}
                  className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!blockReason}
                  className="px-4 py-1.5 text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 rounded-lg disabled:opacity-50"
                >
                  Flag as Blocked
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: RESOLVE TASK WITH EVIDENCE */}
      {resolvingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-emerald-50/50">
              <div>
                <h3 className="font-display font-black text-emerald-900 text-sm">Complete Task & Submit Evidence</h3>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">{resolvingTask.trackingId}</p>
              </div>
              <button
                onClick={() => setResolvingTask(null)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitResolve} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Resolution Notes <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Detail work performed: e.g. Culvert unclogged, 2.5 tons silt removed, road drain flowing normally..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Proof of Work Image URL / Attachment (Optional)
                </label>
                <input
                  type="text"
                  value={resolutionUrl}
                  onChange={(e) => setResolutionUrl(e.target.value)}
                  placeholder="https://storage.urbanlink.gov/evidence/..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setResolvingTask(null)}
                  className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!resolutionNotes}
                  className="px-4 py-1.5 text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg disabled:opacity-50"
                >
                  Submit Resolution ✓
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: INSPECT REASONING */}
      {inspectingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-indigo-50/50">
              <div>
                <h3 className="font-display font-black text-indigo-900 text-sm">Explainable Routing Decision</h3>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">{inspectingTask.trackingId}</p>
              </div>
              <button
                onClick={() => setInspectingTask(null)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <div>
                <span className="font-semibold text-slate-500">Matched Rule ID:</span>
                <p className="font-mono text-indigo-600 font-bold text-xs mt-0.5">
                  {inspectingTask.matchedRuleId || "RULE-MUNICIPAL-DEFAULT"}
                </p>
              </div>

              <div>
                <span className="font-semibold text-slate-500">Authoritative Explanation:</span>
                <p className="text-slate-800 leading-relaxed mt-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {inspectingTask.decisionExplanation || inspectingTask.routingReason}
                </p>
              </div>

              <div>
                <span className="font-semibold text-slate-500">Department Role:</span>
                <span className="ml-2 font-bold uppercase text-slate-900">{inspectingTask.role || "PRIMARY"}</span>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setInspectingTask(null)}
                  className="px-3 py-1.5 text-xs font-bold bg-slate-800 text-white rounded-lg hover:bg-slate-900"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
