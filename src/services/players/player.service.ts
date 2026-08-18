import { supabase } from "@/lib/supabase";
import { PlayerRepository } from "@/repositories/player.repository";
import type {
  Player,
  PlayerStats,
  CreatePlayerInput,
  UpdatePlayerInput,
} from "@/types/player";
import { getAuthenticatedUserId } from "@/services/auth.service";

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

    const userId = await getAuthenticatedUserId();

    const { data: championship } = await supabase
      .from("championships")
      .select("user_id")
      .eq("id", championshipId)
      .single();

    if (!championship) {
      throw new Error("Campeonato não encontrado.");
    }

    if (championship.user_id !== userId) {
      const { data: member } = await supabase
        .from("championship_members")
        .select("id")
        .eq("championship_id", championshipId)
        .eq("user_id", userId)
        .in("role", ["EDITOR", "ADMIN"])
        .maybeSingle();

      if (!member) {
        throw new Error(
          "Você não tem permissão para adicionar jogadores neste campeonato."
        );
      }
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
    try {
      const player = await PlayerRepository.getPlayerById(playerId);

      const [mainEventsRes, assistEventsRes] = await Promise.all([
        supabase
          .from("match_events")
          .select("*")
          .eq("player_id", playerId),
        supabase
          .from("match_events")
          .select("*")
          .eq("assist_player_id", playerId)
      ]);

      if (mainEventsRes.error) console.error("Erro busca mainEvents:", mainEventsRes.error);
      if (assistEventsRes.error) console.error("Erro busca assistEvents:", assistEventsRes.error);

      const mainEvents = mainEventsRes.data || [];
      const assistEvents = assistEventsRes.data || [];

      const allEventsMap = new Map();
      [...mainEvents, ...assistEvents].forEach((evt) => {
        allEventsMap.set(evt.id, evt);
      });
      const eventList = Array.from(allEventsMap.values());

      let totalMatches = 0;
      if (player?.team_id) {
        const { count } = await supabase
          .from("matches")
          .select("id", { count: "exact", head: true })
          .eq("status", "finished")
          .or(`home_team_id.eq.${player.team_id},away_team_id.eq.${player.team_id}`);

        totalMatches = count || 0;
      }

      const uniqueMatchesFromEvents = new Set(eventList.map((e) => e.match_id)).size;
      const finalMatchCount = Math.max(totalMatches, uniqueMatchesFromEvents);

      const { data: playerRow } = await supabase
        .from("players")
        .select("average_rating")
        .eq("id", playerId)
        .maybeSingle();

      const averageRating =
        playerRow?.average_rating != null ? Number(playerRow.average_rating) : 0;

      let goals = 0;
      let assists = 0;
      let yellowCards = 0;
      let redCards = 0;
      let saves = 0;
      let tackles = 0;

      eventList.forEach((e: any) => {
        const rawType = String(e.type || e.event_type || "").trim().toUpperCase();
        const qty = Math.max(1, Number(e.quantity) || 1);

        if (String(e.player_id) === String(playerId)) {
          if (["GOAL", "GOL"].includes(rawType)) goals += qty;
          if (["YELLOW_CARD", "YELLOW", "AMARELO", "CARTAO_AMARELO"].includes(rawType)) yellowCards += qty;
          if (["RED_CARD", "RED", "VERMELHO", "CARTAO_VERMELHO"].includes(rawType)) redCards += qty;
          if (["SAVE", "DEFESA"].includes(rawType)) saves += qty;
          if (["TACKLE", "DESARME"].includes(rawType)) tackles += qty;
        }

        if (String(e.assist_player_id) === String(playerId)) {
          assists += qty;
        } else if (String(e.player_id) === String(playerId) && ["ASSIST", "ASSISTENCIA", "ASSISTÊNCIA"].includes(rawType)) {
          assists += qty;
        }
      });

      return {
        matches: finalMatchCount,
        goals,
        assists,
        yellow_cards: yellowCards,
        red_cards: redCards,
        saves,
        tackles,
        rating: averageRating,
      };
    } catch (err) {
      console.error("Erro em getPlayerStats:", err);
      return {
        matches: 0,
        goals: 0,
        assists: 0,
        yellow_cards: 0,
        red_cards: 0,
        saves: 0,
        tackles: 0,
        rating: 0.0,
      };
    }
  }
}