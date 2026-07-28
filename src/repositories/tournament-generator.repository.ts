import { supabase } from "@/lib/supabase";
import { generateRoundRobin, GenerationTeam } from "@/utils/generators/round-robin";
import { generateKnockoutBracket } from "@/utils/generators/bracket";

export interface GenerateTournamentOptions {
  tournamentType?: "ROUND_ROBIN" | "MATA_MATA";
  shuffle?: boolean;
  doubleRound?: boolean;
  twoLegged?: boolean;
  hasPrePlayoffs?: boolean;
}

export const TournamentGeneratorRepository = {
  async generateTournament(
    championshipId: string,
    seasonId: string,
    options: GenerateTournamentOptions = {}
  ) {
    const tournamentType = options.tournamentType || "ROUND_ROBIN";

    if (tournamentType === "MATA_MATA") {
      return this.generateKnockoutTournament(seasonId, options);
    }

    return this.generateRoundRobinTournament(seasonId, options);
  },

  async generateKnockoutTournament(
    seasonId: string,
    _options: GenerateTournamentOptions = {}
  ) {
    const { error: seasonError } = await supabase
      .from("seasons")
      .update({ tournament_type: "MATA_MATA" })
      .eq("id", seasonId);

    if (seasonError) {
      console.warn(`Aviso ao atualizar tipo na temporada: ${seasonError.message}`);
    }

    const { data: teams, error: teamsError } = await supabase
      .from("teams")
      .select("id, name")
      .eq("season_id", seasonId);

    if (teamsError) {
      throw new Error(`Erro ao buscar equipes: ${teamsError.message}`);
    }

    if (!teams || teams.length < 2) {
      throw new Error("É necessário cadastrar pelo menos 2 equipes para gerar o mata-mata.");
    }

    await supabase.from("matches").delete().eq("season_id", seasonId);
    await supabase.from("rounds").delete().eq("season_id", seasonId);

    const generated = generateKnockoutBracket(teams);

    const uniquePhases = Array.from(new Set(generated.map((m) => m.phase)));
    const createdRoundsMap = new Map<string, string>();

    for (let index = 0; index < uniquePhases.length; index++) {
      const phaseName = uniquePhases[index];
      const { data: insertedRound, error: roundErr } = await supabase
        .from("rounds")
        .insert({
          season_id: seasonId,
          name: phaseName,
          round_number: index + 1,
        })
        .select("id, name")
        .single();

      if (!roundErr && insertedRound) {
        createdRoundsMap.set(insertedRound.name, insertedRound.id);
      }
    }

    const insertResult = await supabase
      .from("matches")
      .insert(
        generated.map((node) => ({
          season_id: seasonId,
          round_id: createdRoundsMap.get(node.phase) || null,
          phase: node.phase,
          bracket_position: node.bracket_position,
          home_team_id: node.home_team_id,
          away_team_id: node.away_team_id,
          status: "scheduled",
        }))
      )
      .select("id, phase, bracket_position");

    if (insertResult.error) {
      throw new Error(`Erro ao salvar chaves do mata-mata: ${insertResult.error.message}`);
    }

    const insertedMatches = insertResult.data ?? [];
    const tempIdToDbId = new Map<string, string>();

    for (let i = 0; i < generated.length; i++) {
      tempIdToDbId.set(String(i), insertedMatches[i].id);
    }

    for (let i = 0; i < generated.length; i++) {
      const nextIdx = generated[i].next_match_index;
      if (nextIdx >= 0 && tempIdToDbId.has(String(nextIdx))) {
        await supabase
          .from("matches")
          .update({ next_match_id: tempIdToDbId.get(String(nextIdx)) })
          .eq("id", insertedMatches[i].id);
      }
    }

    return true;
  },

  async generateRoundRobinTournament(
    seasonId: string,
    options: GenerateTournamentOptions = {}
  ) {
    await supabase
      .from("seasons")
      .update({ tournament_type: "pontos_corridos" })
      .eq("id", seasonId);

    const { data: teams, error: teamsError } = await supabase
      .from("teams")
      .select("id, name")
      .eq("season_id", seasonId);

    if (teamsError) {
      throw new Error(`Erro ao buscar equipes: ${teamsError.message}`);
    }

    if (!teams || teams.length < 2) {
      throw new Error("É necessário cadastrar pelo menos 2 equipes para gerar confrontos.");
    }

    const { error: deleteError } = await supabase
      .from("rounds")
      .delete()
      .eq("season_id", seasonId);

    if (deleteError) {
      throw new Error(`Erro ao limpar rodadas anteriores: ${deleteError.message}`);
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
        .filter((match) => match.home_team_id != null && match.away_team_id != null)
        .map((match) => ({
          season_id: seasonId,
          home_team_id: match.home_team_id,
          away_team_id: match.away_team_id,
          round_id: insertedRound.id,
          status: "scheduled",
        }));

      if (!matchesToInsert.length) continue;

      const { error: matchesError } = await supabase.from("matches").insert(matchesToInsert);

      if (matchesError) {
        throw new Error(`Erro ao salvar os jogos da rodada ${round.number}: ${matchesError.message}`);
      }
    }

    return true;
  },
};