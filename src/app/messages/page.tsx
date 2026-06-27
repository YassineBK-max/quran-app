"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/contexts/AuthContext";
import { useMessages } from "@/contexts/MessageContext";
import { useClassroom } from "@/contexts/ClassroomContext";
import { Message } from "@/lib/types";

export default function MessagesPage() {
  const { user, users } = useAuth();
  const { getInbox, sendMessage, markRead, getThread } = useMessages();
  const { myClass, getTeacherClasses } = useClassroom();
  const router = useRouter();

  const [view, setView] = useState<"inbox" | "compose" | "thread">("inbox");
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [composeContent, setComposeContent] = useState("");
  const [composeRecipient, setComposeRecipient] = useState("");
  const [composeType, setComposeType] = useState<"user" | "class">("user");
  const [allowReply, setAllowReply] = useState(true);

  if (!user) {
    return (
      <>
        <Header title="Messages" />
        <main className="max-w-3xl mx-auto px-4 py-8 text-center">
          <p className="text-muted-foreground mb-4">Sign in to access messages.</p>
          <button onClick={() => router.push("/login")} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl">Sign In</button>
        </main>
      </>
    );
  }

  const inbox = getInbox();
  const teacherClasses = user.role === "teacher" || user.role === "admin" ? getTeacherClasses() : [];
  const myClassObj = myClass;

  const openThread = (msg: Message) => {
    markRead(msg.id);
    setSelectedMessage(msg);
    setView("thread");
  };

  const handleReply = () => {
    if (!replyContent.trim() || !selectedMessage) return;
    sendMessage(selectedMessage.senderId, "user", replyContent.trim(), false, selectedMessage.id);
    setReplyContent("");
  };

  const handleSend = () => {
    if (!composeContent.trim() || !composeRecipient) return;
    sendMessage(composeRecipient, composeType, composeContent.trim(), allowReply);
    setComposeContent(""); setComposeRecipient(""); setView("inbox");
  };

  const thread = selectedMessage ? getThread(selectedMessage.id) : [];

  // Potential recipients
  const recipientUsers = users.filter((u) => u.id !== user.id);
  const recipientClasses = [...teacherClasses, ...(myClassObj ? [myClassObj] : [])];

  return (
    <>
      <Header title="Messages" />
      <main className="max-w-3xl mx-auto px-4 py-4 space-y-4">
        {/* Tab bar */}
        <div className="flex gap-2">
          <button
            onClick={() => setView("inbox")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${view === "inbox" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
          >
            Inbox {inbox.filter((m) => !m.readBy.includes(user.id)).length > 0 && (
              <span className="ml-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {inbox.filter((m) => !m.readBy.includes(user.id)).length}
              </span>
            )}
          </button>
          <button
            onClick={() => setView("compose")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${view === "compose" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
          >
            + New Message
          </button>
        </div>

        {/* Inbox */}
        {view === "inbox" && (
          <div className="space-y-2">
            {inbox.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-12">No messages yet.</p>
            ) : (
              inbox.map((msg) => {
                const unread = !msg.readBy.includes(user.id);
                return (
                  <button
                    key={msg.id}
                    onClick={() => openThread(msg)}
                    className={`w-full text-left rounded-xl border p-4 transition-colors hover:border-primary/30 ${
                      unread ? "border-primary/50 bg-primary/5" : "border-border bg-card"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className={`text-sm ${unread ? "font-bold" : "font-medium"}`}>{msg.senderName}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(msg.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{msg.content}</p>
                    {msg.recipientType === "class" && (
                      <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded mt-1 inline-block">Class message</span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        )}

        {/* Thread view */}
        {view === "thread" && selectedMessage && (
          <div className="space-y-3">
            <button onClick={() => setView("inbox")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              Back to inbox
            </button>
            <div className="space-y-2">
              {thread.sort((a, b) => a.createdAt - b.createdAt).map((msg) => {
                const isMine = msg.senderId === user.id;
                return (
                  <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${isMine ? "bg-primary text-primary-foreground" : "bg-card border border-border"}`}>
                      {!isMine && <p className="text-[10px] font-semibold mb-1 text-muted-foreground">{msg.senderName}</p>}
                      <p className="text-sm">{msg.content}</p>
                      <p className={`text-[9px] mt-1 ${isMine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                        {new Date(msg.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            {selectedMessage.allowReply && (
              <div className="flex gap-2">
                <input
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Type a reply..."
                  onKeyDown={(e) => e.key === "Enter" && handleReply()}
                  className="flex-1 bg-muted border border-border rounded-xl px-3 py-2.5 text-sm"
                />
                <button
                  onClick={handleReply}
                  disabled={!replyContent.trim()}
                  className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium disabled:opacity-40"
                >
                  Send
                </button>
              </div>
            )}
          </div>
        )}

        {/* Compose */}
        {view === "compose" && (
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <h2 className="text-sm font-semibold">New Message</h2>

            {/* Recipient type */}
            <div className="flex gap-2">
              <button
                onClick={() => setComposeType("user")}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${composeType === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
              >
                Person
              </button>
              {recipientClasses.length > 0 && (
                <button
                  onClick={() => setComposeType("class")}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${composeType === "class" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                >
                  Class
                </button>
              )}
            </div>

            {/* Recipient */}
            <select
              value={composeRecipient}
              onChange={(e) => setComposeRecipient(e.target.value)}
              className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm"
            >
              <option value="">Select recipient...</option>
              {composeType === "user"
                ? recipientUsers.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)
                : recipientClasses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)
              }
            </select>

            <textarea
              value={composeContent}
              onChange={(e) => setComposeContent(e.target.value)}
              placeholder="Write your message..."
              rows={4}
              className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm resize-none"
            />

            <div className="flex items-center gap-2">
              <button
                onClick={() => setAllowReply(!allowReply)}
                className={`relative w-9 h-5 rounded-full transition-colors ${allowReply ? "bg-primary" : "bg-muted-foreground/30"}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${allowReply ? "translate-x-4" : "translate-x-0.5"}`} />
              </button>
              <span className="text-xs text-muted-foreground">Allow replies</span>
            </div>

            <button
              onClick={handleSend}
              disabled={!composeContent.trim() || !composeRecipient}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold disabled:opacity-40"
            >
              Send Message
            </button>
          </div>
        )}
      </main>
    </>
  );
}
