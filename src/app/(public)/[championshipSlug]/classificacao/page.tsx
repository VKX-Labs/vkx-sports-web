"use client";

import { useEffect, useState } from "react";
import { Trophy, Loader2 } from "lucide-react";
import { StandingsTable } from "@/components/tournament/StandingsTable";
import type { TeamStanding } from "@/types/tournament";
import { usePublicChampionshipContext } from "@/app/(public)/[championshipSlug]/championship-context";
import { fetchPublicStandings } from "@/app/(public)/[championshipSlug]/lib/public-data";

export default function PublicChampionshipStandingsPage() {
  const { championship, seasonId } = usePublicChampionshipContext();
  const [standings, setStandings] = useState<TeamStanding[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadStandings() {
      if (!seasonId) {
        setLoading(false);
        return;
      }

      try {
        const data = await fetchPublicStandings(seasonId);
        if (active) setStandings(data);
      } catch (err) {
        console.error("Erro ao carregar classificação pública:", err);
        if (active) setStandings([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadStandings();

    return () => {
      active = false;
    };
  }, [seasonId]);

  if (!championship) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg md:text-xl font-bold text-white">
          Classificação
        </h1>
        <p className="text-xs text-slate-400">
          Tabela de pontos atualizada do campeonato.
        </p>
      </div>

      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3 text-zinc-500">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
          <span className="text-xs font-mono">Calculando classificação...</span>
        </div>
      ) : standings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/40 py-16 text-center">
          <Trophy className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
          <p className="text-sm text-slate-500">
            Ainda não há dados suficientes para exibir a classificação.
          </p>
        </div>
      ) : (
        <StandingsTable standings={standings} />
      )}
    </div>
  );
}
