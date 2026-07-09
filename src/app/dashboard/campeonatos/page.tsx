"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  Loader2,
  MapPin,
  Plus,
  Trash2,
  Trophy,
  Users,
} from "lucide-react";

import DashboardHeader from "@/components/dashboard/Header";
import EmptyState from "@/components/dashboard/EmptyState";
import ChampionshipFormModal from "@/components/dashboard/ChampionshipFormModal";
import {
  deleteChampionship,
  getMyChampionships,
} from "@/services/championships";
import type { Championship } from "@/types/championship";

export default function CampeonatosPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [championships, setChampionships] = useState<Championship[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadChampionships();
  }, []);

  async function loadChampionships() {
    try {
      setLoading(true);
      const data = await getMyChampionships();
      setChampionships(data ?? []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    const confirmed = confirm(
      `Tem certeza que deseja excluir o campeonato "${name}"?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(id);

      await deleteChampionship(id);

      setChampionships((prev) => prev.filter((champ) => champ.id !== id));
    } catch (error) {
      alert(error instanceof Error ? error.message : "Erro ao excluir campeonato.");
    } finally {
      setDeletingId(null);
    }
  }

  function handleSuccess() {
    loadChampionships();
  }

  function formatType(type: string) {
    const types: Record<string, string> = {
      PONTOS_CORRIDOS: "Pontos Corridos",
      MATA_MATA: "Mata-mata",
      GRUPOS_MATA_MATA: "Grupos + Mata-mata",
      COPA: "Copa",
    };

    return types[type] || type;
  }

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Campeonatos"
        description="Gerencie suas ligas e competições ativas."
      >
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/10 transition hover:bg-emerald-600"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          Novo campeonato
        </button>
      </DashboardHeader>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      ) : championships.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="Nenhum campeonato criado"
          description="Você ainda não possui competições registradas. Comece criando seu primeiro campeonato."
          action={
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="mt-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              Criar campeonato
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {championships.map((champ) => {
            const season = champ.seasons?.[0] ?? {};

            return (
              <div
                key={champ.id}
                className="group flex flex-col justify-between rounded-2xl border border-slate-800 bg-[#111827]/50 p-5 transition hover:border-slate-700"
              >
                <div>
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-emerald-400">
                        {champ.name}
                      </h3>

                      <p className="text-xs font-semibold text-emerald-500">
                        {season.name || "Temporada Inicial"}
                      </p>
                    </div>

                    <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-[10px] font-bold uppercase text-amber-400">
                      {season.status === "CONFIGURACAO"
                        ? "Configuração"
                        : season.status}
                    </span>
                  </div>

                  <div className="my-4 grid grid-cols-2 gap-3 border-y border-slate-800 py-3 text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {formatType(season.tournament_type)}
                    </div>

                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Máx: {season.max_teams || "Ilimitado"}
                    </div>

                    <div className="col-span-2 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {season.city && season.state
                        ? `${season.city} - ${season.state}`
                        : "Local não definido"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    disabled={deletingId === champ.id}
                    onClick={() => handleDelete(champ.id, champ.name)}
                    className="rounded-xl border border-slate-800 bg-slate-900/50 p-2.5 text-slate-400 transition hover:border-red-500/20 hover:bg-red-500/5 hover:text-red-400 disabled:opacity-50"
                  >
                    {deletingId === champ.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>

                  <Link
                    href={`/dashboard/campeonatos/${champ.id}`}
                    className="flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-500 hover:text-slate-950"
                  >
                    Gerenciar Workspace
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ChampionshipFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
      />
    </div>
  );
}