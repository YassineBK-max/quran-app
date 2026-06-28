"use client";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { useSettings } from "@/contexts/SettingsContext";
import { useAuth } from "@/contexts/AuthContext";
import { Switch } from "@/components/ui/Switch";
import { RECITERS, TRANSLATIONS } from "@/lib/constants";
import { ThemeMode } from "@/lib/types";
import { useT } from "@/hooks/useT";

export default function SettingsPage() {
  const { settings, updateSettings } = useSettings();
  const { user } = useAuth();
  const t = useT();

  const themeLabels: Record<ThemeMode, string> = {
    light: t.settings_theme_light,
    dark: t.settings_theme_dark,
    system: t.settings_theme_system,
  };

  return (
    <>
      <Header title={t.settings_title} />
      <main className="max-w-3xl mx-auto px-4 py-4 space-y-6">
        {/* Profile */}
        {user && (
          <Link
            href="/profile"
            className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl hover:border-primary/30 transition-colors"
          >
            {user.profilePhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.profilePhoto} alt="" className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                {(user.displayName ?? user.name)[0].toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user.displayName ?? user.name}</p>
              <p className="text-xs text-muted-foreground">{t.settings_profile}</p>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground shrink-0">
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </Link>
        )}

        {/* Theme */}
        <section className="bg-card border border-border rounded-xl p-4 space-y-3">
          <h2 className="text-sm font-semibold">{t.settings_appearance}</h2>
          <div className="flex gap-2">
            {(["light", "dark", "system"] as ThemeMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => updateSettings({ theme: mode })}
                className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-colors ${
                  settings.theme === mode
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {themeLabels[mode]}
              </button>
            ))}
          </div>
        </section>

        {/* Reciter */}
        <section className="bg-card border border-border rounded-xl p-4 space-y-3">
          <h2 className="text-sm font-semibold">{t.settings_reciter}</h2>
          <div className="space-y-1">
            {RECITERS.map((reciter) => (
              <button
                key={reciter.id}
                onClick={() => updateSettings({ reciterEdition: reciter.id })}
                className={`w-full text-left py-2.5 px-3 rounded-lg text-sm transition-colors ${
                  settings.reciterEdition === reciter.id
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                {reciter.name}
              </button>
            ))}
          </div>
        </section>

        {/* Translation */}
        <section className="bg-card border border-border rounded-xl p-4 space-y-3">
          <h2 className="text-sm font-semibold">{t.settings_translation}</h2>
          <div className="space-y-1">
            {TRANSLATIONS.map((tr) => (
              <button
                key={tr.id}
                onClick={() => updateSettings({ translationEdition: tr.id })}
                className={`w-full text-left py-2.5 px-3 rounded-lg text-sm transition-colors ${
                  settings.translationEdition === tr.id
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                {tr.name}
              </button>
            ))}
          </div>
        </section>

        {/* Tap to Translate */}
        <section className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">{t.settings_tap_translate}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{t.settings_tap_translate_desc}</p>
            </div>
            <Switch
              checked={settings.tapToTranslate}
              onChange={(v) => updateSettings({ tapToTranslate: v })}
            />
          </div>
        </section>

        {/* Language */}
        <section className="bg-card border border-border rounded-xl p-4 space-y-3">
          <h2 className="text-sm font-semibold">{t.settings_language}</h2>
          <div className="flex gap-2">
            <button
              onClick={() => updateSettings({ language: "en" })}
              className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-colors ${
                settings.language === "en"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              English
            </button>
            <button
              onClick={() => updateSettings({ language: "ar" })}
              className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-colors ${
                settings.language === "ar"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              العربية
            </button>
          </div>
        </section>
      </main>
    </>
  );
}
