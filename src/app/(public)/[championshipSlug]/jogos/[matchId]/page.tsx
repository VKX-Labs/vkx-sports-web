"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Shield,
  Loader2,
  Target,
  Star,
  Square,
  Hand,
} from "lucide-react";
import { routes } from "@/lib/routes";
import { MatchService, MatchEventItem } from "@/services/matchService";
import { usePublicChampionshipContext } from "@/app/(public)/[championshipSlug]/championship-context";

interface MatchTeam {
  id: string;
  name: string;
  badge_url: string | null;
}

interface PublicMatchDetail {
  id: string;
  home_score: number | null;
  away_score: number | null;
  status: string;
  date: string | null;
  home_team: MatchTeam;
  away_team: MatchTeam;
}

const EVENT_META: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
  GOAL: {
    label: "Gol",
    icon: <Target className="w-3.5 h-3.5" />,
    className: "text-emerald-400",
  },
  ASSIST: {
    label: "Assistência",
    icon: <Star className="w-3.5 h-3.5" />,
    className: "text-sky-400",
  },
  SAVE: {
    label: "Defesa",
    icon: <Hand className="w-3.5 h-3.5" />,
    className: "text-violet-400",
  },
  YELLOW_CARD: {
    label: "Cartão Amarelo",
    icon: <Square className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />,
    className: "text-yellow-400",
  },
  RED_CARD: {
    label: "Cartão Vermelho",
    icon: <Square className="w-3.5 h-3.5 fill-red-500 text-red-500" />,
    className: "text-red-400",
  },
};

export default function PublicChampionshipMatchPage() {
  const params = useParams();
  const matchId = (params?.matchId as string) || "";

  const { championship } = usePublicChampionshipContext();

  const [match, setMatch] = useState<PublicMatchDetail | null>(null);
  const [events, setEvents] = useState<MatchEventItem[]>([]);
  const [players, setPlayers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadMatch() {
      if (!matchId) {
        setLoading(false);
        return;
      }

      try {
        const data = await MatchService.getMatchDetails(matchId);
        if (!active) return;

        setMatch(data.match as PublicMatchDetail);
        setEvents(data.events);

        const playerMap: Record<string, string> = {};
        [...data.homePlayers, ...data.awayPlayers].forEach((p) => {
          playerMap[p.id] = p.name;
        });
        setPlayers(playerMap);
      } catch (err) {
        console.error("Erro ao carregar súmula pública:", err);
        if (active) setMatch(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadMatch();

    return () => {
      active = false;
    };
  }, [matchId]);

  if (!championship) return null;

  const slug = championship.slug;
  const isFinished =
    match?.status === "finished" || match?.status === "FINALIZADO";

  const formatDate = (value: string | null) => {
    if (!value) return "Data a definir";
    const d = new Date(value);
    if (isNaN(d.getTime())) return "Data a definir";
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderBadge = (team: MatchTeam | undefined) => {
    if (team?.badge_url) {
      return (
        <img
          src={team.badge_url}
          alt={team.name}
          className="w-full h-full object-contain"
        />
      );
    }
    return <Shield className="w-6 h-6 text-slate-500" />;
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3 text-zinc-500">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
        <span className="text-xs font-mono">Carregando súmula da partida...</span>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-zinc-400">Partida não encontrada.</p>
        <Link
          href={routes.public.matches(slug)}
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Voltar para os jogos
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href={routes.public.matches(slug)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 transition hover:text-white"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Voltar para os jogos
      </Link>

      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col items-center gap-2 flex-1 text-center">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden">
              {renderBadge(match.home_team)}
            </div>
            <span className="text-xs md:text-sm font-bold text-slate-100">
              {match.home_team?.name || "TBD"}
            </span>
          </div>

          <div className="flex flex-col items-center gap-2 shrink-0">
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl font-mono text-xl md:text-2xl font-bold">
              <span className={isFinished ? "text-emerald-400" : "text-slate-100"}>
                {match.home_score ?? "-"}
              </span>
              <span className="text-slate-600 text-sm">:</span>
              <span className={isFinished ? "text-emerald-400" : "text-slate-100"}>
                {match.away_score ?? "-"}
              </span>
            </div>
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500">
              {match.status === "finished" || match.status === "FINALIZADO"
                ? "Finalizado"
                : match.status === "AGENDADO" || match.status === "scheduled"
                ? "Agendado"
                : match.status}
            </span>
            <span className="text-[11px] text-slate-500">
              {formatDate(match.date)}
            </span>
          </div>

          <div className="flex flex-col items-center gap-2 flex-1 text-center">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden">
              {renderBadge(match.away_team)}
            </div>
            <span className="text-xs md:text-sm font-bold text-slate-100">
              {match.away_team?.name || "TBD"}
            </span>
          </div>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
          Eventos da Partida
        </h2>

        {events.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/40 py-10 text-center text-sm text-slate-500">
            Nenhum evento registrado nesta partida.
          </div>
        ) : (
          <div className="rounded-xl border border-slate-800 bg-slate-950 divide-y divide-slate-800/60 overflow-hidden">
            {events.map((event, index) => {
              const meta = EVENT_META[event.type] || {
                label: event.type,
                icon: null,
                className: "text-slate-400",
              };
              const isHome = event.team_id === match.home_team?.id;
              const playerName = event.player_id
                ? players[event.player_id] || "Jogador"
                : "Sem identificação";

              return (
                <div
                  key={event.id || index}
                  className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                >
                  <div className={`flex items-center gap-2 ${meta.className}`}>
                    {meta.icon}
                    <span className="font-semibold">{playerName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-500">{meta.label}</span>
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                      {isHome ? match.home_team?.name : match.away_team?.name}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
