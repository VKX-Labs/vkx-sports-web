"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Shield, Users, MapPin, Loader2 } from "lucide-react";
import { routes } from "@/lib/routes";
import { supabase } from "@/lib/supabase";
import { usePublicChampionshipContext } from "@/app/(public)/[championshipSlug]/championship-context";

interface PublicTeamDetail {
  id: string;
  name: string;
  short_name: string | null;
  city: string | null;
  manager: string | null;
  badge_url: string | null;
}

interface PublicPlayer {
  id: string;
  name: string;
  photo_url: string | null;
  number: number | null;
  position: string | null;
}

export default function PublicChampionshipTeamPage() {
  const params = useParams();
  const teamId = (params?.teamSlug as string) || "";

  const { championship } = usePublicChampionshipContext();

  const [team, setTeam] = useState<PublicTeamDetail | null>(null);
  const [squad, setSquad] = useState<PublicPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadTeam() {
      if (!teamId) {
        setLoading(false);
        return;
      }

      try {
        const { data: teamData, error: teamError } = await supabase
          .from("teams")
          .select("id, name, short_name, city, manager, badge_url")
          .eq("id", teamId)
          .single();

        if (teamError) throw teamError;
        if (!active) return;
        setTeam(teamData);

        const { data: squadData, error: squadError } = await supabase
          .from("players")
          .select("id, name, photo_url, number, position")
          .eq("team_id", teamId)
          .order("name");

        if (squadError) throw squadError;
        if (active) setSquad(squadData || []);
      } catch (err) {
        console.error("Erro ao carregar equipe pública:", err);
        if (active) setTeam(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadTeam();

    return () => {
      active = false;
    };
  }, [teamId]);

  if (!championship) return null;

  const slug = championship.slug;

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3 text-zinc-500">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
        <span className="text-xs font-mono">Carregando equipe...</span>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-zinc-400">Equipe não encontrada.</p>
        <Link
          href={routes.public.teams(slug)}
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Voltar para as equipes
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href={routes.public.teams(slug)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 transition hover:text-white"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Voltar para as equipes
      </Link>

      <div className="flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-950 p-6">
        <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
          {team.badge_url ? (
            <img
              src={team.badge_url}
              alt={team.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <Shield className="w-7 h-7 text-emerald-400" />
          )}
        </div>

        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-lg md:text-xl font-bold text-white">
            <span className="truncate">{team.name}</span>
            {team.short_name && (
              <span className="shrink-0 rounded-md border border-slate-800 bg-slate-900 px-2 py-0.5 font-mono text-xs font-bold text-slate-400">
                {team.short_name}
              </span>
            )}
          </h1>
          <p className="mt-1 text-xs text-slate-500 flex items-center gap-3">
            {team.city && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {team.city}
              </span>
            )}
            {team.manager && <span>Técnico: {team.manager}</span>}
          </p>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
          Elenco ({squad.length})
        </h2>

        {squad.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {squad.map((player) => (
              <div
                key={player.id}
                className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950 p-3 transition hover:border-slate-700"
              >
                <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                  {player.photo_url ? (
                    <img
                      src={player.photo_url}
                      alt={player.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Users className="w-4 h-4 text-slate-600" />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-white truncate">
                    {player.name}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {player.position || "Sem posição"}
                    {player.number ? ` • ${player.number}` : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/40 py-12 text-center text-sm text-slate-500">
            Nenhum atleta publicado para esta equipe.
          </div>
        )}
      </section>
    </div>
  );
}
