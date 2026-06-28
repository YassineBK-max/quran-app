"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useMemorization } from "@/contexts/MemorizationContext";
import { fetchAllSurahs } from "@/lib/api";
import { SurahInfo } from "@/lib/types";
import { useT } from "@/hooks/useT";

function BookIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export default function CoverPage() {
  const { user, logout } = useAuth();
  const { getProgress, getMemorizedCount } = useMemorization();
  const t = useT();
  const [surahs, setSurahs] = useState<SurahInfo[]>([]);

  useEffect(() => {
    // Load surah list quietly for in-progress widget
    fetchAllSurahs().then(setSurahs).catch(() => {});
  }, []);

  const inProgress = surahs.filter((s) => {
    const count = getMemorizedCount(s.number);
    const progress = getProgress(s.number, s.numberOfAyahs);
    return count > 0 && progress < 100;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-950 via-green-900 to-green-800 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute top-[-80px] right-[-80px] w-64 h-64 rounded-full bg-white/5" />
      <div className="absolute bottom-[-60px] left-[-60px] w-48 h-48 rounded-full bg-white/5" />

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 py-4">
        <div />
        <div className="flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-2">
              <span className="text-green-200 text-sm">{user.displayName ?? user.name}</span>
              <button
                onClick={logout}
                className="text-xs text-green-300 hover:text-white border border-green-600 px-3 py-1.5 rounded-lg transition-colors"
              >
                {t.signout}
              </button>
            </div>
          ) : (
            <Link href="/login" className="text-xs text-green-200 hover:text-white border border-green-600 px-3 py-1.5 rounded-lg transition-colors">
              {t.signin}
            </Link>
          )}
        </div>
      </div>

      <div className="relative z-10 w-full max-w-sm">
        {/* Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4 text-yellow-300">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" opacity="0.85" />
              <polygon points="17,2 17.9,4.8 21,5 18.7,7 19.4,10 17,8.5 14.6,10 15.3,7 13,5 16.1,4.8" />
            </svg>
          </div>
          <h1 className="font-arabic text-5xl text-white font-bold mb-1" style={{ fontFamily: '"Amiri", serif' }}>
            القرآن الكريم
          </h1>
          <p className="text-green-300 text-xs tracking-[0.2em] uppercase mb-3">The Noble Quran</p>
          <p className="text-green-200/80 text-lg" style={{ fontFamily: '"Amiri", serif' }}>
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </p>
        </div>

        {/* In-progress surahs */}
        {inProgress.length > 0 && (
          <div className="mb-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/15 p-3">
            <p className="text-green-300 text-xs font-semibold mb-2">{t.home_in_progress}</p>
            <div className="space-y-2">
              {inProgress.slice(0, 3).map((s) => {
                const progress = getProgress(s.number, s.numberOfAyahs);
                return (
                  <Link key={s.number} href={`/surah/${s.number}`} className="flex items-center gap-2 hover:bg-white/5 rounded-lg px-1 py-0.5 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="text-white text-xs font-medium truncate">{s.englishName}</p>
                        <p className="text-green-300 text-[10px] font-semibold shrink-0 ml-2">{progress}%</p>
                      </div>
                      <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full bg-green-400 rounded-full" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                    <span className="text-green-300 text-[10px] shrink-0">{t.surahs_continue}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Nav cards */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/surahs"
            className="col-span-2 rounded-2xl p-5 flex flex-col items-center gap-2.5 text-white active:scale-95 transition-transform border border-white/10 hover:bg-white/10"
          >
            <BookIcon />
            <div className="text-center">
              <p className="text-base font-bold leading-tight" style={{ fontFamily: '"Amiri", serif' }}>القرآن</p>
              <p className="text-xs text-green-200 mt-0.5">{t.cover_read_listen}</p>
            </div>
          </Link>

          {user ? (
            <>
              <Link
                href={user.role === "admin" ? "/admin" : "/classroom"}
                className="rounded-2xl p-5 flex flex-col items-center gap-2.5 text-white active:scale-95 transition-transform border border-white/10 hover:bg-white/10"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <div className="text-center">
                  <p className="text-base font-bold leading-tight" style={{ fontFamily: '"Amiri", serif' }}>الفصل</p>
                  <p className="text-xs text-green-200 mt-0.5">{user.role === "admin" ? t.cover_admin_panel : t.cover_classroom}</p>
                </div>
              </Link>
              <Link
                href="/settings"
                className="rounded-2xl p-5 flex flex-col items-center gap-2.5 text-white active:scale-95 transition-transform border border-white/10 hover:bg-white/10"
              >
                <GearIcon />
                <div className="text-center">
                  <p className="text-base font-bold leading-tight" style={{ fontFamily: '"Amiri", serif' }}>الإعدادات</p>
                  <p className="text-xs text-green-200 mt-0.5">{t.nav_settings}</p>
                </div>
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-2xl p-5 flex flex-col items-center gap-2.5 text-white active:scale-95 transition-transform border border-white/10 hover:bg-white/10"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
                <div className="text-center">
                  <p className="text-base font-bold leading-tight" style={{ fontFamily: '"Amiri", serif' }}>تسجيل الدخول</p>
                  <p className="text-xs text-green-200 mt-0.5">{t.signin}</p>
                </div>
              </Link>
              <Link
                href="/settings"
                className="rounded-2xl p-5 flex flex-col items-center gap-2.5 text-white active:scale-95 transition-transform border border-white/10 hover:bg-white/10"
              >
                <GearIcon />
                <div className="text-center">
                  <p className="text-base font-bold leading-tight" style={{ fontFamily: '"Amiri", serif' }}>الإعدادات</p>
                  <p className="text-xs text-green-200 mt-0.5">{t.nav_settings}</p>
                </div>
              </Link>
            </>
          )}
        </div>

        <p className="text-center text-green-400/60 text-xs mt-8">﷽</p>
      </div>
    </div>
  );
}
