import { supabase } from "@/lib/supabase";
import { EventType } from "@/types";

export interface SimplePlayer {
  id: string;
  name: string;
}

export interface MatchEventItem {
  id?: string;
  team_id: string;
  player_id?: string | null;
  assist_player_id?: string | null;
  event_type: EventType;
}

export const MatchService = {
  async getMatchDetails(matchId: string) {
    const { data: match, error: matchError } = await supabase
      .from("matches")
      .select("*")
      .eq("id", matchId)
      .single();

    if (matchError) throw matchError;

    const [homeTeamRes, awayTeamRes] = await Promise.all([
      supabase.from("teams").select("id, name").eq("id", match.home_team_id).single(),
      supabase.from("teams").select("id, name").eq("id", match.away_team_id).single(),
    ]);

    const fullMatch = {
      ...match,
      home_team: homeTeamRes.data || { id: match.home_team_id, name: "Mandante" },
      away_team: awayTeamRes.data || { id: match.away_team_id, name: "Visitante" },
    };

    const [homePlayersRes, awayPlayersRes] = await Promise.all([
      supabase.from("players").select("id, name").eq("team_id", match.home_team_id),
      supabase.from("players").select("id, name").eq("team_id", match.away_team_id),
    ]);

    const { data: existingEvents } = await supabase
      .from("match_events")
      .select("*")
      .eq("match_id", matchId);

    const formattedEvents: MatchEventItem[] = (existingEvents || []).map((e: any) => ({
      id: e.id,
      team_id: e.team_id,
      player_id: e.player_id,
      assist_player_id: e.assist_player_id,
      event_type: e.type,
    }));

    return {
      match: fullMatch,
      homePlayers: homePlayersRes.data || [],
      awayPlayers: awayPlayersRes.data || [],
      events: formattedEvents,
    };
  },

  async saveMatchResult(
    matchId: string,
    homeScore: number | null,
    awayScore: number | null,
    events: MatchEventItem[]
  ) {
    const { error: updateError } = await supabase
      .from("matches")
      .update({
        home_score: homeScore ?? 0,
        away_score: awayScore ?? 0,
        status: "finished",
      })
      .eq("id", matchId);

    if (updateError) throw updateError;

    await supabase.from("match_events").delete().eq("match_id", matchId);

    if (events.length > 0) {
      const eventsToInsert = events.map((e) => ({
        match_id: matchId,
        team_id: e.team_id,
        player_id: e.player_id || null,
        assist_player_id: e.assist_player_id || null,
        type: e.event_type,
      }));

      const { error: eventsError } = await supabase
        .from("match_events")
        .insert(eventsToInsert);

      if (eventsError) throw eventsError;
    }
  },
};