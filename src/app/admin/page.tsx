"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/contexts/AuthContext";
import { useClassroom } from "@/contexts/ClassroomContext";
import { useMessages } from "@/contexts/MessageContext";

type Tab = "overview" | "users" | "classes" | "messages";

const ROLE_COLORS: Record<string, string> = {
  admin:   "bg-red-500/10 text-red-600 border-red-500/20",
  teacher: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  student: "bg-primary/10 text-primary border-primary/20",
};

export default function AdminPage() {
  const { user, users, teacherCode, setTeacherCode } = useAuth();
  const { classes } = useClassroom();
  const { sendMessage } = useMessages();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>("overview");
  const [newCode, setNewCode] = useState("");
  const [codeSaved, setCodeSaved] = useState(false);
  const [msgContent, setMsgContent] = useState("");
  const [msgRecipient, setMsgRecipient] = useState("");
  const [msgType, setMsgType] = useState<"user" | "class">("user");
  const [sent, setSent] = useState(false);
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "teacher" | "student">("all");

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
  const admins   = users.filter((u) => u.role === "admin");

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

  const filteredUsers = roleFilter === "all" ? users : users.filter((u) => u.role === roleFilter);

  const getClassInfoForUser = (uid: string, role: string) => {
    if (role === "student") {
      const cls = classes.find((c) => c.studentIds.includes(uid));
      return cls ? cls.name : null;
    }
    if (role === "teacher") {
      const cls = classes.filter((c) => c.teacherId === uid);
      return cls.length > 0 ? cls.map((c) => c.name).join(", ") : null;
    }
    return null;
  };

  const TABS: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "users",    label: "Users" },
    { id: "classes",  label: "Classes" },
    { id: "messages", label: "Messages" },
  ];

  return (
    <>
      <Header title="Admin Panel" />
      <main className="max-w-3xl mx-auto px-4 py-4 space-y-4">
        {/* Tab bar */}
        <div className="grid grid-cols-4 gap-1 bg-muted rounded-xl p-1">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`py-2 rounded-lg text-xs font-medium transition-colors ${
                tab === id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Overview ── */}
        {tab === "overview" && (
          <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "Admins",   count: admins.length },
                { label: "Teachers", count: teachers.length },
                { label: "Students", count: students.length },
                { label: "Classes",  count: classes.length },
              ].map((s) => (
                <div key={s.label} className="bg-card border border-border rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-primary">{s.count}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Teacher registration code */}
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <div>
                <h2 className="text-sm font-semibold">Teacher Registration Code</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Teachers must enter this code when creating an account.
                </p>
              </div>
              <div className="flex items-center gap-2 bg-muted rounded-xl px-4 py-3">
                <span className="font-mono font-bold text-primary flex-1 tracking-wider text-sm">{teacherCode}</span>
                <button
                  onClick={() => navigator.clipboard?.writeText(teacherCode)}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1"
                  title="Copy"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                  </svg>
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  placeholder="New code…"
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
          </div>
        )}

        {/* ── Users Database ── */}
        {tab === "users" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground flex-1">{filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""}</p>
              <div className="flex gap-1">
                {(["all", "admin", "teacher", "student"] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRoleFilter(r)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                      roleFilter === r ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              {filteredUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No users found.</p>
              ) : (
                filteredUsers.map((u) => {
                  const classInfo = getClassInfoForUser(u.id, u.role);
                  return (
                    <div key={u.id} className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl">
                      <div
                        className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-sm font-bold ${
                          u.role === "admin" ? "bg-red-500/10 text-red-600" :
                          u.role === "teacher" ? "bg-blue-500/10 text-blue-600" :
                          "bg-primary/10 text-primary"
                        }`}
                      >
                        {u.name[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium">{u.name}</p>
                          <span className={`text-[10px] border px-1.5 py-0.5 rounded capitalize font-medium ${ROLE_COLORS[u.role]}`}>
                            {u.role}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                        {classInfo && (
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {u.role === "student" ? "Class: " : "Teaching: "}{classInfo}
                          </p>
                        )}
                        {!classInfo && u.role !== "admin" && (
                          <p className="text-[10px] text-muted-foreground/50 mt-0.5">
                            {u.role === "student" ? "No class" : "No classes"}
                          </p>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground shrink-0">
                        {new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", year: "2-digit" })}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ── Classes ── */}
        {tab === "classes" && (
          <div className="space-y-2">
            {classes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No classes yet.</p>
            ) : (
              classes.map((c) => (
                <div key={c.id} className="p-4 bg-card border border-border rounded-xl">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold">{c.name}</p>
                    <span className="font-mono text-xs text-primary bg-primary/10 px-2 py-0.5 rounded">{c.code}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Teacher: {c.teacherName}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-muted-foreground">{c.studentIds.length} student{c.studentIds.length !== 1 ? "s" : ""}</span>
                    <span className="text-xs text-muted-foreground">{c.assignments.length} assignment{c.assignments.length !== 1 ? "s" : ""}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── Messages ── */}
        {tab === "messages" && (
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
        )}
      </main>
    </>
  );
}
