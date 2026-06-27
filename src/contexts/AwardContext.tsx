"use client";
import { createContext, useContext, ReactNode, useCallback, useEffect, useState } from "react";
import { Award } from "@/lib/types";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useAuth } from "./AuthContext";
import { useSettings } from "./SettingsContext";
import { useMemorization } from "./MemorizationContext";
import { getHizbNumber, getHizbName } from "@/data/hizb";
import { translations } from "@/lib/i18n";

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
  const { settings } = useSettings();
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
    if (user?.role === "student") return;

    const t = translations[settings.language];
    const all = getAllMemorized();
    const total = all.length;

    if (total >= 15) {
      grantAward("first_page", t.award_first_page, "first_page");
    }

    for (const [surahNumStr, count] of Object.entries(surahTotals)) {
      const surahNum = Number(surahNumStr);
      const memorized = getMemorizedCount(surahNum);
      if (memorized >= count && count > 0) {
        grantAward(`first_surah_${surahNum}`, t.award_first_surah, "first_surah");
        break;
      }
    }

    const hizbMemo: Record<number, number> = {};
    all.forEach((a) => {
      if (!a.hq) return;
      const h = getHizbNumber(a.hq);
      hizbMemo[h] = (hizbMemo[h] ?? 0) + 1;
    });

    for (const [hizbStr, count] of Object.entries(hizbMemo)) {
      const h = Number(hizbStr);
      const name = getHizbName(h);
      if (count >= 26) grantAward(`hizb_q_${h}`, `${t.award_hizb_quarter_prefix} ${name}${t.award_hizb_quarter_suffix}`, "hizb_quarter");
      if (count >= 52) grantAward(`hizb_h_${h}`, `${t.award_hizb_half_prefix} ${name}${t.award_hizb_half_suffix}`, "hizb_half");
      if (count >= 78) grantAward(`hizb_3q_${h}`, `${t.award_hizb_three_quarters_prefix} ${name}${t.award_hizb_three_quarters_suffix}`, "hizb_three_quarters");
      if (count >= 104) grantAward(`hizb_c_${h}`, `${t.award_hizb_complete_prefix} ${name}${t.award_hizb_complete_suffix}`, "hizb_complete");
    }

    if (total >= 6236) {
      grantAward("quran_complete", t.award_quran_complete, "quran_complete");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getAllMemorized, getMemorizedCount, settings.language]);

  return (
    <AwardCtx.Provider value={{ pendingAward, dismissAward, earnedAwardIds }}>
      {children}
    </AwardCtx.Provider>
  );
}

export const useAwards = () => useContext(AwardCtx);
