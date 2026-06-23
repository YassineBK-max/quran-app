"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Surah } from "@/lib/types";
import { fetchSurah } from "@/lib/api";
import { Header } from "@/components/layout/Header";
import { SurahReader } from "@/components/surah/SurahReader";

export default function SurahPage() {
  const params = useParams();
  const number = Number(params.number);
  const [surah, setSurah] = useState<Surah | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!number || number < 1 || number > 114) {
      setError("Invalid surah number");
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchSurah(number)
      .then(setSurah)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [number]);

  return (
    <>
      <Header title={surah?.englishName || `Surah ${number}`} showBack />
      <main className="max-w-3xl mx-auto px-4 py-4">
        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {error && (
          <div className="text-center py-20">
            <p className="text-red-500 mb-2">{error}</p>
          </div>
        )}
        {!loading && !error && surah && <SurahReader surah={surah} />}
      </main>
    </>
  );
}
