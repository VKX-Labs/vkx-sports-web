"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { useRodadasLocal } from "./useRodadasLocal";
import { useRounds } from "@/hooks/useRounds";
import { useTeams } from "@/hooks/useTeams";
import { MatchRepository } from "@/repositories/match.repository";
import { supabase } from "@/lib/supabase";
import { RoundFilterService } from "@/services/roundFilterService";
import { getPhaseRoundName, MatchLeg, TournamentType } from "@/types/tournament";
import type { CreateMatchPayload } from "../components/CreateMatchModal";
import type { EditMatchPayload } from "../components/EditMatchModal";

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
    updateMatchLocal,
    deleteMatchLocal,
    handleGenerate,
    generator,
  } = useRodadasLocal(championshipId);

  const { teams = [] } = useTeams(championshipId);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreatingRound, setIsCreatingRound] = useState(false);
  const [isDeletingRound, setIsDeletingRound] = useState(false);

  const [seasonInfo, setSeasonInfo] = useState<{
    id: string;
    tournamentType: TournamentType;
  } | null>(null);

  useEffect(() => {
    (async () => {
      if (!championshipId) return;
      const { data } = await supabase
        .from("seasons")
        .select("id, tournament_type")
        .eq("championship_id", championshipId)
        .maybeSingle();

      if (data?.id) {
        setSeasonInfo({
          id: data.id,
          tournamentType: (data.tournament_type as TournamentType) || "PONTOS_CORRIDOS",
        });
      }
    })();
  }, [championshipId]);

  const loading = loadingLocal || loadingGlobal;

  const isKnockoutTournament =
    seasonInfo?.tournamentType === "COPA" ||
    seasonInfo?.tournamentType === "MATA_MATA";

  const phaseOptions = useMemo(() => {
    if (!seasonInfo || !isKnockoutTournament) return [];
    return RoundFilterService.getFilterOptions(
      seasonInfo.tournamentType,
      Math.max(teams.length, 2)
    );
  }, [seasonInfo, isKnockoutTournament, teams.length]);

  const bracketSizes = useMemo(() => {
    if (!isKnockoutTournament) return {};
    return RoundFilterService.getKnockoutBracketSizes(Math.max(teams.length, 2));
  }, [isKnockoutTournament, teams.length]);

  const reloadData = async () => {
    if (refetchLocalRounds) {
      await refetchLocalRounds();
    }
  };

  const resolveRoundId = async (
    phase: string,
    leg?: MatchLeg | null
  ): Promise<string> => {
    if (!seasonInfo) {
      throw new Error("Temporada não encontrada para este campeonato.");
    }

    const roundName = getPhaseRoundName(phase, leg ?? "UNICO");
    const existing = rounds.find((r) => r.name === roundName);
    if (existing) return existing.id;

    const created = await MatchRepository.createRound(
      seasonInfo.id,
      roundName,
      rounds.length + 1
    );

    if (created?.id) return created.id;
    throw new Error(`Não foi possível localizar a rodada da fase "${roundName}".`);
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

  const handleCreateMatch = async (payload: CreateMatchPayload) => {
    if (!currentRound) return;

    if (!seasonInfo) {
      throw new Error("Temporada não encontrada para este campeonato.");
    }

    let roundId = currentRound.id;

    if (isKnockoutTournament && payload.phase) {
      roundId = await resolveRoundId(payload.phase, payload.leg ?? "UNICO");
    }

    await MatchRepository.createManualMatch({
      seasonId: seasonInfo.id,
      roundId,
      homeTeamId: payload.homeTeamId,
      awayTeamId: payload.awayTeamId,
      ...(payload.phase ? { phase: payload.phase } : {}),
      ...(payload.bracketPosition !== undefined && payload.bracketPosition !== null
        ? { bracketPosition: payload.bracketPosition }
        : {}),
    });

    await reloadData();
  };

  const handleDeleteMatch = async (matchId: string) => {
    if (
      !confirm(
        "Tem certeza que deseja excluir esta partida? Todos os gols e estatísticas dela serão apagados."
      )
    ) {
      return;
    }

    try {
      await MatchRepository.deleteMatch(matchId);

      if (typeof deleteMatchLocal === "function") {
        deleteMatchLocal(matchId);
      } else {
        await refetchLocalRounds();
      }
    } catch (err: any) {
      console.error("Erro ao deletar partida:", err);
      alert(`Erro ao excluir partida: ${err.message}`);
    }
  };

  const handleUpdateMatch = async (payload: EditMatchPayload) => {
    try {
      let roundId: string | undefined;

      if (isKnockoutTournament && payload.phase) {
        roundId = await resolveRoundId(payload.phase, payload.leg ?? "UNICO");
      }

      await MatchRepository.updateMatch({
        matchId: payload.matchId,
        homeTeamId: payload.homeTeamId,
        awayTeamId: payload.awayTeamId,
        date: payload.date,
        ...(payload.phase !== undefined ? { phase: payload.phase } : {}),
        ...(payload.bracketPosition !== undefined
          ? { bracketPosition: payload.bracketPosition }
          : {}),
        ...(roundId !== undefined ? { roundId } : {}),
      });

      const homeTeamObj = teams.find((t) => t.id === payload.homeTeamId);
      const awayTeamObj = teams.find((t) => t.id === payload.awayTeamId);

      if (typeof updateMatchLocal === "function") {
        updateMatchLocal(
          { id: payload.matchId, home_team_id: payload.homeTeamId, away_team_id: payload.awayTeamId },
          homeTeamObj,
          awayTeamObj
        );
      }

      await reloadData();
    } catch (err: any) {
      console.error("Erro ao editar partida:", err);
      alert(`Erro ao editar partida: ${err.message}`);
    }
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
    isKnockoutTournament,
    tournamentType: seasonInfo?.tournamentType ?? null,
    phaseOptions,
    bracketSizes,
    generator,
    handleGenerate,
    setSelectedRoundIndex,
    setIsModalOpen,
    handleAddRound,
    handleDeleteRound,
    handleRefresh,
    handleCreateMatch,
    handleDeleteMatch,
    handleUpdateMatch,
    updateMatchScore,
  };
}