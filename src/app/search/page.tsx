"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { useDebounce } from "@/hooks/useDebounce";
import { searchAyahs } from "@/lib/api";
import { SearchMatch } from "@/lib/types";
import { useT } from "@/hooks/useT";

export default function SearchPage() {
  const t = useT();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debouncedQuery = useDebounce(query.trim(), 400);

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
      .then((data) => {
        setResults(data.matches || []);
        setSearched(true);
      })
      .catch(() => {
        setResults([]);
        setSearched(true);
      })
      .finally(() => setLoading(false));
  }, [debouncedQuery]);

  return (
    <>
      <Header title={t.search_title} />
      <main className="max-w-3xl mx-auto px-4 py-4">
        <div className="relative mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.search_placeholder}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {loading && (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && searched && results.length === 0 && (
          <p className="text-center py-10 text-muted-foreground">{t.search_no_results}</p>
        )}

        {!loading && results.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground mb-3">{results.length} {t.search_results_suffix}</p>
            {results.slice(0, 50).map((match, i) => (
              <Link
                key={`${match.number}-${i}`}
                href={`/surah/${match.surah.number}?ayah=${match.numberInSurah}`}
                className="block p-3 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                      {match.surah.number}
                    </span>
                    <span className="text-sm font-semibold">{match.surah.englishName}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{t.search_ayah} {match.numberInSurah}</span>
                </div>
                <p className={`text-sm leading-relaxed ${match.edition.direction === "rtl" ? "text-right font-arabic text-base" : ""}`}>
                  {match.text}
                </p>
              </Link>
            ))}
          </div>
        )}

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
