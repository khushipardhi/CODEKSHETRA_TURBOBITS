/* ════════════════════════════════════════════════════════
   CityProvider — React context for city-scoped pages.
   Reads city from URL params (NOT localStorage).
   
   Usage:
     // In a layout under /[city]/ route
     <CityProvider city={params.city}>
       {children}
     </CityProvider>
   
     // In any child component
     const { city, cityConfig } = useCityContext();
   ════════════════════════════════════════════════════════ */

"use client";

import React, { createContext, useContext, useMemo } from "react";
import { CITIES, DEFAULT_CITY, type CityConfig } from "@/lib/city-context";

interface CityContextValue {
  /** City slug from URL: "nagpur" | "pune" | "mumbai" */
  city: string;
  /** Full city configuration */
  cityConfig: CityConfig;
}

const CityContext = createContext<CityContextValue>({
  city: DEFAULT_CITY,
  cityConfig: CITIES[DEFAULT_CITY],
});

interface CityProviderProps {
  city: string;
  children: React.ReactNode;
}

export function CityProvider({ city, children }: CityProviderProps) {
  const value = useMemo<CityContextValue>(() => {
    const config = CITIES[city] || CITIES[DEFAULT_CITY];
    return {
      city: config.id,
      cityConfig: config,
    };
  }, [city]);

  return (
    <CityContext.Provider value={value}>
      {children}
    </CityContext.Provider>
  );
}

/**
 * Hook to access the current city context.
 * MUST be used inside a <CityProvider>.
 * Returns { city, cityConfig }.
 */
export function useCityContext(): CityContextValue {
  const ctx = useContext(CityContext);
  if (!ctx) {
    throw new Error("useCityContext must be used within a CityProvider");
  }
  return ctx;
}
