"use client";
import { useEffect, useRef } from "react";
import { useRow } from "@/contexts/RowContext";
import { useAuth } from "@/contexts/AuthContext";

export interface Milestone {
  date: string;        // YYYY-MM-DD
  tierRow: number;
  tierName: string;
  tierIcon: string;
  ayahs: number;
}

export function getMilestones(userId: string): Milestone[] {
  try {
    return JSON.parse(localStorage.getItem(`milestones-${userId}`) ?? "[]");
  } catch { return []; }
}

function todayStr() { return new Date().toISOString().split("T")[0]; }

export function MilestoneTracker() {
  const { user } = useAuth();
  const { currentTier, count } = useRow();
  const prevTierRef = useRef<number | null>(null);

  useEffect(() => {
    if (!user) return;
    const tier = currentTier.row;
    if (prevTierRef.current === null) {
      prevTierRef.current = tier;
      return;
    }
    if (tier > prevTierRef.current) {
      const key = `milestones-${user.id}`;
      const existing = getMilestones(user.id);
      const today = todayStr();
      if (!existing.some((m) => m.tierRow === tier && m.date === today)) {
        existing.push({ date: today, tierRow: tier, tierName: currentTier.nameEn, tierIcon: currentTier.icon, ayahs: count });
        localStorage.setItem(key, JSON.stringify(existing));
      }
    }
    prevTierRef.current = tier;
  }, [currentTier.row, count, user, currentTier.nameEn, currentTier.icon]);

  return null;
}
