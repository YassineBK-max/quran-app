"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/contexts/AuthContext";
import { useClassroomsDb } from "@/contexts/ClassroomsDbContext";
import { isSupabaseReady } from "@/lib/supabase";

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function monthLabel(month: string) {
  return new Date(`${month}-01T00:00:00`).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

// ── Teacher view: this month's accrued pay + deposit history ──────────────────
function TeacherPayments({ teacherId }: { teacherId: string }) {
  const { getTeacherClassrooms, getClassroomPrivate, getClassroomDueForMonth, getTeacherDueForMonth, getPaymentsForTeacher, getPaymentForMonth } = useClassroomsDb();
  const month = currentMonth();

  const myClassrooms = getTeacherClassrooms();
  const totalDue = getTeacherDueForMonth(teacherId, month);
  const thisMonthPayment = getPaymentForMonth(teacherId, month);
  const history = getPaymentsForTeacher(teacherId).filter((p) => p.month !== month);

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">{monthLabel(month)}</h2>
          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
            thisMonthPayment?.status === "paid"
              ? "bg-green-500/10 text-green-600 border-green-500/20"
              : "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
          }`}>
            {thisMonthPayment?.status === "paid" ? "Deposited" : "Pending"}
          </span>
        </div>
        <p className="text-3xl font-bold text-primary">${totalDue.toFixed(2)}</p>
        <p className="text-xs text-muted-foreground mt-1">Accrued from sessions held so far this month</p>

        {myClassrooms.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border space-y-2">
            {myClassrooms.map((c) => (
              <div key={c.id} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{c.name}{!getClassroomPrivate(c.id)?.hourly_rate ? " (no rate set)" : ""}</span>
                <span className="font-medium">${getClassroomDueForMonth(c.id, month).toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="text-sm font-semibold mb-3">Payment history</h3>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">No past deposits yet.</p>
        ) : (
          <div className="space-y-2">
            {history.map((p) => (
              <div key={p.id} className="flex items-center justify-between border border-border rounded-lg p-3">
                <div>
                  <p className="text-sm font-medium">{monthLabel(p.month)}</p>
                  {p.paid_at && (
                    <p className="text-[10px] text-muted-foreground">
                      Deposited {new Date(p.paid_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  )}
                </div>
                <span className="font-semibold text-primary text-sm">${p.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Admin view: every teacher's accrued pay this month, deposit action ────────
function AdminPayments() {
  const { classrooms, getTeacherDueForMonth, getPaymentForMonth, markPaid } = useClassroomsDb();
  const month = currentMonth();
  const [confirmedId, setConfirmedId] = useState<string | null>(null);

  // Teacher roster comes straight from the classrooms table, which is
  // shared across devices via Supabase (unlike a per-device local list).
  const teachers = Array.from(
    new Map(classrooms.map((c) => [c.teacher_id, { id: c.teacher_id, name: c.teacher_name }])).values()
  );

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground px-1">{monthLabel(month)}</p>
      {teachers.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No teachers with active classrooms yet.</p>
      ) : (
        teachers.map((t) => {
          const due = getTeacherDueForMonth(t.id, month);
          const payment = getPaymentForMonth(t.id, month);
          const isPaid = payment?.status === "paid";
          return (
            <div key={t.id} className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold shrink-0">
                {t.name[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{t.name}</p>
                <p className="text-xs text-muted-foreground truncate">${due.toFixed(2)} accrued</p>
              </div>
              {isPaid ? (
                <span className="text-[10px] px-2 py-1 rounded-full bg-green-500/10 text-green-600 border border-green-500/20 font-medium shrink-0">
                  Deposited
                </span>
              ) : (
                <button
                  onClick={() => {
                    markPaid(t.id, month, due);
                    setConfirmedId(t.id);
                    setTimeout(() => setConfirmedId((id) => (id === t.id ? null : id)), 2000);
                  }}
                  disabled={due <= 0}
                  className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium disabled:opacity-40 min-h-[36px] shrink-0"
                >
                  {confirmedId === t.id ? "Deposited ✓" : "Mark as Paid"}
                </button>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

export default function PaymentsPage() {
  const { user } = useAuth();
  const router = useRouter();

  if (!user || (user.role !== "teacher" && user.role !== "admin")) {
    return (
      <>
        <Header title="Payments" />
        <main className="max-w-3xl mx-auto px-4 py-8 text-center">
          <p className="text-muted-foreground mb-4">This page is only available to teachers and admins.</p>
          <button onClick={() => router.push("/")} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl">Home</button>
        </main>
      </>
    );
  }

  if (!isSupabaseReady) {
    return (
      <>
        <Header title="Payments" showBack />
        <main className="max-w-3xl mx-auto px-4 py-8 text-center">
          <p className="text-muted-foreground">
            Payments are tracked through Course Classrooms, which requires Supabase to be configured. See the Classrooms page for setup.
          </p>
        </main>
      </>
    );
  }

  return (
    <>
      <Header title="Payments" showBack />
      <main className="max-w-3xl mx-auto px-4 py-4">
        {user.role === "admin" ? <AdminPayments /> : <TeacherPayments teacherId={user.id} />}
      </main>
    </>
  );
}
