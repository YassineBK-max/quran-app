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
            <circle cx="0"   cy="0"   r="2.5" fill="#d4a843" opacity="0.35"/>
            <circle cx="120" cy="0"   r="2.5" fill="#00b8d4" opacity="0.3"/>
            <circle cx="0"   cy="120" r="2.5" fill="#00b8d4" opacity="0.3"/>
            <circle cx="120" cy="120" r="2.5" fill="#d4a843" opacity="0.35"/>
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#lp-khatam)"/>
    </svg>
  );
}

function CornerFan({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) {
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

// ── Icons ─────────────────────────────────────────────────────────────────────
function MailIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
        <line x1="1" y1="1" x2="23" y2="23"/>
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/>
    </svg>
  );
}

// ── Field wrapper with icon ───────────────────────────────────────────────────
function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span style={{ color: "rgba(0,160,190,0.75)" }}>{icon}</span>
        <label className="block text-base font-semibold" style={{ color: "#0a1628", fontFamily: '"Cairo", sans-serif' }}>
          {label}
        </label>
      </div>
      {children}
    </div>
  );
}

// ── Input ─────────────────────────────────────────────────────────────────────
function NavyInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl px-4 py-3.5 text-base transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400/40 ${props.className ?? ""}`}
      style={{
        background: "rgba(255,255,255,0.95)",
        border: "1.5px solid rgba(0,184,212,0.3)",
        color: "#0a1628",
        fontSize: "1rem",
        ...props.style,
      }}
    />
  );
}

// ── Alert boxes ───────────────────────────────────────────────────────────────
function ErrBox({ msg }: { msg: string }) {
  return (
    <div role="alert" className="flex items-start gap-3 rounded-xl px-4 py-3"
      style={{ color: "#c0392b", background: "rgba(220,50,50,0.07)", border: "1.5px solid rgba(220,50,50,0.22)" }}>
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      <span className="text-sm font-medium leading-snug">{msg}</span>
    </div>
  );
}

function OkBox({ msg }: { msg: string }) {
  return (
    <div role="status" className="flex items-start gap-3 rounded-xl px-4 py-3"
      style={{ color: "rgba(0,130,160,0.9)", background: "rgba(0,184,212,0.07)", border: "1.5px solid rgba(0,184,212,0.25)" }}>
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
      <span className="text-sm font-medium leading-snug">{msg}</span>
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
    <div className="space-y-5">
      <div>
        <h2 className="font-bold text-xl" style={{ color: "#0a1628", fontFamily: '"Cairo", sans-serif' }}>
          Reset password
        </h2>
        <p className="text-sm mt-1.5 leading-relaxed" style={{ color: "rgba(20,60,100,0.6)" }}>
          Enter your email and we&apos;ll send a reset link.
        </p>
      </div>

      {sent ? (
        <div className="space-y-4">
          <OkBox msg={`Reset link sent to ${email}. Check your inbox (and spam folder).`} />
          <p className="text-sm" style={{ color: "rgba(20,60,100,0.5)" }}>
            The link expires in 1 hour.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSend} className="space-y-4">
          <Field label="Email address" icon={<MailIcon />}>
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
            <p className="text-sm rounded-xl px-4 py-3" style={{ color: "rgba(140,100,0,0.9)", background: "rgba(212,168,67,0.08)", border: "1px solid rgba(212,168,67,0.2)" }}>
              Password reset requires email configuration. Contact your administrator.
            </p>
          )}
          <button
            type="submit"
            disabled={loading || !isSupabaseReady}
            className="w-full py-4 rounded-xl font-bold text-base transition-all disabled:opacity-50 hover:opacity-90 active:scale-[.98]"
            style={{
              background: "linear-gradient(135deg, #0070a0 0%, #00a8c8 40%, #00c8e8 70%, #f0c040 100%)",
              color: "#ffffff",
              fontFamily: '"Cairo", sans-serif',
              minHeight: "56px",
              boxShadow: "0 0 20px rgba(0,184,212,0.25), 0 2px 10px rgba(0,0,0,0.1)",
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Sending…
              </span>
            ) : "Send reset link"}
          </button>
        </form>
      )}

      <button
        onClick={onBack}
        className="w-full flex items-center justify-center gap-2 text-base transition-colors py-2 hover:opacity-80 min-h-[44px]"
        style={{ color: "rgba(0,160,190,0.8)", fontFamily: '"Cairo", sans-serif' }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>
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
    const err = await login(email, password);
    setLoading(false);
    if (!err) { router.replace("/surahs"); return; }
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
      {/* Mosque background – left half */}
      <div className="absolute inset-y-0 left-0 w-1/2 pointer-events-none" style={{ zIndex: 0 }}>
        <Image src="/mosque_bg.png" alt="" fill sizes="50vw" className="object-cover object-top" style={{ opacity: 0.45 }} priority />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to right, transparent 30%, rgba(248,251,255,1) 100%)" }} />
      </div>

      <SignatureBg />
      <CornerFan pos="tl" />
      <CornerFan pos="tr" />
      <CornerFan pos="bl" />
      <CornerFan pos="br" />

      {/* ── Top bar ── */}
      <header
        className="relative z-20 flex items-center justify-between px-5 py-3 gap-3"
        style={{
          background: "rgba(255,255,255,0.9)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(0,184,212,0.14)",
        }}
      >
        <div className="absolute top-0 inset-x-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(0,184,212,0.5), rgba(212,168,67,0.5), transparent)" }} />

        <Link href="/" className="flex items-center gap-3 shrink-0">
          <Image src="/logo-qapp.png" alt="The Quran Academy" width={36} height={36} className="rounded-lg" />
          <span className="hidden sm:block text-base font-bold" style={{ color: "#0a1628", fontFamily: '"Cairo", sans-serif' }}>
            The Quran Academy
          </span>
        </Link>

        <nav className="flex items-center gap-2">
          <button
            onClick={() => updateSettings({ language: isAr ? "en" : "ar" })}
            className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl min-h-[44px] transition-colors"
            style={{ color: "rgba(0,160,190,0.9)", border: "1px solid rgba(0,184,212,0.25)", background: "rgba(0,184,212,0.05)", fontFamily: '"Cairo", sans-serif' }}
            aria-label="Switch language"
          >
            <GlobeIcon />
            <span>{isAr ? "English" : "العربية"}</span>
          </button>

          <Link
            href="/signup"
            className="flex items-center text-sm px-4 py-2 rounded-xl min-h-[44px] font-bold transition-opacity hover:opacity-90 active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg, #b07a20 0%, #d4a843 55%, #f0c040 100%)",
              color: "#0a1628",
              fontFamily: '"Cairo", sans-serif',
              boxShadow: "0 1px 8px rgba(212,168,67,0.3)",
            }}
          >
            {t.signup}
          </Link>
        </nav>
      </header>

      {/* ── Main form area ── */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-[400px]">

          {/* App identity block */}
          <div className="flex flex-col items-center mb-8">
            <Image src="/logo-qapp.png" alt="" width={72} height={72} className="rounded-2xl shadow-lg mb-4" style={{ boxShadow: "0 8px 30px rgba(0,100,160,0.15)" }} />
            <h1 className="text-3xl font-bold text-center" style={{ color: "#0a1628", fontFamily: '"Cairo", sans-serif' }}>
              {mode === "forgot" ? "Reset Password" : t.login_title}
            </h1>
            <p className="text-base mt-1.5 text-center" style={{ color: "rgba(0,120,160,0.7)", fontFamily: '"Cairo", sans-serif' }}>
              {mode === "forgot" ? "We'll send a link to your email" : t.login_subtitle}
            </p>
          </div>

          {/* Ornamental divider */}
          <div className="flex items-center gap-3 mb-6 w-full">
            <div className="flex-1 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(212,168,67,0.5))" }}/>
            <svg width="12" height="12" viewBox="0 0 10 10" fill="#00b8d4" opacity="0.7" aria-hidden="true"><polygon points="5,0 6,4 10,5 6,6 5,10 4,6 0,5 4,4"/></svg>
            <div className="flex-1 h-px" style={{ background: "linear-gradient(to left, transparent, rgba(212,168,67,0.5))" }}/>
          </div>

          {/* Form card */}
          <div
            className="rounded-2xl p-7"
            style={{
              background: "rgba(240,248,255,0.92)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
              border: "1.5px solid rgba(0,184,212,0.2)",
              boxShadow: "0 8px 40px rgba(0,80,140,0.08)",
            }}
          >
            {/* Forgot password view */}
            {mode === "forgot" && (
              <ForgotPanel onBack={() => { setMode("login"); setError(""); }} />
            )}

            {/* Login view */}
            {mode === "login" && (
              <div className="space-y-5">
                <form onSubmit={handleSubmit} className="space-y-5" noValidate>

                  <Field label={t.login_email} icon={<MailIcon />}>
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

                  <Field label={t.login_password} icon={<LockIcon />}>
                    <div className="relative">
                      <NavyInput
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                        placeholder="••••••••"
                        className="pr-14"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center transition-opacity hover:opacity-70 rounded-lg"
                        style={{ color: "rgba(0,140,170,0.7)" }}
                      >
                        <EyeIcon open={showPassword} />
                      </button>
                    </div>
                    <div className="flex justify-end mt-2">
                      <button
                        type="button"
                        onClick={() => { setMode("forgot"); setError(""); setUnverifiedEmail(""); setResendMsg(""); }}
                        className="text-sm transition-colors underline underline-offset-2 hover:opacity-80 min-h-[44px] px-1 flex items-center"
                        style={{ color: "rgba(0,140,170,0.75)", fontFamily: '"Cairo", sans-serif' }}
                      >
                        Forgot password?
                      </button>
                    </div>
                  </Field>

                  {error && <ErrBox msg={error} />}

                  {/* Unverified email — resend option */}
                  {unverifiedEmail && (
                    <div className="rounded-xl px-4 py-3 space-y-2.5"
                      style={{ background: "rgba(212,168,67,0.08)", border: "1.5px solid rgba(212,168,67,0.25)" }}>
                      <p className="text-sm font-medium" style={{ color: "rgba(140,90,0,0.9)" }}>
                        Your email hasn&apos;t been verified yet.
                      </p>
                      {resendMsg ? (
                        <p className="text-sm" style={{ color: "rgba(0,130,160,0.85)" }}>{resendMsg}</p>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResend}
                          disabled={resendLoading || !isSupabaseReady}
                          className="text-sm font-semibold underline underline-offset-2 disabled:opacity-50 transition-colors hover:opacity-80 min-h-[44px] flex items-center"
                          style={{ color: "rgba(140,90,0,0.9)" }}
                        >
                          {resendLoading ? "Sending…" : "Resend verification email →"}
                        </button>
                      )}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 rounded-xl font-bold text-base transition-all disabled:opacity-50 hover:opacity-90 active:scale-[.98]"
                    style={{
                      background: "linear-gradient(135deg, #0070a0 0%, #00a8c8 40%, #00c8e8 70%, #f0c040 100%)",
                      color: "#ffffff",
                      fontFamily: '"Cairo", sans-serif',
                      minHeight: "56px",
                      letterSpacing: "0.03em",
                      boxShadow: "0 0 24px rgba(0,184,212,0.3), 0 2px 12px rgba(0,0,0,0.1)",
                    }}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {t.login_signing_in}
                      </span>
                    ) : t.login_title}
                  </button>
                </form>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t" style={{ borderColor: "rgba(0,184,212,0.2)" }} />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-3 text-sm" style={{ color: "rgba(0,130,160,0.55)", background: "rgba(240,248,255,0.95)", fontFamily: '"Cairo", sans-serif' }}>
                      {t.or}
                    </span>
                  </div>
                </div>

                {/* Google sign in */}
                <button
                  onClick={handleGoogle}
                  disabled={googleLoading}
                  className="w-full flex items-center justify-center gap-3 py-4 rounded-xl font-semibold text-base transition-all disabled:opacity-50 hover:opacity-90 active:scale-[.98]"
                  style={{
                    background: "rgba(255,255,255,0.95)",
                    border: "1.5px solid rgba(0,0,0,0.12)",
                    color: "#1f1f1f",
                    fontFamily: '"Cairo", sans-serif',
                    minHeight: "56px",
                    boxShadow: "0 1px 6px rgba(0,0,0,0.08)",
                  }}
                >
                  {googleLoading ? (
                    <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
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

          <p className="text-center text-base mt-6" style={{ color: "rgba(20,60,100,0.6)", fontFamily: '"Cairo", sans-serif' }}>
            {t.no_account}{" "}
            <Link href="/signup" className="font-bold underline underline-offset-2 hover:opacity-80" style={{ color: "#0a1628" }}>
              {t.signup}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
