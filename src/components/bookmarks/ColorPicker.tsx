"use client";
import { BookmarkColor } from "@/lib/types";
import { BOOKMARK_COLORS } from "@/lib/constants";

interface ColorPickerProps {
  onSelect: (color: BookmarkColor) => void;
  onRemove?: () => void;
  activeColor?: BookmarkColor;
}

export function ColorPicker({ onSelect, onRemove, activeColor }: ColorPickerProps) {
  return (
    <div className="flex items-center gap-1.5 p-2 bg-card border border-border rounded-xl shadow-lg">
      {BOOKMARK_COLORS.map(({ color, hex }) => (
        <button
          key={color}
          onClick={() => onSelect(color)}
          className={`w-7 h-7 rounded-full transition-transform hover:scale-110 ${
            activeColor === color ? "ring-2 ring-offset-2 ring-offset-card" : ""
          }`}
          style={{ backgroundColor: hex, outlineColor: activeColor === color ? hex : undefined }}
        />
      ))}
      {onRemove && activeColor && (
        <button
          onClick={onRemove}
          className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
