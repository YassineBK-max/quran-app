"use client";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useT } from "@/hooks/useT";

// ── Herbaceous-khatam signature background ────────────────────────────────
function SignatureBg() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Khatam diamond grid – gold */}
        <pattern id="hp-khatam" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
          <g fill="none" stroke="#d4a843" strokeLinecap="round">
            <path d="M60 4 L116 60 L60 116 L4 60 Z" strokeWidth="0.9" opacity="0.08"/>
            <path d="M60 32 L88 60 L60 88 L32 60 Z" strokeWidth="0.6" opacity="0.07"/>
            <line x1="60" y1="4"   x2="60" y2="32"  strokeWidth="0.4" opacity="0.06"/>
            <line x1="116" y1="60" x2="88" y2="60"  strokeWidth="0.4" opacity="0.06"/>
            <line x1="60" y1="116" x2="60" y2="88"  strokeWidth="0.4" opacity="0.06"/>
            <line x1="4"  y1="60"  x2="32" y2="60"  strokeWidth="0.4" opacity="0.06"/>
            <line x1="60" y1="4"   x2="88" y2="32"  strokeWidth="0.3" opacity="0.04"/>
            <line x1="116" y1="60" x2="88" y2="88"  strokeWidth="0.3" opacity="0.04"/>
            <line x1="60" y1="116" x2="32" y2="88"  strokeWidth="0.3" opacity="0.04"/>
            <line x1="4"  y1="60"  x2="32" y2="32"  strokeWidth="0.3" opacity="0.04"/>
            <circle cx="0"   cy="0"   r="1.5" fill="#d4a843" opacity="0.28"/>
            <circle cx="120" cy="0"   r="1.5" fill="#d4a843" opacity="0.28"/>
            <circle cx="0"   cy="120" r="1.5" fill="#d4a843" opacity="0.28"/>
            <circle cx="120" cy="120" r="1.5" fill="#d4a843" opacity="0.28"/>
          </g>
        </pattern>

        {/* Herbaceous vines – seamless 240×240 diagonal tile */}
        <pattern id="hp-vine" x="0" y="0" width="240" height="240" patternUnits="userSpaceOnUse">
          <g fill="none" stroke="#3a7a50" strokeLinecap="round" strokeLinejoin="round">
            {/* Primary diagonal: bottom-left to top-right */}
            <path d="M0,120 C30,95 90,30 120,0"       strokeWidth="0.9" opacity="0.12"/>
            <path d="M120,240 C150,215 210,150 240,120" strokeWidth="0.9" opacity="0.12"/>
            {/* Secondary diagonal (cross): top-left to bottom-right */}
            <path d="M0,0 C30,25 95,90 120,120"         strokeWidth="0.65" opacity="0.07"/>
            <path d="M120,120 C150,145 205,210 240,240"  strokeWidth="0.65" opacity="0.07"/>
            {/* Branch 1 off primary near (58,62) */}
            <path d="M58,62 C48,52 42,56 35,46"  strokeWidth="0.6" opacity="0.1"/>
            <path d="M35,46 C29,38 38,34 35,46"  fill="#3a7a50" strokeWidth="0" opacity="0.08"/>
            <path d="M35,46 C27,42 34,52 35,46"  fill="#3a7a50" strokeWidth="0" opacity="0.08"/>
            {/* Branch 2 near (84,36) */}
            <path d="M84,37 C91,26 100,29 107,20" strokeWidth="0.6" opacity="0.1"/>
            <path d="M107,20 C113,12 118,19 107,20" fill="#3a7a50" strokeWidth="0" opacity="0.08"/>
            <path d="M107,20 C100,12 114,13 107,20" fill="#3a7a50" strokeWidth="0" opacity="0.08"/>
            {/* Curl near (46,72) */}
            <path d="M46,72 C42,64 50,60 46,72" strokeWidth="0.5" opacity="0.08"/>
            {/* Branch 3 on mirrored stem near (178,182) */}
            <path d="M177,183 C188,172 198,177 205,167" strokeWidth="0.6" opacity="0.1"/>
            <path d="M205,167 C211,159 217,165 205,167" fill="#3a7a50" strokeWidth="0" opacity="0.08"/>
            {/* Branch 4 near (143,212) */}
            <path d="M143,212 C132,202 127,207 119,199" strokeWidth="0.6" opacity="0.1"/>
            <path d="M119,199 C111,191 120,187 119,199" fill="#3a7a50" strokeWidth="0" opacity="0.08"/>
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#hp-khatam)"/>
      <rect width="100%" height="100%" fill="url(#hp-vine)"/>
    </svg>
  );
}

