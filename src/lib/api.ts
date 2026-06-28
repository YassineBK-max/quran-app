import { API_BASE } from "./constants";
import { Surah, SurahInfo, SearchMatch, QuranPage } from "./types";

async function fetchApi<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const json = await res.json();
  return json.data;
}

export async function fetchAllSurahs(): Promise<SurahInfo[]> {
  return fetchApi<SurahInfo[]>("/surah");
}

export async function fetchSurah(number: number): Promise<Surah> {
  return fetchApi<Surah>(`/surah/${number}`);
}

export async function fetchSurahTranslation(number: number, edition: string): Promise<Surah> {
  return fetchApi<Surah>(`/surah/${number}/${edition}`);
}

export async function fetchQuranPage(pageNumber: number): Promise<QuranPage> {
  return fetchApi<QuranPage>(`/page/${pageNumber}`);
}

export async function searchAyahs(
  query: string,
  language: string
): Promise<{ count: number; matches: SearchMatch[] }> {
  return fetchApi(`/search/${encodeURIComponent(query)}/all/${language}`);
}
