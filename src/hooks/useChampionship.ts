import { useState, useEffect } from "react";

import { getChampionship } from "@/services/championships";
import { Championship } from "@/types/championship";

export function useChampionship(id: string) {
  const [championship, setChampionship] = useState<Championship | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    async function load() {
      try {
        setLoading(true);
        const data = await getChampionship(id);
        setChampionship(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar contexto.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  return { championship, loading, error };
}