"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useT } from "@/hooks/useT";
import { ColorTheme } from "@/lib/types";

const THEMES: { id: ColorTheme; emoji: string }[] = [
  { id: "classic",    emoji: "🌿" },
  { id: "futuristic", emoji: "🚀" },
  { id: "glass",      emoji: "💎" },
  { id: "simple",     emoji: "⬜" },
  { id: "8bit",       emoji: "🎮" },
];

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { settings, updateSettings } = useSettings();
  const t = useT();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState(user?.displayName ?? user?.name ?? "");
  const [saved, setSaved] = useState(false);

  if (!user) {
    return (
      <>
        <Header title={t.profile_title} showBack />
        <main className="max-w-3xl mx-auto px-4 py-8 text-center">
          <p className="text-muted-foreground mb-4">{t.signin_required}</p>
          <button onClick={() => router.push("/login")} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl">{t.signin}</button>
        </main>
      </>
    );
  }

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const b64 = ev.target?.result as string;
      updateUser(user.id, { profilePhoto: b64 });
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    updateUser(user.id, { displayName: displayName.trim() || user.name });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const themeLabels: Record<ColorTheme, string> = {
    classic:    t.profile_theme_classic,
    futuristic: t.profile_theme_futuristic,
    glass:      t.profile_theme_glass,
    simple:     t.profile_theme_simple,
    "8bit":     t.profile_theme_8bit,
  };

  return (
    <>
      <Header title={t.profile_title} showBack />
      <main className="max-w-3xl mx-auto px-4 py-4 space-y-4">

        {/* Photo + name */}
        <section className="bg-card border border-border rounded-xl p-4 flex flex-col items-center gap-3">
          <div className="relative">
            {user.profilePhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.profilePhoto}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover border-2 border-primary"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-primary/10 text-primary flex items-center justify-center text-3xl font-bold border-2 border-primary/30">
                {(user.displayName ?? user.name)[0].toUpperCase()}
              </div>
            )}
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            className="text-xs text-primary hover:underline"
          >
            {t.profile_change_photo}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          <p className="text-sm font-semibold">{user.displayName ?? user.name}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
          <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full capitalize">{user.role}</span>
        </section>

        {/* Display name */}
        <section className="bg-card border border-border rounded-xl p-4 space-y-3">
          <h2 className="text-sm font-semibold">{t.profile_display_name}</h2>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={t.profile_display_name_placeholder}
            className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm"
          />
          {saved && <p className="text-primary text-xs">{t.profile_saved}</p>}
          <button
            onClick={handleSave}
            className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium"
          >
            {t.profile_save}
          </button>
        </section>

        {/* Color theme */}
        <section className="bg-card border border-border rounded-xl p-4 space-y-3">
          <h2 className="text-sm font-semibold">{t.profile_color_theme}</h2>
          <div className="grid grid-cols-5 gap-2">
            {THEMES.map(({ id, emoji }) => (
              <button
                key={id}
                onClick={() => updateSettings({ colorTheme: id })}
                className={`flex flex-col items-center gap-1 py-3 rounded-xl border text-xs font-medium transition-colors ${
                  (settings.colorTheme ?? "classic") === id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="text-xl">{emoji}</span>
                <span className="text-[10px] leading-tight text-center">{themeLabels[id]}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Parent code (students only) */}
        {user.role === "student" && user.parentCode && (
          <section className="bg-card border border-border rounded-xl p-4 space-y-3">
            <h2 className="text-sm font-semibold">{t.profile_parent_code}</h2>
            <p className="text-xs text-muted-foreground">{t.profile_parent_code_desc}</p>
            <div className="flex items-center gap-2 bg-muted rounded-xl px-4 py-3">
              <span className="font-mono font-bold text-primary tracking-widest flex-1 text-lg">{user.parentCode}</span>
              <button
                onClick={() => navigator.clipboard?.writeText(user.parentCode ?? "")}
                className="text-muted-foreground hover:text-foreground p-1"
                title="Copy"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
              </button>
            </div>
          </section>
        )}

        {/* Linked child (parents only) */}
        {user.role === "parent" && (
          <section className="bg-card border border-border rounded-xl p-4 space-y-2">
            <h2 className="text-sm font-semibold">{t.parent_child_progress}</h2>
            {user.linkedChildId ? (
              <button
                onClick={() => router.push("/surahs")}
                className="w-full py-2.5 bg-primary/10 text-primary rounded-xl text-sm font-medium text-left px-3 hover:bg-primary/20 transition-colors"
              >
                {t.parent_view_quran} →
              </button>
            ) : (
              <p className="text-sm text-muted-foreground">{t.profile_no_parents}</p>
            )}
          </section>
        )}
      </main>
    </>
  );
}
