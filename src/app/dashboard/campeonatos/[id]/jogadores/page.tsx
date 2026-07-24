"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Plus, Users, Search, Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import PlayerForm from "@/components/forms/PlayerForm";
import EditPlayerModal from "@/components/forms/EditPlayerModal";
import { PlayerService } from "@/services/players/player.service";
import { supabase } from "@/lib/supabase";
import type { Player } from "@/types/player";
import type { Team } from "@/types/team";

export default function JogadoresPage() {
  const { id: championshipId } = useParams<{ id: string }>();

  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedPlayerForEdit, setSelectedPlayerForEdit] = useState<Player | null>(null);

  const fetchData = useCallback(async () => {
    if (!championshipId) return;

    try {
      setLoading(true);

      const [playersData, teamsResponse] = await Promise.all([
        PlayerService.listPlayers(championshipId),
        supabase
          .from("teams")
          .select("id, name, logo_url")
          .eq("season_id", championshipId),
      ]);

      setPlayers(playersData || []);
      setTeams((teamsResponse.data as Team[]) || []);
    } catch (err) {
      console.error("Erro ao carregar dados dos jogadores:", err);
    } finally {
      setLoading(false);
    }
  }, [championshipId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredPlayers = players.filter((player) =>
    player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (player.nickname && player.nickname.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">Jogadores</h1>
          </div>
          <p className="text-xs text-slate-400">
            Cadastre e gerencie os jogadores deste campeonato.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition duration-200 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          Novo Jogador
        </button>
      </div>

      <div className="relative w-full max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Pesquisar jogador por nome..."
          className="w-full bg-slate-900/40 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition"
        />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
          <span className="text-xs text-slate-400">Carregando elenco...</span>
        </div>
      ) : filteredPlayers.length === 0 ? (
        <div className="border border-dashed border-slate-800 rounded-2xl p-8 sm:p-12 flex flex-col items-center justify-center text-center bg-slate-950/20">
          <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4 text-slate-500">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-white">
            {searchTerm ? "Nenhum jogador encontrado" : "Nenhum jogador cadastrado"}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            {searchTerm
              ? "Tente buscar com outro termo."
              : "Adicione seus atletas diretamente no campeonato de forma independente ou associe-os a equipes já criadas."}
          </p>
          {!searchTerm && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-5 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition"
            >
              Cadastrar o primeiro jogador →
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredPlayers.map((player) => (
            <div
              key={player.id}
              onClick={() => setSelectedPlayerForEdit(player)}
              className="group bg-slate-900/40 hover:bg-slate-900/80 border border-slate-800/80 hover:border-emerald-500/40 rounded-2xl p-4 flex items-center gap-3.5 cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/5"
            >
              <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden flex-shrink-0 group-hover:border-emerald-500/30 transition">
                {player.photo_url ? (
                  <img
                    src={player.photo_url}
                    alt={player.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Users className="w-6 h-6 text-slate-600 group-hover:text-emerald-400 transition" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-white truncate group-hover:text-emerald-400 transition">
                  {player.name}
                </h3>
                <span className="inline-block mt-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full truncate border border-emerald-500/20">
                  {player.team_name || "Sem equipe"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <PlayerForm
        championshipId={championshipId}
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchData}
      />

      <EditPlayerModal
        player={selectedPlayerForEdit}
        teams={teams}
        isOpen={!!selectedPlayerForEdit}
        onClose={() => setSelectedPlayerForEdit(null)}
        onSuccess={fetchData}
      />
    </div>
  );
}