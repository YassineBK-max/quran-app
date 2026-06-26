"use client";
import { createContext, useContext, ReactNode, useCallback } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";

// surahNumber -> array of memorized numberInSurah values
type MemorizationData = Record<number, number[]>;

interface MemorizationContextType {
  isMemorized: (surahNumber: number, numberInSurah: number) => boolean;
  toggleMemorized: (surahNumber: number, numberInSurah: number) => void;
  getProgress: (surahNumber: number, totalAyahs: number) => number;
  getMemorizedCount: (surahNumber: number) => number;
}

const MemorizationContext = createContext<MemorizationContextType>({
  isMemorized: () => false,
  toggleMemorized: () => {},
  getProgress: () => 0,
  getMemorizedCount: () => 0,
});

export function MemorizationProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useLocalStorage<MemorizationData>("quran-memorization", {});

  const isMemorized = useCallback((surahNumber: number, numberInSurah: number) => {
    return data[surahNumber]?.includes(numberInSurah) ?? false;
  }, [data]);

  const toggleMemorized = useCallback((surahNumber: number, numberInSurah: number) => {
    setData((prev) => {
      const current = prev[surahNumber] ?? [];
      const alreadyMemorized = current.includes(numberInSurah);
      return {
        ...prev,
        [surahNumber]: alreadyMemorized
          ? current.filter((n) => n !== numberInSurah)
          : [...current, numberInSurah],
      };
    });
  }, [setData]);

  const getMemorizedCount = useCallback((surahNumber: number) => {
    return data[surahNumber]?.length ?? 0;
  }, [data]);

  const getProgress = useCallback((surahNumber: number, totalAyahs: number) => {
    if (totalAyahs === 0) return 0;
    return Math.round(((data[surahNumber]?.length ?? 0) / totalAyahs) * 100);
  }, [data]);

  return (
    <MemorizationContext.Provider value={{ isMemorized, toggleMemorized, getProgress, getMemorizedCount }}>
      {children}
    </MemorizationContext.Provider>
  );
}

export const useMemorization = () => useContext(MemorizationContext);
