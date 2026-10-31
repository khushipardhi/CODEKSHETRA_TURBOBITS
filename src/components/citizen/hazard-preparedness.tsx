/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Citizen Hazard Preparedness & Checklists
   Context-sensitive checklists for monsoons, heat waves, and severe weather.
   ════════════════════════════════════════════════════════ */

"use client";

import React, { useState, useEffect } from "react";
import { useCityContext } from "@/components/providers/city-provider";

interface ChecklistItem {
  id: string;
  label: string;
  detail: string;
}

const PREPAREDNESS_GUIDES: Record<
  string,
  {
    title: string;
    icon: string;
    description: string;
    items: ChecklistItem[];
  }
> = {
  monsoon: {
    title: "Monsoon & Urban Flood Preparedness",
    icon: "🌧️",
    description: "Steps to protect family, home, and commute before and during heavy cloudbursts.",
    items: [
      {
        id: "m1",
        label: "Clear Building Drainage & Rooftop Outlets",
        detail: "Ensure balcony drains and building compound gratings are free of plastic debris.",
      },
      {
        id: "m2",
        label: "Check Tidal Surge & Waterlogging Hotspots",
        detail: "Review local depression basins before traveling during high tide windows.",
      },
      {
        id: "m3",
        label: "Prepare 72h Emergency Dry Kit",
        detail: "Pack portable power bank, waterproof pouch for IDs, flashlight, and 2L drinking water.",
      },
      {
        id: "m4",
        label: "Keep Municipal Emergency Numbers Saved",
        detail: "Save city disaster control room helpline on mobile quick-dial.",
      },
    ],
  },
  heatwave: {
    title: "Extreme Heat & High Temperature Safety",
    icon: "☀️",
    description: "Guidance to prevent dehydration and heat-related exhaustion during peak hours.",
    items: [
      {
        id: "h1",
        label: "Carry Hydration & Oral Electrolytes",
        detail: "Drink water every 30 minutes even if not thirsty; avoid caffeinated drinks in the sun.",
      },
      {
        id: "h2",
        label: "Limit Strenuous Outdoor Activity (12 PM - 3:30 PM)",
        detail: "Reschedule heavy physical tasks to early morning or post-sunset hours.",
      },
      {
        id: "h3",
        label: "Wear Light-Colored, Loose Cotton Fabrics",
        detail: "Protect head with an umbrella, hat, or damp cloth while outdoors.",
      },
      {
        id: "h4",
        label: "Check on Elderly Neighbors & Pets",
        detail: "Ensure living quarters have cross-ventilation and access to cool drinking water.",
      },
    ],
  },
  airquality: {
    title: "Air Quality & Particulate Smog Advisory",
    icon: "🌿",
    description: "Precautions during elevated AQI, dust storms, or localized haze conditions.",
    items: [
      {
        id: "a1",
        label: "Use N95 / FFP2 Respirator Outdoors",
        detail: "Standard cloth masks do not filter fine PM2.5 particulates during unhealthy AQI.",
      },
      {
        id: "a2",
        label: "Keep Windows Closed During Peak Traffic Hours",
        detail: "Prevent outdoor roadside soot from entering indoor living rooms.",
      },
      {
        id: "a3",
        label: "Avoid Burning Dry Leaves or Waste",
        detail: "Report localized garbage burning directly to municipal solid waste dispatch.",
      },
    ],
  },
};

export function HazardPreparedness() {
  const { city, cityConfig } = useCityContext();

  // Pick default tab based on city characteristics
  const defaultTab = city === "nagpur" ? "heatwave" : "monsoon";
  const [activeTab, setActiveTab] = useState<string>(defaultTab);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setActiveTab(city === "nagpur" ? "heatwave" : "monsoon");
    try {
      const saved = localStorage.getItem(`sentinel_prep_${city}`);
      if (saved) setCheckedItems(JSON.parse(saved));
    } catch {}
  }, [city]);

  const toggleItem = (id: string) => {
    setCheckedItems((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem(`sentinel_prep_${city}`, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const currentGuide = PREPAREDNESS_GUIDES[activeTab] || PREPAREDNESS_GUIDES.monsoon;

  return (
    <div className="bg-surface-0 border border-border/80 rounded-3xl p-5 md:p-6 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-text-primary tracking-tight flex items-center gap-2">
            <span>🛡️</span>
            <span>Citizen Preparedness Checklists</span>
          </h2>
          <p className="text-xs text-text-tertiary mt-0.5">
            Practical measures to safeguard your family and property during seasonal hazards
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface-1 border border-border self-start sm:self-auto">
          <button
            onClick={() => setActiveTab("monsoon")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === "monsoon"
                ? "bg-surface-0 text-text-primary shadow-2xs font-bold"
                : "text-text-tertiary hover:text-text-primary"
            }`}
          >
            🌧️ Rain & Flood
          </button>
          <button
            onClick={() => setActiveTab("heatwave")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === "heatwave"
                ? "bg-surface-0 text-text-primary shadow-2xs font-bold"
                : "text-text-tertiary hover:text-text-primary"
            }`}
          >
            ☀️ Extreme Heat
          </button>
          <button
            onClick={() => setActiveTab("airquality")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === "airquality"
                ? "bg-surface-0 text-text-primary shadow-2xs font-bold"
                : "text-text-tertiary hover:text-text-primary"
            }`}
          >
            🌿 Air Quality
          </button>
        </div>
      </div>

      {/* Guide Card */}
      <div className="p-4 rounded-2xl bg-surface-1/60 border border-border/50">
        <div className="flex items-center gap-2.5 mb-1.5">
          <span className="text-xl">{currentGuide.icon}</span>
          <h3 className="text-sm font-bold text-text-primary">{currentGuide.title}</h3>
        </div>
        <p className="text-xs text-text-tertiary mb-3.5 leading-relaxed">
          {currentGuide.description}
        </p>

        {/* Checkable Items */}
        <div className="space-y-2">
          {currentGuide.items.map((item) => {
            const isChecked = !!checkedItems[item.id];
            return (
              <label
                key={item.id}
                onClick={() => toggleItem(item.id)}
                className={`p-3 rounded-xl border flex items-start gap-3 transition-colors cursor-pointer select-none ${
                  isChecked
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-200"
                    : "bg-surface-0 border-border/60 hover:border-accent/30 text-text-primary"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => {}}
                  className="mt-0.5 rounded text-accent focus:ring-accent cursor-pointer"
                />
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-bold ${isChecked ? "line-through opacity-80" : ""}`}>
                    {item.label}
                  </p>
                  <p className="text-[11px] text-text-tertiary mt-0.5 leading-relaxed">
                    {item.detail}
                  </p>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Official Emergency Contact Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs">
        <div className="text-text-tertiary">
          Need immediate rescue or civic assistance in {cityConfig.name}?
        </div>
        <a
          href={`tel:${cityConfig.hazardCapabilities.emergencyHelpline}`}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 font-bold hover:bg-rose-500/25 transition-colors"
        >
          <span>📞 {cityConfig.municipalAbbr} Disaster Helpline:</span>
          <span>{cityConfig.hazardCapabilities.emergencyHelpline}</span>
        </a>
      </div>
    </div>
  );
}
