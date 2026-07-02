"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useAuth } from "@/contexts/AuthContext";
import { LangToggle } from "@/components/ui/LangToggle";
import { useT } from "@/hooks/useT";

export default function LoginPage() {
  const { login } = useAuth();
  const t = useT();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const err = login(email, password);
    setLoading(false);
    if (err) { setError(err); return; }
    router.push("/");
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
      {/* Language toggle top-right */}
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
          <h1 className="text-white text-2xl font-bold">{t.login_title}</h1>
          <p className="text-green-300 text-sm mt-1">{t.login_subtitle}</p>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 space-y-4 border border-white/20">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Email */}
            <div>
              <label htmlFor="login-email" className="text-green-200 text-xs font-semibold block mb-1.5">
                {t.login_email}
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="your@email.com"
                className="w-full bg-white/10 border border-white/20 text-white placeholder-green-300/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-400 transition-colors"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="login-password" className="text-green-200 text-xs font-semibold block mb-1.5">
                {t.login_password}
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full bg-white/10 border border-white/20 text-white placeholder-green-300/50 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:border-green-400 transition-colors"
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
            </div>

            {/* Error */}
            {error && (
              <div role="alert" className="flex items-start gap-2 text-red-300 text-xs bg-red-500/10 border border-red-400/20 rounded-xl px-3 py-2.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {error}
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

        <p className="text-center text-green-300 text-sm mt-5">
          {t.no_account}{" "}
          <Link href="/signup" className="text-white font-semibold underline underline-offset-2">{t.signup}</Link>
        </p>
      </div>
    </div>
  );
}
