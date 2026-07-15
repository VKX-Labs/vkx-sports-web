"use client";

import React, { useState, useEffect } from "react";
import { X, UserPlus, Loader2, Users, Search } from "lucide-react";
import { PlayerService } from "@/services/players/player.service";
import type { Player } from "@/types/player";

interface AddSquadPlayerModalProps {
  championshipId: string;
  teamId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddSquadPlayerModal({ championshipId, teamId, isOpen, onClose, onSuccess }: AddSquadPlayerModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
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
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddPlayer = async (playerId: string) => {
    try {
      setSaving(true);
      await PlayerService.editPlayer(playerId, { team_id: teamId });
      setPlayers((prev) => prev.filter((p) => p.id !== playerId));
      onSuccess();
    } catch {
      alert("Erro ao adicionar atleta ao elenco.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-brand-dark border border-slate-850 rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[80vh]">

        <div className="p-5 border-b border-slate-800/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-brand-accent" />
            <h2 className="text-base font-bold text-brand-textPrimary">Adicionar ao Elenco</h2>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 text-brand-textSecondary hover:text-brand-textPrimary rounded-lg hover:bg-slate-800/50 transition">
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
              placeholder="Buscar jogador por nome..."
              className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2.5 pr-4 pl-10 text-xs text-brand-textPrimary placeholder-slate-600 transition focus:border-brand-accent focus:outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4 scrollbar-none">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-brand-accent" />
            </div>
          ) : filteredPlayers.length > 0 ? (
            <div className="space-y-2">
              {filteredPlayers.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/50 p-3 transition hover:border-slate-700"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-800 bg-slate-900">
                      {player.photo_url ? (
                        <img src={player.photo_url} alt={player.name} className="h-full w-full object-cover" />
                      ) : (
                        <Users className="h-4 w-4 text-slate-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-brand-textPrimary">{player.name}</h3>
                      <span className="text-[10px] text-slate-500">{player.team_name}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddPlayer(player.id)}
                    disabled={saving}
                    className="rounded-lg px-3 py-1.5 text-[10px] font-bold bg-brand-accent text-slate-950 transition hover:bg-brand-accentHover disabled:opacity-50"
                  >
                    Adicionar
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="mb-3 h-8 w-8 text-slate-600" />
              <h3 className="text-xs font-bold text-brand-textPrimary">
                {searchQuery ? "Nenhum jogador encontrado" : "Nenhum jogador disponível"}
              </h3>
              <p className="mt-1 max-w-xs text-[11px] text-slate-500">
                {searchQuery
                  ? "Tente buscar com outro nome."
                  : "Todos os jogadores deste campeonato já estão em elencos."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
