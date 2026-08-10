"use client";

import { useState, useEffect } from "react";
import { Plus, X } from "lucide-react";
import type { RoundFilterOption, MatchLeg } from "@/types/tournament";

interface TeamOption {
  id: string;
  name: string;
}

export interface CreateMatchPayload {
  homeTeamId: string;
  awayTeamId: string;
  phase?: string | null;
  bracketPosition?: number | null;
  leg?: MatchLeg | null;
}

interface CreateMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  teams: TeamOption[];
  isKnockout?: boolean;
  phaseOptions?: RoundFilterOption[];
  bracketSizes?: Record<string, number>;
  onSave: (payload: CreateMatchPayload) => Promise<void>;
}

export function CreateMatchModal({
  isOpen,
  onClose,
  teams,
  isKnockout = false,
  phaseOptions = [],
  bracketSizes = {},
  onSave,
}: CreateMatchModalProps) {
  const [homeTeamId, setHomeTeamId] = useState("");
  const [awayTeamId, setAwayTeamId] = useState("");
  const [phase, setPhase] = useState("");
  const [bracketPosition, setBracketPosition] = useState("");
  const [leg, setLeg] = useState<MatchLeg>("UNICO");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setHomeTeamId("");
      setAwayTeamId("");
      setPhase("");
      setBracketPosition("");
      setLeg("UNICO");
      setError("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePhaseChange = (value: string) => {
    setPhase(value);
    setBracketPosition("");
  };

  const positionCount =
    phase && bracketSizes[phase] ? bracketSizes[phase] : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!homeTeamId || !awayTeamId) {
      setError("Selecione ambos os times.");
      return;
    }

    if (homeTeamId === awayTeamId) {
      setError("Os times mandante e visitante devem ser diferentes.");
      return;
    }

    if (isKnockout && phase && !bracketPosition) {
      setError("Selecione a posição na chave para a fase escolhida.");
      return;
    }

    try {
      setLoading(true);
      await onSave({
        homeTeamId,
        awayTeamId,
        phase: isKnockout && phase ? phase : null,
        bracketPosition:
          isKnockout && bracketPosition !== ""
            ? Number(bracketPosition)
            : null,
        leg: isKnockout ? leg : "UNICO",
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Erro ao criar partida.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Plus className="w-5 h-5 text-emerald-500" /> Adicionar Partida Manual
          </h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Time Mandante</label>
            <select
              value={homeTeamId}
              onChange={(e) => setHomeTeamId(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg p-2.5 text-sm focus:border-emerald-500 outline-none"
            >
              <option value="">Selecione o mandante...</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id} disabled={t.id === awayTeamId}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Time Visitante</label>
            <select
              value={awayTeamId}
              onChange={(e) => setAwayTeamId(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg p-2.5 text-sm focus:border-emerald-500 outline-none"
            >
              <option value="">Selecione o visitante...</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id} disabled={t.id === homeTeamId}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {isKnockout && (
            <>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Fase</label>
                <select
                  value={phase}
                  onChange={(e) => handlePhaseChange(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg p-2.5 text-sm focus:border-emerald-500 outline-none"
                >
                  <option value="">Rodada atual (sem fase definida)</option>
                  {phaseOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {phase && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">
                      Posição na chave
                    </label>
                    <select
                      value={bracketPosition}
                      onChange={(e) => setBracketPosition(e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg p-2.5 text-sm focus:border-emerald-500 outline-none"
                    >
                      <option value="">Selecione a posição...</option>
                      {Array.from({ length: positionCount }, (_, i) => (
                        <option key={i} value={i}>
                          Confronto {i + 1}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">
                      Perna / Tipo
                    </label>
                    <select
                      value={leg}
                      onChange={(e) => setLeg(e.target.value as MatchLeg)}
                      className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg p-2.5 text-sm focus:border-emerald-500 outline-none"
                    >
                      <option value="IDA">Jogo de Ida</option>
                      <option value="VOLTA">Jogo de Volta</option>
                      <option value="UNICO">Jogo Único</option>
                    </select>
                  </div>
                </>
              )}
            </>
          )}

          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition font-medium text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition font-medium text-sm disabled:opacity-50"
            >
              {loading ? "Salvando..." : "Criar Jogo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
