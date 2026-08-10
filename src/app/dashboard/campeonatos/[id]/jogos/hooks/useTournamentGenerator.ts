import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { MatchRepository } from "@/repositories/match.repository";
import type { GenerateTournamentOptions } from "@/repositories/match.repository";
import type { TournamentType } from "@/types/tournament";
import { getDefaultKnockoutRules, KnockoutRules } from "@/types/tournament";

export interface GeneratorOptions {
  shuffle: boolean;
  doubleRound: boolean;
  knockoutRules?: KnockoutRules;
}

export function useTournamentGenerator(championshipId: string) {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [seasonId, setSeasonId] = useState<string | null>(null);
  const [tournamentType, setTournamentType] = useState<string | null>(null);
  const [teamCount, setTeamCount] = useState(0);
  const [hasRounds, setHasRounds] = useState(false);

  const [options, setOptions] = useState<GeneratorOptions>({
    shuffle: true,
    doubleRound: false,
    knockoutRules: getDefaultKnockoutRules(),
  });

  const init = useCallback(async () => {
    if (!championshipId) return;

    try {
      setLoading(true);

      const { data: seasonData, error: seasonError } = await supabase
        .from("seasons")
        .select("id, tournament_type")
        .eq("championship_id", championshipId)
        .maybeSingle();

      if (seasonError) {
        console.error("Erro ao buscar temporada ativa no Supabase:", seasonError);
        return;
      }

      if (!seasonData) {
        console.warn(`Nenhuma temporada ativa encontrada para o campeonato: ${championshipId}`);
        setSeasonId(null);
        setTeamCount(0);
        setHasRounds(false);
        return;
      }

      setSeasonId(seasonData.id);
      setTournamentType(seasonData.tournament_type);

      try {
        const exists = await MatchRepository.hasGeneratedRounds(seasonData.id);
        setHasRounds(exists);
      } catch (err) {
        console.error("Erro ao verificar rodadas geradas:", err);
      }

      const { count, error: countError } = await supabase
        .from("teams")
        .select("id", { count: "exact", head: true })
        .eq("season_id", seasonData.id);

      if (countError) {
        console.error("Erro ao contar equipes do campeonato:", countError);
      } else {
        setTeamCount(count ?? 0);
      }
    } catch (error) {
      console.error("Erro geral na inicialização da página de rodadas:", error);
    } finally {
      setLoading(false);
    }
  }, [championshipId]);

  useEffect(() => {
    init();
  }, [championshipId, init]);

  const refreshTeamCount = async (): Promise<number> => {
    if (!seasonId) return 0;

    const { count, error } = await supabase
      .from("teams")
      .select("id", { count: "exact", head: true })
      .eq("season_id", seasonId);

    if (error) {
      console.error("Erro ao contar equipes da temporada:", error);
      return 0;
    }

    return count ?? 0;
  };

  const generate = async () => {
    if (!seasonId) {
      alert("Nenhuma temporada ativa encontrada para este campeonato.");
      return false;
    }

    const currentTeamCount = await refreshTeamCount();
    setTeamCount(currentTeamCount);

    if (currentTeamCount < 2) {
      alert(
        `Você precisa cadastrar pelo menos 2 equipes para gerar a tabela de jogos! Atualmente há ${currentTeamCount} equipe(s) cadastrada(s).`
      );
      return false;
    }

    try {
      setGenerating(true);

      const normalizedType = (tournamentType || "")
        .toUpperCase()
        .replace(/-/g, "_");

      const isKnockout = normalizedType === "MATA_MATA" || normalizedType === "COPA";

      const genOptions: GenerateTournamentOptions = {
        shuffle: options.shuffle,
        doubleRound: options.doubleRound,
        tournamentType: normalizedType as TournamentType | "ROUND_ROBIN",
        ...(isKnockout && options.knockoutRules ? { knockoutRules: options.knockoutRules } : {}),
      };

      await MatchRepository.generateTournament(championshipId, seasonId, genOptions);
      setHasRounds(true);
      alert("Tabela de jogos gerada com sucesso!");
      return true;
    } catch (error) {
      const err = error as {
        message?: string;
        details?: string;
        hint?: string;
        code?: string;
      };
      console.error("Erro ao gerar o campeonato:", {
        message: err?.message || error,
        details: err?.details,
        hint: err?.hint,
        code: err?.code,
        championshipId,
        seasonId,
      });
      alert(
        err?.message ||
          "Não foi possível gerar a tabela de jogos. Verifique se as equipes estão cadastradas e tente novamente."
      );
      return false;
    } finally {
      setGenerating(false);
    }
  };

  return {
    loading,
    generating,
    hasRounds,
    teamCount,
    tournamentType,
    options,
    setOptions,
    generate,
    refetch: init,
  };
}