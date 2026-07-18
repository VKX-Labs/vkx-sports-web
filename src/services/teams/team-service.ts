import {
  findTeamsByChampionshipId,
  findSeasonByChampionshipId,
  insertTeam,
} from "@/repositories";
import type { Team, CreateTeamPayload } from "@/types/team";

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
