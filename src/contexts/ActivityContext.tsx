"use client";
import { createContext, useContext, ReactNode, useEffect, useState, useCallback } from "react";
import { supabase, ACTIVITY_CHANNEL, ActivityPayload, PresenceUser } from "@/lib/supabase";
import { useAuth } from "./AuthContext";

// Single shared Realtime channel for "admin-activity-feed", used by:
//   - every logged-in user, to track their own presence
//   - the admin Live Activity page, to read the presence roster + broadcast feed
// Must be a single subscription per tab: Supabase rejects registering new
// listeners on a channel that's already subscribed, so two independent
// `.channel(ACTIVITY_CHANNEL)` calls in the same tab collide.

interface ActivityContextType {
  connected: boolean;
  onlineUsers: Record<string, PresenceUser[]>;
  events: ActivityPayload[];
  clearEvents: () => void;
}

const ActivityCtx = createContext<ActivityContextType>({
  connected: false,
  onlineUsers: {},
  events: [],
  clearEvents: () => {},
});

export function ActivityProvider({ children }: { children: ReactNode }) {
  const { user, isLoaded } = useAuth();
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Record<string, PresenceUser[]>>({});
  const [events, setEvents] = useState<ActivityPayload[]>([]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!isLoaded || !user || !supabase) return;

    const ch = supabase
      .channel(ACTIVITY_CHANNEL, { config: { presence: { key: user.id } } })
      .on("broadcast", { event: "user_activity" }, ({ payload }) => {
        setEvents((prev) => [payload as ActivityPayload, ...prev].slice(0, 100));
      })
      .on("presence", { event: "sync" }, () => {
        const raw = ch.presenceState() as Record<string, unknown[]>;
        const parsed: Record<string, PresenceUser[]> = {};
        for (const [key, list] of Object.entries(raw)) {
          parsed[key] = list as PresenceUser[];
        }
        setOnlineUsers(parsed);
      })
      .subscribe((status) => {
        setConnected(status === "SUBSCRIBED");
        if (status === "SUBSCRIBED") {
          ch.track({
            userId: user.id,
            userName: user.name,
            userRole: user.role,
            joinedAt: Date.now(),
          }).catch(() => {});
        }
      });

    return () => {
      setConnected(false);
      setOnlineUsers({});
      supabase!.removeChannel(ch);
    };
  }, [isLoaded, user?.id]);

  const clearEvents = useCallback(() => setEvents([]), []);

  return (
    <ActivityCtx.Provider value={{ connected, onlineUsers, events, clearEvents }}>
      {children}
    </ActivityCtx.Provider>
  );
}

export const useActivity = () => useContext(ActivityCtx);
