"use client";
import { useState, useRef, useEffect } from "react";
import { BookmarkColor } from "@/lib/types";
import { useBookmarks } from "@/contexts/BookmarkContext";
import { ColorPicker } from "./ColorPicker";
import { BOOKMARK_COLORS } from "@/lib/constants";

interface BookmarkButtonProps {
  ayahNumber: number;
  surahNumber: number;
  numberInSurah: number;
  surahName: string;
}

export function BookmarkButton({ ayahNumber, surahNumber, numberInSurah, surahName }: BookmarkButtonProps) {
  const { addBookmark, removeBookmark, getBookmark } = useBookmarks();
  const [showPicker, setShowPicker] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const bookmark = getBookmark(ayahNumber);
  const colorHex = bookmark ? BOOKMARK_COLORS.find((c) => c.color === bookmark.color)?.hex : undefined;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setShowPicker(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setShowPicker(!showPicker)}
        className={`p-1.5 rounded-lg transition-colors ${bookmark ? "" : "text-muted-foreground hover:text-foreground"}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill={bookmark ? colorHex : "none"} stroke={bookmark ? colorHex : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
        </svg>
      </button>
      {showPicker && (
        <div className="absolute bottom-full right-0 mb-2 z-50">
          <ColorPicker
            activeColor={bookmark?.color}
            onSelect={(color: BookmarkColor) => {
              addBookmark(ayahNumber, surahNumber, numberInSurah, surahName, color);
              setShowPicker(false);
            }}
            onRemove={bookmark ? () => { removeBookmark(ayahNumber); setShowPicker(false); } : undefined}
          />
        </div>
      )}
    </div>
  );
}
