"use client";
import { createContext, useContext, ReactNode } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";

export type ViewMode = "mobile" | "desktop";

interface ViewModeContextType {
  mode: ViewMode;
  toggle: () => void;
}

const Ctx = createContext<ViewModeContextType>({ mode: "mobile", toggle: () => {} });

export function ViewModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useLocalStorage<ViewMode>("quran-view-mode", "mobile");
  const toggle = () => setMode((m) => (m === "mobile" ? "desktop" : "mobile"));
  return <Ctx.Provider value={{ mode, toggle }}>{children}</Ctx.Provider>;
}

export const useViewMode = () => useContext(Ctx);