// ── Corner fan medallions ─────────────────────────────────────────────────
function CornerFan({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) {
  const cls = { tl: "top-0 left-0", tr: "top-0 right-0", bl: "bottom-0 left-0", br: "bottom-0 right-0" }[pos];
  const sx = pos === "tr" || pos === "br" ? -1 : 1;
  const sy = pos === "bl" || pos === "br" ? -1 : 1;
  return (
    <svg
      className={`absolute ${cls} pointer-events-none`}
      width="150" height="150"
      viewBox="0 0 150 150"
      fill="none"
      aria-hidden="true"
      style={{ transform: `scale(${sx},${sy})` }}
    >
      <path d="M0,0 Q150,0 150,150" stroke="#d4a843" strokeWidth="0.8" opacity="0.13"/>
      <path d="M0,0 Q112,0 112,112" stroke="#d4a843" strokeWidth="0.6" opacity="0.10"/>
      <path d="M0,0 Q75,0 75,75"   stroke="#d4a843" strokeWidth="0.5" opacity="0.08"/>
      <line x1="0" y1="0" x2="75"  y2="75"  stroke="#d4a843" strokeWidth="0.4" opacity="0.09"/>
      <line x1="0" y1="0" x2="105" y2="42"  stroke="#d4a843" strokeWidth="0.4" opacity="0.07"/>
      <line x1="0" y1="0" x2="42"  y2="105" stroke="#d4a843" strokeWidth="0.4" opacity="0.07"/>
      <polygon points="14,3 17,10 24,10 18,15 20,22 14,17 8,22 10,15 4,10 11,10"
        fill="#d4a843" opacity="0.20"/>
      <path d="M38,0 C30,20 8,28 0,42 C14,24 28,12 38,0" fill="#3a7a50" opacity="0.11"/>
      <path d="M0,38 C20,30 28,8 42,0 C24,14 12,28 0,38" fill="#3a7a50" opacity="0.07"/>
    </svg>
  );
}

// ── 8-Point star emblem ───────────────────────────────────────────────────
function StarEmblem() {
  return (
    <svg
      width="62" height="62" viewBox="0 0 72 72" fill="none" aria-hidden="true"
      className="drop-shadow-[0_0_22px_rgba(212,168,67,0.38)]"
    >
      <circle cx="36" cy="36" r="33" stroke="#d4a843" strokeWidth="0.5" opacity="0.28"/>
      <circle cx="36" cy="36" r="27" stroke="#d4a843" strokeWidth="0.35" opacity="0.18"/>
      <polygon
        points="36,6 40,22 56,14 48,30 66,36 48,42 56,58 40,50 36,66 32,50 16,58 24,42 6,36 24,30 16,14 32,22"
        fill="#d4a843" opacity="0.88"
      />
      <circle cx="36" cy="36" r="8" fill="none" stroke="rgba(255,255,255,0.17)" strokeWidth="1"/>
      <circle cx="36" cy="36" r="3" fill="rgba(255,255,255,0.14)"/>
    </svg>
  );
}

// ── Globe icon ────────────────────────────────────────────────────────────
function GlobeIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/>
      <path d="M2 12h20"/>
      <path d="M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/>
    </svg>
  );
}

