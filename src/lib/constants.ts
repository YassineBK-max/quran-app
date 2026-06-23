import { AppSettings, BookmarkColor } from "./types";

export const API_BASE = "https://api.alquran.cloud/v1";

export const RECITERS = [
  { id: "ar.alafasy", name: "Mishary Rashid Alafasy" },
  { id: "ar.abdurrahmaansudais", name: "Abdurrahmaan As-Sudais" },
  { id: "ar.abdulbasitmurattal", name: "Abdul Basit (Murattal)" },
  { id: "ar.husary", name: "Mahmoud Khalil Al-Husary" },
  { id: "ar.minshawi", name: "Mohamed Siddiq El-Minshawi" },
  { id: "ar.saaboromayye", name: "Saad Al-Ghamdi" },
];

export const TRANSLATIONS = [
  { id: "en.sahih", name: "Sahih International", language: "en" },
  { id: "en.asad", name: "Muhammad Asad", language: "en" },
  { id: "en.pickthall", name: "Pickthall", language: "en" },
  { id: "fr.hamidullah", name: "Hamidullah (French)", language: "fr" },
  { id: "es.cortes", name: "Cortes (Spanish)", language: "es" },
  { id: "tr.ates", name: "Suleyman Ates (Turkish)", language: "tr" },
  { id: "ur.jalandhry", name: "Jalandhry (Urdu)", language: "ur" },
];

export const BOOKMARK_COLORS: { color: BookmarkColor; label: string; hex: string }[] = [
  { color: "red", label: "Red", hex: "#EF4444" },
  { color: "blue", label: "Blue", hex: "#3B82F6" },
  { color: "green", label: "Green", hex: "#22C55E" },
  { color: "yellow", label: "Yellow", hex: "#EAB308" },
  { color: "purple", label: "Purple", hex: "#A855F7" },
];

export const DEFAULT_SETTINGS: AppSettings = {
  theme: "system",
  reciterEdition: "ar.alafasy",
  translationEdition: "en.sahih",
  language: "en",
  tapToTranslate: true,
  displayMode: "ayah-per-line",
};

export const AUDIO_CDN = "https://cdn.islamic.network/quran/audio/128";
