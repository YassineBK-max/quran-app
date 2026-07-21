"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useT } from "@/hooks/useT";
import { isSupabaseReady } from "@/lib/supabase";
import { authSendPasswordReset, authResendVerification } from "@/lib/supabase-auth";

// ── Geometric background ──────────────────────────────────────────────────────
function SignatureBg() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="lp-khatam" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
          <g fill="none" strokeLinecap="round">
            <path d="M60 4 L116 60 L60 116 L4 60 Z"  stroke="#d4a843" strokeWidth="3" opacity="0.13"/>
            <path d="M60 32 L88 60 L60 88 L32 60 Z"  stroke="#00b8d4" strokeWidth="3" opacity="0.09"/>
            <line x1="60" y1="4"   x2="60" y2="32"  stroke="#d4a843" strokeWidth="3" opacity="0.08"/>
            <line x1="116" y1="60" x2="88" y2="60"  stroke="#d4a843" strokeWidth="3" opacity="0.08"/>
            <line x1="60" y1="116" x2="60" y2="88"  stroke="#d4a843" strokeWidth="3" opacity="0.08"/>
            <line x1="4"   y1="60" x2="32" y2="60"  stroke="#d4a843" strokeWidth="3" opacity="0.08"/>
            <line x1="60" y1="4"   x2="88" y2="32"  stroke="#00b8d4" strokeWidth="3" opacity="0.06"/>
            <line x1="116" y1="60" x2="88" y2="88"  stroke="#00b8d4" strokeWidth="3" opacity="0.06"/>
            <line x1="60" y1="116" x2="32" y2="88"  stroke="#00b8d4" strokeWidth="3" opacity="0.06"/>
            <line x1="4"   y1="60" x2="32" y2="32"  stroke="#00b8d4" strokeWidth="3" opacity="0.06"/>
            <circle cx="0"   cy="0"   r="2.5" fill="#d4a843" opacity="0.35"/>
            <circle cx="120" cy="0"   r="2.5" fill="#00b8d4" opacity="0.3"/>
            <circle cx="0"   cy="120" r="2.5" fill="#00b8d4" opacity="0.3"/>
            <circle cx="120" cy="120" r="2.5" fill="#d4a843" opacity="0.35"/>
          </g>
        </pattern>
        <pattern id="lp-vine" x="0" y="0" width="240" height="240" patternUnits="userSpaceOnUse">
          <g fill="none" stroke="#1a3a6e" strokeLinecap="round" strokeLinejoin="round">
            <path d="M0,120 C30,95 90,30 120,0"       strokeWidth="3" opacity="0.07"/>
            <path d="M120,240 C150,215 210,150 240,120" strokeWidth="3" opacity="0.07"/>
            <path d="M0,0 C30,25 95,90 120,120"         strokeWidth="3" opacity="0.04"/>
            <path d="M120,120 C150,145 205,210 240,240"  strokeWidth="3" opacity="0.04"/>
            <path d="M58,62 C48,52 42,56 35,46"   strokeWidth="3" opacity="0.06"/>
            <path d="M84,37 C91,26 100,29 107,20"  strokeWidth="3" opacity="0.06"/>
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#lp-khatam)"/>
      <rect width="100%" height="100%" fill="url(#lp-vine)"/>
    </svg>
  );
}

