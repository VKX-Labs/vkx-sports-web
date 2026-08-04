"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Shield, Users, Loader2, MapPin } from "lucide-react";
import { routes } from "@/lib/routes";
import { usePublicChampionshipContext } from "@/app/(public)/[championshipSlug]/championship-context";
import { fetchPublicTeams, type PublicTeam } from "@/app/(public)/[championshipSlug]/lib/public-data";

export default function PublicChampionshipTeamsPage() {
  const { championship, seasonId } = usePublicChampionshipContext();
  const [teams, setTeams] = useState<PublicTeam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadTeams() {
      if (!seasonId) {
        setLoading(false);
        return;
      }

      try {
        const data = await fetchPublicTeams(seasonId);
        if (active) setTeams(data);
      } catch (err) {
        console.error("Erro ao carregar equipes públicas:", err);
        if (active) setTeams([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadTeams();

    return () => {
      active = false;
    };
  }, [seasonId]);

  if (!championship) return null;

  const slug = championship.slug;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg md:text-xl font-bold text-white">Equipes</h1>
        <p className="text-xs text-slate-400">
          Conheça os times participantes do campeonato.
        </p>
      </div>

      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3 text-zinc-500">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
          <span className="text-xs font-mono">Carregando equipes...</span>
        </div>
      ) : teams.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/40 py-16 text-center">
          <Users className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
          <p className="text-sm text-slate-500">
            Nenhuma equipe publicada ainda.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <Link
              key={team.id}
              href={routes.public.team(slug, team.id)}
              className="group flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-950 p-4 transition hover:border-emerald-500/50 hover:bg-slate-900/70"
            >
              <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                {team.badge_url ? (
                  <img
                    src={team.badge_url}
                    alt={team.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Shield className="w-5 h-5 text-slate-600" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-white truncate transition group-hover:text-emerald-400">
                  {team.name}
                </h3>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {team.city || "Local não informado"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
