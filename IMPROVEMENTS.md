# Improvements Backlog

Identified issues and enhancements in the current implementation. Ordered by priority.

---

## Resolved

All five originally-listed High Priority items were fixed by later commits and are confirmed resolved in the current codebase (verified 2026-08-09):

1. **Mobile mode fixed elements** — `Shell` (`src/app/providers.tsx`), `BottomNav`, and `AudioPlayer` now each apply a mode-aware inner constraint (`max-w-[480px] mx-auto` in mobile mode, wider in desktop mode) around their content, so buttons/player controls stay centered under the phone-frame layout. Fixed in `92a9de6` ("Restore mobile mode: mode-based width constraint in Shell and BottomNav").
2. **ViewModeToggle floating off-container** — now positioned with `right: max(1rem, calc(50vw - 224px))` in mobile mode, keeping it aligned to the 480px container instead of the viewport edge.
3. **Ayah search inert in mushaf mode** — the search toggle button is now hidden entirely when `displayMode === "mushaf"` (`SurahReader.tsx`), and query/visibility state is cleared on switching into that mode, so there's no dead search UI to trigger.
4. **Hizb filter approximation** — `src/data/hizb.ts` now has a full 60-entry `HIZB_STARTS` boundary table and an exact `getHizbForAyah()`, mirroring `getJuzForAyah()` in `src/data/juz.ts`. `search/page.tsx` uses both.
5. **Juz/Hizb shared filter state** — `search/page.tsx` now has independent `filterJuz`/`filterHizb` state, and selecting one explicitly clears the other so only one chip set highlights at a time.

Bonus: while verifying #4, medium-priority item #6 (duplicated `JUZ_STARTS`) turned out resolved too — it now lives in `src/data/juz.ts` and is imported wherever needed.

---

## Medium Priority

(Items 6, 8, and 9 from the original list — JUZ_STARTS duplication, reciter restart race condition, reciter auto-scroll — are also resolved; see `src/data/juz.ts` and the state-based `pendingRestart` + `reciterListRef` auto-scroll effect in `AudioPlayer.tsx`.)

### 7. Screen-fitting max-height is a fixed pixel estimate
**Files:** `src/app/globals.css` (`.qr-inner`, `.mushaf-book`)  
`calc(100dvh - 260px)` and `calc(100dvh - 200px)` are hard-coded magic numbers that do not adapt when the AudioPlayer is visible/expanded or when the quran page's own page-nav bar changes height. On devices with unusual browser chrome these can be too tall or too short. Fix: use CSS custom properties (`--player-h`, `--nav-h`) set by JavaScript when those elements mount/unmount, or use a ResizeObserver.

### 10. Fuzzy search in surah name search (filter panel) is exact-include only for Arabic
**File:** `src/app/search/page.tsx`  
The `fuzzyMatch` function normalizes and does subsequence matching for English names but if the user types Arabic, it relies on `.includes()` at the JS level. Arabic transliteration variations ("al-fatiha" vs "al fatiha") are handled but Arabic script exact matching may miss near-matches. Lower priority since Arabic search is rare in the name filter.

---

## Low Priority

(Items 11, 12, and 14 — missing `aria-expanded`, missing Juz/Hizb chip `aria-label`s, and the implicit AudioPlayer mount assumption — are also resolved: `search/page.tsx` now sets `aria-expanded={showFilters}` and per-chip `aria-label`s, and `AudioPlayer.tsx` uses an explicit `mountedRef` guard.)

### 13. `qr-inner` scrollbar color is theme-specific (gold)
**File:** `src/app/globals.css`  
The scrollbar uses a hardcoded gold tint (`rgba(154,118,48,...)`). This fits the classic theme but clashes with futuristic/glass/simple/8bit themes. Fix: use a CSS variable (`var(--primary)`) for the scrollbar thumb color so it adapts automatically.

### 15. SurahReader: ayah search result count shown below input but above basmala
**File:** `src/components/surah/SurahReader.tsx`  
When the search bar is shown and `displayMode === "ayah-per-line"`, the match count appears between the search input and the Basmala, which can look disjointed. Minor visual issue, no functional impact.
