"use client";
import { useViewMode } from "@/contexts/ViewModeContext";

export function ViewModeToggle() {
  const { mode, toggle } = useViewMode();
  return (
    <button
      onClick={toggle}
      title={mode === "mobile" ? "Switch to desktop mode" : "Switch to mobile mode"}
      aria-label={mode === "mobile" ? "Switch to desktop mode" : "Switch to mobile mode"}
      className="fixed bottom-20 right-4 z-50 w-12 h-12 rounded-full bg-card border border-border shadow-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
    >
      {mode === "mobile" ? (
        /* Monitor icon – switch to desktop */
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <path d="M8 21h8M12 17v4" />
        </svg>
      ) : (
        /* Smartphone icon – switch to mobile */
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="2" width="14" height="20" rx="2" />
          <path d="M12 18h.01" />
        </svg>
      )}
    </button>
  );
}
