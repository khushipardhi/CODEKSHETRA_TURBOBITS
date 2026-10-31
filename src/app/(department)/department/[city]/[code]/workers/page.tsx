/* ════════════════════════════════════════════════════════
   Department Field Workers & Facilities — /department/[code]/workers
   Real TiDB Field Staff Management & Official Geodata Facilities
   ════════════════════════════════════════════════════════ */

"use client";

import { useState, useEffect, use, useCallback } from "react";
import { Badge } from "@/components/ui";
import { DepartmentHeader } from "@/components/department/DepartmentHeader";
import { DepartmentSubNav } from "@/components/department/DepartmentSubNav";
import { DEPARTMENT_REGISTRY } from "@/lib/department-registry";
import { useCityContext } from "@/components/providers/city-provider";

interface Worker {
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
  status: "AVAILABLE" | "ON_TASK" | "OFF_DUTY";
  isApproved: boolean;
  activeTasks: number;
  createdAt: string;
}

interface Facility {
  id: string;
  name: string;
  facilityType: string;
  address: string;
  zone: string;
  contactNumber: string;
  emergencyNumber: string;
  handlingCategories: string[];
  latitude?: number;
  longitude?: number;
}

const CITY_ZONES: Record<string, string[]> = {
  nagpur: [
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
  ],
  pune: [
    "Shivajinagar-Ghole Road",
    "Kothrud-Bavdhan",
    "Dhankawadi-Sahakarnagar",
    "Sinhagad Road",
    "Warje-Karvenagar",
    "Hadapsar-Mundhwa",
    "Kondhwa-Yewalewadi",
    "Wanowrie-Ramtekdi",
    "Aundh-Baner",
    "Bhavani Peth",
    "Kasba-Vishrambaugwada",
    "Bibvewadi",
    "Nagar Road-Vadgaonsheri",
    "Yerwada-Kalas-Dhanori",
    "Dhole Patil Road",
  ],
  mumbai: [
    "Zone 1 (South Mumbai - Colaba to Malabar Hill)",
    "Zone 2 (Parel, Dadar, Mahim, Sion)",
    "Zone 3 (Bandra, Santacruz, Khar)",
    "Zone 4 (Andheri, Jogeshwari, Vile Parle)",
    "Zone 5 (Kurla, Chembur, Govandi)",
    "Zone 6 (Ghatkopar, Bhandup, Mulund)",
    "Zone 7 (Borivali, Kandivali, Dahisar)",
  ],
};

