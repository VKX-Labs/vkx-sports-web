"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Plus, Users, Search, Trash2 } from "lucide-react";
import PlayerForm from "@/components/forms/PlayerForm"; // Ajuste o caminho se seu PlayerForm estiver em outro local de components
import { PlayerRepository } from "@/repositories/player.repository";
import { Player } from "@/types/player";
import { supabase } from "@/lib/supabase";

export default function JogadoresPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  
  const params = useParams();
  const championshipId = params.id as string;

  // Carregar os jogadores resolvendo dinamicamente a temporada
  const loadPlayers = useCallback(async () => {
    try {
      setLoading(true);
      
      // 1. Busca a temporada correspondente ao campeonato
      const { data: seasonData, error: seasonError } = await supabase
        .from("seasons")
        .select("id")
        .eq("championship_id", championshipId)
        .single();

      if (seasonError || !seasonData) {
        setPlayers([]);
        return;
      }

      // 2. Busca os jogadores vinculados à temporada usando o repositório
      const data = await PlayerRepository.getPlayersBySeason(seasonData.id);
      setPlayers(data);
    } catch (error) {
      console.error("Erro ao carregar jogadores:", error);
    } finally {
      setLoading(false);
    }
  }, [championshipId]);

  useEffect(() => {
    if (championshipId) {
      loadPlayers();
    }
  }, [championshipId, loadPlayers]);

  // Excluir o jogador
  const handleDeletePlayer = async (playerId: string) => {
    if (confirm("Deseja realmente remover este jogador do campeonato?")) {
      try {
        await PlayerRepository.deletePlayer(playerId);
        loadPlayers();
      } catch (error) {
        alert("Erro ao excluir jogador.");
      }
    }
  };

  // Filtro local da barra de pesquisa
  const filteredPlayers = players.filter((player) =>
    player.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Topo */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">Jogadores</h1>
          </div>
          <p className="text-xs text-slate-400">
            Cadastre e gerencie os jogadores das equipes deste campeonato.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition duration-200 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          Novo Jogador
        </button>
      </div>

      {/* Input de Busca */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Pesquisar jogador por nome..."
          className="w-full bg-slate-900/40 border border-slate-800 rounded-xl pl-11 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition"
        />
      </div>

      {/* Exibição */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        </div>
      ) : filteredPlayers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlayers.map((player) => (
            <div 
              key={player.id} 
              className="bg-slate-950 border border-slate-850 hover:border-slate-800 rounded-2xl p-4 flex items-center justify-between transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                  {player.photo_url ? (
                    <img src={player.photo_url} alt={player.name} className="w-full h-full object-cover" />
                  ) : (
                    <Users className="w-5 h-5 text-slate-600" />
                  )}
                </div>
                
                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition">
                    {player.name}
                  </h3>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 inline-block ${
                    player.team_id 
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                      : "bg-slate-900 text-slate-500 border border-slate-800"
                  }`}>
                    {player.team_name || "Sem equipe"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition duration-150">
                <button 
                  onClick={() => handleDeletePlayer(player.id)}
                  className="p-1.5 hover:bg-red-500/10 text-slate-500 hover:text-red-400 rounded-lg transition"
                  title="Excluir Atleta"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="border border-dashed border-slate-800 rounded-2xl p-12 flex flex-col items-center justify-center text-center bg-slate-950/20">
          <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4 text-slate-500">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-white">Nenhum jogador encontrado</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            {searchQuery 
              ? "Não encontramos nenhum jogador com esse nome na busca." 
              : "Adicione seus atletas diretamente no campeonato de forma independente."}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-5 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition"
            >
              Cadastrar jogador →
            </button>
          )}
        </div>
      )}

      {isModalOpen && (
        <PlayerForm 
          championshipId={championshipId}
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={loadPlayers}
        />
      )}
    </div>
  );
}