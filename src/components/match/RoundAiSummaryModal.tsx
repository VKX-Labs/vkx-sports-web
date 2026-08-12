"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Copy, Check, X, RefreshCw, AlertTriangle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { RoundSummaryMarkdown } from "./RoundSummaryMarkdown";

const SUMMARY_TTL_MS = 48 * 60 * 60 * 1000;

function isMissingTableError(err: any): boolean {
  const message = `${err?.message || ""} ${err?.error_description || ""}`.toLowerCase();
  return (
    message.includes("could not find the table") ||
    message.includes("does not exist") ||
    message.includes("relation") || message.includes("not found")
  );
}

interface RoundAiSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  championshipId: string;
  championshipName: string;
  roundNumber: number;
  roundName: string;
  matches: any[];
}

export function RoundAiSummaryModal({
  isOpen,
  onClose,
  championshipId,
  championshipName,
  roundNumber,
  roundName,
  matches,
}: RoundAiSummaryModalProps) {
  const [summary, setSummary] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [expired, setExpired] = useState<boolean>(false);

  useEffect(() => {
    async function fetchSavedSummary() {
      if (!isOpen || !championshipId) {
        setSummary("");
        setError(null);
        setExpired(false);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("round_summaries")
          .select("content, updated_at")
          .eq("championship_id", championshipId)
          .eq("round_number", roundNumber)
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
  }, [isOpen, championshipId, roundNumber]);

  if (!isOpen) return null;

  const hasMatches = Array.isArray(matches) && matches.length > 0;

  const handleGenerateSummary = async () => {
    if (!hasMatches) {
      setError("Não há partidas cadastradas nesta rodada para analisar.");
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
          championshipId,
          championshipName,
          roundNumber,
          roundName,
          matches,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Falha ao gerar o resumo da rodada.");
      }

      setSummary(data.summary);
    } catch (err: any) {
      setError(err.message || "Erro de conexão com o servidor da IA.");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-zinc-900 border border-zinc-800 p-6 text-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-400 animate-pulse" />
            <h3 className="text-lg font-bold">Resumo da Rodada com IA</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="my-6 space-y-4">
          {!hasMatches && !summary && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>
                A {roundName} ainda não possui partidas cadastradas. Cadastre os jogos antes de gerar o resumo.
              </span>
            </div>
          )}

          {!summary && !loading && hasMatches && (
            <div className="text-center py-8 space-y-4">
              <Sparkles className="h-12 w-12 text-purple-400 mx-auto opacity-80" />
              <div>
                <h4 className="text-base font-bold text-zinc-200">
                  Gerar Notícia da {roundName}
                </h4>
                <p className="text-xs text-zinc-400 max-w-md mx-auto mt-1">
                  A IA analisará placares, gols, assistências e cartões desta rodada para criar um boletim jornalístico completo.
                </p>
              </div>
              <button
                type="button"
                onClick={handleGenerateSummary}
                className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition shadow-lg shadow-purple-600/20 cursor-pointer flex items-center gap-2 mx-auto"
              >
                <Sparkles className="w-4 h-4" />
                Gerar Resumo Agora
              </button>
            </div>
          )}

          {loading && (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-purple-400">
              <RefreshCw className="h-8 w-8 animate-spin" />
              <p className="text-xs font-mono text-zinc-400">
                Processando estatísticas da rodada com Groq AI (Llama 3.3)...
              </p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs text-center">
              {error}
            </div>
          )}

          {expired && !loading && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs text-center">
              O resumo desta rodada expirou (válido por 48 horas). Clique em "Gerar Resumo Agora" para gerar um novo boletim.
            </div>
          )}

          {summary && !loading && (
            <div className="max-h-[380px] overflow-y-auto p-4 rounded-xl bg-zinc-950 border border-zinc-800/80">
              <RoundSummaryMarkdown content={summary} />
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800 pt-4">
          {summary ? (
            <button
              type="button"
              onClick={handleGenerateSummary}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 text-xs font-medium text-zinc-400 hover:bg-zinc-800 transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Regerar
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-zinc-800 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition cursor-pointer"
            >
              Fechar
            </button>
            {summary && (
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-lg shadow-purple-600/20 cursor-pointer"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copiado!" : "Copiar Texto"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
