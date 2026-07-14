"use client";

import React from "react";
import { useParams } from "next/navigation";
import { UserSquare2, Search, Loader2 } from "lucide-react";

import { useChampionship } from "@/hooks/useChampionship";

export default function JogadoresPage() {
  const { id } = useParams();
  const { championship, loading } = useChampionship(id as string);

  if (loading) {
    return (
      <div className="flex py-20 items-center justify-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
        <span className="text-sm text-slate-400 font-medium">
          Carregando jogadores...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/60 pb-5">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <UserSquare2 className="w-5 h-5 text-emerald-500" />
            Jogadores
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Cadastre e gerencie os jogadores das equipes de{" "}
            <span className="font-semibold text-emerald-400">
              {championship?.name || "campeonato"}
            </span>.
          </p>
        </div>
      </div>

      <div className="w-full max-w-md relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Pesquisar jogador por nome..."
          className="w-full bg-[#111827]/40 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition"
        />
      </div>

      <div className="rounded-2xl border border-dashed border-slate-800 p-12 text-center max-w-xl mx-auto mt-6">
        <UserSquare2 className="w-8 h-8 text-slate-700 mx-auto mb-3" />
        <h3 className="text-sm font-bold text-slate-300">
          Nenhum jogador cadastrado
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Cadastre equipes primeiro para então adicionar seus jogadores.
        </p>
      </div>
    </div>
  );
}
