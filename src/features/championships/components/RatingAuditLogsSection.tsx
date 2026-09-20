"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileClock,
  Loader2,
  RefreshCw,
  Star,
  XCircle,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import {
  RatingAuditService,
  type RatingAuditLog,
} from "@/services/rating-audit.service";

interface RatingAuditLogsSectionProps {
  championshipId: string;
}

interface BackfillState {
  running: boolean;
  message: string | null;
  error: string | null;
}

function isMissingTableError(err: unknown): boolean {
  const messageOptions = [
    err instanceof Error ? err.message : "",
    (err as { error_description?: string })?.error_description || "",
  ];
  const joined = messageOptions.join(" ").toLowerCase();
  return (
    joined.includes("does not exist") ||
    joined.includes("not found") ||
    joined.includes("could not find the table") ||
    joined.includes("relation") ||
    joined.includes("permission denied for table rating_audit_logs")
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function StatusBadge({ status }: { status: RatingAuditLog["status"] }) {
  if (status === "SUCCESS") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-400">
        <CheckCircle2 className="w-3 h-3" />
        Sucesso
      </span>
    );
  }
  if (status === "WARNING") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-400">
        <AlertTriangle className="w-3 h-3" />
        Aviso
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-red-400">
      <XCircle className="w-3 h-3" />
      Erro
    </span>
  );
}

export function RatingAuditLogsSection({
  championshipId,
}: RatingAuditLogsSectionProps) {
  const [logs, setLogs] = useState<RatingAuditLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [logsError, setLogsError] = useState<string | null>(null);
  const [backfill, setBackfill] = useState<BackfillState>({
    running: false,
    message: null,
    error: null,
  });
  const [regeneratingRound, setRegeneratingRound] = useState<number | null>(null);

  const loadLogs = useCallback(async () => {
    try {
      setLoadingLogs(true);
      setLogsError(null);
      const data = await RatingAuditService.listByChampionship(championshipId, {
        limit: 30,
      });
      setLogs(data);
    } catch (err) {
      if (isMissingTableError(err)) {
        setLogs([]);
        setLogsError(null);
      } else {
        setLogsError(err instanceof Error ? err.message : "Erro ao carregar logs.");
      }
    } finally {
      setLoadingLogs(false);
    }
  }, [championshipId]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const runBackfill = async (roundNumber?: number) => {
    const isRoundRegen = typeof roundNumber === "number";

    const confirmation = isRoundRegen
      ? `Re-gerar as notas da ${roundNumber}ª rodada com a fórmula VKX V2? As notas desta rodada serão sobrescritas.`
      : "Recalcular TODAS as notas do campeonato com a fórmula VKX V2? As notas congeladas (versão V1) serão sobrescritas em lote usando os eventos já cadastrados.";

    if (!window.confirm(confirmation)) return;

    setBackfill({ running: true, message: null, error: null });
    if (isRoundRegen) setRegeneratingRound(roundNumber);

    try {
      const res = await fetch("/api/admin/recalculate-historical-ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          championshipId,
          roundNumber: isRoundRegen ? roundNumber : undefined,
          force: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao recalcular notas.");
      }

      const summary =
        data.message ||
        `${data.processedRounds?.length || 0} rodada(s) e ${data.playersRated ?? 0} atleta(s) recalculados com a fórmula VKX V2.`;

      setBackfill({
        running: false,
        message: summary,
        error: null,
      });
    } catch (err) {
      setBackfill({
        running: false,
        message: null,
        error: err instanceof Error ? err.message : "Erro ao recalcular notas.",
      });
    } finally {
      setRegeneratingRound(null);
      await loadLogs();
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
            <FileClock className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Logs de Notas
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Registro de cada geração de notas (uma entrada por partida),
              visível apenas para administradores. O campeonato usa a fórmula
              VKX V2; o botão recalcula todas as notas existentes a partir dos
              eventos cadastrados, sobrescrevendo as notas congeladas.
            </p>
          </div>
        </div>

        <button
          onClick={() => runBackfill()}
          disabled={backfill.running}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold transition disabled:opacity-50 cursor-pointer"
        >
          {backfill.running ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5" />
          )}
          Recalcular Notas
        </button>
      </div>

      {backfill.message && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-xs text-emerald-400">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {backfill.message}
        </div>
      )}

      {backfill.error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-xs text-red-400">
          <XCircle className="w-4 h-4 shrink-0" />
          {backfill.error}
        </div>
      )}

      <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden">
        {loadingLogs ? (
          <div className="flex items-center justify-center gap-2 px-4 py-8 text-xs text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            Carregando logs de auditoria...
          </div>
        ) : logsError ? (
          <div className="px-4 py-8 text-center text-xs text-red-400">
            {logsError}
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
            <Star className="w-5 h-5 text-slate-600" />
            <p className="text-xs text-slate-500">
              Nenhum log de auditoria ainda. Gere as notas de uma rodada ou use
              o recálculo histórico para começar.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-800/70">
            {logs.map((log) => (
              <li key={log.id} className="px-4 py-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 min-w-0">
                    <StatusBadge status={log.status} />
                    <span className="text-sm font-bold text-white truncate">
                      {log.round_name || `${log.round_number}ª Rodada`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-[11px] text-slate-500">
                      <Clock className="w-3 h-3" />
                      {formatDate(log.created_at)}
                    </span>
                    <button
                      onClick={() => runBackfill(log.round_number)}
                      disabled={backfill.running || regeneratingRound !== null}
                      className="flex items-center gap-1 rounded-lg px-2 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[10px] font-bold transition disabled:opacity-50 cursor-pointer"
                    >
                      {regeneratingRound === log.round_number ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3 h-3" />
                      )}
                      Re-gerar
                    </button>
                  </div>
                </div>

                {log.payload && (
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="rounded-lg bg-slate-900/60 px-3 py-2">
                      <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                        Partidas
                      </p>
                      <p className="text-xs font-bold text-white mt-0.5">
                        {log.payload.matches_count ??
                          log.payload.match_ids?.length ??
                          0}
                      </p>
                    </div>
                    <div className="rounded-lg bg-slate-900/60 px-3 py-2">
                      <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                        Atletas avaliados
                      </p>
                      <p className="text-xs font-bold text-white mt-0.5">
                        {log.payload.ratings_count ??
                          log.payload.players?.length ??
                          0}
                      </p>
                    </div>
                    <div className="rounded-lg bg-slate-900/60 px-3 py-2">
                      <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                        Rodada
                      </p>
                      <p className="text-xs font-bold text-white mt-0.5">
                        {log.round_number}
                      </p>
                    </div>
                  </div>
                )}

                {log.payload?.players && log.payload.players.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {log.payload.players.slice(0, 12).map((player) => (
                      <span
                        key={player.player_id}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-800 bg-slate-900 px-2 py-0.5 text-[10px] text-slate-300"
                      >
                        <Star className="w-3 h-3 text-amber-400" />
                        {player.player_name} {player.rating.toFixed(1)}
                      </span>
                    ))}
                    {log.payload.players.length > 12 && (
                      <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] text-slate-500">
                        +{log.payload.players.length - 12} atletas
                      </span>
                    )}
                  </div>
                )}

                {log.payload?.error && (
                  <p className="mt-2 text-[11px] text-red-400">
                    {log.payload.error}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export async function resolveFirstSeasonId(
  championshipId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("seasons")
    .select("id")
    .eq("championship_id", championshipId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !data?.id) return null;
  return data.id as string;
}