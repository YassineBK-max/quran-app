"use client";
import { createContext, useContext, ReactNode, useCallback } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";

interface PinnedSurahsContextType {
  pinnedSurahs: number[];
  togglePin: (surahNumber: number) => void;
  isPinned: (surahNumber: number) => boolean;
}

const PinnedSurahsContext = createContext<PinnedSurahsContextType>({
  pinnedSurahs: [],
  togglePin: () => {},
  isPinned: () => false,
});

export function PinnedSurahsProvider({ children }: { children: ReactNode }) {
  const [pinnedSurahs, setPinnedSurahs] = useLocalStorage<number[]>("quran-app-pinned", []);

  const togglePin = useCallback((surahNumber: number) => {
    setPinnedSurahs((prev) =>
      prev.includes(surahNumber) ? prev.filter((n) => n !== surahNumber) : [...prev, surahNumber]
    );
  }, [setPinnedSurahs]);

  const isPinned = useCallback((surahNumber: number) => pinnedSurahs.includes(surahNumber), [pinnedSurahs]);

  return (
    <PinnedSurahsContext.Provider value={{ pinnedSurahs, togglePin, isPinned }}>
      {children}
    </PinnedSurahsContext.Provider>
  );
}

export const usePinnedSurahs = () => useContext(PinnedSurahsContext);
