"use client";
import { createContext, useContext, ReactNode, useCallback, useState } from "react";
import { MemorizedAyah } from "@/lib/types";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useAuth } from "./AuthContext";

type MemorizationData = Record<number, MemorizedAyah[]>;

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

function readFromStorage(key: string): MemorizationData {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(key) ?? "{}") as MemorizationData;
  } catch {
    return {};
  }
}

function writeToStorage(key: string, data: MemorizationData) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {}
}

export function MemorizationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? "guest";

  const [data, setData] = useLocalStorage<MemorizationData>(`quran-memorization-${userId}`, {});
  const [studentId, setStudentId] = useState<string | null>(null);

  // Teacher viewing a student: read/write that student's data directly from localStorage
  const isViewingStudent = user?.role === "teacher" && studentId != null;
  const studentStorageKey = `quran-memorization-${studentId ?? ""}`;

  const getActiveData = useCallback((): MemorizationData => {
    if (isViewingStudent) return readFromStorage(studentStorageKey);
    return data;
  }, [isViewingStudent, studentStorageKey, data]);

  const canToggle = user?.role !== "student";

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

      if (isViewingStudent) {
        const prev = readFromStorage(studentStorageKey);
        const raw = (prev[surahNumber] ?? []) as (MemorizedAyah | number)[];
        const current = normalize(raw);
        const alreadyMemorized = current.some((a) => a.ns === ayah.numberInSurah);
        const updated: MemorizationData = {
          ...prev,
          [surahNumber]: alreadyMemorized
            ? current.filter((a) => a.ns !== ayah.numberInSurah)
            : [...current, { ns: ayah.numberInSurah, hq: ayah.hizbQuarter, pg: ayah.page }],
        };
        writeToStorage(studentStorageKey, updated);
      } else {
        setData((prev) => {
          const raw = (prev[surahNumber] ?? []) as (MemorizedAyah | number)[];
          const current = normalize(raw);
          const alreadyMemorized = current.some((a) => a.ns === ayah.numberInSurah);
          return {
            ...prev,
            [surahNumber]: alreadyMemorized
              ? current.filter((a) => a.ns !== ayah.numberInSurah)
              : [...current, { ns: ayah.numberInSurah, hq: ayah.hizbQuarter, pg: ayah.page }],
          };
        });
      }
    },
    [canToggle, isViewingStudent, studentStorageKey, setData]
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
