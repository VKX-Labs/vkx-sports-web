"use client";

import React, { useState } from "react";
import { AlertTriangle, Loader2, Trash2, X } from "lucide-react";

import { deleteTeam } from "@/services/teams/team-service";
import type { Team } from "@/types/team";

interface DeleteTeamModalProps {
  team: Team | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DeleteTeamModal({
  team,
  isOpen,
  onClose,
  onSuccess,
}: DeleteTeamModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !team) return null;

  const handleConfirm = async () => {
    try {
      setLoading(true);
      setError(null);

      await deleteTeam(team.id);

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Erro ao excluir a equipe.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm">
      <div className="bg-brand-dark border border-slate-850 rounded-2xl w-full max-w-md mx-auto shadow-2xl flex flex-col">
        <div className="p-5 border-b border-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center shrink-0">
              <Trash2 className="w-4 h-4 text-red-400" />
            </span>
            <h2 className="text-base font-bold text-brand-textPrimary">
              Excluir Equipe
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-1.5 text-brand-textSecondary hover:text-brand-textPrimary rounded-lg hover:bg-slate-800/50 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-start gap-3 rounded-xl bg-amber-500/10 border border-amber-500/30 p-4">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-100/90 leading-relaxed">
              Você está prestes a excluir <strong className="text-white">{team.name}</strong>.
              Os jogadores desta equipe{" "}
              <strong className="text-white">não serão apagados</strong> — eles
              ficarão cadastrados como{" "}
              <strong className="text-white">"Sem Equipe"</strong> e poderão ser
              vinculados a outro time.
            </p>
          </div>

          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3">
              <p className="text-xs text-red-400 font-semibold">{error}</p>
            </div>
          )}
        </div>

        <div className="p-5 pt-0 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-brand-textSecondary hover:text-brand-textPrimary transition disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-red-500 hover:bg-red-600 text-white flex items-center gap-1.5 transition disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Excluindo...
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                Excluir Equipe
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
