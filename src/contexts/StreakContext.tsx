"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "./AuthContext";

interface StreakCtxType {
  streak: number;
  activeDates: string[]; // YYYY-MM-DD dates where the user opened the app
}

const Ctx = createContext<StreakCtxType>({ streak: 0, activeDates: [] });

function todayKey(): string {
  return new Date().toISOString().split("T")[0];
}
function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}
function cutoffKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 90); // keep last 90 days
  return d.toISOString().split("T")[0];
}

export function StreakProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const storageKey = `streak-${user?.id ?? "guest"}`;
  const [streak, setStreak] = useState(0);
  const [activeDates, setActiveDates] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      const { lastActive = "", count = 0, dates = [] } = raw ? JSON.parse(raw) : {};
      const today = todayKey();
      const yesterday = yesterdayKey();
      const cutoff = cutoffKey();

      let newCount: number = count;
      let newLastActive: string = lastActive;
      let newDates: string[] = (dates as string[]).filter((d) => d >= cutoff);

      if (lastActive === today) {
        // already recorded today — no changes
      } else if (lastActive === yesterday) {
        newCount = (count as number) + 1;
        newLastActive = today;
        if (!newDates.includes(today)) newDates = [...newDates, today];
      } else {
        newCount = 1;
        newLastActive = today;
        if (!newDates.includes(today)) newDates = [...newDates, today];
      }

      if (newLastActive !== lastActive || newDates.length !== (dates as string[]).length) {
        localStorage.setItem(storageKey, JSON.stringify({ lastActive: newLastActive, count: newCount, dates: newDates }));
      }

      setStreak(newCount);
      setActiveDates(newDates);
    } catch {
      const today = todayKey();
      setStreak(1);
      setActiveDates([today]);
    }
  }, [storageKey]);

  return <Ctx.Provider value={{ streak, activeDates }}>{children}</Ctx.Provider>;
}

export const useStreak = () => useContext(Ctx);
