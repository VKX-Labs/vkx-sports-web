"use client";

import { useParams } from "next/navigation";
import { useRounds } from "./hooks/useRounds";
import { Calendar, RefreshCw, Shield } from "lucide-react";
import Button from "@/components/ui/button";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { MatchCard } from "./components/MatchCard";

export default function RodadasPage() {
  const params = useParams();
  const championshipId = params.id as string;

  const {
    rounds,
    selectedRoundIndex,
    setSelectedRoundIndex,
    isLoading,
    isGenerating,
    handleGenerate,
    currentRound
  } = useRounds(championshipId);

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <LoadingSpinner message="Carregando tabela de jogos..." />
      </div>
    );
  }

  if (rounds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center border border-dashed border-slate-700 rounded-xl p-12 bg-brand-card/40 text-center max-w-2xl mx-auto my-8">
        <Calendar className="w-12 h-12 text-brand-accent mb-4 opacity-80" />
        <h3 className="text-xl font-bold text-brand-textPrimary mb-2">Nenhum confronto gerado</h3>
        <p className="text-sm text-brand-textSecondary mb-6 max-w-md">
          As equipes estão prontas! Clique no botão abaixo para gerar automaticamente todas as rodadas do campeonato através do algoritmo integrado.
        </p>
        <Button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="bg-brand-accent hover:bg-brand-accentHover text-brand-dark font-bold px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isGenerating ? "animate-spin" : ""}`} />
          {isGenerating ? "Gerando..." : "Gerar Tabela de Jogos"}
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 p-2">

      <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-brand-accent" />
          <h2 className="text-base font-bold text-brand-textPrimary">Jogos Oficiais</h2>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedRoundIndex}
            onChange={(e) => setSelectedRoundIndex(Number(e.target.value))}
            className="bg-brand-card text-sm text-brand-textPrimary border border-slate-700 rounded-lg px-4 py-2 font-bold cursor-pointer focus:outline-none focus:border-brand-accent shadow-inner"
          >
            {rounds.map((round, index) => (
              <option key={round.id} value={index}>
                {round.name || `${round.round_number}ª Rodada`}
              </option>
            ))}
          </select>

          <button
            onClick={handleGenerate}
            title="Regerar Confrontos"
            className="p-2 rounded-lg bg-slate-800 hover:bg-red-950/40 border border-slate-700 text-brand-textSecondary hover:text-red-400 hover:border-red-500/50 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {currentRound?.matches && currentRound.matches.length > 0 ? (
          currentRound.matches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
            />
          ))
        ) : (
          <div className="text-center py-8 bg-brand-card/20 rounded-xl border border-slate-800 text-brand-textSecondary text-xs">
            Nenhuma partida agendada para esta rodada.
          </div>
        )}
      </div>

    </div>
  );
}
