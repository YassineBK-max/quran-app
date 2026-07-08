"use client";
import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { supabase, isSupabaseReady } from "@/lib/supabase";
import {
  AvailabilitySlot,
  SlotBooking,
  BookingWithSlot,
  CreateSlotInput,
  fetchAllSlots,
  fetchAllBookings,
  insertSlot,
  removeSlot,
  insertBooking,
  updateBookingStatus,
} from "@/lib/booking";
import { useAuth } from "./AuthContext";
import { useClassroom } from "./ClassroomContext";

interface BookingContextType {
  slots: AvailabilitySlot[];
  bookings: SlotBooking[];
  loading: boolean;
  error: string | null;
  addSlot: (input: CreateSlotInput) => Promise<void>;
  deleteSlot: (id: string) => Promise<void>;
  bookSlot: (slotId: string) => Promise<void>;
  cancelBooking: (bookingId: string) => Promise<void>;
  getSlotBookings: (slotId: string) => SlotBooking[];
  getMyBookings: () => BookingWithSlot[];
  getMySlots: () => AvailabilitySlot[];
  getAvailableSlots: () => AvailabilitySlot[];
  slotBookingCount: (slotId: string) => number;
  myBookingForSlot: (slotId: string) => SlotBooking | undefined;
  refresh: () => Promise<void>;
}

const BookingCtx = createContext<BookingContextType>({
  slots: [],
  bookings: [],
  loading: false,
  error: null,
  addSlot: async () => {},
  deleteSlot: async () => {},
  bookSlot: async () => {},
  cancelBooking: async () => {},
  getSlotBookings: () => [],
  getMyBookings: () => [],
  getMySlots: () => [],
  getAvailableSlots: () => [],
  slotBookingCount: () => 0,
  myBookingForSlot: () => undefined,
  refresh: async () => {},
});

function sortSlots(arr: AvailabilitySlot[]) {
  return [...arr].sort((a, b) =>
    a.date !== b.date ? a.date.localeCompare(b.date) : a.start_time.localeCompare(b.start_time)
  );
}

export function BookingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { myClass } = useClassroom();
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [bookings, setBookings] = useState<SlotBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isSupabaseReady) return;
    setLoading(true);
    try {
      const [s, b] = await Promise.all([fetchAllSlots(), fetchAllBookings()]);
      setSlots(s);
      setBookings(b);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!supabase || !isSupabaseReady) return;
    const channel = supabase
      .channel("booking-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "availability_slots" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setSlots((prev) => sortSlots([...prev, payload.new as AvailabilitySlot]));
          } else if (payload.eventType === "DELETE") {
            setSlots((prev) => prev.filter((s) => s.id !== (payload.old as { id: string }).id));
          } else if (payload.eventType === "UPDATE") {
            setSlots((prev) =>
              prev.map((s) => (s.id === (payload.new as AvailabilitySlot).id ? (payload.new as AvailabilitySlot) : s))
            );
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setBookings((prev) => [payload.new as SlotBooking, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setBookings((prev) =>
              prev.map((b) => (b.id === (payload.new as SlotBooking).id ? (payload.new as SlotBooking) : b))
            );
          } else if (payload.eventType === "DELETE") {
            setBookings((prev) => prev.filter((b) => b.id !== (payload.old as { id: string }).id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase!.removeChannel(channel);
    };
  }, []);

  const activeBookings = useMemo(
    () => bookings.filter((b) => b.status === "confirmed"),
    [bookings]
  );

  const slotBookingCount = useCallback(
    (slotId: string) => activeBookings.filter((b) => b.slot_id === slotId).length,
    [activeBookings]
  );

  const getSlotBookings = useCallback(
    (slotId: string) => activeBookings.filter((b) => b.slot_id === slotId),
    [activeBookings]
  );

  const getMyBookings = useCallback((): BookingWithSlot[] => {
    if (!user) return [];
    return bookings
      .filter((b) => b.student_id === user.id)
      .map((b) => ({ ...b, slot: slots.find((s) => s.id === b.slot_id) }));
  }, [bookings, user, slots]);

  const getMySlots = useCallback((): AvailabilitySlot[] => {
    if (!user) return [];
    return slots.filter((s) => s.teacher_id === user.id);
  }, [slots, user]);

  const getAvailableSlots = useCallback((): AvailabilitySlot[] => {
    if (!user || user.role !== "student") return [];
    const teacherId = myClass?.teacherId;
    if (!teacherId) return [];
    const today = new Date().toISOString().split("T")[0];
    return slots.filter(
      (s) =>
        s.teacher_id === teacherId &&
        s.date >= today &&
        slotBookingCount(s.id) < s.max_bookings
    );
  }, [slots, user, myClass, slotBookingCount]);

  const myBookingForSlot = useCallback(
    (slotId: string): SlotBooking | undefined => {
      if (!user) return undefined;
      return bookings.find(
        (b) => b.slot_id === slotId && b.student_id === user.id && b.status === "confirmed"
      );
    },
    [bookings, user]
  );

  const addSlot = useCallback(async (input: CreateSlotInput) => {
    const slot = await insertSlot(input);
    setSlots((prev) => sortSlots([...prev, slot]));
  }, []);

  const deleteSlot = useCallback(async (id: string) => {
    await removeSlot(id);
    setSlots((prev) => prev.filter((s) => s.id !== id));
    setBookings((prev) => prev.filter((b) => b.slot_id !== id));
  }, []);

  const bookSlot = useCallback(
    async (slotId: string) => {
      if (!user) throw new Error("Not logged in");
      const slot = slots.find((s) => s.id === slotId);
      if (!slot) throw new Error("Slot not found");
      if (slotBookingCount(slotId) >= slot.max_bookings) throw new Error("No spots left");
      if (myBookingForSlot(slotId)) throw new Error("Already booked");
      const b = await insertBooking({ slot_id: slotId, student_id: user.id, student_name: user.name });
      setBookings((prev) => [b, ...prev]);
    },
    [user, slots, slotBookingCount, myBookingForSlot]
  );

  const cancelBooking = useCallback(async (bookingId: string) => {
    await updateBookingStatus(bookingId, "cancelled");
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: "cancelled" } : b))
    );
  }, []);

  return (
    <BookingCtx.Provider
      value={{
        slots,
        bookings,
        loading,
        error,
        addSlot,
        deleteSlot,
        bookSlot,
        cancelBooking,
        getSlotBookings,
        getMyBookings,
        getMySlots,
        getAvailableSlots,
        slotBookingCount,
        myBookingForSlot,
        refresh: load,
      }}
    >
      {children}
    </BookingCtx.Provider>
  );
}

export const useBooking = () => useContext(BookingCtx);
