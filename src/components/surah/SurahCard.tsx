"use client";
import Link from "next/link";
import { SurahInfo } from "@/lib/types";
import { usePinnedSurahs } from "@/contexts/PinnedSurahsContext";

export function SurahCard({ surah }: { surah: SurahInfo }) {
  const { isPinned, togglePin } = usePinnedSurahs();
  const pinned = isPinned(surah.number);

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors">
      <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold shrink-0">
        {surah.number}
      </div>
      <Link href={`/surah/${surah.number}`} className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{surah.englishName}</p>
            <p className="text-xs text-muted-foreground truncate">{surah.englishNameTranslation}</p>
          </div>
          <div className="text-right shrink-0 ml-3">
            <p className="font-arabic text-lg leading-tight">{surah.name}</p>
            <p className="text-[10px] text-muted-foreground">{surah.numberOfAyahs} ayahs &middot; {surah.revelationType}</p>
          </div>
        </div>
      </Link>
      <button
        onClick={(e) => { e.preventDefault(); togglePin(surah.number); }}
        className={`p-1.5 rounded-lg transition-colors shrink-0 ${pinned ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill={pinned ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
        </svg>
      </button>
    </div>
  );
}
