"use client";

import React from "react";
import { useParams } from "next/navigation";
import { Trophy, GitMerge, Layers, Loader2 } from "lucide-react";

import { useChampionship } from "@/hooks/useChampionship";
import TableStandings from "@/components/championship/TableStandings";
import GroupStandings from "@/components/championship/GroupStandings";
import BracketMatchPlay from "@/components/championship/BracketMatchPlay";

export default function ClassificacaoPage() {
  const { id } = useParams();
  const championshipId = id as string;

  const { championship, loading } = useChampionship(championshipId);

  if (loading) {
    return (
      <div className="flex items-center justify-center space-x-2 py-20">
        <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
        <span className="text-sm text-slate-400">
          Identificando formato da competição...
        </span>
      </div>
    );
  }

  const mainSeason = championship?.seasons?.[0];
  const tournamentType = mainSeason?.tournament_type || "PONTOS_CORRIDOS";

  const renderContent = () => {
    switch (tournamentType) {
      case "MATA_MATA":
        return (
          <div className="space-y-4">
            <div className="rounded-xl border border-purple-500/10 bg-purple-500/5 p-4 text-xs text-purple-300">
              💡 Modo Eliminatório detectado. Lançar resultados nas{" "}
              <strong>Rodadas</strong> avança os vencedores de fase de forma
              automática.
            </div>

            <BracketMatchPlay championshipId={championshipId} />
          </div>
        );

      case "GRUPOS_MATA_MATA":
        return (
          <div className="space-y-8">
            <GroupStandings championshipId={championshipId} />

            <div className="border-t border-slate-800/80 pt-6">
              <h2 className="mb-4 text-sm font-bold text-slate-300">
                Fase Eliminatória (Playoffs)
              </h2>

              <BracketMatchPlay championshipId={championshipId} />
            </div>
          </div>
        );

      case "PONTOS_CORRIDOS":
      default:
        return <TableStandings championshipId={championshipId} />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-800/60 pb-5 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-white">
            <Trophy className="h-5 w-5 text-amber-500" />
            Tabela e Chaveamento
          </h1>

          <p className="mt-1 text-xs text-slate-400">
            Exibição automatizada baseada no formato da temporada:{" "}
            <span className="font-semibold text-emerald-400">
              {mainSeason?.name}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2 self-start rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-1.5 sm:self-center">
          {tournamentType === "MATA_MATA" && (
            <GitMerge className="h-3.5 w-3.5 text-purple-400" />
          )}

          {tournamentType === "PONTOS_CORRIDOS" && (
            <Layers className="h-3.5 w-3.5 text-blue-400" />
          )}

          {tournamentType === "GRUPOS_MATA_MATA" && (
            <Trophy className="h-3.5 w-3.5 text-emerald-400" />
          )}

          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
            {tournamentType.replace(/_/g, " ")}
          </span>
        </div>
      </div>

      <div className="pt-2">{renderContent()}</div>
    </div>
  );
}