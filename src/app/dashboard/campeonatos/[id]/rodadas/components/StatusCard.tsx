import React from "react";
import { AlertCircle } from "lucide-react";

interface StatusCardProps {
  teamCount: number;
  generating: boolean;
  onGenerate: () => void;
}

export default function StatusCard({ teamCount, generating, onGenerate }: StatusCardProps) {
  const isInvalid = teamCount < 2;

  return (
    <div className="bg-slate-950 border border-slate-900 rounded-2xl p-6 flex flex-col justify-between space-y-6">
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-white">Status da Preparação</h2>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs py-1 border-b border-slate-900">
            <span className="text-slate-400">Equipes cadastradas:</span>
            <span className={`font-bold ${!isInvalid ? "text-emerald-400" : "text-amber-500"}`}>
              {teamCount} / mínimo 2
            </span>
          </div>
          <div className="flex items-center justify-between text-xs py-1 border-b border-slate-900">
            <span className="text-slate-400">Formato de disputa:</span>
            <span className="font-bold text-white">Pontos Corridos</span>
          </div>
        </div>

        {isInvalid && (
          <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl flex gap-2.5 items-start">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[10px] text-amber-400 leading-relaxed">
              Você precisa cadastrar mais equipes para conseguir gerar a tabela de jogos automática.
            </p>
          </div>
        )}
      </div>

      <button
        onClick={onGenerate}
        disabled={isInvalid || generating}
        className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-900 disabled:text-slate-600 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition duration-200 cursor-pointer disabled:cursor-not-allowed"
      >
        {generating ? "Gerando Confrontos..." : "Gerar Campeonato Ativo"}
      </button>
    </div>
  );
}