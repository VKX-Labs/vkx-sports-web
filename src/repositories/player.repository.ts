import { supabase } from "@/lib/supabase";
import {
  Player,
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
    const { data, error } = await supabase
      .from("players")
      .update(player)
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
}