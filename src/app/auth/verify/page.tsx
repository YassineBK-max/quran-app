"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { authConfirmEmail } from "@/lib/supabase-auth";
import { AuthPageShell, authCardStyle, authPrimaryButtonStyle } from "@/components/auth/AuthBackground";

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
    <AuthPageShell>
      <div className="flex flex-col items-center mb-6">
        <Image src="/logo-qapp.png" alt="" width={64} height={64} className="rounded-2xl shadow-lg" style={{ boxShadow: "0 8px 30px rgba(0,100,160,0.15)" }} />
      </div>

      <div className="rounded-2xl p-7 text-center space-y-5" style={authCardStyle}>
        {status === "loading" && (
          <>
            <div className="w-12 h-12 rounded-full animate-spin mx-auto" style={{ border: "3px solid rgba(0,184,212,0.2)", borderTopColor: "#00a8c8" }} />
            <div>
              <h2 className="font-bold text-lg" style={{ color: "#0a1628", fontFamily: '"Cairo", sans-serif' }}>Verifying your email…</h2>
              <p className="text-sm mt-1" style={{ color: "rgba(0,120,160,0.7)" }}>Just a moment.</p>
            </div>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ background: "rgba(0,184,212,0.1)", border: "1.5px solid rgba(0,184,212,0.25)" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00a8c8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div>
              <h2 className="font-bold text-lg" style={{ color: "#0a1628", fontFamily: '"Cairo", sans-serif' }}>Email verified!</h2>
              <p className="text-sm mt-1" style={{ color: "rgba(0,120,160,0.8)" }}>{verifiedEmail}</p>
              <p className="text-xs mt-3" style={{ color: "rgba(20,60,100,0.5)" }}>
                Your account is now active. Redirecting to sign in…
              </p>
            </div>
            <Link
              href="/login"
              className="block w-full py-3.5 rounded-xl font-bold text-sm text-center transition-all hover:opacity-90 active:scale-[.98]"
              style={authPrimaryButtonStyle}
            >
              Sign in now
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ background: "rgba(220,50,50,0.08)", border: "1.5px solid rgba(220,50,50,0.22)" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#c0392b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <div>
              <h2 className="font-bold text-lg" style={{ color: "#0a1628", fontFamily: '"Cairo", sans-serif' }}>Verification failed</h2>
              <p className="text-sm mt-2" style={{ color: "#c0392b" }}>{errorMsg}</p>
              <p className="text-xs mt-3" style={{ color: "rgba(20,60,100,0.5)" }}>
                The link may have expired or already been used. Sign in to resend a new verification email.
              </p>
            </div>
            <div className="space-y-2">
              <Link
                href="/login"
                className="block w-full py-3.5 rounded-xl font-bold text-sm text-center transition-all hover:opacity-90 active:scale-[.98]"
                style={authPrimaryButtonStyle}
              >
                Back to sign in
              </Link>
              <Link
                href="/signup"
                className="block w-full py-3.5 rounded-xl font-semibold text-sm text-center transition-colors hover:opacity-80"
                style={{ color: "rgba(0,140,170,0.85)", border: "1.5px solid rgba(0,184,212,0.25)", background: "rgba(0,184,212,0.05)", fontFamily: '"Cairo", sans-serif' }}
              >
                Create a new account
              </Link>
            </div>
          </>
        )}
      </div>
    </AuthPageShell>
  );
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyInner />
    </Suspense>
  );
}
