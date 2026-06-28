"use client";
import { createContext, useContext, ReactNode, useCallback, useEffect, useState, useRef } from "react";
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
});

interface StoredUser extends User {
  passwordHash?: string;
  isGoogle?: boolean;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [storedUsers, setStoredUsers] = useLocalStorage<StoredUser[]>("quran-users", []);
  const [currentUserId, setCurrentUserId] = useLocalStorage<string | null>("quran-current-user", null);
  const [teacherCode, setTeacherCodeState] = useLocalStorage<string>("quran-teacher-code", DEFAULT_TEACHER_CODE);
  const [isLoaded, setIsLoaded] = useState(false);
  const seededRef = useRef(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsLoaded(true));
    return () => cancelAnimationFrame(frame);
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

      let linkedChildId: string | undefined;
      let linkedStudentId: string | undefined;

      if (role === "teacher" || role === "admin") {
        if (code !== teacherCode) return "Invalid admin code.";
      }
      if (role === "parent") {
        if (!code?.trim()) return "Please enter your child's parent code.";
        const linkedStudent = storedUsers.find(
          (u) => u.parentCode === code.trim().toUpperCase() && u.role === "student"
        );
        if (!linkedStudent) return "No student found with that code.";
        if ((linkedStudent.parentIds ?? []).length >= 2) return "This student already has 2 parents linked.";
        linkedChildId = linkedStudent.id;
        linkedStudentId = linkedStudent.id;
      }

      const newUser: StoredUser = {
        id: genId(),
        email,
        name,
        role,
        createdAt: Date.now(),
        passwordHash: password,
        ...(role === "student" ? { parentCode: genParentCode() } : {}),
        ...(role === "parent" && linkedChildId ? { linkedChildId } : {}),
      };

      setStoredUsers((prev) => {
        const updated = [...prev, newUser];
        if (role === "parent" && linkedStudentId) {
          return updated.map((u) =>
            u.id === linkedStudentId
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
        return "Invalid admin code.";
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

  const logout = useCallback(() => setCurrentUserId(null), [setCurrentUserId]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const publicUsers: User[] = storedUsers.map(({ passwordHash, isGoogle, ...u }) => u);

  return (
    <AuthCtx.Provider value={{ user, users: publicUsers, isLoaded, teacherCode, setTeacherCode, login, loginWithEmail, signup, signupGoogle, logout, getUserById, updateUser }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
