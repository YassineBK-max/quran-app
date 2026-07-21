"use client";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useT } from "@/hooks/useT";

// ── Geometric background – visible on white ───────────────────────────────
function SignatureBg() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Khatam grid – gold outer, cyan inner */}
        <pattern id="hp-khatam" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
          <g fill="none" strokeLinecap="round">
            <path d="M60 4 L116 60 L60 116 L4 60 Z"  stroke="#d4a843" strokeWidth="0.9" opacity="0.13"/>
            <path d="M60 32 L88 60 L60 88 L32 60 Z"  stroke="#00b8d4" strokeWidth="0.6" opacity="0.09"/>
            <line x1="60" y1="4"   x2="60" y2="32"  stroke="#d4a843" strokeWidth="0.4" opacity="0.08"/>
            <line x1="116" y1="60" x2="88" y2="60"  stroke="#d4a843" strokeWidth="0.4" opacity="0.08"/>
            <line x1="60" y1="116" x2="60" y2="88"  stroke="#d4a843" strokeWidth="0.4" opacity="0.08"/>
            <line x1="4"  y1="60"  x2="32" y2="60"  stroke="#d4a843" strokeWidth="0.4" opacity="0.08"/>
            <line x1="60" y1="4"   x2="88" y2="32"  stroke="#00b8d4" strokeWidth="0.3" opacity="0.06"/>
            <line x1="116" y1="60" x2="88" y2="88"  stroke="#00b8d4" strokeWidth="0.3" opacity="0.06"/>
            <line x1="60" y1="116" x2="32" y2="88"  stroke="#00b8d4" strokeWidth="0.3" opacity="0.06"/>
            <line x1="4"  y1="60"  x2="32" y2="32"  stroke="#00b8d4" strokeWidth="0.3" opacity="0.06"/>
            <circle cx="0"   cy="0"   r="1.5" fill="#d4a843" opacity="0.35"/>
            <circle cx="120" cy="0"   r="1.5" fill="#00b8d4" opacity="0.3"/>
            <circle cx="0"   cy="120" r="1.5" fill="#00b8d4" opacity="0.3"/>
            <circle cx="120" cy="120" r="1.5" fill="#d4a843" opacity="0.35"/>
          </g>
        </pattern>

        {/* Herbaceous vines – deep blue */}
        <pattern id="hp-vine" x="0" y="0" width="240" height="240" patternUnits="userSpaceOnUse">
          <g fill="none" stroke="#1a3a6e" strokeLinecap="round" strokeLinejoin="round">
            <path d="M0,120 C30,95 90,30 120,0"        strokeWidth="0.8" opacity="0.07"/>
            <path d="M120,240 C150,215 210,150 240,120"  strokeWidth="0.8" opacity="0.07"/>
            <path d="M0,0 C30,25 95,90 120,120"          strokeWidth="0.55" opacity="0.04"/>
            <path d="M120,120 C150,145 205,210 240,240"   strokeWidth="0.55" opacity="0.04"/>
            <path d="M58,62 C48,52 42,56 35,46"    strokeWidth="0.55" opacity="0.06"/>
            <path d="M35,46 C29,38 38,34 35,46"    fill="#1a3a6e" strokeWidth="0" opacity="0.06"/>
            <path d="M35,46 C27,42 34,52 35,46"    fill="#1a3a6e" strokeWidth="0" opacity="0.06"/>
            <path d="M84,37 C91,26 100,29 107,20"  strokeWidth="0.55" opacity="0.06"/>
            <path d="M107,20 C113,12 118,19 107,20" fill="#1a3a6e" strokeWidth="0" opacity="0.06"/>
            <path d="M107,20 C100,12 114,13 107,20" fill="#1a3a6e" strokeWidth="0" opacity="0.06"/>
            <path d="M177,183 C188,172 198,177 205,167" strokeWidth="0.55" opacity="0.06"/>
            <path d="M143,212 C132,202 127,207 119,199"  strokeWidth="0.55" opacity="0.06"/>
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#hp-khatam)"/>
      <rect width="100%" height="100%" fill="url(#hp-vine)"/>
    </svg>
  );
}

