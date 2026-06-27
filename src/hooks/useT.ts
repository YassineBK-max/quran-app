import { useSettings } from "@/contexts/SettingsContext";
import { translations, Translations } from "@/lib/i18n";

export function useT(): Translations {
  const { settings } = useSettings();
  return translations[settings.language];
}
