"use client";

import { useState, useEffect, useCallback } from "react";
import { useRounds, type Round } from "@/hooks/useRounds";
import { MatchRepository } from "@/repositories/match.repository";
import type { Match } from "@/types/match";

interface RoundWithMatches {
  id: string;
  round_number?: number;
  number?: number;
  name: string;
  is_completed?: boolean;
  matches?: Match[];
}

export function useRodadasLocal(championshipId: string) {
  const { rounds = [], loading: isLoading, refetchRounds } = useRounds(championshipId);
  const [selectedRoundIndex, setSelectedRoundIndex] = useState(0);
  const [matches, setMatches] = useState<Match[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);

  useEffect(() => {
    if (rounds.length === 0) return;
    if (selectedRoundIndex >= rounds.length) {
      setSelectedRoundIndex(Math.max(0, rounds.length - 1));
    }
  }, [rounds, selectedRoundIndex]);

  const loadMatchesForRound = useCallback(async (round: Round | undefined) => {
    if (!round) {
      setMatches([]);
      return;
    }

    setMatchesLoading(true);

    try {
      const data = await MatchRepository.getMatchesByRound(round.id);
      setMatches(data);
    } catch (err) {
      console.error("Erro ao carregar partidas da rodada:", err);
      setMatches([]);
    } finally {
      setMatchesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMatchesForRound(rounds[selectedRoundIndex]);
  }, [rounds, selectedRoundIndex, loadMatchesForRound]);

  const updateMatchScore = useCallback(
    async (matchId: string, homeScore: number, awayScore: number) => {
      await MatchRepository.updateMatchScore(matchId, homeScore, awayScore);
      await loadMatchesForRound(rounds[selectedRoundIndex]);
    },
    [rounds, selectedRoundIndex, loadMatchesForRound]
  );

  const refetchLocalRounds = useCallback(async () => {
    await refetchRounds?.();
    await loadMatchesForRound(rounds[selectedRoundIndex]);
  }, [refetchRounds, rounds, selectedRoundIndex, loadMatchesForRound]);

  const currentRound: RoundWithMatches | undefined =
    rounds.length > 0 ? { ...rounds[selectedRoundIndex], matches } : undefined;

  return {
    rounds,
    selectedRoundIndex,
    setSelectedRoundIndex,
    isLoading: isLoading || matchesLoading,
    currentRound,
    updateMatchScore,
    refetchLocalRounds,
  };
}
