import { supabase } from "@/lib/supabase";

export interface RawMatchEvent {
  player_id: string | null;
  assist_player_id: string | null;
  type: string;
  quantity: number;
  players: {
    id: string;
    name: string;
    photo_url: string | null;
    teams: {
      id: string;
      name: string;
      badge_url: string | null;
    } | null;
  } | null;
  assist_player?: {
    id: string;
    name: string;
    photo_url: string | null;
    teams: {
      id: string;
      name: string;
      badge_url: string | null;
    } | null;
  } | null;
}

export class StatisticsRepository {
  static async getMatchEventsBySeason(
    seasonId: string,
    eventType: string
  ): Promise<RawMatchEvent[]> {
    try {
      const { data: rounds, error: roundsError } = await supabase
        .from("rounds")
        .select("id")
        .eq("season_id", seasonId);

      if (roundsError) {
        console.error("[StatisticsRepository] Erro ao buscar rodadas:", roundsError);
      }

      const roundIds = rounds?.map((r) => r.id) || [];

      let matchesQuery = supabase.from("matches").select("id");

      if (roundIds.length > 0) {
        matchesQuery = matchesQuery.or(
          `season_id.eq.${seasonId},round_id.in.(${roundIds.join(",")})`
        );
      } else {
        matchesQuery = matchesQuery.eq("season_id", seasonId);
      }

      const { data: matches, error: matchesError } = await matchesQuery;

      if (matchesError || !matches || matches.length === 0) {
        return [];
      }

      const matchIds = matches.map((m) => m.id);

      const { data: events, error: eventsError } = await supabase
        .from("match_events")
        .select("player_id, assist_player_id, type, quantity")
        .in("match_id", matchIds)
        .eq("type", eventType);

      if (eventsError) {
        console.error(
          `[StatisticsRepository] Erro ao buscar eventos (${eventType}):`,
          eventsError.message
        );
        return [];
      }

      let allEvents = events || [];

      // Para ASSIST, buscar também eventos GOAL com assist_player_id
      if (eventType === "ASSIST") {
        const { data: goalEvents } = await supabase
          .from("match_events")
          .select("player_id, assist_player_id, type, quantity")
          .in("match_id", matchIds)
          .eq("type", "GOAL")
          .not("assist_player_id", "is", null);

        if (goalEvents && goalEvents.length > 0) {
          const assistFromGoals = goalEvents.map((e) => ({
            player_id: e.assist_player_id,
            assist_player_id: e.assist_player_id,
            type: "ASSIST",
            quantity: e.quantity ?? 1,
          }));
          allEvents = [...allEvents, ...assistFromGoals];
        }
      }

      if (allEvents.length === 0) {
        return [];
      }

      const allPlayerIds = Array.from(
        new Set(
          allEvents
            .flatMap((e) => [e.player_id, e.assist_player_id])
            .filter((id): id is string => Boolean(id))
        )
      );

      if (allPlayerIds.length === 0) {
        return allEvents.map((e) => ({
          player_id: e.player_id,
          assist_player_id: e.assist_player_id,
          type: e.type,
          quantity: e.quantity ?? 1,
          players: null,
          assist_player: null,
        }));
      }

      const { data: playersData, error: playersError } = await supabase
        .from("players")
        .select(`
          id,
          name,
          photo_url,
          teams:team_id (
            id,
            name,
            badge_url
          )
        `)
        .in("id", allPlayerIds);

      if (playersError) {
        console.error("[StatisticsRepository] Erro ao buscar dados dos jogadores:", playersError.message);
      }

      const playersMap = new Map((playersData || []).map((p: any) => [p.id, p]));

      return allEvents.map((e) => ({
        player_id: e.player_id,
        assist_player_id: e.assist_player_id,
        type: e.type,
        quantity: e.quantity ?? 1,
        players: e.player_id ? playersMap.get(e.player_id) || null : null,
        assist_player: e.assist_player_id ? playersMap.get(e.assist_player_id) || null : null,
      }));
    } catch (err) {
      console.error("[StatisticsRepository] Erro inesperado:", err);
      return [];
    }
  }
}