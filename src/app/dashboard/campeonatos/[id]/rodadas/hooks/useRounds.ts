"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useTournamentGenerator } from "./useTournamentGenerator";

export interface RoundTeam {
  id: string;
  name: string;
  badge_url: string | null;
}

export interface RoundMatch {
  id: string;
  round_id: string;
  home_team_id: string;
  away_team_id: string;
  home_score: number | null;
  away_score: number | null;
  status: string;
  home_team?: RoundTeam;
  away_team?: RoundTeam;
}

export interface Round {
  id: string;
  name: string;
  round_number: number;
  type?: string;
  matches: RoundMatch[];
}

export function useRounds(championshipId: string) {
  const generator = useTournamentGenerator(championshipId);

  const [rounds, setRounds] = useState<Round[]>([]);
  const [selectedRoundIndex, setSelectedRoundIndex] = useState<number>(0);
  const [pageLoading, setPageLoading] = useState<boolean>(true);
  const [generatorTimeout, setGeneratorTimeout] = useState<boolean>(false);

  const fetchRoundsAndMatches = useCallback(async () => {
    try {
      setPageLoading(true);

      const { data: season, error: seasonError } = await supabase
        .from("seasons")
        .select("id")
        .eq("championship_id", championshipId)
        .maybeSingle();

      if (seasonError || !season) {
        setRounds([]);
        setPageLoading(false);
        return;
      }

      const { data: roundsData, error: roundsError } = await supabase
        .from("rounds")
        .select("id, name, round_number")
        .eq("season_id", season.id)
        .order("round_number", { ascending: true });

      if (roundsError || !roundsData || roundsData.length === 0) {
        setRounds([]);
        setPageLoading(false);
        return;
      }

      const roundIds = roundsData.map((r) => r.id);

      const { data: matchesData, error: matchesError } = await supabase
        .from("matches")
        .select("id, round_id, home_team_id, away_team_id, home_score, away_score, status")
        .in("round_id", roundIds);

      if (matchesError) {
        console.error("Erro ao buscar partidas:", matchesError);
        setPageLoading(false);
        return;
      }

      const { data: teamsData, error: teamsError } = await supabase
        .from("teams")
        .select("id, name, badge_url")
        .eq("season_id", season.id);

      if (teamsError) {
        console.error("Erro ao buscar os times:", teamsError);
        setPageLoading(false);
        return;
      }

      const teamsMap: Record<string, RoundTeam> = {};
      teamsData?.forEach((team) => {
        teamsMap[team.id] = {
          id: team.id,
          name: team.name,
          badge_url: team.badge_url,
        };
      });

      const formattedRounds = roundsData.map((round) => {
        const roundMatches = (matchesData || [])
          .filter((m) => m.round_id === round.id)
          .map((m) => {
            const defaultHome = { id: m.home_team_id, name: "Time Mandante", badge_url: null };
            const defaultAway = { id: m.away_team_id, name: "Time Visitante", badge_url: null };

            return {
              id: m.id,
              round_id: m.round_id,
              home_team_id: m.home_team_id,
              away_team_id: m.away_team_id,
              home_score: m.home_score,
              away_score: m.away_score,
              status: m.status,
              home_team: teamsMap[m.home_team_id] || defaultHome,
              away_team: teamsMap[m.away_team_id] || defaultAway,
            };
          });

        return {
          ...round,
          matches: roundMatches,
        };
      });

      setRounds(formattedRounds);
    } catch (err) {
      console.error("Erro inesperado no carregamento de rodadas:", err);
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

  const handleGenerate = async () => {
    if (!generator?.generate) return;
    if (window.confirm("Deseja gerar os confrontos? Se houver jogos antigos, eles serão apagados.")) {
      await generator.generate();
      await fetchRoundsAndMatches();
    }
  };

  const finalLoading = generatorTimeout ? pageLoading : (pageLoading || generator?.loading);

  return {
    rounds,
    selectedRoundIndex,
    setSelectedRoundIndex,
    isLoading: finalLoading,
    isGenerating: generator?.generating || false,
    handleGenerate,
    currentRound: rounds[selectedRoundIndex],
    error: null,
  };
}
