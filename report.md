# Report — Quran Academy (quran-app) Development Process

Source: `git log` on `master`, 50 commits, 2026-06-23 → 2026-08-09.

## Process, in order

1. `7467169` (2026-06-23) — Scaffolded the project with `create-next-app`: Next.js 14, TypeScript, Tailwind CSS, App Router.
2. `e20177f` (2026-06-23) — Built the core reader in one pass: surah index, surah reader, search, bookmarks, audio playback, settings page.
3. `c875f01` (2026-06-27) — Added cover page, green theme, Hadith section, Adhkar section, audio controls, memorization progress tracking.
4. `af1ddde` (2026-06-27) — Added the auth system: roles (student/teacher/parent/admin), classroom module, calendar, in-app messaging, awards system.
5. `bf013c8` (2026-06-27) — Added auth guard, Google OAuth, pre-seeded admin accounts, dynamic teacher signup code, fixed a translation bug.
6. `6f3788f` (2026-06-27) — Added a messages "sent" tab, meeting type field, a user database, fixed the switch component, added a password-visibility eye icon on login, cleaned up signup, enforced unique display names.
7. `e90a520` (2026-06-27) — Added full Arabic/English i18n, fixed dark mode, restricted messaging to admins, removed icon backgrounds.
8. `41246c6` (2026-06-28) — Moved memorization progress to a single shared localStorage key so it persists per user.
9. `fb84524` (2026-06-28) — Added parent role, sessions, profile themes, mushaf index, reworked messaging.
10. `0ba6917` (2026-06-28) — Built a real page-based mushaf book view with cross-tab data sync; added teacher self-signup.
11. `f1a75c7` (2026-06-28) — Completed the Quran book reader at `/mushaf`.
12. `7f25814` (2026-07-02) — UX pass: multi-child guardian support for parents, EN/AR toggle on auth pages.
13. `a9869b4` (2026-07-02) — Real calendar backend, editable assignments, faster login, general UX improvements.
14. `69b70bb` (2026-07-02) — Fixed a loading-state bug using `useLayoutEffect`, removed a redirect-flicker state.
15. `64e68ea` (2026-07-03) — Admin database overhaul: multi-class student assignment, "expel student" with confirmation, continuous (non-paginated) Quran book view.
16. `06c7565` (2026-07-08) — Added a class ranking system, richer admin class-detail views, mushaf e-book format.
17. `966c767` (2026-07-08) — Search overhaul: filters, fuzzy matching, ayah-level search, reciter shown in player, screen-fit layout, mobile/desktop toggle. `IMPROVEMENTS.md` written against this state of the code.
18. `96d694b` (2026-07-17) — Calendar features, streak system, frameless Quran reader, reciter list updates.
19. `b0fdaf5` (2026-07-17) — Exact screen-fit layout for the reader; local audio with CDN fallback.
20. `5878a87` (2026-07-17) — Switched audio source (first attempt).
21. `29578f9` (2026-07-17) — Reverted the audio switch: moved fully to everyayah.com for all reciters after the first CDN broke playback.
22. `9cb9b27` (2026-07-17) — Removed ayah-per-line display mode; added an expand/collapse arrow to the audio player.
23. `de59b56` (2026-07-17) — Removed "Complete Quran" buttons from the surah index.
24. `0dd16b3` (2026-07-17) — Reversed course: restored line-per-line mode, replaced page-by-page mode with a single "mushaf" button.
25. `a7e76b3` (2026-07-20) — Mushaf visual polish: page corners, surah banner, hizb markers, adaptive font sizing.
26. `ea6063f` (2026-07-20) — Full-screen mushaf layout, two-page spread on desktop, click-to-navigate.
27. `23c269e` (2026-07-20) — Responsive rework: full-width app shell, Islamic background pattern, two-page mushaf spine.
28. `92a9de6` (2026-07-20) — Restored mobile mode: added mode-based width constraint (`max-w-[480px] mx-auto`) to `Shell` and `BottomNav`.
29. `121c7de` (2026-07-20) — Mobile mode: clipped overflow, forced single-page mushaf on mobile.
30. `cb18866` (2026-07-20) — Calendar: removed emojis, added deadline-time field, day-click popup, full i18n.
31. `3ba3fd1` (2026-07-20) — Calendar: unified the "goal" event type to use a single "Target time" field like deadlines.
32. `2dff34e` (2026-07-20) — Calendar: rich audience targeting, class-private events, admin class calendar.
33. `8cf2cd5` (2026-07-20) — Calendar & classroom: per-person audience checklist, multi-teacher classes.
34. `72ac1a3` (2026-07-20) — Showed upcoming calendar events for students on the classroom page.
35. `5babc5b` (2026-07-20) — Overhauled the student classroom page with calendar and boxed events.
36. `0840879` (2026-07-20) — Fixed unused-variable build errors in the admin page.
37. `c08202f` (2026-07-20) — Moved student events to the calendar page; inverted message read/unread colors.
38. `729a89e` (2026-07-20) — Redirected students from the sessions page to the calendar; fixed message unread styling.
39. `505bb88` (2026-07-20) — Styled unread inbox messages with a green highlight.
40. `5b83089` (2026-07-21) — Redesigned the homepage with an Arabic-geometric, herbaceous landing page.
41. `2298363` (2026-07-21) — Wired up the real logo and app name; fixed home navigation.
42. `196c612` (2026-07-21) — Re-themed the homepage: cyan/gold/blue/yellow palette, "Go to App" CTA.
43. `4b007d4` (2026-07-21) — White homepage with a mosque SVG; replaced dark-mode green with cyan/navy.
44. `872edd7` (2026-07-21) — Removed the mosque SVG, added an Alcázar background photo, thickened geometric lines to 3px.
45. `afb334b` (2026-07-21) — Swapped the background to `mosque_bg.png`; restyled the login page to match the homepage.
46. `ac93065` (2026-07-21) — Made the homepage public so it loads first for all visitors.
47. `45d8bec` (2026-07-21) — Restyled the signup page to match the homepage/login aesthetic.
48. `9e83b56` (2026-08-04) — Security hardening and redesign pass:
    - PBKDF2 password hashing via Web Crypto API, with transparent migration from plaintext.
    - Removed hardcoded admin credentials; admins authenticate via Google OAuth only.
    - Added per-email login rate limiting (5 attempts → 60s lockout).
    - Added security headers: X-Frame-Options, CSP, Referrer-Policy, Permissions-Policy.
    - Closed an open-redirect vector; enforced Google `email_verified` in NextAuth callbacks.
    - Switched ID and parent-code generation to `crypto.randomUUID()`.
    - Redesigned login and signup pages (larger logo, bigger touch targets, role cards, password-strength meter, step indicator, email-verification screen).
    - Added a branded homepage tagline section with animated Student/Teacher/Parent role pills.
    - Wired real Supabase credentials for the live email-verification flow.
