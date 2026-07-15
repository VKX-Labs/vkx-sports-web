import { supabase } from "@/lib/supabase";
import {
  Player,
  CreatePlayerInput,
  UpdatePlayerInput,
} from "../types/player";

export class PlayerRepository {
  static async getPlayersBySeason(
    seasonId: string
  ): Promise<Player[]> {
    const { data, error } = await supabase
      .from("players")
      .select(`
        *,
        teams:team_id (
          name
        )
      `)
      .eq("season_id", seasonId)
      .order("name", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((player: any) => ({
      ...player,
      team_name: player.teams?.name ?? "Sem equipe",
    }));
  }

  // Modificado para receber o championshipId e buscar a season_id correta no banco
  static async createPlayer(
    championshipId: string,
    player: CreatePlayerInput
  ): Promise<Player> {
    // 1. Busca a temporada vinculada a este campeonato na tabela 'seasons'
    const { data: seasonData, error: seasonError } = await supabase
      .from("seasons")
      .select("id")
      .eq("championship_id", championshipId)
      .single();

    if (seasonError || !seasonData) {
      throw new Error(
        seasonError?.message ?? "Não foi possível encontrar uma temporada ativa para este campeonato."
      );
    }

    // 2. Insere o jogador utilizando a season_id encontrada
    const { data, error } = await supabase
      .from("players")
      .insert({
        season_id: seasonData.id,
        team_id: player.team_id ?? null,
        name: player.name,
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
    player: UpdatePlayerInput
  ): Promise<Player> {
    const { data, error } = await supabase
      .from("players")
      .update({
        name: player.name,
        team_id: player.team_id,
        photo_url: player.photo_url,
      })
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