// ── Corner fans ───────────────────────────────────────────────────────────────
function CornerFan({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) {
  const cls = { tl: "top-0 left-0", tr: "top-0 right-0", bl: "bottom-0 left-0", br: "bottom-0 right-0" }[pos];
  const sx = pos === "tr" || pos === "br" ? -1 : 1;
  const sy = pos === "bl" || pos === "br" ? -1 : 1;
  return (
    <svg className={`absolute ${cls} pointer-events-none`} width="140" height="140" viewBox="0 0 140 140" fill="none" aria-hidden="true" style={{ transform: `scale(${sx},${sy})` }}>
      <path d="M0,0 Q140,0 140,140" stroke="#d4a843" strokeWidth="0.8" opacity="0.18"/>
      <path d="M0,0 Q105,0 105,105" stroke="#00b8d4" strokeWidth="0.6" opacity="0.13"/>
      <path d="M0,0 Q70,0 70,70"   stroke="#d4a843" strokeWidth="0.5" opacity="0.1"/>
      <line x1="0" y1="0" x2="70"  y2="70"  stroke="#d4a843" strokeWidth="0.4" opacity="0.12"/>
      <line x1="0" y1="0" x2="98"  y2="40"  stroke="#00b8d4" strokeWidth="0.4" opacity="0.09"/>
      <line x1="0" y1="0" x2="40"  y2="98"  stroke="#00b8d4" strokeWidth="0.4" opacity="0.09"/>
      <polygon points="13,3 16,10 23,10 17,14 19,21 13,17 7,21 9,14 3,10 10,10" fill="#d4a843" opacity="0.30"/>
    </svg>
  );
}

// ── Globe icon ────────────────────────────────────────────────────────────────
function GlobeIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/>
      <path d="M2 12h20"/>
      <path d="M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/>
    </svg>
  );
}

// ── Star emblem ───────────────────────────────────────────────────────────────
function StarEmblem() {
  return (
    <svg width="48" height="48" viewBox="0 0 72 72" fill="none" aria-hidden="true"
      style={{ filter: "drop-shadow(0 0 10px rgba(0,184,212,0.22)) drop-shadow(0 0 18px rgba(212,168,67,0.18))" }}>
      <circle cx="36" cy="36" r="34" stroke="#00b8d4" strokeWidth="0.6" opacity="0.3"/>
      <circle cx="36" cy="36" r="28" stroke="#d4a843" strokeWidth="0.4" opacity="0.25"/>
      <polygon points="36,6 40,22 56,14 48,30 66,36 48,42 56,58 40,50 36,66 32,50 16,58 24,42 6,36 24,30 16,14 32,22" fill="#d4a843" opacity="0.88"/>
      <circle cx="36" cy="36" r="8" fill="none" stroke="rgba(0,184,212,0.25)" strokeWidth="1"/>
      <circle cx="36" cy="36" r="3" fill="rgba(255,255,255,0.5)"/>
    </svg>
  );
}

