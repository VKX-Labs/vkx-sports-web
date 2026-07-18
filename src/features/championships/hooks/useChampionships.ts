"use client";

import { useState, useEffect, useCallback } from "react";

import {
  getMyChampionships,
  deleteChampionship,
} from "@/services/championships";
import type { Championship } from "@/types/championship";

export function useChampionships() {
  const [championships, setChampionships] = useState<Championship[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadChampionships = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getMyChampionships();
      setChampionships(data ?? []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadChampionships();
  }, [loadChampionships]);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        setDeletingId(id);
        await deleteChampionship(id);
        setChampionships((prev) => prev.filter((champ) => champ.id !== id));
      } catch (error) {
        alert(
          error instanceof Error ? error.message : "Erro ao excluir campeonato."
        );
      } finally {
        setDeletingId(null);
      }
    },
    []
  );

  return {
    championships,
    loading,
    deletingId,
    deleteChampionship: handleDelete,
    refresh: loadChampionships,
  };
}