49. `b00c263` (2026-08-09) — Reviewed `IMPROVEMENTS.md` against the current codebase and updated it: verified all 5 listed High Priority issues were already fixed by commits `92a9de6` (mobile-mode layout), the current `ViewModeToggle.tsx`, `SurahReader.tsx` (mushaf search), and `src/data/hizb.ts`/`src/data/juz.ts` (exact juz/hizb boundaries + separated filter state in `search/page.tsx`). Also found Medium/Low items #6, #8, #9, #11, #12, #14 already resolved. Rewrote the doc's High Priority section into a "Resolved" section and removed the stale entries.
50. `be28b7b` (2026-08-09) — Added `report.md` documenting the verification pass in item 49.

## Today (2026-08-09)

- Extracted the project from `quran-app-20260807T165233Z-1-001.zip` into `~/Projects/quran-app`, preserving git history and the `origin` remote.
- Verified and updated `IMPROVEMENTS.md` (commit `b00c263`).
- Wrote and committed `report.md` (commit `be28b7b`).
- Pushed both commits to `origin/master` over SSH after registering a new SSH key (`yassinebouaoudatekhaffane@gmail.com`) with the `YassineBK-max` GitHub account and switching the remote from HTTPS to `git@github.com:YassineBK-max/quran-app.git`.
