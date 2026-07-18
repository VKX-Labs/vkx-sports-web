"use client";

import { useState, useCallback } from "react";

import { createTeam } from "@/services/teams/team-service";
import type { CreateTeamFormData } from "@/validators";
import type { Team } from "@/types/team";

export function useCreateTeam(championshipId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(
    async (data: CreateTeamFormData): Promise<Team> => {
      try {
        setLoading(true);
        setError(null);

        const team = await createTeam(championshipId, {
          name: data.name,
          short_name: data.short_name || null,
          city: data.city || null,
          manager: data.manager || null,
        });

        return team;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erro ao salvar a equipe.";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [championshipId]
  );

  return { create, loading, error };
}
