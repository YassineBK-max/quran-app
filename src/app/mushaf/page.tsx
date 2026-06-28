"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Header } from "@/components/layout/Header";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useBookmarks } from "@/contexts/BookmarkContext";
import { useAudio } from "@/contexts/AudioContext";
import { useMemorization } from "@/contexts/MemorizationContext";
import { BookmarkButton } from "@/components/bookmarks/BookmarkButton";
import { AyahPlayButton } from "@/components/audio/AyahPlayButton";
import { SURAH_PAGES } from "@/lib/constants";
import { QuranPage, PageAyah, SurahInfo } from "@/lib/types";
import { fetchQuranPage, fetchAllSurahs } from "@/lib/api";
import { useT } from "@/hooks/useT";

const TOTAL_PAGES = 604;

const toArabicNumeral = (n: number): string => {
  const d = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return String(n).split("").map((c) => d[parseInt(c)] ?? c).join("");
};

const JUZ_NAMES: Record<number, string> = {
  1:"الأول",2:"الثاني",3:"الثالث",4:"الرابع",5:"الخامس",
  6:"السادس",7:"السابع",8:"الثامن",9:"التاسع",10:"العاشر",
  11:"الحادي عشر",12:"الثاني عشر",13:"الثالث عشر",14:"الرابع عشر",15:"الخامس عشر",
  16:"السادس عشر",17:"السابع عشر",18:"الثامن عشر",19:"التاسع عشر",20:"العشرون",
  21:"الحادي والعشرون",22:"الثاني والعشرون",23:"الثالث والعشرون",24:"الرابع والعشرون",25:"الخامس والعشرون",
  26:"السادس والعشرون",27:"السابع والعشرون",28:"الثامن والعشرون",29:"التاسع والعشرون",30:"الثلاثون",
};

interface AyahGroup {
  surahInfo: SurahInfo;
  startsAtBeginning: boolean; // ayah 1 of surah is on this page
  ayahs: PageAyah[];
}

function groupBysurah(ayahs: PageAyah[]): AyahGroup[] {
  const groups: AyahGroup[] = [];
  for (const ayah of ayahs) {
    const last = groups[groups.length - 1];
    if (last && last.surahInfo.number === ayah.surah.number) {
      last.ayahs.push(ayah);
    } else {
      groups.push({
        surahInfo: ayah.surah,
        startsAtBeginning: ayah.numberInSurah === 1,
        ayahs: [ayah],
      });
    }
  }
  return groups;
}

