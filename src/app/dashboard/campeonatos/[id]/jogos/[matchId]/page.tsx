"use client";

import React, { useState, useEffect } from "react";
import { Loader2, CheckCircle2, Pencil, Trash2 } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { MatchService, MatchEventItem, SimplePlayer } from "@/services/matchService";
import { MatchScoreCard } from "@/components/match/MatchScoreCard";
import { MatchEventsSection } from "@/components/match/MatchEventsSection";
import { MatchRepository } from "@/repositories/match.repository";
import { useTeams } from "@/hooks/useTeams";
import { routes } from "@/lib/routes";
import { EditMatchModal } from "../components/EditMatchModal";
import type { EditMatchPayload, EditMatchTarget } from "../components/EditMatchModal";
import { useWorkspace } from "@/features/championships/components/workspace/WorkspaceProvider";

export default function PartidaDetalhePage() {
  const router = useRouter();
  const params = useParams();
  const matchId = params?.matchId as string;
  const championshipId = params?.id as string;

  const { isOwner } = useWorkspace();
  const { teams = [] } = useTeams(championshipId);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [matchData, setMatchData] = useState<any>(null);
  const [matchToEdit, setMatchToEdit] = useState<EditMatchTarget | null>(null);
  
  const [homeScore, setHomeScore] = useState<number | null>(0);
  const [awayScore, setAwayScore] = useState<number | null>(0);

  const [homeScoreLeg2, setHomeScoreLeg2] = useState<number | null>(null);
  const [awayScoreLeg2, setAwayScoreLeg2] = useState<number | null>(null);

  const [penaltiesHome, setPenaltiesHome] = useState<number | null>(null);
  const [penaltiesAway, setPenaltiesAway] = useState<number | null>(null);

  const [playersHome, setPlayersHome] = useState<SimplePlayer[]>([]);
  const [playersAway, setPlayersAway] = useState<SimplePlayer[]>([]);
  const [events, setEvents] = useState<MatchEventItem[]>([]);

  useEffect(() => {
    async function loadData() {
      if (!matchId) return;
      try {
        setLoading(true);
        const data = await MatchService.getMatchDetails(matchId);

        setMatchData(data.match);
        setHomeScore(data.match.home_score ?? 0);
        setAwayScore(data.match.away_score ?? 0);
        setHomeScoreLeg2(data.match.home_score_leg2 ?? null);
        setAwayScoreLeg2(data.match.away_score_leg2 ?? null);
        setPenaltiesHome(data.match.penalties_home ?? null);
        setPenaltiesAway(data.match.penalties_away ?? null);

        setPlayersHome(data.homePlayers);
        setPlayersAway(data.awayPlayers);
        setEvents(data.events);
      } catch (err) {
        console.error("Erro ao carregar partida:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [matchId]);

  const handleDeclareWO = (winner: "home" | "away" | "double_wo") => {
    if (winner === "home") {
      setHomeScore(3);
      setAwayScore(0);
    } else if (winner === "away") {
      setHomeScore(0);
      setAwayScore(3);
    } else {
      setHomeScore(0);
      setAwayScore(0);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      await MatchService.saveMatchResult({
        matchId,
        homeScore: homeScore !== null ? Number(homeScore) : 0,
        awayScore: awayScore !== null ? Number(awayScore) : 0,
        homeScoreLeg2: homeScoreLeg2 !== null ? Number(homeScoreLeg2) : null,
        awayScoreLeg2: awayScoreLeg2 !== null ? Number(awayScoreLeg2) : null,
        penaltiesHome: penaltiesHome !== null ? Number(penaltiesHome) : null,
        penaltiesAway: penaltiesAway !== null ? Number(penaltiesAway) : null,
        events,
      });

      router.refresh();
      router.back();
    } catch (err: any) {
      console.error("Erro ao salvar partida:", err);
      alert("Erro ao salvar partida: " + (err?.message || "Erro desconhecido"));
    } finally {
      setSaving(false);
    }
  };

  const handleEditSave = async ({
    matchId: matchToUpdate,
    homeTeamId,
    awayTeamId,
    date,
  }: EditMatchPayload) => {
    await MatchRepository.updateMatch({
      matchId: matchToUpdate,
      homeTeamId,
      awayTeamId,
      date,
    });

    const data = await MatchService.getMatchDetails(matchId);
    setMatchData(data.match);
    setHomeScore(data.match.home_score ?? 0);
    setAwayScore(data.match.away_score ?? 0);
    setHomeScoreLeg2(data.match.home_score_leg2 ?? null);
    setAwayScoreLeg2(data.match.away_score_leg2 ?? null);
    setPenaltiesHome(data.match.penalties_home ?? null);
    setPenaltiesAway(data.match.penalties_away ?? null);
    setPlayersHome(data.homePlayers);
    setPlayersAway(data.awayPlayers);
    setEvents(data.events);
  };

  const handleDeleteMatch = async () => {
    if (
      !confirm(
        "Tem certeza que deseja excluir esta partida? Todos os gols e estatísticas dela serão apagados."
      )
    ) {
      return;
    }

    try {
      await MatchRepository.deleteMatch(matchId);
      router.push(routes.dashboard.matches(championshipId));
    } catch (err: any) {
      console.error("Erro ao excluir partida:", err);
      alert(`Erro ao excluir partida: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-zinc-500 gap-3">
        <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
        <span className="text-xs font-mono tracking-wide">Carregando dados da partida...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16 text-zinc-100">
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <button 
            onClick={() => router.back()}
            className="hover:text-zinc-200 transition-colors"
          >
            Jogos
          </button>
          <span className="text-zinc-600">/</span>
          <span className="text-emerald-400 font-semibold">Match Center</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          {isOwner && (
            <button
              onClick={() => setMatchToEdit(matchData)}
              title="Editar times e data do jogo"
              className="md:h-10 h-11 px-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 font-bold text-xs rounded-lg transition-all flex items-center gap-2"
            >
              <Pencil className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Editar Times/Jogo</span>
            </button>
          )}

          {isOwner && (
            <button
              onClick={handleDeleteMatch}
              title="Excluir partida"
              className="md:h-10 h-11 px-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/40 text-red-400 font-bold text-xs rounded-lg transition-all flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Excluir Partida</span>
            </button>
          )}

          {isOwner && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="md:h-10 h-11 px-5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-zinc-950 font-bold text-xs rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              {saving ? "Salvando..." : "Finalizar & Salvar Súmula"}
            </button>
          )}
        </div>
      </div>

      <MatchScoreCard
        homeTeam={matchData?.home_team}
        awayTeam={matchData?.away_team}
        homeScore={homeScore}
        awayScore={awayScore}
        setHomeScore={setHomeScore}
        setAwayScore={setAwayScore}
        onDeclareWO={handleDeclareWO}
        readOnly={!isOwner}
      />

      <MatchEventsSection
        homeTeam={matchData?.home_team}
        awayTeam={matchData?.away_team}
        homePlayers={playersHome}
        awayPlayers={playersAway}
        events={events}
        onAddEvent={(newEvent) => setEvents([...events, newEvent])}
        onRemoveEvent={(id) => setEvents(events.filter((e) => e.id !== id))}
        readOnly={!isOwner}
      />

      {isOwner && (
        <EditMatchModal
          isOpen={Boolean(matchToEdit)}
          onClose={() => setMatchToEdit(null)}
          teams={teams}
          match={matchToEdit}
          onSave={handleEditSave}
        />
      )}
    </div>
  );
}