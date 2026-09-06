"use client";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { slugify } from "@/lib/slug";
import { ProfileView } from "@/components/profile/ProfileView";

// Private per-user profile URL: /profile/{username}. This page only ever
// renders the signed-in account's own settings, so anyone landing on a slug
// that isn't theirs (someone else's link, a guess, a stale bookmark) is
// bounced straight to their own — no one can view another user's profile.
export default function UserProfilePage() {
  const params = useParams<{ username: string }>();
  const { user, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded || !user) return;
    const mySlug = slugify(user.displayName ?? user.name);
    if (params.username !== mySlug) {
      router.replace(`/profile/${mySlug}`);
    }
  }, [isLoaded, user, params.username, router]);

  return <ProfileView />;
}
