"use client";

import { useState, useEffect, useCallback } from "react";

import { getTeams } from "@/services/teams/team-service";
import type { Team } from "@/types/team";

export function useTeams(championshipId: string) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTeams = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getTeams(championshipId);
      setTeams(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao carregar equipes."
      );
    } finally {
      setLoading(false);
    }
  }, [championshipId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (championshipId) loadTeams();
  }, [championshipId, loadTeams]);

  return { teams, loading, error, refresh: loadTeams };
}
