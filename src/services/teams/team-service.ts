import {
  findTeamsByChampionshipId,
  findSeasonByChampionshipId,
  insertTeam,
  updateTeamById,
} from "@/repositories";
import type { Team, CreateTeamPayload, UpdateTeamPayload } from "@/types/team";

export async function getTeams(championshipId: string): Promise<Team[]> {
  return findTeamsByChampionshipId(championshipId);
}

export async function createTeam(
  championshipId: string,
  teamData: Omit<CreateTeamPayload, "season_id">
): Promise<Team> {
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

  return updateTeamById(teamId, {
    ...teamData,
    name: teamData.name?.trim(),
    short_name: teamData.short_name?.trim() || null,
    city: teamData.city?.trim() || null,
    manager: teamData.manager?.trim() || null,
  });
}