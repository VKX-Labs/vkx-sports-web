import { supabase } from "@/lib/supabase";
import type { Team, CreateTeamPayload, UpdateTeamPayload } from "@/types/team";
import { assertSeasonEditor, assertTeamEditor } from "@/services/ownership";

export async function findTeamsByChampionshipId(
  championshipId: string
): Promise<Team[]> {
  const { data: season, error: seasonError } = await supabase
    .from("seasons")
    .select("id")
    .eq("championship_id", championshipId)
    .single();

  if (seasonError) throw new Error(seasonError.message);
  if (!season) return [];

  const { data, error } = await supabase
    .from("teams")
    .select(`
      *,
      players(count)
    `)
    .eq("season_id", season.id)
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((team: Record<string, unknown>) => ({
    ...team,
    _count: {
      players:
        (team.players as Array<{ count: number }> | undefined)?.[0]?.count ?? 0,
    },
  })) as Team[];
}

export async function insertTeam(
  teamData: CreateTeamPayload
): Promise<Team> {
  await assertSeasonEditor(teamData.season_id);

  const { data, error } = await supabase
    .from("teams")
    .insert(teamData)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Team;
}

export async function updateTeamById(
  teamId: string,
  teamData: UpdateTeamPayload
): Promise<Team> {
  await assertTeamEditor(teamId);

  const { data, error } = await supabase
    .from("teams")
    .update(teamData)
    .eq("id", teamId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Team;
}