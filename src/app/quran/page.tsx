"use client";
import {
  useEffect, useState, useCallback, useRef, useMemo, Suspense,
} from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useBookmarks } from "@/contexts/BookmarkContext";
import { useAudio } from "@/contexts/AudioContext";
import { useMemorization } from "@/contexts/MemorizationContext";
import { BookmarkButton } from "@/components/bookmarks/BookmarkButton";
import { AyahPlayButton } from "@/components/audio/AyahPlayButton";
import { SURAH_PAGES } from "@/lib/constants";
import type { QuranPage, PageAyah, SurahInfo } from "@/lib/types";
import { fetchQuranPage, fetchAllSurahs } from "@/lib/api";

const TOTAL = 604;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toArabic(n: number): string {
  return String(n)
    .split("")
    .map((c) => "٠١٢٣٤٥٦٧٨٩"[+c] ?? c)
    .join("");
}

const JUZ_NAMES: Record<number, string> = {
  1:"الأول",2:"الثاني",3:"الثالث",4:"الرابع",5:"الخامس",
  6:"السادس",7:"السابع",8:"الثامن",9:"التاسع",10:"العاشر",
  11:"الحادي عشر",12:"الثاني عشر",13:"الثالث عشر",14:"الرابع عشر",15:"الخامس عشر",
  16:"السادس عشر",17:"السابع عشر",18:"الثامن عشر",19:"التاسع عشر",20:"العشرون",
  21:"الحادي والعشرون",22:"الثاني والعشرون",23:"الثالث والعشرون",
  24:"الرابع والعشرون",25:"الخامس والعشرون",26:"السادس والعشرون",
  27:"السابع والعشرون",28:"الثامن والعشرون",29:"التاسع والعشرون",30:"الثلاثون",
};

// Quarter-of-hizb symbols used in physical mushafs
const HIZB_SYMBOLS = ["", "ربع", "نصف", "ثلاثة أرباع", ""];

interface Group { surah: SurahInfo; isNew: boolean; ayahs: PageAyah[] }

function groupBySurah(ayahs: PageAyah[]): Group[] {
  const out: Group[] = [];
  for (const a of ayahs) {
    const last = out[out.length - 1];
    if (last?.surah.number === a.surah.number) last.ayahs.push(a);
    else out.push({ surah: a.surah, isNew: a.numberInSurah === 1, ayahs: [a] });
  }
  return out;
}

// ─── Page frame ───────────────────────────────────────────────────────────────

