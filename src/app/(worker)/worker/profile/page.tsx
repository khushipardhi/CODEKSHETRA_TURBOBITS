/* ════════════════════════════════════════════════════════
   Worker Profile Page — /worker/profile
   NMC Field Technician Identity, Google Account & Database Roster
   ════════════════════════════════════════════════════════ */

"use client";

import { useState, useEffect } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { Badge } from "@/components/ui";
import { WORKER_ROSTER, type WorkerProfile } from "@/lib/worker-roster";
import Link from "next/link";

interface DbWorker {
  id: string;
  name: string;
  email: string;
  phone: string;
  departmentCode: string;
  departmentName: string;
  zone: string;
  role: string;
  vehicle: string;
  avatar: string;
  status: string;
  isApproved: boolean;
}

export default function WorkerProfilePage() {
  const { data: session, status: authStatus } = useSession();
  const [dbWorker, setDbWorker] = useState<DbWorker | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDemoId, setSelectedDemoId] = useState<string>("W-PWD-01");

  useEffect(() => {
    async function loadWorker() {
      try {
        const res = await fetch("/api/worker/me");
        if (res.ok) {
          const d = await res.json();
          if (d.authenticated && d.isWorker && d.worker) {
            setDbWorker(d.worker);
          }
        }
      } catch (err) {
        console.warn("[Profile] Load error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadWorker();
  }, [session]);

  const demoWorker =
    WORKER_ROSTER.find((w) => w.id === selectedDemoId) || WORKER_ROSTER[0];

  const activeWorker: WorkerProfile = dbWorker
    ? {
        id: dbWorker.id,
        name: dbWorker.name,
        departmentCode: dbWorker.departmentCode,
        departmentName: dbWorker.departmentName,
        role: dbWorker.role,
        zone: dbWorker.zone,
        phone: dbWorker.phone,
        vehicle: dbWorker.vehicle,
        avatar: dbWorker.avatar,
      }
    : demoWorker;

  return (
    <div className="space-y-5 fade-in max-w-2xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text-primary">
            Personnel Profile
          </h1>
          <p className="text-xs text-text-tertiary">
            Nagpur Municipal Corporation · Field Force
          </p>
        </div>
        <Link
          href="/worker"
          className="px-3.5 py-1.5 bg-accent text-white font-bold text-xs rounded-xl hover:bg-accent-hover transition-colors shadow-xs"
        >
          ← Assigned Tasks
        </Link>
      </div>

      {/* Google Account Status Banner */}
      {authStatus === "authenticated" && session?.user ? (
        <div className="bg-surface-0 border border-border rounded-2xl p-4 shadow-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-border shrink-0">
              {session.user.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-accent/10 flex items-center justify-center font-bold text-accent">
                  {(session.user.name || "U")[0]}
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-text-primary">
                  {session.user.name}
                </span>
                {dbWorker ? (
                  <Badge variant="success" className="text-[10px]">
                    Verified Worker
                  </Badge>
                ) : (
                  <Badge variant="warning" className="text-[10px]">
                    Citizen Account
                  </Badge>
                )}
              </div>
              <p className="text-[11px] font-mono text-text-secondary">
                {session.user.email}
              </p>
            </div>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: "/worker" })}
            className="px-3 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-xl hover:bg-rose-100 transition-colors cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      ) : (
        <div className="bg-surface-0 border border-border rounded-2xl p-4 shadow-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg">
              🔐
            </div>
            <div>
              <h3 className="text-xs font-bold text-text-primary">
                Google Authentication
              </h3>
              <p className="text-[11px] text-text-secondary">
                Sign in with your registered municipal Google email
              </p>
            </div>
          </div>
          <button
            onClick={() => signIn("google", { callbackUrl: "/worker/profile" })}
            className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold rounded-xl hover:opacity-90 transition-opacity shadow-xs cursor-pointer"
          >
            Sign In with Google
          </button>
        </div>
      )}

      {/* Main Profile Card */}
      <div className="bg-surface-0 border border-border rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-3xl shadow-inner shrink-0">
            {activeWorker.avatar || "👷"}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-text-primary truncate">
                {activeWorker.name}
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/20 shrink-0">
                Active / On Duty
              </span>
            </div>
            <p className="text-xs text-text-secondary mt-0.5">{activeWorker.role}</p>
            <p className="text-[11px] font-semibold text-accent mt-0.5 truncate">
              {activeWorker.departmentName} · {activeWorker.zone}
            </p>
          </div>
        </div>

        {/* Demo Switcher if not bound to a DB worker */}
        {!dbWorker && (
          <div className="p-3 bg-surface-1 rounded-xl border border-border">
            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1.5">
              Simulate Department Squad (Demo Mode)
            </label>
            <select
              value={selectedDemoId}
              onChange={(e) => setSelectedDemoId(e.target.value)}
              className="w-full p-2 text-xs bg-surface-0 border border-border rounded-lg font-medium text-text-primary focus:outline-none focus:border-accent cursor-pointer"
            >
              {WORKER_ROSTER.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} — {w.departmentName} ({w.zone})
                </option>
              ))}
            </select>
            <p className="text-[10px] text-text-tertiary mt-1">
              Test how different municipal departments view and dispatch work in the field.
            </p>
          </div>
        )}

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <div className="p-3 bg-surface-1 rounded-xl border border-border/60">
            <span className="text-[10px] text-text-tertiary block font-bold uppercase tracking-wider">
              Employee Code
            </span>
            <span className="text-xs font-mono font-bold text-text-primary">
              {activeWorker.id}
            </span>
          </div>
          <div className="p-3 bg-surface-1 rounded-xl border border-border/60">
            <span className="text-[10px] text-text-tertiary block font-bold uppercase tracking-wider">
              Municipal Zone
            </span>
            <span className="text-xs font-bold text-text-primary truncate block">
              {activeWorker.zone}
            </span>
          </div>
          <div className="p-3 bg-surface-1 rounded-xl border border-border/60">
            <span className="text-[10px] text-text-tertiary block font-bold uppercase tracking-wider">
              Contact Phone
            </span>
            <span className="text-xs font-mono font-bold text-text-primary">
              {activeWorker.phone}
            </span>
          </div>
          <div className="p-3 bg-surface-1 rounded-xl border border-border/60">
            <span className="text-[10px] text-text-tertiary block font-bold uppercase tracking-wider">
              Assigned Vehicle
            </span>
            <span className="text-xs font-semibold text-text-primary truncate block">
              {activeWorker.vehicle}
            </span>
          </div>
        </div>
      </div>

      {/* Citizen Dashboard Switcher */}
      <div className="bg-surface-0 border border-border rounded-2xl p-4 shadow-xs flex items-center justify-between gap-3">
        <div>
          <h3 className="text-xs font-bold text-text-primary">
            Citizen Civic Dashboard
          </h3>
          <p className="text-[11px] text-text-secondary">
            Need to report a civic issue as a Nagpur resident?
          </p>
        </div>
        <Link
          href="/dashboard"
          className="px-3.5 py-1.5 text-xs font-bold rounded-xl border border-border hover:bg-surface-1 transition-colors text-text-primary shrink-0"
        >
          Citizen Portal →
        </Link>
      </div>
    </div>
  );
}
