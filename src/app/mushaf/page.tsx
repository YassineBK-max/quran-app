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
  startsAtBeginning: boolean;
  ayahs: PageAyah[];
}

function groupBySurah(ayahs: PageAyah[]): AyahGroup[] {
  const groups: AyahGroup[] = [];
  for (const ayah of ayahs) {
    const last = groups[groups.length - 1];
    if (last && last.surahInfo.number === ayah.surah.number) {
      last.ayahs.push(ayah);
    } else {
      groups.push({ surahInfo: ayah.surah, startsAtBeginning: ayah.numberInSurah === 1, ayahs: [ayah] });
    }
  }
  return groups;
}

// ─── Single rendered page block ───────────────────────────────────────────────
function PageBlock({
  page,
  onAyahClick,
  selectedAyah,
  getBookmark,
  playingAyah,
  isMemorized,
  showDivider,
}: {
  page: QuranPage;
  onAyahClick: (a: PageAyah | null) => void;
  selectedAyah: PageAyah | null;
  getBookmark: (n: number) => { color: string } | undefined;
  playingAyah: { absoluteNumber: number } | null;
  isMemorized: (surahNum: number, nis: number) => boolean;
  showDivider: boolean;
}) {
  const groups = groupBySurah(page.ayahs);
  const juz = page.ayahs[0]?.juz ?? null;
  const prevJuz = page.ayahs[0]?.juz;

  return (
    <>
      {/* Page divider */}
      {showDivider && (
        <div className="mushaf-page-divider">
          <span className="mushaf-page-num" style={{ fontFamily: '"Amiri", serif' }}>
            ─── {toArabicNumeral(page.number)} ───
          </span>
        </div>
      )}

      {/* Juz marker at top of first page or when juz changes */}
      {juz && !showDivider && (
        <div className="text-center mb-3">
          <span className="text-[10px] text-primary/80 border border-primary/20 rounded px-2 py-0.5 font-medium" style={{ fontFamily: '"Amiri", serif' }}>
            الجزء {JUZ_NAMES[juz] ?? toArabicNumeral(juz)}
          </span>
        </div>
      )}
      {juz && showDivider && prevJuz !== page.ayahs[0]?.juz && (
        <div className="text-center mb-3">
          <span className="text-[10px] text-primary/80 border border-primary/20 rounded px-2 py-0.5 font-medium" style={{ fontFamily: '"Amiri", serif' }}>
            الجزء {JUZ_NAMES[juz] ?? toArabicNumeral(juz)}
          </span>
        </div>
      )}

      {groups.map((group, gi) => (
        <div key={`${page.number}-${group.surahInfo.number}-${gi}`}>
          {group.startsAtBeginning && (
            <div className="mushaf-header" style={{ marginTop: gi > 0 || showDivider ? "1.5rem" : 0 }}>
              <span className="mushaf-ornament">❧</span>
              <div className="text-center">
                <p className="mushaf-name">{group.surahInfo.name}</p>
                <p className="text-[11px] text-muted-foreground" style={{ fontFamily: '"Amiri", serif' }}>
                  {group.surahInfo.englishName} — {group.surahInfo.numberOfAyahs} آيات
                </p>
              </div>
              <span className="mushaf-ornament">❧</span>
            </div>
          )}
          {!group.startsAtBeginning && gi === 0 && !showDivider && (
            <p className="text-center mb-2 mushaf-ornament text-sm" style={{ fontFamily: '"Amiri", serif' }}>
              {group.surahInfo.name} (تابع)
            </p>
          )}
          {group.startsAtBeginning && group.surahInfo.number !== 1 && group.surahInfo.number !== 9 && (
            <p className="mushaf-bismillah">بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ</p>
          )}
          <div className="mushaf-text">
            {group.ayahs.map((ayah) => {
              const bookmark = getBookmark(ayah.number);
              const isPlaying = playingAyah?.absoluteNumber === ayah.number;
              const isSelected = selectedAyah?.number === ayah.number;
              const memorized = isMemorized(ayah.surah.number, ayah.numberInSurah);
              return (
                <span
                  key={ayah.number}
                  onClick={() => onAyahClick(isSelected ? null : ayah)}
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
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
function MushafBookInner() {
  const t = useT();
  const searchParams = useSearchParams();
  const startPage = Number(searchParams.get("page")) || null;

  const [lastPage, setLastPage] = useLocalStorage<number>("quran-mushaf-last-page", 1);
  const initialPage = startPage ?? lastPage;

  const [pages, setPages] = useState<QuranPage[]>([]);
  const [loadedMax, setLoadedMax] = useState(0);         // highest page number loaded
  const [loadingPage, setLoadingPage] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [showJump, setShowJump] = useState(false);
  const [jumpInput, setJumpInput] = useState("");
  const [allSurahs, setAllSurahs] = useState<SurahInfo[]>([]);
  const [selectedAyah, setSelectedAyah] = useState<PageAyah | null>(null);

  const { getBookmark } = useBookmarks();
  const { currentAyah: playingAyah } = useAudio();
  const { isMemorized, toggleMemorized, canToggle } = useMemorization();

  const sentinelRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);  // prevent double-loads

  useEffect(() => {
    fetchAllSurahs().then(setAllSurahs).catch(() => {});
  }, []);

  const loadPage = useCallback(async (pageNum: number) => {
    if (loadingRef.current) return;
    if (pageNum < 1 || pageNum > TOTAL_PAGES) return;
    if (pages.some((p) => p.number === pageNum)) return;

    loadingRef.current = true;
    setLoadingPage(pageNum);
    try {
      const data = await fetchQuranPage(pageNum);
      setPages((prev) => {
        const exists = prev.some((p) => p.number === pageNum);
        if (exists) return prev;
        const updated = [...prev, data].sort((a, b) => a.number - b.number);
        return updated;
      });
      setLoadedMax((prev) => Math.max(prev, pageNum));
      setLastPage(pageNum);
      setError("");
    } catch (e: unknown) {
      setError((e as Error).message ?? "Failed to load");
    } finally {
      loadingRef.current = false;
      setLoadingPage(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pages, setLastPage]);

  // Load initial page on mount
  useEffect(() => {
    loadPage(initialPage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // IntersectionObserver: when sentinel is visible, load next page
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && loadedMax > 0 && loadedMax < TOTAL_PAGES) {
          loadPage(loadedMax + 1);
        }
      },
      { rootMargin: "600px" }
    );
    obs.observe(sentinel);
    return () => obs.disconnect();
  }, [loadedMax, loadPage]);

  const jumpTo = useCallback(
    (pageNum: number) => {
      const p = Math.min(TOTAL_PAGES, Math.max(1, pageNum));
      setPages([]);
      setLoadedMax(0);
      setError("");
      setShowJump(false);
      // Clear and reload from that page
      setTimeout(() => loadPage(p), 0);
      containerRef.current?.scrollTo({ top: 0 });
    },
    [loadPage]
  );

  const handleJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = parseInt(jumpInput);
    if (!isNaN(n)) jumpTo(n);
    setJumpInput("");
  };

  return (
    <div className="flex flex-col h-screen">
      <Header
        title={t.mushaf_title ?? "المصحف الشريف"}
        showBack
        extra={
          <button onClick={() => setShowJump((v) => !v)}
            className="px-3 py-1.5 text-xs bg-primary/10 text-primary rounded-lg font-medium">
            {t.mushaf_jump ?? "Go to"}
          </button>
        }
      />

      {/* Jump panel */}
      {showJump && (
        <div className="max-w-3xl mx-auto w-full px-4 py-3 border-b border-border bg-card/90 backdrop-blur-sm">
          <div className="flex gap-2 mb-3">
            <form onSubmit={handleJumpSubmit} className="flex gap-2 flex-1">
              <input value={jumpInput} onChange={(e) => setJumpInput(e.target.value)}
                type="number" min={1} max={604}
                placeholder={t.mushaf_page_number ?? "Page (1–604)"}
                className="flex-1 bg-muted border border-border rounded-lg px-3 py-2 text-sm" />
              <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
                {t.go ?? "Go"}
              </button>
            </form>
            <button onClick={() => setShowJump(false)} className="p-2 text-muted-foreground hover:text-foreground">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
          <div className="max-h-52 overflow-y-auto space-y-0.5">
            {allSurahs.map((s) => (
              <button key={s.number} onClick={() => { jumpTo(SURAH_PAGES[s.number] ?? 1); }}
                className="w-full flex items-center gap-3 px-3 py-1.5 rounded-lg hover:bg-muted text-sm text-left">
                <span className="w-6 text-xs text-muted-foreground font-mono">{s.number}</span>
                <span className="flex-1 font-medium">{s.englishName}</span>
                <span style={{ fontFamily: '"Amiri", serif' }} className="text-base text-muted-foreground">{s.name}</span>
                <span className="text-xs text-primary ml-2">{t.surahs_page_label} {SURAH_PAGES[s.number]}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Scrollable book */}
      <div ref={containerRef} className="flex-1 overflow-y-auto pb-20">
        <div className="max-w-2xl mx-auto px-2 sm:px-4 py-4">
          {/* Book container — single continuous parchment */}
          <div className="mushaf-book">
            {pages.length === 0 && loadingPage && (
              <div className="flex justify-center py-24">
                <div className="w-8 h-8 border-2 border-[#9a7630] border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {error && (
              <div className="text-center py-16">
                <p className="text-red-500 mb-3 text-sm">{error}</p>
                <button onClick={() => loadPage(loadedMax + 1 || initialPage)} className="text-primary text-sm underline">
                  {t.retry ?? "Retry"}
                </button>
              </div>
            )}

            {pages.map((page, idx) => (
              <PageBlock
                key={page.number}
                page={page}
                onAyahClick={setSelectedAyah}
                selectedAyah={selectedAyah}
                getBookmark={getBookmark}
                playingAyah={playingAyah}
                isMemorized={isMemorized}
                showDivider={idx > 0}
              />
            ))}

            {/* Sentinel + loading indicator */}
            <div ref={sentinelRef} className="h-8" />
            {loadingPage && pages.length > 0 && (
              <div className="flex justify-center py-6">
                <div className="flex items-center gap-2 text-xs text-muted-foreground" style={{ fontFamily: '"Amiri", serif' }}>
                  <div className="w-4 h-4 border border-[#9a7630] border-t-transparent rounded-full animate-spin" />
                  <span>جارٍ التحميل...</span>
                </div>
              </div>
            )}
            {loadedMax >= TOTAL_PAGES && pages.length > 0 && (
              <div className="text-center py-8 mushaf-ornament text-sm" style={{ fontFamily: '"Amiri", serif' }}>
                ─── وَاللَّهُ أَعْلَمُ ───
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-sm border-t border-border">
        <div className="max-w-3xl mx-auto flex items-center justify-between px-4 h-14 gap-4">
          <button
            onClick={() => jumpTo(Math.max(1, (pages[0]?.number ?? 2) - 1))}
            disabled={pages[0]?.number <= 1}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-muted text-xs font-medium disabled:opacity-30 hover:bg-primary/10 hover:text-primary transition-colors min-h-[40px]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
            {t.mushaf_prev ?? "Prev"}
          </button>

          <button onClick={() => setShowJump((v) => !v)} className="flex flex-col items-center leading-none">
            <span className="text-[10px] text-muted-foreground">{t.mushaf_page ?? "Page"}</span>
            <span className="text-base font-bold text-primary" style={{ fontFamily: '"Amiri", serif' }}>
              {toArabicNumeral(pages[0]?.number ?? initialPage)}
            </span>
          </button>

          <button
            onClick={() => jumpTo((loadedMax || initialPage) + 1)}
            disabled={loadedMax >= TOTAL_PAGES}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-muted text-xs font-medium disabled:opacity-30 hover:bg-primary/10 hover:text-primary transition-colors min-h-[40px]"
          >
            {t.mushaf_next ?? "Next"}
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>
      </div>

      {/* Ayah popup */}
      {selectedAyah && (
        <div className="fixed bottom-14 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 p-2 bg-card border border-border rounded-xl shadow-xl">
          <span className="text-xs text-muted-foreground px-2" style={{ fontFamily: '"Amiri", serif' }}>
            {selectedAyah.surah.name} · {toArabicNumeral(selectedAyah.numberInSurah)}
          </span>
          <AyahPlayButton surahNumber={selectedAyah.surah.number} numberInSurah={selectedAyah.numberInSurah}
            absoluteNumber={selectedAyah.number} surahName={selectedAyah.surah.englishName}
            totalAyahs={selectedAyah.surah.numberOfAyahs} />
          <BookmarkButton ayahNumber={selectedAyah.number} surahNumber={selectedAyah.surah.number}
            numberInSurah={selectedAyah.numberInSurah} surahName={selectedAyah.surah.englishName} />
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
                  ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-primary hover:bg-primary/10"
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
          <button onClick={() => setSelectedAyah(null)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground">
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
