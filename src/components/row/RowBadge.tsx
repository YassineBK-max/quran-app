"use client";
import { useRow, ROW_TIERS, RowTier } from "@/contexts/RowContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useT } from "@/hooks/useT";

function tierName(tier: RowTier, isAr: boolean) {
  return isAr ? tier.nameAr : tier.nameEn;
}

// ─── Mini badge (used in nav / list items) ────────────────────────────────────
export function RowPill({ tier, count }: { tier: RowTier; count?: number }) {
  const { settings } = useSettings();
  const isAr = settings.language === "ar";
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full border"
      style={{ color: tier.color, borderColor: tier.ring, background: tier.ring }}
    >
      {tier.icon} {tierName(tier, isAr)}
      {count !== undefined && <span className="opacity-70">· {count}</span>}
    </span>
  );
}

// ─── Full row widget (profile / home) ─────────────────────────────────────────
export function RowBadge() {
  const { count, currentTier, nextTier, progressToNext } = useRow();
  const { settings } = useSettings();
  const t = useT();
  const isAr = settings.language === "ar";

  return (
    <div
      className="rounded-2xl p-4 border"
      style={{ borderColor: currentTier.ring, background: `${currentTier.ring}` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl leading-none">{currentTier.icon}</span>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider leading-none mb-0.5">
              {t.row_label} {currentTier.row}
            </p>
            <p className="font-bold text-sm leading-none" style={{ color: currentTier.color }}>
              {tierName(currentTier, isAr)}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold tabular-nums">{count}</p>
          <p className="text-[10px] text-muted-foreground">{t.row_ayahs_memorized}</p>
        </div>
      </div>

      {/* Progress bar */}
      {nextTier ? (
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>{currentTier.minAyahs} {t.row_ayahs_short}</span>
            <span className="flex items-center gap-1">
              {nextTier.icon} {tierName(nextTier, isAr)} · {nextTier.minAyahs} {t.row_ayahs_short}
            </span>
          </div>
          <div className="h-2 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progressToNext}%`, background: currentTier.color }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground text-center">
            {nextTier.minAyahs - count} {t.row_ayahs_to_next} {nextTier.row}
          </p>
        </div>
      ) : (
        <p className="text-center text-xs font-semibold" style={{ color: currentTier.color }}>
          {t.row_completed}
        </p>
      )}

      {/* Tier track */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-black/10 dark:border-white/10">
        {ROW_TIERS.map((tier) => (
          <div key={tier.row} className="flex flex-col items-center gap-0.5">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] border transition-all"
              style={
                currentTier.row >= tier.row
                  ? { background: tier.color, borderColor: tier.color, color: "#fff" }
                  : { background: "transparent", borderColor: "#94a3b820", color: "#94a3b8" }
              }
            >
              {currentTier.row >= tier.row ? "✓" : tier.row}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
