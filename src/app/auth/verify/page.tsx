"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { authConfirmEmail } from "@/lib/supabase-auth";

// Supabase sends the email confirmation link to this route.
// Supported URL formats (Supabase generates one depending on project settings):
//   /auth/verify?code=XXX                  (PKCE flow — default in Supabase v2.20+)
//   /auth/verify?token_hash=XXX&type=email  (OTP flow)

function VerifyInner() {
  const params = useSearchParams();
  const router = useRouter();
  const { markEmailVerified } = useAuth();

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [verifiedEmail, setVerifiedEmail] = useState("");

  useEffect(() => {
    const code = params.get("code");
    const tokenHash = params.get("token_hash");
    const type = params.get("type");

    authConfirmEmail({ code, tokenHash, type })
      .then(({ email, error }) => {
        if (error || !email) {
          setErrorMsg(error ?? "Verification failed. The link may have expired.");
          setStatus("error");
          return;
        }
        markEmailVerified(email);
        setVerifiedEmail(email);
        setStatus("success");
      })
      .catch((e: unknown) => {
        setErrorMsg(e instanceof Error ? e.message : "Unknown error.");
        setStatus("error");
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-redirect to login after success
  useEffect(() => {
    if (status !== "success") return;
    const t = setTimeout(() => router.replace("/login?verified=1"), 3000);
    return () => clearTimeout(t);
  }, [status, router]);

  return (
    <div className="min-h-dvh bg-gradient-to-br from-green-950 via-green-900 to-green-800 flex flex-col items-center justify-center p-5">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-8 text-yellow-300">
          <svg xmlns="http://www.w3.org/2000/svg" width="52" height="52" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" opacity="0.85" />
            <polygon points="17,2 17.9,4.8 21,5 18.7,7 19.4,10 17,8.5 14.6,10 15.3,7 13,5 16.1,4.8" />
          </svg>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 text-center space-y-5">
          {status === "loading" && (
            <>
              <div className="w-12 h-12 border-3 border-white/30 border-t-white rounded-full animate-spin mx-auto" style={{ borderWidth: 3 }} />
              <div>
                <h2 className="text-white font-bold text-lg">Verifying your email…</h2>
                <p className="text-green-300 text-sm mt-1">Just a moment.</p>
              </div>
            </>
          )}

          {status === "success" && (
            <>
              <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-400/30 flex items-center justify-center mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <div>
                <h2 className="text-white font-bold text-lg">Email verified!</h2>
                <p className="text-green-300 text-sm mt-1">{verifiedEmail}</p>
                <p className="text-green-300/70 text-xs mt-3">
                  Your account is now active. Redirecting to sign in…
                </p>
              </div>
              <Link
                href="/login"
                className="block w-full py-3 rounded-xl bg-green-500 hover:bg-green-400 text-white font-semibold transition-colors text-sm"
              >
                Sign in now
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-16 h-16 rounded-full bg-red-500/15 border border-red-400/25 flex items-center justify-center mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </div>
              <div>
                <h2 className="text-white font-bold text-lg">Verification failed</h2>
                <p className="text-red-300 text-sm mt-2">{errorMsg}</p>
                <p className="text-green-300/70 text-xs mt-3">
                  The link may have expired or already been used. Sign in to resend a new verification email.
                </p>
              </div>
              <div className="space-y-2">
                <Link
                  href="/login"
                  className="block w-full py-3 rounded-xl bg-green-500 hover:bg-green-400 text-white font-semibold transition-colors text-sm"
                >
                  Back to sign in
                </Link>
                <Link
                  href="/signup"
                  className="block w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 text-green-200 font-medium transition-colors text-sm border border-white/20"
                >
                  Create a new account
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyInner />
    </Suspense>
  );
}
