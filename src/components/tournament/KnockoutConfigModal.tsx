"use client";

import React, { useState } from "react";
import { KnockoutRules } from "@/types/tournament";
import { Settings2, X, Check, ShieldAlert } from "lucide-react";

interface KnockoutConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  rules: KnockoutRules;
  onSaveRules: (newRules: KnockoutRules) => void;
}

export function KnockoutConfigModal({
  isOpen,
  onClose,
  rules,
  onSaveRules,
}: KnockoutConfigModalProps) {
  const [formRules, setFormRules] = useState<KnockoutRules>(rules);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveRules(formRules);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-2xl p-6 space-y-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-2 text-emerald-400">
            <Settings2 className="w-5 h-5" />
            <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">
              Regras do Mata-Mata / Playoffs
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Jogo Único vs Ida e Volta */}
          <div className="flex items-center justify-between p-3.5 bg-zinc-950/60 rounded-xl border border-zinc-800/80">
            <div>
              <p className="text-xs font-semibold text-zinc-200">Formato dos Confrontos</p>
              <p className="text-[11px] text-zinc-500">Ida e Volta (Duplo) ou Jogo Único</p>
            </div>
            <button
              type="button"
              onClick={() =>
                setFormRules((prev) => ({ ...prev, two_legged: !prev.two_legged }))
              }
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                formRules.two_legged
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                  : "bg-zinc-800 text-zinc-400 border border-zinc-700"
              }`}
            >
              {formRules.two_legged ? "Ida e Volta" : "Jogo Único"}
            </button>
          </div>

          {formRules.two_legged && (
            <div className="flex items-center justify-between p-3.5 bg-zinc-950/60 rounded-xl border border-zinc-800/80">
              <div>
                <p className="text-xs font-semibold text-zinc-200">Gol Fora de Casa</p>
                <p className="text-[11px] text-zinc-500">
                  Gols como visitante valem como critério de desempate
                </p>
              </div>
              <input
                type="checkbox"
                checked={formRules.away_goals_rule}
                onChange={(e) =>
                  setFormRules((prev) => ({
                    ...prev,
                    away_goals_rule: e.target.checked,
                  }))
                }
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
            </div>
          )}

          <div className="flex items-center justify-between p-3.5 bg-zinc-950/60 rounded-xl border border-zinc-800/80">
            <div>
              <p className="text-xs font-semibold text-zinc-200">Disputa de 3º Lugar</p>
              <p className="text-[11px] text-zinc-500">Jogo extra entre os perdedores da semi</p>
            </div>
            <input
              type="checkbox"
              checked={formRules.third_place_match}
              onChange={(e) =>
                setFormRules((prev) => ({
                  ...prev,
                  third_place_match: e.target.checked,
                }))
              }
              className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:bg-zinc-800"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-zinc-950 hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/10"
          >
            <Check className="w-4 h-4" /> Salvar Regras
          </button>
        </div>
      </div>
    </div>
  );
}