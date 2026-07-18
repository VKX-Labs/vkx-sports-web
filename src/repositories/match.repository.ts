import { supabase } from "@/lib/supabase";
import { generateRoundRobin, GenerationTeam } from "@/utils/generators/round-robin";

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
};