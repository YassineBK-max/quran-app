"use client";
import { createContext, useContext, ReactNode, useCallback, useMemo } from "react";
import { Message } from "@/lib/types";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useAuth } from "./AuthContext";
import { useClassroom } from "./ClassroomContext";

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

interface MessageContextType {
  messages: Message[];
  sendMessage: (recipientId: string, recipientType: "user" | "class", content: string, allowReply?: boolean, replyToId?: string) => void;
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
  const { user } = useAuth();
  const { myClass, getTeacherClasses, classes } = useClassroom();
  const [messages, setMessages] = useLocalStorage<Message[]>("quran-messages", []);

  const userClassIds = useMemo(() => {
    if (!user) return [];
    if (user.role === "teacher") return getTeacherClasses().map((c) => c.id);
    if (user.role === "student" && myClass) return [myClass.id];
    if (user.role === "admin") return classes.map((c) => c.id);
    return [];
  }, [user, getTeacherClasses, myClass, classes]);

  const sendMessage = useCallback(
    (recipientId: string, recipientType: "user" | "class", content: string, allowReply = true, replyToId?: string) => {
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
    return messages
      .filter((m) => {
        if (m.recipientType === "user") return m.recipientId === user.id;
        if (m.recipientType === "class") return userClassIds.includes(m.recipientId);
        return false;
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [user, messages, userClassIds]);

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

  const unreadCount = useMemo(
    () =>
      user
        ? messages.filter((m) => {
            const isForMe =
              (m.recipientType === "user" && m.recipientId === user.id) ||
              (m.recipientType === "class" && userClassIds.includes(m.recipientId));
            return isForMe && !m.readBy.includes(user.id);
          }).length
        : 0,
    [user, messages, userClassIds]
  );

  return (
    <MessageCtx.Provider value={{ messages, sendMessage, markRead, getInbox, getSent, getThread, unreadCount }}>
      {children}
    </MessageCtx.Provider>
  );
}

export const useMessages = () => useContext(MessageCtx);
