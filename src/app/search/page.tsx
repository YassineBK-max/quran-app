"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { useDebounce } from "@/hooks/useDebounce";
import { searchAyahs, fetchAllSurahs } from "@/lib/api";
import { SearchMatch, SurahInfo } from "@/lib/types";
import { useT } from "@/hooks/useT";
import { getJuzForAyah } from "@/data/juz";
import { getHizbForAyah } from "@/data/hizb";

// All chars of query appear in target in order (allows "baqar" → "Al-Baqarah")
function fuzzyMatch(query: string, target: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase().replace(/[\s'\-_]/g, "");
  const t = target.toLowerCase().replace(/[\s'\-_]/g, "");
  if (t.includes(q)) return true;
  let qi = 0;
  for (const c of t) {
    if (c === q[qi]) qi++;
    if (qi === q.length) return true;
  }
  return false;
}

export default function SearchPage() {
  const t = useT();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [allSurahs, setAllSurahs] = useState<SurahInfo[]>([]);

  const [showFilters, setShowFilters] = useState(false);
  const [filterJuz, setFilterJuz] = useState<number | null>(null);
  const [filterHizb, setFilterHizb] = useState<number | null>(null);
  const [filterSurahNum, setFilterSurahNum] = useState<number | null>(null);
  const [surahSearch, setSurahSearch] = useState("");

  const debouncedQuery = useDebounce(query.trim(), 400);
  const debouncedSurahSearch = useDebounce(surahSearch, 200);

  useEffect(() => {
    fetchAllSurahs().then(setAllSurahs).catch(() => {});
  }, []);

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }
    const isArabic = /[؀-ۿ]/.test(debouncedQuery);
    const lang = isArabic ? "ar" : "en";
    setLoading(true);
    searchAyahs(debouncedQuery, lang)
      .then((data) => { setResults(data.matches || []); setSearched(true); })
      .catch(() => { setResults([]); setSearched(true); })
      .finally(() => setLoading(false));
  }, [debouncedQuery]);

  const surahSuggestions = useMemo(() => {
    if (!debouncedSurahSearch) return [];
    return allSurahs.filter((s) =>
      fuzzyMatch(debouncedSurahSearch, s.englishName) ||
      fuzzyMatch(debouncedSurahSearch, s.name) ||
      fuzzyMatch(debouncedSurahSearch, s.englishNameTranslation) ||
      String(s.number) === debouncedSurahSearch
    );
  }, [allSurahs, debouncedSurahSearch]);

  const filteredResults = useMemo(() => {
    let out = results;
    if (filterSurahNum !== null) out = out.filter((m) => m.surah.number === filterSurahNum);
    if (filterJuz !== null) out = out.filter((m) => getJuzForAyah(m.surah.number, m.numberInSurah) === filterJuz);
    if (filterHizb !== null) out = out.filter((m) => getHizbForAyah(m.surah.number, m.numberInSurah) === filterHizb);
    return out;
  }, [results, filterSurahNum, filterJuz, filterHizb]);

  const activeFilters = (filterJuz !== null ? 1 : 0) + (filterHizb !== null ? 1 : 0) + (filterSurahNum !== null ? 1 : 0);
  const selectedSurah = allSurahs.find((s) => s.number === filterSurahNum);

  const clearAll = () => { setFilterJuz(null); setFilterHizb(null); setFilterSurahNum(null); setSurahSearch(""); };

  return (
    <>
      <Header title={t.search_title} />
      <main className="max-w-3xl mx-auto px-4 py-4">

        {/* Search bar */}
        <div className="relative mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.search_placeholder}
            className="w-full pl-10 pr-20 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
          />
          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters((v) => !v)}
            aria-label="Toggle filters"
            aria-expanded={showFilters}
            className={`absolute right-9 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-colors ${
              activeFilters > 0
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground bg-muted"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            {activeFilters > 0 && <span>{activeFilters}</span>}
          </button>
          {query && (
            <button
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="mb-4 p-3 bg-card border border-border rounded-xl space-y-4">

            {/* Surah name filter */}
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">By Surah Name</p>
              <div className="relative">
                <input
                  value={surahSearch}
                  onChange={(e) => setSurahSearch(e.target.value)}
                  placeholder="e.g. baqar, fatiha, rahman…"
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                {surahSearch && (
                  <button
                    onClick={() => setSurahSearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
                  </button>
                )}
              </div>
              {surahSuggestions.length > 0 && (
                <div className="mt-1.5 border border-border rounded-lg overflow-hidden divide-y divide-border">
                  {surahSuggestions.slice(0, 6).map((s) => (
                    <button
                      key={s.number}
                      onClick={() => { setFilterSurahNum(filterSurahNum === s.number ? null : s.number); setSurahSearch(""); }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
                        filterSurahNum === s.number
                          ? "bg-primary text-primary-foreground"
                          : "bg-card hover:bg-muted"
                      }`}
                    >
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">{s.number}</span>
                      <span className="font-medium">{s.englishName}</span>
                      <span className="text-xs opacity-60" style={{ fontFamily: '"Amiri", serif' }}>{s.name}</span>
                    </button>
                  ))}
                </div>
              )}
              {selectedSurah && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="flex items-center gap-1.5 text-xs bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-full">
                    {selectedSurah.number}. {selectedSurah.englishName}
                    <button onClick={() => setFilterSurahNum(null)} className="hover:text-primary/70 ml-0.5">✕</button>
                  </span>
                </div>
              )}
            </div>

            {/* Juz filter */}
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">By Juz</p>
              <div className="flex flex-wrap gap-1">
                {Array.from({ length: 30 }, (_, i) => i + 1).map((juz) => (
                  <button
                    key={juz}
                    aria-label={`Filter by Juz ${juz}`}
                    onClick={() => { setFilterJuz(filterJuz === juz ? null : juz); setFilterHizb(null); }}
                    className={`w-8 h-7 rounded-lg text-xs font-mono font-medium transition-colors ${
                      filterJuz === juz
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {juz}
                  </button>
                ))}
              </div>
            </div>

            {/* Hizb filter – exact boundaries from HIZB_STARTS */}
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">By Hizb</p>
              <div className="flex flex-wrap gap-1">
                {Array.from({ length: 60 }, (_, i) => i + 1).map((hizb) => (
                  <button
                    key={hizb}
                    aria-label={`Filter by Hizb ${hizb}`}
                    onClick={() => { setFilterHizb(filterHizb === hizb ? null : hizb); setFilterJuz(null); }}
                    className={`w-7 h-6 rounded text-[10px] font-mono transition-colors ${
                      filterHizb === hizb
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {hizb}
                  </button>
                ))}
              </div>
            </div>

            {activeFilters > 0 && (
              <button onClick={clearAll} className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2">
                Clear all filters
              </button>
            )}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* No results */}
        {!loading && searched && filteredResults.length === 0 && (
          <p className="text-center py-10 text-muted-foreground">
            {results.length > 0
              ? `No results in the selected filter (${results.length} total without filter)`
              : t.search_no_results}
          </p>
        )}

        {/* Results */}
        {!loading && filteredResults.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground mb-3">
              {filteredResults.length}
              {results.length !== filteredResults.length && ` of ${results.length}`}
              {" "}{t.search_results_suffix}
            </p>
            {filteredResults.slice(0, 50).map((match, i) => {
              const juz = getJuzForAyah(match.surah.number, match.numberInSurah);
              return (
                <Link
                  key={`${match.number}-${i}`}
                  href={`/surah/${match.surah.number}?ayah=${match.numberInSurah}`}
                  className="block p-3 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
                        {match.surah.number}
                      </span>
                      <span className="text-sm font-semibold">{match.surah.englishName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">J{juz}</span>
                      <span className="text-xs text-muted-foreground">{t.search_ayah} {match.numberInSurah}</span>
                    </div>
                  </div>
                  <p className={`text-sm leading-relaxed ${match.edition.direction === "rtl" ? "text-right font-arabic text-base" : ""}`}>
                    {match.text}
                  </p>
                </Link>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {!query && !searched && (
          <div className="text-center py-20 text-muted-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-3 opacity-50">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
            </svg>
            <p>{t.search_empty_title}</p>
            <p className="text-sm mt-1">{t.search_empty_subtitle}</p>
          </div>
        )}
      </main>
    </>
  );
}
