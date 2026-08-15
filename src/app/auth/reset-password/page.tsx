"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { authExchangeResetCode, authSetNewPassword } from "@/lib/supabase-auth";
import { AuthPageShell, authCardStyle, authPrimaryButtonStyle } from "@/components/auth/AuthBackground";

// Supabase sends the password-reset link to this route.
// Supported URL formats:
//   /auth/reset-password?code=XXX                    (PKCE flow)
//   /auth/reset-password?token_hash=XXX&type=recovery (OTP flow)

const inputStyle = {
  background: "rgba(255,255,255,0.95)",
  border: "1.5px solid rgba(0,184,212,0.3)",
  color: "#0a1628",
  fontSize: "1rem",
} as const;

function ResetPasswordInner() {
  const params = useSearchParams();
  const router = useRouter();
  const { updatePassword } = useAuth();

  const [phase, setPhase] = useState<"loading" | "form" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [sessionEmail, setSessionEmail] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Exchange the link code for a Supabase session on mount
  useEffect(() => {
    const code = params.get("code");
    const tokenHash = params.get("token_hash");
    const type = params.get("type");

    authExchangeResetCode({ code, tokenHash, type })
      .then(({ email, error }) => {
        if (error || !email) {
          setErrorMsg(error ?? "Invalid or expired reset link.");
          setPhase("error");
          return;
        }
        setSessionEmail(email);
        setPhase("form");
      })
      .catch((e: unknown) => {
        setErrorMsg(e instanceof Error ? e.message : "Unknown error.");
        setPhase("error");
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (newPassword.length < 8) {
      setFormError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setFormError("Passwords don't match.");
      return;
    }

    setSaving(true);
    const err = await authSetNewPassword(newPassword);
    if (err) {
      setFormError(err);
      setSaving(false);
      return;
    }

    // Sync the new password into the localStorage account (hashed)
    if (sessionEmail) {
      await updatePassword(sessionEmail, newPassword);
    }

    setPhase("success");
    setTimeout(() => router.replace("/login"), 3000);
  };

  const EyeOpen = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  );
  const EyeClosed = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );

  return (
    <AuthPageShell>
      <div className="flex flex-col items-center mb-6">
        <Image src="/logo-qapp.png" alt="" width={64} height={64} className="rounded-2xl shadow-lg" style={{ boxShadow: "0 8px 30px rgba(0,100,160,0.15)" }} />
      </div>

      <div className="rounded-2xl p-7 space-y-5" style={authCardStyle}>
        {/* ── Loading ─────────────────────────────────── */}
        {phase === "loading" && (
          <div className="text-center py-4 space-y-4">
            <div className="w-10 h-10 rounded-full animate-spin mx-auto" style={{ border: "2px solid rgba(0,184,212,0.2)", borderTopColor: "#00a8c8" }} />
            <p className="text-sm" style={{ color: "rgba(0,120,160,0.7)" }}>Verifying your reset link…</p>
          </div>
        )}

        {/* ── Error ───────────────────────────────────── */}
        {phase === "error" && (
          <div className="text-center space-y-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto" style={{ background: "rgba(220,50,50,0.08)", border: "1.5px solid rgba(220,50,50,0.22)" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#c0392b" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <div>
              <h2 className="font-bold text-base" style={{ color: "#0a1628", fontFamily: '"Cairo", sans-serif' }}>Link expired or invalid</h2>
              <p className="text-sm mt-1" style={{ color: "#c0392b" }}>{errorMsg}</p>
              <p className="text-xs mt-2" style={{ color: "rgba(20,60,100,0.5)" }}>
                Password reset links expire after 1 hour and can only be used once.
              </p>
            </div>
            <Link
              href="/login"
              className="block w-full py-3 rounded-xl font-bold text-sm text-center transition-all hover:opacity-90 active:scale-[.98]"
              style={authPrimaryButtonStyle}
            >
              Back to sign in
            </Link>
          </div>
        )}

        {/* ── New password form ────────────────────────── */}
        {phase === "form" && (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="text-center pb-1">
              <h2 className="font-bold text-lg" style={{ color: "#0a1628", fontFamily: '"Cairo", sans-serif' }}>Set a new password</h2>
              {sessionEmail && (
                <p className="text-xs mt-1" style={{ color: "rgba(0,120,160,0.7)" }}>{sessionEmail}</p>
              )}
            </div>

            {/* New password */}
            <div>
              <label className="text-xs font-semibold block mb-1.5" style={{ color: "#0a1628", fontFamily: '"Cairo", sans-serif' }}>
                New password
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  className="w-full rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/40 transition-colors"
                  style={inputStyle}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center transition-opacity hover:opacity-70"
                  style={{ color: "rgba(0,140,170,0.7)" }}
                >
                  {showPw ? <EyeClosed /> : <EyeOpen />}
                </button>
              </div>
              {/* Strength indicator */}
              {newPassword.length > 0 && (
                <div className="mt-1.5 flex gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-1 flex-1 rounded-full transition-colors duration-300"
                      style={{
                        background: newPassword.length >= i * 3
                          ? i <= 1 ? "#ef4444" : i <= 2 ? "#f59e0b" : i <= 3 ? "#22c55e" : "#16a34a"
                          : "rgba(0,184,212,0.12)",
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label className="text-xs font-semibold block mb-1.5" style={{ color: "#0a1628", fontFamily: '"Cairo", sans-serif' }}>
                Confirm new password
              </label>
              <input
                type={showPw ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="Repeat password"
                className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/40 transition-colors"
                style={inputStyle}
              />
              {confirmPassword && confirmPassword !== newPassword && (
                <p className="text-xs mt-1" style={{ color: "#c0392b" }}>Passwords don&apos;t match.</p>
              )}
              {confirmPassword && confirmPassword === newPassword && newPassword.length >= 8 && (
                <p className="text-xs mt-1 flex items-center gap-1" style={{ color: "rgba(0,130,160,0.9)" }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  Passwords match
                </p>
              )}
            </div>

            {formError && (
              <div role="alert" className="flex items-start gap-2 text-xs rounded-xl px-3 py-2.5" style={{ color: "#c0392b", background: "rgba(220,50,50,0.07)", border: "1.5px solid rgba(220,50,50,0.22)" }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {formError}
              </div>
            )}

            <button
              type="submit"
              disabled={saving || newPassword.length < 8 || newPassword !== confirmPassword}
              className="w-full py-3.5 rounded-xl font-bold text-sm transition-all disabled:opacity-40 hover:opacity-90 active:scale-[.98] min-h-[48px]"
              style={authPrimaryButtonStyle}
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving…
                </span>
              ) : "Set new password"}
            </button>
          </form>
        )}

        {/* ── Success ─────────────────────────────────── */}
        {phase === "success" && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ background: "rgba(0,184,212,0.1)", border: "1.5px solid rgba(0,184,212,0.25)" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00a8c8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div>
              <h2 className="font-bold text-lg" style={{ color: "#0a1628", fontFamily: '"Cairo", sans-serif' }}>Password updated!</h2>
              <p className="text-sm mt-1" style={{ color: "rgba(0,120,160,0.8)" }}>
                Your password has been changed. Redirecting to sign in…
              </p>
            </div>
            <Link
              href="/login"
              className="block w-full py-3 rounded-xl font-bold text-sm text-center transition-all hover:opacity-90 active:scale-[.98]"
              style={authPrimaryButtonStyle}
            >
              Sign in now
            </Link>
          </div>
        )}
      </div>
    </AuthPageShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordInner />
    </Suspense>
  );
}
