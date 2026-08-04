"use client";

import { useState, useEffect, useCallback } from "react";
import { getPublicChampionship } from "@/services/championships/public";
import type { Championship } from "@/types/championship";

export function usePublicChampionship(slug: string | undefined) {
  const [championship, setChampionship] = useState<Championship | null>(null);
  const [seasonId, setSeasonId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    if (!slug) {
      setLoading(false);
      setNotFound(true);
      return;
    }

    setLoading(true);
    setNotFound(false);

    try {
      const data = await getPublicChampionship(slug);

      if (!data) {
        setNotFound(true);
        setChampionship(null);
        setSeasonId(null);
        return;
      }

      setChampionship(data.championship);
      setSeasonId(data.seasonId);
    } catch (err) {
      console.error("Erro ao carregar campeonato público:", err);
      setNotFound(true);
      setChampionship(null);
      setSeasonId(null);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    championship,
    seasonId,
    loading,
    notFound,
    refresh: load,
  };
}
