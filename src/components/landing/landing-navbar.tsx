"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { BRANDING } from "@/config/branding";
import { CITIES, DEFAULT_CITY, getSelectedCityId } from "@/lib/city-context";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  ShieldIcon,
  MenuIcon,
  XIcon,
  MapIcon,
  ChartIcon,
  SparklesIcon,
  ArrowRightIcon,
  BuildingIcon,
} from "@/components/ui/icons";

interface LandingNavbarProps {
  onOpenCitySelector?: () => void;
  selectedCityId?: string;
}

export function LandingNavbar({ onOpenCitySelector, selectedCityId }: LandingNavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [cityId, setCityId] = useState(selectedCityId || DEFAULT_CITY);

  useEffect(() => {
    if (selectedCityId) {
      setCityId(selectedCityId);
      return;
    }
    const stored = getSelectedCityId();
    if (stored && CITIES[stored]) {
      setCityId(stored);
    }
  }, [selectedCityId]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const city = CITIES[cityId] || CITIES[DEFAULT_CITY];

  const navLinks = [
    { href: "#capabilities", label: "Capabilities" },
    { href: "#interactive-canvas", label: "Intelligence Canvas" },
    { href: "#simulation", label: "Simulation Lab" },
    { href: "#telemetry", label: "Telemetry" },
    { href: "#sentinel-ai", label: "Sentinel AI" },
    { href: "#workspaces", label: "Workspaces" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-surface-0/95 dark:bg-[#090d16]/95 backdrop-blur-md border-b border-border shadow-xs"
          : "bg-surface-0/80 dark:bg-[#090d16]/80 backdrop-blur-xs border-b border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Brand Logo & Name */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-xs group-hover:scale-105 transition-transform">
              <ShieldIcon size={20} className="text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm sm:text-base font-bold text-text-primary tracking-tight leading-tight">
                {BRANDING.name}
              </span>
              <span className="text-[10px] font-mono tracking-wider text-text-tertiary uppercase">
                Municipal Risk Intelligence
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-3 py-1.5 text-xs xl:text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-1 rounded-md transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Right Controls: City Selector + Theme + Workspaces */}
          <div className="hidden sm:flex items-center gap-2.5">
            {/* Active City Pill Button */}
            <button
              onClick={onOpenCitySelector}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-1 border border-border text-xs font-medium text-text-secondary hover:bg-surface-2 hover:border-border-hover transition-all cursor-pointer shadow-2xs"
              title="Switch City Context"
            >
              <span>{city.emoji}</span>
              <span className="font-semibold text-text-primary">{city.name}</span>
              <span className="text-[10px] text-text-tertiary">▼</span>
            </button>

            {/* Dark / Light Mode Switch */}
            <ThemeToggle />

            {/* Citizen Hub Link */}
            <Link
              href={`/${city.slug}/dashboard`}
              className="px-3.5 py-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary bg-surface-1 hover:bg-surface-2 border border-border rounded-lg transition-colors"
            >
              Citizen Hub
            </Link>

            {/* Admin Console Link */}
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-text-primary text-canvas rounded-lg hover:opacity-90 active:scale-95 transition-all shadow-xs"
            >
              <BuildingIcon size={14} />
              <span>Command Console</span>
            </Link>
          </div>

          {/* Mobile Actions & Menu Toggle */}
          <div className="flex sm:hidden items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-1 transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {mobileOpen ? <XIcon size={22} /> : <MenuIcon size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="sm:hidden border-t border-border bg-surface-0 dark:bg-[#090d16] px-4 py-4 space-y-3 shadow-xl slide-up">
          {/* City Context Bar */}
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-1 border border-border">
            <div className="flex items-center gap-2">
              <span className="text-lg">{city.emoji}</span>
              <div>
                <div className="text-xs font-bold text-text-primary">{city.name}</div>
                <div className="text-[10px] text-text-tertiary">{city.municipalBody}</div>
              </div>
            </div>
            <button
              onClick={() => {
                setMobileOpen(false);
                onOpenCitySelector?.();
              }}
              className="px-2.5 py-1 text-xs font-medium text-primary bg-primary/10 border border-primary/20 rounded-md"
            >
              Change
            </button>
          </div>

          {/* Section Jump Links */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="px-3 py-2 text-xs font-medium text-text-secondary hover:text-text-primary bg-surface-1 rounded-md"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Primary Action Buttons */}
          <div className="pt-2 space-y-2">
            <Link
              href={`/${city.slug}/dashboard`}
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-2.5 text-xs font-semibold bg-surface-2 text-text-primary rounded-lg border border-border"
            >
              <MapIcon size={16} />
              Open Citizen Dashboard
            </Link>
            <Link
              href="/admin"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-2.5 text-xs font-semibold bg-text-primary text-canvas rounded-lg shadow-sm"
            >
              <BuildingIcon size={16} />
              Admin Command Console
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
