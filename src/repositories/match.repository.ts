import { supabase } from "@/lib/supabase";
import { generateRoundRobin, GenerationTeam } from "@/utils/generators/round-robin";
import type { Match, MatchEventInput } from "@/types/match";
import type { Player } from "@/types/player";

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
    options: { shuffle?: boolean; doubleRound?: boolean } = {}
  ) {
    const { data: teams, error: teamsError } = await supabase
      .from("teams")
      .select("id, name")
      .eq("season_id", seasonId);

    if (teamsError) {
      throw new Error(`Erro ao buscar equipes: ${teamsError.message}`);
    }

    if (!teams || teams.length < 2) {
      throw new Error(
        "É necessário cadastrar pelo menos 2 equipes para gerar confrontos."
      );
    }

    const { error: deleteError } = await supabase
      .from("rounds")
      .delete()
      .eq("season_id", seasonId);

    if (deleteError) {
      throw new Error(
        `Erro ao limpar rodadas anteriores: ${deleteError.message}`
      );
    }

    const generatedRounds = generateRoundRobin(
      teams.map<GenerationTeam>(({ id, name }) => ({ id, name })),
      options
    );

    for (const round of generatedRounds) {
      const { data: insertedRound, error: roundError } = await supabase
        .from("rounds")
        .insert({
          season_id: seasonId,
          name: `${round.number}ª Rodada`,
          round_number: round.number,
        })
        .select()
        .single();

      if (roundError || !insertedRound) {
        throw new Error(`Erro ao criar a rodada ${round.number}`);
      }

      const matchesToInsert = round.matches
        .filter(
          (match) => match.home_team_id != null && match.away_team_id != null
        )
        .map((match) => ({
          home_team_id: match.home_team_id,
          away_team_id: match.away_team_id,
          round_id: insertedRound.id,
          status: "scheduled",
        }));

      if (!matchesToInsert.length) {
        continue;
      }

      const { error: matchesError } = await supabase
        .from("matches")
        .insert(matchesToInsert);

      if (matchesError) {
        throw new Error(
          `Erro ao salvar os jogos da rodada ${round.number}: ${matchesError.message}`
        );
      }
    }

    return true;
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
    status: string = "finished"
  ): Promise<void> {
    const { error } = await supabase
      .from("matches")
      .update({
        home_score: homeScore,
        away_score: awayScore,
        status: status
      })
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
        event_type: event.event_type
      });

    if (error) throw new Error(`Erro ao registrar evento: ${error.message}`);
  }
};