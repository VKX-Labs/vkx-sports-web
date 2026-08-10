"use client";

import React, { useState } from "react";
import { ChevronsUp, Loader2, CheckCircle2 } from "lucide-react";
import { MatchService } from "@/services/matchService";

interface ManualAdvanceTeam {
  id?: string | null;
  name?: string | null;
}

interface ManualAdvanceMatch {
  id: string;
  home_team?: ManualAdvanceTeam | null;
  away_team?: ManualAdvanceTeam | null;
  home_team_id?: string | null;
  away_team_id?: string | null;
  winner_id?: string | null;
  phase?: string | null;
}

interface ManualAdvanceCardProps {
  match: ManualAdvanceMatch;
  onAdvance?: () => void;
}

export function ManualAdvanceCard({ match, onAdvance }: ManualAdvanceCardProps) {
  const [loadingTeamId, setLoadingTeamId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const teams = [
    { id: match.home_team?.id ?? match.home_team_id, name: match.home_team?.name ?? "Mandante" },
    { id: match.away_team?.id ?? match.away_team_id, name: match.away_team?.name ?? "Visitante" },
  ].filter((team) => Boolean(team.id));

  const handleAdvance = async (teamId: string, teamName: string) => {
    if (
      !confirm(
        `Classificar "${teamName}" como vencedor deste confronto e propagá-lo(a) no chaveamento?`
      )
    ) {
      return;
    }

    setLoadingTeamId(teamId);
    setMessage(null);
    setError(null);

    try {
      await MatchService.forceAdvanceWinner(match.id, teamId);
      setMessage(`"${teamName}" classificado(a) com sucesso no chaveamento!`);
      onAdvance?.();
    } catch (err: any) {
      setError(err?.message || "Erro ao classificar a equipe manualmente.");
    } finally {
      setLoadingTeamId(null);
    }
  };

  return (
    <div className="w-full bg-zinc-900/80 border border-amber-500/20 rounded-xl p-4 sm:p-5 space-y-3">
      <div className="flex items-center gap-2">
        <ChevronsUp className="w-4 h-4 text-amber-400" />
        <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
          Classificação Manual (Avanço)
        </h3>
      </div>

      <p className="text-[11px] text-zinc-500">
        Use em casos de punição no tribunal, decisão extra-campo ou W.O. especial.
        Define o vencedor da partida e atualiza o slot da próxima fase no chaveamento.
      </p>

      {teams.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {teams.map((team) => {
            const teamId = team.id as string;
            const isWinner = match.winner_id === teamId;
            const isBusy = loadingTeamId === teamId;

            return (
              <button
                key={teamId}
                type="button"
                disabled={isBusy}
                onClick={() => handleAdvance(teamId, team.name || "Equipe")}
                className={`flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 border ${
                  isWinner
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : "bg-zinc-950 text-zinc-300 hover:text-emerald-300 border-zinc-800 hover:border-amber-500/40"
                }`}
              >
                <span className="truncate">{team.name || "Equipe"}</span>
                {isBusy ? (
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                ) : isWinner ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : null}
              </button>
            );
          })}
        </div>
      ) : (
        <p className="text-[11px] text-zinc-600">
          Os dois times precisam estar definidos para classificar um vencedor.
        </p>
      )}

      {message && (
        <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          {message}
        </p>
      )}
      {error && <p className="text-[11px] text-red-400">{error}</p>}
    </div>
  );
}
