"use client";
import { createContext, useContext, ReactNode, useCallback } from "react";
import { User, UserRole } from "@/lib/types";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { ADMIN_CODE } from "@/lib/constants";

interface AuthContextType {
  user: User | null;
  users: User[];
  login: (email: string, password: string) => string | null;
  signup: (name: string, email: string, password: string, role: UserRole, code?: string) => string | null;
  signupGoogle: (name: string, email: string, role: UserRole, code?: string) => string | null;
  logout: () => void;
  getUserById: (id: string) => User | undefined;
  updateUser: (id: string, partial: Partial<User>) => void;
}

const AuthCtx = createContext<AuthContextType>({
  user: null,
  users: [],
  login: () => null,
  signup: () => null,
  signupGoogle: () => null,
  logout: () => {},
  getUserById: () => undefined,
  updateUser: () => {},
});

// Passwords stored as plain text since this is localStorage-only (no backend)
interface StoredUser extends User {
  passwordHash?: string;
  isGoogle?: boolean;
}

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [storedUsers, setStoredUsers] = useLocalStorage<StoredUser[]>("quran-users", []);
  const [currentUserId, setCurrentUserId] = useLocalStorage<string | null>("quran-current-user", null);

  const user = storedUsers.find((u) => u.id === currentUserId) ?? null;

  const getUserById = useCallback(
    (id: string) => storedUsers.find((u) => u.id === id),
    [storedUsers]
  );

  const updateUser = useCallback(
    (id: string, partial: Partial<User>) => {
      setStoredUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...partial } : u)));
    },
    [setStoredUsers]
  );

  const login = useCallback(
    (email: string, password: string): string | null => {
      const found = storedUsers.find(
        (u) => u.email.toLowerCase() === email.toLowerCase() && u.passwordHash === password
      );
      if (!found) return "Invalid email or password.";
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
      if (role === "teacher") {
        if (code !== ADMIN_CODE) return "Invalid admin code.";
      }
      if (role === "admin") {
        if (code !== ADMIN_CODE) return "Invalid admin code.";
      }
      // For students, class code validation happens in ClassroomContext after signup
      const newUser: StoredUser = {
        id: genId(),
        email,
        name,
        role,
        createdAt: Date.now(),
        passwordHash: password,
      };
      setStoredUsers((prev) => [...prev, newUser]);
      setCurrentUserId(newUser.id);
      return null;
    },
    [storedUsers, setStoredUsers, setCurrentUserId]
  );

  const signupGoogle = useCallback(
    (name: string, email: string, role: UserRole, code?: string): string | null => {
      if (storedUsers.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
        // Google re-login: just log in
        const found = storedUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
        if (found) { setCurrentUserId(found.id); return null; }
      }
      if (role === "teacher" && code !== ADMIN_CODE) return "Invalid admin code.";
      if (role === "admin" && code !== ADMIN_CODE) return "Invalid admin code.";
      const newUser: StoredUser = {
        id: genId(),
        email,
        name,
        role,
        createdAt: Date.now(),
        isGoogle: true,
      };
      setStoredUsers((prev) => [...prev, newUser]);
      setCurrentUserId(newUser.id);
      return null;
    },
    [storedUsers, setStoredUsers, setCurrentUserId]
  );

  const logout = useCallback(() => {
    setCurrentUserId(null);
  }, [setCurrentUserId]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const publicUsers: User[] = storedUsers.map(({ passwordHash, isGoogle, ...u }) => u);

  return (
    <AuthCtx.Provider value={{ user, users: publicUsers, login, signup, signupGoogle, logout, getUserById, updateUser }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
