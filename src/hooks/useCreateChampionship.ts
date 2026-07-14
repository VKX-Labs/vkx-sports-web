"use client";

import { useState, useCallback } from "react";

import { createChampionshipWithSeason } from "@/services/championships";
import type { CreateChampionshipInput } from "@/services/championships";

export function useCreateChampionship() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(async (input: CreateChampionshipInput) => {
    try {
      setLoading(true);
      setError(null);
      const result = await createChampionshipWithSeason(input);
      return result;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao criar campeonato.";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { create, loading, error };
}
