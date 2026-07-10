import { supabase } from "@/lib/supabase";
import { Team } from "@/types/team";

export async function getTeams(
  championshipId: string
): Promise<Team[]> {
  const { data: season, error: seasonError } = await supabase
    .from("seasons")
    .select("id")
    .eq("championship_id", championshipId)
    .single();

  if (seasonError) {
    throw new Error(seasonError.message);
  }

  if (!season) {
    return [];
  }

  const { data, error } = await supabase
    .from("teams")
    .select(`
      *,
      players(count)
    `)
    .eq("season_id", season.id)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((team: any) => ({
    ...team,
    _count: {
      players: team.players?.[0]?.count ?? 0,
    },
  })) as Team[];
}

export async function createTeam(
  championshipId: string,
  teamData: Omit<Team, "id" | "season_id" | "created_at">
): Promise<Team> {
  const { data: season, error: seasonError } = await supabase
    .from("seasons")
    .select("id")
    .eq("championship_id", championshipId)
    .single();

  if (seasonError) {
    throw new Error(seasonError.message);
  }

  if (!season) {
    throw new Error("Temporada não encontrada para este campeonato.");
  }

  const { data, error } = await supabase
    .from("teams")
    .insert({
      ...teamData,
      season_id: season.id,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Team;
}