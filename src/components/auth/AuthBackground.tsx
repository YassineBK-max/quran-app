import Image from "next/image";
import { ReactNode } from "react";

// ── Geometric background pattern — shared across auth pages ───────────────────
export function SignatureBg() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="auth-khatam" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
          <g fill="none" strokeLinecap="round">
            <path d="M60 4 L116 60 L60 116 L4 60 Z"  stroke="#d4a843" strokeWidth="3" opacity="0.13"/>
            <path d="M60 32 L88 60 L60 88 L32 60 Z"  stroke="#00b8d4" strokeWidth="3" opacity="0.09"/>
            <line x1="60" y1="4"   x2="60" y2="32"  stroke="#d4a843" strokeWidth="3" opacity="0.08"/>
            <line x1="116" y1="60" x2="88" y2="60"  stroke="#d4a843" strokeWidth="3" opacity="0.08"/>
            <line x1="60" y1="116" x2="60" y2="88"  stroke="#d4a843" strokeWidth="3" opacity="0.08"/>
            <line x1="4"   y1="60" x2="32" y2="60"  stroke="#d4a843" strokeWidth="3" opacity="0.08"/>
            <circle cx="0"   cy="0"   r="2.5" fill="#d4a843" opacity="0.35"/>
            <circle cx="120" cy="0"   r="2.5" fill="#00b8d4" opacity="0.3"/>
            <circle cx="0"   cy="120" r="2.5" fill="#00b8d4" opacity="0.3"/>
            <circle cx="120" cy="120" r="2.5" fill="#d4a843" opacity="0.35"/>
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#auth-khatam)"/>
    </svg>
  );
}

export function CornerFan({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) {
  const cls = { tl: "top-0 left-0", tr: "top-0 right-0", bl: "bottom-0 left-0", br: "bottom-0 right-0" }[pos];
  const sx = pos === "tr" || pos === "br" ? -1 : 1;
  const sy = pos === "bl" || pos === "br" ? -1 : 1;
  return (
    <svg className={`absolute ${cls} pointer-events-none`} width="140" height="140" viewBox="0 0 140 140" fill="none" aria-hidden="true" style={{ transform: `scale(${sx},${sy})` }}>
      <path d="M0,0 Q140,0 140,140" stroke="#d4a843" strokeWidth="0.8" opacity="0.18"/>
      <path d="M0,0 Q70,0 70,70"   stroke="#d4a843" strokeWidth="0.5" opacity="0.1"/>
      <polygon points="13,3 16,10 23,10 17,14 19,21 13,17 7,21 9,14 3,10 10,10" fill="#d4a843" opacity="0.30"/>
    </svg>
  );
}

// ── Shared card style used across auth pages ───────────────────────────────────
export const authCardStyle = {
  background: "rgba(240,248,255,0.92)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
  border: "1.5px solid rgba(0,184,212,0.2)",
  boxShadow: "0 8px 40px rgba(0,80,140,0.08)",
} as const;

export const authPrimaryButtonStyle = {
  background: "linear-gradient(135deg, #0070a0 0%, #00a8c8 40%, #00c8e8 70%, #f0c040 100%)",
  color: "#ffffff",
  fontFamily: '"Cairo", sans-serif',
  boxShadow: "0 0 20px rgba(0,184,212,0.25), 0 2px 10px rgba(0,0,0,0.1)",
} as const;

// ── Page shell — mosque background + geometric pattern + corner fans ──────────
export function AuthPageShell({ children }: { children: ReactNode }) {
  return (
    <div
      className="min-h-dvh flex flex-col relative overflow-hidden"
      style={{ background: "linear-gradient(155deg, #f0f6ff 0%, #ffffff 55%, #f5f8ff 100%)" }}
    >
      <div className="absolute inset-y-0 left-0 w-1/2 pointer-events-none" style={{ zIndex: 0 }}>
        <Image src="/mosque_bg.png" alt="" fill sizes="50vw" className="object-cover object-top" style={{ opacity: 0.45 }} priority />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to right, transparent 30%, rgba(248,251,255,1) 100%)" }} />
      </div>

      <SignatureBg />
      <CornerFan pos="tl" />
      <CornerFan pos="tr" />
      <CornerFan pos="bl" />
      <CornerFan pos="br" />

      <main className="relative z-10 flex-1 flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
