"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, RefreshCw, Copy, Check, Trophy } from "lucide-react";
import { useWorkspace } from "@/features/championships/components/workspace/WorkspaceProvider";
import { supabase } from "@/lib/supabase";
import { RoundSummaryMarkdown } from "@/components/match/RoundSummaryMarkdown";

const SUMMARY_TTL_MS = 48 * 60 * 60 * 1000;

function isMissingTableError(err: any): boolean {
  const message = `${err?.message || ""} ${err?.error_description || ""}`.toLowerCase();
  return (
    message.includes("could not find the table") ||
    message.includes("does not exist") ||
    message.includes("relation") || message.includes("not found")
  );
}

interface SummaryTeam {
  name: string;
  badge_url: string | null;
}

interface SummaryEvent {
  type: string;
  player_name: string;
  team_name: string;
}

interface SummaryMatch {
  id: string;
  home_score: number | null;
  away_score: number | null;
  status: string;
  home_team: SummaryTeam;
  away_team: SummaryTeam;
  events: SummaryEvent[];
}

interface SummaryRound {
  id: string;
  name: string;
  round_number: number;
  matches: SummaryMatch[];
}

export default function ChampionshipHome() {
  const { championship } = useWorkspace();

  const [rounds, setRounds] = useState<SummaryRound[]>([]);
  const [selectedRoundIndex, setSelectedRoundIndex] = useState<number>(0);
  const [loadingRounds, setLoadingRounds] = useState<boolean>(true);

  const [summary, setSummary] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [expired, setExpired] = useState<boolean>(false);

  useEffect(() => {
    async function loadRoundsData() {
      if (!championship?.id) return;
      try {
        setLoadingRounds(true);

        const { data: season, error: seasonError } = await supabase
          .from("seasons")
          .select("id")
          .eq("championship_id", championship.id)
          .maybeSingle();

        if (seasonError) throw seasonError;
        if (!season) {
          setRounds([]);
          return;
        }

        const { data: roundsData, error: roundsError } = await supabase
          .from("rounds")
          .select("id, name, round_number")
          .eq("season_id", season.id)
          .order("round_number", { ascending: true });

        if (roundsError) throw roundsError;
        if (!roundsData || roundsData.length === 0) {
          setRounds([]);
          return;
        }

        const roundIds = roundsData.map((r) => r.id);

        const { data: matchesData, error: matchesError } = await supabase
          .from("matches")
          .select("*")
          .in("round_id", roundIds);

        if (matchesError) throw matchesError;

        const matchIds = (matchesData || []).map((m) => m.id);

        const { data: eventsData, error: eventsError } = await supabase
          .from("match_events")
          .select("id, match_id, player_id, team_id, type")
          .in("match_id", matchIds.length > 0 ? matchIds : ["__none__"]);

        if (eventsError) throw eventsError;

        const { data: teamsData, error: teamsError } = await supabase
          .from("teams")
          .select("id, name, badge_url")
          .eq("season_id", season.id);

        if (teamsError) throw teamsError;

        const playerIds = Array.from(
          new Set((eventsData || []).map((e) => e.player_id).filter(Boolean))
        );

        const { data: playersData } =
          playerIds.length > 0
            ? await supabase.from("players").select("id, name").in("id", playerIds)
            : { data: [] };

        const teamsMap = new Map<string, SummaryTeam>(
          (teamsData || []).map((t) => [
            t.id,
            { name: t.name, badge_url: t.badge_url },
          ])
        );

        const playersMap = new Map<string, string>(
          (playersData || []).map((p) => [p.id, p.name])
        );

        const eventsByMatch = new Map<string, SummaryEvent[]>();
        (eventsData || []).forEach((event) => {
          const list = eventsByMatch.get(event.match_id) || [];
          list.push({
            type: event.type,
            player_name: playersMap.get(event.player_id) || "Jogador",
            team_name: teamsMap.get(event.team_id)?.name || "Time",
          });
          eventsByMatch.set(event.match_id, list);
        });

        const defaultTeam: SummaryTeam = {
          name: "A Definir",
          badge_url: null,
        };

        const formattedRounds: SummaryRound[] = roundsData.map((round) => ({
          id: round.id,
          name: round.name,
          round_number: round.round_number,
          matches: (matchesData || [])
            .filter((match) => match.round_id === round.id)
            .map((match) => ({
              id: match.id,
              home_score: match.home_score,
              away_score: match.away_score,
              status: match.status,
              home_team: teamsMap.get(match.home_team_id) || defaultTeam,
              away_team: teamsMap.get(match.away_team_id) || defaultTeam,
              events: eventsByMatch.get(match.id) || [],
            })),
        }));

        setRounds(formattedRounds);
      } catch (err: any) {
        console.error("Erro ao carregar rodadas para o resumo:", err);
      } finally {
        setLoadingRounds(false);
      }
    }

    loadRoundsData();
  }, [championship?.id]);

  const currentRound = rounds[selectedRoundIndex] || null;
  const currentRoundName =
    currentRound?.name ||
    (currentRound?.round_number
      ? `${currentRound.round_number}ª Rodada`
      : "1ª Rodada");

  useEffect(() => {
    async function fetchSavedSummary() {
      if (!championship?.id || !currentRound) {
        setSummary("");
        setExpired(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("round_summaries")
          .select("content, updated_at")
          .eq("championship_id", championship.id)
          .eq("round_number", currentRound.round_number)
          .maybeSingle();

        if (error) throw error;

        const isExpired = Boolean(
          data &&
            new Date(data.updated_at).getTime() < Date.now() - SUMMARY_TTL_MS
        );

        setSummary(isExpired ? "" : data?.content || "");
        setExpired(isExpired);
        setError(null);
      } catch (err: any) {
        if (isMissingTableError(err)) {
          setSummary("");
          setExpired(false);
          setError(null);
          return;
        }

        const errorMessage =
          err?.message || err?.error_description || JSON.stringify(err);
        console.error(
          "Erro ao carregar o resumo salvo da rodada:",
          errorMessage
        );
      }
    }

    fetchSavedSummary();
  }, [championship?.id, selectedRoundIndex, rounds]);

  const handleGenerateSummary = async () => {
    if (!currentRound || currentRound.matches.length === 0) {
      setError("Nenhuma partida encontrada nesta rodada para analisar.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setExpired(false);

      const res = await fetch("/api/generate-round-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          championshipId: championship?.id,
          championshipName: championship?.name || "Campeonato",
          roundNumber: currentRound.round_number,
          roundName: currentRoundName,
          matches: currentRound.matches,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao gerar resumo com IA.");

      setSummary(data.summary);
    } catch (err: any) {
      setError(err.message || "Erro ao conectar com a IA.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!summary) return;
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 w-full bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span>Resumo do Campeonato</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Gere matérias de imprensa isoladas por rodada com análises de gols, assistências e destaques.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {rounds.length > 0 && (
            <select
              value={selectedRoundIndex}
              onChange={(e) => setSelectedRoundIndex(Number(e.target.value))}
              className="bg-zinc-950 text-xs text-zinc-200 border border-zinc-800 rounded-xl px-3 py-2.5 font-bold cursor-pointer focus:outline-none focus:border-purple-500 w-full md:w-auto"
            >
              {rounds.map((round, idx) => (
                <option key={round.id || idx} value={idx}>
                  {round.name || `${round.round_number}ª Rodada`}
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={handleGenerateSummary}
            disabled={loading || loadingRounds}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition shadow-lg shadow-purple-600/20 cursor-pointer disabled:opacity-50 shrink-0 w-full md:w-auto"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 text-purple-200" />
            )}
            <span>{loading ? "Analisando..." : "Gerar Resumo com IA"}</span>
          </button>
        </div>
      </div>

      {loadingRounds && (
        <div className="p-4 rounded-xl bg-zinc-800/40 border border-zinc-800 text-zinc-400 text-xs">
          Carregando rodadas e partidas...
        </div>
      )}

      {!loadingRounds && rounds.length === 0 && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs">
          Nenhuma rodada encontrada. Crie as rodadas e cadastre as partidas antes de gerar o resumo.
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
          {error}
        </div>
      )}

      {expired && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs">
          O resumo desta rodada expirou (válido por 48 horas). Clique em "Gerar Resumo com IA" para gerar um novo boletim.
        </div>
      )}

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 sm:p-6 min-h-[280px] sm:min-h-[320px]">
        {summary ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
              <span className="text-xs font-mono text-purple-400 font-semibold">
                RODADA ANALISADA: {currentRoundName.toUpperCase()}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition cursor-pointer"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                {copied ? "Copiado!" : "Copiar Notícia"}
              </button>
            </div>
            <div className="text-zinc-300 text-sm leading-relaxed font-sans">
              <RoundSummaryMarkdown content={summary} />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-500 space-y-3">
            <Sparkles className="w-10 h-10 text-purple-400/60 animate-pulse" />
            <p className="text-sm font-medium text-zinc-400">
              Nenhum resumo gerado para a rodada selecionada.
            </p>
            <p className="text-xs max-w-sm text-zinc-500">
              Selecione a rodada acima e clique em "Gerar Resumo com IA" para ler o boletim de imprensa.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
