"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type ViewMode = "mobile" | "desktop";

const DESKTOP_QUERY = "(min-width: 768px)";

const Ctx = createContext<ViewMode>("mobile");

export function ViewModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ViewMode>("mobile");

  useEffect(() => {
    const mql = window.matchMedia(DESKTOP_QUERY);
    const update = () => setMode(mql.matches ? "desktop" : "mobile");
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  return <Ctx.Provider value={mode}>{children}</Ctx.Provider>;
}

export const useViewMode = () => ({ mode: useContext(Ctx) });
