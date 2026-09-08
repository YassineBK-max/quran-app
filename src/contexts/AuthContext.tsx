"use client";
import { createContext, useContext, ReactNode, useCallback, useEffect, useState } from "react";
import { User, UserRole } from "@/lib/types";
import { supabase, isSupabaseReady } from "@/lib/supabase";
import { authSignUp } from "@/lib/supabase-auth";

// ─── Accounts live entirely in Supabase Auth + the `profiles` table ──────────
// (see supabase/migration.sql). There is no local/localStorage account store
// any more: a password is hashed and verified by Supabase itself, and role
// assignment (including who gets 'admin') is enforced by a database trigger,
// not by this client code — so nothing here can be used to self-promote.

interface ProfileRow {
  id: string;
  email: string;
  name: string;
  display_name: string | null;
  role: UserRole;
  profile_photo: string | null;
  class_id: string | null;
  class_ids: string[];
  parent_ids: string[];
  linked_child_id: string | null;
  linked_child_ids: string[];
  created_at: string;
}

// parentCode is intentionally NOT a column on `profiles` — it lives in the
// separate `parent_codes` table (RLS: readable only by its own student), so
// it's only ever passed in here for the CURRENT user's own row, never for
// anyone else in the roster. See the security note in supabase/migration.sql.
function rowToUser(row: ProfileRow, emailVerified?: boolean, parentCode?: string | null): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    classId: row.class_id ?? undefined,
    classIds: row.class_ids?.length ? row.class_ids : undefined,
    createdAt: new Date(row.created_at).getTime(),
    parentCode: parentCode ?? undefined,
    parentIds: row.parent_ids?.length ? row.parent_ids : undefined,
    linkedChildId: row.linked_child_id ?? undefined,
    linkedChildIds: row.linked_child_ids?.length ? row.linked_child_ids : undefined,
    displayName: row.display_name ?? undefined,
    profilePhoto: row.profile_photo ?? undefined,
    emailVerified,
  };
}

function userPatchToRow(patch: Partial<User>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (patch.displayName !== undefined) row.display_name = patch.displayName;
  if (patch.profilePhoto !== undefined) row.profile_photo = patch.profilePhoto;
  if (patch.classId !== undefined) row.class_id = patch.classId;
  if (patch.classIds !== undefined) row.class_ids = patch.classIds;
  if (patch.parentIds !== undefined) row.parent_ids = patch.parentIds;
  if (patch.linkedChildId !== undefined) row.linked_child_id = patch.linkedChildId;
  if (patch.linkedChildIds !== undefined) row.linked_child_ids = patch.linkedChildIds;
  if (patch.role !== undefined) row.role = patch.role; // only takes effect if the caller is an admin — enforced by RLS + trigger
  if (patch.name !== undefined) row.name = patch.name;
  return row;
}

interface AuthContextType {
  user: User | null;
  users: User[];
  isLoaded: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  loginWithEmail: (email: string) => string | null;
  signup: (
    name: string,
    email: string,
    password: string,
    role: UserRole,
    code?: string
  ) => Promise<{ error: string | null; needsVerification: boolean }>;
  signupGoogle: (name: string, email: string, role: UserRole) => string | null;
  logout: () => void;
  getUserById: (id: string) => User | undefined;
  updateUser: (id: string, partial: Partial<User>) => void;
  deleteUser: (id: string) => void;
  linkChildToParent: (studentCode: string) => Promise<string | null>;
}

const AuthCtx = createContext<AuthContextType>({
  user: null,
  users: [],
  isLoaded: false,
  login: async () => null,
  loginWithEmail: () => null,
  signup: async () => ({ error: "not ready", needsVerification: false }),
  signupGoogle: () => null,
  logout: () => {},
  getUserById: () => undefined,
  updateUser: () => {},
  deleteUser: () => {},
  linkChildToParent: async () => null,
});

export function getLinkedChildIds(user: User): string[] {
  if (user.linkedChildIds && user.linkedChildIds.length > 0) return user.linkedChildIds;
  if (user.linkedChildId) return [user.linkedChildId];
  return [];
}

