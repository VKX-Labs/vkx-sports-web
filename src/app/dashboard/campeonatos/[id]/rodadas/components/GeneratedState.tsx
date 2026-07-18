import React from "react";
import { Check, RefreshCw } from "lucide-react";

interface GeneratedStateProps {
  generating: boolean;
  onGenerate: () => void;
}

export default function GeneratedState({ generating, onGenerate }: GeneratedStateProps) {
  const handleRegenerate = () => {
    if (
      confirm(
        "Atenção: Regerar os confrontos apagará TODOS os resultados e jogos atuais de forma definitiva. Deseja prosseguir?"
      )
    ) {
      onGenerate();
    }
  };

  return (
    <div className="bg-slate-950 border border-slate-900 rounded-2xl p-6 text-center space-y-4">
      <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
        <Check className="w-6 h-6" />
      </div>
      <div>
        <h3 className="text-md font-bold text-white">Tabela de Jogos Ativa</h3>
        <p className="text-xs text-slate-400 mt-1">
          Os confrontos automáticos foram calculados e salvos com sucesso.
        </p>
      </div>
      <div className="flex justify-center gap-3 pt-2">
        <button
          onClick={handleRegenerate}
          disabled={generating}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 text-xs font-semibold rounded-xl transition cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${generating ? "animate-spin" : ""}`} />
          Regerar Confrontos
        </button>
      </div>
    </div>
  );
}