"use client";
import { createContext, useContext, ReactNode, useCallback, useEffect, useRef } from "react";
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

  // Ref to track which event IDs have already been announced as "new".
  // Keyed by userId so it resets when the user switches.
  const seenRef = useRef<{ userId: string | null; ids: Set<string> } | null>(null);

  const addNotification = useCallback(
    (n: Omit<AppNotification, "id" | "userId" | "read" | "createdAt">) => {
      if (!user) return;
      setNotifications((prev) => {
        if (prev.find((x) => x.title === n.title && x.type === n.type && x.body === n.body)) return prev;
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

  // Track new events and notify; also notify about upcoming deadlines/meetings in 24h
  useEffect(() => {
    if (!user) return;
    // Admins view class events through the admin panel — skip their feed entirely
    if (user.role === "admin") return;
    const now = Date.now();
    const in24h = now + 24 * 60 * 60 * 1000;
    const userEvents = getEventsForUser();

    // ── New-event detection ──────────────────────────────────────────────────
    // On the first render for this user, initialise the seen-set without
    // creating any notifications (so existing events don't flood the inbox).
    if (!seenRef.current || seenRef.current.userId !== user.id) {
      seenRef.current = {
        userId: user.id,
        ids: new Set(userEvents.map((e) => e.id)),
      };
    } else {
      const seen = seenRef.current.ids;
      const newEvents = userEvents.filter((e) => !seen.has(e.id));

      newEvents.forEach((event) => {
        seen.add(event.id);
        const notifId = `created-${event.id}`;
        setNotifications((prev) => {
          if (prev.find((n) => n.id === notifId)) return prev;
          const typeLabel = event.type.charAt(0).toUpperCase() + event.type.slice(1);
          return [
            ...prev,
            {
              id: notifId,
              userId: user.id,
              type: "event",
              title: `New ${typeLabel}: ${event.title}`,
              body: `Scheduled for ${event.date}${event.time ? ` at ${event.time}` : ""}`,
              read: false,
              createdAt: Date.now(),
              link: "/calendar",
            },
          ];
        });
      });
    }

    // ── Upcoming deadline / meeting alerts (within 24 h) ───────────────────
    userEvents.forEach((event) => {
      if (event.type !== "deadline" && event.type !== "meeting") return;
      const eventMs = new Date(`${event.date}T${event.time ?? "23:59"}`).getTime();
      if (eventMs > now && eventMs <= in24h) {
        const notifId = `upcoming-${event.id}`;
        setNotifications((prev) => {
          if (prev.find((n) => n.id === notifId)) return prev;
          const isMeeting = event.type === "meeting";
          return [
            ...prev,
            {
              id: notifId,
              userId: user.id,
              type: "deadline",
              title: isMeeting ? "Meeting in less than 24 hours" : "Deadline approaching",
              body: isMeeting
                ? `"${event.title}" is scheduled in less than 24 hours`
                : `"${event.title}" is due in less than 24 hours`,
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
