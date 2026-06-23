"use client";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { useBookmarks } from "@/contexts/BookmarkContext";
import { BOOKMARK_COLORS } from "@/lib/constants";
import { useState } from "react";
import { BookmarkColor } from "@/lib/types";

export default function BookmarksPage() {
  const { bookmarks, removeBookmark } = useBookmarks();
  const [filter, setFilter] = useState<BookmarkColor | "all">("all");

  const sorted = [...bookmarks].sort((a, b) => b.timestamp - a.timestamp);
  const filtered = filter === "all" ? sorted : sorted.filter((b) => b.color === filter);

  return (
    <>
      <Header title="Bookmarks" />
      <main className="max-w-3xl mx-auto px-4 py-4">
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors shrink-0 ${
              filter === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            All ({sorted.length})
          </button>
          {BOOKMARK_COLORS.map(({ color, label, hex }) => {
            const count = sorted.filter((b) => b.color === color).length;
            return (
              <button
                key={color}
                onClick={() => setFilter(color)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors shrink-0 ${
                  filter === color ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: hex }} />
                {label} ({count})
              </button>
            );
          })}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-3 opacity-50">
              <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
            </svg>
            <p>No bookmarks yet</p>
            <p className="text-sm mt-1">Tap the bookmark icon on any ayah to save it</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((bookmark) => {
              const colorHex = BOOKMARK_COLORS.find((c) => c.color === bookmark.color)?.hex;
              return (
                <div key={bookmark.ayahNumber} className={`flex items-center gap-3 p-3 rounded-xl bg-card border border-border bookmark-highlight-${bookmark.color}`}>
                  <div className="w-3 h-full min-h-[2rem] rounded-full shrink-0" style={{ backgroundColor: colorHex }} />
                  <Link href={`/surah/${bookmark.surahNumber}?ayah=${bookmark.numberInSurah}`} className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{bookmark.surahName}</p>
                    <p className="text-xs text-muted-foreground">Surah {bookmark.surahNumber}, Ayah {bookmark.numberInSurah}</p>
                  </Link>
                  <button
                    onClick={() => removeBookmark(bookmark.ayahNumber)}
                    className="p-1.5 text-muted-foreground hover:text-red-500 transition-colors shrink-0"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
