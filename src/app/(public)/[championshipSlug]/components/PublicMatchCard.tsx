"use client";

import Link from "next/link";
import { Shield } from "lucide-react";
import { routes } from "@/lib/routes";
import type { PublicMatch } from "@/app/(public)/[championshipSlug]/lib/public-data";

interface PublicMatchCardProps {
  match: PublicMatch;
  slug: string;
}

export function PublicMatchCard({ match, slug }: PublicMatchCardProps) {
  const home = match.home_team;
  const away = match.away_team;

  const isFinished =
    match.status === "finished" || match.status === "FINALIZADO";

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      scheduled: "Agendado",
      AGENDADO: "Agendado",
      finished: "Finalizado",
      FINALIZADO: "Finalizado",
      in_progress: "Em Andamento",
    };
    return map[status] || status;
  };

  const renderBadge = (team: PublicMatch["home_team"]) => {
    if (team?.badge_url) {
      return (
        <img
          src={team.badge_url}
          alt={team.name}
          className="w-full h-full object-contain"
        />
      );
    }
    return <Shield className="w-4 h-4 text-slate-500" />;
  };

  return (
    <Link
      href={routes.public.match(slug, match.id)}
      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 md:p-4 grid grid-cols-[1fr_auto_1fr] shadow-md hover:border-emerald-500/50 hover:bg-slate-800/80 transition-all group"
    >
      <div className="flex items-center justify-end gap-2 min-w-0">
        <span className="text-xs md:text-sm font-bold text-slate-200 truncate max-w-[90px] md:max-w-[140px] group-hover:text-emerald-400 transition-colors">
          {home?.name || "TBD"}
        </span>
        <div className="w-7 h-7 md:w-9 md:h-9 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700 flex-shrink-0 overflow-hidden">
          {renderBadge(home)}
        </div>
      </div>

      <div className="flex flex-col items-center justify-center px-2 min-w-[80px]">
        <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 font-mono text-sm font-bold text-slate-100">
          <span className={isFinished ? "text-emerald-400" : "text-slate-100"}>
            {match.home_score !== null ? match.home_score : "-"}
          </span>
          <span className="text-slate-600 text-xs">:</span>
          <span className={isFinished ? "text-emerald-400" : "text-slate-100"}>
            {match.away_score !== null ? match.away_score : "-"}
          </span>
        </div>
        <span
          className={`text-[10px] font-extrabold uppercase tracking-wider mt-1.5 px-2 py-0.5 rounded border ${
            isFinished
              ? "text-emerald-400 bg-emerald-950/40 border-emerald-900/50"
              : "text-slate-400 bg-slate-800/60 border-slate-700"
          }`}
        >
          {getStatusLabel(match.status)}
        </span>
      </div>

      <div className="flex items-center justify-start gap-2 min-w-0">
        <div className="w-7 h-7 md:w-9 md:h-9 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700 flex-shrink-0 overflow-hidden">
          {renderBadge(away)}
        </div>
        <span className="text-xs md:text-sm font-bold text-slate-200 truncate max-w-[90px] md:max-w-[140px] group-hover:text-emerald-400 transition-colors">
          {away?.name || "TBD"}
        </span>
      </div>
    </Link>
  );
}
