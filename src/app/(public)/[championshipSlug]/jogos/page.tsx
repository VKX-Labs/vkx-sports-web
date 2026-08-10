"use client";

import { useEffect, useState } from "react";
import { Calendar } from "lucide-react";
import { getPhaseDisplayName } from "@/types/tournament";
import { usePublicChampionshipContext } from "@/app/(public)/[championshipSlug]/championship-context";
import { PublicMatchCard } from "@/app/(public)/[championshipSlug]/components/PublicMatchCard";
import { fetchPublicRounds, type PublicRound } from "@/app/(public)/[championshipSlug]/lib/public-data";

export default function PublicChampionshipMatchesPage() {
  const { championship, seasonId } = usePublicChampionshipContext();
  const [rounds, setRounds] = useState<PublicRound[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadRounds() {
      if (!seasonId) {
        setLoading(false);
        return;
      }

      try {
        const data = await fetchPublicRounds(seasonId);
        if (active) setRounds(data);
      } catch (err) {
        console.error("Erro ao carregar calendário público:", err);
        if (active) setRounds([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadRounds();

    return () => {
      active = false;
    };
  }, [seasonId]);

  if (!championship) return null;

  const slug = championship.slug;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg md:text-xl font-bold text-white">
          Calendário de Jogos
        </h1>
        <p className="text-xs text-slate-400">
          Confira os confrontos e resultados do campeonato.
        </p>
      </div>

      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3 text-zinc-500">
          <div className="h-7 w-7 animate-spin rounded-full border-b-2 border-emerald-500" />
          <span className="text-xs font-mono">Carregando jogos...</span>
        </div>
      ) : rounds.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/40 py-16 text-center">
          <Calendar className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
          <p className="text-sm text-slate-500">
            Nenhum jogo publicado ainda.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {rounds.map((round) => (
            <section key={round.id} className="space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                {round.name ? getPhaseDisplayName(round.name) : `${round.round_number}ª Rodada`}
              </h2>
              {round.matches.length > 0 ? (
                <div className="space-y-2">
                  {round.matches.map((match) => (
                    <PublicMatchCard
                      key={match.id}
                      match={match}
                      slug={slug}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-800/70 bg-slate-950/30 py-6 text-center text-xs text-slate-600">
                  Nenhum jogo nesta rodada.
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
