"use client";
import { createContext, useContext, ReactNode, useCallback, useState } from "react";
import { MemorizedAyah } from "@/lib/types";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useAuth } from "./AuthContext";

type MemorizationData = Record<number, MemorizedAyah[]>;

// Single shared key holds ALL users' progress: { [userId]: MemorizationData }
const SHARED_KEY = "quran-memorization-all-users";

interface MemorizationContextType {
  isMemorized: (surahNumber: number, numberInSurah: number) => boolean;
  toggleMemorized: (surahNumber: number, ayah: { numberInSurah: number; hizbQuarter: number; page: number }) => void;
  getProgress: (surahNumber: number, totalAyahs: number) => number;
  getMemorizedCount: (surahNumber: number) => number;
  getAllMemorized: () => MemorizedAyah[];
  canToggle: boolean;
  studentId: string | null;
  setStudentId: (id: string | null) => void;
}

const MemorizationContext = createContext<MemorizationContextType>({
  isMemorized: () => false,
  toggleMemorized: () => {},
  getProgress: () => 0,
  getMemorizedCount: () => 0,
  getAllMemorized: () => [],
  canToggle: true,
  studentId: null,
  setStudentId: () => {},
});

function normalize(stored: (MemorizedAyah | number)[]): MemorizedAyah[] {
  return stored.map((item) =>
    typeof item === "number" ? { ns: item, hq: 0, pg: 0 } : item
  );
}

export function MemorizationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? "guest";

  // All users' data in one shared key: { userId: { surahNumber: MemorizedAyah[] } }
  const [allData, setAllData] = useLocalStorage<Record<string, MemorizationData>>(SHARED_KEY, {});
  const [studentId, setStudentId] = useState<string | null>(null);

  const isViewingStudent = (user?.role === "teacher" || user?.role === "admin") && studentId != null;
  const activeUserId = isViewingStudent ? (studentId ?? userId) : userId;

  const canToggle = user?.role !== "student";

  const getUserData = useCallback(
    (uid: string): MemorizationData => allData[uid] ?? {},
    [allData]
  );

  const getActiveData = useCallback(
    (): MemorizationData => getUserData(activeUserId),
    [getUserData, activeUserId]
  );

  const isMemorized = useCallback(
    (surahNumber: number, numberInSurah: number) => {
      const active = getActiveData();
      const entries = (active[surahNumber] ?? []) as (MemorizedAyah | number)[];
      return normalize(entries).some((a) => a.ns === numberInSurah);
    },
    [getActiveData]
  );

  const toggleMemorized = useCallback(
    (surahNumber: number, ayah: { numberInSurah: number; hizbQuarter: number; page: number }) => {
      if (!canToggle) return;

      setAllData((prev) => {
        const userPrev: MemorizationData = prev[activeUserId] ?? {};
        const raw = (userPrev[surahNumber] ?? []) as (MemorizedAyah | number)[];
        const current = normalize(raw);
        const alreadyMemorized = current.some((a) => a.ns === ayah.numberInSurah);
        const updated: MemorizationData = {
          ...userPrev,
          [surahNumber]: alreadyMemorized
            ? current.filter((a) => a.ns !== ayah.numberInSurah)
            : [...current, { ns: ayah.numberInSurah, hq: ayah.hizbQuarter, pg: ayah.page }],
        };
        return { ...prev, [activeUserId]: updated };
      });
    },
    [canToggle, activeUserId, setAllData]
  );

  const getMemorizedCount = useCallback(
    (surahNumber: number) => {
      const active = getActiveData();
      const raw = (active[surahNumber] ?? []) as (MemorizedAyah | number)[];
      return normalize(raw).length;
    },
    [getActiveData]
  );

  const getProgress = useCallback(
    (surahNumber: number, totalAyahs: number) => {
      if (totalAyahs === 0) return 0;
      return Math.round((getMemorizedCount(surahNumber) / totalAyahs) * 100);
    },
    [getMemorizedCount]
  );

  const getAllMemorized = useCallback((): MemorizedAyah[] => {
    const active = getActiveData();
    return Object.values(active).flatMap((entries) =>
      normalize((entries ?? []) as (MemorizedAyah | number)[])
    );
  }, [getActiveData]);

  return (
    <MemorizationContext.Provider
      value={{ isMemorized, toggleMemorized, getProgress, getMemorizedCount, getAllMemorized, canToggle, studentId, setStudentId }}
    >
      {children}
    </MemorizationContext.Provider>
  );
}

export const useMemorization = () => useContext(MemorizationContext);
