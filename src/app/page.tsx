"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useMemorization } from "@/contexts/MemorizationContext";
import { fetchAllSurahs } from "@/lib/api";
import { SurahInfo } from "@/lib/types";
import { useT } from "@/hooks/useT";

function IslamicStarEmblem() {
  return (
    <svg
      width="80"
      height="80"
      viewBox="0 0 72 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="drop-shadow-[0_0_18px_rgba(212,168,67,0.5)]"
    >
      {/* Outer glow ring */}
      <circle cx="36" cy="36" r="34" stroke="#d4a843" strokeWidth="0.6" opacity="0.35" />
      <circle cx="36" cy="36" r="30" stroke="#d4a843" strokeWidth="0.3" opacity="0.2" />
      {/* 8-pointed star (khatam) */}
      <polygon
        points="36,4 41,23 59,13 49,31 68,36 49,41 59,59 41,49 36,68 31,49 13,59 23,41 4,36 23,31 13,13 31,23"
        fill="#d4a843"
        opacity="0.92"
      />
      {/* Inner circle detail */}
      <circle cx="36" cy="36" r="9" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
      <circle cx="36" cy="36" r="4" fill="rgba(255,255,255,0.2)" />
    </svg>
  );
}

function IslamicGeoBg() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="islamicGeo" x="0" y="0" width="90" height="90" patternUnits="userSpaceOnUse">
          <g fill="none" stroke="#d4a843" opacity="0.08">
            {/* Outer diamond */}
            <path d="M45 3 L87 45 L45 87 L3 45 Z" strokeWidth="1"/>
            {/* Inner square diamond */}
            <path d="M45 24 L66 45 L45 66 L24 45 Z" strokeWidth="0.7"/>
            {/* Spokes */}
            <line x1="45" y1="3"  x2="45" y2="24" strokeWidth="0.5"/>
            <line x1="87" y1="45" x2="66" y2="45" strokeWidth="0.5"/>
            <line x1="45" y1="87" x2="45" y2="66" strokeWidth="0.5"/>
            <line x1="3"  y1="45" x2="24" y2="45" strokeWidth="0.5"/>
            {/* Corner dots */}
            <circle cx="0"  cy="0"  r="1.8" fill="#d4a843" opacity="0.5"/>
            <circle cx="90" cy="0"  r="1.8" fill="#d4a843" opacity="0.5"/>
            <circle cx="0"  cy="90" r="1.8" fill="#d4a843" opacity="0.5"/>
            <circle cx="90" cy="90" r="1.8" fill="#d4a843" opacity="0.5"/>
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#islamicGeo)" />
    </svg>
  );
}

function NavCard({
  href,
  arabicLabel,
  subtitle,
  icon,
  fullWidth = false,
}: {
  href: string;
  arabicLabel: string;
  subtitle: string;
  icon: React.ReactNode;
  fullWidth?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`${fullWidth ? "col-span-2" : ""} rounded-2xl p-5 flex flex-col items-center gap-2.5 text-white active:scale-[0.97] transition-transform`}
      style={{
        background: "rgba(255,255,255,0.07)",
        backdropFilter: "blur(8px)",
        border: "1px solid rgba(212,168,67,0.28)",
      }}
    >
      <div style={{ color: "#d4a843" }}>{icon}</div>
      <div className="text-center">
        <p
          className="text-base font-bold leading-tight"
          style={{ fontFamily: '"Amiri", serif', color: "#f0d890" }}
        >
          {arabicLabel}
        </p>
        <p className="text-xs mt-0.5" style={{ color: "rgba(212,235,200,0.75)" }}>
          {subtitle}
        </p>
      </div>
    </Link>
  );
}

