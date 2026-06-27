"use client";
interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}

export function Switch({ checked, onChange, label }: SwitchProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex shrink-0 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
          checked ? "bg-primary" : "bg-muted-foreground/30"
        }`}
        style={{ width: 44, height: 24 }}
      >
        <span
          className="pointer-events-none inline-block rounded-full bg-white shadow"
          style={{
            width: 20,
            height: 20,
            marginTop: 2,
            transform: checked ? "translateX(22px)" : "translateX(2px)",
            transition: "transform 200ms ease-in-out",
          }}
        />
      </button>
      {label && <span className="text-xs text-muted-foreground">{label}</span>}
    </div>
  );
}
