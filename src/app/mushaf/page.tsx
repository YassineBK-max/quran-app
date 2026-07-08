"use client";
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Header } from "@/components/layout/Header";
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

const toAr = (n: number): string => {
  const d = ["٠","١","٢","٣","٤","٥","٦","٧","٨","٩"];
  return String(n).split("").map((c) => d[parseInt(c)] ?? c).join("");
};

const JUZ: Record<number, string> = {
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

// ─── Single page renderer (same structure as before, no infinite scroll) ──────
function MushafPage({
  page,
  onAyahClick,
  selectedAyah,
  getBookmark,
  playingAyah,
  isMemorized,
}: {
  page: QuranPage;
  onAyahClick: (a: PageAyah | null) => void;
  selectedAyah: PageAyah | null;
  getBookmark: (n: number) => { color: string } | undefined;
  playingAyah: { absoluteNumber: number } | null;
  isMemorized: (s: number, n: number) => boolean;
}) {
  const groups = groupBySurah(page.ayahs);
  const juz = page.ayahs[0]?.juz ?? null;
  const surahNames = useMemo(() => {
    const seen: string[] = [];
    page.ayahs.forEach((a) => { if (!seen.includes(a.surah.name)) seen.push(a.surah.name); });
    return seen;
  }, [page]);

  return (
    <div className="mushaf-book min-h-[70dvh]">
      {/* ── Page header ── */}
      <div className="qr-hdr" style={{ direction: "rtl", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 0 8px", marginBottom: 8 }}>
        {/* Right: surah name(s) */}
        <span className="qr-hdr-surah" style={{ fontFamily: '"Amiri",serif', fontWeight: 700, fontSize: 13, color: "var(--gold, #9a7630)" }}>
          {surahNames.join(" · ")}
        </span>
        {/* Center: page number badge */}
        <span style={{
          fontFamily: '"Amiri",serif', fontSize: 12, fontWeight: 700,
          background: "var(--gold,#9a7630)", color: "#fff",
          borderRadius: 99, padding: "2px 10px", letterSpacing: 0,
        }}>
          {toAr(page.number)}
        </span>
        {/* Left: juz name */}
        <span className="qr-hdr-juz" style={{ fontFamily: '"Amiri",serif', fontSize: 12, color: "var(--muted-foreground)" }}>
          {juz ? `الجزء ${JUZ[juz] ?? toAr(juz)}` : ""}
        </span>
      </div>

      {/* Separator */}
      <div style={{ height: 1, background: "linear-gradient(to right, transparent, var(--gold,#9a7630), transparent)", marginBottom: 10 }} />

      {/* ── Ayah groups ── */}
      {groups.map((group, gi) => (
        <div key={`${page.number}-${group.surahInfo.number}-${gi}`}>
          {group.startsAtBeginning && (
            <div className="mushaf-header" style={{ marginTop: gi > 0 ? "1.5rem" : 0 }}>
              <span className="mushaf-ornament">❧</span>
              <div className="text-center">
                <p className="mushaf-name">{group.surahInfo.name}</p>
                <p className="text-[11px] text-muted-foreground" style={{ fontFamily: '"Amiri",serif' }}>
                  {group.surahInfo.englishName} — {group.surahInfo.numberOfAyahs} آيات
                </p>
              </div>
              <span className="mushaf-ornament">❧</span>
            </div>
          )}
          {!group.startsAtBeginning && gi === 0 && (
            <p className="text-center mb-2 mushaf-ornament text-sm" style={{ fontFamily: '"Amiri",serif' }}>
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
                  className={["mushaf-word", isPlaying?"mushaf-playing":"", memorized?"mushaf-memorized":"", isSelected?"mushaf-selected":"", bookmark?`bookmark-highlight-${bookmark.color}`:""].filter(Boolean).join(" ")}
                >
                  {ayah.text}{" "}
                  <span className="mushaf-verse-end">﴿{toAr(ayah.numberInSurah)}﴾</span>{" "}
                </span>
              );
            })}
          </div>
        </div>
      ))}

      {/* Bottom separator */}
      <div style={{ height: 1, background: "linear-gradient(to right, transparent, var(--gold,#9a7630), transparent)", marginTop: 14 }} />
    </div>
  );
}

// ─── Skeleton for loading state ────────────────────────────────────────────────
function PageSkeleton() {
  return (
    <div className="mushaf-book animate-pulse">
      <div className="flex justify-between mb-4">
        <div className="h-4 bg-muted rounded w-24" />
        <div className="h-5 bg-muted rounded-full w-10" />
        <div className="h-4 bg-muted rounded w-20" />
      </div>
      <div className="h-px bg-muted mb-4" />
      {[...Array(8)].map((_, i) => (
        <div key={i} className="h-5 bg-muted rounded mb-3" style={{ width: `${65 + (i % 4) * 10}%`, marginLeft: "auto" }} />
      ))}
    </div>
  );
}

// ─── Jump panel ───────────────────────────────────────────────────────────────
function JumpPanel({
  allSurahs,
  currentPage,
  onJump,
  onClose,
}: {
  allSurahs: SurahInfo[];
  currentPage: number;
  onJump: (page: number) => void;
  onClose: () => void;
}) {
  const [jumpInput, setJumpInput] = useState("");
  const [tab, setTab] = useState<"surah" | "page">("surah");
  const [surahSearch, setSurahSearch] = useState("");

  const filteredSurahs = allSurahs.filter((s) =>
    !surahSearch || s.englishName.toLowerCase().includes(surahSearch.toLowerCase()) || s.name.includes(surahSearch)
  );

  const handlePageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = parseInt(jumpInput);
    if (!isNaN(n) && n >= 1 && n <= TOTAL_PAGES) { onJump(n); setJumpInput(""); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md max-h-[80dvh] flex flex-col bg-card border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <p className="font-semibold text-sm">الانتقال إلى</p>
          <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Sub-tabs */}
        <div className="grid grid-cols-2 gap-1 p-2 bg-muted/50">
          {(["surah", "page"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`py-2 rounded-lg text-xs font-medium transition-colors ${tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
              {t === "surah" ? "انتقل إلى سورة" : "انتقل إلى صفحة"}
            </button>
          ))}
        </div>

        {tab === "surah" && (
          <>
            <div className="p-2 border-b border-border">
              <input
                value={surahSearch}
                onChange={(e) => setSurahSearch(e.target.value)}
                placeholder="ابحث عن سورة..."
                className="w-full bg-muted rounded-xl px-3 py-2 text-sm focus:outline-none"
                autoFocus
              />
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredSurahs.map((s) => {
                const pg = SURAH_PAGES[s.number] ?? 1;
                const isCurrent = currentPage >= pg && (
                  !filteredSurahs[filteredSurahs.indexOf(s) + 1] ||
                  currentPage < (SURAH_PAGES[filteredSurahs[filteredSurahs.indexOf(s) + 1].number] ?? TOTAL_PAGES + 1)
                );
                return (
                  <button key={s.number} onClick={() => onJump(pg)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted transition-colors ${isCurrent ? "bg-primary/5" : ""}`}>
                    <span className="w-7 text-xs text-muted-foreground font-mono text-center">{s.number}</span>
                    <span className="flex-1 text-sm font-medium text-left">{s.englishName}</span>
                    <span style={{ fontFamily: '"Amiri",serif' }} className="text-base">{s.name}</span>
                    <span className="text-xs text-primary ml-1">{pg}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {tab === "page" && (
          <div className="p-4">
            <form onSubmit={handlePageSubmit} className="flex gap-2">
              <input
                value={jumpInput}
                onChange={(e) => setJumpInput(e.target.value)}
                type="number" min={1} max={604}
                placeholder="رقم الصفحة (١ - ٦٠٤)"
                autoFocus
                className="flex-1 bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-center"
              />
              <button type="submit" className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium">
                انتقل
              </button>
            </form>
            <p className="text-center text-xs text-muted-foreground mt-3">الصفحة الحالية: {currentPage} / {TOTAL_PAGES}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main E-book component ─────────────────────────────────────────────────────
function MushafBookInner() {
  const t = useT();
  const searchParams = useSearchParams();
  const startPage = Number(searchParams.get("page")) || 1;

  const [currentPage, setCurrentPage] = useState(startPage);
  const [pageData, setPageData] = useState<QuranPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showJump, setShowJump] = useState(false);
  const [allSurahs, setAllSurahs] = useState<SurahInfo[]>([]);
  const [selectedAyah, setSelectedAyah] = useState<PageAyah | null>(null);
  const [direction, setDirection] = useState<"next" | "prev" | null>(null);

  const pageCache = useRef(new Map<number, QuranPage>());
  const navigating = useRef(false);

  const { getBookmark } = useBookmarks();
  const { currentAyah: playingAyah } = useAudio();
  const { isMemorized, toggleMemorized, canToggle } = useMemorization();

  // Touch swipe
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  useEffect(() => { fetchAllSurahs().then(setAllSurahs).catch(() => {}); }, []);

  const fetchPage = useCallback(async (n: number): Promise<QuranPage | null> => {
    if (n < 1 || n > TOTAL_PAGES) return null;
    if (pageCache.current.has(n)) return pageCache.current.get(n)!;
    const data = await fetchQuranPage(n);
    pageCache.current.set(n, data);
    return data;
  }, []);

  const goTo = useCallback(async (n: number, dir?: "next" | "prev") => {
    if (navigating.current || n < 1 || n > TOTAL_PAGES) return;
    navigating.current = true;
    setLoading(true);
    setError("");
    setSelectedAyah(null);
    if (dir) setDirection(dir);
    try {
      const data = await fetchPage(n);
      if (data) {
        setPageData(data);
        setCurrentPage(n);
        // Update URL without navigation
        const url = new URL(window.location.href);
        url.searchParams.set("page", String(n));
        window.history.replaceState(null, "", url.toString());
      }
    } catch (e: unknown) {
      setError((e as Error).message ?? "فشل التحميل");
    } finally {
      setLoading(false);
      navigating.current = false;
    }
    // Pre-fetch neighbors
    fetchPage(n + 1).catch(() => {});
    fetchPage(n - 1).catch(() => {});
  }, [fetchPage]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === "INPUT") return;
      if (e.key === "ArrowLeft") goTo(currentPage + 1, "next");
      if (e.key === "ArrowRight") goTo(currentPage - 1, "prev");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [currentPage, goTo]);

  // Initial load
  useEffect(() => { goTo(startPage); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset direction animation after paint
  useEffect(() => {
    if (direction) { const t = setTimeout(() => setDirection(null), 350); return () => clearTimeout(t); }
  }, [direction]);

  const animClass = direction === "next" ? "ebook-page-next" : direction === "prev" ? "ebook-page-prev" : "";

  return (
    <div className="flex flex-col h-screen">
      <Header
        title={t.mushaf_title ?? "المصحف الشريف"}
        showBack
        extra={
          <button
            onClick={() => setShowJump(true)}
            className="px-3 py-1.5 text-xs bg-primary/10 text-primary rounded-lg font-medium"
          >
            {t.mushaf_jump ?? "انتقل"}
          </button>
        }
      />

      {/* Book area */}
      <div
        className="flex-1 overflow-y-auto pb-20"
        onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; touchStartY.current = e.touches[0].clientY; }}
        onTouchEnd={(e) => {
          const dx = e.changedTouches[0].clientX - touchStartX.current;
          const dy = e.changedTouches[0].clientY - touchStartY.current;
          if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.5) {
            if (dx < 0) goTo(currentPage + 1, "next");
            else goTo(currentPage - 1, "prev");
          }
        }}
      >
        <div className="max-w-2xl mx-auto px-2 sm:px-4 py-4">
          {loading ? (
            <PageSkeleton />
          ) : error ? (
            <div className="text-center py-16">
              <p className="text-red-500 mb-3 text-sm">{error}</p>
              <button onClick={() => goTo(currentPage)} className="text-primary text-sm underline">إعادة المحاولة</button>
            </div>
          ) : pageData ? (
            <div key={currentPage} className={animClass}>
              <MushafPage
                page={pageData}
                onAyahClick={setSelectedAyah}
                selectedAyah={selectedAyah}
                getBookmark={getBookmark}
                playingAyah={playingAyah}
                isMemorized={isMemorized}
              />
            </div>
          ) : null}

          {currentPage === TOTAL_PAGES && !loading && (
            <div className="text-center pt-6 mushaf-ornament text-sm" style={{ fontFamily: '"Amiri",serif' }}>
              ─── وَاللَّهُ أَعْلَمُ ───
            </div>
          )}
        </div>
      </div>

      {/* Bottom navigation bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-sm border-t border-border">
        <div className="max-w-3xl mx-auto flex items-center justify-between px-4 h-14 gap-4">
          {/* RTL: right button = previous page (higher page number in Arabic reading) */}
          <button
            onClick={() => goTo(currentPage + 1, "next")}
            disabled={loading || currentPage >= TOTAL_PAGES}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-muted text-xs font-medium disabled:opacity-30 hover:bg-primary/10 hover:text-primary transition-colors min-h-[40px]"
            aria-label="الصفحة التالية"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
            {t.mushaf_next ?? "التالي"}
          </button>

          <button
            onClick={() => setShowJump(true)}
            className="flex flex-col items-center leading-none gap-0.5"
          >
            <span className="text-[10px] text-muted-foreground">{t.mushaf_page ?? "صفحة"}</span>
            <span className="text-base font-bold text-primary" style={{ fontFamily: '"Amiri",serif' }}>
              {toAr(currentPage)} / {toAr(TOTAL_PAGES)}
            </span>
          </button>

          <button
            onClick={() => goTo(currentPage - 1, "prev")}
            disabled={loading || currentPage <= 1}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-muted text-xs font-medium disabled:opacity-30 hover:bg-primary/10 hover:text-primary transition-colors min-h-[40px]"
            aria-label="الصفحة السابقة"
          >
            {t.mushaf_prev ?? "السابق"}
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>
      </div>

      {/* Jump panel */}
      {showJump && (
        <JumpPanel
          allSurahs={allSurahs}
          currentPage={currentPage}
          onJump={(p) => { goTo(p); setShowJump(false); }}
          onClose={() => setShowJump(false)}
        />
      )}

      {/* Ayah popup */}
      {selectedAyah && (
        <div className="fixed bottom-14 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 p-2 bg-card border border-border rounded-xl shadow-xl">
          <span className="text-xs text-muted-foreground px-2" style={{ fontFamily: '"Amiri",serif' }}>
            {selectedAyah.surah.name} · {toAr(selectedAyah.numberInSurah)}
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
