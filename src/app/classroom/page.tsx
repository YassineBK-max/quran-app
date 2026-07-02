"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/contexts/AuthContext";
import { useClassroom } from "@/contexts/ClassroomContext";
import { useMemorization } from "@/contexts/MemorizationContext";
import { useT } from "@/hooks/useT";
import { Assignment } from "@/lib/types";

// ─── Assignment card with inline edit ─────────────────────────────────────────
function AssignmentCard({
  assignment,
  classId,
  canEdit,
  t,
  onUpdate,
  onDelete,
}: {
  assignment: Assignment;
  classId: string;
  canEdit: boolean;
  t: Record<string, string>;
  onUpdate: (classId: string, id: string, patch: { title?: string; description?: string; dueDate?: string }) => void;
  onDelete: (classId: string, id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(assignment.title);
  const [desc, setDesc] = useState(assignment.description ?? "");
  const [due, setDue] = useState(assignment.dueDate ?? "");

  const handleSave = () => {
    if (!title.trim()) return;
    onUpdate(classId, assignment.id, { title: title.trim(), description: desc || undefined, dueDate: due || undefined });
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="border border-primary/30 bg-primary/5 rounded-xl p-3 space-y-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:border-primary"
          autoFocus
        />
        <input
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder={t.classroom_assignment_desc}
          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none"
        />
        <input
          type="date"
          value={due}
          onChange={(e) => setDue(e.target.value)}
          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none"
        />
        <div className="flex gap-2">
          <button onClick={() => setEditing(false)} className="flex-1 py-2 rounded-lg bg-muted text-muted-foreground text-xs font-medium min-h-[44px]">
            {t.assignment_cancel}
          </button>
          <button onClick={handleSave} className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold min-h-[44px]">
            {t.assignment_save}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 border border-border rounded-xl p-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{assignment.title}</p>
        {assignment.description && <p className="text-xs text-muted-foreground mt-0.5">{assignment.description}</p>}
        {assignment.dueDate && (
          <p className="text-xs text-primary mt-1 font-medium">
            📅 {t.due} {new Date(assignment.dueDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </p>
        )}
      </div>
      {canEdit && (
        <div className="flex gap-1 shrink-0">
          <button
            onClick={() => setEditing(true)}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
            title={t.assignment_edit}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button
            onClick={() => onDelete(classId, assignment.id)}
            className="p-2 rounded-lg text-muted-foreground hover:text-red-500 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function ClassroomPage() {
  const { user, users } = useAuth();
  const { myClass, createClass, joinClass, getTeacherClasses, removeAssignment, updateAssignment } = useClassroom();
  const { setStudentId } = useMemorization();
  const t = useT();
  const router = useRouter();

  const [newClassName, setNewClassName] = useState("");
  const [classCode, setClassCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [parentsMenu, setParentsMenu] = useState<string | null>(null);

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
                <p className="text-xs text-muted-foreground mt-1">
                  {t.classroom_code} <span className="font-mono font-bold tracking-widest text-primary">{myClass.code}</span>
                </p>
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

              {myClass.assignments.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-4">
                  <h3 className="text-sm font-semibold mb-3">{t.classroom_assignments} ({myClass.assignments.length})</h3>
                  <div className="space-y-2">
                    {myClass.assignments.map((a) => (
                      <div key={a.id} className="border border-border rounded-lg p-3">
                        <p className="text-sm font-medium">{a.title}</p>
                        {a.description && <p className="text-xs text-muted-foreground mt-0.5">{a.description}</p>}
                        {a.dueDate && <p className="text-xs text-primary mt-1">{t.due} {a.dueDate}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold min-h-[48px]"
              >
                {t.classroom_join_btn}
              </button>
            </div>
          )}
        </main>
      </>
    );
  }

  // ── TEACHER / ADMIN VIEW ──────────────────────────────────────
  const teacherClasses = getTeacherClasses();
  const activeClass = selectedClassId ? teacherClasses.find((c) => c.id === selectedClassId) : teacherClasses[0];

  return (
    <>
      <Header title={t.classroom_title} />
      <main className="max-w-3xl mx-auto px-4 py-4 space-y-4">
        {/* Create class */}
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
                setTimeout(() => setSuccess(""), 2500);
              }}
              className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium min-h-[44px]"
            >
              {t.classroom_create_btn}
            </button>
          </div>
          {success && <p className="text-primary text-xs">{success}</p>}
        </div>

        {teacherClasses.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            <p className="text-3xl mb-3">🏫</p>
            <p>{t.classroom_no_classes}</p>
          </div>
        ) : (
          <>
            {teacherClasses.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                {teacherClasses.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedClassId(c.id)}
                    className={`px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors min-h-[44px] ${
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
                {/* Class header */}
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

                {/* Students */}
                <div className="bg-card border border-border rounded-xl p-4">
                  <h3 className="text-sm font-semibold mb-3">{t.classroom_students}</h3>
                  {activeClass.studentIds.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t.classroom_no_students}</p>
                  ) : (
                    <div className="space-y-2">
                      {activeClass.studentIds.map((sid) => {
                        const student = users.find((u) => u.id === sid);
                        const studentParents = users.filter(
                          (u) => u.role === "parent" && (u.linkedChildIds?.includes(sid) || u.linkedChildId === sid)
                        );
                        const isMenuOpen = parentsMenu === sid;
                        return (
                          <div key={sid} className="relative">
                            <div className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/30 hover:bg-primary/5 transition-colors">
                              <button
                                onClick={() => { setStudentId(sid); router.push("/surahs"); }}
                                className="flex items-center gap-3 flex-1 text-left min-h-[44px]"
                              >
                                <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
                                  {(student?.name ?? "?")[0].toUpperCase()}
                                </div>
                                <div>
                                  <p className="text-sm font-medium">{student?.name ?? t.unknown}</p>
                                  <p className="text-xs text-muted-foreground">{t.classroom_view_progress}</p>
                                </div>
                              </button>
                              <button
                                onClick={() => setParentsMenu(isMenuOpen ? null : sid)}
                                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0 min-w-[36px] min-h-[36px] flex items-center justify-center"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                  <circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/>
                                </svg>
                              </button>
                            </div>
                            {isMenuOpen && (
                              <div className="absolute right-0 top-full z-10 mt-1 min-w-56 bg-card border border-border rounded-xl shadow-lg p-3">
                                <p className="text-xs font-semibold text-muted-foreground mb-2">{t.classroom_parents}</p>
                                {studentParents.length === 0 ? (
                                  <p className="text-xs text-muted-foreground">{t.classroom_no_parents}</p>
                                ) : (
                                  <div className="space-y-1.5">
                                    {studentParents.map((p) => (
                                      <div key={p.id} className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center text-xs font-semibold">
                                          {p.name[0].toUpperCase()}
                                        </div>
                                        <div>
                                          <p className="text-xs font-medium">{p.name}</p>
                                          <p className="text-[10px] text-muted-foreground">{p.email}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {student?.parentCode && (
                                  <div className="mt-2 pt-2 border-t border-border">
                                    <p className="text-[10px] text-muted-foreground">
                                      {t.classroom_parent_code}: <span className="font-mono font-bold text-primary">{student.parentCode}</span>
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Assignments — list only, creation moved to Calendar */}
                <div className="bg-card border border-border rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-semibold">{t.classroom_assignments}</h3>
                    <button
                      onClick={() => router.push("/calendar")}
                      className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
                    >
                      + {t.calendar_add_event}
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
                    </button>
                  </div>

                  {activeClass.assignments.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground text-sm">
                      <p className="text-2xl mb-2">📝</p>
                      <p>{t.classroom_no_assignments}</p>
                      <button onClick={() => router.push("/calendar")} className="mt-2 text-primary text-xs font-medium hover:underline">
                        {t.calendar_add_event} →
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {activeClass.assignments.map((a) => (
                        <AssignmentCard
                          key={a.id}
                          assignment={a}
                          classId={activeClass.id}
                          canEdit
                          t={t as Record<string, string>}
                          onUpdate={updateAssignment}
                          onDelete={removeAssignment}
                        />
                      ))}
                    </div>
                  )}
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