function MushafBookInner() {
  const t = useT();
  const searchParams = useSearchParams();
  const startPage = Number(searchParams.get("page")) || null;

  const [lastPage, setLastPage] = useLocalStorage<number>("quran-mushaf-last-page", 1);
  const [currentPage, setCurrentPage] = useState<number>(startPage ?? lastPage);
  const [pageData, setPageData] = useState<QuranPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [jumpInput, setJumpInput] = useState("");
  const [showJump, setShowJump] = useState(false);
  const [allSurahs, setAllSurahs] = useState<SurahInfo[]>([]);
  const [selectedAyah, setSelectedAyah] = useState<PageAyah | null>(null);

  const { getBookmark } = useBookmarks();
  const { currentAyah: playingAyah } = useAudio();
  const { isMemorized, toggleMemorized, canToggle } = useMemorization();

  const touchStartX = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load surah list once for the jump panel
  useEffect(() => {
    fetchAllSurahs().then(setAllSurahs).catch(() => {});
  }, []);

  // Fetch page whenever currentPage changes
  useEffect(() => {
    setLoading(true);
    setError("");
    setSelectedAyah(null);
    fetchQuranPage(currentPage)
      .then((data) => { setPageData(data); setLastPage(currentPage); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const goTo = useCallback((page: number) => {
    const clamped = Math.min(TOTAL_PAGES, Math.max(1, page));
    setCurrentPage(clamped);
    containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) {
      // RTL: swipe right = prev page, swipe left = next page
      if (dx > 0) goTo(currentPage - 1);
      else goTo(currentPage + 1);
    }
    touchStartX.current = null;
  };

  const handleJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = parseInt(jumpInput);
    if (!isNaN(n)) goTo(n);
    setJumpInput("");
    setShowJump(false);
  };

  const groups = pageData ? groupBysurah(pageData.ayahs) : [];
  const juz = pageData?.ayahs[0]?.juz ?? null;

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <Header
        title={t.mushaf_title ?? "المصحف الشريف"}
        showBack
        extra={
          <button
            onClick={() => setShowJump((v) => !v)}
            className="px-3 py-1.5 text-xs bg-primary/10 text-primary rounded-lg font-medium"
          >
            {t.mushaf_jump ?? "Go to"}
          </button>
        }
      />

      {/* Jump panel */}
      {showJump && (
        <div className="max-w-3xl mx-auto w-full px-4 py-3 border-b border-border bg-card/80 backdrop-blur-sm">
          <div className="flex gap-2 mb-3">
            <form onSubmit={handleJumpSubmit} className="flex gap-2 flex-1">
              <input
                value={jumpInput}
                onChange={(e) => setJumpInput(e.target.value)}
                type="number"
                min={1}
                max={604}
                placeholder={t.mushaf_page_number ?? "Page (1–604)"}
                className="flex-1 bg-muted border border-border rounded-lg px-3 py-2 text-sm"
              />
              <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
                {t.go ?? "Go"}
              </button>
            </form>
            <button onClick={() => setShowJump(false)} className="p-2 text-muted-foreground hover:text-foreground">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
          {/* Surah list */}
          <div className="max-h-52 overflow-y-auto space-y-0.5">
            {allSurahs.map((s) => (
              <button
                key={s.number}
                onClick={() => { goTo(SURAH_PAGES[s.number] ?? 1); setShowJump(false); }}
                className="w-full flex items-center gap-3 px-3 py-1.5 rounded-lg hover:bg-muted text-sm text-left"
              >
                <span className="w-6 text-xs text-muted-foreground font-mono">{s.number}</span>
                <span className="flex-1 font-medium">{s.englishName}</span>
                <span style={{ fontFamily: '"Amiri", serif' }} className="text-base text-muted-foreground">{s.name}</span>
                <span className="text-xs text-primary ml-2">{t.surahs_page_label} {SURAH_PAGES[s.number]}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main scrollable area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto pb-28"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="max-w-3xl mx-auto px-4 py-4">
          {loading && (
            <div className="flex justify-center py-32">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {error && (
            <div className="text-center py-32">
              <p className="text-red-500 mb-3">{error}</p>
              <button onClick={() => goTo(currentPage)} className="text-primary text-sm underline">{t.retry ?? "Retry"}</button>
            </div>
          )}

          {!loading && !error && pageData && (
            <div className="mushaf-page">
              <div className="mushaf-inner">

                {/* Juz label at top of page */}
                {juz && (
                  <div className="text-center mb-3">
                    <span className="text-[10px] text-primary/80 border border-primary/20 rounded px-2 py-0.5 font-medium" style={{ fontFamily: '"Amiri", serif' }}>
                      الجزء {JUZ_NAMES[juz] ?? toArabicNumeral(juz)}
                    </span>
                  </div>
                )}

                {/* Render surah groups */}
                {groups.map((group, gi) => (
                  <div key={`${group.surahInfo.number}-${gi}`}>
                    {/* Surah header — shown when this surah BEGINS on this page */}
                    {group.startsAtBeginning && (
                      <div className="mushaf-header" style={{ marginTop: gi > 0 ? "1.5rem" : 0 }}>
                        <span className="mushaf-ornament">❧</span>
                        <p className="mushaf-name">{group.surahInfo.name}</p>
                        <span className="mushaf-ornament">❧</span>
                      </div>
                    )}
                    {/* Surah name continuation label (no header, just a small note) */}
                    {!group.startsAtBeginning && gi === 0 && (
                      <p className="text-center mb-2 mushaf-ornament text-sm" style={{ fontFamily: '"Amiri", serif' }}>
                        {group.surahInfo.name} (تابع)
                      </p>
                    )}
                    {!group.startsAtBeginning && gi > 0 && (
                      <div className="mushaf-header" style={{ marginTop: "1rem" }}>
                        <span className="mushaf-ornament">❧</span>
                        <p className="mushaf-name" style={{ fontSize: "1.4rem" }}>{group.surahInfo.name} (تابع)</p>
                        <span className="mushaf-ornament">❧</span>
                      </div>
                    )}

                    {/* Bismillah — only when surah starts fresh (not continuation) and not surah 1 or 9 */}
                    {group.startsAtBeginning &&
                      group.surahInfo.number !== 1 &&
                      group.surahInfo.number !== 9 && (
                        <p className="mushaf-bismillah">
                          بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
                        </p>
                      )}

                    {/* Ayah text */}
                    <div className="mushaf-text">
                      {group.ayahs.map((ayah) => {
                        const bookmark = getBookmark(ayah.number);
                        const isPlaying = playingAyah?.absoluteNumber === ayah.number;
                        const isSelected = selectedAyah?.number === ayah.number;
                        const memorized = isMemorized(ayah.surah.number, ayah.numberInSurah);

                        return (
                          <span
                            key={ayah.number}
                            onClick={() => setSelectedAyah(isSelected ? null : ayah)}
                            className={[
                              "mushaf-word",
                              isPlaying ? "mushaf-playing" : "",
                              memorized ? "mushaf-memorized" : "",
                              isSelected ? "mushaf-selected" : "",
                              bookmark ? `bookmark-highlight-${bookmark.color}` : "",
                            ].filter(Boolean).join(" ")}
                          >
                            {ayah.text}{" "}
                            <span className="mushaf-verse-end">﴿{toArabicNumeral(ayah.numberInSurah)}﴾</span>{" "}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Page number footer */}
                <div className="mushaf-footer">
                  <span className="mushaf-ornament">
                    ─── {toArabicNumeral(currentPage)} ───
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fixed bottom nav: prev / page indicator / next */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-sm border-t border-border">
        <div className="max-w-3xl mx-auto flex items-center justify-between px-4 h-16 gap-4">
          <button
            onClick={() => goTo(currentPage - 1)}
            disabled={currentPage <= 1}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-muted text-sm font-medium disabled:opacity-30 hover:bg-primary/10 hover:text-primary transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
            {t.mushaf_prev ?? "Prev"}
          </button>

          <button
            onClick={() => setShowJump((v) => !v)}
            className="flex flex-col items-center leading-none"
          >
            <span className="text-xs text-muted-foreground">{t.mushaf_page ?? "Page"}</span>
            <span className="text-lg font-bold text-primary" style={{ fontFamily: '"Amiri", serif' }}>
              {toArabicNumeral(currentPage)}
            </span>
            <span className="text-[10px] text-muted-foreground/60">/ {TOTAL_PAGES}</span>
          </button>

          <button
            onClick={() => goTo(currentPage + 1)}
            disabled={currentPage >= TOTAL_PAGES}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-muted text-sm font-medium disabled:opacity-30 hover:bg-primary/10 hover:text-primary transition-colors"
          >
            {t.mushaf_next ?? "Next"}
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>
      </div>

      {/* Ayah action popup */}
      {selectedAyah && (
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 p-2 bg-card border border-border rounded-xl shadow-xl">
          <span className="text-xs text-muted-foreground px-2" style={{ fontFamily: '"Amiri", serif' }}>
            {selectedAyah.surah.name} · {toArabicNumeral(selectedAyah.numberInSurah)}
          </span>
          <AyahPlayButton
            surahNumber={selectedAyah.surah.number}
            numberInSurah={selectedAyah.numberInSurah}
            absoluteNumber={selectedAyah.number}
            surahName={selectedAyah.surah.englishName}
            totalAyahs={selectedAyah.surah.numberOfAyahs}
          />
          <BookmarkButton
            ayahNumber={selectedAyah.number}
            surahNumber={selectedAyah.surah.number}
            numberInSurah={selectedAyah.numberInSurah}
            surahName={selectedAyah.surah.englishName}
          />
          {canToggle && (
            <button
              onClick={() => {
                toggleMemorized(selectedAyah.surah.number, {
                  numberInSurah: selectedAyah.numberInSurah,
                  hizbQuarter: selectedAyah.hizbQuarter,
                  page: selectedAyah.page,
                });
                setSelectedAyah(null);
              }}
              className={`p-1.5 rounded-lg transition-colors ${
                isMemorized(selectedAyah.surah.number, selectedAyah.numberInSurah)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-primary hover:bg-primary/10"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
                fill={isMemorized(selectedAyah.surah.number, selectedAyah.numberInSurah) ? "currentColor" : "none"}
                stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </button>
          )}
          <button
            onClick={() => setSelectedAyah(null)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
      )}
    </div>
  );
}

export default function MushafBookPage() {
  return (
    <Suspense>
      <MushafBookInner />
    </Suspense>
  );
}
