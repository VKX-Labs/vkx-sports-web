import { supabase } from "@/lib/supabase";
import { StandingsService } from "@/services/standingsService";
import type { TeamStanding } from "@/types/tournament";
import type { Match } from "@/types/match";

export interface PublicTeam {
  id: string;
  name: string;
  badge_url: string | null;
  short_name?: string | null;
  city?: string | null;
  state?: string | null;
}

export interface PublicMatch {
  id: string;
  home_team_id: string | null;
  away_team_id: string | null;
  home_score: number | null;
  away_score: number | null;
  status: string;
  date: string | null;
  home_team: PublicTeam | null;
  away_team: PublicTeam | null;
}

export interface PublicRound {
  id: string;
  name: string | null;
  round_number: number;
  matches: PublicMatch[];
}

export async function fetchPublicRounds(seasonId: string): Promise<PublicRound[]> {
  if (!seasonId) return [];

  const { data: roundsData, error: roundsError } = await supabase
    .from("rounds")
    .select("id, name, round_number")
    .eq("season_id", seasonId)
    .order("round_number", { ascending: true });

  if (roundsError) throw roundsError;
  if (!roundsData || roundsData.length === 0) return [];

  const roundIds = roundsData.map((r) => r.id);

  const { data: matchesData, error: matchesError } = await supabase
    .from("matches")
    .select(
      `*,
      home_team:teams!home_team_id(id, name, badge_url, short_name, city),
      away_team:teams!away_team_id(id, name, badge_url, short_name, city)`
    )
    .in("round_id", roundIds);

  if (matchesError) throw matchesError;

  return roundsData.map((round) => ({
    id: round.id,
    name: round.name,
    round_number: round.round_number,
    matches: (matchesData || [])
      .filter((m) => m.round_id === round.id)
      .map((m: any) => ({
        id: m.id,
        home_team_id: m.home_team_id,
        away_team_id: m.away_team_id,
        home_score: m.home_score,
        away_score: m.away_score,
        status: m.status,
        date: m.date ?? null,
        home_team: m.home_team ?? null,
        away_team: m.away_team ?? null,
      })),
  }));
}

export async function fetchPublicTeams(seasonId: string): Promise<PublicTeam[]> {
  if (!seasonId) return [];

  const { data, error } = await supabase
    .from("teams")
    .select("id, name, badge_url, short_name, city")
    .eq("season_id", seasonId)
    .order("name", { ascending: true });

  if (error) throw error;
  return (data || []) as PublicTeam[];
}

export async function fetchPublicStandings(
  seasonId: string
): Promise<TeamStanding[]> {
  if (!seasonId) return [];

  const { data: teams, error: teamsError } = await supabase
    .from("teams")
    .select("id, name, badge_url")
    .eq("season_id", seasonId);

  if (teamsError) throw teamsError;

  const { data: matches, error: matchesError } = await supabase
    .from("matches")
    .select("status, home_team_id, away_team_id, home_score, away_score")
    .eq("season_id", seasonId);

  if (matchesError) throw matchesError;

  return StandingsService.calculateStandings(
    teams || [],
    (matches || []) as Pick<
      Match,
      "status" | "home_team_id" | "away_team_id" | "home_score" | "away_score"
    >[]
  );
}
