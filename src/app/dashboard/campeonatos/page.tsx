"use client";

import { useState } from "react";
import { Plus, Trophy } from "lucide-react";

import DashboardHeader from "@/components/dashboard/Header";
import EmptyState from "@/components/dashboard/EmptyState";

export default function CampeonatosPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Campeonatos"
        description="Gerencie suas ligas e competições ativas."
      >
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex cursor-pointer items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/10 transition hover:bg-emerald-600"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          Novo campeonato
        </button>
      </DashboardHeader>

      <EmptyState
        icon={Trophy}
        title="Nenhum campeonato criado"
        description="Você ainda não possui competições registradas. Comece criando seu primeiro campeonato."
        action={
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="mt-2 cursor-pointer rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            Criar campeonato
          </button>
        }
      />

      {isModalOpen && (
        <></>
      )}
    </div>
  );
}