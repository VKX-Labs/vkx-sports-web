"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Shield, X, Loader2, Minimize2, AlertTriangle } from "lucide-react";
import { getTeams, setTeamPointsDeducted } from "@/services/teams/team-service";
import type { Team } from "@/types/team";
import type { TeamStanding } from "@/types/tournament";

interface PointsDeductionModalProps {
  isOpen: boolean;
  onClose: () => void;
  championshipId: string;
  standings: TeamStanding[];
  onSaved: () => void;
}

export function PointsDeductionModal({
  isOpen,
  onClose,
  championshipId,
  standings,
  onSaved,
}: PointsDeductionModalProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const standingsByTeam = useMemo(() => {
    const map = new Map<string, TeamStanding>();
    standings.forEach((s) => map.set(s.team_id, s));
    return map;
  }, [standings]);

  const loadTeams = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTeams(championshipId);
      setTeams(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao carregar as equipes."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) loadTeams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, championshipId]);

  if (!isOpen) return null;

  const handleApply = async (team: Team, pointsDeducted: number) => {
    try {
      setSavingId(team.id);
      setError(null);
      await setTeamPointsDeducted(team.id, pointsDeducted);
      await loadTeams();
      onSaved();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao aplicar a punição."
      );
    } finally {
      setSavingId(null);
    }
  };

  const handleRemove = async (team: Team) => {
    try {
      setSavingId(team.id);
      setError(null);
      await setTeamPointsDeducted(team.id, 0);
      await loadTeams();
      onSaved();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao remover a punição."
      );
    } finally {
      setSavingId(null);
    }
  };

  const concludedTeams = teams.filter((t) => {
    const standing = standingsByTeam.get(t.id);
    return Boolean(standing && standing.played > 0);
  });

  const pendingTeams = teams.filter((t) => {
    const standing = standingsByTeam.get(t.id);
    return !standing || standing.played === 0;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-2xl rounded-2xl shadow-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-zinc-800 p-5 shrink-0">
          <div className="flex items-center gap-2 text-emerald-400">
            <AlertTriangle className="w-5 h-5" />
            <div>
              <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">
                Dedução de Pontos (Punição)
              </h3>
              <p className="text-[11px] text-zinc-500">
                Aplique ou remova penalidades na tabela de classificação.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2.5 rounded-xl">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-2 text-zinc-500">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
              <span className="text-xs font-mono">Carregando equipes...</span>
            </div>
          ) : teams.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-800 py-12 text-center">
              <Shield className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
              <p className="text-sm text-zinc-500">
                Nenhuma equipe cadastrada neste campeonato.
              </p>
            </div>
          ) : (
            <>
              {concludedTeams.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    Equipes na classificação
                  </h4>
                  {concludedTeams.map((team) => (
                    <DeductionRow
                      key={team.id}
                      team={team}
                      standing={standingsByTeam.get(team.id)}
                      saving={savingId === team.id}
                      onApply={handleApply}
                      onRemove={handleRemove}
                    />
                  ))}
                </div>
              )}

              {pendingTeams.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    Sem pontos computados
                  </h4>
                  {pendingTeams.map((team) => (
                    <DeductionRow
                      key={team.id}
                      team={team}
                      standing={undefined}
                      saving={savingId === team.id}
                      onApply={handleApply}
                      onRemove={handleRemove}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800 p-5 shrink-0">
          <button
            onClick={onClose}
            className="px-4 md:py-2 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:bg-zinc-800 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

interface DeductionRowProps {
  team: Team;
  standing: TeamStanding | undefined;
  saving: boolean;
  onApply: (team: Team, pointsDeducted: number) => void;
  onRemove: (team: Team) => void;
}

function DeductionRow({
  team,
  standing,
  saving,
  onApply,
  onRemove,
}: DeductionRowProps) {
  const [value, setValue] = useState<number>(team.points_deducted ?? 0);

  useEffect(() => {
    setValue(team.points_deducted ?? 0);
  }, [team.points_deducted]);

  const currentDeduction = team.points_deducted ?? 0;
  const effectivePoints =
    standing && standing.played > 0 ? standing.points + currentDeduction : null;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-zinc-950/60 rounded-xl border border-zinc-800/80 p-3.5">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-9 h-9 bg-zinc-900 rounded-lg border border-zinc-800 p-1 flex items-center justify-center shrink-0">
          {team.badge_url ? (
            <img
              src={team.badge_url}
              alt={team.name}
              className="w-full h-full object-contain"
            />
          ) : (
            <Shield className="w-4 h-4 text-zinc-600" />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-zinc-100 truncate">
            {team.name}
          </p>
          <p className="text-[10px] text-zinc-500 font-mono">
            {effectivePoints !== null
              ? `${effectivePoints} pts ganhos`
              : "Sem pontos computados"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <input
          type="number"
          min={0}
          max={999}
          value={value}
          disabled={saving}
          onChange={(e) => setValue(Number(e.target.value))}
          aria-label={`Pontos a deduzir de ${team.name}`}
          className="w-20 bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-2 text-xs text-zinc-100 text-center font-mono focus:outline-none focus:border-emerald-500/50 disabled:opacity-50"
        />
        <button
          type="button"
          disabled={saving}
          onClick={() => onApply(team, value)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25 transition-all disabled:opacity-40"
        >
          {saving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <AlertTriangle className="w-3.5 h-3.5" />
          )}
          Deduzir
        </button>
        {currentDeduction > 0 && (
          <button
            type="button"
            disabled={saving}
            onClick={() => onRemove(team)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition-all disabled:opacity-40"
            title="Remover a punição"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            Remover
          </button>
        )}
      </div>
    </div>
  );
}