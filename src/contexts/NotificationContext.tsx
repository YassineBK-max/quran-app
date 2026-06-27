"use client";
import { createContext, useContext, ReactNode, useCallback, useEffect } from "react";
import { AppNotification } from "@/lib/types";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useAuth } from "./AuthContext";
import { useCalendar } from "./CalendarContext";

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

interface NotificationContextType {
  notifications: AppNotification[];
  addNotification: (n: Omit<AppNotification, "id" | "userId" | "read" | "createdAt">) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  unreadCount: number;
}

const NotificationCtx = createContext<NotificationContextType>({
  notifications: [],
  addNotification: () => {},
  markRead: () => {},
  markAllRead: () => {},
  unreadCount: 0,
});

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { getEventsForUser } = useCalendar();
  const [notifications, setNotifications] = useLocalStorage<AppNotification[]>(
    `quran-notifications-${user?.id ?? "guest"}`,
    []
  );

  const addNotification = useCallback(
    (n: Omit<AppNotification, "id" | "userId" | "read" | "createdAt">) => {
      if (!user) return;
      setNotifications((prev) => {
        if (prev.find((x) => x.title === n.title && x.type === n.type)) return prev;
        return [...prev, { ...n, id: genId(), userId: user.id, read: false, createdAt: Date.now() }];
      });
    },
    [user, setNotifications]
  );

  const markRead = useCallback(
    (id: string) => setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n))),
    [setNotifications]
  );

  const markAllRead = useCallback(
    () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true }))),
    [setNotifications]
  );

  // Auto-create deadline notifications (24h window)
  useEffect(() => {
    if (!user) return;
    const now = Date.now();
    const in24h = now + 24 * 60 * 60 * 1000;
    const userEvents = getEventsForUser();

    userEvents.forEach((event) => {
      if (event.type !== "deadline") return;
      const eventMs = new Date(`${event.date}T${event.time ?? "23:59"}`).getTime();
      if (eventMs > now && eventMs <= in24h) {
        const notifId = `deadline-${event.id}`;
        setNotifications((prev) => {
          if (prev.find((n) => n.id === notifId)) return prev;
          return [
            ...prev,
            {
              id: notifId,
              userId: user.id,
              type: "deadline",
              title: "Deadline approaching",
              body: `"${event.title}" is due in less than 24 hours`,
              read: false,
              createdAt: Date.now(),
              link: "/calendar",
            },
          ];
        });
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, getEventsForUser]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationCtx.Provider value={{ notifications, addNotification, markRead, markAllRead, unreadCount }}>
      {children}
    </NotificationCtx.Provider>
  );
}

export const useNotifications = () => useContext(NotificationCtx);
