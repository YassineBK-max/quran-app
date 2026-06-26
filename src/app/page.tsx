"use client";
import Link from "next/link";

function GearIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
    </svg>
  );
}

function DuaHandsIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 11V8a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v3" />
      <path d="M14 10V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v4" />
      <path d="M10 10.5V8a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v6c0 3.31 2.69 6 6 6h1a5 5 0 0 0 5-5v-3a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v1" />
    </svg>
  );
}

function StarCrescentIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="currentColor">
      <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" opacity="0.9" />
      <polygon points="17,2 17.9,4.8 21,5 18.7,7 19.4,10 17,8.5 14.6,10 15.3,7 13,5 16.1,4.8" fill="currentColor" />
    </svg>
  );
}

const navItems = [
  {
    href: "/surahs",
    icon: <BookIcon />,
    arabic: "القرآن",
    label: "Quran",
    color: "from-green-600 to-green-700",
  },
  {
    href: "/settings",
    icon: <GearIcon />,
    arabic: "الإعدادات",
    label: "Settings",
    color: "from-green-700 to-green-800",
  },
  {
    href: "/hadith",
    icon: <StarCrescentIcon />,
    arabic: "الحديث النبوي",
    label: "40 Hadith",
    color: "from-green-600 to-green-700",
  },
  {
    href: "/adhkar",
    icon: <DuaHandsIcon />,
    arabic: "الأذكار",
    label: "Adhkar",
    color: "from-green-700 to-green-800",
  },
];

export default function CoverPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-950 via-green-900 to-green-800 flex flex-col items-center justify-center p-6 relative overflow-hidden">

      {/* Decorative background circles */}
      <div className="absolute top-[-80px] right-[-80px] w-64 h-64 rounded-full bg-white/5" />
      <div className="absolute bottom-[-60px] left-[-60px] w-48 h-48 rounded-full bg-white/5" />
      <div className="absolute top-1/2 left-[-40px] w-32 h-32 rounded-full bg-white/5" />

      <div className="relative z-10 w-full max-w-sm">

        {/* Title */}
        <div className="text-center mb-10">
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

        {/* Navigation Grid */}
        <div className="grid grid-cols-2 gap-3">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`bg-gradient-to-br ${item.color} rounded-2xl p-5 flex flex-col items-center gap-2.5 text-white shadow-lg active:scale-95 transition-transform border border-white/10`}
            >
              <div className="opacity-90">{item.icon}</div>
              <div className="text-center">
                <p className="text-base font-bold leading-tight" style={{ fontFamily: '"Amiri", serif' }}>
                  {item.arabic}
                </p>
                <p className="text-xs text-green-200 mt-0.5">{item.label}</p>
              </div>
            </Link>
          ))}
        </div>

        <p className="text-center text-green-400/60 text-xs mt-8">
          ﷽
        </p>
      </div>
    </div>
  );
}
