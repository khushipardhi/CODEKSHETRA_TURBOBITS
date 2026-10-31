/* ════════════════════════════════════════════════════════
   Citizen Profile Dashboard — /profile
   Google Auth, Profile Management, Zones, Emergency Info, Logout
   ════════════════════════════════════════════════════════ */

"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";
import { CitizenHeader } from "@/components/citizen/citizen-header";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { citizenHeaders, getOrCreateGuestId } from "@/lib/guest-id";
import { useCityContext } from "@/components/providers/city-provider";

interface CitizenProfileData {
  id: string | null;
  googleId: string | null;
  guestId: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  wardZone: string | null;
  address: string | null;
  emergencyContact: string | null;
  bio: string | null;
  notificationEmailEnabled: boolean;
  avatarUrl: string | null;
  isGuest: boolean;
  createdAt: string;
}

interface CitizenStats {
  totalReports: number;
  resolvedReports: number;
  inProgressReports: number;
}

export default function CitizenProfilePage() {
  const router = useRouter();
  const { city, cityConfig } = useCityContext();
  const { data: session, status } = useSession();
  const isAuth = status === "authenticated" && !!session?.user;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Profile Form state
  const [profile, setProfile] = useState<CitizenProfileData>({
    id: null,
    googleId: null,
    guestId: null,
    name: "Citizen User",
    email: null,
    phone: "",
    wardZone: "",
    address: "",
    emergencyContact: "",
    bio: "",
    notificationEmailEnabled: true,
    avatarUrl: null,
    isGuest: true,
    createdAt: new Date().toISOString(),
  });

  const [stats, setStats] = useState<CitizenStats>({
    totalReports: 0,
    resolvedReports: 0,
    inProgressReports: 0,
  });

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [session, status]);

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      await getOrCreateGuestId();
      const res = await fetch("/api/citizen/profile", {
        headers: citizenHeaders(),
      });

      if (!res.ok) throw new Error("Failed to load profile details");

      const data = await res.json();
      if (data.success) {
        const p = data.profile;
        setProfile({
          id: p.id,
          googleId: p.googleId,
          guestId: p.guestId,
          name: p.name || session?.user?.name || (typeof window !== "undefined" && (localStorage.getItem("urban_link_name") || localStorage.getItem("nagpur_connect_name"))) || "Citizen User",
          email: p.email || session?.user?.email || null,
          phone: p.phone || "",
          wardZone: p.wardZone || "",
          address: p.address || "",
          emergencyContact: p.emergencyContact || "",
          bio: p.bio || "",
          notificationEmailEnabled: p.notificationEmailEnabled ?? true,
          avatarUrl: p.avatarUrl || session?.user?.image || null,
          isGuest: p.isGuest,
          createdAt: p.createdAt,
        });

        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (err) {
      console.warn("[Profile] Could not fetch remote profile:", err);
      // Fallback from session & storage
      if (session?.user) {
        setProfile((prev) => ({
          ...prev,
          name: session.user?.name || prev.name,
          email: session.user?.email || prev.email,
          avatarUrl: session.user?.image || prev.avatarUrl,
          isGuest: false,
        }));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    setError(null);

    try {
      // Also save locally for instant offline display
      if (typeof window !== "undefined") {
        localStorage.setItem("urban_link_name", profile.name);
        localStorage.setItem("nagpur_connect_name", profile.name);
      }

      const res = await fetch("/api/citizen/profile", {
        method: "PATCH",
        headers: {
          ...citizenHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: profile.name,
          phone: profile.phone,
          wardZone: profile.wardZone,
          address: profile.address,
          emergencyContact: profile.emergencyContact,
          bio: profile.bio,
          notificationEmailEnabled: profile.notificationEmailEnabled,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error?.message || "Failed to update profile");
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    setShowLogoutConfirm(false);
    await signOut({ callbackUrl: `/${city}/dashboard` });
  };

  return (
    <div className="min-h-screen bg-canvas pb-16">
      <CitizenHeader />

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Header Title */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Citizen Profile</h1>
            <p className="text-xs text-text-tertiary">
              Manage your personal info, {cityConfig.name} locality preferences, and report history
            </p>
          </div>
          <button
            onClick={() => router.push("/dashboard")}
            className="text-xs font-semibold text-accent hover:underline cursor-pointer"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* Profile Card Banner */}
        <div className="bg-surface-0 border border-border rounded-3xl overflow-hidden shadow-sm mb-6">
          {/* Header gradient banner */}
          <div className="h-28 bg-gradient-to-r from-accent via-accent-hover to-accent relative p-4 flex items-end justify-between">
            <div className="flex items-center gap-4 translate-y-8">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.name}
                  className="w-20 h-20 rounded-full border-4 border-surface-0 object-cover shadow-md bg-surface-1"
                />
              ) : (
                <div className="w-20 h-20 rounded-full border-4 border-surface-0 bg-accent-muted flex items-center justify-center text-accent text-2xl font-bold shadow-md">
                  {profile.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Top Right Auth Status Badge */}
            {isAuth ? (
              <span className="bg-white/20 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Google Verified
              </span>
            ) : (
              <span className="bg-white/20 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-amber-300" />
                Guest Mode
              </span>
            )}
          </div>

          {/* User info & quick auth actions */}
          <div className="pt-10 pb-5 px-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                  {profile.name}
                  {isAuth && (
                    <svg className="w-4 h-4 text-accent fill-current" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                  )}
                </h2>
                <p className="text-xs text-text-secondary mt-0.5">
                  {profile.email ? (
                    <span className="font-mono text-text-primary">{profile.email}</span>
                  ) : (
                    <span className="italic text-text-tertiary">No email connected (Guest)</span>
                  )}
                  {profile.wardZone && <span className="ml-2">· {profile.wardZone}</span>}
                </p>
              </div>

              {/* Login / Logout Action */}
              <div>
                {isAuth ? (
                  <button
                    onClick={() => setShowLogoutConfirm(true)}
                    className="px-4 py-2 rounded-full border border-critical/30 bg-critical-bg text-critical text-xs font-bold hover:bg-critical hover:text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Sign Out
                  </button>
                ) : (
                  <button
                    onClick={() => signIn("google")}
                    className="px-4 py-2 rounded-full bg-accent text-white text-xs font-bold hover:bg-accent-hover transition-all cursor-pointer flex items-center gap-2 shadow-md"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z" />
                    </svg>
                    Sign In with Google
                  </button>
                )}
              </div>
            </div>

            {/* Guest sync callout if not authenticated */}
            {!isAuth && (
              <div className="mt-4 p-3.5 bg-accent/5 border border-accent/20 rounded-2xl flex items-start gap-3">
                <span className="text-xl">💡</span>
                <div className="flex-1">
                  <p className="text-xs font-bold text-text-primary">
                    Link your reports & receive email updates
                  </p>
                  <p className="text-[11px] text-text-secondary mt-0.5 leading-relaxed">
                    You are reporting as a guest. Sign in with your Google account to keep your report history safely synced across all devices and get instant email alerts when your issues are resolved.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Live Incident Statistics */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-surface-0 border border-border rounded-2xl p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-accent">{stats.totalReports}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary mt-1">
              Total Reports
            </p>
          </div>
          <div className="bg-surface-0 border border-border rounded-2xl p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-success">{stats.resolvedReports}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary mt-1">
              Resolved ✓
            </p>
          </div>
          <div className="bg-surface-0 border border-border rounded-2xl p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-warning">{stats.inProgressReports}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary mt-1">
              In Progress
            </p>
          </div>
        </div>

        {/* Edit Profile Form */}
        <form onSubmit={handleSave} className="bg-surface-0 border border-border rounded-3xl p-6 shadow-sm mb-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
              <span>👤</span> Personal & Civic Details
            </h2>
            <span className="text-xs text-text-tertiary">Used for NMC Civic Services</span>
          </div>

          {/* Feedback message */}
          {saveSuccess && (
            <div className="p-3 bg-success-bg border border-success-border rounded-xl text-success text-xs font-semibold flex items-center gap-2 animate-fadeIn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Profile changes saved successfully!
            </div>
          )}

          {error && (
            <div className="p-3 bg-critical-bg border border-critical-border rounded-xl text-critical text-xs font-semibold">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1.5">
                Full Name <span className="text-critical">*</span>
              </label>
              <input
                type="text"
                required
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                placeholder="e.g. Ramesh Sharma"
                className="w-full bg-surface-1 border border-border rounded-xl px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1.5">
                Email Address {isAuth && <span className="text-success text-[10px] ml-1">(Verified via Google)</span>}
              </label>
              <input
                type="email"
                disabled={isAuth}
                value={profile.email || ""}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                placeholder="e.g. citizen@example.com"
                className="w-full bg-surface-1 border border-border rounded-xl px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:opacity-75 disabled:cursor-not-allowed"
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1.5">
                Mobile / Contact Number
              </label>
              <input
                type="tel"
                value={profile.phone || ""}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                placeholder="e.g. 9876543210"
                className="w-full bg-surface-1 border border-border rounded-xl px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </div>

            {/* City Ward / Zone */}
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1.5">
                {cityConfig.name} Zone / Locality
              </label>
              <select
                value={profile.wardZone || ""}
                onChange={(e) => setProfile({ ...profile, wardZone: e.target.value })}
                className="w-full bg-surface-1 border border-border rounded-xl px-3.5 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30 cursor-pointer"
              >
                <option value="">Select your {cityConfig.name} locality...</option>
                {cityConfig.localities.map((loc) => (
                  <option key={loc.name} value={loc.name}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Home Address */}
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1.5">
              Residential Address / Nearby Landmark
            </label>
            <input
              type="text"
              value={profile.address || ""}
              onChange={(e) => setProfile({ ...profile, address: e.target.value })}
              placeholder="e.g. Flat 302, Green Park Apts, Near Sitabuldi Metro, Nagpur"
              className="w-full bg-surface-1 border border-border rounded-xl px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </div>

          {/* Emergency Contact */}
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1.5">
              Emergency Contact (Name & Phone)
            </label>
            <input
              type="text"
              value={profile.emergencyContact || ""}
              onChange={(e) => setProfile({ ...profile, emergencyContact: e.target.value })}
              placeholder="e.g. Suresh Sharma (Father) - 9823000000"
              className="w-full bg-surface-1 border border-border rounded-xl px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </div>

          {/* Bio / Civic Notes */}
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1.5">
              Civic Notes / Bio (Optional)
            </label>
            <textarea
              rows={2}
              value={profile.bio || ""}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              placeholder="e.g. Active resident volunteer in Dharampeth ward."
              className="w-full bg-surface-1 border border-border rounded-xl px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30 resize-none"
            />
          </div>

          {/* Notification Preferences */}
          <div className="pt-3 border-t border-border space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-tertiary">
              Notification Preferences
            </h3>

            <div className="flex items-center justify-between p-3 bg-surface-1 rounded-xl">
              <div>
                <p className="text-xs font-bold text-text-primary">Email Status Notifications</p>
                <p className="text-[11px] text-text-tertiary">
                  Receive email alerts when your report is assigned, in-progress, or resolved
                </p>
              </div>
              <input
                type="checkbox"
                checked={profile.notificationEmailEnabled}
                onChange={(e) =>
                  setProfile({ ...profile, notificationEmailEnabled: e.target.checked })
                }
                className="w-4 h-4 accent-accent rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Submit button */}
          <div className="pt-3 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-accent text-white rounded-full text-xs font-bold hover:bg-accent-hover transition-all cursor-pointer shadow-md disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving Details...
                </>
              ) : (
                "Save Profile Changes"
              )}
            </button>
          </div>
        </form>

        {/* Quick Links & Emergency Helpline */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-text-tertiary">
            Quick Actions & Helplines
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => router.push(`/${city}/my-reports`)}
              className="p-4 bg-surface-0 border border-border rounded-2xl flex items-center justify-between hover:border-accent/30 transition-colors cursor-pointer text-left shadow-sm"
            >
              <div>
                <p className="text-sm font-bold text-text-primary">My Reports History</p>
                <p className="text-[11px] text-text-tertiary">Track timelines & status of all your reports</p>
              </div>
              <span className="text-accent text-lg">➔</span>
            </button>

            <button
              onClick={() => router.push(`/${city}/dashboard`)}
              className="p-4 bg-surface-0 border border-border rounded-2xl flex items-center justify-between hover:border-accent/30 transition-colors cursor-pointer text-left shadow-sm"
            >
              <div>
                <p className="text-sm font-bold text-text-primary">File a New Report</p>
                <p className="text-[11px] text-text-tertiary">Report road, electricity, water, or safety issues</p>
              </div>
              <span className="text-accent text-lg">➔</span>
            </button>
          </div>

          {/* Emergency dial cards */}
          <div className="bg-critical-bg border border-critical-border rounded-2xl p-4 shadow-sm">
            <p className="text-xs font-bold text-critical uppercase tracking-wider mb-2">
              🚨 {cityConfig.name} Emergency Direct Helplines
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: "Emergency", num: "112" },
                { label: "Police", num: "100" },
                { label: "Fire", num: "101" },
                { label: "Ambulance", num: "108" },
              ].map((h) => (
                <a
                  key={h.num}
                  href={`tel:${h.num}`}
                  className="bg-surface-0/60 hover:bg-surface-0 p-2.5 rounded-xl text-center border border-critical/20 transition-colors cursor-pointer block"
                >
                  <p className="text-[11px] font-medium text-text-secondary">{h.label}</p>
                  <p className="text-sm font-bold text-critical">{h.num}</p>
                </a>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-0 border border-border rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-scaleUp">
            <div className="w-12 h-12 rounded-2xl bg-critical-bg flex items-center justify-center text-critical text-2xl mx-auto mb-4">
              🚪
            </div>
            <h3 className="text-lg font-bold text-text-primary text-center">
              Sign out from Sentinel?
            </h3>
            <p className="text-xs text-text-secondary text-center mt-2 leading-relaxed">
              You will be switched to Guest mode. You can sign back in anytime with your Google account.
            </p>
            <div className="grid grid-cols-2 gap-3 mt-6">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="py-2.5 rounded-full border border-border text-xs font-bold text-text-secondary hover:bg-surface-1 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="py-2.5 rounded-full bg-critical text-white text-xs font-bold hover:bg-critical/90 transition-colors cursor-pointer shadow-md"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
