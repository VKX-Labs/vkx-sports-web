import React from "react";
import { Calendar } from "lucide-react";

export default function Header() {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <Calendar className="w-6 h-6 text-emerald-400" />
        <h1 className="text-xl font-bold text-white tracking-tight">Rodadas e Jogos</h1>
      </div>
      <p className="text-xs text-slate-400">
        Gere e gerencie o calendário de confrontos do seu campeonato.
      </p>
    </div>
  );
}