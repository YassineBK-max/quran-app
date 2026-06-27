"use client";
import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useAuth } from "@/contexts/AuthContext";
import { useClassroom } from "@/contexts/ClassroomContext";

function SignupForm() {
  const { signup, signupGoogle } = useAuth();
  const { joinClass } = useClassroom();
  const router = useRouter();
  const params = useSearchParams();

  const isGoogle = params.get("google") === "1";
  const prefillEmail = params.get("email") ?? "";
  const prefillName = params.get("name") ?? "";

  // When arriving from Google OAuth we may skip to the role step,
  // but only if BOTH name and email are pre-filled.
  const [step, setStep] = useState<"info" | "role">(
    isGoogle && prefillEmail && prefillName ? "role" : "info"
  );
  const [name, setName] = useState(prefillName);
  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  type SignupRole = "student" | "teacher";
  const [role, setRole] = useState<SignupRole>("student");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

    // Join class for students
    if (role === "student" && code) {
      const joinErr = joinClass(code);
      if (joinErr && joinErr !== "You are already in this class.") {
        setError(joinErr); setLoading(false); return;
      }
    }

    setLoading(false);
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-950 via-green-900 to-green-800 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3 text-yellow-300">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" opacity="0.85" />
              <polygon points="17,2 17.9,4.8 21,5 18.7,7 19.4,10 17,8.5 14.6,10 15.3,7 13,5 16.1,4.8" />
            </svg>
          </div>
          <h1 className="text-white text-2xl font-bold">Create Account</h1>
          <p className="text-green-300 text-sm mt-1">
            {step === "info" ? "Enter your details" : "Choose your role"}
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
          {step === "info" ? (
            <div className="space-y-4">
              <form onSubmit={handleInfoNext} className="space-y-4">
                <div>
                  <label className="text-green-200 text-xs font-medium block mb-1.5">Full Name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Your name"
                    className="w-full bg-white/10 border border-white/20 text-white placeholder-green-300/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-400 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-green-200 text-xs font-medium block mb-1.5">Email</label>
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
                  <label className="text-green-200 text-xs font-medium block mb-1.5">Password</label>
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
                  Next
                </button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/20" /></div>
                <div className="relative flex justify-center"><span className="px-3 text-green-300 text-xs">or</span></div>
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
                Continue with Google
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Show name/email as read-only for Google users */}
              {isGoogle && (
                <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 space-y-1">
                  <p className="text-white text-sm font-medium">{name}</p>
                  <p className="text-green-300/70 text-xs">{email}</p>
                </div>
              )}

              {/* Name edit when coming via Google without prefill */}
              {isGoogle && !prefillName && (
                <div>
                  <label className="text-green-200 text-xs font-medium block mb-1.5">Your Name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Enter your name"
                    className="w-full bg-white/10 border border-white/20 text-white placeholder-green-300/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-400 transition-colors"
                  />
                </div>
              )}

              {/* Role — only student or teacher */}
              <div>
                <label className="text-green-200 text-xs font-medium block mb-2">I am a</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["student", "teacher"] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => { setRole(r); setCode(""); setError(""); }}
                      className={`py-2.5 rounded-xl text-sm font-medium capitalize transition-colors border ${
                        role === r
                          ? "bg-green-500 border-green-400 text-white"
                          : "bg-white/10 border-white/20 text-green-200 hover:bg-white/20"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Class code for students */}
              {role === "student" && (
                <div>
                  <label className="text-green-200 text-xs font-medium block mb-1.5">Class Code (from your teacher)</label>
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="ABC123"
                    maxLength={6}
                    className="w-full bg-white/10 border border-white/20 text-white placeholder-green-300/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-400 transition-colors uppercase tracking-widest font-mono"
                  />
                  <p className="text-green-400/70 text-[10px] mt-1">You can join a class later if you don&apos;t have a code yet.</p>
                </div>
              )}

              {/* Admin code for teachers */}
              {role === "teacher" && (
                <div>
                  <label className="text-green-200 text-xs font-medium block mb-1.5">Teacher Code (from your admin)</label>
                  <input
                    type="password"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                    placeholder="Enter teacher code"
                    className="w-full bg-white/10 border border-white/20 text-white placeholder-green-300/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-400 transition-colors"
                  />
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
                    Back
                  </button>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl bg-green-500 hover:bg-green-400 text-white font-semibold transition-colors disabled:opacity-50"
                >
                  {loading ? "Creating..." : "Create Account"}
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-green-300 text-sm mt-5">
          Already have an account?{" "}
          <Link href="/login" className="text-white font-semibold underline">Sign in</Link>
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
