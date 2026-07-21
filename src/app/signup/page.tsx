"use client";
import { useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useAuth } from "@/contexts/AuthContext";
import { useClassroom } from "@/contexts/ClassroomContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useT } from "@/hooks/useT";
import { isSupabaseReady } from "@/lib/supabase";
import { authSignUp, authResendVerification } from "@/lib/supabase-auth";

// ── Geometric background ──────────────────────────────────────────────────────
function SignatureBg() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="sp-khatam" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
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
        <pattern id="sp-vine" x="0" y="0" width="240" height="240" patternUnits="userSpaceOnUse">
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
      <rect width="100%" height="100%" fill="url(#sp-khatam)"/>
      <rect width="100%" height="100%" fill="url(#sp-vine)"/>
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

// ── Shared input ──────────────────────────────────────────────────────────────
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

// ── Field label ───────────────────────────────────────────────────────────────
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(0,160,190,0.9)", fontFamily: '"Cairo", sans-serif' }}>
        {label}
      </label>
      {children}
      {hint && <p className="text-[10px] mt-1" style={{ color: "rgba(0,160,190,0.5)" }}>{hint}</p>}
    </div>
  );
}

// ── Error box ─────────────────────────────────────────────────────────────────
function ErrBox({ msg }: { msg: string }) {
  return (
    <div role="alert" className="flex items-start gap-2 text-xs rounded-xl px-3 py-2.5"
      style={{ color: "#c0392b", background: "rgba(220,50,50,0.07)", border: "1px solid rgba(220,50,50,0.18)" }}>
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      {msg}
    </div>
  );
}

// ── Primary button ────────────────────────────────────────────────────────────
function PrimaryBtn({ children, disabled, type = "submit", onClick }: {
  children: React.ReactNode;
  disabled?: boolean;
  type?: "submit" | "button";
  onClick?: () => void;
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className="w-full py-3.5 rounded-xl font-semibold transition-all disabled:opacity-50 min-h-[48px] hover:opacity-90 active:scale-[.98]"
      style={{
        background: "linear-gradient(135deg, #0070a0 0%, #00a8c8 40%, #00c8e8 70%, #f0c040 100%)",
        color: "#ffffff",
        fontFamily: '"Cairo", sans-serif',
        letterSpacing: "0.04em",
        boxShadow: "0 0 24px rgba(0,184,212,0.3), 0 2px 12px rgba(0,0,0,0.1)",
      }}
    >
      {children}
    </button>
  );
}

// ── Ghost button ──────────────────────────────────────────────────────────────
function GhostBtn({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-1 py-3.5 rounded-xl font-medium min-h-[48px] transition-all hover:opacity-80 active:scale-[.98]"
      style={{
        background: "rgba(255,255,255,0.7)",
        border: "1px solid rgba(0,184,212,0.2)",
        color: "rgba(20,60,100,0.7)",
        fontFamily: '"Cairo", sans-serif',
      }}
    >
      {children}
    </button>
  );
}

