"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  UserPlus,
  Loader2,
  Users,
  Search,
  PlusCircle,
  ArrowRightLeft,
} from "lucide-react";
import { PlayerService } from "@/services/players/player.service";
import type { Player } from "@/types/player";

interface AddSquadPlayerModalProps {
  championshipId: string;
  teamId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddSquadPlayerModal({
  championshipId,
  teamId,
  isOpen,
  onClose,
  onSuccess,
}: AddSquadPlayerModalProps) {
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!isOpen || !championshipId) return;

    setLoading(true);
    PlayerService.listPlayers(championshipId)
      .then((data) => setPlayers(data.filter((p) => p.team_id !== teamId)))
      .catch(() => setPlayers([]))
      .finally(() => setLoading(false));
  }, [isOpen, championshipId, teamId]);

  if (!isOpen) return null;

  const filteredPlayers = players.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  const handleTransferPlayer = async (playerId: string) => {
    try {
      setSavingId(playerId);
      await PlayerService.transferPlayerToTeam(playerId, teamId);
      setPlayers((prev) => prev.filter((p) => p.id !== playerId));
      onSuccess();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Erro ao transferir atleta.");
    } finally {
      setSavingId(null);
    }
  };

  const handleCreateAndAddPlayer = async () => {
    const trimmedName = searchQuery.trim();
    if (!trimmedName) return;

    try {
      setIsCreating(true);
      await PlayerService.registerPlayer(championshipId, {
        name: trimmedName,
        team_id: teamId,
      });
      setSearchQuery("");
      onSuccess();
      onClose();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Erro ao criar novo atleta.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm">
      <div className="bg-brand-dark border border-slate-850 rounded-2xl w-full max-w-md mx-auto shadow-2xl flex flex-col max-h-[85vh] overflow-y-auto">
        <div className="p-4 sm:p-5 border-b border-slate-800/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-brand-accent" />
            <h2 className="text-base font-bold text-brand-textPrimary">
              Adicionar ao Elenco
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-brand-textSecondary hover:text-brand-textPrimary rounded-lg hover:bg-slate-800/50 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar ou digitar nome para criar..."
              className="w-full rounded-xl border border-slate-800 bg-slate-900 md:py-2.5 py-3 pr-4 pl-10 text-xs text-brand-textPrimary placeholder-slate-600 transition focus:border-brand-accent focus:outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2 scrollbar-none">
          {searchQuery.trim().length > 0 && (
            <button
              type="button"
              onClick={handleCreateAndAddPlayer}
              disabled={isCreating}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-dashed border-brand-accent/40 bg-brand-accent/10 hover:bg-brand-accent/20 transition text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-accent/20 text-brand-accent">
                  {isCreating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <PlusCircle className="h-4 w-4" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-brand-textPrimary">
                    Criar "{searchQuery.trim()}"
                  </p>
                  <p className="text-[10px] text-brand-accent">
                    Cadastrar e vincular a esta equipe
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-lg bg-brand-accent text-slate-950">
                Criar
              </span>
            </button>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-brand-accent" />
            </div>
          ) : filteredPlayers.length > 0 ? (
            <div className="space-y-2">
              {filteredPlayers.map((player) => {
                const isTransferred = Boolean(player.team_id);
                const isProcessing = savingId === player.id;

                return (
                  <div
                    key={player.id}
                    className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/50 p-3 transition hover:border-slate-700"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-800 bg-slate-900">
                        {player.photo_url ? (
                          <img
                            src={player.photo_url}
                            alt={player.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Users className="h-4 w-4 text-slate-600" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-brand-textPrimary">
                          {player.name}
                        </h3>
                        <span
                          className={`text-[10px] font-medium ${
                            isTransferred
                              ? "text-amber-400"
                              : "text-emerald-400"
                          }`}
                        >
                          {isTransferred
                            ? `No ${player.team_name || "outro clube"}`
                            : "Sem clube (Livre)"}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleTransferPlayer(player.id)}
                      disabled={isProcessing || isCreating}
                      className={`flex items-center gap-1.5 rounded-lg px-3 md:py-1.5 py-2 text-[10px] font-bold transition disabled:opacity-50 ${
                        isTransferred
                          ? "bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30"
                          : "bg-brand-accent text-slate-950 hover:bg-brand-accentHover"
                      }`}
                    >
                      {isProcessing ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : isTransferred ? (
                        <>
                          <ArrowRightLeft className="h-3 w-3" />
                          Transferir
                        </>
                      ) : (
                        "Adicionar"
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            !searchQuery.trim() && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="mb-3 h-8 w-8 text-slate-600" />
                <h3 className="text-xs font-bold text-brand-textPrimary">
                  Nenhum jogador disponível
                </h3>
                <p className="mt-1 max-w-xs text-[11px] text-slate-500">
                  Digite o nome acima para criar um novo atleta ou busque por
                  jogadores de outras equipes.
                </p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}