"use client";
import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useClassroom } from "@/contexts/ClassroomContext";
import { UserRole } from "@/lib/types";

function SignupForm() {
  const { signup, signupGoogle } = useAuth();
  const { joinClass } = useClassroom();
  const router = useRouter();
  const params = useSearchParams();
  const isGoogle = params.get("google") === "1";

  const [step, setStep] = useState<"info" | "role">("info");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("student");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleInfoNext = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim() || (!isGoogle && !email.trim()) || (!isGoogle && !password.trim())) {
      setError("Please fill in all fields.");
      return;
    }
    if (!isGoogle && password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setStep("role");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    let err: string | null;
    if (isGoogle) {
      err = signupGoogle(name, email || `${name.toLowerCase().replace(/\s+/g, ".")}@google.com`, role, code || undefined);
    } else {
      err = signup(name, email, password, role, code || undefined);
    }

    if (err) { setError(err); setLoading(false); return; }

    // Join class for students
    if (role === "student" && code) {
      const joinErr = joinClass(code);
      if (joinErr) { setError(joinErr); setLoading(false); return; }
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
            {step === "info" ? "Your information" : "Choose your role"}
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
          {step === "info" ? (
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
              {!isGoogle && (
                <>
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
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full bg-white/10 border border-white/20 text-white placeholder-green-300/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-400 transition-colors"
                    />
                  </div>
                </>
              )}
              {error && <p className="text-red-300 text-xs bg-red-500/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>}
              <button type="submit" className="w-full py-3 rounded-xl bg-green-500 hover:bg-green-400 text-white font-semibold transition-colors">
                Next
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Role selection */}
              <div>
                <label className="text-green-200 text-xs font-medium block mb-2">I am a</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["student", "teacher", "admin"] as UserRole[]).map((r) => (
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

              {/* Code input */}
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
                  <p className="text-green-400/70 text-[10px] mt-1">You can add a class code later if you don&apos;t have one yet.</p>
                </div>
              )}

              {(role === "teacher" || role === "admin") && (
                <div>
                  <label className="text-green-200 text-xs font-medium block mb-1.5">Admin Code</label>
                  <input
                    type="password"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                    placeholder="Enter admin code"
                    className="w-full bg-white/10 border border-white/20 text-white placeholder-green-300/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-400 transition-colors"
                  />
                </div>
              )}

              {error && <p className="text-red-300 text-xs bg-red-500/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setStep("info"); setError(""); }}
                  className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-green-200 font-medium transition-colors border border-white/20"
                >
                  Back
                </button>
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
        <div className="text-center mt-3">
          <Link href="/" className="text-green-400 text-xs hover:text-green-300">← Back to home</Link>
        </div>
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
