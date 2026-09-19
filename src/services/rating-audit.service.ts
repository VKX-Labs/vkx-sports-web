import { supabase } from "@/lib/supabase";

export type RatingAuditStatus = "SUCCESS" | "WARNING" | "ERROR";

export interface RatingAuditPlayer {
  player_id: string;
  player_name: string;
  rating: number;
  new_average_rating: number;
}

export interface RatingAuditPayload {
  match_ids: string[];
  players: RatingAuditPlayer[];
  error?: string;
  mode?: "NATIVE_ENGINE";
  groq_mode?: "json" | "text" | "NATIVE_ENGINE";
  ratings_count?: number;
  matches_count?: number;
}

export interface RatingAuditLog {
  id: string;
  championship_id: string;
  season_id: string;
  round_number: number;
  round_name: string;
  status: RatingAuditStatus;
  payload: RatingAuditPayload;
  created_at: string;
  created_by: string | null;
}

export interface RatingAuditSummary {
  seasonId: string;
  roundNumber: number;
  roundName: string;
  status: RatingAuditStatus;
  matchesProcessed: number;
  playersRated: number;
  error?: string;
}

export class RatingAuditService {
  static async listByChampionship(
    championshipId: string,
    options: { limit?: number } = {}
  ): Promise<RatingAuditLog[]> {
    const limit = options.limit ?? 25;

    const { data, error } = await supabase
      .from("rating_audit_logs")
      .select("id, championship_id, season_id, round_number, round_name, status, payload, created_at, created_by")
      .eq("championship_id", championshipId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      const message = `${error.message || ""}`.toLowerCase();
      if (
        message.includes("does not exist") ||
        message.includes("not found") ||
        message.includes("could not find the table") ||
        message.includes("relation")
      ) {
        return [];
      }
      throw new Error(`Erro ao buscar logs de auditoria de notas: ${error.message}`);
    }

    return (data || []) as unknown as RatingAuditLog[];
  }

  static async listBySeason(
    seasonId: string,
    roundNumber: number
  ): Promise<RatingAuditLog[]> {
    const { data, error } = await supabase
      .from("rating_audit_logs")
      .select("id, championship_id, season_id, round_number, round_name, status, payload, created_at, created_by")
      .eq("season_id", seasonId)
      .eq("round_number", roundNumber)
      .order("created_at", { ascending: false });

    if (error) {
      const message = `${error.message || ""}`.toLowerCase();
      if (
        message.includes("does not exist") ||
        message.includes("not found") ||
        message.includes("could not find the table") ||
        message.includes("relation")
      ) {
        return [];
      }
      throw new Error(`Erro ao buscar logs da rodada: ${error.message}`);
    }

    return (data || []) as unknown as RatingAuditLog[];
  }
}