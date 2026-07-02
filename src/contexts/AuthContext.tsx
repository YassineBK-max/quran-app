"use client";
import { createContext, useContext, ReactNode, useCallback, useEffect, useLayoutEffect, useState, useRef } from "react";

// Fires before paint on client, falls back to useEffect on server
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;
import { User, UserRole } from "@/lib/types";
import { useLocalStorage } from "@/hooks/useLocalStorage";

const SEEDED_ADMINS = [
  { email: "kassab.salaheddine@gmail.com", name: "Salah", password: "Academy@2030" },
  { email: "yassinebouaoudatekhaffane@gmail.com", name: "Yassine", password: "academy@2030" },
];

const DEFAULT_TEACHER_CODE = "QURAN_ADMIN_2024";

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function genParentCode() {
  return Math.random().toString(36).toUpperCase().slice(2, 10);
}

interface AuthContextType {
  user: User | null;
  users: User[];
  isLoaded: boolean;
  teacherCode: string;
  setTeacherCode: (code: string) => void;
  login: (email: string, password: string) => string | null;
  loginWithEmail: (email: string) => string | null;
  signup: (name: string, email: string, password: string, role: UserRole, code?: string) => string | null;
  signupGoogle: (name: string, email: string, role: UserRole, code?: string) => string | null;
  logout: () => void;
  getUserById: (id: string) => User | undefined;
  updateUser: (id: string, partial: Partial<User>) => void;
  deleteUser: (id: string) => void;
  linkChildToParent: (studentCode: string) => string | null;
}

const AuthCtx = createContext<AuthContextType>({
  user: null,
  users: [],
  isLoaded: false,
  teacherCode: DEFAULT_TEACHER_CODE,
  setTeacherCode: () => {},
  login: () => null,
  loginWithEmail: () => null,
  signup: () => null,
  signupGoogle: () => null,
  logout: () => {},
  getUserById: () => undefined,
  updateUser: () => {},
  deleteUser: () => {},
  linkChildToParent: () => null,
});

interface StoredUser extends User {
  passwordHash?: string;
  isGoogle?: boolean;
}

// Helper: get all linked child IDs for a parent (handles legacy single-child field)
export function getLinkedChildIds(user: User): string[] {
  if (user.linkedChildIds && user.linkedChildIds.length > 0) return user.linkedChildIds;
  if (user.linkedChildId) return [user.linkedChildId];
  return [];
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [storedUsers, setStoredUsers] = useLocalStorage<StoredUser[]>("quran-users", []);
  const [currentUserId, setCurrentUserId] = useLocalStorage<string | null>("quran-current-user", null);
  const [teacherCode, setTeacherCodeState] = useLocalStorage<string>("quran-teacher-code", DEFAULT_TEACHER_CODE);
  const [isLoaded, setIsLoaded] = useState(false);
  const seededRef = useRef(false);

  useIsomorphicLayoutEffect(() => {
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (seededRef.current) return;
    seededRef.current = true;
    setStoredUsers((prev) => {
      const updated = [...prev];
      for (const admin of SEEDED_ADMINS) {
        const exists = updated.find((u) => u.email.toLowerCase() === admin.email.toLowerCase());
        if (!exists) {
          updated.push({ id: `seeded-${admin.email}`, email: admin.email, name: admin.name, role: "admin", createdAt: Date.now(), passwordHash: admin.password });
        } else if (exists.role !== "admin") {
          const idx = updated.indexOf(exists);
          updated[idx] = { ...exists, role: "admin", passwordHash: admin.password };
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
    (email: string, password: string): string | null => {
      const found = storedUsers.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.passwordHash === password);
      if (!found) return "Invalid email or password.";
      setCurrentUserId(found.id);
      return null;
    },
    [storedUsers, setCurrentUserId]
  );

  const loginWithEmail = useCallback(
    (email: string): string | null => {
      const found = storedUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (!found) return "Account not found.";
      setCurrentUserId(found.id);
      return null;
    },
    [storedUsers, setCurrentUserId]
  );

  const signup = useCallback(
    (name: string, email: string, password: string, role: UserRole, code?: string): string | null => {
      if (storedUsers.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
        return "An account with this email already exists.";
      }
      if (storedUsers.find((u) => u.name.toLowerCase() === name.trim().toLowerCase())) {
        return "This name is already taken. Please choose another.";
      }

      let firstChildId: string | undefined;

      if (role === "teacher" || role === "admin") {
        if (code !== teacherCode) return "Invalid teacher code.";
      }
      if (role === "parent") {
        if (!code?.trim()) return "Please enter your child's parent code.";
        const student = storedUsers.find(
          (u) => u.parentCode === code.trim().toUpperCase() && u.role === "student"
        );
        if (!student) return "No student found with that code. Double-check the code and try again.";
        firstChildId = student.id;
      }

      const newUser: StoredUser = {
        id: genId(),
        email,
        name,
        role,
        createdAt: Date.now(),
        passwordHash: password,
        ...(role === "student" ? { parentCode: genParentCode() } : {}),
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
      if ((role === "teacher" || role === "admin") && code !== teacherCode) {
        return "Invalid teacher code.";
      }
      const newUser: StoredUser = {
        id: genId(),
        email,
        name,
        role,
        createdAt: Date.now(),
        isGoogle: true,
        ...(role === "student" ? { parentCode: genParentCode() } : {}),
      };
      setStoredUsers((prev) => [...prev, newUser]);
      setCurrentUserId(newUser.id);
      return null;
    },
    [storedUsers, teacherCode, setStoredUsers, setCurrentUserId]
  );

  // Link an additional student to the current parent account
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
            return {
              ...u,
              linkedChildId: updatedChildIds[0],
              linkedChildIds: updatedChildIds,
            };
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

  const logout = useCallback(() => setCurrentUserId(null), [setCurrentUserId]);

  const deleteUser = useCallback(
    (id: string) => {
      setStoredUsers((prev) => {
        const target = prev.find((u) => u.id === id);
        if (!target) return prev;
        // Clean up parent links if the deleted user was a student
        let updated = prev.map((u) => {
          if (u.role === "parent") {
            const childIds = (u.linkedChildIds ?? (u.linkedChildId ? [u.linkedChildId] : [])).filter((cid) => cid !== id);
            return { ...u, linkedChildIds: childIds, linkedChildId: childIds[0] };
          }
          return u;
        });
        // Remove the user
        updated = updated.filter((u) => u.id !== id);
        return updated;
      });
    },
    [setStoredUsers]
  );

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const publicUsers: User[] = storedUsers.map(({ passwordHash, isGoogle, ...u }) => u);

  return (
    <AuthCtx.Provider value={{ user, users: publicUsers, isLoaded, teacherCode, setTeacherCode, login, loginWithEmail, signup, signupGoogle, logout, getUserById, updateUser, deleteUser, linkChildToParent }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
