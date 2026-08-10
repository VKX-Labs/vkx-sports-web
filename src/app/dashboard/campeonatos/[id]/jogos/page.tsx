"use client";

import React, { useState } from "react";
import { useRodadasPageController } from "./hooks/useRodadasPageController";
import { Calendar, RefreshCw, Shield, Trophy, Plus, Trash2, Wand2, ImageIcon } from "lucide-react";
import { getPhaseDisplayName, inferLegFromRoundName } from "@/types/tournament";
import Button from "@/components/ui/button";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { MatchCard, MatchCardMatch } from "./components/MatchCard";
import { CreateMatchModal } from "./components/CreateMatchModal";
import { EditMatchModal, EditMatchTarget } from "./components/EditMatchModal";
import { GeneratorOptionsModal } from "./components/GeneratorOptionsModal";
import { RoundArtModal } from "@/components/match/RoundArtModal";
import { useWorkspace } from "@/features/championships/components/workspace/WorkspaceProvider";

export default function RodadasPage() {
  const { championship, canEdit } = useWorkspace();

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
    isKnockoutTournament,
    tournamentType,
    generator,
    handleGenerate,
    phaseOptions,
    bracketSizes,
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
  const [isGeneratorModalOpen, setIsGeneratorModalOpen] = React.useState(false);
  const [isArtModalOpen, setIsArtModalOpen] = useState(false);

  const handleEditMatch = (
    match: MatchCardMatch & {
      phase?: string | null;
      bracket_position?: number | null;
    }
  ) => {
    setMatchToEdit({
      id: match.id,
      home_team_id: match.home_team_id ?? null,
      away_team_id: match.away_team_id ?? null,
      date: match.date ?? null,
      phase: match.phase ?? null,
      bracket_position: match.bracket_position ?? null,
      leg: inferLegFromRoundName(currentRound?.name),
    });
  };

  const selectedRoundName = currentRound?.name
    ? getPhaseDisplayName(currentRound.name)
    : currentRound?.round_number
    ? `${currentRound.round_number}ª Rodada`
    : "Rodada";

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <LoadingSpinner message="Carregando tabela de jogos..." />
      </div>
    );
  }

  if (!rounds || rounds.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center border border-dashed border-zinc-800 rounded-2xl p-12 bg-zinc-900/40 text-center max-w-2xl mx-auto my-8">
          <Calendar className="w-12 h-12 text-emerald-400 mb-4 opacity-80" />
          <h3 className="text-xl font-bold text-zinc-100 mb-2">
            Nenhum confronto ou rodada encontrada
          </h3>
          <p className="text-sm text-zinc-400 mb-6 max-w-md">
            {canEdit
              ? "Você pode criar uma rodada manualmente para montar seus jogos, gerar a tabela automaticamente ou atualizar a página."
              : "Este campeonato ainda não possui confrontos cadastrados."}
          </p>

          {canEdit && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                onClick={handleAddRound}
                disabled={isCreatingRound}
                className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold px-6 py-2 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                {isCreatingRound ? "Criando..." : "Criar Primeira Rodada"}
              </Button>

              <Button
                onClick={() => setIsGeneratorModalOpen(true)}
                disabled={generator.generating}
                className="bg-zinc-950 hover:bg-zinc-800 border border-zinc-700 text-emerald-400 hover:text-emerald-300 font-bold px-6 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Wand2 className="w-4 h-4" />
                Gerar Tabela / Confrontos Automáticos
              </Button>
            </div>
          )}
        </div>

        {canEdit && (
          <GeneratorOptionsModal
            isOpen={isGeneratorModalOpen}
            onClose={() => setIsGeneratorModalOpen(false)}
            teamCount={generator.teamCount}
            tournamentType={tournamentType}
            options={generator.options}
            setOptions={generator.setOptions}
            generating={generator.generating}
            onGenerate={async () => {
              await handleGenerate();
            }}
          />
        )}
      </>
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
              {isKnockoutTournament
                ? "Fase Eliminatória"
                : isKnockoutPhase
                ? "Fase Eliminatória (Mata-Mata)"
                : "Fase de Classificação / Grupos"}
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
                {round.name ? getPhaseDisplayName(round.name) : `${round.round_number}ª Rodada`}
              </option>
            ))}
          </select>

          {/* Botão de Gerar Arte da Rodada */}
          <button
            onClick={() => setIsArtModalOpen(true)}
            disabled={!currentRound?.matches || currentRound.matches.length === 0}
            title="Gerar Arte da Rodada em PNG"
            className="flex items-center gap-1.5 px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-xl text-xs font-semibold transition shrink-0 cursor-pointer disabled:opacity-40"
          >
            <ImageIcon className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Arte da Rodada</span>
          </button>

          {canEdit && (
            <button
              onClick={handleAddRound}
              disabled={isCreatingRound}
              title="Adicionar Nova Rodada"
              className="flex items-center gap-1.5 px-3 py-2 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-semibold transition shrink-0 cursor-pointer disabled:opacity-50"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Nova Rodada</span>
            </button>
          )}

          {canEdit && (
            <button
              onClick={handleDeleteRound}
              disabled={isDeletingRound || !currentRound}
              title="Excluir Rodada Atual"
              className="p-2.5 rounded-xl bg-zinc-950 hover:bg-red-500/10 border border-zinc-800 hover:border-red-500/40 text-zinc-400 hover:text-red-400 transition shrink-0 cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {canEdit && (
            <button
              onClick={() => setIsModalOpen(true)}
              disabled={!currentRound}
              title="Adicionar Jogo nesta Rodada"
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer shadow-lg shadow-emerald-500/10 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Jogo</span>
            </button>
          )}

          {canEdit && (
            <button
              onClick={() => setIsGeneratorModalOpen(true)}
              title="Gerar Tabela / Confrontos Automáticos"
              className="flex items-center gap-1.5 px-3 py-2 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-emerald-400 rounded-xl text-xs font-semibold transition shrink-0 cursor-pointer"
            >
              <Wand2 className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Gerar</span>
            </button>
          )}

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
                onEdit={canEdit ? handleEditMatch : undefined}
                onDelete={canEdit ? handleDeleteMatch : undefined}
              />
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 bg-zinc-900/40 rounded-2xl border border-zinc-800/80 text-zinc-500 text-xs font-mono gap-3">
            <p>Nenhuma partida agendada para esta rodada.</p>
            {canEdit && (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="text-emerald-400 hover:underline font-sans text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Criar o primeiro jogo agora
                </button>
                <span className="hidden sm:inline text-zinc-700">ou</span>
                <button
                  onClick={() => setIsGeneratorModalOpen(true)}
                  className="text-amber-400 hover:underline font-sans text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Wand2 className="w-3.5 h-3.5" /> Gerar Confrontos Automáticos
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {canEdit && currentRound && (
        <CreateMatchModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          teams={teams || []}
          isKnockout={isKnockoutTournament}
          phaseOptions={phaseOptions}
          bracketSizes={bracketSizes}
          onSave={handleCreateMatch}
        />
      )}

      {canEdit && (
        <EditMatchModal
          isOpen={Boolean(matchToEdit)}
          onClose={() => setMatchToEdit(null)}
          teams={teams || []}
          match={matchToEdit}
          isKnockout={isKnockoutTournament}
          phaseOptions={phaseOptions}
          bracketSizes={bracketSizes}
          onSave={handleUpdateMatch}
        />
      )}

      {canEdit && (
        <GeneratorOptionsModal
          isOpen={isGeneratorModalOpen}
          onClose={() => setIsGeneratorModalOpen(false)}
          teamCount={generator.teamCount}
          tournamentType={tournamentType}
          options={generator.options}
          setOptions={generator.setOptions}
          generating={generator.generating}
          onGenerate={async () => {
            await handleGenerate();
          }}
        />
      )}

      {/* Modal da Arte da Rodada */}
      <RoundArtModal
        isOpen={isArtModalOpen}
        onClose={() => setIsArtModalOpen(false)}
        championshipName={championship?.name || "Campeonato"}
        roundName={selectedRoundName}
        matches={(currentRound?.matches || []).map((m: any) => ({
          homeTeamName: m.home_team?.name || m.home_team_name || "Mandante",
          homeTeamBadge: m.home_team?.badge_url || m.home_team_badge,
          awayTeamName: m.away_team?.name || m.away_team_name || "Visitante",
          awayTeamBadge: m.away_team?.badge_url || m.away_team_badge,
          homeScore: m.home_score,
          awayScore: m.away_score,
          status: m.status,
        }))}
      />
    </div>
  );
}