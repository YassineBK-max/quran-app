"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/contexts/AuthContext";
import { useClassroom } from "@/contexts/ClassroomContext";
import { useMessages } from "@/contexts/MessageContext";

export default function AdminPage() {
  const { user, users, teacherCode, setTeacherCode } = useAuth();
  const { classes } = useClassroom();
  const { sendMessage } = useMessages();
  const router = useRouter();

  const [newCode, setNewCode] = useState("");
  const [codeSaved, setCodeSaved] = useState(false);
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

  const handleSaveCode = () => {
    if (!newCode.trim()) return;
    setTeacherCode(newCode.trim());
    setNewCode("");
    setCodeSaved(true);
    setTimeout(() => setCodeSaved(false), 3000);
  };

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

        {/* Teacher registration code */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <h2 className="text-sm font-semibold">Teacher Registration Code</h2>
          <p className="text-xs text-muted-foreground">
            Teachers and admins must enter this code when signing up.
          </p>
          <div className="flex items-center gap-2 bg-muted rounded-xl px-4 py-3">
            <span className="font-mono font-bold text-primary flex-1 tracking-wider">{teacherCode}</span>
            <button
              onClick={() => navigator.clipboard?.writeText(teacherCode)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="Copy to clipboard"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
            </button>
          </div>
          <div className="flex gap-2">
            <input
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              placeholder="Enter new code…"
              className="flex-1 bg-muted border border-border rounded-xl px-3 py-2.5 text-sm"
            />
            <button
              onClick={handleSaveCode}
              disabled={!newCode.trim()}
              className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium disabled:opacity-40"
            >
              Update
            </button>
          </div>
          {codeSaved && <p className="text-primary text-xs">Code updated successfully.</p>}
        </div>

        {/* Teachers list */}
        <div className="bg-card border border-border rounded-xl p-4">
          <h2 className="text-sm font-semibold mb-3">Teachers</h2>
          {teachers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No teachers registered yet.</p>
          ) : (
            <div className="space-y-2">
              {teachers.map((t) => {
                const tc = classes.filter((c) => c.teacherId === t.id);
                return (
                  <div key={t.id} className="flex items-center gap-3 p-3 border border-border rounded-xl">
                    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
                      {t.name[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{t.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{t.email} · {tc.length} class(es)</p>
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
            {(["user", "class"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setMsgType(t)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium capitalize transition-colors ${msgType === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
              >
                {t}
              </button>
            ))}
          </div>
          <select
            value={msgRecipient}
            onChange={(e) => setMsgRecipient(e.target.value)}
            className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm"
          >
            <option value="">Select recipient…</option>
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
            placeholder="Message content…"
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
