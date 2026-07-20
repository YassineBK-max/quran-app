"use client";
import { createContext, useContext, ReactNode, useCallback, useMemo } from "react";
import { CalendarEvent } from "@/lib/types";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useAuth, getLinkedChildIds } from "./AuthContext";
import { useClassroom } from "./ClassroomContext";

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

interface CalendarContextType {
  events: CalendarEvent[];
  addEvent: (classId: string, event: Omit<CalendarEvent, "id" | "classId" | "createdAt">) => void;
  removeEvent: (id: string) => void;
  updateEvent: (id: string, partial: Partial<CalendarEvent>) => void;
  getEventsForClass: (classId: string) => CalendarEvent[];
  getEventsForUser: () => CalendarEvent[];
  getSessions: () => CalendarEvent[];
  userClassIds: string[];
}

const CalendarCtx = createContext<CalendarContextType>({
  events: [],
  addEvent: () => {},
  removeEvent: () => {},
  updateEvent: () => {},
  getEventsForClass: () => [],
  getEventsForUser: () => [],
  getSessions: () => [],
  userClassIds: [],
});

export function CalendarProvider({ children }: { children: ReactNode }) {
  const { user, users } = useAuth();
  const { myClass, getTeacherClasses, classes } = useClassroom();
  const [events, setEvents] = useLocalStorage<CalendarEvent[]>("quran-calendar-events", []);

  const userClassIds = useMemo(() => {
    if (!user) return [];
    if (user.role === "teacher") return getTeacherClasses().map((c) => c.id);
    if (user.role === "student" && myClass) return [myClass.id];
    if (user.role === "admin") return classes.map((c) => c.id);
    if (user.role === "parent") {
      const childIds = getLinkedChildIds(user);
      const childClassIds = childIds
        .map((cid) => users.find((u) => u.id === cid)?.classId)
        .filter((id): id is string => !!id);
      return childClassIds.filter((id, i) => childClassIds.indexOf(id) === i);
    }
    return [];
  }, [user, users, getTeacherClasses, myClass, classes]);

  const addEvent = useCallback(
    (classId: string, event: Omit<CalendarEvent, "id" | "classId" | "createdAt">) => {
      const newEvent: CalendarEvent = { ...event, id: genId(), classId, createdAt: Date.now() };
      setEvents((prev) => [...prev, newEvent]);
    },
    [setEvents]
  );

  const removeEvent = useCallback(
    (id: string) => setEvents((prev) => prev.filter((e) => e.id !== id)),
    [setEvents]
  );

  const updateEvent = useCallback(
    (id: string, partial: Partial<CalendarEvent>) =>
      setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...partial } : e))),
    [setEvents]
  );

  const getEventsForClass = useCallback(
    (classId: string) => events.filter((e) => e.classId === classId),
    [events]
  );

  const getEventsForUser = useCallback(() => {
    if (!user) return [];
    // Admins view class calendars through the admin panel, not their personal feed
    if (user.role === "admin") return [];
    // Teachers see all events in their classes
    if (user.role === "teacher") {
      return events.filter((e) => userClassIds.includes(e.classId));
    }

    const childIds = user.role === "parent" ? getLinkedChildIds(user) : [];

    return events.filter((e) => {
      if (!userClassIds.includes(e.classId)) return false;

      // New audience system: targetStudents / targetParents set explicitly
      const hasNewTargeting = e.targetStudents !== undefined || e.targetParents !== undefined;
      if (hasNewTargeting) {
        if (user.role === "student") {
          const ts = e.targetStudents;
          if (!ts) return false;
          if (ts === "all") return true;
          return ts.includes(user.id);
        }
        if (user.role === "parent") {
          const tp = e.targetParents;
          if (!tp) return false;
          if (tp === "all") return true;
          return tp.some((sid) => childIds.includes(sid));
        }
        return false;
      }

      // Legacy targeting (backward compat)
      if (user.role === "student") {
        if (e.targetType === "user") return e.targetUserId === user.id;
        return true;
      }
      if (user.role === "parent") {
        if (e.targetType === "user") return e.targetUserId ? childIds.includes(e.targetUserId) : false;
        return true;
      }
      return false;
    });
  }, [events, user, userClassIds]);

  const getSessions = useCallback(
    () =>
      getEventsForUser()
        .filter((e) => e.type === "session")
        .sort((a, b) => a.date.localeCompare(b.date)),
    [getEventsForUser]
  );

  return (
    <CalendarCtx.Provider value={{ events, addEvent, removeEvent, updateEvent, getEventsForClass, getEventsForUser, getSessions, userClassIds }}>
      {children}
    </CalendarCtx.Provider>
  );
}

export const useCalendar = () => useContext(CalendarCtx);
