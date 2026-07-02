"use client";
import { createContext, useContext, ReactNode, useCallback, useMemo } from "react";
import { Message } from "@/lib/types";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useAuth, getLinkedChildIds } from "./AuthContext";
import { useClassroom } from "./ClassroomContext";

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

interface MessageContextType {
  messages: Message[];
  sendMessage: (recipientId: string, recipientType: Message["recipientType"], content: string, allowReply?: boolean, replyToId?: string) => void;
  markRead: (messageId: string) => void;
  getInbox: () => Message[];
  getSent: () => Message[];
  getThread: (messageId: string) => Message[];
  unreadCount: number;
}

const MessageCtx = createContext<MessageContextType>({
  messages: [],
  sendMessage: () => {},
  markRead: () => {},
  getInbox: () => [],
  getSent: () => [],
  getThread: () => [],
  unreadCount: 0,
});

export function MessageProvider({ children }: { children: ReactNode }) {
  const { user, users } = useAuth();
  const { myClass, getTeacherClasses, classes } = useClassroom();
  const [messages, setMessages] = useLocalStorage<Message[]>("quran-messages", []);

  const userClassIds = useMemo(() => {
    if (!user) return [];
    if (user.role === "teacher") return getTeacherClasses().map((c) => c.id);
    if (user.role === "student" && myClass) return [myClass.id];
    if (user.role === "admin") return classes.map((c) => c.id);
    // Parent: collect class IDs from all linked children
    if (user.role === "parent") {
      const childIds = getLinkedChildIds(user);
      const classIds = childIds
        .map((cid) => users.find((u) => u.id === cid)?.classId)
        .filter((id): id is string => !!id);
      if (classIds.length > 0) return classIds.filter((id, i) => classIds.indexOf(id) === i);
    }
    return [];
  }, [user, users, getTeacherClasses, myClass, classes]);

  const sendMessage = useCallback(
    (recipientId: string, recipientType: Message["recipientType"], content: string, allowReply = true, replyToId?: string) => {
      if (!user) return;
      const msg: Message = {
        id: genId(),
        senderId: user.id,
        senderName: user.name,
        recipientId,
        recipientType,
        content,
        allowReply,
        replyToId,
        createdAt: Date.now(),
        readBy: [user.id],
      };
      setMessages((prev) => [...prev, msg]);
    },
    [user, setMessages]
  );

  const markRead = useCallback(
    (messageId: string) => {
      if (!user) return;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId && !m.readBy.includes(user.id)
            ? { ...m, readBy: [...m.readBy, user.id] }
            : m
        )
      );
    },
    [user, setMessages]
  );

  const getInbox = useCallback((): Message[] => {
    if (!user) return [];

    // For parents: also check child's direct messages
    const childId = user.role === "parent" ? user.linkedChildId : undefined;
    const childClassId = childId ? users.find((u) => u.id === childId)?.classId : undefined;

    return messages
      .filter((m) => {
        if (m.senderId === user.id) return false; // never show your own sends in inbox
        if (m.recipientType === "user" && m.recipientId === user.id) return true;
        if (m.recipientType === "class" && userClassIds.includes(m.recipientId)) return true;
        if (m.recipientType === "all") return true;
        // Parent: see messages sent to their child
        if (childId) {
          if (m.recipientType === "user" && m.recipientId === childId) return true;
          if (m.recipientType === "parents" && childClassId && m.recipientId === childClassId) return true;
        }
        // Student/Teacher: see "parents" messages only if in that class (teachers get them for their own records)
        if (m.recipientType === "parents" && userClassIds.includes(m.recipientId)) {
          if (user.role === "teacher" || user.role === "admin") return true;
        }
        return false;
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [user, users, messages, userClassIds]);

  const getSent = useCallback((): Message[] => {
    if (!user) return [];
    return messages
      .filter((m) => m.senderId === user.id && !m.replyToId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [user, messages]);

  const getThread = useCallback(
    (messageId: string): Message[] =>
      messages.filter((m) => m.id === messageId || m.replyToId === messageId),
    [messages]
  );

  const unreadCount = useMemo(() => {
    if (!user) return 0;
    const childId = user.role === "parent" ? user.linkedChildId : undefined;
    const childClassId = childId ? users.find((u) => u.id === childId)?.classId : undefined;

    return messages.filter((m) => {
      if (m.senderId === user.id) return false;
      const isForMe =
        (m.recipientType === "user" && m.recipientId === user.id) ||
        (m.recipientType === "class" && userClassIds.includes(m.recipientId)) ||
        (m.recipientType === "all") ||
        (childId && m.recipientType === "user" && m.recipientId === childId) ||
        (childId && childClassId && m.recipientType === "parents" && m.recipientId === childClassId);
      return isForMe && !m.readBy.includes(user.id);
    }).length;
  }, [user, users, messages, userClassIds]);

  return (
    <MessageCtx.Provider value={{ messages, sendMessage, markRead, getInbox, getSent, getThread, unreadCount }}>
      {children}
    </MessageCtx.Provider>
  );
}

export const useMessages = () => useContext(MessageCtx);
