import { supabase } from "@/lib/supabase";
import {
  Player,
  PlayerStats,
  CreatePlayerInput,
  UpdatePlayerInput,
} from "@/types/player";
import {
  assertChampionshipEditor,
  assertPlayerEditor,
} from "@/services/ownership";

export class PlayerRepository {
  static async getPlayersBySeason(
    championshipOrSeasonId: string
  ): Promise<Player[]> {
    const { data: seasonData } = await supabase
      .from("seasons")
      .select("id")
      .eq("championship_id", championshipOrSeasonId)
      .maybeSingle();

    const targetSeasonId = seasonData?.id || championshipOrSeasonId;

    const { data, error } = await supabase
      .from("players")
      .select(`
        *,
        teams:team_id (
          name
        )
      `)
      .eq("season_id", targetSeasonId)
      .order("name", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((player) => ({
      ...player,
      team_name:
        (player as Record<string, unknown> & {
          teams?: { name?: string } | null;
        }).teams?.name ?? "Sem equipe",
    })) as Player[];
  }

  static async getPlayerById(playerId: string): Promise<Player | null> {
    const { data, error } = await supabase
      .from("players")
      .select(`
        *,
        teams:team_id (
          name
        )
      `)
      .eq("id", playerId)
      .maybeSingle();

    if (error || !data) return null;

    return {
      ...data,
      team_name:
        (data as Record<string, unknown> & {
          teams?: { name?: string } | null;
        }).teams?.name ?? "Sem equipe",
    } as Player;
  }

  static async createPlayer(
    championshipId: string,
    player: CreatePlayerInput
  ): Promise<Player> {
    await assertChampionshipEditor(championshipId);

    const { data: seasonData, error: seasonError } = await supabase
      .from("seasons")
      .select("id")
      .eq("championship_id", championshipId)
      .single();

    if (seasonError || !seasonData) {
      throw new Error(
        seasonError?.message ??
          "Não foi possível encontrar uma temporada ativa para este campeonato."
      );
    }

    const { data, error } = await supabase
      .from("players")
      .insert({
        season_id: seasonData.id,
        team_id: player.team_id ?? null,
        name: player.name.trim(),
        photo_url: player.photo_url ?? null,
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  static async updatePlayer(
    playerId: string,
    player: Partial<UpdatePlayerInput>
  ): Promise<Player> {
    await assertPlayerEditor(playerId);

    const updateData: Record<string, unknown> = {};

    if (player.name !== undefined) updateData.name = player.name;
    if (player.team_id !== undefined) updateData.team_id = player.team_id;
    if (player.photo_url !== undefined) updateData.photo_url = player.photo_url;

    const { data, error } = await supabase
      .from("players")
      .update(updateData)
      .eq("id", playerId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  static async deletePlayer(playerId: string): Promise<void> {
    await assertPlayerEditor(playerId);

    const { error } = await supabase
      .from("players")
      .delete()
      .eq("id", playerId);

    if (error) {
      throw new Error(error.message);
    }
  }

  static async getPlayerDerivedStats(playerId: string): Promise<PlayerStats> {
    const initialStats: PlayerStats = {
      matches: 0,
      goals: 0,
      assists: 0,
      yellow_cards: 0,
      red_cards: 0,
      saves: 0,
      rating: 0.0,
    };

    const { data: events, error } = await supabase
      .from("match_events")
      .select("type, player_id, assist_player_id, goalkeeper_id, rating")
      .or(`player_id.eq.${playerId},assist_player_id.eq.${playerId},goalkeeper_id.eq.${playerId}`);

    if (error || !events || events.length === 0) {
      return initialStats;
    }

    const goals = events.filter((e) => e.type === "GOAL" && e.player_id === playerId).length;
    const assists = events.filter(
      (e) => e.type === "ASSIST" || e.assist_player_id === playerId
    ).length;
    const yellow_cards = events.filter((e) => e.type === "YELLOW_CARD" && e.player_id === playerId).length;
    const red_cards = events.filter((e) => e.type === "RED_CARD" && e.player_id === playerId).length;
    const saves = events.filter((e) => e.type === "SAVE" && e.player_id === playerId).length;

    const ratedEvents = events.filter((e) => e.rating !== null && e.rating !== undefined);
    let rating = 0.0;

    if (ratedEvents.length > 0) {
      const totalRating = ratedEvents.reduce((acc, curr) => acc + (Number(curr.rating) || 0), 0);
      rating = Number((totalRating / ratedEvents.length).toFixed(1));
    }

    return {
      matches: 0,
      goals,
      assists,
      yellow_cards,
      red_cards,
      saves,
      rating,
    };
  }
}