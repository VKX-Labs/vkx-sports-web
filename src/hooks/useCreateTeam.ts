"use client";

import { useState, useCallback } from "react";

import { createTeam } from "@/services/teams/team-service";
import { uploadTeamLogo } from "@/lib/storage/upload-team-logo";
import type { CreateTeamFormData } from "@/validators";
import type { Team } from "@/types/team";

export function useCreateTeam(championshipId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(
    async (data: CreateTeamFormData, imageFile?: File | null): Promise<Team> => {
      try {
        setLoading(true);
        setError(null);

        let badgeUrl: string | null = null;
        if (imageFile) {
          badgeUrl = await uploadTeamLogo(imageFile);
        }

        const team = await createTeam(championshipId, {
          name: data.name,
          initials: data.initials || "",
          city: data.city || "",
          state: data.state || "",
          country: "Brasil",
          manager_name: data.manager_name || "",
          manager_phone: data.manager_phone || "",
          manager_email: "",
          instagram: "",
          description: "",
          primary_kit_color: data.kit_primary,
          secondary_kit_color: data.kit_secondary,
          badge_url: badgeUrl,
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
