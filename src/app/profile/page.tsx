"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { slugify } from "@/lib/slug";

// Legacy /profile entry point — forwards to the caller's private,
// username-scoped profile URL (/profile/{username}).
export default function ProfileRedirect() {
  const { user, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    router.replace(`/profile/${slugify(user.displayName ?? user.name)}`);
  }, [isLoaded, user, router]);

  return null;
}
