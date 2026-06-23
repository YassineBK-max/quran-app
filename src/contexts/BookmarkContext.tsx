"use client";
import { createContext, useContext, ReactNode, useCallback } from "react";
import { Bookmark, BookmarkColor } from "@/lib/types";
import { useLocalStorage } from "@/hooks/useLocalStorage";

interface BookmarkContextType {
  bookmarks: Bookmark[];
  addBookmark: (ayahNumber: number, surahNumber: number, numberInSurah: number, surahName: string, color: BookmarkColor) => void;
  removeBookmark: (ayahNumber: number) => void;
  updateBookmarkColor: (ayahNumber: number, color: BookmarkColor) => void;
  getBookmark: (ayahNumber: number) => Bookmark | undefined;
  isBookmarked: (ayahNumber: number) => boolean;
}

const BookmarkContext = createContext<BookmarkContextType>({
  bookmarks: [],
  addBookmark: () => {},
  removeBookmark: () => {},
  updateBookmarkColor: () => {},
  getBookmark: () => undefined,
  isBookmarked: () => false,
});

export function BookmarkProvider({ children }: { children: ReactNode }) {
  const [bookmarks, setBookmarks] = useLocalStorage<Bookmark[]>("quran-app-bookmarks", []);

  const addBookmark = useCallback((ayahNumber: number, surahNumber: number, numberInSurah: number, surahName: string, color: BookmarkColor) => {
    setBookmarks((prev) => {
      const filtered = prev.filter((b) => b.ayahNumber !== ayahNumber);
      return [...filtered, { ayahNumber, surahNumber, numberInSurah, surahName, color, timestamp: Date.now() }];
    });
  }, [setBookmarks]);

  const removeBookmark = useCallback((ayahNumber: number) => {
    setBookmarks((prev) => prev.filter((b) => b.ayahNumber !== ayahNumber));
  }, [setBookmarks]);

  const updateBookmarkColor = useCallback((ayahNumber: number, color: BookmarkColor) => {
    setBookmarks((prev) => prev.map((b) => (b.ayahNumber === ayahNumber ? { ...b, color } : b)));
  }, [setBookmarks]);

  const getBookmark = useCallback((ayahNumber: number) => bookmarks.find((b) => b.ayahNumber === ayahNumber), [bookmarks]);

  const isBookmarked = useCallback((ayahNumber: number) => bookmarks.some((b) => b.ayahNumber === ayahNumber), [bookmarks]);

  return (
    <BookmarkContext.Provider value={{ bookmarks, addBookmark, removeBookmark, updateBookmarkColor, getBookmark, isBookmarked }}>
      {children}
    </BookmarkContext.Provider>
  );
}

export const useBookmarks = () => useContext(BookmarkContext);
