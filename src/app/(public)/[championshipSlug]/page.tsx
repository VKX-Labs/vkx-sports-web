"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, Trophy, Users, MapPin, Shield } from "lucide-react";
import { routes } from "@/lib/routes";
import { usePublicChampionshipContext } from "@/app/(public)/[championshipSlug]/championship-context";
import { PublicMatchCard } from "@/app/(public)/[championshipSlug]/components/PublicMatchCard";
import { fetchPublicRounds, type PublicMatch } from "@/app/(public)/[championshipSlug]/lib/public-data";

export default function PublicChampionshipHomePage() {
  const { championship, seasonId } = usePublicChampionshipContext();
  const [matches, setMatches] = useState<PublicMatch[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadMatches() {
      if (!seasonId) {
        setLoadingMatches(false);
        return;
      }

      try {
        const rounds = await fetchPublicRounds(seasonId);
        if (!active) return;

        const all = rounds.flatMap((r) => r.matches);

        const finished = all.filter(
          (m) => m.status === "finished" || m.status === "FINALIZADO"
        );
        const scheduled = all.filter((m) => !finished.includes(m));

        setMatches([...finished, ...scheduled].slice(0, 6));
      } catch (err) {
        console.error("Erro ao carregar jogos públicos:", err);
        if (active) setMatches([]);
      } finally {
        if (active) setLoadingMatches(false);
      }
    }

    loadMatches();

    return () => {
      active = false;
    };
  }, [seasonId]);

  if (!championship) return null;

  const mainSeason = championship.seasons?.[0];
  const slug = championship.slug;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-xl">
        <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
          {championship.logo_url ? (
            <img
              src={championship.logo_url}
              alt={championship.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <Shield className="w-7 h-7 text-emerald-400" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="text-xl md:text-2xl font-bold text-white">
            {championship.name}
          </h1>
          <p className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            {mainSeason?.name && (
              <span className="text-emerald-400 font-semibold">
                {mainSeason.name}
              </span>
            )}
            {mainSeason?.modality && (
              <span className="flex items-center gap-1">
                <Trophy className="w-3 h-3" /> {mainSeason.modality}
              </span>
            )}
            {mainSeason?.city && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {mainSeason.city}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <Link
            href={routes.public.matches(slug)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition"
          >
            <Calendar className="w-4 h-4" /> Jogos
          </Link>
          <Link
            href={routes.public.standings(slug)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-200 text-xs font-bold transition"
          >
            <Trophy className="w-4 h-4" /> Classificação
          </Link>
          <Link
            href={routes.public.teams(slug)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-200 text-xs font-bold transition"
          >
            <Users className="w-4 h-4" /> Equipes
          </Link>
        </div>
      </div>

      {championship.description && (
        <p className="text-sm text-slate-400 max-w-3xl">
          {championship.description}
        </p>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
            Jogos Recentes
          </h2>
          <Link
            href={routes.public.matches(slug)}
            className="text-xs font-semibold text-emerald-400 hover:underline"
          >
            Ver todos
          </Link>
        </div>

        {loadingMatches ? (
          <div className="py-10 flex items-center justify-center text-zinc-500 text-xs font-mono">
            Carregando jogos...
          </div>
        ) : matches.length > 0 ? (
          <div className="space-y-2">
            {matches.map((match) => (
              <PublicMatchCard key={match.id} match={match} slug={slug} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/40 py-12 text-center text-sm text-slate-500">
            Nenhum jogo publicado ainda.
          </div>
        )}
      </section>
    </div>
  );
}
