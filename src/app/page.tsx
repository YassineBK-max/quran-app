"use client";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useT } from "@/hooks/useT";

// ── Signature background: khatam gold + ocean-blue herbaceous vines ───────
function SignatureBg() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Khatam grid – gold outer ring, cyan inner ring */}
        <pattern id="hp-khatam" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
          <g fill="none" strokeLinecap="round">
            <path d="M60 4 L116 60 L60 116 L4 60 Z"  stroke="#d4a843" strokeWidth="0.9" opacity="0.09"/>
            <path d="M60 32 L88 60 L60 88 L32 60 Z"  stroke="#00c8e8" strokeWidth="0.6" opacity="0.07"/>
            <line x1="60" y1="4"   x2="60" y2="32"  stroke="#d4a843" strokeWidth="0.4" opacity="0.06"/>
            <line x1="116" y1="60" x2="88" y2="60"  stroke="#d4a843" strokeWidth="0.4" opacity="0.06"/>
            <line x1="60" y1="116" x2="60" y2="88"  stroke="#d4a843" strokeWidth="0.4" opacity="0.06"/>
            <line x1="4"  y1="60"  x2="32" y2="60"  stroke="#d4a843" strokeWidth="0.4" opacity="0.06"/>
            <line x1="60" y1="4"   x2="88" y2="32"  stroke="#00c8e8" strokeWidth="0.3" opacity="0.04"/>
            <line x1="116" y1="60" x2="88" y2="88"  stroke="#00c8e8" strokeWidth="0.3" opacity="0.04"/>
            <line x1="60" y1="116" x2="32" y2="88"  stroke="#00c8e8" strokeWidth="0.3" opacity="0.04"/>
            <line x1="4"  y1="60"  x2="32" y2="32"  stroke="#00c8e8" strokeWidth="0.3" opacity="0.04"/>
            <circle cx="0"   cy="0"   r="1.5" fill="#d4a843" opacity="0.3"/>
            <circle cx="120" cy="0"   r="1.5" fill="#00c8e8" opacity="0.25"/>
            <circle cx="0"   cy="120" r="1.5" fill="#00c8e8" opacity="0.25"/>
            <circle cx="120" cy="120" r="1.5" fill="#d4a843" opacity="0.3"/>
          </g>
        </pattern>

        {/* Herbaceous vines – ocean blue, seamless 240×240 diagonal tile */}
        <pattern id="hp-vine" x="0" y="0" width="240" height="240" patternUnits="userSpaceOnUse">
          <g fill="none" stroke="#1e5c8a" strokeLinecap="round" strokeLinejoin="round">
            <path d="M0,120 C30,95 90,30 120,0"        strokeWidth="0.9" opacity="0.13"/>
            <path d="M120,240 C150,215 210,150 240,120"  strokeWidth="0.9" opacity="0.13"/>
            <path d="M0,0 C30,25 95,90 120,120"          strokeWidth="0.65" opacity="0.07"/>
            <path d="M120,120 C150,145 205,210 240,240"   strokeWidth="0.65" opacity="0.07"/>
            <path d="M58,62 C48,52 42,56 35,46"    strokeWidth="0.6" opacity="0.11"/>
            <path d="M35,46 C29,38 38,34 35,46"    fill="#1e5c8a" strokeWidth="0" opacity="0.09"/>
            <path d="M35,46 C27,42 34,52 35,46"    fill="#1e5c8a" strokeWidth="0" opacity="0.09"/>
            <path d="M84,37 C91,26 100,29 107,20"  strokeWidth="0.6" opacity="0.11"/>
            <path d="M107,20 C113,12 118,19 107,20" fill="#1e5c8a" strokeWidth="0" opacity="0.09"/>
            <path d="M107,20 C100,12 114,13 107,20" fill="#1e5c8a" strokeWidth="0" opacity="0.09"/>
            <path d="M46,72 C42,64 50,60 46,72"    strokeWidth="0.5" opacity="0.08"/>
            <path d="M177,183 C188,172 198,177 205,167" strokeWidth="0.6" opacity="0.11"/>
            <path d="M205,167 C211,159 217,165 205,167" fill="#1e5c8a" strokeWidth="0" opacity="0.09"/>
            <path d="M143,212 C132,202 127,207 119,199"  strokeWidth="0.6" opacity="0.11"/>
            <path d="M119,199 C111,191 120,187 119,199"  fill="#1e5c8a" strokeWidth="0" opacity="0.09"/>
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#hp-khatam)"/>
      <rect width="100%" height="100%" fill="url(#hp-vine)"/>
    </svg>
  );
}