// ── Main signup form ──────────────────────────────────────────────────────────
function SignupForm() {
  const { signup, signupGoogle, updateUser, logout, user } = useAuth();
  const { joinClass } = useClassroom();
  const { settings, updateSettings } = useSettings();
  const t = useT();
  const router = useRouter();
  const params = useSearchParams();
  const isAr = settings.language === "ar";

  const isGoogle = params.get("google") === "1";
  const prefillEmail = params.get("email") ?? "";
  const prefillName = params.get("name") ?? "";

  const [step, setStep] = useState<"info" | "role" | "verify-email">(
    isGoogle && prefillEmail && prefillName ? "role" : "info"
  );
  const [pendingEmail, setPendingEmail] = useState("");
  const [name, setName] = useState(prefillName);
  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  type SignupRole = "student" | "teacher" | "parent";
  const [role, setRole] = useState<SignupRole>("student");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState("");

  const handleInfoNext = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) { setError("Please enter your name."); return; }
    if (!isGoogle) {
      if (!email.trim()) { setError("Please enter your email."); return; }
      if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    }
    setStep("role");
  };

  const handleGoogleSignup = async () => {
    await signIn("google", { callbackUrl: "/auth/google-callback" });
  };

  const handleResend = async () => {
    setResendLoading(true);
    setResendMsg("");
    const redirectTo = `${window.location.origin}/auth/verify`;
    const err = await authResendVerification(pendingEmail, redirectTo);
    setResendLoading(false);
    setResendMsg(err ? `Error: ${err}` : "Verification email resent! Check your inbox.");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    let err: string | null;
    if (isGoogle) {
      err = signupGoogle(name, email, role, code || undefined);
    } else {
      err = signup(name, email, password, role, code || undefined);
    }

    if (err) { setError(err); setLoading(false); return; }

    if (role === "student" && code && code.length === 6) {
      const joinErr = joinClass(code);
      if (joinErr && joinErr !== "You are already in this class.") {
        setError(joinErr); setLoading(false); return;
      }
    }

    if (!isGoogle && isSupabaseReady) {
      const redirectTo = `${window.location.origin}/auth/verify`;
      const { needsVerification } = await authSignUp(email, password, redirectTo);
      if (needsVerification) {
        const uid = user?.id ?? "";
        if (uid) updateUser(uid, { emailVerified: false });
        logout();
        setPendingEmail(email);
        setLoading(false);
        setStep("verify-email");
        return;
      }
    }

    setLoading(false);
    router.push("/");
  };

  const cardStyle = {
    background: "rgba(240,248,255,0.88)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    border: "1px solid rgba(0,184,212,0.18)",
    boxShadow: "0 4px 32px rgba(0,100,160,0.06)",
  };

  const stepLabel = step === "info"
    ? t.signup_info_subtitle
    : step === "role"
    ? t.signup_role_subtitle
    : "";

  return (
    <div
      className="min-h-dvh flex flex-col relative overflow-hidden"
      style={{ background: "linear-gradient(155deg, #f0f6ff 0%, #ffffff 55%, #f5f8ff 100%)" }}
    >
      {/* Background photo – left half */}
      <div className="absolute inset-y-0 left-0 w-1/2 pointer-events-none" style={{ zIndex: 0 }}>
        <Image src="/mosque_bg.png" alt="" fill sizes="50vw" className="object-cover object-top" style={{ opacity: 0.5 }} priority />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to right, transparent 30%, rgba(248,251,255,1) 100%)" }} />
      </div>

      {/* Geometric patterns */}
      <SignatureBg />
      <CornerFan pos="tl" />
      <CornerFan pos="tr" />
      <CornerFan pos="bl" />
      <CornerFan pos="br" />

      {/* Centre glow */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: [
          "radial-gradient(ellipse 55% 40% at 50% 18%, rgba(0,184,212,0.06) 0%, transparent 65%)",
          "radial-gradient(ellipse 45% 35% at 50% 88%, rgba(212,168,67,0.06) 0%, transparent 65%)",
        ].join(", "),
      }} />

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
          style={{ background: "linear-gradient(90deg, transparent, rgba(0,184,212,0.5), rgba(212,168,67,0.5), transparent)" }} />

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
            style={{ color: "rgba(0,160,190,0.9)", border: "1px solid rgba(0,184,212,0.22)", background: "rgba(0,184,212,0.05)", fontFamily: '"Cairo", sans-serif' }}
          >
            <GlobeIcon />
            <span>{isAr ? "English" : "العربية"}</span>
          </button>
          <Link
            href="/login"
            className="text-xs px-3.5 py-1.5 rounded-lg min-h-[34px] flex items-center font-medium transition-colors hover:opacity-80"
            style={{ color: "rgba(160,110,20,0.9)", border: "1px solid rgba(212,168,67,0.3)", background: "rgba(212,168,67,0.06)", fontFamily: '"Cairo", sans-serif' }}
          >
            {t.signin}
          </Link>
        </nav>
      </header>

      {/* ── Main ──────────────────────────────────────────────────── */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm">
          {/* Emblem + title */}
          <div className="flex flex-col items-center mb-6">
            <StarEmblem />
            <h1 className="mt-3 text-2xl font-bold" style={{ color: "#0a1628", fontFamily: '"Cairo", sans-serif' }}>
              {step === "verify-email" ? "Check your email" : t.signup_title}
            </h1>
            {stepLabel && (
              <p className="text-sm mt-1" style={{ color: "rgba(0,160,190,0.7)", fontFamily: '"Cairo", sans-serif' }}>
                {stepLabel}
              </p>
            )}
          </div>

          {/* Ornamental rule */}
          <div className="flex items-center gap-3 mb-6 w-full">
            <div className="flex-1 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(212,168,67,0.45))" }}/>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="#00b8d4" opacity="0.7" aria-hidden="true"><polygon points="5,0 6,4 10,5 6,6 5,10 4,6 0,5 4,4"/></svg>
            <div className="flex-1 h-px" style={{ background: "linear-gradient(to left, transparent, rgba(212,168,67,0.45))" }}/>
          </div>

          {/* Form card */}
          <div className="rounded-2xl p-6" style={cardStyle}>

            {/* ── Verify email ── */}
            {step === "verify-email" && (
              <div className="space-y-5 text-center">
                <div className="text-5xl">📬</div>
                <div className="space-y-1.5">
                  <p className="text-sm" style={{ color: "rgba(20,60,100,0.6)" }}>We sent a verification link to</p>
                  <p className="font-semibold text-sm break-all" style={{ color: "#0a1628" }}>{pendingEmail}</p>
                  <p className="text-xs mt-1" style={{ color: "rgba(20,60,100,0.45)" }}>
                    Click the link in the email to activate your account, then sign in.
                  </p>
                </div>
                <div className="space-y-3 pt-1">
                  {resendMsg ? (
                    <p className="text-xs" style={{ color: resendMsg.startsWith("Error") ? "#c0392b" : "rgba(0,160,190,0.8)" }}>
                      {resendMsg}
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resendLoading}
                      className="text-xs underline underline-offset-2 transition-colors disabled:opacity-50 hover:opacity-70"
                      style={{ color: "rgba(0,160,190,0.7)" }}
                    >
                      {resendLoading ? "Sending…" : "Didn't get it? Resend verification email"}
                    </button>
                  )}
                  <PrimaryBtn type="button" onClick={() => router.push("/login")}>
                    Go to sign in
                  </PrimaryBtn>
                </div>
              </div>
            )}

            {/* ── Step 1: Info ── */}
            {step === "info" && (
              <div className="space-y-4">
                <form onSubmit={handleInfoNext} className="space-y-4">
                  <Field label={t.signup_name}>
                    <NavyInput
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder={t.signup_name_placeholder}
                    />
                  </Field>
                  <Field label={t.signup_email}>
                    <NavyInput
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="your@email.com"
                    />
                  </Field>
                  <Field label={t.signup_password}>
                    <div className="relative">
                      <NavyInput
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        className="pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        tabIndex={-1}
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
                  </Field>
                  {error && <ErrBox msg={error} />}
                  <PrimaryBtn>{t.next}</PrimaryBtn>
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
                  onClick={handleGoogleSignup}
                  className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-medium text-sm transition-all min-h-[48px] hover:opacity-90 active:scale-[.98]"
                  style={{
                    background: "rgba(255,255,255,0.9)",
                    border: "1px solid rgba(0,184,212,0.2)",
                    color: "#0a1628",
                    fontFamily: '"Cairo", sans-serif',
                    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M5.26 9.77C5.84 8.1 6.97 6.74 8.4 5.84L5.68 3.12A11.89 11.89 0 0 0 .5 12c0 1.94.47 3.77 1.3 5.38l2.77-2.16A7.01 7.01 0 0 1 5.26 9.77z"/>
                    <path fill="#FBBC05" d="M12 5c1.52 0 2.88.51 3.97 1.35l2.56-2.56A11.93 11.93 0 0 0 12 0C7.52 0 3.65 2.62 1.68 6.38l2.96 2.3A7.03 7.03 0 0 1 12 5z"/>
                    <path fill="#34A853" d="M12 19c-2.3 0-4.33-1.13-5.6-2.85l-2.78 2.17A11.9 11.9 0 0 0 12 24c3.08 0 5.87-1.16 8-3.06l-2.77-2.16A7.02 7.02 0 0 1 12 19z"/>
                    <path fill="#4285F4" d="M23.5 12c0-.79-.07-1.56-.2-2.31H12v4.64h6.46A5.54 5.54 0 0 1 17.23 18l2.77 2.16A11.95 11.95 0 0 0 23.5 12z"/>
                  </svg>
                  {t.google_signin}
                </button>
              </div>
            )}

            {/* ── Step 2: Role ── */}
            {step === "role" && (
              <form onSubmit={handleSubmit} className="space-y-4">
                {isGoogle && (
                  <div className="rounded-xl px-4 py-3 space-y-0.5"
                    style={{ background: "rgba(0,184,212,0.06)", border: "1px solid rgba(0,184,212,0.15)" }}>
                    <p className="text-sm font-medium" style={{ color: "#0a1628" }}>{name}</p>
                    <p className="text-xs" style={{ color: "rgba(0,160,190,0.6)" }}>{email}</p>
                  </div>
                )}

                {isGoogle && !prefillName && (
                  <Field label={t.signup_name}>
                    <NavyInput value={name} onChange={(e) => setName(e.target.value)} required placeholder={t.signup_name_placeholder} />
                  </Field>
                )}

                {/* Role selector */}
                <div>
                  <label className="block text-xs font-semibold mb-2" style={{ color: "rgba(0,160,190,0.9)", fontFamily: '"Cairo", sans-serif' }}>
                    {t.signup_role_subtitle}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { r: "student" as const, label: t.signup_student },
                      { r: "teacher" as const, label: t.signup_teacher },
                      { r: "parent" as const, label: t.signup_parent },
                    ]).map(({ r, label }) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => { setRole(r); setCode(""); setError(""); }}
                        className="py-2.5 rounded-xl text-xs font-medium capitalize transition-all hover:opacity-90 active:scale-[.98]"
                        style={role === r ? {
                          background: "linear-gradient(135deg, #0070a0, #00c8e8)",
                          color: "#ffffff",
                          border: "1px solid rgba(0,184,212,0.4)",
                          boxShadow: "0 2px 8px rgba(0,184,212,0.25)",
                        } : {
                          background: "rgba(255,255,255,0.7)",
                          border: "1px solid rgba(0,184,212,0.2)",
                          color: "rgba(20,60,100,0.7)",
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {role === "student" && (
                  <Field label={t.signup_class_code} hint={t.signup_class_code_hint}>
                    <NavyInput
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      placeholder="ABC123"
                      maxLength={6}
                      className="uppercase tracking-widest font-mono"
                    />
                  </Field>
                )}

                {role === "teacher" && (
                  <Field label={t.signup_teacher_code}>
                    <NavyInput
                      type="password"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      required
                      placeholder={t.signup_teacher_code_placeholder}
                    />
                  </Field>
                )}

                {role === "parent" && (
                  <Field label={t.signup_parent_code} hint={t.signup_parent_code_hint}>
                    <NavyInput
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      required
                      placeholder={t.signup_parent_code_placeholder}
                      maxLength={8}
                      className="uppercase tracking-widest font-mono"
                    />
                  </Field>
                )}

                {error && <ErrBox msg={error} />}

                <div className="flex gap-2">
                  {!isGoogle && (
                    <GhostBtn onClick={() => { setStep("info"); setError(""); }}>
                      {t.back}
                    </GhostBtn>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3.5 rounded-xl font-semibold transition-all disabled:opacity-50 min-h-[48px] hover:opacity-90 active:scale-[.98]"
                    style={{
                      background: "linear-gradient(135deg, #0070a0 0%, #00a8c8 40%, #00c8e8 70%, #f0c040 100%)",
                      color: "#ffffff",
                      fontFamily: '"Cairo", sans-serif',
                      letterSpacing: "0.04em",
                      boxShadow: "0 0 24px rgba(0,184,212,0.3), 0 2px 12px rgba(0,0,0,0.1)",
                    }}
                  >
                    {loading ? t.signup_creating : t.signup_btn}
                  </button>
                </div>
              </form>
            )}
          </div>

          <p className="text-center text-sm mt-5" style={{ color: "rgba(20,60,100,0.55)", fontFamily: '"Cairo", sans-serif' }}>
            {t.have_account}{" "}
            <Link href="/login" className="font-semibold underline underline-offset-2 hover:opacity-80" style={{ color: "#0a1628" }}>
              {t.signin}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
