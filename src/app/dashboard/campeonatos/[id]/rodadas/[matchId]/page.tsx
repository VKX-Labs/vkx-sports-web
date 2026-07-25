"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { MatchService, MatchEventItem, SimplePlayer } from "@/services/matchService";
import { MatchScoreCard } from "@/components/match/MatchScoreCard";
import { MatchEventsSection } from "@/components/match/MatchEventsSection";

export default function PartidaDetalhePage() {
  const router = useRouter();
  const params = useParams();
  const matchId = params?.matchId as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [matchData, setMatchData] = useState<any>(null);
  const [homeScore, setHomeScore] = useState<number | null>(0);
  const [awayScore, setAwayScore] = useState<number | null>(0);

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
        setPlayersHome(data.homePlayers);
        setPlayersAway(data.awayPlayers);
        setEvents(data.events);
      } catch (err) {
        console.error("Erro ao carregar confronto:", err);
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
      await MatchService.saveMatchResult(matchId, homeScore, awayScore, events);
      router.refresh();
      router.back();
    } catch (err: any) {
      alert("Erro ao salvar partida: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-slate-400 gap-2">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
        Carregando dados do confronto...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 text-slate-100">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar para Rodadas
      </button>

      <MatchScoreCard
        homeTeamName={matchData.home_team.name}
        awayTeamName={matchData.away_team.name}
        homeScore={homeScore}
        awayScore={awayScore}
        setHomeScore={setHomeScore}
        setAwayScore={setAwayScore}
        onDeclareWO={handleDeclareWO}
      />

      <MatchEventsSection
        homeTeam={matchData.home_team}
        awayTeam={matchData.away_team}
        homePlayers={playersHome}
        awayPlayers={playersAway}
        events={events}
        onAddEvent={(newEvent) => setEvents([...events, newEvent])}
        onRemoveEvent={(id) => setEvents(events.filter((e) => e.id !== id))}
      />

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/10 flex items-center gap-2"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {saving ? "Salvando no Banco..." : "Salvar e Atualizar Estatísticas"}
        </button>
      </div>
    </div>
  );
}