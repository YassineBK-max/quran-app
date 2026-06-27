"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/contexts/AuthContext";
import { useClassroom } from "@/contexts/ClassroomContext";
import { useMemorization } from "@/contexts/MemorizationContext";

export default function ClassroomPage() {
  const { user, users } = useAuth();
  const { myClass, createClass, joinClass, getTeacherClasses, addAssignment, removeAssignment } = useClassroom();
  const { setStudentId } = useMemorization();
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
        <Header title="Classroom" />
        <main className="max-w-3xl mx-auto px-4 py-8 text-center">
          <p className="text-muted-foreground mb-4">Sign in to access the classroom.</p>
          <button onClick={() => router.push("/login")} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl">Sign In</button>
        </main>
      </>
    );
  }

  // ── STUDENT VIEW ─────────────────────────────────────────────
  if (user.role === "student") {
    return (
      <>
        <Header title="Classroom" />
        <main className="max-w-3xl mx-auto px-4 py-4 space-y-4">
          {myClass ? (
            <>
              {/* Class info */}
              <div className="bg-card border border-border rounded-xl p-4">
                <p className="text-xs text-muted-foreground">Your Class</p>
                <h2 className="text-xl font-bold mt-0.5">{myClass.name}</h2>
                <p className="text-sm text-muted-foreground">Teacher: {myClass.teacherName}</p>
                <p className="text-xs text-muted-foreground mt-1">Code: <span className="font-mono font-bold tracking-widest text-primary">{myClass.code}</span></p>
              </div>

              {/* Classmates */}
              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="text-sm font-semibold mb-3">Classmates ({myClass.studentIds.length})</h3>
                <div className="space-y-2">
                  {myClass.studentIds.map((sid) => {
                    const student = users.find((u) => u.id === sid);
                    return (
                      <div key={sid} className="flex items-center gap-2 text-sm">
                        <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                          {(student?.name ?? "?")[0].toUpperCase()}
                        </div>
                        <span>{student?.name ?? "Unknown"}</span>
                        {sid === user.id && <span className="text-xs text-muted-foreground">(you)</span>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Assignments */}
              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="text-sm font-semibold mb-3">Assignments ({myClass.assignments.length})</h3>
                {myClass.assignments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No assignments yet.</p>
                ) : (
                  <div className="space-y-2">
                    {myClass.assignments.map((a) => (
                      <div key={a.id} className="border border-border rounded-lg p-3">
                        <p className="text-sm font-medium">{a.title}</p>
                        {a.description && <p className="text-xs text-muted-foreground mt-0.5">{a.description}</p>}
                        {a.dueDate && <p className="text-xs text-primary mt-1">Due: {a.dueDate}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <h2 className="text-sm font-semibold">Join a Class</h2>
              <p className="text-xs text-muted-foreground">Enter the 6-character code from your teacher.</p>
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
                  else setSuccess("Joined successfully!");
                }}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold"
              >
                Join Class
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
      <Header title="Classroom" />
      <main className="max-w-3xl mx-auto px-4 py-4 space-y-4">
        {/* Create class */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <h2 className="text-sm font-semibold">Create New Class</h2>
          <div className="flex gap-2">
            <input
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              placeholder="Class name"
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
              Create
            </button>
          </div>
          {success && <p className="text-primary text-xs">{success}</p>}
        </div>

        {teacherClasses.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-8">No classes yet. Create one above.</p>
        ) : (
          <>
            {/* Class selector */}
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
                {/* Class info */}
                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-bold text-lg">{activeClass.name}</h2>
                      <p className="text-xs text-muted-foreground">{activeClass.studentIds.length} student(s)</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Join Code</p>
                      <p className="font-mono font-bold text-xl tracking-widest text-primary">{activeClass.code}</p>
                    </div>
                  </div>
                </div>

                {/* Students + progress */}
                <div className="bg-card border border-border rounded-xl p-4">
                  <h3 className="text-sm font-semibold mb-3">Students</h3>
                  {activeClass.studentIds.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No students yet. Share the code above.</p>
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
                              <p className="text-sm font-medium">{student?.name ?? "Unknown"}</p>
                              <p className="text-xs text-muted-foreground">View &amp; mark progress →</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Assignments */}
                <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                  <h3 className="text-sm font-semibold">Assignments</h3>
                  <div className="space-y-2">
                    <input
                      value={newAssignmentTitle}
                      onChange={(e) => setNewAssignmentTitle(e.target.value)}
                      placeholder="Assignment title"
                      className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-sm"
                    />
                    <input
                      value={newAssignmentDesc}
                      onChange={(e) => setNewAssignmentDesc(e.target.value)}
                      placeholder="Description (optional)"
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
                        Add
                      </button>
                    </div>
                  </div>
                  {activeClass.assignments.map((a) => (
                    <div key={a.id} className="flex items-start gap-2 border border-border rounded-lg p-3">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{a.title}</p>
                        {a.description && <p className="text-xs text-muted-foreground">{a.description}</p>}
                        {a.dueDate && <p className="text-xs text-primary">Due: {a.dueDate}</p>}
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
