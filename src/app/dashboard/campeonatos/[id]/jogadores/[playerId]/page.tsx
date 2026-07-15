"use client";

import React, { useState } from "react";
import { Plus, Users } from "lucide-react";
import { useParams } from "next/navigation";
import PlayerForm from "@/components/forms/PlayerForm";

export default function JogadoresPage() {
  const { id: championshipId } = useParams<{ id: string }>();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* CABEÇALHO COM O BOTÃO NOVO JOGADOR */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-brand-accent text-emerald-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">Jogadores</h1>
          </div>
          <p className="text-xs text-slate-400">
            Cadastre e gerencie os jogadores das equipes de <span className="text-emerald-400 font-medium">Teste</span>.
          </p>
        </div>

        {/* BOTÃO ADICIONAR JOGADOR */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition duration-200 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          Novo Jogador
        </button>
      </div>

      {/* ÁREA DE BUSCA */}
      <div className="w-full">
        <input
          type="text"
          placeholder="Pesquisar jogador por nome..."
          className="w-full max-w-md bg-slate-900/40 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition"
        />
      </div>

      {/* ESTADO VAZIO (EMPTY STATE) */}
      <div className="border border-dashed border-slate-800 rounded-2xl p-12 flex flex-col items-center justify-center text-center bg-slate-950/20">
        <div className="w-12 h-12 rounded-xl bg-slate-905 border border-slate-800 flex items-center justify-center mb-4 text-slate-500">
          <Users className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-white">Nenhum jogador cadastrado</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          Adicione seus atletas diretamente no campeonato de forma independente ou associe-os a equipes já criadas.
        </p>
        <button
          onClick={() => setIsModalOpen(true)}
          className="mt-5 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition"
        >
          Cadastrar o primeiro jogador →
        </button>
      </div>

      <PlayerForm
        championshipId={championshipId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {}}
      />
    </div>
  );
}