"use client";
import { createContext, useContext, ReactNode, useCallback, useEffect, useLayoutEffect, useState, useRef } from "react";

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;
import { User, UserRole } from "@/lib/types";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { broadcastUserActivity } from "@/lib/supabase";
import { hashPassword, verifyPassword, generateId, generateParentCode } from "@/lib/crypto";

// Admin emails seeded by role only — no passwords in source code.
// These accounts have no password; they must log in via Google OAuth.
const SEEDED_ADMIN_EMAILS: Array<{ email: string; name: string }> = [
  { email: "kassab.salaheddine@gmail.com", name: "Salah" },
  { email: "yassinebouaoudatekhaffane@gmail.com", name: "Yassine" },
];

interface AuthContextType {
  user: User | null;
  users: User[];
  isLoaded: boolean;
  teacherCode: string;
  setTeacherCode: (code: string) => void;
  login: (email: string, password: string) => Promise<string | null>;
  loginWithEmail: (email: string) => string | null;
  signup: (name: string, email: string, password: string, role: UserRole, code?: string) => Promise<string | null>;
  signupGoogle: (name: string, email: string, role: UserRole, code?: string) => string | null;
  logout: () => void;
  getUserById: (id: string) => User | undefined;
  updateUser: (id: string, partial: Partial<User>) => void;
  deleteUser: (id: string) => void;
  linkChildToParent: (studentCode: string) => string | null;
  markEmailVerified: (email: string) => void;
  updatePassword: (email: string, newPassword: string) => Promise<void>;
}

const AuthCtx = createContext<AuthContextType>({
  user: null,
  users: [],
  isLoaded: false,
  teacherCode: "",
  setTeacherCode: () => {},
  login: async () => null,
  loginWithEmail: () => null,
  signup: async () => null,
  signupGoogle: () => null,
  logout: () => {},
  getUserById: () => undefined,
  updateUser: () => {},
  deleteUser: () => {},
  linkChildToParent: () => null,
  markEmailVerified: () => {},
  updatePassword: async () => {},
});

interface StoredUser extends User {
  passwordHash?: string;
  isGoogle?: boolean;
}

