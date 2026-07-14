import {
  findTeamsByChampionshipId,
  findSeasonByChampionshipId,
  insertTeam,
} from "@/repositories";
import type { Team } from "@/types/team";

export async function getTeams(championshipId: string): Promise<Team[]> {
  return findTeamsByChampionshipId(championshipId);
}

export async function createTeam(
  championshipId: string,
  teamData: Omit<Team, "id" | "season_id" | "created_at">
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
