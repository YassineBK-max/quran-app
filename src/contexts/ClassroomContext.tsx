"use client";
import { createContext, useContext, ReactNode, useCallback } from "react";
import { ClassRoom, Assignment } from "@/lib/types";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useAuth } from "./AuthContext";

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function genCode() {
  return Math.random().toString(36).toUpperCase().slice(2, 8);
}

interface ClassroomContextType {
  classes: ClassRoom[];
  myClass: ClassRoom | null;
  myClasses: ClassRoom[];
  createClass: (name: string) => ClassRoom;
  joinClass: (code: string) => string | null;
  leaveClass: (classId?: string) => void;
  addAssignment: (classId: string, title: string, description?: string, dueDate?: string) => void;
  removeAssignment: (classId: string, assignmentId: string) => void;
  updateAssignment: (classId: string, assignmentId: string, patch: { title?: string; description?: string; dueDate?: string }) => void;
  expelUserFromClasses: (userId: string, role: string) => void;
  getClass: (id: string) => ClassRoom | undefined;
  getClassByCode: (code: string) => ClassRoom | undefined;
  getTeacherClasses: () => ClassRoom[];
}

const ClassroomCtx = createContext<ClassroomContextType>({
  classes: [],
  myClass: null,
  myClasses: [],
  createClass: () => ({ id: "", name: "", code: "", teacherId: "", teacherName: "", studentIds: [], assignments: [], createdAt: 0 }),
  joinClass: () => null,
  leaveClass: () => {},
  addAssignment: () => {},
  removeAssignment: () => {},
  updateAssignment: () => {},
  expelUserFromClasses: () => {},
  getClass: () => undefined,
  getClassByCode: () => undefined,
  getTeacherClasses: () => [],
});

export function ClassroomProvider({ children }: { children: ReactNode }) {
  const { user, updateUser } = useAuth();
  const [classes, setClasses] = useLocalStorage<ClassRoom[]>("quran-classes", []);

  // All classes the current student is in
  const studentClassIds: string[] = user
    ? (user.classIds ?? (user.classId ? [user.classId] : []))
    : [];

  const myClasses = classes.filter((c) => studentClassIds.includes(c.id));
  const myClass = myClasses[0] ?? null;

  const createClass = useCallback(
    (name: string): ClassRoom => {
      if (!user) throw new Error("Not logged in");
      const newClass: ClassRoom = {
        id: genId(),
        name,
        code: genCode(),
        teacherId: user.id,
        teacherName: user.name,
        studentIds: [],
        assignments: [],
        createdAt: Date.now(),
      };
      setClasses((prev) => [...prev, newClass]);
      return newClass;
    },
    [user, setClasses]
  );

  const joinClass = useCallback(
    (code: string): string | null => {
      if (!user) return "Not logged in.";
      const found = classes.find((c) => c.code === code.toUpperCase());
      if (!found) return "Class code not found. Ask your teacher for the correct code.";
      if (found.studentIds.includes(user.id)) return "You are already in this class.";

      const currentIds = user.classIds ?? (user.classId ? [user.classId] : []);
      const updatedIds = [...currentIds, found.id];

      setClasses((prev) =>
        prev.map((c) => (c.id === found.id ? { ...c, studentIds: [...c.studentIds, user.id] } : c))
      );
      updateUser(user.id, { classId: updatedIds[0], classIds: updatedIds });
      return null;
    },
    [user, classes, setClasses, updateUser]
  );

  const leaveClass = useCallback(
    (classId?: string) => {
      if (!user) return;
      const targetId = classId ?? user.classId;
      if (!targetId) return;

      setClasses((prev) =>
        prev.map((c) =>
          c.id === targetId ? { ...c, studentIds: c.studentIds.filter((id) => id !== user.id) } : c
        )
      );
      const currentIds = user.classIds ?? (user.classId ? [user.classId] : []);
      const updatedIds = currentIds.filter((id) => id !== targetId);
      updateUser(user.id, { classId: updatedIds[0], classIds: updatedIds });
    },
    [user, setClasses, updateUser]
  );

  const addAssignment = useCallback(
    (classId: string, title: string, description?: string, dueDate?: string) => {
      const assignment: Assignment = { id: genId(), classId, title, description, dueDate, createdAt: Date.now() };
      setClasses((prev) =>
        prev.map((c) => (c.id === classId ? { ...c, assignments: [...c.assignments, assignment] } : c))
      );
    },
    [setClasses]
  );

  const removeAssignment = useCallback(
    (classId: string, assignmentId: string) => {
      setClasses((prev) =>
        prev.map((c) =>
          c.id === classId ? { ...c, assignments: c.assignments.filter((a) => a.id !== assignmentId) } : c
        )
      );
    },
    [setClasses]
  );

  const updateAssignment = useCallback(
    (classId: string, assignmentId: string, patch: { title?: string; description?: string; dueDate?: string }) => {
      setClasses((prev) =>
        prev.map((c) =>
          c.id === classId
            ? { ...c, assignments: c.assignments.map((a) => (a.id === assignmentId ? { ...a, ...patch } : a)) }
            : c
        )
      );
    },
    [setClasses]
  );

  // Called when admin expels a user
  const expelUserFromClasses = useCallback(
    (userId: string, role: string) => {
      setClasses((prev) => {
        if (role === "teacher") {
          // Delete all classes taught by this teacher; students lose access
          return prev.filter((c) => c.teacherId !== userId);
        }
        if (role === "student") {
          // Remove student from all classes they're in
          return prev.map((c) => ({
            ...c,
            studentIds: c.studentIds.filter((sid) => sid !== userId),
          }));
        }
        return prev;
      });
    },
    [setClasses]
  );

  const getClass = useCallback((id: string) => classes.find((c) => c.id === id), [classes]);
  const getClassByCode = useCallback((code: string) => classes.find((c) => c.code === code.toUpperCase()), [classes]);
  const getTeacherClasses = useCallback(
    () => (user ? classes.filter((c) => c.teacherId === user.id) : []),
    [user, classes]
  );

  return (
    <ClassroomCtx.Provider value={{
      classes, myClass, myClasses, createClass, joinClass, leaveClass,
      addAssignment, removeAssignment, updateAssignment,
      expelUserFromClasses, getClass, getClassByCode, getTeacherClasses,
    }}>
      {children}
    </ClassroomCtx.Provider>
  );
}

export const useClassroom = () => useContext(ClassroomCtx);
