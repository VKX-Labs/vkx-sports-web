"use client";

import React from "react";
import { useRodadasPageController } from "./hooks/useRodadasPageController";
import { Calendar, RefreshCw, Shield, Trophy, Plus, Trash2 } from "lucide-react";
import Button from "@/components/ui/button";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { MatchCard } from "./components/MatchCard";
import { CreateMatchModal } from "./components/CreateMatchModal";
import { EditMatchModal } from "./components/EditMatchModal";
import type { EditMatchTarget } from "./components/EditMatchModal";

export default function RodadasPage() {
  const {
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
    handleDeleteMatch,
    handleUpdateMatch,
  } = useRodadasPageController();

  const [matchToEdit, setMatchToEdit] = React.useState<EditMatchTarget | null>(null);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <LoadingSpinner message="Carregando tabela de jogos..." />
      </div>
    );
  }

  if (!rounds || rounds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center border border-dashed border-zinc-800 rounded-2xl p-12 bg-zinc-900/40 text-center max-w-2xl mx-auto my-8">
        <Calendar className="w-12 h-12 text-emerald-400 mb-4 opacity-80" />
        <h3 className="text-xl font-bold text-zinc-100 mb-2">
          Nenhum confronto ou rodada encontrada
        </h3>
        <p className="text-sm text-zinc-400 mb-6 max-w-md">
          Você pode criar uma rodada manualmente para montar seus jogos ou atualizar a página.
        </p>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleAddRound}
            disabled={isCreatingRound}
            className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold px-6 py-2 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            {isCreatingRound ? "Criando..." : "Criar Primeira Rodada"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 p-2">
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

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
          <select
            value={selectedRoundIndex}
            onChange={(e) => setSelectedRoundIndex(Number(e.target.value))}
            className="bg-zinc-950 text-xs sm:text-sm text-zinc-200 border border-zinc-800 rounded-xl px-3 py-2 font-bold cursor-pointer focus:outline-none focus:border-emerald-500 shadow-inner max-w-[180px] truncate"
          >
            {rounds.map((round, idx) => (
              <option key={round.id || idx} value={idx} className="bg-zinc-900 text-zinc-200">
                {round.name || `${round.round_number}ª Rodada`}
              </option>
            ))}
          </select>

          <button
            onClick={handleAddRound}
            disabled={isCreatingRound}
            title="Adicionar Nova Rodada"
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-semibold transition shrink-0 cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Nova Rodada</span>
          </button>

          <button
            onClick={handleDeleteRound}
            disabled={isDeletingRound || !currentRound}
            title="Excluir Rodada Atual"
            className="p-2.5 rounded-xl bg-zinc-950 hover:bg-red-500/10 border border-zinc-800 hover:border-red-500/40 text-zinc-400 hover:text-red-400 transition shrink-0 cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            disabled={!currentRound}
            title="Adicionar Jogo nesta Rodada"
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer shadow-lg shadow-emerald-500/10 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Jogo</span>
          </button>

          <button
            onClick={handleRefresh}
            title="Recarregar Dados"
            className="p-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition shrink-0 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {currentRound?.matches && currentRound.matches.length > 0 ? (
          currentRound.matches.map((match) => (
            <div key={match.id} className="relative group">
              <MatchCard
                match={match}
                onEdit={setMatchToEdit}
                onDelete={handleDeleteMatch}
              />
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 bg-zinc-900/40 rounded-2xl border border-zinc-800/80 text-zinc-500 text-xs font-mono gap-3">
            <p>Nenhuma partida agendada para esta rodada.</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-emerald-400 hover:underline font-sans text-xs flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Criar o primeiro jogo agora
            </button>
          </div>
        )}
      </div>

      {currentRound && (
        <CreateMatchModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          teams={teams || []}
          onSave={handleCreateMatch}
        />
      )}

      <EditMatchModal
        isOpen={Boolean(matchToEdit)}
        onClose={() => setMatchToEdit(null)}
        teams={teams || []}
        match={matchToEdit}
        onSave={handleUpdateMatch}
      />
    </div>
  );
}