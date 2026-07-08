import { createClient, RealtimeChannel } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabase = url && key ? createClient(url, key) : null;
export const isSupabaseReady = Boolean(url && key);

export const ACTIVITY_CHANNEL = "admin-activity-feed";

export type ActivityEventType = "signup" | "login" | "logout" | "visit";

export interface ActivityPayload {
  type: ActivityEventType;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  ts: number;
}

export interface PresenceUser {
  userId: string;
  userName: string;
  userRole: string;
  joinedAt: number;
}

// Fire-and-forget broadcast: create a one-shot channel, subscribe, send, cleanup.
export function broadcastUserActivity(payload: ActivityPayload): void {
  if (!supabase) return;

  const ch: RealtimeChannel = supabase.channel(`${ACTIVITY_CHANNEL}-tx-${Date.now()}`, {
    config: { broadcast: { self: false } },
  });

  ch.subscribe((status) => {
    if (status !== "SUBSCRIBED") return;
    ch.send({ type: "broadcast", event: "user_activity", payload }).catch(() => {});
    setTimeout(() => supabase!.removeChannel(ch), 3000);
  });
}
