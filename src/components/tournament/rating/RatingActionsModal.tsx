"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Flag, Loader2, Star, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

export type RatingActionMode = "ROUND" | "MATCH" | "FINALIZE";

interface RatingActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  championshipId: string;
  mode: RatingActionMode;
}

interface RoundOption {
  id: string;
  name: string;
  round_number: number;
  matches: MatchOption[];
}

interface MatchOption {
  id: string;
  home_team_id: string | null;
  away_team_id: string | null;
  home_score: number | null;
  away_score: number | null;
  status: string | null;
  home_name: string;
  away_name: string;
}

interface LoadedData {
  seasonId: string;
  rounds: RoundOption[];
  ratedMatchIds: Set<string>;
}

const MODE_META: Record<
  RatingActionMode,
  { title: string; description: string; actionLabel: string }
> = {
  ROUND: {
    title: "Calcular Nota Média da Rodada",
    description:
      "Calcula as notas apenas das partidas ainda não avaliadas da rodada. Jogos já avaliados ficam congelados.",
    actionLabel: "Calcular Notas da Rodada",
  },
  MATCH: {
    title: "Calcular Nota por Partida",
    description:
      "Recalcula a nota individual de um jogo específico (re-geração explícita, ignora o congelamento).",
    actionLabel: "Calcular Nota da Partida",
  },
  FINALIZE: {
    title: "Finalizar Rodada Atual",
    description:
      "Apenas avança a rodada ativa do campeonato para a próxima. Não recalcula notas.",
    actionLabel: "Finalizar Rodada",
  },
};

