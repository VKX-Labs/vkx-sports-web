import { supabase } from "@/lib/supabase";
import type { Match, MatchEventInput } from "@/types/match";
import type { Player } from "@/types/player";
import {
  TournamentGeneratorRepository,
  GenerateTournamentOptions,
} from "./tournament-generator.repository";

export type { GenerateTournamentOptions };

export const MatchRepository = {
  async hasGeneratedRounds(seasonId: string): Promise<boolean> {
    const { count, error } = await supabase
      .from("rounds")
      .select("id", { count: "exact", head: true })
      .eq("season_id", seasonId);

    return !error && (count ?? 0) > 0;
  },

  async generateTournament(
    championshipId: string,
    seasonId: string,
    options: GenerateTournamentOptions = {}
  ) {
    return TournamentGeneratorRepository.generateTournament(championshipId, seasonId, options);
  },

  async generateKnockoutTournament(
    seasonId: string,
    options: GenerateTournamentOptions = {}
  ) {
    return TournamentGeneratorRepository.generateKnockoutTournament(seasonId, options);
  },

  async generateRoundRobinTournament(
    seasonId: string,
    options: GenerateTournamentOptions = {}
  ) {
    return TournamentGeneratorRepository.generateRoundRobinTournament(seasonId, options);
  },

  async getPlayoffMatches(seasonId: string): Promise<Match[]> {
    const { data, error } = await supabase
      .from("matches")
      .select(`
        *,
        home_team:teams!home_team_id(id, name, badge_url),
        away_team:teams!away_team_id(id, name, badge_url)
      `)
      .eq("season_id", seasonId)
      .not("phase", "is", null)
      .order("bracket_position", { ascending: true });

    if (error) throw new Error(`Erro ao carregar chaveamento: ${error.message}`);
    return data as Match[];
  },

  async getMatchesByRound(roundId: string): Promise<Match[]> {
    const { data, error } = await supabase
      .from("matches")
      .select(`
        *,
        home_team:teams!home_team_id(id, name, badge_url),
        away_team:teams!away_team_id(id, name, badge_url)
      `)
      .eq("round_id", roundId);

    if (error) throw new Error(`Erro ao carregar partidas: ${error.message}`);
    return data as Match[];
  },

  async getPlayersByTeam(teamId: string): Promise<Player[]> {
    const { data, error } = await supabase
      .from("players")
      .select("*")
      .eq("team_id", teamId)
      .order("name", { ascending: true });

    if (error) throw new Error(`Erro ao buscar atletas do time: ${error.message}`);
    return data as Player[];
  },

  async updateMatchScore(
    matchId: string,
    homeScore: number,
    awayScore: number,
    status: string = "finished",
    winnerId?: string | null
  ): Promise<void> {
    const updateData: Partial<Pick<Match, "home_score" | "away_score" | "status" | "winner_id">> = {
      home_score: homeScore,
      away_score: awayScore,
      status: status as Match["status"],
    };

    if (winnerId !== undefined) {
      updateData.winner_id = winnerId;
    }

    const { error } = await supabase
      .from("matches")
      .update(updateData)
      .eq("id", matchId);

    if (error) throw new Error(`Erro ao atualizar placar: ${error.message}`);
  },

  async clearMatchEvents(matchId: string): Promise<void> {
    const { error } = await supabase
      .from("match_events")
      .delete()
      .eq("match_id", matchId);

    if (error) throw new Error(`Erro ao limpar eventos da partida: ${error.message}`);
  },

  async addMatchEvent(event: MatchEventInput): Promise<void> {
    const { error } = await supabase
      .from("match_events")
      .insert({
        match_id: event.match_id,
        player_id: event.player_id,
        team_id: event.team_id,
        event_type: event.event_type,
      });

    if (error) throw new Error(`Erro ao registrar evento: ${error.message}`);
  },
};