export default function WorkersPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const { city, cityConfig } = useCityContext();
  const currentZones = CITY_ZONES[city] || CITY_ZONES.nagpur;
  const dept = DEPARTMENT_REGISTRY[code] || { name: code, icon: "📋" };

  const [activeTab, setActiveTab] = useState<"workers" | "facilities">("workers");
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedZone, setSelectedZone] = useState("ALL");
  const [criticalCount, setCriticalCount] = useState(0);

  // Add Worker Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    zone: currentZones[0] || "Central Zone",
    role: "Field Response Specialist",
    vehicle: `${cityConfig.municipalAbbr} Quick Response Van`,
  });

  const loadWorkers = useCallback(async () => {
    try {
      const res = await fetch(`/api/department/${code}/workers/manage?city=${city}`);
      if (res.ok) {
        const d = await res.json();
        if (d.success) setWorkers(d.workers || []);
      }
    } catch (err) {
      console.error("[Workers] Fetch workers error:", err);
    }
  }, [code, city]);

  const loadFacilities = useCallback(async () => {
    try {
      const res = await fetch(`/api/department/${code}/facilities?city=${city}`);
      if (res.ok) {
        const d = await res.json();
        if (d.success) setFacilities(d.facilities || []);
      }
    } catch (err) {
      console.error("[Workers] Fetch facilities error:", err);
    }
  }, [code, city]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      await Promise.all([
        loadWorkers(),
        loadFacilities(),
        fetch(`/api/department/${code}/stats?city=${city}`)
          .then((r) => r.json())
          .then((s) => {
            if (s.success) setCriticalCount(s.kpi.critical || 0);
          })
          .catch(() => {}),
      ]);
      setLoading(false);
    }
    load();
  }, [code, city, loadWorkers, loadFacilities]);

  const handleAddWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!formData.name.trim() || !formData.email.trim()) {
      setFormError("Full Name and Email ID are mandatory.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/department/${code}/workers/manage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, city }),
      });
      const d = await res.json();
      if (!res.ok || !d.success) {
        throw new Error(d.error || "Failed to add worker");
      }

      setFormSuccess(`Worker ${formData.name} added to database successfully!`);
      setFormData({
        name: "",
        email: "",
        phone: "",
        zone: currentZones[0] || "Central Zone",
        role: "Field Response Specialist",
        vehicle: `${cityConfig.municipalAbbr} Quick Response Van`,
      });
      await loadWorkers();
      setTimeout(() => {
        setShowAddModal(false);
        setFormSuccess("");
      }, 1200);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error creating worker record");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleWorkerStatus = async (workerId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "AVAILABLE" ? "OFF_DUTY" : "AVAILABLE";
    try {
      await fetch(`/api/department/${code}/workers/manage`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workerId, status: nextStatus }),
      });
      await loadWorkers();
    } catch (err) {
      console.error("[Workers] Status update error:", err);
    }
  };

  const filteredWorkers = workers.filter((w) => {
    const matchesSearch =
      w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.zone.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesZone = selectedZone === "ALL" || w.zone === selectedZone;
    return matchesSearch && matchesZone;
  });

  const filteredFacilities = facilities.filter(
    (f) =>
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.zone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 fade-in">
      <DepartmentHeader
        departmentName={`${dept.name} (${cityConfig.name})`}
        departmentIcon={dept.icon}
        criticalCount={criticalCount}
      />

      <DepartmentSubNav departmentCode={code} city={city} />

      {/* Top Banner & Tab Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="font-display text-lg font-black text-slate-900 tracking-tight">
            Field Force & Infrastructure
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage field workers in TiDB database and official department installations across {cityConfig.name}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("workers")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "workers"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              👷 Field Staff ({workers.length})
            </button>
            <button
              onClick={() => setActiveTab("facilities")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "facilities"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              🏢 Facilities ({facilities.length})
            </button>
          </div>

          {activeTab === "workers" && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-accent text-white hover:bg-accent-hover transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <span>+</span> Add Worker
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            placeholder={
              activeTab === "workers"
                ? "Search workers by name, email, role, zone..."
                : "Search facilities by name, zone, address..."
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 shadow-xs"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
            🔍
          </span>
        </div>

        {activeTab === "workers" && (
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="w-full sm:w-56 px-3 py-2.5 text-xs font-medium bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-accent shadow-xs"
          >
            <option value="ALL">All {cityConfig.name} Zones</option>
            {currentZones.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="text-center py-16 text-slate-400">
          <div className="animate-spin inline-block w-8 h-8 border-2 border-accent border-t-transparent rounded-full mb-3" />
          <p className="text-sm font-medium">Loading department data from database...</p>
        </div>
      )}

      {/* TAB 1: FIELD WORKERS */}
      {!loading && activeTab === "workers" && (
        <div className="space-y-4">
          {filteredWorkers.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8">
              <div className="text-4xl mb-3">👷‍♂️</div>
              <h3 className="text-sm font-bold text-slate-800">No field workers found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No workers registered in this department yet. Click &quot;+ Add Worker&quot; to assign a field technician with their Google email.
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-4 px-4 py-2 text-xs font-bold rounded-xl bg-accent text-white hover:bg-accent-hover transition-colors shadow-xs"
              >
                + Register First Worker
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredWorkers.map((w) => (
                <div
                  key={w.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-3 relative overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-xl border border-slate-200 shrink-0">
                        {w.avatar || "👷"}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 leading-tight">
                          {w.name}
                        </h4>
                        <p className="text-[11px] font-medium text-accent mt-0.5">
                          {w.role}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          ID: {w.id}
                        </p>
                      </div>
                    </div>

                    <Badge
                      variant={
                        w.status === "AVAILABLE"
                          ? "success"
                          : w.status === "ON_TASK"
                          ? "warning"
                          : "default"
                      }
                      className="text-[10px] font-bold"
                    >
                      {w.status === "AVAILABLE"
                        ? "● Available"
                        : w.status === "ON_TASK"
                        ? "⚡ On Task"
                        : "○ Off Duty"}
                    </Badge>
                  </div>

                  <div className="space-y-1.5 py-2 border-y border-slate-100 text-xs text-slate-600">
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-slate-400">📧</span>
                      <span className="truncate font-mono text-[11px] text-slate-700">
                        {w.email}
                      </span>
                    </div>
                    {w.phone && (
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">📞</span>
                        <span>{w.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">📍</span>
                      <span className="font-medium text-slate-800">{w.zone}</span>
                    </div>
                    {w.vehicle && (
                      <div className="flex items-center gap-2 truncate text-[11px] text-slate-500">
                        <span>🚐</span>
                        <span className="truncate">{w.vehicle}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="text-[11px] text-slate-500">
                      Active Tasks:{" "}
                      <span className="font-bold text-slate-900">
                        {w.activeTasks}
                      </span>
                    </div>

                    <button
                      onClick={() => toggleWorkerStatus(w.id, w.status)}
                      className="px-2.5 py-1 text-[10px] font-bold rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
                    >
                      Toggle {w.status === "AVAILABLE" ? "Off-Duty" : "Available"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: FACILITIES */}
      {!loading && activeTab === "facilities" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredFacilities.map((facility) => (
            <div
              key={facility.id}
              className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:shadow-md transition-shadow space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 leading-snug">
                    {facility.name}
                  </h3>
                  <Badge variant="default" className="mt-1 text-[10px]">
                    {facility.facilityType}
                  </Badge>
                </div>
                <span className="text-xl">📍</span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600">
                <p className="line-clamp-2">🏠 {facility.address}</p>
                <p className="font-medium text-slate-800">
                  📍 Zone: {facility.zone || "Nagpur Urban"}
                </p>
                {facility.contactNumber && (
                  <p>📞 Contact: {facility.contactNumber}</p>
                )}
                {facility.emergencyNumber && (
                  <p className="text-rose-600 font-bold">
                    🚨 Emergency: {facility.emergencyNumber}
                  </p>
                )}
              </div>

              {facility.handlingCategories && facility.handlingCategories.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Coverage:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {facility.handlingCategories.map((cat) => (
                      <span
                        key={cat}
                        className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700 font-medium"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Worker Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="font-display font-black text-slate-900 text-base">
                  Add Field Worker to {dept.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Worker will be registered in TiDB database for dispatch and Google login
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddWorker} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
                  ⚠️ {formError}
                </div>
              )}
              {formSuccess && (
                <div className="p-3 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl">
                  ✓ {formSuccess}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Worker Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Deshmukh"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Google Email ID *{" "}
                  <span className="text-[11px] font-normal text-slate-400">
                    (Used to log into Field Worker Dashboard)
                  </span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. ramesh.nagpur.worker@gmail.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-accent font-mono text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Contact Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98230 12345"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Municipal Zone *
                  </label>
                  <select
                    value={formData.zone}
                    onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-accent"
                  >
                    {currentZones.map((z) => (
                      <option key={z} value={z}>
                        {z}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Designation / Squad Role
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Pothole Patching Crew Lead"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Assigned Vehicle / Squad Unit
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. NMC Crane MH-31-AP-1022"
                    value={formData.vehicle}
                    onChange={(e) => setFormData({ ...formData, vehicle: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-accent hover:bg-accent-hover disabled:opacity-50 rounded-xl transition-colors shadow-xs cursor-pointer"
                >
                  {submitting ? "Adding Worker..." : "Add to Department Database"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
