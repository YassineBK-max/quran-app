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
    if (String(s.number) === search.trim()) return true;
    const q = search.toLowerCase().replace(/[\s'\-_]/g, "");
    const matchFuzzy = (target: string) => {
      const t = target.toLowerCase().replace(/[\s'\-_]/g, "");
      if (t.includes(q)) return true;
      let qi = 0;
      for (const c of t) { if (c === q[qi]) qi++; if (qi === q.length) return true; }
      return false;
    };
    return matchFuzzy(s.englishName) || s.name.includes(search) || matchFuzzy(s.englishNameTranslation);
  });

  const pinned = filtered.filter((s) => isPinned(s.number));
  const rest = filtered.filter((s) => !isPinned(s.number));

  const SurahRow = ({ surah }: { surah: SurahInfo }) => {
    const memorized = getMemorizedCount(surah.number);
    const progress = getProgress(surah.number, surah.numberOfAyahs);
    const inProgress = memorized > 0 && progress < 100;
    const done = progress === 100;

    return (
      <div
        className="rounded-xl border border-border bg-card transition-colors overflow-hidden"
        style={
          done
            ? { borderColor: "rgba(30,96,64,0.4)", background: "rgba(30,96,64,0.05)" }
            : inProgress
            ? { borderColor: "rgba(200,147,42,0.3)", background: "rgba(200,147,42,0.03)" }
            : undefined
        }
      >
        <div className="flex items-center gap-3 p-3">
          {/* Mushaf page */}
          <div className="w-10 shrink-0 text-center">
            <div className="text-[10px] text-muted-foreground leading-none mb-0.5">
              {t.surahs_page_label}
            </div>
            <div className="text-xs font-bold" style={{ color: "var(--gold)" }}>
              {SURAH_PAGES[surah.number] ?? "—"}
            </div>
          </div>

          {/* Surah number — octagonal badge */}
          <div
            className="w-9 h-9 flex items-center justify-center text-xs font-bold shrink-0"
            style={{
              clipPath: "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)",
              background: done
                ? "var(--primary)"
                : inProgress
                ? "linear-gradient(135deg, rgba(30,96,64,0.7), rgba(200,147,42,0.5))"
                : "var(--muted)",
              color: done ? "var(--primary-foreground)" : "var(--foreground)",
            }}
          >
            {surah.number}
          </div>

          {/* Link to surah */}
          <Link href={`/surah/${surah.number}`} className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate" style={{ fontFamily: '"Cairo", sans-serif' }}>
                  {surah.englishName}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {surah.englishNameTranslation} · {surah.numberOfAyahs} {t.surahs_ayahs} · {surah.revelationType === "Meccan" ? t.surahs_meccan : t.surahs_medinan}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-lg leading-tight" style={{ fontFamily: '"Amiri", serif', color: "var(--primary)" }}>
                  {surah.name}
                </p>
              </div>
            </div>
          </Link>

          {/* Pin button */}
          <button
            onClick={(e) => { e.preventDefault(); togglePin(surah.number); }}
            className="p-1.5 rounded-lg transition-colors shrink-0 min-w-[36px] min-h-[36px] flex items-center justify-center"
            style={{ color: isPinned(surah.number) ? "var(--gold)" : "var(--muted-foreground)" }}
            title={isPinned(surah.number) ? t.surahs_unpin : t.surahs_pin}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill={isPinned(surah.number) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
            </svg>
          </button>
        </div>

        {/* Progress bar */}
        {memorized > 0 && (
          <div className="px-3 pb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] text-muted-foreground">
                {inProgress ? t.surahs_in_progress : t.surahs_memorized}
              </span>
              <span className="text-[9px] font-semibold" style={{ color: done ? "var(--primary)" : "var(--gold)" }}>
                {memorized}/{surah.numberOfAyahs} · {progress}%
              </span>
            </div>
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progress}%`,
                  background: done
                    ? "var(--primary)"
                    : "linear-gradient(90deg, var(--primary), var(--gold))",
                }}
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
      <main className="max-w-3xl mx-auto px-4 py-4 pb-24 space-y-4">

        {/* Read Complete Quran — continuous scroll */}
        <Link
          href={`/mushaf?page=${lastMushafPage}`}
          className="flex items-center gap-3 p-4 rounded-2xl transition-colors"
          style={{
            border: "1.5px solid rgba(30,96,64,0.3)",
            background: "linear-gradient(135deg, rgba(30,96,64,0.08) 0%, rgba(200,147,42,0.06) 100%)",
          }}
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(30,96,64,0.12)", color: "var(--primary)" }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm leading-tight">{t.mushaf_read_book}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Continuous scroll · 604 pages</p>
          </div>
          <p className="text-[10px] font-medium shrink-0" style={{ color: "var(--primary)" }}>p. {lastMushafPage} / 604</p>
        </Link>

        {/* Decorative Quranic verse header */}
        <div
          className="rounded-2xl p-5 text-center relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(30,96,64,0.12) 0%, rgba(200,147,42,0.08) 100%)",
            border: "1px solid rgba(200,147,42,0.2)",
          }}
        >
          {/* Corner ornaments */}
          <span
            className="absolute top-2 left-3 text-xs opacity-30"
            style={{ color: "var(--gold)" }}
            aria-hidden="true"
          >
            ✦
          </span>
          <span
            className="absolute top-2 right-3 text-xs opacity-30"
            style={{ color: "var(--gold)" }}
            aria-hidden="true"
          >
            ✦
          </span>
          <p className="text-2xl mb-1.5" style={{ fontFamily: '"Amiri", serif', direction: "rtl", color: "var(--foreground)" }}>
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
            className="w-full bg-muted border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-[var(--gold)] transition-colors"
            style={{ fontFamily: '"Cairo", sans-serif' }}
          />
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-20">
            <div
              className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: "var(--gold)", borderTopColor: "transparent" }}
            />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-center py-20">
            <p className="text-red-500 mb-2">{t.surahs_error}</p>
            <button onClick={() => window.location.reload()} className="text-sm underline" style={{ color: "var(--primary)" }}>
              {t.retry}
            </button>
          </div>
        )}

        {/* Surah list */}
        {!loading && !error && (
          <div className="space-y-4">
            {pinned.length > 0 && (
              <div>
                <div className="islamic-divider mb-3">
                  <span>{t.surahs_pinned}</span>
                </div>
                <div className="space-y-2">
                  {pinned.map((s) => <SurahRow key={s.number} surah={s} />)}
                </div>
              </div>
            )}
            {rest.length > 0 && (
              <div>
                {pinned.length > 0 && (
                  <div className="islamic-divider mb-3">
                    <span>{t.surahs_all}</span>
                  </div>
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
