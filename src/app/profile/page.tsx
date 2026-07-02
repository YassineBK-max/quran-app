"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { useAuth, getLinkedChildIds } from "@/contexts/AuthContext";
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
  const { user, users, updateUser, linkChildToParent } = useAuth();
  const { settings, updateSettings } = useSettings();
  const t = useT();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState(user?.displayName ?? user?.name ?? "");
  const [saved, setSaved] = useState(false);
  const [addChildCode, setAddChildCode] = useState("");
  const [addChildError, setAddChildError] = useState("");
  const [addChildSuccess, setAddChildSuccess] = useState(false);

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

        {/* Linked children (parents only) */}
        {user.role === "parent" && (
          <section className="bg-card border border-border rounded-xl p-4 space-y-3">
            <h2 className="text-sm font-semibold">{t.parent_child_progress}</h2>
            {(() => {
              const childIds = getLinkedChildIds(user);
              return childIds.length > 0 ? (
                <div className="space-y-2">
                  {childIds.map((cid) => {
                    const child = users.find((u) => u.id === cid);
                    return child ? (
                      <button
                        key={cid}
                        onClick={() => router.push("/surahs")}
                        className="w-full flex items-center gap-3 py-2.5 px-3 bg-primary/10 text-primary rounded-xl text-sm font-medium hover:bg-primary/20 transition-colors text-left"
                      >
                        <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold shrink-0">
                          {child.name[0].toUpperCase()}
                        </div>
                        <span className="flex-1">{child.displayName ?? child.name}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
                      </button>
                    ) : null;
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{t.profile_no_parents}</p>
              );
            })()}

            {/* Add another child */}
            <div className="pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2">{t.profile_add_child ?? "Link another student"}</p>
              <div className="flex gap-2">
                <input
                  value={addChildCode}
                  onChange={(e) => { setAddChildCode(e.target.value.toUpperCase()); setAddChildError(""); setAddChildSuccess(false); }}
                  placeholder="XXXXXXXX"
                  maxLength={8}
                  className="flex-1 bg-muted border border-border rounded-xl px-3 py-2.5 text-sm font-mono tracking-widest uppercase"
                />
                <button
                  onClick={() => {
                    const err = linkChildToParent(addChildCode);
                    if (err) { setAddChildError(err); } else { setAddChildSuccess(true); setAddChildCode(""); setTimeout(() => setAddChildSuccess(false), 3000); }
                  }}
                  disabled={addChildCode.length < 8}
                  className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium disabled:opacity-40 min-w-[44px]"
                >
                  {t.go ?? "+"}
                </button>
              </div>
              {addChildError && (
                <p className="text-red-500 text-xs mt-1">{addChildError}</p>
              )}
              {addChildSuccess && (
                <p className="text-primary text-xs mt-1">✓ {t.profile_child_linked ?? "Student linked successfully!"}</p>
              )}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
