"use client";
import { SurahInfo } from "@/lib/types";
import { usePinnedSurahs } from "@/contexts/PinnedSurahsContext";
import { SurahCard } from "./SurahCard";
import { useT } from "@/hooks/useT";

export function SurahList({ surahs }: { surahs: SurahInfo[] }) {
  const { pinnedSurahs } = usePinnedSurahs();
  const t = useT();

  const pinned = surahs.filter((s) => pinnedSurahs.includes(s.number));
  const rest = surahs.filter((s) => !pinnedSurahs.includes(s.number));

  return (
    <div className="space-y-2">
      {pinned.length > 0 && (
        <>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1 pt-2">
            {t.surahs_pinned}
          </h2>
          {pinned.map((s) => (
            <SurahCard key={s.number} surah={s} />
          ))}
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1 pt-4">
            {t.surahs_all}
          </h2>
        </>
      )}
      {rest.map((s) => (
        <SurahCard key={s.number} surah={s} />
      ))}
    </div>
  );
}
