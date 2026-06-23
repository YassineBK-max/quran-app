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

export interface AppSettings {
  theme: ThemeMode;
  reciterEdition: string;
  translationEdition: string;
  language: "en" | "ar";
  tapToTranslate: boolean;
  displayMode: DisplayMode;
}
