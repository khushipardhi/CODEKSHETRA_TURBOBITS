/* ════════════════════════════════════════════════════════
   Worker Dashboard — /worker
   Nagpur Municipal Corporation (NMC) Field Service Portal
   - TiDB Database connected worker task pipeline
   - Google Sign-In with Role-Based authentication
   - Self-onboarding request directly to TiDB workers table
   - 1-tap lifecycle progression & GPS navigation
   - Proof-of-Work photo capture & citizen notification
   ════════════════════════════════════════════════════════ */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { Badge } from "@/components/ui";
import { WORKER_ROSTER, type WorkerProfile } from "@/lib/worker-roster";
import { DEPARTMENT_REGISTRY } from "@/lib/department-registry";

type TaskStatus =
  | "ASSIGNED"
  | "ACCEPTED"
  | "EN_ROUTE"
  | "REACHED_SITE"
  | "WORK_STARTED"
  | "RESOLVED";

interface WorkerTask {
  id: string;
  incidentId: string;
  trackingId: string;
  title: string;
  description: string;
  location: string;
  latitude: number;
  longitude: number;
  departmentCode: string;
  departmentName: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  priorityScore: number;
  status: TaskStatus;
  assignedWorkerId: string;
  assignedWorkerName: string;
  safetyNotes: string;
  actionNotes?: string;
  assignedAt: string;
  citizenPhotos?: string[];
  workerProofPhotos?: string[];
  resolvedAt?: string;
}

interface KPIStats {
  total: number;
  urgent: number;
  inProgress: number;
  completed: number;
}

const NAGPUR_ZONES = [
  "Dharampeth Zone",
  "Laxmi Nagar Zone",
  "Hanuman Nagar Zone",
  "Dhantoli Zone",
  "Nehru Nagar Zone",
  "Gandhibagh Zone",
  "Satranjipura Zone",
  "Lakadganj Zone",
  "Ashi Nagar Zone",
  "Mangalwari Zone",
];

