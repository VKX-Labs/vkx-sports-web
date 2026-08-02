"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useRodadasLocal } from "./useRodadasLocal";
import { useRounds } from "@/hooks/useRounds";
import { useTeams } from "@/hooks/useTeams";
import { MatchRepository } from "@/repositories/match.repository";
import { supabase } from "@/lib/supabase";

export function useRodadasPageController() {
  const params = useParams();
  const championshipId = params?.id as string;

  const { createRound, loading: loadingGlobal } = useRounds(championshipId);

  const {
    rounds = [],
    selectedRoundIndex,
    setSelectedRoundIndex,
    isLoading: loadingLocal,
    currentRound,
    updateMatchScore,
    refetchLocalRounds,
    addRoundLocal,
    removeRoundLocal,
  } = useRodadasLocal(championshipId);

  const { teams = [] } = useTeams(championshipId);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreatingRound, setIsCreatingRound] = useState(false);
  const [isDeletingRound, setIsDeletingRound] = useState(false);

  const loading = loadingLocal || loadingGlobal;

  const reloadData = async () => {
    if (refetchLocalRounds) {
      await refetchLocalRounds();
    }
  };

  const handleAddRound = async () => {
    try {
      setIsCreatingRound(true);

      if (typeof createRound === "function") {
        const newRoundData = await createRound();

        if (newRoundData && typeof addRoundLocal === "function") {
          addRoundLocal({
            id: newRoundData.id,
            name: newRoundData.name,
            round_number: newRoundData.round_number ?? rounds.length + 1,
            matches: [],
          });
        } else {
          await reloadData();
          setSelectedRoundIndex(Math.max(0, rounds.length));
        }
      }
    } catch (err: any) {
      console.error("Erro ao criar rodada:", err);
    } finally {
      setIsCreatingRound(false);
    }
  };

  const handleDeleteRound = async () => {
    if (!currentRound) return;

    const roundName =
      currentRound.name || `${currentRound.round_number}ª Rodada`;

    if (!confirm(`Deseja realmente excluir a rodada "${roundName}"?`)) {
      return;
    }

    try {
      setIsDeletingRound(true);

      await MatchRepository.deleteRound(currentRound.id);

      if (typeof removeRoundLocal === "function") {
        removeRoundLocal(currentRound.id);
      } else {
        await reloadData();
        setSelectedRoundIndex(Math.max(0, selectedRoundIndex - 1));
      }
    } catch (err: any) {
      console.error("Erro ao deletar rodada:", err);
      alert(`Não foi possível excluir a rodada: ${err.message}`);
    } finally {
      setIsDeletingRound(false);
    }
  };

  const handleRefresh = async () => {
    await reloadData();
  };

  const handleCreateMatch = async (
    homeTeamId: string,
    awayTeamId: string
  ) => {
    if (!currentRound) return;

    const { data: seasonData, error: seasonError } = await supabase
      .from("seasons")
      .select("id")
      .eq("championship_id", championshipId)
      .maybeSingle();

    if (seasonError || !seasonData?.id) {
      throw new Error("Temporada não encontrada para este campeonato.");
    }

    await MatchRepository.createManualMatch({
      seasonId: seasonData.id,
      roundId: currentRound.id,
      homeTeamId,
      awayTeamId,
    });

    await reloadData();
  };

  const isKnockoutPhase = Boolean(
    currentRound?.name?.match(/(Oitavas|Quartas|Semi|Final|Playoff|Pré)/i)
  );

  return {
    loading,
    rounds,
    selectedRoundIndex,
    currentRound,
    teams,
    isModalOpen,
    isCreatingRound,
    isDeletingRound,
    isKnockoutPhase,
    setSelectedRoundIndex,
    setIsModalOpen,
    handleAddRound,
    handleDeleteRound,
    handleRefresh,
    handleCreateMatch,
    updateMatchScore,
  };
}