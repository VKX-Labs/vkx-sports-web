import { supabase } from "@/lib/supabase";
import { PlayerRepository } from "@/repositories/player.repository";
import type {
  Player,
  PlayerStats,
  CreatePlayerInput,
  UpdatePlayerInput,
} from "@/types/player";

export class PlayerService {
  static async listPlayers(seasonId: string): Promise<Player[]> {
    return PlayerRepository.getPlayersBySeason(seasonId);
  }

  static async getPlayer(playerId: string): Promise<Player | null> {
    return PlayerRepository.getPlayerById(playerId);
  }

  static async registerPlayer(
    championshipId: string,
    input: CreatePlayerInput
  ): Promise<Player> {
    if (!input.name.trim()) {
      throw new Error("O nome do jogador é obrigatório.");
    }

    return PlayerRepository.createPlayer(championshipId, input);
  }

  static async transferPlayerToTeam(
    playerId: string,
    teamId: string | null
  ): Promise<Player> {
    return PlayerRepository.updatePlayer(playerId, {
      team_id: teamId,
    });
  }

  static async editPlayer(
    playerId: string,
    input: UpdatePlayerInput
  ): Promise<Player> {
    return PlayerRepository.updatePlayer(playerId, input);
  }

  static async removePlayer(playerId: string): Promise<void> {
    return PlayerRepository.deletePlayer(playerId);
  }

  static async uploadPhoto(file: File): Promise<string> {
    const fileExt = file.name.split(".").pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("players")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Erro ao fazer upload da foto: ${uploadError.message}`);
    }

    const { data } = supabase.storage
      .from("players")
      .getPublicUrl(filePath);

    if (!data.publicUrl) {
      throw new Error("Não foi possível gerar a URL pública da foto.");
    }

    return data.publicUrl;
  }

  static async getPlayerStats(playerId: string): Promise<PlayerStats> {
    return PlayerRepository.getPlayerDerivedStats(playerId);
  }
}