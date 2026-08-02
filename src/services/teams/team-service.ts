import {
  findTeamsByChampionshipId,
  findSeasonByChampionshipId,
  insertTeam,
  updateTeamById,
} from "@/repositories";
import type { Team, CreateTeamPayload, UpdateTeamPayload } from "@/types/team";
import { getAuthenticatedUserId } from "@/services/auth.service";
import { supabase } from "@/lib/supabase";

export async function getTeams(championshipId: string): Promise<Team[]> {
  return findTeamsByChampionshipId(championshipId);
}

async function validateChampionshipOwnership(championshipId: string): Promise<void> {
  const userId = await getAuthenticatedUserId();

  const { data: championship } = await supabase
    .from("championships")
    .select("user_id")
    .eq("id", championshipId)
    .single();

  if (!championship) {
    throw new Error("Campeonato não encontrado.");
  }

  if (championship.user_id !== userId) {
    throw new Error("Você não tem permissão para modificar este campeonato.");
  }
}

export async function createTeam(
  championshipId: string,
  teamData: Omit<CreateTeamPayload, "season_id">
): Promise<Team> {
  await validateChampionshipOwnership(championshipId);

  const season = await findSeasonByChampionshipId(championshipId);

  if (!season) {
    throw new Error("Temporada não encontrada para este campeonato.");
  }

  return insertTeam({
    ...teamData,
    season_id: season.id,
  });
}

export async function updateTeam(
  teamId: string,
  teamData: UpdateTeamPayload
): Promise<Team> {
  if (teamData.name !== undefined && !teamData.name.trim()) {
    throw new Error("O nome da equipe não pode ficar em branco.");
  }

  const userId = await getAuthenticatedUserId();

  const { data: team } = await supabase
    .from("teams")
    .select("season_id")
    .eq("id", teamId)
    .single();

  if (!team) {
    throw new Error("Equipe não encontrada.");
  }

  const { data: season } = await supabase
    .from("seasons")
    .select("championship_id")
    .eq("id", team.season_id)
    .single();

  if (season) {
    const { data: championship } = await supabase
      .from("championships")
      .select("user_id")
      .eq("id", season.championship_id)
      .single();

    if (!championship || championship.user_id !== userId) {
      throw new Error("Você não tem permissão para modificar esta equipe.");
    }
  }

  return updateTeamById(teamId, {
    ...teamData,
    name: teamData.name?.trim(),
    short_name: teamData.short_name?.trim() || null,
    city: teamData.city?.trim() || null,
    manager: teamData.manager?.trim() || null,
  });
}