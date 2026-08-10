import { supabase } from "@/lib/supabase";
import { generateRoundRobin, GenerationTeam } from "@/utils/generators/round-robin";
import { generateKnockoutBracket } from "@/utils/generators/bracket";
import { normalizeTournamentType } from "@/utils";
import { TournamentType, KnockoutRules, isPhaseTwoLegged, PlayoffPhase, getPhaseDisplayName, getPhaseRoundName, MatchLeg } from "@/types/tournament";
import { assertSeasonEditor } from "@/services/ownership";

export interface GenerateTournamentOptions {
  tournamentType?: TournamentType | "ROUND_ROBIN";
  shuffle?: boolean;
  doubleRound?: boolean;
  twoLegged?: boolean;
  hasPrePlayoffs?: boolean;
  knockoutRules?: KnockoutRules;
}

export const TournamentGeneratorRepository = {
  async generateTournament(
    championshipId: string,
    seasonId: string,
    options: GenerateTournamentOptions = {}
  ) {
    const rawType = options.tournamentType || "PONTOS_CORRIDOS";
    const tournamentType = rawType === "ROUND_ROBIN" ? "PONTOS_CORRIDOS" : normalizeTournamentType(rawType);

    if (tournamentType === "MATA_MATA" || tournamentType === "COPA") {
      return this.generateKnockoutTournament(seasonId, options);
    }

    return this.generateRoundRobinTournament(seasonId, options);
  },

  async generateKnockoutTournament(
    seasonId: string,
    options: GenerateTournamentOptions = {}
  ) {
    await assertSeasonEditor(seasonId);

    try {
      const rawType = options.tournamentType || "MATA_MATA";
      const canonicalType = rawType === "ROUND_ROBIN" ? "MATA_MATA" : normalizeTournamentType(rawType);
      const knockoutType: "MATA_MATA" | "COPA" =
        canonicalType === "COPA" ? "COPA" : "MATA_MATA";

      const { error: seasonError } = await supabase
        .from("seasons")
        .update({ tournament_type: knockoutType })
        .eq("id", seasonId);

      if (seasonError) {
        console.warn(`Aviso ao atualizar tipo na temporada: ${seasonError.message}`);
      }

      const { data: teams, error: teamsError } = await supabase
        .from("teams")
        .select("id, name")
        .eq("season_id", seasonId);

      if (teamsError) {
        console.error("Erro ao buscar equipes do mata-mata:", {
          message: teamsError.message,
          details: teamsError.details,
          hint: teamsError.hint,
          code: teamsError.code,
        });
        throw new Error(`Erro ao buscar equipes: ${teamsError.message}`);
      }

      if (!teams || teams.length < 2) {
        const message =
          "É necessário cadastrar pelo menos 2 equipes para gerar o mata-mata.";
        console.error(message, { teamCount: teams?.length ?? 0 });
        throw new Error(message);
      }

      const { error: deleteMatchesError } = await supabase
        .from("matches")
        .delete()
        .eq("season_id", seasonId);

      if (deleteMatchesError) {
        console.error("Erro ao apagar partidas antigas antes de gerar o mata-mata:", {
          message: deleteMatchesError.message,
          details: deleteMatchesError.details,
          hint: deleteMatchesError.hint,
          code: deleteMatchesError.code,
        });
        throw new Error(`Erro ao apagar partidas antigas: ${deleteMatchesError.message}`);
      }

      const { error: deleteRoundsError } = await supabase
        .from("rounds")
        .delete()
        .eq("season_id", seasonId);

      if (deleteRoundsError) {
        console.error("Erro ao apagar rodadas antigas antes de gerar o mata-mata:", {
          message: deleteRoundsError.message,
          details: deleteRoundsError.details,
          hint: deleteRoundsError.hint,
          code: deleteRoundsError.code,
        });
        throw new Error(`Erro ao apagar rodadas antigas: ${deleteRoundsError.message}`);
      }

      const knockoutRules = options.knockoutRules;
      const generated = generateKnockoutBracket(teams, options.shuffle ?? false);

    const isTwoLeggedPhase = (phase: string): boolean =>
      knockoutRules
        ? isPhaseTwoLegged(knockoutRules, phase as PlayoffPhase)
        : Boolean(options.twoLegged);

    const uniquePhases = Array.from(new Set(generated.map((m) => m.phase)));
    const roundPlan: { phase: string; name: string; leg: MatchLeg | null }[] = [];

    for (const phaseName of uniquePhases) {
      if (isTwoLeggedPhase(phaseName)) {
        roundPlan.push({
          phase: phaseName,
          name: getPhaseRoundName(phaseName, "IDA"),
          leg: "IDA",
        });
        roundPlan.push({
          phase: phaseName,
          name: getPhaseRoundName(phaseName, "VOLTA"),
          leg: "VOLTA",
        });
      } else {
        roundPlan.push({
          phase: phaseName,
          name: getPhaseDisplayName(phaseName),
          leg: null,
        });
      }
    }

    const createdRoundsMap = new Map<string, string>();

    for (let index = 0; index < roundPlan.length; index++) {
      const { phase, name, leg } = roundPlan[index];
      const { data: insertedRound, error: roundErr } = await supabase
        .from("rounds")
        .insert({
          season_id: seasonId,
          name,
          round_number: index + 1,
        })
        .select("id, name")
        .single();

      if (roundErr) {
        console.error(`Erro ao criar a rodada "${name}" do mata-mata:`, {
          message: roundErr.message,
          details: roundErr.details,
          hint: roundErr.hint,
          code: roundErr.code,
        });
        throw new Error(`Erro ao criar a rodada "${name}": ${roundErr.message}`);
      }

      if (insertedRound) {
        createdRoundsMap.set(`${phase}::${leg ?? "UNICO"}`, insertedRound.id);
      }
    }

    const matchesToInsert: Record<string, unknown>[] = [];
    const leg2Matches: Record<string, unknown>[] = [];

    for (const node of generated) {
      const isTwoLegged = isTwoLeggedPhase(node.phase);
      const leg1RoundKey = `${node.phase}::${isTwoLegged ? "IDA" : "UNICO"}`;
      const leg2RoundKey = `${node.phase}::VOLTA`;

      const base = {
        season_id: seasonId,
        round_id: createdRoundsMap.get(leg1RoundKey) || null,
        phase: node.phase,
        bracket_position: node.bracket_position,
        home_team_id: node.home_team_id,
        away_team_id: node.away_team_id,
        status: "scheduled",
      };
      matchesToInsert.push(base);

      if (isTwoLegged && node.home_team_id && node.away_team_id) {
        leg2Matches.push({
          season_id: seasonId,
          round_id: createdRoundsMap.get(leg2RoundKey) || null,
          phase: node.phase,
          bracket_position: node.bracket_position,
          home_team_id: node.away_team_id,
          away_team_id: node.home_team_id,
          status: "scheduled",
        });
      }
    }

    matchesToInsert.push(...leg2Matches);

    const insertResult = await supabase
      .from("matches")
      .insert(matchesToInsert)
      .select("id, phase, bracket_position");

    if (insertResult.error) {
      console.error("Erro ao salvar as partidas do mata-mata:", {
        message: insertResult.error.message,
        details: insertResult.error.details,
        hint: insertResult.error.hint,
        code: insertResult.error.code,
        roundCount: roundPlan.length,
      });
      throw new Error(`Erro ao salvar chaves do mata-mata: ${insertResult.error.message}`);
    }

    const insertedMatches = insertResult.data ?? [];

    const leg1Count = generated.length;
    const tempIdToDbId = new Map<string, string>();

    for (let i = 0; i < insertedMatches.length; i++) {
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

    for (let i = leg1Count; i < insertedMatches.length; i++) {
      const leg1Index = i - leg1Count;
      const nextIdx = generated[leg1Index]?.next_match_index;
      if (nextIdx != null && nextIdx >= 0 && tempIdToDbId.has(String(nextIdx))) {
        await supabase
          .from("matches")
          .update({ next_match_id: tempIdToDbId.get(String(nextIdx)) })
          .eq("id", insertedMatches[i].id);
      }
    }

    if (knockoutRules) {
      await supabase
        .from("seasons")
        .update({ rules: knockoutRules as never })
        .eq("id", seasonId);
    }

    return true;
    } catch (error) {
      const err = error as {
        message?: string;
        details?: string;
        hint?: string;
        code?: string;
      };
      console.error("Falha ao gerar o mata-mata:", {
        message: err?.message || error,
        details: err?.details,
        hint: err?.hint,
        code: err?.code,
        seasonId,
      });
      throw error;
    }
  },

  async generateRoundRobinTournament(
    seasonId: string,
    options: GenerateTournamentOptions = {}
  ) {
    await assertSeasonEditor(seasonId);

    const rawType = options.tournamentType || "PONTOS_CORRIDOS";
    const canonicalType = rawType === "ROUND_ROBIN" ? "PONTOS_CORRIDOS" : normalizeTournamentType(rawType);

    await supabase
      .from("seasons")
      .update({ tournament_type: canonicalType })
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