// ── Field label ───────────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label
        className="block text-xs font-semibold mb-1.5"
        style={{ color: "rgba(0,160,190,0.9)", fontFamily: '"Cairo", sans-serif' }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

// ── Input ─────────────────────────────────────────────────────────────────────
function NavyInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl px-4 py-3 text-sm transition-colors focus:outline-none ${props.className ?? ""}`}
      style={{
        background: "rgba(255,255,255,0.9)",
        border: "1px solid rgba(0,184,212,0.25)",
        color: "#0a1628",
        ...props.style,
      }}
    />
  );
}

// ── Error / ok boxes ──────────────────────────────────────────────────────────
function ErrBox({ msg }: { msg: string }) {
  return (
    <div role="alert" className="flex items-start gap-2 text-xs rounded-xl px-3 py-2.5"
      style={{ color: "#c0392b", background: "rgba(220,50,50,0.07)", border: "1px solid rgba(220,50,50,0.18)" }}>
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      {msg}
    </div>
  );
}

function OkBox({ msg }: { msg: string }) {
  return (
    <div role="status" className="flex items-start gap-2 text-xs rounded-xl px-3 py-2.5"
      style={{ color: "rgba(0,160,190,0.9)", background: "rgba(0,184,212,0.07)", border: "1px solid rgba(0,184,212,0.2)" }}>
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5"><polyline points="20 6 9 17 4 12"/></svg>
      {msg}
    </div>
  );
}

// ── Forgot-password panel ─────────────────────────────────────────────────────
function ForgotPanel({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError("Please enter your email address."); return; }
    setLoading(true);
    setError("");
    const redirectTo = `${window.location.origin}/auth/reset-password`;
    const err = await authSendPasswordReset(email.trim(), redirectTo);
    setLoading(false);
    if (err) { setError(err); return; }
    setSent(true);
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-bold text-base" style={{ color: "#0a1628", fontFamily: '"Cairo", sans-serif' }}>
          Reset your password
        </h2>
        <p className="text-xs mt-1" style={{ color: "rgba(20,60,100,0.55)" }}>
          Enter your email and we&apos;ll send a reset link.
        </p>
      </div>

      {sent ? (
        <div className="space-y-4">
          <OkBox msg={`Reset link sent to ${email}. Check your inbox (and spam folder).`} />
          <p className="text-xs" style={{ color: "rgba(20,60,100,0.45)" }}>
            The link expires in 1 hour. After clicking it you&apos;ll be able to set a new password.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSend} className="space-y-3">
          <Field label="Email address">
            <NavyInput
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
              autoComplete="email"
              placeholder="your@email.com"
            />
          </Field>
          {error && <ErrBox msg={error} />}
          {!isSupabaseReady && (
            <p className="text-xs rounded-xl px-3 py-2.5" style={{ color: "rgba(160,120,0,0.9)", background: "rgba(212,168,67,0.08)", border: "1px solid rgba(212,168,67,0.2)" }}>
              Password reset requires Supabase configuration. Contact your administrator.
            </p>
          )}
          <button
            type="submit"
            disabled={loading || !isSupabaseReady}
            className="w-full py-3 rounded-xl font-semibold transition-all disabled:opacity-50 min-h-[48px] hover:opacity-90 active:scale-[.98]"
            style={{
              background: "linear-gradient(135deg, #0070a0 0%, #00a8c8 40%, #00c8e8 70%, #f0c040 100%)",
              color: "#ffffff",
              fontFamily: '"Cairo", sans-serif',
              boxShadow: "0 0 20px rgba(0,184,212,0.25), 0 2px 10px rgba(0,0,0,0.1)",
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Sending…
              </span>
            ) : "Send reset link"}
          </button>
        </form>
      )}

      <button
        onClick={onBack}
        className="w-full flex items-center justify-center gap-1.5 text-sm transition-colors py-1 hover:opacity-80"
        style={{ color: "rgba(0,160,190,0.8)", fontFamily: '"Cairo", sans-serif' }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
        Back to sign in
      </button>
    </div>
  );
}

// ── Main login page ───────────────────────────────────────────────────────────
type Mode = "login" | "forgot";

export default function LoginPage() {
  const { login } = useAuth();
  const { settings, updateSettings } = useSettings();
  const t = useT();
  const router = useRouter();
  const isAr = settings.language === "ar";

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setUnverifiedEmail("");
    setResendMsg("");
    setLoading(true);
    const err = login(email, password);
    setLoading(false);
    if (!err) { router.replace("/"); return; }
    if (err === "EMAIL_NOT_VERIFIED") {
      setUnverifiedEmail(email);
      setError("Please verify your email before signing in. Check your inbox.");
      return;
    }
    setError(err);
  };

  const handleResend = async () => {
    setResendLoading(true);
    setResendMsg("");
    const redirectTo = `${window.location.origin}/auth/verify`;
    const err = await authResendVerification(unverifiedEmail, redirectTo);
    setResendLoading(false);
    if (err) { setResendMsg(`Error: ${err}`); return; }
    setResendMsg("Verification email resent! Check your inbox.");
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      await signIn("google", { callbackUrl: "/auth/google-callback" });
    } catch {
      setGoogleLoading(false);
      setError("Google sign-in failed. Please try again.");
    }
  };

  return (
    <div
      className="min-h-dvh flex flex-col relative overflow-hidden"
      style={{ background: "linear-gradient(155deg, #f0f6ff 0%, #ffffff 55%, #f5f8ff 100%)" }}
    >
      {/* Background photo – left half, 50% opacity */}
      <div className="absolute inset-y-0 left-0 w-1/2 pointer-events-none" style={{ zIndex: 0 }}>
        <Image
          src="/mosque_bg.png"
          alt=""
          fill
          sizes="50vw"
          className="object-cover object-top"
          style={{ opacity: 0.5 }}
          priority
        />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to right, transparent 30%, rgba(248,251,255,1) 100%)" }}
        />
      </div>

      {/* Geometric patterns */}
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
        <div className="absolute top-0 inset-x-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(0,184,212,0.5), rgba(212,168,67,0.5), transparent)" }}
        />

        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <Image src="/logo-qapp.png" alt="The Quran Academy" width={32} height={32} className="rounded-md" />
          <span className="hidden sm:block text-sm font-semibold" style={{ color: "#0a1628", fontFamily: '"Cairo", sans-serif' }}>
            The Quran Academy
          </span>
        </Link>

        <nav className="flex items-center gap-1.5">
          <button
            onClick={() => updateSettings({ language: isAr ? "en" : "ar" })}
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
            {t.signup}
          </Link>
        </nav>
      </header>

      {/* ── Form ──────────────────────────────────────────────────── */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm">
          {/* Emblem + title */}
          <div className="flex flex-col items-center mb-6">
            <StarEmblem />
            <h1 className="mt-3 text-2xl font-bold" style={{ color: "#0a1628", fontFamily: '"Cairo", sans-serif' }}>
              {mode === "forgot" ? "Forgot password" : t.login_title}
            </h1>
            <p className="text-sm mt-1" style={{ color: "rgba(0,160,190,0.7)", fontFamily: '"Cairo", sans-serif' }}>
              {mode === "forgot" ? "We’ll send you a reset link" : t.login_subtitle}
            </p>
          </div>

          {/* Ornamental rule */}
          <div className="flex items-center gap-3 mb-6 w-full">
            <div className="flex-1 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(212,168,67,0.45))" }}/>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="#00b8d4" opacity="0.7" aria-hidden="true"><polygon points="5,0 6,4 10,5 6,6 5,10 4,6 0,5 4,4"/></svg>
            <div className="flex-1 h-px" style={{ background: "linear-gradient(to left, transparent, rgba(212,168,67,0.45))" }}/>
          </div>

          {/* Form card */}
          <div
            className="rounded-2xl p-6"
            style={{
              background: "rgba(240,248,255,0.88)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
              border: "1px solid rgba(0,184,212,0.18)",
              boxShadow: "0 4px 32px rgba(0,100,160,0.06)",
            }}
          >
            {/* ── Forgot password ── */}
            {mode === "forgot" && (
              <ForgotPanel onBack={() => { setMode("login"); setError(""); }} />
            )}

            {/* ── Login form ── */}
            {mode === "login" && (
              <div className="space-y-4">
                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                  <Field label={t.login_email}>
                    <NavyInput
                      id="login-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      placeholder="your@email.com"
                    />
                  </Field>

                  <Field label={t.login_password}>
                    <div className="relative">
                      <NavyInput
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                        placeholder="••••••••"
                        className="pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors hover:opacity-70"
                        style={{ color: "rgba(0,160,190,0.7)" }}
                      >
                        {showPassword ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                            <line x1="1" y1="1" x2="23" y2="23"/>
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                        )}
                      </button>
                    </div>
                    <div className="flex justify-end mt-1.5">
                      <button
                        type="button"
                        onClick={() => { setMode("forgot"); setError(""); setUnverifiedEmail(""); setResendMsg(""); }}
                        className="text-xs transition-colors underline underline-offset-2 hover:opacity-80"
                        style={{ color: "rgba(0,160,190,0.7)", fontFamily: '"Cairo", sans-serif' }}
                      >
                        Forgot password?
                      </button>
                    </div>
                  </Field>

                  {error && <ErrBox msg={error} />}

                  {unverifiedEmail && (
                    <div className="rounded-xl px-3 py-2.5 space-y-2"
                      style={{ background: "rgba(212,168,67,0.08)", border: "1px solid rgba(212,168,67,0.2)" }}>
                      <p className="text-xs" style={{ color: "rgba(160,110,0,0.9)" }}>
                        Your email address hasn&apos;t been verified yet.
                      </p>
                      {resendMsg ? (
                        <p className="text-xs" style={{ color: "rgba(0,160,190,0.8)" }}>{resendMsg}</p>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResend}
                          disabled={resendLoading || !isSupabaseReady}
                          className="text-xs font-semibold underline underline-offset-2 disabled:opacity-50 transition-colors hover:opacity-80"
                          style={{ color: "rgba(160,110,0,0.9)" }}
                        >
                          {resendLoading ? "Sending…" : "Resend verification email →"}
                        </button>
                      )}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-xl font-semibold transition-all disabled:opacity-50 min-h-[48px] hover:opacity-90 active:scale-[.98]"
                    style={{
                      background: "linear-gradient(135deg, #0070a0 0%, #00a8c8 40%, #00c8e8 70%, #f0c040 100%)",
                      color: "#ffffff",
                      fontFamily: '"Cairo", sans-serif',
                      letterSpacing: "0.04em",
                      boxShadow: "0 0 24px rgba(0,184,212,0.3), 0 2px 12px rgba(0,0,0,0.1)",
                    }}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {t.login_signing_in}
                      </span>
                    ) : t.login_title}
                  </button>
                </form>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t" style={{ borderColor: "rgba(0,184,212,0.15)" }} />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-3 text-xs" style={{ color: "rgba(0,160,190,0.5)", background: "rgba(240,248,255,0.9)", fontFamily: '"Cairo", sans-serif' }}>
                      {t.or}
                    </span>
                  </div>
                </div>

                {/* Google */}
                <button
                  onClick={handleGoogle}
                  disabled={googleLoading}
                  className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-medium text-sm transition-all disabled:opacity-50 min-h-[48px] hover:opacity-90 active:scale-[.98]"
                  style={{
                    background: "rgba(255,255,255,0.9)",
                    border: "1px solid rgba(0,184,212,0.2)",
                    color: "#0a1628",
                    fontFamily: '"Cairo", sans-serif',
                    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                  }}
                >
                  {googleLoading ? (
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
                      <path fill="#EA4335" d="M5.26 9.77C5.84 8.1 6.97 6.74 8.4 5.84L5.68 3.12A11.89 11.89 0 0 0 .5 12c0 1.94.47 3.77 1.3 5.38l2.77-2.16A7.01 7.01 0 0 1 5.26 9.77z"/>
                      <path fill="#FBBC05" d="M12 5c1.52 0 2.88.51 3.97 1.35l2.56-2.56A11.93 11.93 0 0 0 12 0C7.52 0 3.65 2.62 1.68 6.38l2.96 2.3A7.03 7.03 0 0 1 12 5z"/>
                      <path fill="#34A853" d="M12 19c-2.3 0-4.33-1.13-5.6-2.85l-2.78 2.17A11.9 11.9 0 0 0 12 24c3.08 0 5.87-1.16 8-3.06l-2.77-2.16A7.02 7.02 0 0 1 12 19z"/>
                      <path fill="#4285F4" d="M23.5 12c0-.79-.07-1.56-.2-2.31H12v4.64h6.46A5.54 5.54 0 0 1 17.23 18l2.77 2.16A11.95 11.95 0 0 0 23.5 12z"/>
                    </svg>
                  )}
                  {t.google_signin}
                </button>
              </div>
            )}
          </div>

          <p className="text-center text-sm mt-5" style={{ color: "rgba(20,60,100,0.55)", fontFamily: '"Cairo", sans-serif' }}>
            {t.no_account}{" "}
            <Link href="/signup" className="font-semibold underline underline-offset-2 hover:opacity-80" style={{ color: "#0a1628" }}>
              {t.signup}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
