"use client";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

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
    <div className="min-h-screen bg-gradient-to-br from-green-950 via-green-900 to-green-800 flex items-center justify-center">
      <div className="text-white text-center">
        <div className="w-10 h-10 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-green-200">Signing you in with Google...</p>
      </div>
    </div>
  );
}
