"use client";
import { useSettings } from "@/contexts/SettingsContext";
import { DisplayMode } from "@/lib/types";
import { useT } from "@/hooks/useT";

export function DisplayModeToggle() {
  const { settings, updateSettings } = useSettings();
  const t = useT();

  const setMode = (mode: DisplayMode) => updateSettings({ displayMode: mode });

  return (
    <div className="flex bg-muted rounded-lg p-1 gap-1">
      <button
        onClick={() => setMode("mushaf")}
        className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-colors ${
          settings.displayMode === "mushaf" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
        }`}
      >
        {t.surah_mushaf}
      </button>
      <button
        onClick={() => setMode("ayah-per-line")}
        className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-colors ${
          settings.displayMode === "ayah-per-line" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
        }`}
      >
        {t.surah_line}
      </button>
    </div>
  );
}
