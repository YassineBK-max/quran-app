"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/contexts/AuthContext";
import { useClassroom } from "@/contexts/ClassroomContext";
import { useMessages } from "@/contexts/MessageContext";
import { ADMIN_CODE } from "@/lib/constants";

export default function AdminPage() {
  const { user, users } = useAuth();
  const { classes } = useClassroom();
  const { sendMessage } = useMessages();
  const router = useRouter();

  const [msgContent, setMsgContent] = useState("");
  const [msgRecipient, setMsgRecipient] = useState("");
  const [msgType, setMsgType] = useState<"user" | "class">("user");
  const [sent, setSent] = useState(false);

  if (!user || user.role !== "admin") {
    return (
      <>
        <Header title="Admin" />
        <main className="max-w-3xl mx-auto px-4 py-8 text-center">
          <p className="text-muted-foreground">Access denied. Admin only.</p>
          <button onClick={() => router.push("/")} className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm">
            Back to home
          </button>
        </main>
      </>
    );
  }

  const teachers = users.filter((u) => u.role === "teacher");
  const students = users.filter((u) => u.role === "student");

  const handleSend = () => {
    if (!msgContent.trim() || !msgRecipient) return;
    sendMessage(msgRecipient, msgType, msgContent.trim(), true);
    setMsgContent(""); setMsgRecipient(""); setSent(true);
    setTimeout(() => setSent(false), 3000);
  };

  return (
    <>
      <Header title="Admin Panel" />
      <main className="max-w-3xl mx-auto px-4 py-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Teachers", count: teachers.length },
            { label: "Students", count: students.length },
            { label: "Classes", count: classes.length },
          ].map((s) => (
            <div key={s.label} className="bg-card border border-border rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-primary">{s.count}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Admin code display */}
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Admin Code (for teacher registration)</p>
          <p className="font-mono font-bold text-lg text-primary mt-1 tracking-wider">{ADMIN_CODE}</p>
          <p className="text-xs text-muted-foreground mt-1">Share this only with teachers.</p>
        </div>

        {/* Teachers list */}
        <div className="bg-card border border-border rounded-xl p-4">
          <h2 className="text-sm font-semibold mb-3">Teachers</h2>
          {teachers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No teachers registered yet.</p>
          ) : (
            <div className="space-y-2">
              {teachers.map((t) => {
                const teacherClasses = classes.filter((c) => c.teacherId === t.id);
                return (
                  <div key={t.id} className="flex items-center gap-3 p-3 border border-border rounded-xl">
                    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
                      {t.name[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.email} · {teacherClasses.length} class(es)</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Classes list */}
        <div className="bg-card border border-border rounded-xl p-4">
          <h2 className="text-sm font-semibold mb-3">All Classes</h2>
          {classes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No classes yet.</p>
          ) : (
            <div className="space-y-2">
              {classes.map((c) => (
                <div key={c.id} className="p-3 border border-border rounded-xl">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{c.name}</p>
                    <span className="font-mono text-xs text-primary bg-primary/10 px-2 py-0.5 rounded">{c.code}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Teacher: {c.teacherName} · {c.studentIds.length} student(s)
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Send message */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <h2 className="text-sm font-semibold">Send Message</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setMsgType("user")}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${msgType === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
            >
              User
            </button>
            <button
              onClick={() => setMsgType("class")}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${msgType === "class" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
            >
              Class
            </button>
          </div>
          <select
            value={msgRecipient}
            onChange={(e) => setMsgRecipient(e.target.value)}
            className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm"
          >
            <option value="">Select recipient...</option>
            {msgType === "user"
              ? users.filter((u) => u.id !== user.id).map((u) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                ))
              : classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)
            }
          </select>
          <textarea
            value={msgContent}
            onChange={(e) => setMsgContent(e.target.value)}
            placeholder="Message content..."
            rows={3}
            className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm resize-none"
          />
          {sent && <p className="text-primary text-xs">Message sent!</p>}
          <button
            onClick={handleSend}
            disabled={!msgContent.trim() || !msgRecipient}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold disabled:opacity-40"
          >
            Send
          </button>
        </div>
      </main>
    </>
  );
}
