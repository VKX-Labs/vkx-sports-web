"use client";

import {
  Settings,
  X,
  Shuffle,
  Repeat,
  AlertTriangle,
  Loader2,
  Wand2,
} from "lucide-react";
import type { GeneratorOptions } from "../hooks/useTournamentGenerator";
import type {
  TournamentType,
  PlayoffPhase,
  PhaseKnockoutRules,
} from "@/types/tournament";
import {
  PHASE_ORDER,
  getDefaultKnockoutRules,
  getPhaseRules,
} from "@/types/tournament";

interface GeneratorOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamCount: number;
  tournamentType: TournamentType | null;
  options: GeneratorOptions;
  setOptions: React.Dispatch<React.SetStateAction<GeneratorOptions>>;
  generating: boolean;
  onGenerate: () => Promise<void>;
}

export function GeneratorOptionsModal({
  isOpen,
  onClose,
  teamCount,
  tournamentType,
  options,
  setOptions,
  generating,
  onGenerate,
}: GeneratorOptionsModalProps) {
  if (!isOpen) return null;

  const isKnockout =
    tournamentType === "COPA" || tournamentType === "MATA_MATA";

  const baseRules = options.knockoutRules ?? getDefaultKnockoutRules();
  const twoLeggedEnabled = PHASE_ORDER.some((phase) =>
    getPhaseRules(baseRules, phase).two_legged
  );

  const handleToggleTwoLegged = (checked: boolean) => {
    setOptions((prev) => {
      const base = prev.knockoutRules ?? getDefaultKnockoutRules();
      const phases: Partial<Record<PlayoffPhase, PhaseKnockoutRules>> = {};
      for (const phase of PHASE_ORDER) {
        phases[phase] = {
          ...getPhaseRules(base, phase),
          two_legged: checked,
        };
      }
      return { ...prev, knockoutRules: { ...base, phases } };
    });
  };

  const handleConfirm = async () => {
    try {
      await onGenerate();
    } finally {
      onClose();
    }
  };

  const isInvalid = teamCount < 2;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-500" /> Gerar Tabela /
            Confrontos Automáticos
          </h3>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs py-1.5 border-b border-zinc-800">
            <span className="text-zinc-400">Equipes cadastradas:</span>
            <span
              className={`font-bold ${
                !isInvalid ? "text-emerald-400" : "text-amber-500"
              }`}
            >
              {teamCount} / mínimo 2
            </span>
          </div>

          {isInvalid && (
            <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl flex gap-2.5 items-start">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-400 leading-relaxed">
                Cadastre pelo menos 2 equipes para gerar os confrontos
                automaticamente.
              </p>
            </div>
          )}

          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={options.shuffle}
              onChange={(e) =>
                setOptions((prev) => ({
                  ...prev,
                  shuffle: e.target.checked,
                }))
              }
              className="mt-1 rounded border-zinc-700 text-emerald-500 focus:ring-emerald-500/25 bg-zinc-800"
            />
            <div>
              <span className="text-xs font-bold text-white flex items-center gap-1.5 group-hover:text-emerald-400 transition">
                <Shuffle className="w-3.5 h-3.5" /> Embaralhar equipes antes de
                gerar (Sorteio)
              </span>
              <p className="text-[10px] text-zinc-500">
                Garante confrontos totalmente aleatórios a cada nova geração.
              </p>
            </div>
          </label>

          {isKnockout ? (
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={twoLeggedEnabled}
                onChange={(e) => handleToggleTwoLegged(e.target.checked)}
                className="mt-1 rounded border-zinc-700 text-emerald-500 focus:ring-emerald-500/25 bg-zinc-800"
              />
              <div>
                <span className="text-xs font-bold text-white flex items-center gap-1.5 group-hover:text-emerald-400 transition">
                  <Repeat className="w-3.5 h-3.5" /> Ida e Volta (Jogos de ida e
                  volta)
                </span>
                <p className="text-[10px] text-zinc-500">
                  Cada confronto gera 2 partidas (Ida e Volta), criando rodadas
                  como &quot;Oitavas de Final - Ida&quot; e
                  &quot;Oitavas de Final - Volta&quot;.
                </p>
              </div>
            </label>
          ) : (
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={options.doubleRound}
                onChange={(e) =>
                  setOptions((prev) => ({
                    ...prev,
                    doubleRound: e.target.checked,
                  }))
                }
                className="mt-1 rounded border-zinc-700 text-emerald-500 focus:ring-emerald-500/25 bg-zinc-800"
              />
              <div>
                <span className="text-xs font-bold text-white flex items-center gap-1.5 group-hover:text-emerald-400 transition">
                  <Repeat className="w-3.5 h-3.5" /> Turno e Returno (Ida e
                  Volta)
                </span>
                <p className="text-[10px] text-zinc-500">
                  As equipes se enfrentam duas vezes, invertendo o mando de
                  campo.
                </p>
              </div>
            </label>
          )}

          <div className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl">
            <p className="text-[10px] text-zinc-500 leading-relaxed">
              Ao confirmar, os confrontos serão calculados e salvos. Caso já
              existam jogos ou rodadas, eles serão apagados e substituídos.
            </p>
          </div>
        </div>

        <div className="flex gap-3 pt-5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition font-medium text-sm"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isInvalid || generating}
            className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Gerando...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" /> Gerar Confrontos
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
