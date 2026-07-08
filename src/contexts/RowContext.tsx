"use client";
import { createContext, useContext, ReactNode, useMemo } from "react";
import { useMemorization } from "./MemorizationContext";

export interface RowTier {
  row: number;
  nameAr: string;
  nameEn: string;
  minAyahs: number;
  maxAyahs: number | null;
  color: string;
  ring: string;   // border color class
  icon: string;   // emoji representing the tier
}

export const ROW_TIERS: RowTier[] = [
  { row: 1, nameAr: "المبتدئ",        nameEn: "Beginner",   minAyahs: 0,    maxAyahs: 14,   color: "#9ca3af", ring: "#9ca3af30", icon: "🌱" },
  { row: 2, nameAr: "الطالب",         nameEn: "Student",    minAyahs: 15,   maxAyahs: 49,   color: "#cd7f32", ring: "#cd7f3230", icon: "📖" },
  { row: 3, nameAr: "المجتهد",        nameEn: "Diligent",   minAyahs: 50,   maxAyahs: 149,  color: "#c0c0c0", ring: "#c0c0c030", icon: "✨" },
  { row: 4, nameAr: "الحافظ",         nameEn: "Memorizer",  minAyahs: 150,  maxAyahs: 299,  color: "#f59e0b", ring: "#f59e0b30", icon: "⭐" },
  { row: 5, nameAr: "المتقدم",        nameEn: "Advanced",   minAyahs: 300,  maxAyahs: 599,  color: "#22c55e", ring: "#22c55e30", icon: "🌟" },
  { row: 6, nameAr: "الحافظ الكامل",  nameEn: "Scholar",    minAyahs: 600,  maxAyahs: 6235, color: "#3b82f6", ring: "#3b82f630", icon: "💎" },
  { row: 7, nameAr: "الخاتم",         nameEn: "Complete",   minAyahs: 6236, maxAyahs: null, color: "#8b5cf6", ring: "#8b5cf630", icon: "🕋" },
];

export function getTierForCount(count: number): RowTier {
  for (let i = ROW_TIERS.length - 1; i >= 0; i--) {
    if (count >= ROW_TIERS[i].minAyahs) return ROW_TIERS[i];
  }
  return ROW_TIERS[0];
}

// Compute memorized count from raw stored data (used by admin without switching context)
export function countFromRawData(allData: Record<string, Record<number, unknown[]>>, userId: string): number {
  const ud = allData[userId] ?? {};
  return Object.values(ud).reduce((s, arr) => s + arr.length, 0);
}

interface RowContextType {
  count: number;
  currentTier: RowTier;
  nextTier: RowTier | null;
  progressToNext: number;   // 0-100
}

const RowCtx = createContext<RowContextType>({
  count: 0,
  currentTier: ROW_TIERS[0],
  nextTier: ROW_TIERS[1],
  progressToNext: 0,
});

export function RowProvider({ children }: { children: ReactNode }) {
  const { getAllMemorized } = useMemorization();
  const count = getAllMemorized().length;
  const currentTier = getTierForCount(count);
  const tierIndex = ROW_TIERS.indexOf(currentTier);
  const nextTier = tierIndex < ROW_TIERS.length - 1 ? ROW_TIERS[tierIndex + 1] : null;

  const progressToNext = useMemo(() => {
    if (!nextTier) return 100;
    const range = nextTier.minAyahs - currentTier.minAyahs;
    const done = count - currentTier.minAyahs;
    return Math.min(100, Math.round((done / range) * 100));
  }, [count, currentTier, nextTier]);

  return (
    <RowCtx.Provider value={{ count, currentTier, nextTier, progressToNext }}>
      {children}
    </RowCtx.Provider>
  );
}

export const useRow = () => useContext(RowCtx);
