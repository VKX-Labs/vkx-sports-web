"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, RefreshCw, XCircle } from "lucide-react";

interface RecalculateRatingsButtonProps {
  championshipId: string;
  matchId?: string;
  roundNumber?: number;
  label?: string;
  confirmMessage?: string;
  size?: "sm" | "md";
  className?: string;
  onComplete?: () => void;
}

const DEFAULT_CONFIRM =
  "Recalcular TODAS as notas do campeonato com a fórmula VKX V2? As notas congeladas (versão V1) serão sobrescritas em lote.";

const DEFAULT_MATCH_CONFIRM =
  "Recalcular a nota desta partida com a fórmula VKX V2? A nota atual será sobrescrita.";

export function RecalculateRatingsButton({
  championshipId,
  matchId,
  roundNumber,
  label,
  confirmMessage,
  size = "md",
  className = "",
  onComplete,
}: RecalculateRatingsButtonProps) {
  const [running, setRunning] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleClick = async () => {
    const finalConfirm =
      confirmMessage ||
      (matchId ? DEFAULT_MATCH_CONFIRM : DEFAULT_CONFIRM);

    if (!window.confirm(finalConfirm)) return;

    setRunning(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/admin/recalculate-historical-ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          championshipId,
          ...(matchId ? { matchId } : {}),
          ...(typeof roundNumber === "number" ? { roundNumber } : {}),
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
      setFeedback({ type: "success", text: summary });
      onComplete?.();
    } catch (err) {
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Erro ao recalcular notas.",
      });
    } finally {
      setRunning(false);
    }
  };

  const sizeClasses =
    size === "sm" ? "px-2.5 py-1.5 text-[10px]" : "px-3 py-2 text-xs";

  return (
    <div className="space-y-2">
      <button
        onClick={handleClick}
        disabled={running}
        className={`flex items-center gap-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 font-bold transition disabled:opacity-50 cursor-pointer ${sizeClasses} ${className}`}
      >
        {running ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <RefreshCw className="w-3.5 h-3.5" />
        )}
        {running ? "Recalculando..." : label || "Recalcular Notas"}
      </button>

      {feedback && (
        <div
          className={`flex items-start gap-1.5 rounded-xl border px-3 py-2 text-xs ${
            feedback.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
              : "border-red-500/30 bg-red-500/10 text-red-400"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}
    </div>
  );
}