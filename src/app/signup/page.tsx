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
            <circle cx="0"   cy="0"   r="2.5" fill="#d4a843" opacity="0.35"/>
            <circle cx="120" cy="0"   r="2.5" fill="#00b8d4" opacity="0.3"/>
            <circle cx="0"   cy="120" r="2.5" fill="#00b8d4" opacity="0.3"/>
            <circle cx="120" cy="120" r="2.5" fill="#d4a843" opacity="0.35"/>
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#sp-khatam)"/>
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
function GlobeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/>
    </svg>
  );
}

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

function PersonIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 1 0-16 0"/>
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

// ── Role icons ────────────────────────────────────────────────────────────────
function StudentIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
    </svg>
  );
}

function TeacherIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8m-4-4v4"/>
      <path d="M7 8h.01M12 8h.01M17 8h.01M7 12h3m2 0h5"/>
    </svg>
  );
}

function ParentIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}

// ── Field wrapper ─────────────────────────────────────────────────────────────
function Field({ label, hint, icon, children }: { label: string; hint?: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        {icon && <span style={{ color: "rgba(0,160,190,0.75)" }}>{icon}</span>}
        <label className="block text-base font-semibold" style={{ color: "#0a1628", fontFamily: '"Cairo", sans-serif' }}>
          {label}
        </label>
      </div>
      {children}
      {hint && <p className="text-sm mt-1.5 leading-snug" style={{ color: "rgba(0,130,160,0.6)" }}>{hint}</p>}
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

// ── Error box ─────────────────────────────────────────────────────────────────
function ErrBox({ msg }: { msg: string }) {
  return (
    <div role="alert" className="flex items-start gap-3 rounded-xl px-4 py-3"
      style={{ color: "#c0392b", background: "rgba(220,50,50,0.07)", border: "1.5px solid rgba(220,50,50,0.22)" }}>
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      <span className="text-sm font-medium leading-snug">{msg}</span>
    </div>
  );
}

// ── Role card ─────────────────────────────────────────────────────────────────
type SignupRole = "student" | "teacher" | "parent";

const ROLES: Array<{
  id: SignupRole;
  labelKey: "signup_student" | "signup_teacher" | "signup_parent";
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
}> = [
  {
    id: "student",
    labelKey: "signup_student",
    subtitle: "I learn Quran",
    icon: <StudentIcon />,
    color: "#0070a0",
    bg: "rgba(0,112,160,0.08)",
  },
  {
    id: "teacher",
    labelKey: "signup_teacher",
    subtitle: "I teach Quran",
    icon: <TeacherIcon />,
    color: "#1a6b3a",
    bg: "rgba(26,107,58,0.08)",
  },
  {
    id: "parent",
    labelKey: "signup_parent",
    subtitle: "I have a child",
    icon: <ParentIcon />,
    color: "#7c3aed",
    bg: "rgba(124,58,237,0.08)",
  },
];

// ── Step indicator ────────────────────────────────────────────────────────────
function StepDots({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6" aria-label={`Step ${current} of 2`}>
      {[1, 2].map((n) => (
        <div
          key={n}
          className="rounded-full transition-all"
          style={{
            width: n === current ? 28 : 10,
            height: 10,
            background: n === current ? "linear-gradient(90deg, #0070a0, #00c8e8)" : "rgba(0,184,212,0.25)",
          }}
        />
      ))}
    </div>
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
      if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
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
      err = signupGoogle(name, email, role);
    } else {
      err = await signup(name, email, password, role, code || undefined);
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
    router.push("/surahs");
  };

  const cardStyle = {
    background: "rgba(240,248,255,0.92)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    border: "1.5px solid rgba(0,184,212,0.2)",
    boxShadow: "0 8px 40px rgba(0,80,140,0.08)",
  };

  return (
    <div
      className="min-h-dvh flex flex-col relative overflow-hidden"
      style={{ background: "linear-gradient(155deg, #f0f6ff 0%, #ffffff 55%, #f5f8ff 100%)" }}
    >
      {/* Mosque background */}
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
            href="/login"
            className="text-sm px-4 py-2 rounded-xl min-h-[44px] flex items-center font-semibold transition-colors hover:opacity-80"
            style={{ color: "rgba(140,100,10,0.9)", border: "1px solid rgba(212,168,67,0.35)", background: "rgba(212,168,67,0.07)", fontFamily: '"Cairo", sans-serif' }}
          >
            {t.signin}
          </Link>
        </nav>
      </header>

      {/* ── Main ── */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-[420px]">

          {/* App identity */}
          <div className="flex flex-col items-center mb-6">
            <Image src="/logo-qapp.png" alt="" width={64} height={64} className="rounded-2xl shadow-lg mb-4" style={{ boxShadow: "0 8px 30px rgba(0,100,160,0.15)" }} />
            <h1 className="text-3xl font-bold text-center" style={{ color: "#0a1628", fontFamily: '"Cairo", sans-serif' }}>
              {step === "verify-email" ? "Check your email" : t.signup_title}
            </h1>
            {step !== "verify-email" && (
              <p className="text-base mt-1.5 text-center" style={{ color: "rgba(0,120,160,0.7)", fontFamily: '"Cairo", sans-serif' }}>
                {step === "info" ? t.signup_info_subtitle : t.signup_role_subtitle}
              </p>
            )}
          </div>

          {/* Step dots for info / role */}
          {(step === "info" || step === "role") && !isGoogle && (
            <StepDots current={step === "info" ? 1 : 2} />
          )}

          {/* Ornamental divider */}
          {step !== "verify-email" && (
            <div className="flex items-center gap-3 mb-6 w-full">
              <div className="flex-1 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(212,168,67,0.5))" }}/>
              <svg width="12" height="12" viewBox="0 0 10 10" fill="#00b8d4" opacity="0.7" aria-hidden="true"><polygon points="5,0 6,4 10,5 6,6 5,10 4,6 0,5 4,4"/></svg>
              <div className="flex-1 h-px" style={{ background: "linear-gradient(to left, transparent, rgba(212,168,67,0.5))" }}/>
            </div>
          )}

          {/* Form card */}
          <div className="rounded-2xl p-7" style={cardStyle}>

            {/* ── Verify email step ── */}
            {step === "verify-email" && (
              <div className="space-y-6 text-center">
                {/* Big envelope icon */}
                <div className="flex items-center justify-center w-24 h-24 rounded-full mx-auto"
                  style={{ background: "rgba(0,184,212,0.1)", border: "2px solid rgba(0,184,212,0.2)" }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(0,140,170,0.8)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                  </svg>
                </div>

                <div className="space-y-2">
                  <p className="text-base leading-relaxed" style={{ color: "rgba(20,60,100,0.7)" }}>
                    We sent a verification link to
                  </p>
                  <p className="font-bold text-lg break-all" style={{ color: "#0a1628" }}>{pendingEmail}</p>
                  <p className="text-sm leading-relaxed mt-2" style={{ color: "rgba(20,60,100,0.5)" }}>
                    Click the link in the email to activate your account, then sign in.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  {resendMsg ? (
                    <p className="text-sm" style={{ color: resendMsg.startsWith("Error") ? "#c0392b" : "rgba(0,130,160,0.8)" }}>
                      {resendMsg}
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resendLoading}
                      className="text-base underline underline-offset-2 transition-colors disabled:opacity-50 hover:opacity-70 min-h-[44px] flex items-center justify-center gap-2 w-full"
                      style={{ color: "rgba(0,140,170,0.8)", fontFamily: '"Cairo", sans-serif' }}
                    >
                      {resendLoading ? (
                        <><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />Sending…</>
                      ) : "Didn't get it? Resend email"}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => router.push("/login")}
                    className="w-full py-4 rounded-xl font-bold text-base transition-all hover:opacity-90 active:scale-[.98]"
                    style={{
                      background: "linear-gradient(135deg, #0070a0 0%, #00a8c8 40%, #00c8e8 70%, #f0c040 100%)",
                      color: "#ffffff",
                      fontFamily: '"Cairo", sans-serif',
                      minHeight: "56px",
                      boxShadow: "0 0 24px rgba(0,184,212,0.3)",
                    }}
                  >
                    Go to sign in
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 1: Info ── */}
            {step === "info" && (
              <div className="space-y-5">
                <form onSubmit={handleInfoNext} className="space-y-5">
                  <Field label={t.signup_name} icon={<PersonIcon />}>
                    <NavyInput
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder={t.signup_name_placeholder}
                      autoComplete="name"
                    />
                  </Field>

                  <Field label={t.signup_email} icon={<MailIcon />}>
                    <NavyInput
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="your@email.com"
                      autoComplete="email"
                    />
                  </Field>

                  <Field label={t.signup_password} icon={<LockIcon />}>
                    <div className="relative">
                      <NavyInput
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="At least 8 characters"
                        className="pr-14"
                        autoComplete="new-password"
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        tabIndex={-1}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center transition-opacity hover:opacity-70 rounded-lg"
                        style={{ color: "rgba(0,140,170,0.7)" }}
                      >
                        <EyeIcon open={showPassword} />
                      </button>
                    </div>
                    {/* Password strength bar */}
                    {password.length > 0 && (
                      <div className="flex gap-1 mt-2" aria-hidden="true">
                        {[4, 7, 10, 14].map((threshold, i) => (
                          <div
                            key={i}
                            className="h-1.5 flex-1 rounded-full transition-all duration-300"
                            style={{
                              background: password.length >= threshold
                                ? i === 0 ? "#ef4444" : i === 1 ? "#f59e0b" : i === 2 ? "#22c55e" : "#16a34a"
                                : "rgba(0,0,0,0.1)",
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </Field>

                  {error && <ErrBox msg={error} />}

                  <button
                    type="submit"
                    className="w-full py-4 rounded-xl font-bold text-base transition-all hover:opacity-90 active:scale-[.98]"
                    style={{
                      background: "linear-gradient(135deg, #0070a0 0%, #00a8c8 40%, #00c8e8 70%, #f0c040 100%)",
                      color: "#ffffff",
                      fontFamily: '"Cairo", sans-serif',
                      minHeight: "56px",
                      boxShadow: "0 0 24px rgba(0,184,212,0.3)",
                    }}
                  >
                    {t.next} →
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

                {/* Google signup */}
                <button
                  onClick={handleGoogleSignup}
                  className="w-full flex items-center justify-center gap-3 py-4 rounded-xl font-semibold text-base transition-all hover:opacity-90 active:scale-[.98]"
                  style={{
                    background: "rgba(255,255,255,0.95)",
                    border: "1.5px solid rgba(0,0,0,0.12)",
                    color: "#1f1f1f",
                    fontFamily: '"Cairo", sans-serif',
                    minHeight: "56px",
                    boxShadow: "0 1px 6px rgba(0,0,0,0.08)",
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
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
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Google user identity pill */}
                {isGoogle && (
                  <div className="rounded-xl px-4 py-3 flex items-center gap-3"
                    style={{ background: "rgba(0,184,212,0.07)", border: "1px solid rgba(0,184,212,0.18)" }}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm shrink-0"
                      style={{ background: "linear-gradient(135deg,#0070a0,#00c8e8)" }}>
                      {(name || "?")[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "#0a1628" }}>{name}</p>
                      <p className="text-xs" style={{ color: "rgba(0,140,170,0.7)" }}>{email}</p>
                    </div>
                  </div>
                )}

                {/* Role selection — large visual cards */}
                <div>
                  <p className="text-base font-bold mb-3" style={{ color: "#0a1628", fontFamily: '"Cairo", sans-serif' }}>
                    Who are you?
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {ROLES.map(({ id, labelKey, subtitle, icon, color, bg }) => {
                      const selected = role === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => { setRole(id); setCode(""); setError(""); }}
                          className="flex flex-col items-center gap-2 py-5 px-2 rounded-2xl transition-all hover:opacity-90 active:scale-[.97] focus:outline-none focus:ring-2 focus:ring-offset-1"
                          style={{
                            background: selected ? bg : "rgba(255,255,255,0.8)",
                            border: selected ? `2px solid ${color}` : "1.5px solid rgba(0,0,0,0.08)",
                            color: selected ? color : "rgba(20,60,100,0.6)",
                            boxShadow: selected ? `0 4px 20px ${color}25` : "none",
                          }}
                          aria-pressed={selected}
                        >
                          <span style={{ color: selected ? color : "rgba(80,100,130,0.6)" }}>{icon}</span>
                          <span className="text-sm font-bold leading-tight text-center" style={{ fontFamily: '"Cairo", sans-serif' }}>
                            {t[labelKey]}
                          </span>
                          <span className="text-xs text-center leading-tight opacity-75">
                            {subtitle}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Role-specific code input */}
                {role === "student" && (
                  <Field label={t.signup_class_code} hint={t.signup_class_code_hint}>
                    <NavyInput
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      placeholder="ABC123"
                      maxLength={6}
                      className="uppercase tracking-widest font-mono text-center text-xl"
                      autoComplete="off"
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
                      className="uppercase tracking-widest font-mono text-center text-xl"
                      autoComplete="off"
                    />
                  </Field>
                )}

                {error && <ErrBox msg={error} />}

                <div className="flex gap-3">
                  {!isGoogle && (
                    <button
                      type="button"
                      onClick={() => { setStep("info"); setError(""); }}
                      className="flex-1 py-4 rounded-xl font-semibold text-base transition-all hover:opacity-80 active:scale-[.98] min-h-[56px]"
                      style={{
                        background: "rgba(255,255,255,0.8)",
                        border: "1.5px solid rgba(0,184,212,0.25)",
                        color: "rgba(20,60,100,0.7)",
                        fontFamily: '"Cairo", sans-serif',
                      }}
                    >
                      ← {t.back}
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-4 rounded-xl font-bold text-base transition-all disabled:opacity-50 hover:opacity-90 active:scale-[.98] min-h-[56px]"
                    style={{
                      background: "linear-gradient(135deg, #0070a0 0%, #00a8c8 40%, #00c8e8 70%, #f0c040 100%)",
                      color: "#ffffff",
                      fontFamily: '"Cairo", sans-serif',
                      boxShadow: "0 0 24px rgba(0,184,212,0.3)",
                    }}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {t.signup_creating}
                      </span>
                    ) : t.signup_btn}
                  </button>
                </div>
              </form>
            )}
          </div>

          <p className="text-center text-base mt-6" style={{ color: "rgba(20,60,100,0.6)", fontFamily: '"Cairo", sans-serif' }}>
            {t.have_account}{" "}
            <Link href="/login" className="font-bold underline underline-offset-2 hover:opacity-80" style={{ color: "#0a1628" }}>
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
