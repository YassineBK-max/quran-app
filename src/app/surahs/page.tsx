"use client";
import { useEffect, useState } from "react";
import { SurahInfo } from "@/lib/types";
import { fetchAllSurahs } from "@/lib/api";
import { SurahList } from "@/components/surah/SurahList";
import { Header } from "@/components/layout/Header";

export default function SurahsPage() {
  const [surahs, setSurahs] = useState<SurahInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAllSurahs()
      .then(setSurahs)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Header title="Quran" />
      <main className="max-w-3xl mx-auto px-4 py-4">
        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {error && (
          <div className="text-center py-20">
            <p className="text-red-500 mb-2">Failed to load surahs</p>
            <button onClick={() => window.location.reload()} className="text-primary text-sm underline">Retry</button>
          </div>
        )}
        {!loading && !error && <SurahList surahs={surahs} />}
      </main>
    </>
  );
}