export function getLinkedChildIds(user: User): string[] {
  if (user.linkedChildIds && user.linkedChildIds.length > 0) return user.linkedChildIds;
  if (user.linkedChildId) return [user.linkedChildId];
  return [];
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [storedUsers, setStoredUsers] = useLocalStorage<StoredUser[]>("quran-users", []);
  const [currentUserId, setCurrentUserId] = useLocalStorage<string | null>("quran-current-user", null);
  const [teacherCode, setTeacherCodeState] = useLocalStorage<string>("quran-teacher-code", "");
  const [isLoaded, setIsLoaded] = useState(false);
  const seededRef = useRef(false);
  // Per-email login attempt tracking: { count, lockedUntil timestamp }
  const loginAttemptsRef = useRef<Record<string, { count: number; lockedUntil: number }>>({});

  useIsomorphicLayoutEffect(() => {
    setIsLoaded(true);
  }, []);

  // Seed admin roles by email only — no passwords stored in source
  useEffect(() => {
    if (seededRef.current) return;
    seededRef.current = true;
    setStoredUsers((prev) => {
      const updated = [...prev];
      for (const admin of SEEDED_ADMIN_EMAILS) {
        const exists = updated.find((u) => u.email.toLowerCase() === admin.email.toLowerCase());
        if (!exists) {
          updated.push({
            id: generateId(),
            email: admin.email,
            name: admin.name,
            role: "admin",
            createdAt: Date.now(),
          });
        } else if (exists.role !== "admin") {
          const idx = updated.indexOf(exists);
          updated[idx] = { ...exists, role: "admin" };
        }
      }
      return updated;
    });
  }, [setStoredUsers]);

  const setTeacherCode = useCallback((code: string) => setTeacherCodeState(code), [setTeacherCodeState]);
  const user = storedUsers.find((u) => u.id === currentUserId) ?? null;
  const getUserById = useCallback((id: string) => storedUsers.find((u) => u.id === id), [storedUsers]);

  const updateUser = useCallback(
    (id: string, partial: Partial<User>) => {
      setStoredUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...partial } : u)));
    },
    [setStoredUsers]
  );

  const login = useCallback(
    async (email: string, password: string): Promise<string | null> => {
      const now = Date.now();
      const key = email.toLowerCase();
      const attempt = loginAttemptsRef.current[key] ?? { count: 0, lockedUntil: 0 };

      if (attempt.lockedUntil > now) {
        const secs = Math.ceil((attempt.lockedUntil - now) / 1000);
        return `Too many failed attempts. Please wait ${secs} seconds before trying again.`;
      }

      const found = storedUsers.find((u) => u.email.toLowerCase() === key);
      const valid = found ? await verifyPassword(password, found.passwordHash) : false;

      if (!found || !valid) {
        const count = attempt.count + 1;
        loginAttemptsRef.current[key] = {
          count,
          lockedUntil: count >= 5 ? now + 60_000 : 0,
        };
        return "Invalid email or password.";
      }

      // Transparently migrate plaintext passwords to PBKDF2 on successful login
      if (found.passwordHash && !found.passwordHash.startsWith("pbkdf2v1:")) {
        const newHash = await hashPassword(password);
        setStoredUsers((prev) =>
          prev.map((u) => (u.id === found.id ? { ...u, passwordHash: newHash } : u))
        );
      }

      // Clear rate limit on success
      delete loginAttemptsRef.current[key];

      if (found.emailVerified === false) {
        return "EMAIL_NOT_VERIFIED";
      }

      setCurrentUserId(found.id);
      broadcastUserActivity({ type: "login", userId: found.id, userName: found.name, userEmail: found.email, userRole: found.role, ts: Date.now() });
      return null;
    },
    [storedUsers, setCurrentUserId, setStoredUsers]
  );

  // Used by Google OAuth callback — also enforces email verification
  const loginWithEmail = useCallback(
    (email: string): string | null => {
      const found = storedUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (!found) return "Account not found.";
      if (found.emailVerified === false) return "EMAIL_NOT_VERIFIED";
      setCurrentUserId(found.id);
      return null;
    },
    [storedUsers, setCurrentUserId]
  );

  const signup = useCallback(
    async (name: string, email: string, password: string, role: UserRole, code?: string): Promise<string | null> => {
      if (storedUsers.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
        return "An account with this email already exists.";
      }
      if (storedUsers.find((u) => u.name.toLowerCase() === name.trim().toLowerCase())) {
        return "This name is already taken. Please choose another.";
      }

      let firstChildId: string | undefined;

      if (role === "teacher" || role === "admin") {
        if (!teacherCode || code !== teacherCode) return "Invalid teacher code.";
      }
      if (role === "parent") {
        if (!code?.trim()) return "Please enter your child's parent code.";
        const student = storedUsers.find(
          (u) => u.parentCode === code.trim().toUpperCase() && u.role === "student"
        );
        if (!student) return "No student found with that code. Double-check the code and try again.";
        firstChildId = student.id;
      }

      const passwordHash = await hashPassword(password);

      const newUser: StoredUser = {
        id: generateId(),
        email,
        name,
        role,
        createdAt: Date.now(),
        passwordHash,
        ...(role === "student" ? { parentCode: generateParentCode() } : {}),
        ...(role === "parent" && firstChildId
          ? { linkedChildId: firstChildId, linkedChildIds: [firstChildId] }
          : {}),
      };

      setStoredUsers((prev) => {
        const updated = [...prev, newUser];
        if (role === "parent" && firstChildId) {
          return updated.map((u) =>
            u.id === firstChildId
              ? { ...u, parentIds: [...(u.parentIds ?? []), newUser.id] }
              : u
          );
        }
        return updated;
      });
      setCurrentUserId(newUser.id);
      broadcastUserActivity({ type: "signup", userId: newUser.id, userName: newUser.name, userEmail: newUser.email, userRole: newUser.role, ts: Date.now() });
      return null;
    },
    [storedUsers, teacherCode, setStoredUsers, setCurrentUserId]
  );

  const signupGoogle = useCallback(
    (name: string, email: string, role: UserRole, code?: string): string | null => {
      const existing = storedUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (existing) {
        setCurrentUserId(existing.id);
        return null;
      }
      if (storedUsers.find((u) => u.name.toLowerCase() === name.trim().toLowerCase())) {
        return "This name is already taken. Please choose another.";
      }
      if ((role === "teacher" || role === "admin") && (!teacherCode || code !== teacherCode)) {
        return "Invalid teacher code.";
      }
      const newUser: StoredUser = {
        id: generateId(),
        email,
        name,
        role,
        createdAt: Date.now(),
        isGoogle: true,
        ...(role === "student" ? { parentCode: generateParentCode() } : {}),
      };
      setStoredUsers((prev) => [...prev, newUser]);
      setCurrentUserId(newUser.id);
      broadcastUserActivity({ type: "signup", userId: newUser.id, userName: newUser.name, userEmail: newUser.email, userRole: newUser.role, ts: Date.now() });
      return null;
    },
    [storedUsers, teacherCode, setStoredUsers, setCurrentUserId]
  );

  const linkChildToParent = useCallback(
    (studentCode: string): string | null => {
      if (!user || user.role !== "parent") return "You must be logged in as a parent.";
      const code = studentCode.trim().toUpperCase();
      const student = storedUsers.find((u) => u.parentCode === code && u.role === "student");
      if (!student) return "No student found with that code.";

      const currentChildIds = getLinkedChildIds(user);
      if (currentChildIds.includes(student.id)) return "This student is already linked to your account.";

      const updatedChildIds = [...currentChildIds, student.id];

      setStoredUsers((prev) =>
        prev.map((u) => {
          if (u.id === user.id) {
            return { ...u, linkedChildId: updatedChildIds[0], linkedChildIds: updatedChildIds };
          }
          if (u.id === student.id) {
            return { ...u, parentIds: [...(u.parentIds ?? []), user.id] };
          }
          return u;
        })
      );
      return null;
    },
    [user, storedUsers, setStoredUsers]
  );

  const markEmailVerified = useCallback(
    (email: string) => {
      setStoredUsers((prev) =>
        prev.map((u) =>
          u.email.toLowerCase() === email.toLowerCase() ? { ...u, emailVerified: true } : u
        )
      );
    },
    [setStoredUsers]
  );

  const updatePassword = useCallback(
    async (email: string, newPassword: string): Promise<void> => {
      const hash = await hashPassword(newPassword);
      setStoredUsers((prev) =>
        prev.map((u) =>
          u.email.toLowerCase() === email.toLowerCase() ? { ...u, passwordHash: hash } : u
        )
      );
    },
    [setStoredUsers]
  );

  const logout = useCallback(() => setCurrentUserId(null), [setCurrentUserId]);

  const deleteUser = useCallback(
    (id: string) => {
      setStoredUsers((prev) => {
        const target = prev.find((u) => u.id === id);
        if (!target) return prev;
        let updated = prev.map((u) => {
          if (u.role === "parent") {
            const childIds = (u.linkedChildIds ?? (u.linkedChildId ? [u.linkedChildId] : [])).filter((cid) => cid !== id);
            return { ...u, linkedChildIds: childIds, linkedChildId: childIds[0] };
          }
          return u;
        });
        updated = updated.filter((u) => u.id !== id);
        return updated;
      });
    },
    [setStoredUsers]
  );

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const publicUsers: User[] = storedUsers.map(({ passwordHash, isGoogle, ...u }) => u);

  return (
    <AuthCtx.Provider value={{ user, users: publicUsers, isLoaded, teacherCode, setTeacherCode, login, loginWithEmail, signup, signupGoogle, logout, getUserById, updateUser, deleteUser, linkChildToParent, markEmailVerified, updatePassword }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
