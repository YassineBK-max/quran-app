"use client";
import { Header } from "@/components/layout/Header";
import { useSettings } from "@/contexts/SettingsContext";
import { RECITERS, TRANSLATIONS } from "@/lib/constants";
import { ThemeMode } from "@/lib/types";

export default function SettingsPage() {
  const { settings, updateSettings } = useSettings();

  return (
    <>
      <Header title="Settings" />
      <main className="max-w-3xl mx-auto px-4 py-4 space-y-6">
        {/* Theme */}
        <section className="bg-card border border-border rounded-xl p-4 space-y-3">
          <h2 className="text-sm font-semibold">Appearance</h2>
          <div className="flex gap-2">
            {(["light", "dark", "system"] as ThemeMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => updateSettings({ theme: mode })}
                className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium capitalize transition-colors ${
                  settings.theme === mode
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </section>

        {/* Reciter */}
        <section className="bg-card border border-border rounded-xl p-4 space-y-3">
          <h2 className="text-sm font-semibold">Reciter</h2>
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
          <h2 className="text-sm font-semibold">Translation</h2>
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
              <h2 className="text-sm font-semibold">Tap to Translate</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Tap an ayah in line-by-line mode to see its translation</p>
            </div>
            <button
              onClick={() => updateSettings({ tapToTranslate: !settings.tapToTranslate })}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                settings.tapToTranslate ? "bg-primary" : "bg-muted-foreground/30"
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  settings.tapToTranslate ? "translate-x-[22px]" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
        </section>

        {/* Language */}
        <section className="bg-card border border-border rounded-xl p-4 space-y-3">
          <h2 className="text-sm font-semibold">App Language</h2>
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