// ── 8-point mini star ─────────────────────────────────────────────────────
function MiniStar() {
  return (
    <svg width="9" height="9" viewBox="0 0 10 10" fill="#0c1a0e" aria-hidden="true">
      <polygon points="5,0 6,4 10,5 6,6 5,10 4,6 0,5 4,4"/>
    </svg>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────
export default function HomePage() {
  const { user, logout } = useAuth();
  const { settings, updateSettings } = useSettings();
  const t = useT();
  const isAr = settings.language === "ar";

  const toggleLang = () => updateSettings({ language: isAr ? "en" : "ar" });

  return (
    <div
      className="min-h-dvh flex flex-col relative overflow-hidden"
      style={{ background: "linear-gradient(155deg, #081610 0%, #0e2418 45%, #0c2016 100%)" }}
    >
      {/* Background layers */}
      <SignatureBg />
      <CornerFan pos="tl" />
      <CornerFan pos="tr" />
      <CornerFan pos="bl" />
      <CornerFan pos="br" />

      {/* Radial ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 65% 55% at 50% 38%, rgba(212,168,67,0.035) 0%, transparent 70%)",
        }}
      />

      {/* ── Top bar ───────────────────────────────────────────────── */}
      <header
        className="relative z-20 flex items-center justify-between px-5 py-3 gap-3"
        style={{ borderBottom: "1px solid rgba(212,168,67,0.1)" }}
      >
        {/* Top gold accent line */}
        <div
          className="absolute top-0 inset-x-0 h-px"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(212,168,67,0.48), transparent)",
          }}
        />

        {/* Left: logo + app name */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Image
            src="/logo-qapp.png"
            alt="The Quran Academy"
            width={32}
            height={32}
            className="rounded-md"
          />
          <span
            className="hidden sm:block text-sm font-semibold"
            style={{ color: "#f0d890", fontFamily: '"Cairo", sans-serif' }}
          >
            The Quran Academy
          </span>
        </div>

        {/* Right: controls */}
        <nav className="flex items-center gap-1.5">
          {/* Language toggle */}
          <button
            onClick={toggleLang}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg min-h-[34px] transition-colors"
            style={{
              color: "rgba(212,168,67,0.72)",
              border: "1px solid rgba(212,168,67,0.18)",
              background: "rgba(212,168,67,0.03)",
              fontFamily: '"Cairo", sans-serif',
            }}
          >
            <GlobeIcon />
            <span>{isAr ? "English" : "العربية"}</span>
          </button>

          {user ? (
            <>
              {/* Logged-in: user name + sign out */}
              <span
                className="hidden sm:block text-xs"
                style={{ color: "rgba(212,235,200,0.65)", fontFamily: '"Cairo", sans-serif' }}
              >
                {user.displayName ?? user.name}
              </span>
              <button
                onClick={logout}
                className="text-xs px-3.5 py-1.5 rounded-lg min-h-[34px] flex items-center font-medium transition-colors hover:bg-white/5"
                style={{
                  color: "rgba(212,168,67,0.85)",
                  border: "1px solid rgba(212,168,67,0.28)",
                  background: "rgba(212,168,67,0.04)",
                  fontFamily: '"Cairo", sans-serif',
                }}
              >
                {t.signout}
              </button>
            </>
          ) : (
            <>
              {/* Logged-out: Contact Us + Sign In + Sign Up */}
              <a
                href="#contact"
                className="hidden sm:flex items-center text-xs px-3 py-1.5 rounded-lg min-h-[34px] transition-colors"
                style={{ color: "rgba(212,235,200,0.55)", fontFamily: '"Cairo", sans-serif' }}
              >
                {isAr ? "اتصل بنا" : "Contact Us"}
              </a>
              <Link
                href="/login"
                className="text-xs px-3.5 py-1.5 rounded-lg min-h-[34px] flex items-center font-medium transition-colors hover:bg-white/5"
                style={{
                  color: "rgba(212,168,67,0.85)",
                  border: "1px solid rgba(212,168,67,0.28)",
                  background: "rgba(212,168,67,0.04)",
                  fontFamily: '"Cairo", sans-serif',
                }}
              >
                {t.signin}
              </Link>
              <Link
                href="/signup"
                className="flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-lg min-h-[34px] font-semibold transition-opacity hover:opacity-90 active:scale-[0.98]"
                style={{
                  background: "linear-gradient(135deg, #b07a20 0%, #d4a843 55%, #e8c04a 100%)",
                  color: "#091510",
                  fontFamily: '"Cairo", sans-serif',
                  boxShadow: "0 1px 10px rgba(212,168,67,0.25), inset 0 1px 0 rgba(255,255,255,0.14)",
                }}
              >
                <MiniStar />
                {t.signup}
              </Link>
            </>
          )}
        </nav>
      </header>

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-14 text-center">

        {/* 8-point star emblem */}
        <div className="mb-6">
          <StarEmblem />
        </div>

        {/* Arabic title */}
        <h1
          className="text-5xl sm:text-6xl font-bold leading-tight mb-1"
          style={{ fontFamily: '"Amiri", serif', color: "#f0ead0" }}
        >
          القرآن الكريم
        </h1>
        <p
          className="text-[10px] tracking-[0.32em] uppercase mb-7"
          style={{ color: "rgba(212,168,67,0.58)", fontFamily: '"Cairo", sans-serif' }}
        >
          The Noble Quran
        </p>

        {/* Gold ornamental rule */}
        <div className="flex items-center gap-3 mb-9 w-full max-w-[280px]">
          <div
            className="flex-1 h-px"
            style={{
              background: "linear-gradient(to right, transparent, rgba(212,168,67,0.42))",
            }}
          />
          <svg width="10" height="10" viewBox="0 0 10 10" fill="#d4a843" opacity="0.6" aria-hidden="true">
            <polygon points="5,0 6,4 10,5 6,6 5,10 4,6 0,5 4,4"/>
          </svg>
          <div
            className="flex-1 h-px"
            style={{
              background: "linear-gradient(to left, transparent, rgba(212,168,67,0.42))",
            }}
          />
        </div>

        {/* Islamic quote card */}
        <div
          className="w-full max-w-sm mb-10 rounded-2xl p-5"
          style={{
            background: "rgba(255,255,255,0.035)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            border: "1px solid rgba(212,168,67,0.15)",
            borderLeftWidth: isAr ? 1 : 4,
            borderRightWidth: isAr ? 4 : 1,
            borderLeftColor: isAr
              ? "rgba(212,168,67,0.15)"
              : "rgba(212,168,67,0.75)",
            borderRightColor: isAr
              ? "rgba(212,168,67,0.75)"
              : "rgba(212,168,67,0.15)",
          }}
        >
          <p
            className="text-xl mb-3 leading-loose"
            style={{
              fontFamily: '"Amiri", serif',
              color: "rgba(240,232,208,0.9)",
              direction: "rtl",
              textAlign: "right",
            }}
          >
            إِنَّا أَنزَلْنَاهُ قُرْآنًا عَرَبِيًّا لَّعَلَّكُمْ تَعْقِلُونَ
          </p>
          <p
            className="text-xs italic mb-2 leading-relaxed"
            style={{
              color: "rgba(210,200,175,0.62)",
              fontFamily: '"Cairo", sans-serif',
              textAlign: isAr ? "right" : "left",
              direction: isAr ? "rtl" : "ltr",
            }}
          >
            &ldquo;Indeed, We revealed it as an Arabic Quran so that you may understand.&rdquo;
          </p>
          <p
            className="text-[10px] tracking-widest"
            style={{
              color: "rgba(212,168,67,0.48)",
              fontFamily: '"Cairo", sans-serif',
              textAlign: isAr ? "right" : "left",
            }}
          >
            — Surah Yusuf 12:2
          </p>
        </div>

        {/* Institution name + tagline placeholder */}
        <div className="flex flex-col items-center gap-2.5">
          <span
            className="text-sm font-semibold tracking-wide"
            style={{ color: "rgba(212,168,67,0.55)", fontFamily: '"Cairo", sans-serif' }}
          >
            The Quran Academy
          </span>
          <span
            className="text-xs font-mono tracking-wider"
            style={{
              color: "rgba(212,168,67,0.24)",
              border: "1px dashed rgba(212,168,67,0.14)",
              borderRadius: "3px",
              padding: "3px 14px",
            }}
          >
            [ Your tagline or description ]
          </span>
        </div>
      </main>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer className="relative z-10 flex items-center justify-center pb-5 gap-5">
        <div
          className="h-px w-20"
          style={{
            background: "linear-gradient(to right, transparent, rgba(212,168,67,0.18))",
          }}
        />
        <span
          className="text-[9px] font-mono tracking-widest"
          style={{
            color: "rgba(212,168,67,0.2)",
            border: "1px dashed rgba(212,168,67,0.13)",
            borderRadius: "2px",
            padding: "2px 8px",
          }}
        >
          © 2025 — The Quran Academy
        </span>
        <div
          className="h-px w-20"
          style={{
            background: "linear-gradient(to left, transparent, rgba(212,168,67,0.18))",
          }}
        />
      </footer>
    </div>
  );
}
