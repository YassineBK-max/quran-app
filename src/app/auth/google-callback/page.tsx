"use client";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { AuthPageShell } from "@/components/auth/AuthBackground";

export default function GoogleCallbackPage() {
  const { data: session, status } = useSession();
  const { users, loginWithEmail } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user?.email) {
      router.push("/login");
      return;
    }

    const email = session.user.email;
    const name = session.user.name ?? email.split("@")[0];

    // Check if this Google user already has an account in localStorage
    const existingUser = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      const err = loginWithEmail(email);
      if (!err) { router.push("/"); return; }
    }

    // New Google user — go to signup to choose role and enter codes
    const params = new URLSearchParams({ google: "1", email, name });
    router.push(`/signup?${params.toString()}`);
  }, [session, status, users, loginWithEmail, router]);

  return (
    <AuthPageShell>
      <div className="text-center">
        <div className="w-10 h-10 rounded-full animate-spin mx-auto mb-4" style={{ border: "2px solid rgba(0,184,212,0.2)", borderTopColor: "#00a8c8" }} />
        <p className="text-sm" style={{ color: "rgba(0,120,160,0.7)", fontFamily: '"Cairo", sans-serif' }}>Signing you in with Google…</p>
      </div>
    </AuthPageShell>
  );
}
