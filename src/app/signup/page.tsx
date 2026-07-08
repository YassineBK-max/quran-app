"use client";
import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useAuth } from "@/contexts/AuthContext";
import { useClassroom } from "@/contexts/ClassroomContext";
import { LangToggle } from "@/components/ui/LangToggle";
import { useT } from "@/hooks/useT";
import { isSupabaseReady } from "@/lib/supabase";
import { authSignUp, authResendVerification } from "@/lib/supabase-auth";

function SignupForm() {
  const { signup, signupGoogle, updateUser, logout, user } = useAuth();
  const { joinClass } = useClassroom();
  const t = useT();
  const router = useRouter();
  const params = useSearchParams();

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

    // ── Supabase email verification (non-Google only) ────────────────────
    if (!isGoogle && isSupabaseReady) {
      const redirectTo = `${window.location.origin}/auth/verify`;
      const { needsVerification } = await authSignUp(email, password, redirectTo);
      if (needsVerification) {
        // Mark the just-created user as unverified and log them out
        // user is now set in context because signup() called setCurrentUserId
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

  return (
    <div className="min-h-dvh bg-gradient-to-br from-green-950 via-green-900 to-green-800 flex flex-col items-center justify-center p-5">
      {/* Language toggle */}
      <div className="absolute top-4 right-4">
        <LangToggle dark />
      </div>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3 text-yellow-300">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" opacity="0.85" />
              <polygon points="17,2 17.9,4.8 21,5 18.7,7 19.4,10 17,8.5 14.6,10 15.3,7 13,5 16.1,4.8" />
            </svg>
          </div>
          <h1 className="text-white text-2xl font-bold">{t.signup_title}</h1>
          <p className="text-green-300 text-sm mt-1">
            {step === "info" ? t.signup_info_subtitle : t.signup_role_subtitle}
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
          {/* ── Check your email ────────────────────────── */}
          {step === "verify-email" && (
            <div className="space-y-5 text-center">
              <div className="text-5xl">📬</div>
              <div className="space-y-1.5">
                <h2 className="text-white font-bold text-base">Check your email</h2>
                <p className="text-green-200 text-sm">
                  We sent a verification link to
                </p>
                <p className="text-white font-semibold text-sm break-all">{pendingEmail}</p>
                <p className="text-green-300/70 text-xs mt-1">
                  Click the link in the email to activate your account, then sign in.
                </p>
              </div>
              <div className="space-y-2 pt-1">
                {resendMsg ? (
                  <p className={`text-xs ${resendMsg.startsWith("Error") ? "text-red-300" : "text-green-300"}`}>
                    {resendMsg}
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendLoading}
                    className="text-green-300 hover:text-white text-xs underline underline-offset-2 transition-colors disabled:opacity-50"
                  >
                    {resendLoading ? "Sending…" : "Didn't get it? Resend verification email"}
                  </button>
                )}
                <div className="pt-2">
                  <Link href="/login" className="w-full block py-3 rounded-xl bg-green-500 hover:bg-green-400 text-white font-semibold transition-colors text-sm text-center">
                    Go to sign in
                  </Link>
                </div>
              </div>
            </div>
          )}

          {step !== "verify-email" && (step === "info" ? (
            <div className="space-y-4">
              <form onSubmit={handleInfoNext} className="space-y-4">
                <div>
                  <label className="text-green-200 text-xs font-medium block mb-1.5">{t.signup_name}</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder={t.signup_name_placeholder}
                    className="w-full bg-white/10 border border-white/20 text-white placeholder-green-300/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-400 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-green-200 text-xs font-medium block mb-1.5">{t.signup_email}</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="your@email.com"
                    className="w-full bg-white/10 border border-white/20 text-white placeholder-green-300/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-400 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-green-200 text-xs font-medium block mb-1.5">{t.signup_password}</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full bg-white/10 border border-white/20 text-white placeholder-green-300/50 rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:border-green-400 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-green-300 hover:text-white transition-colors p-1"
                      tabIndex={-1}
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
                </div>
                {error && <p className="text-red-300 text-xs bg-red-500/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>}
                <button type="submit" className="w-full py-3 rounded-xl bg-green-500 hover:bg-green-400 text-white font-semibold transition-colors">
                  {t.next}
                </button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/20" /></div>
                <div className="relative flex justify-center"><span className="px-3 text-green-300 text-xs">{t.or}</span></div>
              </div>

              <button
                onClick={handleGoogleSignup}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-sm transition-colors border border-white/20"
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
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {isGoogle && (
                <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 space-y-1">
                  <p className="text-white text-sm font-medium">{name}</p>
                  <p className="text-green-300/70 text-xs">{email}</p>
                </div>
              )}

              {isGoogle && !prefillName && (
                <div>
                  <label className="text-green-200 text-xs font-medium block mb-1.5">{t.signup_name}</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder={t.signup_name_placeholder}
                    className="w-full bg-white/10 border border-white/20 text-white placeholder-green-300/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-400 transition-colors"
                  />
                </div>
              )}

              <div>
                <label className="text-green-200 text-xs font-medium block mb-2">{t.signup_role_subtitle}</label>
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
                      className={`py-2.5 rounded-xl text-xs font-medium capitalize transition-colors border ${
                        role === r
                          ? "bg-green-500 border-green-400 text-white"
                          : "bg-white/10 border-white/20 text-green-200 hover:bg-white/20"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {role === "student" && (
                <div>
                  <label className="text-green-200 text-xs font-medium block mb-1.5">{t.signup_class_code}</label>
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="ABC123"
                    maxLength={6}
                    className="w-full bg-white/10 border border-white/20 text-white placeholder-green-300/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-400 transition-colors uppercase tracking-widest font-mono"
                  />
                  <p className="text-green-400/70 text-[10px] mt-1">{t.signup_class_code_hint}</p>
                </div>
              )}

              {role === "teacher" && (
                <div>
                  <label className="text-green-200 text-xs font-medium block mb-1.5">{t.signup_teacher_code}</label>
                  <input
                    type="password"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                    placeholder={t.signup_teacher_code_placeholder}
                    className="w-full bg-white/10 border border-white/20 text-white placeholder-green-300/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-400 transition-colors"
                  />
                </div>
              )}

              {role === "parent" && (
                <div>
                  <label className="text-green-200 text-xs font-medium block mb-1.5">{t.signup_parent_code}</label>
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    required
                    placeholder={t.signup_parent_code_placeholder}
                    maxLength={8}
                    className="w-full bg-white/10 border border-white/20 text-white placeholder-green-300/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-400 transition-colors uppercase tracking-widest font-mono"
                  />
                  <p className="text-green-400/70 text-[10px] mt-1">{t.signup_parent_code_hint}</p>
                </div>
              )}

              {error && <p className="text-red-300 text-xs bg-red-500/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>}

              <div className="flex gap-2">
                {!isGoogle && (
                  <button
                    type="button"
                    onClick={() => { setStep("info"); setError(""); }}
                    className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-green-200 font-medium transition-colors border border-white/20"
                  >
                    {t.back}
                  </button>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl bg-green-500 hover:bg-green-400 text-white font-semibold transition-colors disabled:opacity-50"
                >
                  {loading ? t.signup_creating : t.signup_btn}
                </button>
              </div>
            </form>
          ))}
        </div>

        <p className="text-center text-green-300 text-sm mt-5">
          {t.have_account}{" "}
          <Link href="/login" className="text-white font-semibold underline">{t.signin}</Link>
        </p>
      </div>
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
