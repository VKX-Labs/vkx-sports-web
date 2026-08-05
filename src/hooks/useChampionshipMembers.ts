"use client";

import { useState, useEffect, useCallback } from "react";
import { getChampionshipMembers } from "@/services/championship-members";
import type { ChampionshipMember } from "@/types/championship-member";

export function useChampionshipMembers(
  championshipId: string | undefined
) {
  const [members, setMembers] = useState<ChampionshipMember[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!championshipId) {
      setMembers([]);
      return;
    }

    setLoading(true);
    try {
      const data = await getChampionshipMembers(championshipId);
      setMembers(data);
    } catch (err) {
      console.error("Erro ao carregar membros do campeonato:", err);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [championshipId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { members, loading, refresh };
}