export default function WorkerDashboard() {
  const { data: session, status: authStatus } = useSession();

  // Worker session identity
  const [currentWorker, setCurrentWorker] = useState<WorkerProfile>(WORKER_ROSTER[0]);
  const [isDbWorker, setIsDbWorker] = useState<boolean>(false);
  const [isApproved, setIsApproved] = useState<boolean>(true);
  const [dbChecked, setDbChecked] = useState<boolean>(false);

  // Task state
  const [tasks, setTasks] = useState<WorkerTask[]>([]);
  const [kpis, setKpis] = useState<KPIStats>({ total: 0, urgent: 0, inProgress: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  // Onboarding modal for citizens/unregistered users
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [onboardForm, setOnboardForm] = useState({
    name: "",
    email: "",
    phone: "",
    departmentCode: "road_maintenance",
    zone: NAGPUR_ZONES[0],
    role: "Field Response Specialist",
    vehicle: "NMC Quick Response Van",
  });
  const [onboardSubmitting, setOnboardSubmitting] = useState(false);
  const [onboardError, setOnboardError] = useState("");

  // Resolution modal state
  const [completingTask, setCompletingTask] = useState<WorkerTask | null>(null);
  const [resolutionNote, setResolutionNote] = useState("");
  const [proofPhotoPreview, setProofPhotoPreview] = useState<string | null>(null);
  const [submittingProof, setSubmittingProof] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Photo preview modal
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  // 1. Check logged-in user's worker status in TiDB
  const checkWorkerSession = useCallback(async () => {
    try {
      const res = await fetch("/api/worker/me");
      if (res.ok) {
        const d = await res.json();
        if (d.authenticated && d.isWorker && d.worker) {
          setIsDbWorker(true);
          setIsApproved(d.isApproved);
          setCurrentWorker({
            id: d.worker.id,
            name: d.worker.name,
            email: d.worker.email,
            departmentCode: d.worker.departmentCode,
            departmentName: d.worker.departmentName,
            role: d.worker.role,
            zone: d.worker.zone,
            phone: d.worker.phone || "+91 98230 00000",
            vehicle: d.worker.vehicle || "NMC Field Vehicle",
            avatar: d.worker.avatar || "👷",
          } as WorkerProfile);
        } else {
          setIsDbWorker(false);
          if (session?.user) {
            setOnboardForm((prev) => ({
              ...prev,
              name: session.user?.name || prev.name,
              email: session.user?.email || prev.email,
            }));
          }
        }
      }
    } catch (err) {
      console.warn("[Worker] Session check failed:", err);
    } finally {
      setDbChecked(true);
    }
  }, [session]);

  useEffect(() => {
    checkWorkerSession();
  }, [checkWorkerSession]);

  // 2. Fetch tasks for current worker from TiDB
  const fetchTasks = useCallback(async (workerKey: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/worker/tasks?workerId=${encodeURIComponent(workerKey)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setTasks(data.tasks || []);
          setKpis(data.kpis || { total: 0, urgent: 0, inProgress: 0, completed: 0 });
          if (data.worker && !isDbWorker) {
            setCurrentWorker(data.worker);
          }
        }
      }
    } catch (err) {
      console.error("[Worker] Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [isDbWorker]);

  useEffect(() => {
    if (currentWorker?.id) {
      fetchTasks(currentWorker.id);
    }
  }, [currentWorker?.id, fetchTasks]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 3. Status transition handler
  const handleStatusTransition = async (task: WorkerTask, next: TaskStatus) => {
    if (next === "RESOLVED") {
      setCompletingTask(task);
      setResolutionNote(getDefaultResolutionNote(task.departmentCode));
      setProofPhotoPreview(null);
      return;
    }

    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: next } : t))
    );

    try {
      const res = await fetch("/api/worker/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          incidentId: task.incidentId,
          departmentCode: task.departmentCode,
          workerId: currentWorker.id,
          nextStatus: next,
        }),
      });

      if (res.ok) {
        showToast(`Task ${task.trackingId} updated to ${formatStatus(next)}`);
      } else {
        fetchTasks(currentWorker.id);
      }
    } catch (err) {
      console.error("[Worker] Transition error:", err);
      fetchTasks(currentWorker.id);
    }
  };

  // 4. Resolution submission
  const handleSubmitResolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingTask) return;

    setSubmittingProof(true);
    try {
      const res = await fetch("/api/worker/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          incidentId: completingTask.incidentId,
          departmentCode: completingTask.departmentCode,
          workerId: currentWorker.id,
          nextStatus: "RESOLVED",
          resolutionNotes: resolutionNote.trim(),
          proofPhotoUrl: proofPhotoPreview || undefined,
        }),
      });

      if (res.ok) {
        showToast(`Task ${completingTask.trackingId} resolved & proof uploaded!`);
        setCompletingTask(null);
        setResolutionNote("");
        setProofPhotoPreview(null);
        fetchTasks(currentWorker.id);
      }
    } catch (err) {
      console.error("[Worker] Resolution error:", err);
    } finally {
      setSubmittingProof(false);
    }
  };

  // 5. Submit Onboarding / Request Assignment to TiDB
  const handleOnboardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOnboardError("");
    if (!onboardForm.name.trim() || !onboardForm.email.trim()) {
      setOnboardError("Full name and Email are required");
      return;
    }

    setOnboardSubmitting(true);
    try {
      const res = await fetch("/api/worker/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(onboardForm),
      });
      const d = await res.json();
      if (!res.ok || !d.success) {
        throw new Error(d.error || "Failed to register field worker");
      }

      showToast("Registered as Field Worker successfully!");
      setShowOnboardModal(false);
      await checkWorkerSession();
    } catch (err) {
      setOnboardError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setOnboardSubmitting(false);
    }
  };

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setProofPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (statusFilter === "ALL") return true;
    if (statusFilter === "NEW") return t.status === "ASSIGNED" || t.status === "ACCEPTED";
    if (statusFilter === "ACTIVE")
      return (
        t.status === "EN_ROUTE" ||
        t.status === "REACHED_SITE" ||
        t.status === "WORK_STARTED"
      );
    if (statusFilter === "COMPLETED") return t.status === "RESOLVED";
    return true;
  });

  return (
    <div className="space-y-4 fade-in max-w-2xl mx-auto pb-8">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed top-16 left-4 right-4 z-50 max-w-md mx-auto bg-slate-900 text-white text-xs sm:text-sm font-medium px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center justify-between gap-3 animate-slide-down">
          <div className="flex items-center gap-2">
            <span>✅</span>
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Role-Based Authentication & Onboarding Banner */}
      {authStatus === "authenticated" && !isDbWorker && dbChecked && (
        <div className="bg-gradient-to-r from-amber-500/10 via-accent/10 to-transparent border border-amber-500/20 rounded-2xl p-4 shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-base">👋</span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Signed in as <span className="text-accent">{session?.user?.email}</span>
                </span>
                <Badge variant="warning" className="text-[10px]">Citizen Account</Badge>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                This email is not yet assigned as an official NMC Field Worker in the database.
              </p>
            </div>
            <button
              onClick={() => setShowOnboardModal(true)}
              className="px-3 py-1.5 bg-accent text-white text-xs font-bold rounded-xl hover:bg-accent-hover transition-colors shadow-xs shrink-0 cursor-pointer"
            >
              + Register as Worker
            </button>
          </div>
        </div>
      )}

      {/* Not Logged In Prompt */}
      {authStatus === "unauthenticated" && (
        <div className="bg-surface-0 border border-border rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center text-xl font-bold">
              👷
            </div>
            <div>
              <h3 className="text-xs font-bold text-text-primary">
                Official NMC Field Technician Portal
              </h3>
              <p className="text-[11px] text-text-secondary">
                Sign in with Google to view tasks assigned to your department email.
              </p>
            </div>
          </div>
          <button
            onClick={() => signIn("google", { callbackUrl: "/worker" })}
            className="w-full sm:w-auto px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Sign in with Google</span>
          </button>
        </div>
      )}

      {/* Redesigned Worker Identity Header (Fixed layout - no collisions) */}
      <div className="bg-surface-0 border border-border rounded-2xl p-4 shadow-xs space-y-3">
        {/* Row 1: Profile Info & Status */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-2xl shrink-0">
              {session?.user?.image ? (
                <img
                  src={session.user.image}
                  alt={currentWorker.name}
                  className="w-full h-full rounded-2xl object-cover"
                />
              ) : (
                currentWorker.avatar || "👷"
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black text-text-primary leading-tight truncate">
                  {currentWorker.name}
                </h1>
                <span
                  className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"
                  title="On Duty"
                />
              </div>
              <p className="text-xs text-text-secondary mt-0.5 truncate font-medium">
                {currentWorker.role}
              </p>
              <p className="text-[11px] font-semibold text-accent truncate">
                {currentWorker.departmentName} · {currentWorker.zone}
              </p>
            </div>
          </div>

          {/* Persona Switcher / Department Dropdown */}
          <div className="shrink-0 text-right">
            <select
              value={currentWorker.id}
              onChange={(e) => {
                const w = WORKER_ROSTER.find((r) => r.id === e.target.value);
                if (w) setCurrentWorker(w);
              }}
              className="px-2.5 py-1.5 text-xs font-medium bg-surface-1 border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent cursor-pointer max-w-[150px] truncate"
            >
              {WORKER_ROSTER.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.departmentCode.slice(0, 3).toUpperCase()})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Equipment & Employee Code Bar (Clean truncation, zero collisions) */}
        <div className="flex items-center justify-between pt-2.5 border-t border-border/60 text-xs gap-2">
          <div className="flex items-center gap-1.5 min-w-0 text-text-secondary">
            <span className="shrink-0">🚐</span>
            <span className="truncate font-medium text-[11px]">
              {currentWorker.vehicle || "NMC Field Vehicle"}
            </span>
          </div>
          <span className="shrink-0 font-mono text-[10px] font-bold text-text-tertiary bg-surface-1 px-2 py-0.5 rounded-md border border-border/50">
            ID: {currentWorker.id}
          </span>
        </div>
      </div>

      {/* KPI Stats Strip — Clickable Quick Filter Cards */}
      <div className="grid grid-cols-4 gap-2">
        <button
          onClick={() => setStatusFilter("ALL")}
          className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
            statusFilter === "ALL"
              ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 shadow-xs"
              : "bg-surface-0 border-border hover:border-accent/40"
          }`}
        >
          <span className="text-[10px] uppercase font-bold tracking-wider opacity-70 block">
            Total
          </span>
          <span className="text-base font-black leading-tight mt-0.5 block">
            {kpis.total}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter("NEW")}
          className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
            statusFilter === "NEW"
              ? "bg-rose-500 text-white border-rose-500 shadow-xs"
              : "bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-400"
          }`}
        >
          <span className="text-[10px] uppercase font-bold tracking-wider block">
            Urgent
          </span>
          <span className="text-base font-black leading-tight mt-0.5 block">
            {kpis.urgent}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter("ACTIVE")}
          className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
            statusFilter === "ACTIVE"
              ? "bg-amber-500 text-white border-amber-500 shadow-xs"
              : "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 text-amber-700 dark:text-amber-400"
          }`}
        >
          <span className="text-[10px] uppercase font-bold tracking-wider block">
            Active
          </span>
          <span className="text-base font-black leading-tight mt-0.5 block">
            {kpis.inProgress}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter("COMPLETED")}
          className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
            statusFilter === "COMPLETED"
              ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
              : "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400"
          }`}
        >
          <span className="text-[10px] uppercase font-bold tracking-wider block">
            Done
          </span>
          <span className="text-base font-black leading-tight mt-0.5 block">
            {kpis.completed}
          </span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex bg-surface-1 p-1 rounded-xl border border-border text-xs font-bold">
        {[
          { key: "ALL", label: "All Tasks" },
          { key: "NEW", label: "New / Assigned" },
          { key: "ACTIVE", label: "In Progress" },
          { key: "COMPLETED", label: "Completed" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`flex-1 py-1.5 rounded-lg transition-all text-center cursor-pointer ${
              statusFilter === tab.key
                ? "bg-surface-0 text-text-primary shadow-xs"
                : "text-text-tertiary hover:text-text-secondary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="text-center py-16 text-text-tertiary">
          <div className="animate-spin inline-block w-8 h-8 border-2 border-accent border-t-transparent rounded-full mb-3" />
          <p className="text-xs font-medium">Fetching field assignments from TiDB...</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredTasks.length === 0 && (
        <div className="text-center py-16 bg-surface-0 rounded-2xl border border-border p-6">
          <div className="text-3xl mb-2">🎉</div>
          <h3 className="text-sm font-bold text-text-primary">No pending tasks found</h3>
          <p className="text-xs text-text-tertiary mt-1">
            All assigned field issues in this category have been resolved.
          </p>
        </div>
      )}

      {/* Task Cards List */}
      {!loading && (
        <div className="space-y-3">
          {filteredTasks.map((task) => {
            const isExpanded = expandedTaskId === task.id;
            return (
              <div
                key={task.id}
                className="bg-surface-0 border border-border rounded-2xl p-4 shadow-xs hover:shadow-sm transition-all space-y-3"
              >
                {/* Header: Badges & Time */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                        task.severity === "CRITICAL"
                          ? "bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800"
                          : task.severity === "HIGH"
                          ? "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      {task.severity}
                    </span>

                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-accent/10 text-accent border border-accent/20">
                      {formatStatus(task.status)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-text-tertiary">
                      {task.trackingId}
                    </span>
                    <span className="text-[10px] text-text-muted">· {task.assignedAt}</span>
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-sm font-black text-text-primary leading-snug">
                  {task.title}
                </h3>

                {/* Location & Google Maps GPS Button */}
                <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-surface-1 border border-border/60">
                  <div className="flex items-center gap-2 truncate text-xs text-text-secondary">
                    <span>📍</span>
                    <span className="truncate">{task.location}</span>
                  </div>

                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${task.latitude},${task.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 px-2.5 py-1 rounded-lg bg-accent/10 hover:bg-accent/20 text-accent text-[11px] font-bold transition-colors flex items-center gap-1"
                  >
                    <span>🗺️</span> Navigate
                  </a>
                </div>

                {/* Safety Notes Banner */}
                {task.safetyNotes && (
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
                    <span className="shrink-0 mt-0.5">⚠️</span>
                    <p className="leading-tight">{task.safetyNotes}</p>
                  </div>
                )}

                {/* Expandable details (Description & Citizen Photos) */}
                {isExpanded && (
                  <div className="space-y-2 pt-2 border-t border-border/60 text-xs text-text-secondary animate-fade-in">
                    <div>
                      <span className="font-bold text-[10px] uppercase tracking-wider text-text-tertiary block mb-1">
                        Incident Description
                      </span>
                      <p className="bg-surface-1 p-2.5 rounded-xl border border-border/60 text-text-primary text-[11px] leading-relaxed">
                        {task.description}
                      </p>
                    </div>

                    {task.citizenPhotos && task.citizenPhotos.length > 0 && (
                      <div>
                        <span className="font-bold text-[10px] uppercase tracking-wider text-text-tertiary block mb-1">
                          Citizen Photos
                        </span>
                        <div className="flex gap-2 overflow-x-auto pb-1">
                          {task.citizenPhotos.map((url, idx) => (
                            <button
                              key={idx}
                              onClick={() => setPreviewPhotoUrl(url)}
                              className="w-16 h-16 rounded-xl overflow-hidden border border-border shrink-0 hover:opacity-80 transition-opacity"
                            >
                              <img
                                src={url}
                                alt="Citizen report"
                                className="w-full h-full object-cover"
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Toggle Details */}
                <button
                  onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                  className="text-[11px] font-bold text-text-tertiary hover:text-text-secondary transition-colors cursor-pointer block"
                >
                  {isExpanded ? "▲ Hide Incident Details" : "▼ Show Incident Details"}
                </button>

                {/* Action Button Row */}
                <div className="pt-2 border-t border-border/60">
                  {task.status === "ASSIGNED" && (
                    <button
                      onClick={() => handleStatusTransition(task, "ACCEPTED")}
                      className="w-full py-2 px-3 text-xs font-bold rounded-xl bg-accent text-white hover:bg-accent-hover transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>Acknowledge & Accept Task</span>
                      <span>→</span>
                    </button>
                  )}

                  {task.status === "ACCEPTED" && (
                    <button
                      onClick={() => handleStatusTransition(task, "EN_ROUTE")}
                      className="w-full py-2 px-3 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>🚗 En Route to Site</span>
                      <span>→</span>
                    </button>
                  )}

                  {task.status === "EN_ROUTE" && (
                    <button
                      onClick={() => handleStatusTransition(task, "REACHED_SITE")}
                      className="w-full py-2 px-3 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>📍 Mark Reached Site</span>
                      <span>→</span>
                    </button>
                  )}

                  {task.status === "REACHED_SITE" && (
                    <button
                      onClick={() => handleStatusTransition(task, "WORK_STARTED")}
                      className="w-full py-2 px-3 text-xs font-bold rounded-xl bg-violet-600 hover:bg-violet-700 text-white transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>⚡ Begin Field Repair Work</span>
                      <span>→</span>
                    </button>
                  )}

                  {task.status === "WORK_STARTED" && (
                    <button
                      onClick={() => handleStatusTransition(task, "RESOLVED")}
                      className="w-full py-2 px-3 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>📸 Complete & Upload Proof</span>
                      <span>✓</span>
                    </button>
                  )}

                  {task.status === "RESOLVED" && (
                    <div className="w-full py-2 px-3 text-xs font-bold rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-center flex items-center justify-center gap-1.5">
                      <span>✓</span>
                      <span>Task Resolved · Citizen Notified</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Resolution & Proof-of-Work Modal */}
      {completingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-surface-0 w-full max-w-md rounded-2xl shadow-2xl border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-surface-1/50">
              <div>
                <h3 className="font-display font-black text-text-primary text-sm">
                  Complete Field Resolution
                </h3>
                <p className="text-[11px] font-mono text-text-tertiary">
                  Ref: {completingTask.trackingId}
                </p>
              </div>
              <button
                onClick={() => setCompletingTask(null)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-surface-1 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitResolution} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">
                  📸 Upload Proof of Work (Before / After Photo)
                </label>
                <div className="border-2 border-dashed border-border rounded-xl p-4 text-center bg-surface-1/50 hover:bg-surface-1 transition-colors">
                  {proofPhotoPreview ? (
                    <div className="space-y-2">
                      <img
                        src={proofPhotoPreview}
                        alt="Proof Preview"
                        className="max-h-40 mx-auto rounded-lg object-cover border border-border"
                      />
                      <button
                        type="button"
                        onClick={() => setProofPhotoPreview(null)}
                        className="text-[11px] text-rose-500 font-bold hover:underline"
                      >
                        Remove Photo
                      </button>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        id="proof-photo-input"
                        onChange={handlePhotoCapture}
                        className="hidden"
                      />
                      <label
                        htmlFor="proof-photo-input"
                        className="cursor-pointer flex flex-col items-center gap-1.5"
                      >
                        <span className="text-2xl">📷</span>
                        <span className="text-xs font-bold text-accent">
                          Take Photo or Upload Image
                        </span>
                        <span className="text-[10px] text-text-tertiary">
                          Required by NMC audit protocols
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">
                  Resolution Notes
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe repair actions taken..."
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-surface-1 border border-border rounded-xl focus:outline-none focus:border-accent text-text-primary"
                />
              </div>

              <div className="pt-2 border-t border-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCompletingTask(null)}
                  className="px-3.5 py-1.5 text-xs font-bold text-text-secondary hover:bg-surface-1 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingProof}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl transition-colors shadow-xs cursor-pointer"
                >
                  {submittingProof ? "Submitting..." : "Submit & Resolve Task ✓"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Onboarding / Self-Registration Modal */}
      {showOnboardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-surface-0 w-full max-w-md rounded-2xl shadow-2xl border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-surface-1/50">
              <div>
                <h3 className="font-display font-black text-text-primary text-sm">
                  Field Worker Registration
                </h3>
                <p className="text-[11px] text-text-tertiary">
                  Register your account in the TiDB municipal database
                </p>
              </div>
              <button
                onClick={() => setShowOnboardModal(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-surface-1 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleOnboardSubmit} className="p-5 space-y-3">
              {onboardError && (
                <div className="p-2.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
                  ⚠️ {onboardError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Anand Deshmukh"
                  value={onboardForm.name}
                  onChange={(e) => setOnboardForm({ ...onboardForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-surface-1 border border-border rounded-xl focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">
                  Google Email ID *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. anand@gmail.com"
                  value={onboardForm.email}
                  onChange={(e) => setOnboardForm({ ...onboardForm, email: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-surface-1 border border-border rounded-xl focus:outline-none focus:border-accent font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-text-secondary mb-1">
                    Department *
                  </label>
                  <select
                    value={onboardForm.departmentCode}
                    onChange={(e) =>
                      setOnboardForm({ ...onboardForm, departmentCode: e.target.value })
                    }
                    className="w-full px-2.5 py-2 text-xs bg-surface-1 border border-border rounded-xl focus:outline-none focus:border-accent"
                  >
                    {Object.values(DEPARTMENT_REGISTRY).map((d) => (
                      <option key={d.code} value={d.code}>
                        {d.shortName || d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary mb-1">
                    Municipal Zone *
                  </label>
                  <select
                    value={onboardForm.zone}
                    onChange={(e) => setOnboardForm({ ...onboardForm, zone: e.target.value })}
                    className="w-full px-2.5 py-2 text-xs bg-surface-1 border border-border rounded-xl focus:outline-none focus:border-accent"
                  >
                    {NAGPUR_ZONES.map((z) => (
                      <option key={z} value={z}>
                        {z}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-text-secondary mb-1">
                    Squad Role
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Patch Crew Lead"
                    value={onboardForm.role}
                    onChange={(e) => setOnboardForm({ ...onboardForm, role: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-surface-1 border border-border rounded-xl focus:outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary mb-1">
                    Assigned Vehicle
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. MH-31-AP-1100"
                    value={onboardForm.vehicle}
                    onChange={(e) =>
                      setOnboardForm({ ...onboardForm, vehicle: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-surface-1 border border-border rounded-xl focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowOnboardModal(false)}
                  className="px-3.5 py-1.5 text-xs font-bold text-text-secondary hover:bg-surface-1 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={onboardSubmitting}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-accent hover:bg-accent-hover disabled:opacity-50 rounded-xl transition-colors shadow-xs cursor-pointer"
                >
                  {onboardSubmitting ? "Registering..." : "Submit to Database"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Photo Lightbox */}
      {previewPhotoUrl && (
        <div
          onClick={() => setPreviewPhotoUrl(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 cursor-pointer"
        >
          <div className="max-w-lg w-full">
            <img
              src={previewPhotoUrl}
              alt="Enlarged evidence"
              className="w-full rounded-2xl object-contain max-h-[80vh] shadow-2xl"
            />
            <p className="text-center text-white/80 text-xs mt-2">
              Tap anywhere to dismiss
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function formatStatus(status: TaskStatus): string {
  switch (status) {
    case "ASSIGNED":
      return "New Task";
    case "ACCEPTED":
      return "Accepted";
    case "EN_ROUTE":
      return "En Route";
    case "REACHED_SITE":
      return "On Site";
    case "WORK_STARTED":
      return "In Progress";
    case "RESOLVED":
      return "Resolved";
    default:
      return status;
  }
}

function getDefaultResolutionNote(deptCode: string): string {
  switch (deptCode) {
    case "road_maintenance":
      return "Pothole filled with cold asphalt mix and compacted using mechanical roller. Site cleared and traffic cones removed.";
    case "waste_management":
      return "Garbage heap cleared using mini tipper van. Area disinfected with bleaching powder. Waste transported to processing depot.";
    case "water_supply":
      return "Pipeline leak identified and clamped with new coupling. Valve reopened and water pressure verified normal.";
    case "electricity":
      return "Streetlight wiring repaired and new 90W LED fixture installed. Circuit test successful and operational.";
    case "drainage":
      return "Blockage removed using suction jetting machine. Manhole cover reseated flush with roadway.";
    default:
      return "Field work completed according to NMC civic repair standards. Site inspected and confirmed clear.";
  }
}
