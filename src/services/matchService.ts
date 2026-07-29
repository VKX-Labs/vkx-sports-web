import { supabase } from "@/lib/supabase";
import type { MatchEvent } from "@/types/event";
import type { EventType } from "@/types";
import { advanceWinnerIfPhaseFinished } from "@/services/bracketEngine";

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
  minute?: string | number | null;
}

export interface SaveMatchResultParams {
  matchId: string;
  homeScore: number | null;
  awayScore: number | null;
  homeScoreLeg2?: number | null;
  awayScoreLeg2?: number | null;
  penaltiesHome?: number | null;
  penaltiesAway?: number | null;
  events?: MatchEventItem[];
  isTwoLegs?: boolean;
}

export const MatchService = {
  /**
   * Busca os detalhes completos da partida (times, jogadores e eventos cadastrados)
   */
  async getMatchDetails(matchId: string) {
    const { data: match, error: matchError } = await supabase
      .from("matches")
      .select("*")
      .eq("id", matchId)
      .single();

    if (matchError) throw matchError;

    const [homeTeamRes, awayTeamRes] = await Promise.all([
      supabase
        .from("teams")
        .select("id, name, badge_url")
        .eq("id", match.home_team_id)
        .maybeSingle(),
      supabase
        .from("teams")
        .select("id, name, badge_url")
        .eq("id", match.away_team_id)
        .maybeSingle(),
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
      event_type: (e.type || e.event_type) as EventType,
      minute: e.minute !== null && e.minute !== undefined ? String(e.minute) : "",
    }));

    return {
      match: fullMatch,
      homePlayers: homePlayersRes.data || [],
      awayPlayers: awayPlayersRes.data || [],
      events: formattedEvents,
    };
  },

  /**
   */
  async saveMatchResult({
    matchId,
    homeScore,
    awayScore,
    homeScoreLeg2 = null,
    awayScoreLeg2 = null,
    penaltiesHome = null,
    penaltiesAway = null,
    events = [],
    isTwoLegs = false,
  }: SaveMatchResultParams) {
    const updateMatchData: Record<string, any> = {
      home_score: homeScore ?? 0,
      away_score: awayScore ?? 0,
      status: "finished",
    };

    if (homeScoreLeg2 !== null && homeScoreLeg2 !== undefined) {
      updateMatchData.home_score_leg2 = homeScoreLeg2;
    }
    if (awayScoreLeg2 !== null && awayScoreLeg2 !== undefined) {
      updateMatchData.away_score_leg2 = awayScoreLeg2;
    }
    if (penaltiesHome !== null && penaltiesHome !== undefined) {
      updateMatchData.penalties_home = penaltiesHome;
    }
    if (penaltiesAway !== null && penaltiesAway !== undefined) {
      updateMatchData.penalties_away = penaltiesAway;
    }

    const { data: updatedMatch, error: updateError } = await supabase
      .from("matches")
      .update(updateMatchData)
      .eq("id", matchId)
      .select("*")
      .single();

    if (updateError) throw updateError;

    await supabase.from("match_events").delete().eq("match_id", matchId);

    if (events && events.length > 0) {
      const eventsToInsert = events.map((e) => {
        const parsedMinute = e.minute ? parseInt(String(e.minute), 10) : null;

        return {
          match_id: matchId,
          team_id: e.team_id,
          player_id: e.player_id || null,
          assist_player_id: e.assist_player_id || null,
          type: e.event_type,
          minute: isNaN(Number(parsedMinute)) ? null : parsedMinute,
        };
      });

      const { error: eventsError } = await supabase
        .from("match_events")
        .insert(eventsToInsert);

      if (eventsError) throw eventsError;
    }

    if (updatedMatch && updatedMatch.phase && updatedMatch.phase !== "REGULAR") {
      await advanceWinnerIfPhaseFinished(
        {
          id: updatedMatch.id,
          season_id: updatedMatch.season_id,
          phase: updatedMatch.phase,
          bracket_position: updatedMatch.bracket_position ?? 1,
          home_team_id: updatedMatch.home_team_id,
          away_team_id: updatedMatch.away_team_id,
          home_score: updatedMatch.home_score,
          away_score: updatedMatch.away_score,
          home_score_leg2: updatedMatch.home_score_leg2,
          away_score_leg2: updatedMatch.away_score_leg2,
          penalties_home: updatedMatch.penalties_home,
          penalties_away: updatedMatch.penalties_away,
          next_match_id: updatedMatch.next_match_id,
          status: updatedMatch.status,
        },
        isTwoLegs
      );
    }

    return updatedMatch;
  },
};