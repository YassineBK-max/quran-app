"use client";
import { useState } from "react";
import Link from "next/link";
import { ADHKAR_CATEGORIES } from "@/data/adhkar";

const CATEGORY_ICONS: Record<string, JSX.Element> = {
  istiqaz: (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
    </svg>
  ),
  sabah: (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/><circle cx="12" cy="12" r="5"/>
    </svg>
  ),
  masa: (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  ),
  nawm: (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 18a5 5 0 0 0-10 0"/><line x1="12" y1="2" x2="12" y2="9"/><line x1="4.22" y1="10.22" x2="5.64" y2="11.64"/><line x1="1" y1="18" x2="3" y2="18"/><line x1="21" y1="18" x2="23" y2="18"/><line x1="18.36" y1="11.64" x2="19.78" y2="10.22"/><line x1="23" y1="22" x2="1" y2="22"/>
    </svg>
  ),
  masjid: (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
};

export default function AdhkarPage() {
  const [activeCategory, setActiveCategory] = useState(ADHKAR_CATEGORIES[0].id);
  const [expandedDhikr, setExpandedDhikr] = useState<number | null>(null);

  const category = ADHKAR_CATEGORIES.find((c) => c.id === activeCategory)!;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/90 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/" className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex-1">
            <h1 className="text-base font-bold leading-tight">الأذكار</h1>
            <p className="text-[10px] text-muted-foreground">Daily Remembrance of Allah</p>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="max-w-2xl mx-auto px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
          {ADHKAR_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => { setActiveCategory(cat.id); setExpandedDhikr(null); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                activeCategory === cat.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {CATEGORY_ICONS[cat.id]}
              {cat.title}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-2xl mx-auto w-full px-4 py-4 flex-1 pb-8">
        {/* Category title */}
        <div className="text-center mb-4">
          <h2 className="text-2xl text-foreground font-bold" style={{ fontFamily: '"Amiri", serif' }}>
            {category.arabicTitle}
          </h2>
          <p className="text-xs text-muted-foreground">{category.adhkar.length} adhkar</p>
        </div>

        <div className="space-y-3">
          {category.adhkar.map((dhikr) => {
            const isOpen = expandedDhikr === dhikr.id;
            return (
              <div key={dhikr.id} className="bg-card border border-border rounded-xl overflow-hidden">
                {/* Arabic text always visible */}
                <div className="p-4">
                  <p
                    className="text-right leading-loose text-foreground"
                    style={{ fontFamily: '"Amiri", serif', fontSize: "1.15rem", direction: "rtl" }}
                  >
                    {dhikr.arabic}
                  </p>

                  {/* Repetition badge */}
                  {dhikr.repetitions > 1 && (
                    <div className="flex justify-end mt-2">
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                        × {dhikr.repetitions}
                      </span>
                    </div>
                  )}
                </div>

                {/* Toggle button for translation */}
                <button
                  onClick={() => setExpandedDhikr(isOpen ? null : dhikr.id)}
                  className="w-full px-4 py-2 border-t border-border flex items-center justify-between text-xs text-muted-foreground hover:bg-muted/50 transition-colors"
                >
                  <span>{isOpen ? "Hide meaning" : "Show meaning"}</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>

                {isOpen && (
                  <div className="px-4 py-3 border-t border-border bg-muted/30 space-y-2">
                    <p className="text-sm text-foreground leading-relaxed">{dhikr.english}</p>
                    {dhikr.note && (
                      <p className="text-xs text-primary italic border-l-2 border-primary/40 pl-2">
                        {dhikr.note}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">Source: {dhikr.source}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
