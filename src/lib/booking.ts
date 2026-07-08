/*
 * ─── Supabase Setup — run once in the SQL Editor ────────────────────────────
 *
 * create table if not exists availability_slots (
 *   id           uuid primary key default gen_random_uuid(),
 *   teacher_id   text not null,
 *   teacher_name text not null,
 *   class_id     text,
 *   class_name   text,
 *   date         text not null,        -- YYYY-MM-DD
 *   start_time   text not null,        -- HH:MM
 *   end_time     text not null,        -- HH:MM
 *   title        text not null default 'Study Session',
 *   notes        text,
 *   max_bookings smallint not null default 1,
 *   created_at   timestamptz not null default now()
 * );
 *
 * create table if not exists bookings (
 *   id           uuid primary key default gen_random_uuid(),
 *   slot_id      uuid not null references availability_slots(id) on delete cascade,
 *   student_id   text not null,
 *   student_name text not null,
 *   status       text not null default 'confirmed'
 *                  check (status in ('confirmed','cancelled')),
 *   notes        text,
 *   created_at   timestamptz not null default now(),
 *   unique (slot_id, student_id)
 * );
 *
 * -- Permissive RLS (this app uses custom localStorage auth, not Supabase Auth)
 * alter table availability_slots enable row level security;
 * alter table bookings enable row level security;
 * create policy "all_slots"    on availability_slots for all using (true) with check (true);
 * create policy "all_bookings" on bookings           for all using (true) with check (true);
 *
 * -- Enable Realtime (Postgres Changes)
 * alter publication supabase_realtime add table availability_slots;
 * alter publication supabase_realtime add table bookings;
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { supabase } from "./supabase";

export interface AvailabilitySlot {
  id: string;
  teacher_id: string;
  teacher_name: string;
  class_id: string | null;
  class_name: string | null;
  date: string;       // YYYY-MM-DD
  start_time: string; // HH:MM
  end_time: string;   // HH:MM
  title: string;
  notes: string | null;
  max_bookings: number;
  created_at: string;
}

export interface SlotBooking {
  id: string;
  slot_id: string;
  student_id: string;
  student_name: string;
  status: "confirmed" | "cancelled";
  notes: string | null;
  created_at: string;
}

export interface BookingWithSlot extends SlotBooking {
  slot: AvailabilitySlot | undefined;
}

export type CreateSlotInput = Omit<AvailabilitySlot, "id" | "created_at">;

export async function fetchAllSlots(): Promise<AvailabilitySlot[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("availability_slots")
    .select("*")
    .order("date", { ascending: true })
    .order("start_time", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchAllBookings(): Promise<SlotBooking[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function insertSlot(input: CreateSlotInput): Promise<AvailabilitySlot> {
  if (!supabase) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from("availability_slots")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function removeSlot(id: string): Promise<void> {
  if (!supabase) throw new Error("Supabase not configured");
  const { error } = await supabase.from("availability_slots").delete().eq("id", id);
  if (error) throw error;
}

export async function insertBooking(args: {
  slot_id: string;
  student_id: string;
  student_name: string;
  notes?: string;
}): Promise<SlotBooking> {
  if (!supabase) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from("bookings")
    .insert({ ...args, status: "confirmed" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateBookingStatus(
  id: string,
  status: "confirmed" | "cancelled"
): Promise<void> {
  if (!supabase) throw new Error("Supabase not configured");
  const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
  if (error) throw error;
}
