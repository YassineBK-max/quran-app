"use client";
import { useSettings } from "@/contexts/SettingsContext";

export function LangToggle({ dark = false }: { dark?: boolean }) {
  const { settings, updateSettings } = useSettings();
  const isAr = settings.language === "ar";

  return (
    <button
      onClick={() => updateSettings({ language: isAr ? "en" : "ar" })}
      aria-label="Toggle language"
      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors min-w-[72px] justify-center ${
        dark
          ? "bg-white/15 text-white hover:bg-white/25 border border-white/20"
          : "bg-muted text-foreground hover:bg-muted/80 border border-border"
      }`}
    >
      <span>{isAr ? "EN" : "عر"}</span>
      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <circle cx="12" cy="12" r="10"/>
        <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
    </button>
  );
}
