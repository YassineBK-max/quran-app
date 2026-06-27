"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/contexts/AuthContext";
import { useClassroom } from "@/contexts/ClassroomContext";
import { useMemorization } from "@/contexts/MemorizationContext";
import { useT } from "@/hooks/useT";

export default function ClassroomPage() {
  const { user, users } = useAuth();
  const { myClass, createClass, joinClass, getTeacherClasses, addAssignment, removeAssignment } = useClassroom();
  const { setStudentId } = useMemorization();
  const t = useT();
  const router = useRouter();

  const [newClassName, setNewClassName] = useState("");
  const [classCode, setClassCode] = useState("");
  const [newAssignmentTitle, setNewAssignmentTitle] = useState("");
  const [newAssignmentDesc, setNewAssignmentDesc] = useState("");
  const [newAssignmentDue, setNewAssignmentDue] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  if (!user) {
    return (
      <>
        <Header title={t.classroom_title} />
        <main className="max-w-3xl mx-auto px-4 py-8 text-center">
          <p className="text-muted-foreground mb-4">{t.classroom_signin_required}</p>
          <button onClick={() => router.push("/login")} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl">{t.signin}</button>
        </main>
      </>
    );
  }

  // ── STUDENT VIEW ─────────────────────────────────────────────
  if (user.role === "student") {
    return (
      <>
        <Header title={t.classroom_title} />
        <main className="max-w-3xl mx-auto px-4 py-4 space-y-4">
          {myClass ? (
            <>
              <div className="bg-card border border-border rounded-xl p-4">
                <p className="text-xs text-muted-foreground">{t.classroom_your_class}</p>
                <h2 className="text-xl font-bold mt-0.5">{myClass.name}</h2>
                <p className="text-sm text-muted-foreground">{t.classroom_teacher} {myClass.teacherName}</p>
                <p className="text-xs text-muted-foreground mt-1">{t.classroom_code} <span className="font-mono font-bold tracking-widest text-primary">{myClass.code}</span></p>
              </div>

              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="text-sm font-semibold mb-3">{t.classroom_classmates} ({myClass.studentIds.length})</h3>
                <div className="space-y-2">
                  {myClass.studentIds.map((sid) => {
                    const student = users.find((u) => u.id === sid);
                    return (
                      <div key={sid} className="flex items-center gap-2 text-sm">
                        <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                          {(student?.name ?? "?")[0].toUpperCase()}
                        </div>
                        <span>{student?.name ?? t.unknown}</span>
                        {sid === user.id && <span className="text-xs text-muted-foreground">{t.you}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="text-sm font-semibold mb-3">{t.classroom_assignments} ({myClass.assignments.length})</h3>
                {myClass.assignments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t.classroom_no_assignments}</p>
                ) : (
                  <div className="space-y-2">
                    {myClass.assignments.map((a) => (
                      <div key={a.id} className="border border-border rounded-lg p-3">
                        <p className="text-sm font-medium">{a.title}</p>
                        {a.description && <p className="text-xs text-muted-foreground mt-0.5">{a.description}</p>}
                        {a.dueDate && <p className="text-xs text-primary mt-1">{t.due} {a.dueDate}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <h2 className="text-sm font-semibold">{t.classroom_join_class}</h2>
              <p className="text-xs text-muted-foreground">{t.classroom_join_hint}</p>
              <input
                value={classCode}
                onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                placeholder="ABC123"
                maxLength={6}
                className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm font-mono tracking-widest uppercase"
              />
              {error && <p className="text-red-500 text-xs">{error}</p>}
              {success && <p className="text-primary text-xs">{success}</p>}
              <button
                onClick={() => {
                  setError(""); setSuccess("");
                  const err = joinClass(classCode);
                  if (err) setError(err);
                  else setSuccess(t.classroom_join_success);
                }}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold"
              >
                {t.classroom_join_btn}
              </button>
            </div>
          )}
        </main>
      </>
    );
  }

  // ── TEACHER VIEW ─────────────────────────────────────────────
  const teacherClasses = getTeacherClasses();
  const activeClass = selectedClassId ? teacherClasses.find((c) => c.id === selectedClassId) : teacherClasses[0];

  return (
    <>
      <Header title={t.classroom_title} />
      <main className="max-w-3xl mx-auto px-4 py-4 space-y-4">
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <h2 className="text-sm font-semibold">{t.classroom_create_class}</h2>
          <div className="flex gap-2">
            <input
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              placeholder={t.classroom_class_name}
              className="flex-1 bg-muted border border-border rounded-xl px-3 py-2.5 text-sm"
            />
            <button
              onClick={() => {
                if (!newClassName.trim()) return;
                createClass(newClassName.trim());
                setNewClassName("");
                setSuccess("Class created!");
              }}
              className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium"
            >
              {t.classroom_create_btn}
            </button>
          </div>
          {success && <p className="text-primary text-xs">{success}</p>}
        </div>

        {teacherClasses.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-8">{t.classroom_no_classes}</p>
        ) : (
          <>
            {teacherClasses.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {teacherClasses.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedClassId(c.id)}
                    className={`px-3 py-1.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                      (activeClass?.id ?? teacherClasses[0].id) === c.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}

            {activeClass && (
              <>
                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-bold text-lg">{activeClass.name}</h2>
                      <p className="text-xs text-muted-foreground">{activeClass.studentIds.length} {t.admin_students_label}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{t.classroom_join_code}</p>
                      <p className="font-mono font-bold text-xl tracking-widest text-primary">{activeClass.code}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-4">
                  <h3 className="text-sm font-semibold mb-3">{t.classroom_students}</h3>
                  {activeClass.studentIds.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t.classroom_no_students}</p>
                  ) : (
                    <div className="space-y-2">
                      {activeClass.studentIds.map((sid) => {
                        const student = users.find((u) => u.id === sid);
                        return (
                          <button
                            key={sid}
                            onClick={() => {
                              setStudentId(sid);
                              router.push("/surahs");
                            }}
                            className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/30 hover:bg-primary/5 transition-colors text-left"
                          >
                            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
                              {(student?.name ?? "?")[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{student?.name ?? t.unknown}</p>
                              <p className="text-xs text-muted-foreground">{t.classroom_view_progress}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                  <h3 className="text-sm font-semibold">{t.classroom_assignments}</h3>
                  <div className="space-y-2">
                    <input
                      value={newAssignmentTitle}
                      onChange={(e) => setNewAssignmentTitle(e.target.value)}
                      placeholder={t.classroom_assignment_title}
                      className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-sm"
                    />
                    <input
                      value={newAssignmentDesc}
                      onChange={(e) => setNewAssignmentDesc(e.target.value)}
                      placeholder={t.classroom_assignment_desc}
                      className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-sm"
                    />
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={newAssignmentDue}
                        onChange={(e) => setNewAssignmentDue(e.target.value)}
                        className="flex-1 bg-muted border border-border rounded-xl px-3 py-2 text-sm"
                      />
                      <button
                        onClick={() => {
                          if (!newAssignmentTitle.trim()) return;
                          addAssignment(activeClass.id, newAssignmentTitle.trim(), newAssignmentDesc || undefined, newAssignmentDue || undefined);
                          setNewAssignmentTitle(""); setNewAssignmentDesc(""); setNewAssignmentDue("");
                        }}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium"
                      >
                        {t.add}
                      </button>
                    </div>
                  </div>
                  {activeClass.assignments.map((a) => (
                    <div key={a.id} className="flex items-start gap-2 border border-border rounded-lg p-3">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{a.title}</p>
                        {a.description && <p className="text-xs text-muted-foreground">{a.description}</p>}
                        {a.dueDate && <p className="text-xs text-primary">{t.due} {a.dueDate}</p>}
                      </div>
                      <button
                        onClick={() => removeAssignment(activeClass.id, a.id)}
                        className="text-muted-foreground hover:text-red-500 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
        {error && <p className="text-red-500 text-xs">{error}</p>}
      </main>
    </>
  );
}
