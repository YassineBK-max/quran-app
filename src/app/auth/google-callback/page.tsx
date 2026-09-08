"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthPageShell } from "@/components/auth/AuthBackground";

// Google sign-in is temporarily unavailable: accounts now live in Supabase
// Auth (see AuthContext.tsx / supabase/migration.sql), and the old bridge
// here assumed local, per-device accounts. Reconnecting Google sign-in
// properly means using Supabase's own Google OAuth provider instead of
// NextAuth for this step — until then, send people to email/password.
export default function GoogleCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login");
  }, [router]);

  return (
    <AuthPageShell>
      <div className="text-center">
        <div className="w-10 h-10 rounded-full animate-spin mx-auto mb-4" style={{ border: "2px solid rgba(0,184,212,0.2)", borderTopColor: "#00a8c8" }} />
        <p className="text-sm" style={{ color: "rgba(0,120,160,0.7)", fontFamily: '"Cairo", sans-serif' }}>Redirecting…</p>
      </div>
    </AuthPageShell>
  );
}
