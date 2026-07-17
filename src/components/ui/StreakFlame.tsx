"use client";
import { useStreak } from "@/contexts/StreakContext";

function flameColors(days: number): { outer: string; inner: string } {
  if (days <= 2)  return { outer: "#f59e0b", inner: "#fde68a" };
  if (days <= 6)  return { outer: "#f97316", inner: "#fed7aa" };
  if (days <= 13) return { outer: "#ef4444", inner: "#fca5a5" };
  if (days <= 29) return { outer: "#dc2626", inner: "#f87171" };
  return            { outer: "#991b1b", inner: "#dc2626" };
}

export function StreakFlame() {
  const { streak } = useStreak();
  if (!streak) return null;
  const { outer, inner } = flameColors(streak);

  return (
    <div
      className="streak-flame relative flex items-end justify-center shrink-0"
      style={{ width: 28, height: 36 }}
      title={`${streak}-day streak!`}
      aria-label={`${streak} day streak`}
    >
      <svg viewBox="0 0 30 38" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 w-full h-full" aria-hidden>
        <defs>
          <linearGradient id="sfg" x1="15" y1="0" x2="15" y2="38" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={inner} />
            <stop offset="100%" stopColor={outer} />
          </linearGradient>
        </defs>
        {/* Outer flame body */}
        <path
          d="M15 1 C20 7, 27 15, 27 22 C27 31, 21.5 37, 15 37 C8.5 37, 3 31, 3 22 C3 15, 10 7, 15 1 Z"
          fill="url(#sfg)"
        />
        {/* Inner highlight — bright core */}
        <path
          d="M15 14 C17 17, 20 21, 20 25.5 C20 30.5, 18 34.5, 15 36.5 C12 34.5, 10 30.5, 10 25.5 C10 21, 13 17, 15 14 Z"
          fill="rgba(255,220,130,0.42)"
        />
      </svg>
      <span
        className="relative z-10 text-white font-bold leading-none select-none"
        style={{
          fontSize: streak > 99 ? 8 : streak > 9 ? 10 : 12,
          paddingBottom: 5,
          textShadow: "0 1px 3px rgba(0,0,0,0.65)",
        }}
      >
        {streak}
      </span>
    </div>
  );
}
