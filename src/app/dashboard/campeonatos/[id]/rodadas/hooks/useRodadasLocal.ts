"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useTournamentGenerator } from "./useTournamentGenerator";
import { advanceWinnerIfPhaseFinished } from "@/services/bracketEngine";

export interface RoundTeam {
  id: string;
  name: string;
  badge_url: string | null;
}

export interface RoundMatch {
  id: string;
  round_id: string;
  season_id: string;
  phase?: string | null;
  bracket_position?: number | null;
  next_match_id?: string | null;
  home_team_id: string | null;
  away_team_id: string | null;
  home_score: number | null;
  away_score: number | null;
  home_score_leg2?: number | null;
  away_score_leg2?: number | null;
  penalties_home?: number | null;
  penalties_away?: number | null;
  status: string;
  home_team: RoundTeam;
  away_team: RoundTeam;
}

export interface Round {
  id: string;
  name: string;
  round_number: number;
  type?: string;
  matches: RoundMatch[];
}

export function useRodadasLocal(championshipId: string) {
  const generator = useTournamentGenerator(championshipId);

  const [rounds, setRounds] = useState<Round[]>([]);
  const [selectedRoundIndex, setSelectedRoundIndex] = useState<number>(0);
  const [pageLoading, setPageLoading] = useState<boolean>(true);
  const [generatorTimeout, setGeneratorTimeout] = useState<boolean>(false);
  const [, setCurrentSeasonId] = useState<string | null>(null);

  const fetchRoundsAndMatches = useCallback(async () => {
    try {
      setPageLoading(true);

      if (!championshipId) {
        setRounds([]);
        setPageLoading(false);
        return;
      }

      const { data: season, error: seasonError } = await supabase
        .from("seasons")
        .select("id")
        .eq("championship_id", championshipId)
        .maybeSingle();

      if (seasonError) throw seasonError;

      if (!season) {
        setRounds([]);
        setPageLoading(false);
        return;
      }

      setCurrentSeasonId(season.id);

      const { data: roundsData, error: roundsError } = await supabase
        .from("rounds")
        .select("id, name, round_number")
        .eq("season_id", season.id)
        .order("round_number", { ascending: true });

      if (roundsError) throw roundsError;

      if (!roundsData || roundsData.length === 0) {
        setRounds([]);
        setPageLoading(false);
        return;
      }

      const roundIds = roundsData.map((r) => r.id);

      let matchesData: any[] = [];
      if (roundIds.length > 0) {
        const { data, error: matchesError } = await supabase
          .from("matches")
          .select("*")
          .in("round_id", roundIds);

        if (matchesError) throw matchesError;
        matchesData = data || [];
      }

      const { data: teamsData, error: teamsError } = await supabase
        .from("teams")
        .select("id, name, badge_url")
        .eq("season_id", season.id);

      if (teamsError) {
        console.error("Erro ao buscar os times:", teamsError);
      }

      const teamsMap: Record<string, RoundTeam> = {};
      teamsData?.forEach((team) => {
        teamsMap[team.id] = {
          id: team.id,
          name: team.name,
          badge_url: team.badge_url,
        };
      });

      const formattedRounds: Round[] = roundsData.map((round) => {
        const roundMatches: RoundMatch[] = matchesData
          .filter((m) => m.round_id === round.id)
          .map((m: any) => {
            const defaultHome: RoundTeam = {
              id: m.home_team_id || "",
              name: "A Definir",
              badge_url: null,
            };
            const defaultAway: RoundTeam = {
              id: m.away_team_id || "",
              name: "A Definir",
              badge_url: null,
            };

            return {
              id: m.id,
              round_id: m.round_id,
              season_id: m.season_id,
              phase: m.phase,
              bracket_position: m.bracket_position,
              next_match_id: m.next_match_id ?? null,
              home_team_id: m.home_team_id,
              away_team_id: m.away_team_id,
              home_score: m.home_score,
              away_score: m.away_score,
              home_score_leg2: m.home_score_leg2 ?? null,
              away_score_leg2: m.away_score_leg2 ?? null,
              penalties_home: m.penalties_home ?? null,
              penalties_away: m.penalties_away ?? null,
              status: m.status,
              home_team: m.home_team_id ? teamsMap[m.home_team_id] || defaultHome : defaultHome,
              away_team: m.away_team_id ? teamsMap[m.away_team_id] || defaultAway : defaultAway,
            };
          });

        return {
          ...round,
          matches: roundMatches,
        };
      });

      setRounds(formattedRounds);
    } catch (err: any) {
      console.error("Erro no carregamento de rodadas:", {
        message: err?.message || err,
        details: err?.details,
        hint: err?.hint,
        code: err?.code,
      });
      setRounds([]);
    } finally {
      setPageLoading(false);
    }
  }, [championshipId]);

  useEffect(() => {
    if (generator?.loading) {
      const timer = setTimeout(() => {
        setGeneratorTimeout(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
    setGeneratorTimeout(false);
  }, [generator?.loading]);

  useEffect(() => {
    if (championshipId) {
      fetchRoundsAndMatches();
    }
  }, [championshipId, generator?.hasRounds, fetchRoundsAndMatches]);

  const addRoundLocal = (newRound: Round) => {
    setRounds((prev) => [...prev, newRound]);
    setSelectedRoundIndex((prev) => prev + 1);
  };

  const removeRoundLocal = (roundId: string) => {
    setRounds((prev) => prev.filter((r) => r.id !== roundId));
    setSelectedRoundIndex((prev) => Math.max(0, prev - 1));
  };

  const updateMatchScore = async (
    match: RoundMatch,
    homeScore: number,
    awayScore: number,
    isTwoLegs: boolean = false,
    homeScoreLeg2?: number | null,
    awayScoreLeg2?: number | null,
    penaltiesHome?: number | null,
    penaltiesAway?: number | null
  ) => {
    try {
      const updateData: Record<string, any> = {
        home_score: homeScore,
        away_score: awayScore,
        status: "FINALIZADO",
      };

      if (isTwoLegs) {
        updateData.home_score_leg2 = homeScoreLeg2 ?? null;
        updateData.away_score_leg2 = awayScoreLeg2 ?? null;
      }

      if (penaltiesHome !== undefined && penaltiesAway !== undefined) {
        updateData.penalties_home = penaltiesHome;
        updateData.penalties_away = penaltiesAway;
      }

      const { error: updateErr } = await supabase
        .from("matches")
        .update(updateData)
        .eq("id", match.id);

      if (updateErr) throw updateErr;

      if (match.phase && match.phase !== "REGULAR") {
        await advanceWinnerIfPhaseFinished(
          {
            id: match.id,
            season_id: match.season_id,
            phase: match.phase,
            bracket_position: match.bracket_position ?? 1,
            next_match_id: match.next_match_id ?? null,
            home_team_id: match.home_team_id,
            away_team_id: match.away_team_id,
            home_score: homeScore,
            away_score: awayScore,
            home_score_leg2: homeScoreLeg2 ?? null,
            away_score_leg2: awayScoreLeg2 ?? null,
            penalties_home: penaltiesHome ?? null,
            penalties_away: penaltiesAway ?? null,
            status: "FINALIZADO",
          },
          isTwoLegs
        );
      }

      await fetchRoundsAndMatches();
      return true;
    } catch (err: any) {
      console.error("Erro ao salvar placar da partida:", err);
      return false;
    }
  };

  const handleGenerate = async () => {
    if (!generator?.generate) return;
    if (window.confirm("Deseja gerar os confrontos? Se houver jogos antigos, eles serão apagados.")) {
      await generator.generate();
      await fetchRoundsAndMatches();
    }
  };

  const finalLoading = generatorTimeout ? pageLoading : pageLoading || generator?.loading;

  return {
    rounds,
    setRounds,
    selectedRoundIndex,
    setSelectedRoundIndex,
    isLoading: finalLoading,
    isGenerating: generator?.generating || false,
    handleGenerate,
    updateMatchScore,
    currentRound: rounds[selectedRoundIndex],
    refetchLocalRounds: fetchRoundsAndMatches,
    addRoundLocal,
    removeRoundLocal,
    error: null,
  };
}