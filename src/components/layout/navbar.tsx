"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { MenuIcon, XIcon, ShieldIcon } from "@/components/ui/icons";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { CITIES, DEFAULT_CITY } from "@/lib/city-context";
import { BRANDING } from "@/config/branding";

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentCity, setCurrentCity] = useState(DEFAULT_CITY);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const parts = window.location.pathname.split("/").filter(Boolean);
      if (parts.length > 0 && CITIES[parts[0]]) {
        setCurrentCity(parts[0]);
      } else {
        const stored = localStorage.getItem("urban_link_city") || DEFAULT_CITY;
        if (CITIES[stored]) setCurrentCity(stored);
      }
    }
  }, []);

  const navLinks = [
    { href: `/${currentCity}/dashboard`, label: BRANDING.modules.citizen },
    { href: `/${currentCity}/report`, label: BRANDING.modules.civicReports },
    { href: "/track", label: "Track Report" },
    { href: "/emergency", label: "Emergency" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-[var(--z-sticky)]">
      <nav className="glass border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-xl overflow-hidden flex items-center justify-center border border-border/50 shadow-xs bg-surface-1">
                <img src={BRANDING.assets.logo} alt={BRANDING.name} className="w-full h-full object-contain rounded-xl" />
              </div>
              <span className="text-base font-bold text-text-primary tracking-tight group-hover:text-accent transition-colors">
                {BRANDING.name}
              </span>
            </Link>

            {/* Desktop Links */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`
                    px-4 py-2 text-sm font-medium rounded-pill
                    text-text-secondary hover:text-text-primary
                    hover:bg-surface-1 transition-all duration-[var(--transition-fast)]
                    ${link.href === "/emergency" ? "text-critical hover:text-critical hover:bg-critical-bg" : ""}
                  `}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Auth Actions */}
            <div className="hidden md:flex items-center gap-2">
              <ThemeToggle />
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="px-5 py-2 text-sm font-medium bg-text-primary text-canvas rounded-pill hover:bg-[#d8d8db] transition-colors"
              >
                Get Started
              </Link>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden p-2 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface-1 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <XIcon size={22} /> : <MenuIcon size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border bg-surface-0 slide-up">
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`
                    block px-4 py-3 text-sm font-medium rounded-lg
                    text-text-secondary hover:text-text-primary hover:bg-surface-1
                    transition-colors
                    ${link.href === "/emergency" ? "text-critical" : ""}
                  `}
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-3 border-t border-divider space-y-2">
                <Link
                  href="/login"
                  className="block px-4 py-3 text-sm font-medium text-text-secondary hover:text-text-primary rounded-lg hover:bg-surface-1 transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="block px-4 py-3 text-sm font-medium bg-text-primary text-canvas rounded-lg text-center hover:bg-[#d8d8db] transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-7 h-7 rounded-lg overflow-hidden flex items-center justify-center border border-border/50 bg-surface-1">
                <img src={BRANDING.assets.logo} alt={BRANDING.name} className="w-full h-full object-contain rounded-lg" />
              </div>
              <span className="text-sm font-bold">{BRANDING.name}</span>
            </div>
            <p className="text-sm text-text-tertiary max-w-sm">
              {BRANDING.description}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">
              Platform
            </h4>
            <ul className="space-y-2">
              {[
                { href: "/report", label: "Civic Reports" },
                { href: "/track", label: "Track Report" },
                { href: "/emergency", label: "Emergency Help" },
              ].map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-text-secondary hover:text-text-primary transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Portal Links */}
          <div>
            <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">
              Portals
            </h4>
            <ul className="space-y-2">
              {[
                { href: "/login", label: "Citizen Login" },
                { href: "/admin", label: "Command Centre" },
                { href: "/department", label: "Department Portal" },
              ].map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-text-secondary hover:text-text-primary transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-divider flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-text-tertiary">
            {BRANDING.copyright}
          </p>
          <p className="text-xs text-text-tertiary">
            Municipal Corporation Operations
          </p>
        </div>
      </div>
    </footer>
  );
}