// ── Corner fans – gold + cyan ─────────────────────────────────────────────
function CornerFan({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) {
  const cls = { tl: "top-0 left-0", tr: "top-0 right-0", bl: "bottom-0 left-0", br: "bottom-0 right-0" }[pos];
  const sx = pos === "tr" || pos === "br" ? -1 : 1;
  const sy = pos === "bl" || pos === "br" ? -1 : 1;
  return (
    <svg
      className={`absolute ${cls} pointer-events-none`}
      width="140" height="140" viewBox="0 0 140 140" fill="none" aria-hidden="true"
      style={{ transform: `scale(${sx},${sy})` }}
    >
      <path d="M0,0 Q140,0 140,140" stroke="#d4a843" strokeWidth="0.8" opacity="0.18"/>
      <path d="M0,0 Q105,0 105,105" stroke="#00b8d4" strokeWidth="0.6" opacity="0.13"/>
      <path d="M0,0 Q70,0 70,70"   stroke="#d4a843" strokeWidth="0.5" opacity="0.1"/>
      <line x1="0" y1="0" x2="70"  y2="70"  stroke="#d4a843" strokeWidth="0.4" opacity="0.12"/>
      <line x1="0" y1="0" x2="98"  y2="40"  stroke="#00b8d4" strokeWidth="0.4" opacity="0.09"/>
      <line x1="0" y1="0" x2="40"  y2="98"  stroke="#00b8d4" strokeWidth="0.4" opacity="0.09"/>
      <polygon points="13,3 16,10 23,10 17,14 19,21 13,17 7,21 9,14 3,10 10,10"
        fill="#d4a843" opacity="0.30"/>
      <path d="M36,0 C28,18 7,26 0,40 C13,22 26,10 36,0" fill="#1a3a6e" opacity="0.07"/>
      <path d="M0,36 C18,28 26,7 40,0 C22,13 10,26 0,36"  fill="#00b8d4" opacity="0.05"/>
    </svg>
  );
}

// ── 8-point star emblem ───────────────────────────────────────────────────
function StarEmblem() {
  return (
    <svg
      width="62" height="62" viewBox="0 0 72 72" fill="none" aria-hidden="true"
      style={{ filter: "drop-shadow(0 0 10px rgba(0,184,212,0.22)) drop-shadow(0 0 18px rgba(212,168,67,0.18))" }}
    >
      <circle cx="36" cy="36" r="34" stroke="#00b8d4" strokeWidth="0.6" opacity="0.3"/>
      <circle cx="36" cy="36" r="28" stroke="#d4a843" strokeWidth="0.4" opacity="0.25"/>
      <polygon
        points="36,6 40,22 56,14 48,30 66,36 48,42 56,58 40,50 36,66 32,50 16,58 24,42 6,36 24,30 16,14 32,22"
        fill="#d4a843" opacity="0.88"
      />
      <circle cx="36" cy="36" r="8" fill="none" stroke="rgba(0,184,212,0.25)" strokeWidth="1"/>
      <circle cx="36" cy="36" r="3" fill="rgba(255,255,255,0.5)"/>
    </svg>
  );
}

// ── Mosque illustration ───────────────────────────────────────────────────
function MosqueSilhouette() {
  return (
    <svg
      viewBox="0 0 400 200"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-label="Mosque illustration"
      role="img"
      className="w-full max-w-[320px]"
    >
      {/* Ground */}
      <line x1="10" y1="192" x2="390" y2="192" stroke="#1a3a6e" strokeWidth="1.5" opacity="0.35"/>

      {/* ── Left minaret ── */}
      <rect x="22" y="148" width="26" height="44" stroke="#1a3a6e" strokeWidth="1.1"/>
      <rect x="26" y="50" width="18" height="98" stroke="#1a3a6e" strokeWidth="0.9"/>
      <path d="M19,146 L19,140 L57,140 L57,146" stroke="#1a3a6e" strokeWidth="0.8"/>
      <line x1="19" y1="146" x2="57" y2="146" stroke="#1a3a6e" strokeWidth="0.8"/>
      <line x1="26" y1="98"  x2="44" y2="98"  stroke="#1a3a6e" strokeWidth="0.5" strokeDasharray="2,3"/>
      {/* Cap */}
      <path d="M26,50 L35,14 L44,50" stroke="#d4a843" strokeWidth="1.1"/>
      {/* Crescent */}
      <path d="M31,11 A5,5 0 0,1 39,11 A4,4 0 0,0 31,11" stroke="#d4a843" strokeWidth="1"/>

      {/* ── Right minaret ── */}
      <rect x="352" y="148" width="26" height="44" stroke="#1a3a6e" strokeWidth="1.1"/>
      <rect x="356" y="50" width="18" height="98" stroke="#1a3a6e" strokeWidth="0.9"/>
      <path d="M343,146 L343,140 L381,140 L381,146" stroke="#1a3a6e" strokeWidth="0.8"/>
      <line x1="343" y1="146" x2="381" y2="146" stroke="#1a3a6e" strokeWidth="0.8"/>
      <line x1="356" y1="98"  x2="374" y2="98"  stroke="#1a3a6e" strokeWidth="0.5" strokeDasharray="2,3"/>
      <path d="M356,50 L365,14 L374,50" stroke="#d4a843" strokeWidth="1.1"/>
      <path d="M361,11 A5,5 0 0,1 369,11 A4,4 0 0,0 361,11" stroke="#d4a843" strokeWidth="1"/>

      {/* ── Main building ── */}
      <rect x="58" y="162" width="284" height="30" stroke="#1a3a6e" strokeWidth="1.2"/>
      <rect x="64" y="155" width="272" height="8"  stroke="#1a3a6e" strokeWidth="0.8"/>

      {/* ── Left small dome ── */}
      <path d="M70,155 C70,128 86,114 106,114 C126,114 142,128 142,155"
        stroke="#d4a843" strokeWidth="1"/>
      <line x1="106" y1="114" x2="106" y2="104" stroke="#d4a843" strokeWidth="0.8"/>
      <circle cx="106" cy="102" r="2.5" stroke="#d4a843" strokeWidth="0.8"/>
      {/* Window inside small dome */}
      <path d="M94,155 L94,141 C94,134 106,129 106,129 C106,129 118,134 118,141 L118,155"
        stroke="#00b8d4" strokeWidth="0.8"/>

      {/* ── Right small dome ── */}
      <path d="M258,155 C258,128 274,114 294,114 C314,114 330,128 330,155"
        stroke="#d4a843" strokeWidth="1"/>
      <line x1="294" y1="114" x2="294" y2="104" stroke="#d4a843" strokeWidth="0.8"/>
      <circle cx="294" cy="102" r="2.5" stroke="#d4a843" strokeWidth="0.8"/>
      <path d="M282,155 L282,141 C282,134 294,129 294,129 C294,129 306,134 306,141 L306,155"
        stroke="#00b8d4" strokeWidth="0.8"/>

      {/* ── Central main dome ── */}
      {/* Drum */}
      <rect x="146" y="128" width="108" height="27" stroke="#1a3a6e" strokeWidth="1"/>
      {/* Dome body – onion profile */}
      <path d="M146,128 C146,98 158,68 200,44 C242,68 254,98 254,128"
        stroke="#d4a843" strokeWidth="1.3"/>
      {/* Dome lattice lines */}
      <path d="M174,108 C182,76 200,54 200,44" stroke="#d4a843" strokeWidth="0.5" strokeDasharray="3,3" opacity="0.5"/>
      <path d="M226,108 C218,76 200,54 200,44" stroke="#d4a843" strokeWidth="0.5" strokeDasharray="3,3" opacity="0.5"/>
      {/* Finial */}
      <line x1="200" y1="44" x2="200" y2="30" stroke="#d4a843" strokeWidth="1"/>
      <circle cx="200" cy="28" r="3"           stroke="#d4a843" strokeWidth="0.9"/>
      {/* Crescent */}
      <path d="M196,25 A5,5 0 0,1 204,25 A4,4 0 0,0 196,25" stroke="#d4a843" strokeWidth="1.1"/>
      {/* Drum windows */}
      <path d="M156,155 L156,141 C156,136 162,132 162,132 C162,132 168,136 168,141 L168,155"
        stroke="#00b8d4" strokeWidth="0.75"/>
      <path d="M232,155 L232,141 C232,136 238,132 238,132 C238,132 244,136 244,141 L244,155"
        stroke="#00b8d4" strokeWidth="0.75"/>

      {/* ── Main entrance arch ── */}
      <path d="M179,192 L179,168 C179,151 200,143 200,143 C200,143 221,151 221,168 L221,192"
        stroke="#00b8d4" strokeWidth="1.1"/>

      {/* ── Wing windows ── */}
      <path d="M72,192 L72,177 C72,170 79,165 79,165 C79,165 86,170 86,177 L86,192"
        stroke="#00b8d4" strokeWidth="0.75"/>
      <path d="M100,192 L100,177 C100,170 107,165 107,165 C107,165 114,170 114,177 L114,192"
        stroke="#00b8d4" strokeWidth="0.75"/>
      <path d="M286,192 L286,177 C286,170 293,165 293,165 C293,165 300,170 300,177 L300,192"
        stroke="#00b8d4" strokeWidth="0.75"/>
      <path d="M314,192 L314,177 C314,170 321,165 321,165 C321,165 328,170 328,177 L328,192"
        stroke="#00b8d4" strokeWidth="0.75"/>

      {/* Decorative merlons */}
      <path d="M64,162 L76,162 L76,155 L88,155 L88,162 L100,162"
        stroke="#1a3a6e" strokeWidth="0.7"/>
      <path d="M300,162 L312,162 L312,155 L324,155 L324,162 L336,162"
        stroke="#1a3a6e" strokeWidth="0.7"/>
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

// ── Arrow icon ────────────────────────────────────────────────────────────
function ArrowIcon({ rtl }: { rtl: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
      style={{ transform: rtl ? "scaleX(-1)" : undefined }}>
      <path d="M5 12h14M13 6l6 6-6 6"/>
    </svg>
  );
}

// ── Mini star for Sign Up ─────────────────────────────────────────────────
function MiniStar() {
  return (
    <svg width="9" height="9" viewBox="0 0 10 10" fill="#0a1628" aria-hidden="true">
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
      style={{ background: "linear-gradient(155deg, #f0f6ff 0%, #ffffff 55%, #f5f8ff 100%)" }}
    >
      {/* Background layers */}
      <SignatureBg />
      <CornerFan pos="tl" />
      <CornerFan pos="tr" />
      <CornerFan pos="bl" />
      <CornerFan pos="br" />

      {/* Subtle center glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: [
            "radial-gradient(ellipse 55% 40% at 50% 18%, rgba(0,184,212,0.06) 0%, transparent 65%)",
            "radial-gradient(ellipse 45% 35% at 50% 88%, rgba(212,168,67,0.06) 0%, transparent 65%)",
          ].join(", "),
        }}
      />

      {/* ── Top bar ───────────────────────────────────────────────── */}
      <header
        className="relative z-20 flex items-center justify-between px-5 py-3 gap-3"
        style={{
          background: "rgba(255,255,255,0.88)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(0,184,212,0.12)",
        }}
      >
        {/* Cyan-to-gold accent line at top */}
        <div
          className="absolute top-0 inset-x-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(0,184,212,0.5), rgba(212,168,67,0.5), transparent)",
          }}
        />

        {/* Left: logo + name */}
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
            style={{ color: "#0a1628", fontFamily: '"Cairo", sans-serif' }}
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
              color: "rgba(0,160,190,0.9)",
              border: "1px solid rgba(0,184,212,0.22)",
              background: "rgba(0,184,212,0.05)",
              fontFamily: '"Cairo", sans-serif',
            }}
          >
            <GlobeIcon />
            <span>{isAr ? "English" : "العربية"}</span>
          </button>

          {user ? (
            <>
              <span
                className="hidden sm:block text-xs"
                style={{ color: "rgba(20,50,100,0.6)", fontFamily: '"Cairo", sans-serif' }}
              >
                {user.displayName ?? user.name}
              </span>
              <button
                onClick={logout}
                className="text-xs px-3.5 py-1.5 rounded-lg min-h-[34px] flex items-center font-medium transition-colors"
                style={{
                  color: "rgba(160,110,20,0.9)",
                  border: "1px solid rgba(212,168,67,0.3)",
                  background: "rgba(212,168,67,0.06)",
                  fontFamily: '"Cairo", sans-serif',
                }}
              >
                {t.signout}
              </button>
            </>
          ) : (
            <>
              <a
                href="#contact"
                className="hidden sm:flex items-center text-xs px-3 py-1.5 rounded-lg min-h-[34px]"
                style={{ color: "rgba(20,50,100,0.5)", fontFamily: '"Cairo", sans-serif' }}
              >
                {isAr ? "اتصل بنا" : "Contact Us"}
              </a>
              <Link
                href="/login"
                className="text-xs px-3.5 py-1.5 rounded-lg min-h-[34px] flex items-center font-medium transition-colors"
                style={{
                  color: "rgba(160,110,20,0.9)",
                  border: "1px solid rgba(212,168,67,0.3)",
                  background: "rgba(212,168,67,0.06)",
                  fontFamily: '"Cairo", sans-serif',
                }}
              >
                {t.signin}
              </Link>
              <Link
                href="/signup"
                className="flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-lg min-h-[34px] font-semibold transition-opacity hover:opacity-90 active:scale-[0.98]"
                style={{
                  background: "linear-gradient(135deg, #b07a20 0%, #d4a843 55%, #f0c040 100%)",
                  color: "#0a1628",
                  fontFamily: '"Cairo", sans-serif',
                  boxShadow: "0 1px 8px rgba(212,168,67,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
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
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-10 text-center">

        {/* Star emblem */}
        <div className="mb-5">
          <StarEmblem />
        </div>

        {/* Arabic title – dark navy */}
        <h1
          className="text-5xl sm:text-6xl font-bold leading-tight mb-1"
          style={{ fontFamily: '"Amiri", serif', color: "#0a1628" }}
        >
          القرآن الكريم
        </h1>

        {/* Subtitle – cyan */}
        <p
          className="text-[10px] tracking-[0.32em] uppercase mb-6"
          style={{ color: "rgba(0,160,190,0.85)", fontFamily: '"Cairo", sans-serif' }}
        >
          The Noble Quran
        </p>

        {/* Ornamental rule */}
        <div className="flex items-center gap-3 mb-7 w-full max-w-[260px]">
          <div className="flex-1 h-px"
            style={{ background: "linear-gradient(to right, transparent, rgba(212,168,67,0.45))" }}/>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="#00b8d4" opacity="0.7" aria-hidden="true">
            <polygon points="5,0 6,4 10,5 6,6 5,10 4,6 0,5 4,4"/>
          </svg>
          <div className="flex-1 h-px"
            style={{ background: "linear-gradient(to left, transparent, rgba(212,168,67,0.45))" }}/>
        </div>

        {/* Mosque illustration */}
        <div className="mb-7 w-full flex justify-center">
          <MosqueSilhouette />
        </div>

        {/* Islamic quote card */}
        <div
          className="w-full max-w-sm mb-8 rounded-2xl p-5"
          style={{
            background: "rgba(240,248,255,0.85)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(0,184,212,0.18)",
            borderLeftWidth: isAr ? 1 : 4,
            borderRightWidth: isAr ? 4 : 1,
            borderLeftColor:  isAr ? "rgba(0,184,212,0.18)" : "rgba(0,184,212,0.7)",
            borderRightColor: isAr ? "rgba(0,184,212,0.7)"  : "rgba(0,184,212,0.18)",
          }}
        >
          <p
            className="text-xl mb-3 leading-loose"
            style={{
              fontFamily: '"Amiri", serif',
              color: "#0a1628",
              direction: "rtl",
              textAlign: "right",
            }}
          >
            إِنَّا أَنزَلْنَاهُ قُرْآنًا عَرَبِيًّا لَّعَلَّكُمْ تَعْقِلُونَ
          </p>
          <p
            className="text-xs italic mb-2 leading-relaxed"
            style={{
              color: "rgba(20,60,100,0.62)",
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
              color: "rgba(0,160,190,0.55)",
              fontFamily: '"Cairo", sans-serif',
              textAlign: isAr ? "right" : "left",
            }}
          >
            — Surah Yusuf 12:2
          </p>
        </div>

        {/* ── Go to App CTA ──────────────────────────────────────── */}
        <Link
          href={user ? "/surahs" : "/login"}
          className="flex items-center gap-2.5 px-7 py-3.5 rounded-xl font-semibold text-sm mb-8 transition-all hover:opacity-90 active:scale-[0.97]"
          style={{
            background: "linear-gradient(135deg, #0070a0 0%, #00a8c8 40%, #00c8e8 70%, #f0c040 100%)",
            color: "#ffffff",
            fontFamily: '"Cairo", sans-serif',
            boxShadow: [
              "0 0 24px rgba(0,184,212,0.3)",
              "0 0 8px rgba(240,192,64,0.15)",
              "0 2px 12px rgba(0,0,0,0.12)",
              "inset 0 1px 0 rgba(255,255,255,0.2)",
            ].join(", "),
            letterSpacing: "0.04em",
          }}
        >
          {isAr ? "الدخول إلى التطبيق" : "Go to App"}
          <ArrowIcon rtl={isAr} />
        </Link>

        {/* App name + tagline placeholder */}
        <div className="flex flex-col items-center gap-2">
          <span
            className="text-sm font-semibold tracking-wide"
            style={{ color: "rgba(0,160,190,0.5)", fontFamily: '"Cairo", sans-serif' }}
          >
            The Quran Academy
          </span>
          <span
            className="text-xs font-mono tracking-wider"
            style={{
              color: "rgba(20,60,100,0.28)",
              border: "1px dashed rgba(20,60,100,0.18)",
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
        <div className="h-px w-20"
          style={{ background: "linear-gradient(to right, transparent, rgba(0,184,212,0.2))" }}/>
        <span
          className="text-[9px] font-mono tracking-widest"
          style={{
            color: "rgba(0,160,190,0.28)",
            border: "1px dashed rgba(0,160,190,0.16)",
            borderRadius: "2px",
            padding: "2px 8px",
          }}
        >
          © 2025 — The Quran Academy
        </span>
        <div className="h-px w-20"
          style={{ background: "linear-gradient(to left, transparent, rgba(0,184,212,0.2))" }}/>
      </footer>
    </div>
  );
}
