"use client";
import { useAwards } from "@/contexts/AwardContext";
import { useT } from "@/hooks/useT";

export function AwardModal() {
  const { pendingAward, dismissAward } = useAwards();
  const t = useT();

  if (!pendingAward) return null;

  const isComplete = pendingAward.type === "quran_complete";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center animate-in fade-in zoom-in-95 duration-300">
        {/* Stars / Icon */}
        <div className="text-yellow-400 flex justify-center mb-4">
          {isComplete ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          ) : (
            <div className="flex gap-1">
              {[...Array(3)].map((_, i) => (
                <svg key={i} xmlns="http://www.w3.org/2000/svg" width={i === 1 ? 40 : 32} height={i === 1 ? 40 : 32} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              ))}
            </div>
          )}
        </div>

        {/* Message */}
        <p className="text-foreground font-semibold text-lg leading-snug mb-6">
          {pendingAward.message}
        </p>

        {/* Dismiss */}
        <button
          onClick={dismissAward}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
        >
          {isComplete ? t.award_alhamdulillah : t.award_keep_going}
        </button>
      </div>
    </div>
  );
}
