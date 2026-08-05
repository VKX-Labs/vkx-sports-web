"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Plus, UserMinus, Users } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { PlayerService } from "@/services/players/player.service";
import type { Player } from "@/types/player";
import AddSquadPlayerModal from "@/components/forms/AddSquadPlayerModal";
import { routes } from "@/lib/routes";
import { useWorkspace } from "@/features/championships/components/workspace/WorkspaceProvider";

interface TeamDetail {
  id: string;
  name: string;
  short_name: string | null;
  badge_url: string | null;
}

export default function EquipeDetalhesPage() {
  const router = useRouter();
  const { id: championshipId, teamId } = useParams<{
    id: string;
    teamId: string;
  }>();

  const { canEdit } = useWorkspace();
  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [squad, setSquad] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddPlayerOpen, setIsAddPlayerOpen] = useState(false);

  const openModal = () => setIsAddPlayerOpen(true);
  const closeModal = () => setIsAddPlayerOpen(false);

  const loadTeamData = useCallback(async () => {
    try {
      setLoading(true);

      const { data: teamData, error: teamError } = await supabase
        .from("teams")
        .select("*")
        .eq("id", teamId)
        .single();

      if (teamError) throw teamError;

      setTeam(teamData);

      const { data: squadData, error: squadError } = await supabase
        .from("players")
        .select("*")
        .eq("team_id", teamId)
        .order("name");

      if (squadError) throw squadError;

      setSquad(squadData ?? []);
    } catch (error) {
      console.error("Erro ao carregar equipe:", error);
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    if (!teamId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadTeamData();
  }, [teamId, loadTeamData]);

  const handleRemoveFromTeam = async (playerId: string) => {
    try {
      await PlayerService.editPlayer(playerId, { team_id: null });
      loadTeamData();
    } catch {
      alert("Erro ao remover atleta do time.");
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-emerald-500" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="py-12 text-center text-slate-400">
        Equipe não encontrada.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() =>
          router.push(routes.dashboard.teams(championshipId))
        }
        className="flex items-center gap-2 text-xs font-semibold text-slate-400 transition hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para Equipes
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-950 p-4 sm:p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shrink-0">
            {team.badge_url ? (
              <img
                src={team.badge_url}
                alt={team.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <Users className="h-7 w-7 sm:h-8 sm:w-8 text-slate-600" />
            )}
          </div>

          <div className="min-w-0">
            <h1 className="flex items-center gap-2 text-lg sm:text-xl font-bold tracking-tight text-white">
              <span className="truncate">{team.name}</span>

              {team.short_name && (
                <span className="shrink-0 rounded-md border border-slate-800 bg-slate-900 px-2 py-0.5 font-mono text-xs font-bold text-slate-400">
                  {team.short_name}
                </span>
              )}
            </h1>

            <p className="mt-0.5 text-xs text-slate-500">
              {squad.length} atletas no elenco
            </p>
          </div>
        </div>

        {canEdit && (
          <button
            onClick={openModal}
            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-lg transition hover:bg-emerald-600 shrink-0"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            Adicionar Atleta
          </button>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
          Elenco Atual
        </h2>

        {squad.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {squad.map((player) => (
              <div
                key={player.id}
                className="group flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-3 transition hover:border-slate-700"
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

                  <h3 className="text-xs font-bold text-white transition group-hover:text-emerald-400">
                    {player.name}
                  </h3>
                </div>

                {canEdit && (
                  <button
                    onClick={() => handleRemoveFromTeam(player.id)}
                    title="Remover atleta"
                    className="rounded-lg p-2 text-slate-500 transition hover:bg-red-500/10 hover:text-red-400"
                  >
                    <UserMinus className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/10 p-12 text-center">
            <Users className="mx-auto mb-3 h-8 w-8 text-slate-600" />

            <h3 className="text-xs font-bold text-white">
              Nenhum atleta no elenco
            </h3>

            <p className="mt-1 text-[11px] text-slate-500">
              Este time ainda não possui jogadores vinculados.
            </p>
          </div>
        )}
      </div>

      {canEdit && (
        <AddSquadPlayerModal
          championshipId={championshipId}
          teamId={teamId}
          isOpen={isAddPlayerOpen}
          onClose={closeModal}
          onSuccess={loadTeamData}
        />
      )}
    </div>
  );
}