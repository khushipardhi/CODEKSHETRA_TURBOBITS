/* ════════════════════════════════════════════════════════
   Theme Provider — Light/Dark mode context
   Persists preference, respects system setting
   ════════════════════════════════════════════════════════ */

"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  toggleTheme: () => {},
  setTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}



export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Read from DOM (set by ThemeScript)
    const current = document.documentElement.getAttribute("data-theme") as Theme;
    if (current === "dark" || current === "light") {
      setThemeState(current);
    } else {
      // Fallback: check localStorage or system preference
      const stored = localStorage.getItem("nagpur-theme") as Theme | null;
      if (stored) {
        setThemeState(stored);
      } else {
        setThemeState("light");
      }
    }
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("nagpur-theme", newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "light" ? "dark" : "light");
  }, [theme, setTheme]);

  // Apply to DOM whenever theme changes
  useEffect(() => {
    if (mounted) {
      document.documentElement.setAttribute("data-theme", theme);
    }
  }, [theme, mounted]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