export function RatingActionsModal({
  isOpen,
  onClose,
  onSaved,
  championshipId,
  mode,
}: RatingActionsModalProps) {
  const [data, setData] = useState<LoadedData | null>(null);
  const [loading, setLoading] = useState(false);
  const [roundIndex, setRoundIndex] = useState(0);
  const [matchIndex, setMatchIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const meta = MODE_META[mode];

  const loadData = useCallback(async () => {
    if (!isOpen || !championshipId) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const { data: season, error: seasonError } = await supabase
        .from("seasons")
        .select("id")
        .eq("championship_id", championshipId)
        .maybeSingle();

      if (seasonError) throw seasonError;
      if (!season) throw new Error("Nenhuma temporada encontrada para este campeonato.");
      const seasonId = season.id as string;

      const { data: roundsData, error: roundsError } = await supabase
        .from("rounds")
        .select("id, name, round_number")
        .eq("season_id", seasonId)
        .order("round_number", { ascending: true });

      if (roundsError) throw roundsError;

      const rounds = roundsData || [];
      const roundIds = rounds.map((r) => r.id as string);

      let matchesData: any[] = [];
      if (roundIds.length > 0) {
        const { data, error: matchesError } = await supabase
          .from("matches")
          .select("*")
          .in("round_id", roundIds);
        if (matchesError) throw matchesError;
        matchesData = data || [];
      }

      const teamIds = new Set<string>();
      for (const m of matchesData) {
        if (m.home_team_id) teamIds.add(m.home_team_id);
        if (m.away_team_id) teamIds.add(m.away_team_id);
      }

      const teamsMap = new Map<string, string>();
      if (teamIds.size > 0) {
        const { data: teams, error: teamsError } = await supabase
          .from("teams")
          .select("id, name")
          .in("id", Array.from(teamIds));
        if (teamsError) throw teamsError;
        for (const t of (teams || []) as Array<{ id: string; name: string }>) {
          teamsMap.set(String(t.id), String(t.name));
        }
      }

      const formattedRounds: RoundOption[] = rounds.map((round) => ({
        id: round.id as string,
        name: (round.name as string) || `${round.round_number}ª Rodada`,
        round_number: round.round_number as number,
        matches: matchesData
          .filter((m) => m.round_id === round.id)
          .map((m) => ({
            id: m.id,
            home_team_id: m.home_team_id ?? null,
            away_team_id: m.away_team_id ?? null,
            home_score: typeof m.home_score === "number" ? m.home_score : null,
            away_score: typeof m.away_score === "number" ? m.away_score : null,
            status: m.status ?? null,
            home_name: m.home_team_id ? teamsMap.get(String(m.home_team_id)) || "TBD" : "TBD",
            away_name: m.away_team_id ? teamsMap.get(String(m.away_team_id)) || "TBD" : "TBD",
          })),
      }));

      const finishedIds = formattedRounds.flatMap((r) =>
        r.matches
          .filter((m) => m.status === "finished" || m.status === "FINALIZADO")
          .map((m) => m.id)
      );

      let ratedMatchIds = new Set<string>();
      if (finishedIds.length > 0) {
        const { data: ratedRows, error: ratedError } = await supabase
          .from("match_player_stats")
          .select("match_id")
          .in("match_id", finishedIds)
          .not("rating", "is", null);
        if (ratedError) {
          const message = `${ratedError.message || ""}`.toLowerCase();
          if (
            !message.includes("does not exist") &&
            !message.includes("not found") &&
            !message.includes("could not find the table") &&
            !message.includes("relation")
          ) {
            throw ratedError;
          }
        }
        ratedMatchIds = new Set(
          ((ratedRows as Array<{ match_id: string }>) || []).map((r) => r.match_id)
        );
      }

      setData({ seasonId, rounds: formattedRounds, ratedMatchIds });
      setRoundIndex(0);
      setMatchIndex(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  }, [isOpen, championshipId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const currentRound = data?.rounds[roundIndex] || null;
  const finishedMatches = useMemo(
    () => (currentRound?.matches || []).filter((m) => isFinished(m.status)),
    [currentRound]
  );
  const selectedMatch = finishedMatches[matchIndex] || null;

  function isFinished(status: string | null): boolean {
    return status === "finished" || status === "FINALIZADO";
  }

  const pendingCount = finishedMatches.filter((m) => !data?.ratedMatchIds.has(m.id)).length;

  const buildMatchPayload = (match: MatchOption) => ({
    id: match.id,
    matchId: match.id,
    home_team_id: match.home_team_id,
    away_team_id: match.away_team_id,
    home_team: { name: match.home_name, badge_url: null },
    away_team: { name: match.away_name, badge_url: null },
    home_score: match.home_score,
    away_score: match.away_score,
    status: match.status,
  });

  const handleSubmit = async () => {
    if (!data || !currentRound) return;
    setSubmitting(true);
    setError(null);
    setResult(null);

    const common = {
      championshipId,
      championshipName: "Campeonato",
      seasonId: data.seasonId,
      roundNumber: currentRound.round_number,
      roundName: currentRound.name,
    };

    try {
      if (mode === "MATCH") {
        if (!selectedMatch) throw new Error("Selecione uma partida finalizada para calcular.");
        const res = await fetch("/api/round-player-ratings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...common,
            scope: "MATCH",
            matches: [buildMatchPayload(selectedMatch)],
          }),
        });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload.error || "Erro ao calcular a nota da partida.");
        setResult(
          `Nota recalculada para ${payload.ratings?.length ?? 0} atleta(s) da partida selecionada.`
        );
      } else if (mode === "ROUND") {
        if (finishedMatches.length === 0) {
          throw new Error("Nenhuma partida finalizada nesta rodada para avaliar.");
        }
        if (pendingCount === 0) {
          throw new Error("Todas as partidas finalizadas desta rodada já possuem notas. Use a opção por partida para recalcular.");
        }
        const res = await fetch("/api/round-player-ratings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...common,
            scope: "ROUND",
            matches: finishedMatches.map(buildMatchPayload),
          }),
        });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload.error || "Erro ao calcular as notas da rodada.");
        setResult(
          `Rodada processada: ${payload.ratings?.length ?? 0} atleta(s) com nota. ${pendingCount} partida(s) pendente(s) calculada(s).`
        );
      } else {
        const res = await fetch("/api/finalize-round", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            championshipId,
            roundNumber: currentRound.round_number,
            roundName: currentRound.name,
          }),
        });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload.error || "Erro ao finalizar a rodada.");
        setResult(payload.message || "Rodada finalizada com sucesso.");
      }

      onSaved();
      if (mode !== "MATCH") await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao executar a ação.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-xl rounded-2xl shadow-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-zinc-800 p-5 shrink-0">
          <div className="flex items-center gap-2 text-amber-400">
            <Star className="w-5 h-5" />
            <div>
              <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">
                {meta.title}
              </h3>
              <p className="text-[11px] text-zinc-500">{meta.description}</p>
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

          {result && (
            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2.5 rounded-xl">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{result}</span>
            </div>
          )}

          {loading ? (
            <div className="py-14 flex flex-col items-center justify-center gap-2 text-zinc-500">
              <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
              <span className="text-xs font-mono">Carregando rodadas...</span>
            </div>
          ) : data && data.rounds.length > 0 ? (
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                  Rodada
                </label>
                <select
                  value={roundIndex}
                  onChange={(e) => {
                    setRoundIndex(Number(e.target.value));
                    setMatchIndex(0);
                  }}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-amber-500/50 cursor-pointer"
                >
                  {data.rounds.map((round, idx) => (
                    <option key={round.id || idx} value={idx} className="bg-zinc-900 text-zinc-200">
                      {round.name}
                    </option>
                  ))}
                </select>
              </div>

              {mode !== "MATCH" ? (
                <div className="rounded-xl bg-zinc-950/60 border border-zinc-800 p-3.5">
                  <p className="text-xs text-zinc-300">
                    <span className="text-amber-400 font-bold">{pendingCount}</span> partida(s)
                    pendente(s) calculável(is)
                    {pendingCount < finishedMatches.length && (
                      <span className="text-zinc-500">
                        {" "}
                        • {finishedMatches.length - pendingCount} já avaliada(s) (congeladas)
                      </span>
                    )}
                  </p>
                  {mode === "ROUND" && pendingCount === 0 && (
                    <p className="text-[11px] text-zinc-500 mt-1.5">
                      Nada a calcular nesta rodada. Use "Calcular Nota por Partida" para
                      recálculo explícito.
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                    Partida (finalizada)
                  </label>
                  <select
                    value={matchIndex}
                    onChange={(e) => setMatchIndex(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-amber-500/50 cursor-pointer"
                  >
                    {finishedMatches.length === 0 ? (
                      <option value={0}>Nenhuma partida finalizada nesta rodada</option>
                    ) : (
                      finishedMatches.map((match, idx) => {
                        const isRated = data.ratedMatchIds.has(match.id);
                        return (
                          <option key={match.id} value={idx} className="bg-zinc-900 text-zinc-200">
                            {match.home_name} {match.home_score ?? 0} x {match.away_score ?? 0}{" "}
                            {match.away_name}
                            {isRated ? " • já avaliada" : ""}
                          </option>
                        );
                      })
                    )}
                  </select>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-zinc-800 py-12 text-center text-zinc-500">
              Nenhuma rodada encontrada nesta temporada.
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800 p-5 shrink-0">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:bg-zinc-800 transition-colors disabled:opacity-50 cursor-pointer"
          >
            Fechar
          </button>
          <button
            onClick={handleSubmit}
            disabled={
              submitting ||
              loading ||
              !data ||
              data.rounds.length === 0 ||
              (mode === "MATCH" && !selectedMatch)
            }
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {submitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : mode === "FINALIZE" ? (
              <Flag className="w-3.5 h-3.5" />
            ) : (
              <Star className="w-3.5 h-3.5" />
            )}
            {submitting ? "Processando..." : meta.actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}