const GOOGLE_UNAVAILABLE = "Google sign-in isn't available right now — please use email and password.";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sessionUserId, setSessionUserId] = useState<string | null | undefined>(undefined); // undefined = not checked yet
  const [emailConfirmed, setEmailConfirmed] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [myParentCode, setMyParentCode] = useState<string | null>(null);
  const [allProfiles, setAllProfiles] = useState<ProfileRow[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Restore/track the Supabase Auth session.
  useEffect(() => {
    if (!supabase) { setSessionChecked(true); return; }
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSessionUserId(data.session?.user?.id ?? null);
      setEmailConfirmed(!!data.session?.user?.email_confirmed_at);
      setSessionChecked(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSessionUserId(newSession?.user?.id ?? null);
      setEmailConfirmed(!!newSession?.user?.email_confirmed_at);
      setSessionChecked(true);
    });

    return () => { active = false; sub.subscription.unsubscribe(); };
  }, []);

  // Once we know who (if anyone) is signed in, load their profile + the roster.
  useEffect(() => {
    if (!sessionChecked) return;
    if (!supabase || !sessionUserId) {
      setProfile(null);
      setMyParentCode(null);
      setAllProfiles([]);
      setIsLoaded(true);
      return;
    }
    let active = true;
    (async () => {
      const [{ data: mine }, { data: all }, { data: myCode }] = await Promise.all([
        supabase!.from("profiles").select("*").eq("id", sessionUserId).maybeSingle(),
        supabase!.from("profiles").select("*"),
        supabase!.from("parent_codes").select("code").eq("student_id", sessionUserId).maybeSingle(),
      ]);
      if (!active) return;
      setProfile(mine ?? null);
      setMyParentCode(myCode?.code ?? null);
      setAllProfiles(all ?? []);
      setIsLoaded(true);
    })();
    return () => { active = false; };
  }, [sessionChecked, sessionUserId]);

  // Keep the roster (and own profile) live across devices/tabs.
  useEffect(() => {
    if (!supabase || !sessionUserId) return;
    const ch = supabase
      .channel("profiles-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, (payload) => {
        if (payload.eventType === "DELETE") {
          const oldId = (payload.old as { id: string }).id;
          setAllProfiles((prev) => prev.filter((row) => row.id !== oldId));
          return;
        }
        const row = payload.new as ProfileRow;
        setAllProfiles((prev) => {
          const idx = prev.findIndex((r) => r.id === row.id);
          if (idx < 0) return [...prev, row];
          const next = [...prev];
          next[idx] = row;
          return next;
        });
        if (row.id === sessionUserId) setProfile(row);
      })
      .subscribe();
    return () => { supabase!.removeChannel(ch); };
  }, [sessionUserId]);

  const user: User | null = profile ? rowToUser(profile, emailConfirmed, myParentCode) : null;
  const users: User[] = allProfiles.map((row) => rowToUser(row));

  const getUserById = useCallback(
    (id: string) => {
      const row = allProfiles.find((p) => p.id === id);
      return row ? rowToUser(row) : undefined;
    },
    [allProfiles]
  );

  const updateUser = useCallback(
    (id: string, partial: Partial<User>) => {
      if (!supabase) return;
      const row = userPatchToRow(partial);
      if (Object.keys(row).length === 0) return;
      // Optimistic local update so the UI feels instant; the write below
      // reconciles (and, for another viewer, realtime will too).
      setAllProfiles((prev) => prev.map((p) => (p.id === id ? { ...p, ...row } as ProfileRow : p)));
      setProfile((prev) => (prev && prev.id === id ? ({ ...prev, ...row } as ProfileRow) : prev));
      supabase
        .from("profiles")
        .update(row)
        .eq("id", id)
        .then(({ error }) => {
          if (error) console.error("Failed to update profile:", error.message);
        });
    },
    []
  );

  const deleteUser = useCallback((id: string) => {
    if (!supabase) return;
    setAllProfiles((prev) => prev.filter((p) => p.id !== id));
    supabase.rpc("admin_delete_user", { target_id: id }).then(({ error }) => {
      if (error) console.error("Failed to delete user:", error.message);
    });
  }, []);

  const linkChildToParent = useCallback(async (studentCode: string): Promise<string | null> => {
    if (!supabase) return "Supabase is not configured.";
    const code = studentCode.trim().toUpperCase();
    if (!code) return "Please enter a code.";
    const { error } = await supabase.rpc("link_child_to_parent", { code });
    if (error) return error.message;
    // Refresh so the newly-linked child shows up immediately.
    if (sessionUserId) {
      const [{ data: mine }, { data: all }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", sessionUserId).maybeSingle(),
        supabase.from("profiles").select("*"),
      ]);
      setProfile(mine ?? null);
      setAllProfiles(all ?? []);
    }
    return null;
  }, [sessionUserId]);

  const login = useCallback(async (email: string, password: string): Promise<string | null> => {
    if (!supabase) return "Supabase is not configured.";
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) return null;
    const msg = error.message.toLowerCase();
    if (msg.includes("confirm")) return "EMAIL_NOT_VERIFIED";
    if (msg.includes("invalid login credentials")) return "Invalid email or password.";
    return error.message;
  }, []);

  const signup = useCallback(
    async (
      name: string,
      email: string,
      password: string,
      role: UserRole,
      code?: string
    ): Promise<{ error: string | null; needsVerification: boolean }> => {
      if (!supabase || !isSupabaseReady) {
        return { error: "Supabase is not configured.", needsVerification: false };
      }
      if (role === "parent" && !code?.trim()) {
        return { error: "Please enter your child's parent code.", needsVerification: false };
      }

      const redirectTo = `${window.location.origin}/auth/verify`;
      const { error, needsVerification } = await authSignUp(email, password, name, role, redirectTo);
      if (error) return { error, needsVerification: false };

      // Only possible to link right away if signUp produced a live session
      // (i.e. email confirmation isn't required) — otherwise the parent
      // links their child after confirming, from Profile > Link another student.
      if (!needsVerification && role === "parent" && code) {
        const linkErr = await linkChildToParent(code);
        if (linkErr) return { error: linkErr, needsVerification: false };
      }

      return { error: null, needsVerification };
    },
    [linkChildToParent]
  );

  const logout = useCallback(() => {
    supabase?.auth.signOut();
  }, []);

  // Google sign-in used to bridge a NextAuth session into a local account;
  // that path is retired now that accounts live in Supabase Auth. Kept as a
  // clear, typed stub so callers get an explicit message instead of silently
  // failing while this gets reconnected (e.g. via Supabase's own Google
  // OAuth provider).
  const signupGoogle = useCallback((): string | null => GOOGLE_UNAVAILABLE, []);
  const loginWithEmail = useCallback((): string | null => GOOGLE_UNAVAILABLE, []);

  return (
    <AuthCtx.Provider
      value={{
        user,
        users,
        isLoaded,
        login,
        loginWithEmail,
        signup,
        signupGoogle,
        logout,
        getUserById,
        updateUser,
        deleteUser,
        linkChildToParent,
      }}
    >
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
