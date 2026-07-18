import React from "react";
import { Settings } from "lucide-react";
import { GeneratorOptions as IGeneratorOptions } from "../hooks/useTournamentGenerator";

interface GeneratorOptionsProps {
  options: IGeneratorOptions;
  setOptions: React.Dispatch<React.SetStateAction<IGeneratorOptions>>;
}

export default function GeneratorOptions({ options, setOptions }: GeneratorOptionsProps) {
  return (
    <div className="bg-slate-950 border border-slate-900 rounded-2xl p-6 space-y-4">
      <h2 className="text-sm font-bold text-white flex items-center gap-2">
        <Settings className="w-4 h-4 text-emerald-400" />
        Configurações da Geração
      </h2>

      <div className="space-y-4 pt-2">
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={options.shuffle}
            onChange={(e) => setOptions((prev) => ({ ...prev, shuffle: e.target.checked }))}
            className="mt-1 rounded border-slate-850 text-emerald-500 focus:ring-emerald-500/25 bg-slate-900"
          />
          <div>
            <span className="text-xs font-bold text-white group-hover:text-emerald-400 transition">
              Embaralhar equipes antes de gerar
            </span>
            <p className="text-[10px] text-slate-500">
              Garante confrontos totalmente aleatórios a cada nova geração.
            </p>
          </div>
        </label>

        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={options.doubleRound}
            onChange={(e) => setOptions((prev) => ({ ...prev, doubleRound: e.target.checked }))}
            className="mt-1 rounded border-slate-850 text-emerald-500 focus:ring-emerald-500/25 bg-slate-900"
          />
          <div>
            <span className="text-xs font-bold text-white group-hover:text-emerald-400 transition">
              Turno e Returno (Ida e Volta)
            </span>
            <p className="text-[10px] text-slate-500">
              As equipes se enfrentam duas vezes, invertendo o mando de campo.
            </p>
          </div>
        </label>
      </div>
    </div>
  );
}