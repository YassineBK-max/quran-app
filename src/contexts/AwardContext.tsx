"use client";
import { createContext, useContext, ReactNode, useCallback, useEffect, useState } from "react";
import { Award } from "@/lib/types";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useAuth } from "./AuthContext";
import { useMemorization } from "./MemorizationContext";
import { getHizbNumber, getHizbName } from "@/data/hizb";

interface AwardContextType {
  pendingAward: Award | null;
  dismissAward: () => void;
  earnedAwardIds: string[];
}

const AwardCtx = createContext<AwardContextType>({
  pendingAward: null,
  dismissAward: () => {},
  earnedAwardIds: [],
});

export function AwardProvider({ children, surahTotals }: { children: ReactNode; surahTotals: Record<number, number> }) {
  const { user } = useAuth();
  const { getAllMemorized, getMemorizedCount } = useMemorization();
  const [earnedAwardIds, setEarnedAwardIds] = useLocalStorage<string[]>(
    `quran-awards-${user?.id ?? "guest"}`,
    []
  );
  const [pendingAward, setPendingAward] = useState<Award | null>(null);

  const dismissAward = useCallback(() => setPendingAward(null), []);

  const grantAward = useCallback(
    (id: string, message: string, type: Award["type"]) => {
      if (earnedAwardIds.includes(id)) return;
      setEarnedAwardIds((prev) => [...prev, id]);
      setPendingAward({ id, type, message, earnedAt: Date.now() });
    },
    [earnedAwardIds, setEarnedAwardIds]
  );

  useEffect(() => {
    if (user?.role === "student") return; // only award the one marking (teacher/guest)

    const all = getAllMemorized();
    const total = all.length;

    // First page (~15 ayahs)
    if (total >= 15) {
      grantAward("first_page", "Congrats! You finished your first page!", "first_page");
    }

    // First surah
    for (const [surahNumStr, count] of Object.entries(surahTotals)) {
      const surahNum = Number(surahNumStr);
      const memorized = getMemorizedCount(surahNum);
      if (memorized >= count && count > 0) {
        grantAward(`first_surah_${surahNum}`, `Congrats! You finished your first surah!`, "first_surah");
        break; // only once
      }
    }

    // Hizb milestones (approximate: each hizb ≈ 104 ayahs)
    const hizbMemo: Record<number, number> = {};
    all.forEach((a) => {
      if (!a.hq) return;
      const h = getHizbNumber(a.hq);
      hizbMemo[h] = (hizbMemo[h] ?? 0) + 1;
    });

    for (const [hizbStr, count] of Object.entries(hizbMemo)) {
      const h = Number(hizbStr);
      const name = getHizbName(h);
      if (count >= 26) grantAward(`hizb_q_${h}`, `Excellent! You memorized a quarter of ${name}! Keep going!`, "hizb_quarter");
      if (count >= 52) grantAward(`hizb_h_${h}`, `Excellent! You memorized half of ${name}! Keep going!`, "hizb_half");
      if (count >= 78) grantAward(`hizb_3q_${h}`, `Excellent! You memorized three quarters of ${name}! Keep going!`, "hizb_three_quarters");
      if (count >= 104) grantAward(`hizb_c_${h}`, `Excellent! You finished ${name}!`, "hizb_complete");
    }

    // Full Quran (6236 ayahs)
    if (total >= 6236) {
      grantAward("quran_complete", "Congratulations! You finished all Quran ma sha' Allah! There's nothing left for you to learn.", "quran_complete");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getAllMemorized, getMemorizedCount]);

  return (
    <AwardCtx.Provider value={{ pendingAward, dismissAward, earnedAwardIds }}>
      {children}
    </AwardCtx.Provider>
  );
}

export const useAwards = () => useContext(AwardCtx);
