# Improvements Backlog

Identified issues and enhancements in the current implementation. Ordered by priority.

---

## High Priority

### 1. Mobile mode: fixed elements ignore the centered container
**File:** `src/app/providers.tsx` — `Shell` component  
The `max-w-[480px] mx-auto` wrapper constrains normal content flow but `BottomNav`, `AudioPlayer`, and `Header` are all `fixed left-0 right-0`, so they span the full viewport regardless of the mode. In mobile mode on a wide screen the "phone frame" is centered but the nav/player bars still go edge-to-edge. Fix: wrap the fixed elements in a `max-w-[480px] mx-auto` constraint too, or use a CSS `@container` approach.

### 2. ViewModeToggle button floats outside the mobile container
**File:** `src/components/ui/ViewModeToggle.tsx`  
The button is `fixed bottom-20 right-4` which is 16 px from the right edge of the *viewport*, not the 480 px container. On a wide desktop in mobile mode the button sits far to the right of the phone frame. Fix: position it relative to the container (e.g. `absolute` inside a full-height wrapper, or use `right: max(16px, calc(50vw - 240px + 16px))`).

### 3. Ayah search does nothing in mushaf display mode
**File:** `src/components/surah/SurahReader.tsx`  
The search bar is shown regardless of display mode, but `MushafDisplay` always receives `surah.ayahs` (unfiltered). The filter only applies in `ayah-per-line` mode. Fix: either pass `filteredAyahs` to `MushafDisplay` as well, or hide the search toggle when the display mode is `"mushaf"`.

### 4. Hizb filter is only an approximation
**File:** `src/app/search/page.tsx`  
Hizb N is mapped to `Math.ceil(N/2)` juz, which is inaccurate. True hizb boundaries fall at specific surah:ayah positions within a juz, not exactly at the midpoint. The existing `src/data/hizb.ts` has hizb names but no boundary data. Fix: add a `HIZB_STARTS: [number, number][]` array (60 entries, same format as `JUZ_STARTS`) and use it to compute the exact hizb for a given surah+ayah.

### 5. Juz and Hizb filters share the same state, causing confusing UI
**File:** `src/app/search/page.tsx`  
Both filter groups write to `filterJuz`. Selecting hizb 3 silently sets filterJuz = 2, which also lights up the Juz 2 chip. Selecting juz 2 lights up hizbz 3 and 4. Users cannot tell which filter is "active". Fix: use separate `filterJuz` and `filterHizb` states, or collapse the two into a single selector with a clear label showing what's applied.

---

## Medium Priority

### 6. JUZ_STARTS array is duplicated / not in a shared file
**File:** `src/app/search/page.tsx`  
The 30-entry `JUZ_STARTS` array (mapping juz → surah:ayah) lives only in the search page. Any future component needing juz data (e.g. the `/quran` reader, the mushaf, surah detail) would duplicate it. Fix: move it to `src/data/juz.ts` alongside `hizb.ts` and export `getJuzForAyah()` from there.

### 7. Screen-fitting max-height is a fixed pixel estimate
**Files:** `src/app/globals.css` (`.qr-inner`, `.mushaf-book`)  
`calc(100dvh - 260px)` and `calc(100dvh - 200px)` are hard-coded magic numbers that do not adapt when the AudioPlayer is visible/expanded or when the quran page's own page-nav bar changes height. On devices with unusual browser chrome these can be too tall or too short. Fix: use CSS custom properties (`--player-h`, `--nav-h`) set by JavaScript when those elements mount/unmount, or use a ResizeObserver.

### 8. Reciter restart race condition on rapid selection
**File:** `src/components/audio/AudioPlayer.tsx`  
If the user clicks two reciters quickly, `pendingRestartRef.current` is overwritten before the first `useEffect` fires. The second reciter's effect sees `pendingRestartRef.current = null` and doesn't restart. The audio stops but does not resume. Fix: store the pending ayah in state (not a ref) so each reciter change triggers a fresh effect, or debounce the `changeReciter` call.

### 9. Reciter selector does not auto-scroll to the active reciter
**File:** `src/components/audio/AudioPlayer.tsx`  
The expanded panel lists 11 reciters in a `max-h-36 overflow-y-auto` scroll box. When the panel opens, the currently selected reciter may be off-screen. Fix: add `useEffect` to scroll the active reciter button into view when the panel opens (`element.scrollIntoView({ block: "nearest" })`).

### 10. Fuzzy search in surah name search (filter panel) is exact-include only for Arabic
**File:** `src/app/search/page.tsx`  
The `fuzzyMatch` function normalizes and does subsequence matching for English names but if the user types Arabic, it relies on `.includes()` at the JS level. Arabic transliteration variations ("al-fatiha" vs "al fatiha") are handled but Arabic script exact matching may miss near-matches. Lower priority since Arabic search is rare in the name filter.

---

## Low Priority

### 11. Filter toggle button lacks aria-expanded
**File:** `src/app/search/page.tsx`  
The filter funnel button has `aria-label="Toggle filters"` but no `aria-expanded` attribute indicating whether the filter panel is open. Screen readers cannot inform the user of the current state. Fix: add `aria-expanded={showFilters}`.

### 12. Juz/Hizb chips in the filter panel lack descriptive aria-labels
**File:** `src/app/search/page.tsx`  
The 30 juz buttons say "1"–"30" with no aria-label. A screen reader would announce "button 3" with no context. Fix: add `aria-label={`Filter by Juz ${juz}`}` to each chip.

### 13. `qr-inner` scrollbar color is theme-specific (gold)
**File:** `src/app/globals.css`  
The scrollbar uses a hardcoded gold tint (`rgba(154,118,48,...)`). This fits the classic theme but clashes with futuristic/glass/simple/8bit themes. Fix: use a CSS variable (`var(--primary)`) for the scrollbar thumb color so it adapts automatically.

### 14. AudioPlayer `useEffect` for reciter change fires on initial mount
**File:** `src/components/audio/AudioPlayer.tsx`  
The `useEffect([settings.reciterEdition])` runs on mount as well as on change. On mount `pendingRestartRef.current` is null so nothing happens — the behaviour is correct. But it's a subtle assumption. Fix: use a `useRef(false)` mounted guard or `useEffect` with a comparison to the previous value to make intent explicit.

### 15. SurahReader: ayah search result count shown below input but above basmala
**File:** `src/components/surah/SurahReader.tsx`  
When the search bar is shown and `displayMode === "ayah-per-line"`, the match count appears between the search input and the Basmala, which can look disjointed. Minor visual issue, no functional impact.
