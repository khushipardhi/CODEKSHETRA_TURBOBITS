/* ════════════════════════════════════════════════════════
   City Selector — Modal + Inline Badge
   Shown on first visit or when clicking the city badge.
   Matches existing design language (surface tokens, borders,
   rounded-card, accent, transitions).
   ════════════════════════════════════════════════════════ */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  CITIES,
  getSelectedCityId,
  setSelectedCityId,
  hasCitySelected,
  type CityConfig,
} from "@/lib/city-context";

/* ─── City Selector Modal ────────────────────────────── */

interface CitySelectorModalProps {
  open: boolean;
  onSelect: (cityId: string) => void;
  /** If true, user can close without selecting (for switching). If false, must select. */
  dismissible?: boolean;
  onClose?: () => void;
}

export function CitySelectorModal({
  open,
  onSelect,
  dismissible = false,
  onClose,
}: CitySelectorModalProps) {
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const currentCity = getSelectedCityId();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!open || !mounted) return null;

  const cities = Object.values(CITIES);

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Select your city"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-md"
        onClick={dismissible ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-surface-0 border border-border rounded-3xl shadow-2xl overflow-hidden animate-scaleUp my-auto">
        {/* Header */}
        <div className="px-6 pt-8 pb-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-muted border border-[rgba(77,140,245,0.15)] mb-4">
            <span className="text-sm">🛡️</span>
            <span className="text-xs font-bold text-accent">Sentinel</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-text-primary mb-1">
            Select Your City
          </h2>
          <p className="text-sm text-text-tertiary">
            Choose the city you&apos;re reporting from
          </p>
        </div>

        {/* City Cards */}
        <div className="px-6 pb-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {cities.map((city) => {
            const isSelected = city.id === currentCity && dismissible;
            const isHovered = hoveredCity === city.id;

            return (
              <button
                key={city.id}
                onClick={() => onSelect(city.id)}
                onMouseEnter={() => setHoveredCity(city.id)}
                onMouseLeave={() => setHoveredCity(null)}
                className={`
                  relative flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all duration-200 cursor-pointer
                  active:scale-[0.97]
                  ${
                    isSelected
                      ? "border-accent bg-accent/5 shadow-md"
                      : isHovered
                      ? "border-border-hover bg-surface-1 shadow-md -translate-y-0.5"
                      : "border-border bg-surface-0 hover:bg-surface-1"
                  }
                `}
              >
                {/* City emoji */}
                <span className="text-4xl">{city.emoji}</span>

                {/* City name */}
                <div className="text-center">
                  <span className="text-base font-bold text-text-primary block">
                    {city.name}
                  </span>
                  <span className="text-xs text-text-tertiary">
                    {city.state}
                  </span>
                </div>

                {/* Municipal body */}
                <span className="text-[10px] text-text-tertiary font-medium px-2 py-0.5 rounded-full bg-surface-2">
                  {city.municipalAbbr}
                </span>

                {/* Selected indicator */}
                {isSelected && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Dismiss button (only when switching) */}
        {dismissible && onClose && (
          <div className="px-6 pb-6 text-center">
            <button
              onClick={onClose}
              className="text-xs text-text-tertiary hover:text-text-secondary transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes scaleUp {
          from {
            opacity: 0;
            transform: scale(0.92);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-scaleUp {
          animation: scaleUp 0.25s ease-out;
        }
      `}</style>
    </div>,
    document.body
  );
}

/* ─── City Badge (for headers) ───────────────────────── */

interface CityBadgeProps {
  onClick?: () => void;
  className?: string;
  activeCity?: string;
}

export function CityBadge({ onClick, className = "", activeCity }: CityBadgeProps) {
  const [cityId, setCityId] = useState<string>(activeCity || "nagpur");

  useEffect(() => {
    if (activeCity) {
      setCityId(activeCity);
    } else {
      // Check URL first if available
      if (typeof window !== "undefined") {
        const parts = window.location.pathname.split("/").filter(Boolean);
        if (parts.length > 0 && CITIES[parts[0]]) {
          setCityId(parts[0]);
          return;
        }
        if (parts.length > 1 && (parts[0] === "admin" || parts[0] === "department") && CITIES[parts[1]]) {
          setCityId(parts[1]);
          return;
        }
      }
      setCityId(getSelectedCityId() || "nagpur");
    }
  }, [activeCity]);

  const city = CITIES[cityId] || CITIES.nagpur;

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-1 border border-border text-xs font-medium text-text-secondary hover:bg-surface-2 hover:border-border-hover transition-all cursor-pointer ${className}`}
      title="Change city"
    >
      <span className="text-sm">{city.emoji}</span>
      <span>{city.name}</span>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-50">
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>
  );
}

/* ─── Hook: City Gate ────────────────────────────────── */

/**
 * Hook that gates the app behind city selection.
 * Returns { showSelector, selectedCity, openSelector, handleSelect }.
 */
export function useCityGate() {
  const [showSelector, setShowSelector] = useState(false);
  const [selectedCity, setSelectedCity] = useState<CityConfig | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Detect city from URL path if present
    if (typeof window !== "undefined") {
      const parts = window.location.pathname.split("/").filter(Boolean);
      if (parts.length > 0 && CITIES[parts[0]]) {
        setSelectedCity(CITIES[parts[0]]);
        setSelectedCityId(parts[0]);
        setChecked(true);
        return;
      }
      if (parts.length > 1 && (parts[0] === "admin" || parts[0] === "department") && CITIES[parts[1]]) {
        setSelectedCity(CITIES[parts[1]]);
        setSelectedCityId(parts[1]);
        setChecked(true);
        return;
      }
    }

    if (hasCitySelected()) {
      const id = getSelectedCityId();
      setSelectedCity(id && CITIES[id] ? CITIES[id] : null);
    } else {
      setShowSelector(true);
    }
    setChecked(true);
  }, []);

  const handleSelect = useCallback((cityId: string) => {
    setSelectedCityId(cityId);
    setSelectedCity(CITIES[cityId] || null);
    setShowSelector(false);

    // If on a city-scoped route, seamlessly navigate to the new city!
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      const parts = path.split("/").filter(Boolean);

      // Citizen route: /[city]/...
      if (parts.length > 0 && CITIES[parts[0]]) {
        parts[0] = cityId;
        window.location.href = "/" + parts.join("/");
        return;
      }
      // Admin route: /admin/[city]/...
      if (parts.length > 1 && parts[0] === "admin" && CITIES[parts[1]]) {
        parts[1] = cityId;
        window.location.href = "/" + parts.join("/");
        return;
      }
      // Department route: /department/[city]/...
      if (parts.length > 1 && parts[0] === "department" && CITIES[parts[1]]) {
        parts[1] = cityId;
        window.location.href = "/" + parts.join("/");
        return;
      }

      // Default navigate to the new city citizen dashboard
      window.location.href = `/${cityId}/dashboard`;
    }
  }, []);

  const openSelector = useCallback(() => {
    setShowSelector(true);
  }, []);

  const closeSelector = useCallback(() => {
    setShowSelector(false);
  }, []);

  return {
    showSelector,
    selectedCity,
    checked,
    openSelector,
    closeSelector,
    handleSelect,
  };
}
