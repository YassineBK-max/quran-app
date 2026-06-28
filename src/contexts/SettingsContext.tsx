"use client";
import { createContext, useContext, useEffect, ReactNode } from "react";
import { AppSettings, ThemeMode } from "@/lib/types";
import { DEFAULT_SETTINGS } from "@/lib/constants";
import { useLocalStorage } from "@/hooks/useLocalStorage";

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings>) => void;
}

const SettingsContext = createContext<SettingsContextType>({
  settings: DEFAULT_SETTINGS,
  updateSettings: () => {},
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useLocalStorage<AppSettings>("quran-app-settings", DEFAULT_SETTINGS);

  const updateSettings = (partial: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  };

  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = (theme: ThemeMode) => {
      if (theme === "dark") {
        root.classList.add("dark");
      } else if (theme === "light") {
        root.classList.remove("dark");
      } else {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        root.classList.toggle("dark", prefersDark);
      }
    };

    applyTheme(settings.theme);

    if (settings.theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = (e: MediaQueryListEvent) => root.classList.toggle("dark", e.matches);
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, [settings.theme]);

  // Sync RTL direction and lang attribute when language changes
  useEffect(() => {
    const root = document.documentElement;
    const isAr = settings.language === "ar";
    root.dir = isAr ? "rtl" : "ltr";
    root.lang = isAr ? "ar" : "en";
  }, [settings.language]);

  // Apply color theme
  useEffect(() => {
    const root = document.documentElement;
    const ALL_THEMES = ["theme-futuristic", "theme-glass", "theme-simple", "theme-8bit"];
    ALL_THEMES.forEach((c) => root.classList.remove(c));
    const ct = settings.colorTheme ?? "classic";
    if (ct !== "classic") root.classList.add(`theme-${ct}`);
  }, [settings.colorTheme]);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
