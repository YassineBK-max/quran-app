export interface SurahInfo {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: "Meccan" | "Medinan";
}

export interface Surah extends SurahInfo {
  ayahs: Ayah[];
  edition: Edition;
}

export interface Ayah {
  number: number;
  text: string;
  numberInSurah: number;
  juz: number;
  page: number;
  hizbQuarter: number;
  sajda: boolean | { id: number; recommended: boolean; obligatory: boolean };
  audio?: string;
}

export interface Edition {
  identifier: string;
  language: string;
  name: string;
  englishName: string;
  format: "text" | "audio";
  type: "quran" | "translation" | "versebyverse";
  direction: "rtl" | "ltr";
}

export interface SearchMatch {
  number: number;
  text: string;
  edition: Edition;
  surah: SurahInfo;
  numberInSurah: number;
}

export type BookmarkColor = "red" | "blue" | "green" | "yellow" | "purple";

export interface Bookmark {
  ayahNumber: number;
  surahNumber: number;
  numberInSurah: number;
  surahName: string;
  color: BookmarkColor;
  timestamp: number;
}

export type DisplayMode = "mushaf" | "ayah-per-line";
export type ThemeMode = "light" | "dark" | "system";
export type ColorTheme = "classic" | "futuristic" | "glass" | "simple" | "8bit";

export interface AppSettings {
  theme: ThemeMode;
  reciterEdition: string;
  translationEdition: string;
  language: "en" | "ar";
  tapToTranslate: boolean;
  displayMode: DisplayMode;
  colorTheme: ColorTheme;
}

// --- Auth ---
export type UserRole = "admin" | "teacher" | "student" | "parent";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  classId?: string;       // student: class they belong to
  createdAt: number;
  parentCode?: string;    // student only: 8-char code parents use to link
  parentIds?: string[];   // student only: IDs of linked parent accounts (max 2)
  linkedChildId?: string; // parent only: student ID they are linked to
  displayName?: string;   // optional display name override
  profilePhoto?: string;  // base64-encoded photo
}

// --- Classroom ---
export interface Assignment {
  id: string;
  classId: string;
  title: string;
  description?: string;
  dueDate?: string;    // YYYY-MM-DD
  createdAt: number;
}

export interface ClassRoom {
  id: string;
  name: string;
  code: string;        // 6-char join code for students
  teacherId: string;
  teacherName: string;
  studentIds: string[];
  assignments: Assignment[];
  createdAt: number;
}

// --- Calendar ---
export interface CalendarEvent {
  id: string;
  classId: string;
  title: string;
  type: "session" | "deadline" | "goal" | "meeting";
  date: string;        // YYYY-MM-DD
  time?: string;       // HH:MM (legacy)
  startTime?: string;  // HH:MM
  endTime?: string;    // HH:MM
  notes?: string;      // session notes / recap
  description?: string;
  createdAt: number;
}

// --- Messaging ---
export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  recipientId: string;         // userId | classId | "all"
  recipientType: "user" | "class" | "all" | "parents";
  content: string;
  allowReply: boolean;
  replyToId?: string;
  createdAt: number;
  readBy: string[];
}

// --- Notifications ---
export interface AppNotification {
  id: string;
  userId: string;
  type: "deadline" | "message" | "award" | "event";
  title: string;
  body: string;
  read: boolean;
  createdAt: number;
  link?: string;
}

// --- Awards ---
export type AwardType =
  | "first_page"
  | "first_surah"
  | "hizb_quarter"
  | "hizb_half"
  | "hizb_three_quarters"
  | "hizb_complete"
  | "quran_complete";

export interface Award {
  id: string;
  type: AwardType;
  message: string;
  earnedAt: number;
}

// --- Memorization ---
export interface MemorizedAyah {
  ns: number;   // numberInSurah
  hq: number;   // hizbQuarter (1-240)
  pg: number;   // page (1-604)
}
