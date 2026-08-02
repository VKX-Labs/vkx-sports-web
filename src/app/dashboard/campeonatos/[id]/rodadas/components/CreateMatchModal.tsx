"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

interface TeamOption {
  id: string;
  name: string;
}

interface CreateMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  teams: TeamOption[];
  onSave: (homeTeamId: string, awayTeamId: string) => Promise<void>;
}

export function CreateMatchModal({ isOpen, onClose, teams, onSave }: CreateMatchModalProps) {
  const [homeTeamId, setHomeTeamId] = useState("");
  const [awayTeamId, setAwayTeamId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

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

    try {
      setLoading(true);
      await onSave(homeTeamId, awayTeamId);
      onClose();
      setHomeTeamId("");
      setAwayTeamId("");
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