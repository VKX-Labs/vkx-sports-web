"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Plus, Search, Trash2, Users } from "lucide-react";

import { supabase } from "@/lib/supabase";
import PlayerForm from "@/components/forms/PlayerForm";
import { PlayerRepository } from "@/repositories/player.repository";
import { Player } from "@/types/player";

export default function JogadoresPage() {
  const { id: championshipId } = useParams<{ id: string }>();

  const [players, setPlayers] = useState<Player[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const loadPlayers = useCallback(async () => {
    try {
      setLoading(true);

      const { data: seasonData, error } = await supabase
        .from("seasons")
        .select("id")
        .eq("championship_id", championshipId)
        .single();

      if (error || !seasonData) {
        setPlayers([]);
        return;
      }

      const data = await PlayerRepository.getPlayersBySeason(seasonData.id);
      setPlayers(data);
    } catch (error) {
      console.error("Erro ao carregar jogadores:", error);
    } finally {
      setLoading(false);
    }
  }, [championshipId]);

  useEffect(() => {
    if (!championshipId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPlayers();
  }, [championshipId, loadPlayers]);

  const handleDeletePlayer = async (playerId: string) => {
    const confirmed = confirm(
      "Deseja realmente remover este jogador do campeonato?"
    );

    if (!confirmed) return;

    try {
      await PlayerRepository.deletePlayer(playerId);
      loadPlayers();
    } catch {
      alert("Erro ao excluir jogador.");
    }
  };

  const filteredPlayers = players.filter((player) =>
    player.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-emerald-400" />
            <h1 className="text-xl font-bold tracking-tight text-white">
              Jogadores
            </h1>
          </div>

          <p className="text-xs text-slate-400">
            Cadastre e gerencie os jogadores das equipes deste campeonato.
          </p>
        </div>

        <button
          onClick={openModal}
          className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-lg transition hover:bg-emerald-600"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          Novo Jogador
        </button>
      </div>

      <div className="relative w-full max-w-md">
        <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-500" />

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Pesquisar jogador por nome..."
          className="w-full rounded-xl border border-slate-800 bg-slate-900/40 py-2.5 pr-4 pl-11 text-xs text-white placeholder-slate-500 transition focus:border-emerald-500/50 focus:outline-none"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-emerald-500" />
        </div>
      ) : filteredPlayers.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPlayers.map((player) => (
            <div
              key={player.id}
              className="group flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950 p-4 transition hover:border-slate-700"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-800 bg-slate-900">
                  {player.photo_url ? (
                    <img
                      src={player.photo_url}
                      alt={player.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Users className="h-5 w-5 text-slate-600" />
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white transition group-hover:text-emerald-400">
                    {player.name}
                  </h3>

                  <span
                    className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                      player.team_id
                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                        : "border-slate-800 bg-slate-900 text-slate-500"
                    }`}
                  >
                    {player.team_name ?? "Sem equipe"}
                  </span>
                </div>
              </div>

              <button
                onClick={() => handleDeletePlayer(player.id)}
                title="Excluir atleta"
                className="rounded-lg p-1.5 text-slate-500 opacity-0 transition group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-950/20 p-12 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-500">
            <Users className="h-6 w-6" />
          </div>

          <h3 className="text-sm font-semibold text-white">
            Nenhum jogador encontrado
          </h3>

          <p className="mt-1 max-w-sm text-xs text-slate-500">
            {searchQuery
              ? "Não encontramos nenhum jogador com esse nome."
              : "Adicione seus atletas diretamente no campeonato de forma independente."}
          </p>

          {!searchQuery && (
            <button
              onClick={openModal}
              className="mt-5 text-xs font-bold text-emerald-400 transition hover:text-emerald-300"
            >
              Cadastrar jogador →
            </button>
          )}
        </div>
      )}

      <PlayerForm
        championshipId={championshipId}
        isOpen={isModalOpen}
        onClose={closeModal}
        onSuccess={loadPlayers}
      />
    </div>
  );
}