function PageFrame({
  page,
  animKey,
  onAyahClick,
  selectedAyah,
  getBookmark,
  playingAyah,
  isMemorized,
}: {
  page: QuranPage;
  animKey: number;
  onAyahClick: (a: PageAyah | null) => void;
  selectedAyah: PageAyah | null;
  getBookmark: (n: number) => { color: string } | undefined;
  playingAyah: { absoluteNumber: number } | null;
  isMemorized: (s: number, n: number) => boolean;
}) {
  const groups = groupBySurah(page.ayahs);
  const juz = page.ayahs[0]?.juz ?? 0;
  const hizbQ = page.ayahs[0]?.hizbQuarter ?? 0;
  const hizbNum = Math.ceil(hizbQ / 4);
  const quarterIdx = ((hizbQ - 1) % 4) + 1; // 1–4

  // Unique surah names on this page (RTL: first in reading order = rightmost name)
  const surahNames = useMemo(() => {
    const seen = new Set<number>();
    const names: string[] = [];
    for (const g of groups) {
      if (!seen.has(g.surah.number)) { seen.add(g.surah.number); names.push(g.surah.name); }
    }
    return names;
  }, [groups]);

  return (
    <div key={animKey} className="qr-anim qr-frame">
      <div className="qr-inner">

        {/* ── Page header ──────────────────────────────────── */}
        <div className="qr-hdr">
          {/* Right (RTL start): surah name(s) */}
          <span className="qr-hdr-surah">
            {surahNames.join(" · ")}
          </span>
          {/* Center: page number */}
          <span className="qr-hdr-num">{toArabic(page.number)}</span>
          {/* Left (RTL end): juz */}
          <span className="qr-hdr-juz">
            الجزء {JUZ_NAMES[juz] ?? toArabic(juz)}
          </span>
        </div>

        <div className="qr-sep" />

        {/* ── Quran text ───────────────────────────────────── */}
        <div style={{ padding: "4px 0 4px" }}>
          {groups.map((g, gi) => (
            <div key={`${g.surah.number}-${gi}`}>
              {/* Surah header */}
              {g.isNew && (
                <div className="mushaf-header" style={{ marginTop: gi > 0 ? "1.4rem" : "0.2rem" }}>
                  <span className="mushaf-ornament">❧</span>
                  <div className="text-center">
                    <p className="mushaf-name">{g.surah.name}</p>
                    <p style={{ fontFamily: '"Amiri", serif', fontSize: "0.68rem", color: "var(--muted-foreground)", marginTop: 2 }}>
                      {g.surah.englishName} · {g.surah.numberOfAyahs} آيات
                    </p>
                  </div>
                  <span className="mushaf-ornament">❧</span>
                </div>
              )}
              {/* Continuation marker when page starts mid-surah */}
              {!g.isNew && gi === 0 && (
                <p className="mushaf-ornament text-center text-sm mb-1" style={{ fontFamily: '"Amiri", serif' }}>
                  {g.surah.name} ❧
                </p>
              )}
              {/* Bismillah (not for Al-Fatiha or At-Tawbah) */}
              {g.isNew && g.surah.number !== 1 && g.surah.number !== 9 && (
                <p className="mushaf-bismillah">بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ</p>
              )}
              {/* Flowing text */}
              <div className="mushaf-text">
                {g.ayahs.map((ayah) => {
                  const bm = getBookmark(ayah.number);
                  const playing = playingAyah?.absoluteNumber === ayah.number;
                  const sel = selectedAyah?.number === ayah.number;
                  const mem = isMemorized(ayah.surah.number, ayah.numberInSurah);
                  return (
                    <span
                      key={ayah.number}
                      onClick={() => onAyahClick(sel ? null : ayah)}
                      className={[
                        "mushaf-word",
                        playing ? "mushaf-playing" : "",
                        mem ? "mushaf-memorized" : "",
                        sel ? "mushaf-selected" : "",
                        bm ? `bookmark-highlight-${bm.color}` : "",
                      ].filter(Boolean).join(" ")}
                    >
                      {ayah.text}{" "}
                      <span className="mushaf-verse-end">﴿{toArabic(ayah.numberInSurah)}﴾</span>{" "}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="qr-sep" />

        {/* ── Page footer ──────────────────────────────────── */}
        <div className="qr-footer" dir="rtl">
          {hizbQ > 0 && quarterIdx !== 4 && (
            <span style={{ fontFamily: '"Amiri", serif', fontSize: "0.7rem", opacity: 0.7 }}>
              {HIZB_SYMBOLS[quarterIdx]} — حزب {toArabic(hizbNum)}
            </span>
          )}
          {(hizbQ === 0 || quarterIdx === 4) && (
            <span style={{ fontFamily: '"Amiri", serif', fontSize: "0.7rem", opacity: 0.7 }}>
              ─── {toArabic(page.number)} ───
            </span>
          )}
        </div>

      </div>
    </div>
  );
}

// ─── Jump panel ───────────────────────────────────────────────────────────────

function JumpPanel({
  currentPage,
  allSurahs,
  onJump,
  onClose,
}: {
  currentPage: number;
  allSurahs: SurahInfo[];
  onJump: (page: number) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"surah" | "page">("surah");
  const [pageInput, setPageInput] = useState("");
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () => !query ? allSurahs : allSurahs.filter(
      (s) => s.englishName.toLowerCase().includes(query.toLowerCase()) ||
             s.name.includes(query) ||
             String(s.number).startsWith(query)
    ),
    [allSurahs, query]
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg bg-card border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[85dvh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <div className="flex gap-1">
            {(["surah", "page"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>
                {t === "surah" ? "Go to Surah" : "Go to Page"}
              </button>
            ))}
          </div>
          <button onClick={onClose} aria-label="Close"
            className="p-2 rounded-xl hover:bg-muted text-muted-foreground min-w-[44px] min-h-[44px] flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Surah tab */}
        {tab === "surah" && (
          <>
            <div className="px-4 pt-3 pb-2 shrink-0">
              <input value={query} onChange={(e) => setQuery(e.target.value)} autoFocus
                placeholder="Search surah…"
                className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary" />
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-border/40">
              {filtered.map((s) => {
                const startPage = SURAH_PAGES[s.number] ?? 1;
                const isCurrent = startPage <= currentPage &&
                  (s.number === 114 || (SURAH_PAGES[s.number + 1] ?? TOTAL + 1) > currentPage);
                return (
                  <button key={s.number}
                    onClick={() => { onJump(startPage); onClose(); }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-muted/50 transition-colors ${isCurrent ? "bg-primary/5" : ""}`}
                  >
                    <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                      {s.number}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{s.englishName}</p>
                      <p className="text-[10px] text-muted-foreground">{s.englishNameTranslation} · {s.numberOfAyahs} ayahs</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p style={{ fontFamily: '"Amiri", serif' }} className="text-base text-muted-foreground">{s.name}</p>
                      <p className="text-[10px] text-primary font-medium">p. {startPage}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Page number tab */}
        {tab === "page" && (
          <div className="p-4 space-y-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const n = parseInt(pageInput);
                if (!isNaN(n) && n >= 1 && n <= TOTAL) { onJump(n); onClose(); }
              }}
            >
              <label className="text-xs font-semibold text-muted-foreground block mb-2">
                Page number (1 – {TOTAL})
              </label>
              <div className="flex gap-2">
                <input
                  autoFocus
                  type="number" min={1} max={TOTAL}
                  value={pageInput}
                  onChange={(e) => setPageInput(e.target.value)}
                  placeholder={`e.g. ${currentPage}`}
                  className="flex-1 bg-muted border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary"
                />
                <button type="submit"
                  className="px-5 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-semibold min-h-[48px]">
                  Go
                </button>
              </div>
            </form>
            {/* Quick juz jumps */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">Jump to Juz</p>
              <div className="grid grid-cols-5 gap-1.5">
                {Array.from({ length: 30 }, (_, i) => {
                  const juzPage = JUZ_START_PAGES[i + 1];
                  return (
                    <button key={i + 1}
                      onClick={() => { onJump(juzPage); onClose(); }}
                      className="py-2 rounded-lg bg-muted hover:bg-primary/10 hover:text-primary text-xs font-semibold transition-colors min-h-[40px]"
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Approximate first page of each juz (standard Medina mushaf)
const JUZ_START_PAGES: Record<number, number> = {
  1:1,2:22,3:42,4:62,5:82,6:102,7:121,8:142,9:162,10:182,
  11:201,12:222,13:242,14:262,15:282,16:302,17:322,18:342,19:362,20:382,
  21:402,22:422,23:442,24:462,25:482,26:502,27:522,28:542,29:562,30:582,
};

// ─── Main reader component ────────────────────────────────────────────────────

function QuranReaderInner() {
  const searchParams = useSearchParams();
  const startPage = Number(searchParams.get("page")) || null;

  const [lastPage, setLastPage] = useLocalStorage<number>("quran-reader-last-page", 1);
  const [currentPage, setCurrentPage] = useState(startPage ?? lastPage);
  const [pageData, setPageData] = useState<QuranPage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [animKey, setAnimKey] = useState(0);
  const [showJump, setShowJump] = useState(false);
  const [allSurahs, setAllSurahs] = useState<SurahInfo[]>([]);
  const [selectedAyah, setSelectedAyah] = useState<PageAyah | null>(null);

  const cache = useRef(new Map<number, QuranPage>());
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const navigating = useRef(false);

  const { getBookmark } = useBookmarks();
  const { currentAyah: playingAyah } = useAudio();
  const { isMemorized, toggleMemorized, canToggle } = useMemorization();

  // ── Fetch with cache ──────────────────────────────────────────────────────
  const fetchPage = useCallback(async (n: number): Promise<QuranPage | null> => {
    if (n < 1 || n > TOTAL) return null;
    if (cache.current.has(n)) return cache.current.get(n)!;
    const data = await fetchQuranPage(n);
    cache.current.set(n, data);
    return data;
  }, []);

  // ── Navigate to page ──────────────────────────────────────────────────────
  const goTo = useCallback(async (n: number) => {
    const p = Math.min(TOTAL, Math.max(1, n));
    if (p === currentPage && pageData) return;
    if (navigating.current) return;
    navigating.current = true;
    setLoading(true);
    setError("");
    try {
      const data = await fetchPage(p);
      if (data) {
        setPageData(data);
        setCurrentPage(p);
        setLastPage(p);
        setAnimKey((k) => k + 1);
        setSelectedAyah(null);
        // Pre-fetch neighbours
        fetchPage(p - 1);
        fetchPage(p + 1);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load page");
    } finally {
      setLoading(false);
      navigating.current = false;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageData, fetchPage, setLastPage]);

  // ── Initial load ──────────────────────────────────────────────────────────
  useEffect(() => {
    const init = startPage ?? lastPage;
    setLoading(true);
    fetchPage(init)
      .then((d) => {
        if (d) { setPageData(d); setAnimKey(1); }
        // Pre-fetch neighbours
        fetchPage(init - 1);
        fetchPage(init + 1);
      })
      .catch((e) => setError(e.message ?? "Failed"))
      .finally(() => setLoading(false));
    fetchAllSurahs().then(setAllSurahs).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Keyboard navigation ───────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowLeft")  goTo(currentPage + 1); // forward (next page)
      if (e.key === "ArrowRight") goTo(currentPage - 1); // backward (prev page)
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [currentPage, goTo]);

  // ── Touch/swipe support ───────────────────────────────────────────────────
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0) goTo(currentPage + 1); // swipe left → next page
      else        goTo(currentPage - 1); // swipe right → prev page
    }
  }, [currentPage, goTo]);

  const canPrev = currentPage > 1;
  const canNext = currentPage < TOTAL;

  return (
    <div
      className="flex flex-col min-h-dvh"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <Header
        title="القرآن الكريم"
        extra={
          <button
            onClick={() => setShowJump((v) => !v)}
            aria-label="Jump to surah or page"
            className="flex items-center gap-1.5 px-3 py-2 text-xs bg-primary/10 text-primary rounded-xl font-medium min-h-[44px] min-w-[44px] justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h8M4 18h12"/>
            </svg>
            <span className="hidden sm:inline">Go to</span>
          </button>
        }
      />

      {/* Side nav buttons (desktop) */}
      <button
        onClick={() => goTo(currentPage - 1)}
        disabled={!canPrev || loading}
        aria-label="Previous page"
        className="qr-sidenav-prev disabled:opacity-20"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6"/></svg>
      </button>
      <button
        onClick={() => goTo(currentPage + 1)}
        disabled={!canNext || loading}
        aria-label="Next page"
        className="qr-sidenav-next disabled:opacity-20"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m9 18 6-6-6-6"/></svg>
      </button>

      {/* Page area */}
      <main className="flex-1 overflow-y-auto pb-20 px-3 py-4">
        <div className="max-w-xl mx-auto space-y-3">

          {/* Loading skeleton */}
          {loading && !pageData && (
            <div className="qr-frame">
              <div className="qr-inner space-y-4 animate-pulse">
                <div className="flex justify-between">
                  <div className="h-4 bg-primary/10 rounded w-28" />
                  <div className="h-4 bg-primary/10 rounded w-10" />
                  <div className="h-4 bg-primary/10 rounded w-20" />
                </div>
                <div className="h-px bg-primary/20" />
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-8 bg-primary/5 rounded" style={{ width: `${70 + (i % 3) * 10}%`, marginLeft: "auto" }} />
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-center">
              <p className="text-red-600 text-sm mb-3">{error}</p>
              <button
                onClick={() => goTo(currentPage)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium"
              >
                Retry
              </button>
            </div>
          )}

          {/* The page */}
          {pageData && (
            <PageFrame
              page={pageData}
              animKey={animKey}
              onAyahClick={setSelectedAyah}
              selectedAyah={selectedAyah}
              getBookmark={getBookmark}
              playingAyah={playingAyah}
              isMemorized={isMemorized}
            />
          )}

          {/* Loading overlay for page transitions */}
          {loading && pageData && (
            <div className="flex justify-center py-2">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Completion */}
          {currentPage === TOTAL && !loading && (
            <p className="text-center qr-footer pt-2" style={{ fontFamily: '"Amiri", serif', fontSize: "1rem" }}>
              ── صَدَقَ اللهُ الْعَظِيمُ ──
            </p>
          )}
        </div>
      </main>

      {/* ── Bottom navigation bar ─────────────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-sm border-t border-border">
        <div className="max-w-xl mx-auto flex items-center h-14 px-3 gap-2">
          {/* Previous (smaller page number) */}
          <button
            onClick={() => goTo(currentPage - 1)}
            disabled={!canPrev || loading}
            aria-label="Previous page"
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-muted text-sm font-medium disabled:opacity-30 hover:bg-primary/10 hover:text-primary transition-colors min-h-[44px]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6"/></svg>
            Prev
          </button>

          {/* Page indicator — tap to open jump */}
          <button
            onClick={() => setShowJump((v) => !v)}
            className="flex-1 flex flex-col items-center justify-center py-1 rounded-xl hover:bg-muted transition-colors min-h-[44px]"
          >
            <span className="text-[9px] text-muted-foreground uppercase tracking-wide">Page</span>
            <span
              className="text-lg font-bold leading-none"
              style={{ fontFamily: '"Amiri", serif', color: "var(--primary)" }}
            >
              {toArabic(currentPage)}
              <span className="text-xs text-muted-foreground font-normal">{" "}/ {toArabic(TOTAL)}</span>
            </span>
          </button>

          {/* Next (larger page number) */}
          <button
            onClick={() => goTo(currentPage + 1)}
            disabled={!canNext || loading}
            aria-label="Next page"
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-muted text-sm font-medium disabled:opacity-30 hover:bg-primary/10 hover:text-primary transition-colors min-h-[44px]"
          >
            Next
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>
      </nav>

      {/* ── Jump panel ───────────────────────────────────────────────── */}
      {showJump && (
        <JumpPanel
          currentPage={currentPage}
          allSurahs={allSurahs}
          onJump={goTo}
          onClose={() => setShowJump(false)}
        />
      )}

      {/* ── Ayah action popup ─────────────────────────────────────────── */}
      {selectedAyah && (
        <div className="fixed bottom-14 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 p-2 bg-card border border-border rounded-2xl shadow-2xl">
          <span className="text-xs text-muted-foreground px-2" style={{ fontFamily: '"Amiri", serif' }}>
            {selectedAyah.surah.name} · {toArabic(selectedAyah.numberInSurah)}
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
              aria-label="Toggle memorized"
              className={`p-1.5 rounded-xl transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center ${
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
            aria-label="Close"
            className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground min-w-[36px] min-h-[36px] flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

export default function QuranPage() {
  return (
    <Suspense>
      <QuranReaderInner />
    </Suspense>
  );
}