// ── Corner fan medallions – gold arcs + cyan leaf accents ─────────────────
function CornerFan({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) {
  const cls = { tl: "top-0 left-0", tr: "top-0 right-0", bl: "bottom-0 left-0", br: "bottom-0 right-0" }[pos];
  const sx = pos === "tr" || pos === "br" ? -1 : 1;
  const sy = pos === "bl" || pos === "br" ? -1 : 1;
  return (
    <svg
      className={`absolute ${cls} pointer-events-none`}
      width="160" height="160"
      viewBox="0 0 160 160"
      fill="none"
      aria-hidden="true"
      style={{ transform: `scale(${sx},${sy})` }}
    >
      <path d="M0,0 Q160,0 160,160" stroke="#d4a843" strokeWidth="0.8" opacity="0.14"/>
      <path d="M0,0 Q120,0 120,120" stroke="#00c8e8" strokeWidth="0.6" opacity="0.10"/>
      <path d="M0,0 Q80,0 80,80"   stroke="#d4a843" strokeWidth="0.5" opacity="0.08"/>
      <line x1="0" y1="0" x2="80"  y2="80"  stroke="#d4a843" strokeWidth="0.4" opacity="0.09"/>
      <line x1="0" y1="0" x2="112" y2="45"  stroke="#00c8e8" strokeWidth="0.4" opacity="0.07"/>
      <line x1="0" y1="0" x2="45"  y2="112" stroke="#00c8e8" strokeWidth="0.4" opacity="0.07"/>
      <polygon points="15,3 18,11 26,11 20,16 22,24 15,19 8,24 10,16 4,11 12,11"
        fill="#d4a843" opacity="0.22"/>
      <path d="M40,0 C32,20 8,30 0,44 C14,25 28,12 40,0" fill="#1e5c8a" opacity="0.12"/>
      <path d="M0,40 C20,32 30,8 44,0 C25,14 12,28 0,40" fill="#00c8e8" opacity="0.06"/>
    </svg>
  );
}

// ── 8-Point star emblem – gold body, cyan outer ring ─────────────────────
function StarEmblem() {
  return (
    <svg
      width="66" height="66" viewBox="0 0 72 72" fill="none" aria-hidden="true"
      style={{ filter: "drop-shadow(0 0 18px rgba(0,200,232,0.28)) drop-shadow(0 0 28px rgba(212,168,67,0.22))" }}
    >
      <circle cx="36" cy="36" r="34" stroke="#00c8e8" strokeWidth="0.6" opacity="0.22"/>
      <circle cx="36" cy="36" r="28" stroke="#d4a843" strokeWidth="0.4" opacity="0.18"/>
      <polygon
        points="36,6 40,22 56,14 48,30 66,36 48,42 56,58 40,50 36,66 32,50 16,58 24,42 6,36 24,30 16,14 32,22"
        fill="#d4a843" opacity="0.90"
      />
      <circle cx="36" cy="36" r="8" fill="none" stroke="rgba(0,200,232,0.22)" strokeWidth="1"/>
      <circle cx="36" cy="36" r="3" fill="rgba(255,255,255,0.15)"/>
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

// ── Mini star for Sign Up button ──────────────────────────────────────────
function MiniStar() {
  return (
    <svg width="9" height="9" viewBox="0 0 10 10" fill="#040c1e" aria-hidden="true">
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
      style={{ background: "linear-gradient(155deg, #030b18 0%, #060e1e 45%, #040c1c 100%)" }}
    >
      {/* Background layers */}
      <SignatureBg />
      <CornerFan pos="tl" />
      <CornerFan pos="tr" />
      <CornerFan pos="bl" />
      <CornerFan pos="br" />

      {/* Dual ambient glow – cyan top, gold bottom */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: [
            "radial-gradient(ellipse 60% 45% at 50% 20%, rgba(0,200,232,0.06) 0%, transparent 65%)",
            "radial-gradient(ellipse 50% 40% at 50% 85%, rgba(212,168,67,0.05) 0%, transparent 65%)",
          ].join(", "),
        }}
      />

      {/* ── Top bar ───────────────────────────────────────────────── */}
      <header
        className="relative z-20 flex items-center justify-between px-5 py-3 gap-3"
        style={{ borderBottom: "1px solid rgba(0,200,232,0.1)" }}
      >
        {/* Cyan-to-gold accent line at top */}
        <div
          className="absolute top-0 inset-x-0 h-px"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(0,200,232,0.5), rgba(212,168,67,0.5), transparent)",
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
            style={{ color: "#e0f0ff", fontFamily: '"Cairo", sans-serif' }}
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
              color: "rgba(0,200,232,0.8)",
              border: "1px solid rgba(0,200,232,0.2)",
              background: "rgba(0,200,232,0.04)",
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
                style={{ color: "rgba(180,220,240,0.65)", fontFamily: '"Cairo", sans-serif' }}
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
              <a
                href="#contact"
                className="hidden sm:flex items-center text-xs px-3 py-1.5 rounded-lg min-h-[34px]"
                style={{ color: "rgba(180,220,240,0.55)", fontFamily: '"Cairo", sans-serif' }}
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
                  background: "linear-gradient(135deg, #b07a20 0%, #d4a843 55%, #f0c040 100%)",
                  color: "#040c1e",
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
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">

        {/* Star emblem */}
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

        {/* Subtitle – cyan */}
        <p
          className="text-[10px] tracking-[0.32em] uppercase mb-7"
          style={{ color: "rgba(0,200,232,0.7)", fontFamily: '"Cairo", sans-serif' }}
        >
          The Noble Quran
        </p>

        {/* Ornamental rule – gold fades into cyan star into gold */}
        <div className="flex items-center gap-3 mb-8 w-full max-w-[280px]">
          <div className="flex-1 h-px"
            style={{ background: "linear-gradient(to right, transparent, rgba(212,168,67,0.45))" }}/>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="#00c8e8" opacity="0.7" aria-hidden="true">
            <polygon points="5,0 6,4 10,5 6,6 5,10 4,6 0,5 4,4"/>
          </svg>
          <div className="flex-1 h-px"
            style={{ background: "linear-gradient(to left, transparent, rgba(212,168,67,0.45))" }}/>
        </div>

        {/* Islamic quote card – cyan left border */}
        <div
          className="w-full max-w-sm mb-8 rounded-2xl p-5"
          style={{
            background: "rgba(0,14,32,0.55)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1px solid rgba(0,200,232,0.14)",
            borderLeftWidth: isAr ? 1 : 4,
            borderRightWidth: isAr ? 4 : 1,
            borderLeftColor:  isAr ? "rgba(0,200,232,0.14)" : "rgba(0,200,232,0.7)",
            borderRightColor: isAr ? "rgba(0,200,232,0.7)"  : "rgba(0,200,232,0.14)",
          }}
        >
          <p
            className="text-xl mb-3 leading-loose"
            style={{
              fontFamily: '"Amiri", serif',
              color: "rgba(240,232,208,0.92)",
              direction: "rtl",
              textAlign: "right",
            }}
          >
            إِنَّا أَنزَلْنَاهُ قُرْآنًا عَرَبِيًّا لَّعَلَّكُمْ تَعْقِلُونَ
          </p>
          <p
            className="text-xs italic mb-2 leading-relaxed"
            style={{
              color: "rgba(180,220,240,0.6)",
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
              color: "rgba(0,200,232,0.45)",
              fontFamily: '"Cairo", sans-serif',
              textAlign: isAr ? "right" : "left",
            }}
          >
            — Surah Yusuf 12:2
          </p>
        </div>

        {/* ── Go to App CTA ────────────────────────────────────────── */}
        <Link
          href={user ? "/surahs" : "/login"}
          className="flex items-center gap-2.5 px-7 py-3.5 rounded-xl font-semibold text-sm mb-10 transition-all hover:opacity-92 active:scale-[0.97]"
          style={{
            background: "linear-gradient(135deg, #1a6a9a 0%, #00a8c8 40%, #00c8e8 70%, #f0c040 100%)",
            color: "#040c1e",
            fontFamily: '"Cairo", sans-serif',
            boxShadow: [
              "0 0 28px rgba(0,200,232,0.35)",
              "0 0 10px rgba(240,192,64,0.2)",
              "0 2px 12px rgba(0,0,0,0.4)",
              "inset 0 1px 0 rgba(255,255,255,0.18)",
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
            style={{ color: "rgba(0,200,232,0.45)", fontFamily: '"Cairo", sans-serif' }}
          >
            The Quran Academy
          </span>
          <span
            className="text-xs font-mono tracking-wider"
            style={{
              color: "rgba(212,168,67,0.22)",
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
        <div className="h-px w-20"
          style={{ background: "linear-gradient(to right, transparent, rgba(0,200,232,0.18))" }}/>
        <span
          className="text-[9px] font-mono tracking-widest"
          style={{
            color: "rgba(0,200,232,0.2)",
            border: "1px dashed rgba(0,200,232,0.13)",
            borderRadius: "2px",
            padding: "2px 8px",
          }}
        >
          © 2025 — The Quran Academy
        </span>
        <div className="h-px w-20"
          style={{ background: "linear-gradient(to left, transparent, rgba(0,200,232,0.18))" }}/>
      </footer>
    </div>
  );
}
