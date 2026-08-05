import { supabase } from "@/lib/supabase";
import type { Match, MatchEventInput } from "@/types/match";
import type { Player } from "@/types/player";
import {
  assertSeasonEditor,
  assertMatchEditor,
  assertRoundEditor,
} from "@/services/ownership";
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
    return TournamentGeneratorRepository.generateTournament(
      championshipId,
      seasonId,
      options
    );
  },

  async generateKnockoutTournament(
    seasonId: string,
    options: GenerateTournamentOptions = {}
  ) {
    return TournamentGeneratorRepository.generateKnockoutTournament(
      seasonId,
      options
    );
  },

  async generateRoundRobinTournament(
    seasonId: string,
    options: GenerateTournamentOptions = {}
  ) {
    return TournamentGeneratorRepository.generateRoundRobinTournament(
      seasonId,
      options
    );
  },

  async createRound(
    seasonId: string,
    name: string,
    roundNumber: number
  ) {
    await assertSeasonEditor(seasonId);

    const { data, error } = await supabase
      .from("rounds")
      .insert([
        {
          season_id: seasonId,
          name,
          round_number: roundNumber,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteRound(roundId: string): Promise<boolean> {
    await assertRoundEditor(roundId);

    try {
      const { data: matches, error: fetchMatchesError } = await supabase
        .from("matches")
        .select("id")
        .eq("round_id", roundId);

      if (fetchMatchesError) {
        throw new Error(`Erro ao buscar jogos da rodada: ${fetchMatchesError.message}`);
      }

      if (matches && matches.length > 0) {
        const matchIds = matches.map((match) => match.id);

        await supabase
          .from("match_events")
          .delete()
          .in("match_id", matchIds);

        await supabase
          .from("match_player_stats")
          .delete()
          .in("match_id", matchIds);

        const { error: matchesError } = await supabase
          .from("matches")
          .delete()
          .eq("round_id", roundId);

        if (matchesError) {
          throw new Error(`Erro ao excluir partidas da rodada: ${matchesError.message}`);
        }
      }

      const { error: roundError } = await supabase
        .from("rounds")
        .delete()
        .eq("id", roundId);

      if (roundError) {
        throw new Error(`Erro ao excluir rodada: ${roundError.message}`);
      }

      return true;
    } catch (error: any) {
      console.error("Erro em deleteRound:", error);
      throw error;
    }
  },

  async createManualMatch({
    seasonId,
    roundId,
    homeTeamId,
    awayTeamId,
  }: {
    seasonId: string;
    roundId: string;
    homeTeamId: string;
    awayTeamId: string;
  }) {
    await assertSeasonEditor(seasonId);

    if (homeTeamId === awayTeamId) {
      throw new Error("O time mandante e visitante não podem ser iguais.");
    }

    const { data, error } = await supabase
      .from("matches")
      .insert([
        {
          season_id: seasonId,
          round_id: roundId,
          home_team_id: homeTeamId,
          away_team_id: awayTeamId,
          status: "AGENDADO",
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateMatch({
    matchId,
    homeTeamId,
    awayTeamId,
    date,
  }: {
    matchId: string;
    homeTeamId: string;
    awayTeamId: string;
    date?: string | null;
  }) {
    await assertMatchEditor(matchId);

    if (homeTeamId === awayTeamId) {
      throw new Error("O time mandante e visitante não podem ser iguais.");
    }

    const { data, error } = await supabase
      .from("matches")
      .update({
        home_team_id: homeTeamId,
        away_team_id: awayTeamId,
        ...(date !== undefined ? { date } : {}),
      })
      .eq("id", matchId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteMatch(matchId: string): Promise<boolean> {
    await assertMatchEditor(matchId);
    await this.clearMatchEvents(matchId);

    const { error } = await supabase
      .from("matches")
      .delete()
      .eq("id", matchId);

    if (error) {
      throw new Error(`Erro ao excluir partida: ${error.message}`);
    }

    return true;
  },

  async getPlayoffMatches(seasonId: string): Promise<Match[]> {
    const { data, error } = await supabase
      .from("matches")
      .select(
        `*,
        home_team:teams!home_team_id(id, name, badge_url),
        away_team:teams!away_team_id(id, name, badge_url),
        winner:teams!winner_id(id, name, badge_url)`
      )
      .eq("season_id", seasonId)
      .not("phase", "is", null)
      .order("bracket_position", { ascending: true });

    if (error) {
      throw new Error(`Erro ao carregar chaveamento: ${error.message}`);
    }

    return data as Match[];
  },

  async getMatchesByRound(roundId: string): Promise<Match[]> {
    const { data, error } = await supabase
      .from("matches")
      .select(
        `*,
        home_team:teams!home_team_id(id, name, badge_url),
        away_team:teams!away_team_id(id, name, badge_url)`
      )
      .eq("round_id", roundId);

    if (error) {
      throw new Error(`Erro ao carregar partidas: ${error.message}`);
    }

    return data as Match[];
  },

  async getPlayersByTeam(teamId: string): Promise<Player[]> {
    const { data, error } = await supabase
      .from("players")
      .select("*")
      .eq("team_id", teamId)
      .order("name");

    if (error) {
      throw new Error(`Erro ao buscar atletas do time: ${error.message}`);
    }

    return data as Player[];
  },

  async updateMatchScore(
    matchId: string,
    homeScore: number,
    awayScore: number,
    status = "finished",
    winnerId?: string | null,
    homeScoreLeg2?: number | null,
    awayScoreLeg2?: number | null,
    penaltiesHome?: number | null,
    penaltiesAway?: number | null
  ): Promise<void> {
    await assertMatchEditor(matchId);

    const updateData: Partial<Match> = {
      home_score: homeScore,
      away_score: awayScore,
      status: status as Match["status"],
    };

    if (winnerId !== undefined) updateData.winner_id = winnerId;
    if (homeScoreLeg2 !== undefined) {
      updateData.home_score_leg2 = homeScoreLeg2;
    }
    if (awayScoreLeg2 !== undefined) {
      updateData.away_score_leg2 = awayScoreLeg2;
    }
    if (penaltiesHome !== undefined) {
      updateData.penalties_home = penaltiesHome;
    }
    if (penaltiesAway !== undefined) {
      updateData.penalties_away = penaltiesAway;
    }

    const { error } = await supabase
      .from("matches")
      .update(updateData)
      .eq("id", matchId);

    if (error) {
      throw new Error(`Erro ao atualizar placar: ${error.message}`);
    }
  },

  async clearMatchEvents(matchId: string): Promise<void> {
    await assertMatchEditor(matchId);

    const { error } = await supabase
      .from("match_events")
      .delete()
      .eq("match_id", matchId);

    if (error) {
      throw new Error(
        `Erro ao limpar eventos da partida: ${error.message}`
      );
    }
  },

  async addMatchEvent(event: MatchEventInput): Promise<void> {
    await assertMatchEditor(event.match_id);

    const { error } = await supabase.from("match_events").insert({
      match_id: event.match_id,
      player_id: event.player_id,
      team_id: event.team_id,
      type: event.type,
    });

    if (error) {
      throw new Error(`Erro ao registrar evento: ${error.message}`);
    }
  },
};