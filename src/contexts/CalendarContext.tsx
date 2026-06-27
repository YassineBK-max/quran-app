"use client";
import { createContext, useContext, ReactNode, useCallback, useMemo } from "react";
import { CalendarEvent } from "@/lib/types";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useAuth } from "./AuthContext";
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
  userClassIds: string[];
}

const CalendarCtx = createContext<CalendarContextType>({
  events: [],
  addEvent: () => {},
  removeEvent: () => {},
  updateEvent: () => {},
  getEventsForClass: () => [],
  getEventsForUser: () => [],
  userClassIds: [],
});

export function CalendarProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { myClass, getTeacherClasses, classes } = useClassroom();
  const [events, setEvents] = useLocalStorage<CalendarEvent[]>("quran-calendar-events", []);

  const userClassIds = useMemo(() => {
    if (!user) return [];
    if (user.role === "teacher") return getTeacherClasses().map((c) => c.id);
    if (user.role === "student" && myClass) return [myClass.id];
    if (user.role === "admin") return classes.map((c) => c.id);
    return [];
  }, [user, getTeacherClasses, myClass, classes]);

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

  const getEventsForUser = useCallback(
    () => events.filter((e) => userClassIds.includes(e.classId)),
    [events, userClassIds]
  );

  return (
    <CalendarCtx.Provider value={{ events, addEvent, removeEvent, updateEvent, getEventsForClass, getEventsForUser, userClassIds }}>
      {children}
    </CalendarCtx.Provider>
  );
}

export const useCalendar = () => useContext(CalendarCtx);
