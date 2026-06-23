"use client";
import { useSettings } from "@/contexts/SettingsContext";
import { DisplayMode } from "@/lib/types";

export function DisplayModeToggle() {
  const { settings, updateSettings } = useSettings();

  const setMode = (mode: DisplayMode) => updateSettings({ displayMode: mode });

  return (
    <div className="flex bg-muted rounded-lg p-1 gap-1">
      <button
        onClick={() => setMode("mushaf")}
        className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-colors ${
          settings.displayMode === "mushaf" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
        }`}
      >
        Mushaf
      </button>
      <button
        onClick={() => setMode("ayah-per-line")}
        className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-colors ${
          settings.displayMode === "ayah-per-line" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
        }`}
      >
        Line by Line
      </button>
    </div>
  );
}
