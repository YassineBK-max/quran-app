"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { SurahInfo } from "@/lib/types";
import { fetchAllSurahs } from "@/lib/api";
import { Header } from "@/components/layout/Header";
import { useMemorization } from "@/contexts/MemorizationContext";
import { usePinnedSurahs } from "@/contexts/PinnedSurahsContext";
import { SURAH_PAGES } from "@/lib/constants";
import { useT } from "@/hooks/useT";

export default function SurahsPage() {
  const t = useT();
  const [surahs, setSurahs] = useState<SurahInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [lastMushafPage] = useLocalStorage<number>("quran-mushaf-last-page", 1);
  const { getProgress, getMemorizedCount } = useMemorization();
  const { isPinned, togglePin } = usePinnedSurahs();

  useEffect(() => {
    fetchAllSurahs()
      .then(setSurahs)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = surahs.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.englishName.toLowerCase().includes(q) ||
      s.name.includes(search) ||
      String(s.number).includes(search) ||
      s.englishNameTranslation.toLowerCase().includes(q)
    );
  });

  const pinned = filtered.filter((s) => isPinned(s.number));
  const rest = filtered.filter((s) => !isPinned(s.number));

  const SurahRow = ({ surah }: { surah: SurahInfo }) => {
    const memorized = getMemorizedCount(surah.number);
    const progress = getProgress(surah.number, surah.numberOfAyahs);
    const inProgress = memorized > 0 && progress < 100;
    const done = progress === 100;

    return (
      <div className={`rounded-xl border transition-colors overflow-hidden ${
        done ? "border-primary/50 bg-primary/5"
        : inProgress ? "border-primary/30 bg-primary/3"
        : "border-border bg-card"
      }`}>
        <div className="flex items-center gap-3 p-3">
          {/* Page number badge */}
          <div className="w-10 shrink-0 text-center">
            <div className="text-[10px] text-muted-foreground leading-none">
              {t.surahs_page_label}
            </div>
            <div className="text-xs font-bold text-primary">
              {SURAH_PAGES[surah.number] ?? "—"}
            </div>
          </div>

          {/* Surah number */}
          <div className="w-8 h-8 rounded-lg bg-muted text-muted-foreground flex items-center justify-center text-xs font-semibold shrink-0">
            {surah.number}
          </div>

          {/* Link to surah */}
          <Link href={`/surah/${surah.number}`} className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">{surah.englishName}</p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {surah.englishNameTranslation} · {surah.numberOfAyahs} {t.surahs_ayahs} · {surah.revelationType === "Meccan" ? t.surahs_meccan : t.surahs_medinan}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-lg leading-tight" style={{ fontFamily: '"Amiri", serif' }}>{surah.name}</p>
              </div>
            </div>
          </Link>

          {/* Pin button */}
          <button
            onClick={(e) => { e.preventDefault(); togglePin(surah.number); }}
            className={`p-1.5 rounded-lg transition-colors shrink-0 ${isPinned(surah.number) ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
            title={isPinned(surah.number) ? t.surahs_unpin : t.surahs_pin}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill={isPinned(surah.number) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
            </svg>
          </button>
        </div>

        {/* Progress bar */}
        {memorized > 0 && (
          <div className="px-3 pb-2.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] text-muted-foreground">
                {inProgress ? t.surahs_in_progress : t.surahs_memorized}
              </span>
              <span className="text-[9px] font-semibold text-primary">
                {memorized}/{surah.numberOfAyahs} · {progress}%
              </span>
            </div>
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <Header title={t.surahs_index_title} />
      <main className="max-w-3xl mx-auto px-4 py-4 space-y-4">
        {/* Read Complete Quran button */}
        <Link
          href={`/mushaf?page=${lastMushafPage}`}
          className="flex items-center gap-3 p-4 rounded-2xl border-2 border-primary/30 bg-gradient-to-r from-primary/10 to-primary/5 hover:border-primary/60 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center text-primary shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">{t.mushaf_read_book}</p>
            <p className="text-xs text-muted-foreground">{t.mushaf_read_book_desc}</p>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary shrink-0"><path d="m9 18 6-6-6-6"/></svg>
        </Link>

        {/* Decorative mushaf header */}
        <div className="bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 rounded-2xl p-5 text-center">
          <p className="text-2xl mb-1" style={{ fontFamily: '"Amiri", serif' }}>
            ﴿ وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا ﴾
          </p>
          <p className="text-xs text-muted-foreground">المُزَّمِّل · 4</p>
        </div>

        {/* Search */}
        <div className="relative">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.search_placeholder}
            className="w-full bg-muted border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm"
          />
        </div>

        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {error && (
          <div className="text-center py-20">
            <p className="text-red-500 mb-2">{t.surahs_error}</p>
            <button onClick={() => window.location.reload()} className="text-primary text-sm underline">{t.retry}</button>
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-4">
            {pinned.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{t.surahs_pinned}</p>
                <div className="space-y-2">
                  {pinned.map((s) => <SurahRow key={s.number} surah={s} />)}
                </div>
              </div>
            )}
            {rest.length > 0 && (
              <div>
                {pinned.length > 0 && (
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{t.surahs_all}</p>
                )}
                <div className="space-y-2">
                  {rest.map((s) => <SurahRow key={s.number} surah={s} />)}
                </div>
              </div>
            )}
            {filtered.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-12">{t.search_no_results}</p>
            )}
          </div>
        )}
      </main>
    </>
  );
}
