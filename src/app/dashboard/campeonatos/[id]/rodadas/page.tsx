"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useRounds } from "./hooks/useRounds";
import { Calendar, RefreshCw, Shield, Trophy, AlertCircle } from "lucide-react";
import Button from "@/components/ui/button";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { MatchCard } from "./components/MatchCard";

export default function RodadasPage() {
  const params = useParams();
  const championshipId = params?.id as string;

  const {
    rounds,
    selectedRoundIndex,
    setSelectedRoundIndex,
    isLoading,
    isGenerating,
    handleGenerate,
    currentRound,
    error,
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
      <div className="flex flex-col items-center justify-center border border-dashed border-zinc-800 rounded-2xl p-12 bg-zinc-900/40 text-center max-w-2xl mx-auto my-8">
        <Calendar className="w-12 h-12 text-emerald-400 mb-4 opacity-80" />
        <h3 className="text-xl font-bold text-zinc-100 mb-2">
          Nenhum confronto gerado
        </h3>
        <p className="text-sm text-zinc-400 mb-6 max-w-md">
          As equipes estão prontas! Clique no botão abaixo para gerar automaticamente a tabela de jogos ajustada para a estrutura do seu campeonato.
        </p>

        {error && (
          <div className="mb-4 flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Button
          onClick={() => handleGenerate()}
          disabled={isGenerating}
          className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold px-6 py-2 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isGenerating ? "animate-spin" : ""}`} />
          {isGenerating ? "Gerando Confrontos..." : "Gerar Tabela de Jogos"}
        </Button>
      </div>
    );
  }

  const isKnockoutPhase =
    currentRound?.type === "KNOCKOUT" ||
    Boolean(currentRound?.name?.match(/(Oitavas|Quartas|Semi|Final|Playoff|Pré)/i));

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 p-2">
      {error && (
        <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-zinc-950 border border-zinc-800 rounded-xl">
            {isKnockoutPhase ? (
              <Trophy className="w-5 h-5 text-amber-400" />
            ) : (
              <Shield className="w-5 h-5 text-emerald-400" />
            )}
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-100">Jogos Oficiais</h2>
            <p className="text-[11px] text-zinc-500 font-mono">
              {isKnockoutPhase ? "Fase Eliminatória (Mata-Mata)" : "Fase de Classificação / Grupos"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <select
            value={selectedRoundIndex}
            onChange={(e) => setSelectedRoundIndex(Number(e.target.value))}
            className="bg-zinc-950 text-xs sm:text-sm text-zinc-200 border border-zinc-800 rounded-xl px-4 py-2 font-bold cursor-pointer focus:outline-none focus:border-emerald-500 shadow-inner max-w-[220px] truncate"
          >
            {rounds.map((round, index) => (
              <option key={round.id || index} value={index} className="bg-zinc-900 text-zinc-200">
                {round.name || `${round.round_number ?? index + 1}ª Rodada`}
              </option>
            ))}
          </select>

          <button
            onClick={() => handleGenerate()}
            disabled={isGenerating}
            title="Regerar Confrontos"
            className="p-2.5 rounded-xl bg-zinc-950 hover:bg-red-950/40 border border-zinc-800 text-zinc-400 hover:text-red-400 hover:border-red-500/50 transition-all shrink-0 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isGenerating ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {currentRound?.matches && currentRound.matches.length > 0 ? (
          currentRound.matches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))
        ) : (
          <div className="text-center py-12 bg-zinc-900/40 rounded-2xl border border-zinc-800/80 text-zinc-500 text-xs font-mono">
            Nenhuma partida agendada para esta fase/rodada.
          </div>
        )}
      </div>
    </div>
  );
}
