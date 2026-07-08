"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useAuth } from "@/contexts/AuthContext";
import { LangToggle } from "@/components/ui/LangToggle";
import { useT } from "@/hooks/useT";
import { isSupabaseReady } from "@/lib/supabase";
import { authSendPasswordReset, authResendVerification } from "@/lib/supabase-auth";

// ─── Shared field components ──────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-green-200 text-xs font-semibold block mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function GreenInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full bg-white/10 border border-white/20 text-white placeholder-green-300/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-400 transition-colors ${props.className ?? ""}`}
    />
  );
}

function ErrBox({ msg }: { msg: string }) {
  return (
    <div role="alert" className="flex items-start gap-2 text-red-300 text-xs bg-red-500/10 border border-red-400/20 rounded-xl px-3 py-2.5">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      {msg}
    </div>
  );
}

function OkBox({ msg }: { msg: string }) {
  return (
    <div role="status" className="flex items-start gap-2 text-green-200 text-xs bg-green-500/10 border border-green-400/20 rounded-xl px-3 py-2.5">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5"><polyline points="20 6 9 17 4 12"/></svg>
      {msg}
    </div>
  );
}

// ─── Forgot-password panel ────────────────────────────────────────────────────

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
        <h2 className="text-white font-bold text-base">Reset your password</h2>
        <p className="text-green-300 text-xs mt-1">
          Enter your email and we&apos;ll send a reset link.
        </p>
      </div>

      {sent ? (
        <div className="space-y-4">
          <OkBox msg={`Reset link sent to ${email}. Check your inbox (and spam folder).`} />
          <p className="text-green-300/70 text-xs">
            The link expires in 1 hour. After clicking it you&apos;ll be able to set a new password.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSend} className="space-y-3">
          <Field label="Email address">
            <GreenInput
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
            <p className="text-yellow-300/80 text-xs bg-yellow-500/10 border border-yellow-400/20 rounded-xl px-3 py-2.5">
              Password reset requires Supabase configuration. Contact your administrator.
            </p>
          )}
          <button
            type="submit"
            disabled={loading || !isSupabaseReady}
            className="w-full py-3 rounded-xl bg-green-500 hover:bg-green-400 text-white font-semibold transition-colors disabled:opacity-50 min-h-[48px]"
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
        className="w-full flex items-center justify-center gap-1.5 text-green-300 hover:text-white text-sm transition-colors py-1"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
        Back to sign in
      </button>
    </div>
  );
}

// ─── Main login form ──────────────────────────────────────────────────────────

type Mode = "login" | "forgot";

export default function LoginPage() {
  const { login } = useAuth();
  const t = useT();
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // "unverified" state: we know the email, just need to prompt resend
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
    <div className="min-h-dvh bg-gradient-to-br from-green-950 via-green-900 to-green-800 flex flex-col items-center justify-center p-5">
      <div className="absolute top-4 right-4">
        <LangToggle dark />
      </div>

      <div className="w-full max-w-sm">
        {/* Logo + title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4 text-yellow-300">
            <svg xmlns="http://www.w3.org/2000/svg" width="52" height="52" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" opacity="0.85" />
              <polygon points="17,2 17.9,4.8 21,5 18.7,7 19.4,10 17,8.5 14.6,10 15.3,7 13,5 16.1,4.8" />
            </svg>
          </div>
          <h1 className="text-white text-2xl font-bold">
            {mode === "forgot" ? "Forgot password" : t.login_title}
          </h1>
          <p className="text-green-300 text-sm mt-1">
            {mode === "forgot" ? "We'll send you a reset link" : t.login_subtitle}
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
          {/* ── Forgot password mode ─────────────────────── */}
          {mode === "forgot" && (
            <ForgotPanel onBack={() => { setMode("login"); setError(""); }} />
          )}

          {/* ── Login mode ──────────────────────────────── */}
          {mode === "login" && (
            <div className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <Field label={t.login_email}>
                  <GreenInput
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
                    <GreenInput
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-green-300 hover:text-white transition-colors p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
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
                  {/* Forgot password link */}
                  <div className="flex justify-end mt-1.5">
                    <button
                      type="button"
                      onClick={() => { setMode("forgot"); setError(""); setUnverifiedEmail(""); setResendMsg(""); }}
                      className="text-green-300 hover:text-white text-xs transition-colors underline underline-offset-2"
                    >
                      Forgot password?
                    </button>
                  </div>
                </Field>

                {/* Error */}
                {error && <ErrBox msg={error} />}

                {/* Resend verification */}
                {unverifiedEmail && (
                  <div className="bg-yellow-500/10 border border-yellow-400/20 rounded-xl px-3 py-2.5 space-y-2">
                    <p className="text-yellow-200 text-xs">
                      Your email address hasn&apos;t been verified yet.
                    </p>
                    {resendMsg ? (
                      <p className="text-green-300 text-xs">{resendMsg}</p>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResend}
                        disabled={resendLoading || !isSupabaseReady}
                        className="text-yellow-300 hover:text-white text-xs font-semibold underline underline-offset-2 disabled:opacity-50 transition-colors"
                      >
                        {resendLoading ? "Sending…" : "Resend verification email →"}
                      </button>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-green-500 hover:bg-green-400 active:scale-[.98] text-white font-semibold transition-all disabled:opacity-50 min-h-[48px]"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {t.login_signing_in}
                    </span>
                  ) : t.login_title}
                </button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/20" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-3 text-green-300 text-xs bg-transparent">{t.or}</span>
                </div>
              </div>

              <button
                onClick={handleGoogle}
                disabled={googleLoading}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-[.98] text-white font-medium text-sm transition-all border border-white/20 disabled:opacity-50 min-h-[48px]"
              >
                {googleLoading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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

        <p className="text-center text-green-300 text-sm mt-5">
          {t.no_account}{" "}
          <Link href="/signup" className="text-white font-semibold underline underline-offset-2">{t.signup}</Link>
        </p>
      </div>
    </div>
  );
}