export default function CoverPage() {
  const { user, logout } = useAuth();
  const { getProgress, getMemorizedCount } = useMemorization();
  const t = useT();
  const [surahs, setSurahs] = useState<SurahInfo[]>([]);

  useEffect(() => {
    fetchAllSurahs().then(setSurahs).catch(() => {});
  }, []);

  const inProgress = surahs.filter((s) => {
    const count = getMemorizedCount(s.number);
    const progress = getProgress(s.number, s.numberOfAyahs);
    return count > 0 && progress < 100;
  });

  const BookIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
    </svg>
  );
  const ClassroomIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
  const LoginIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <polyline points="10 17 15 12 10 7" />
      <line x1="15" y1="12" x2="3" y2="12" />
    </svg>
  );
  const GearIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );

  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-center p-6 relative overflow-hidden"
      style={{ background: "linear-gradient(160deg, #0c2016 0%, #1a3a26 50%, #0e2a1a 100%)" }}
    >
      {/* Islamic geometric background pattern */}
      <IslamicGeoBg />

      {/* Ambient glow accents */}
      <div
        className="absolute top-[-100px] right-[-80px] w-72 h-72 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(212,168,67,0.06) 0%, transparent 70%)" }}
      />
      <div
        className="absolute bottom-[-80px] left-[-60px] w-56 h-56 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(74,170,116,0.08) 0%, transparent 70%)" }}
      />

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 py-4 z-10">
        {/* Gold decorative top accent */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(212,168,67,0.5), transparent)" }}
        />
        <div />
        <div className="flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-2">
              <span className="text-sm" style={{ color: "rgba(212,235,200,0.85)", fontFamily: '"Cairo", sans-serif' }}>
                {user.displayName ?? user.name}
              </span>
              <button
                onClick={logout}
                className="text-xs px-3 py-1.5 rounded-lg transition-colors min-h-[36px]"
                style={{
                  color: "rgba(212,168,67,0.9)",
                  border: "1px solid rgba(212,168,67,0.3)",
                  fontFamily: '"Cairo", sans-serif',
                }}
              >
                {t.signout}
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="text-xs px-3 py-1.5 rounded-lg transition-colors min-h-[36px] flex items-center"
              style={{
                color: "rgba(212,168,67,0.9)",
                border: "1px solid rgba(212,168,67,0.3)",
                fontFamily: '"Cairo", sans-serif',
              }}
            >
              {t.signin}
            </Link>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-sm">

        {/* Islamic emblem + title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-5">
            <IslamicStarEmblem />
          </div>

          {/* Gold ornamental line */}
          <div className="flex items-center gap-3 mb-4 px-4">
            <div className="flex-1 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(212,168,67,0.5))" }} />
            <span style={{ color: "rgba(212,168,67,0.7)", fontSize: "0.6rem", letterSpacing: "0.2em" }}>✦</span>
            <div className="flex-1 h-px" style={{ background: "linear-gradient(to left, transparent, rgba(212,168,67,0.5))" }} />
          </div>

          <h1
            className="text-5xl font-bold mb-2 leading-tight"
            style={{ fontFamily: '"Amiri", serif', color: "#f0ead0" }}
          >
            القرآن الكريم
          </h1>
          <p
            className="text-xs tracking-[0.22em] uppercase mb-4"
            style={{ color: "rgba(212,168,67,0.7)", fontFamily: '"Cairo", sans-serif' }}
          >
            The Noble Quran
          </p>
          <p
            className="text-xl"
            style={{ fontFamily: '"Amiri", serif', color: "rgba(220,210,180,0.85)", direction: "rtl" }}
          >
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </p>
        </div>

        {/* In-progress surahs */}
        {inProgress.length > 0 && (
          <div
            className="mb-4 rounded-2xl p-4"
            style={{
              background: "rgba(255,255,255,0.06)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(212,168,67,0.2)",
            }}
          >
            <div className="islamic-divider mb-3" style={{ color: "rgba(212,168,67,0.7)" }}>
              <span>{t.home_in_progress}</span>
            </div>
            <div className="space-y-2">
              {inProgress.slice(0, 3).map((s) => {
                const progress = getProgress(s.number, s.numberOfAyahs);
                return (
                  <Link
                    key={s.number}
                    href={`/surah/${s.number}`}
                    className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition-colors hover:bg-white/5"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-white text-xs font-medium truncate" style={{ fontFamily: '"Cairo", sans-serif' }}>
                          {s.englishName}
                        </p>
                        <p
                          className="text-[10px] font-semibold shrink-0 ml-2"
                          style={{ color: "#d4a843" }}
                        >
                          {progress}%
                        </p>
                      </div>
                      <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.12)" }}>
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${progress}%`, background: "linear-gradient(90deg, #c8932a, #f0d060)" }}
                        />
                      </div>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#d4a843" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 opacity-60"><path d="m9 18 6-6-6-6"/></svg>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Navigation cards */}
        <div className="grid grid-cols-2 gap-3">
          <NavCard
            href="/surahs"
            arabicLabel="القرآن"
            subtitle={t.cover_read_listen}
            icon={<BookIcon />}
            fullWidth
          />

          {user ? (
            <>
              <NavCard
                href={user.role === "admin" ? "/admin" : "/classroom"}
                arabicLabel="الفصل"
                subtitle={user.role === "admin" ? t.cover_admin_panel : t.cover_classroom}
                icon={<ClassroomIcon />}
              />
              <NavCard
                href="/settings"
                arabicLabel="الإعدادات"
                subtitle={t.nav_settings}
                icon={<GearIcon />}
              />
            </>
          ) : (
            <>
              <NavCard
                href="/login"
                arabicLabel="تسجيل الدخول"
                subtitle={t.signin}
                icon={<LoginIcon />}
              />
              <NavCard
                href="/settings"
                arabicLabel="الإعدادات"
                subtitle={t.nav_settings}
                icon={<GearIcon />}
              />
            </>
          )}
        </div>

        {/* Bottom ornament */}
        <div className="text-center mt-8">
          <p style={{ color: "rgba(212,168,67,0.35)", fontSize: "1.4rem" }}>﷽</p>
        </div>
      </div>
    </div>
  );
}
