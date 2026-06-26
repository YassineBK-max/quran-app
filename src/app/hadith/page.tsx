"use client";
import { useState } from "react";
import Link from "next/link";
import { FORTY_HADITH } from "@/data/hadith";

export default function HadithPage() {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/90 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/" className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex-1">
            <h1 className="text-base font-bold leading-tight">الأربعون النووية</h1>
            <p className="text-[10px] text-muted-foreground">40 Hadith of Imam An-Nawawi</p>
          </div>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">40</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4 space-y-2 pb-8">
        {FORTY_HADITH.map((hadith) => {
          const isOpen = expanded === hadith.id;
          return (
            <div
              key={hadith.id}
              className="bg-card border border-border rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setExpanded(isOpen ? null : hadith.id)}
                className="w-full text-left p-4 flex items-start gap-3 hover:bg-muted/50 transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                  {hadith.id}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm leading-snug">{hadith.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Narrated by {hadith.narrator} · {hadith.source}
                  </p>
                </div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`shrink-0 text-muted-foreground transition-transform mt-1 ${isOpen ? "rotate-180" : ""}`}
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              {isOpen && (
                <div className="border-t border-border">
                  {/* Arabic text */}
                  <div className="px-4 pt-4 pb-3 bg-primary/5">
                    <p
                      className="text-right leading-loose text-foreground"
                      style={{ fontFamily: '"Amiri", serif', fontSize: "1.2rem", direction: "rtl" }}
                    >
                      {hadith.arabicText}
                    </p>
                  </div>
                  {/* English translation */}
                  <div className="px-4 py-3">
                    <p className="text-sm text-muted-foreground leading-relaxed">{hadith.englishText}</p>
                    <p className="text-xs text-primary font-medium mt-2">— {hadith.source}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </main>
    </div>
  );
}
