/*
 * ─── Database schema ─────────────────────────────────────────────────────────
 * The full, canonical schema (tables, RLS policies) lives in
 * supabase/migration.sql — run that once in the Supabase SQL Editor.
 *
 * teacher_id/student_id are real Supabase Auth ids (profiles.id), enforced
 * server-side: a teacher can only write their own slots, a student can only
 * book/cancel their own bookings, and reading a slot's bookings is limited
 * to the student who made it, the teacher who owns the slot, or an admin —
 * this used to be fully open ("using (true)") to anyone holding the public
 * anon key, logged in or not.
 *
 * Because a student can no longer see other students' bookings on a shared
 * slot, `booked_count` is a denormalized total kept in sync by a trigger
 * (sync_slot_booked_count in migration.sql) so "N of M booked" / "is this
 * slot full" still works for everyone without exposing who else booked it.
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
  booked_count: number;
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

export type CreateSlotInput = Omit<AvailabilitySlot, "id" | "created_at" | "booked_count">;

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
