import { supabase } from "@/lib/supabase";
import {
  Player,
  PlayerStats,
  CreatePlayerInput,
  UpdatePlayerInput,
} from "@/types/player";

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
    const { error } = await supabase
      .from("players")
      .delete()
      .eq("id", playerId);

    if (error) {
      throw new Error(error.message);
    }
  }

  static async getPlayerDerivedStats(playerId: string): Promise<PlayerStats> {
    const { data: events, error } = await supabase
      .from("match_events")
      .select("event_type")
      .eq("player_id", playerId);

    // Retorno padrão inicial (tudo em zero caso não haja eventos ou aconteça erro)
    const initialStats: PlayerStats = {
      matches: 0,
      goals: 0,
      assists: 0,
      yellow_cards: 0,
      red_cards: 0,
      minutes_played: 0,
      saves: 0,
    };

    if (error || !events || events.length === 0) {
      return initialStats;
    }

    return {
      matches: 0,
      goals: events.filter((e) => e.event_type === "GOAL").length,
      assists: events.filter((e) => e.event_type === "ASSIST").length,
      yellow_cards: events.filter((e) => e.event_type === "YELLOW_CARD").length,
      red_cards: events.filter((e) => e.event_type === "RED_CARD").length,
      saves: events.filter((e) => e.event_type === "SAVE").length,
      minutes_played: 0,
    };
  }
}