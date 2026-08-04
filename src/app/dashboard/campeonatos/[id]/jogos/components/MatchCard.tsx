"use client";

import React from "react";
import { Shield, Pencil, Trash2 } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { routes } from "@/lib/routes";

interface Team {
  id: string;
  name: string;
  badge_url: string | null;
}

export interface MatchCardMatch {
  id: string;
  home_score: number | null;
  away_score: number | null;
  status: string;
  home_team_id?: string | null;
  away_team_id?: string | null;
  date?: string | null;
  home_team?: Team;
  away_team?: Team;
  homeTeam?: Team;
  awayTeam?: Team;
}

interface MatchCardProps {
  match: MatchCardMatch;
  onEdit?: (match: MatchCardMatch) => void;
  onDelete?: (matchId: string) => void;
}

export function MatchCard({ match, onEdit, onDelete }: MatchCardProps) {
  const router = useRouter();
  const params = useParams();
  const championshipId = params?.id;

  const home = match.home_team || match.homeTeam;
  const away = match.away_team || match.awayTeam;

  const homeName = home?.name || "TBD";
  const awayName = away?.name || "TBD";

  const renderBadge = (url: string | null | undefined) => {
    if (url) {
      return <img src={url} alt="Escudo" className="w-full h-full object-contain" />;
    }
    return <Shield className="w-4 h-4 md:w-5 md:h-5 text-slate-500 opacity-60" />;
  };

  const handleCardClick = () => {
    if (championshipId && match.id) {
      router.push(routes.dashboard.match(championshipId as string, match.id));
    }
  };

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      scheduled: "Agendado",
      AGENDADO: "Agendado",
      finished: "Finalizado",
      FINALIZADO: "Finalizado",
      in_progress: "Em Andamento"
    };
    return map[status] || status;
  };

  const isFinished = match.status === "finished" || match.status === "FINALIZADO";

  return (
    <div
      onClick={handleCardClick}
      className="relative w-full bg-slate-900 border border-slate-800 rounded-xl p-3 md:p-4 grid grid-cols-[1fr_auto_1fr] md:flex md:items-center md:justify-between shadow-md hover:border-emerald-500/50 hover:bg-slate-800/80 transition-all cursor-pointer group"
    >
      {(onEdit || onDelete) && (
        <div className="absolute top-1.5 right-1.5 z-10 flex items-center gap-1">
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(match);
              }}
              title="Editar partida"
              className="p-1.5 rounded-lg bg-slate-950/90 border border-slate-700 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/50 transition cursor-pointer opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(match.id);
              }}
              title="Excluir partida"
              className="p-1.5 rounded-lg bg-slate-950/90 border border-slate-700 text-slate-400 hover:text-red-400 hover:border-red-500/50 transition cursor-pointer opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      <div className="flex items-center justify-end gap-2 md:gap-3 md:flex-1 md:text-right">
        <span className="text-xs md:text-sm font-bold text-slate-200 truncate max-w-[90px] md:max-w-[140px] group-hover:text-emerald-400 transition-colors">
          {homeName}
        </span>
        <div className="w-7 h-7 md:w-10 md:h-10 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700 flex-shrink-0 overflow-hidden">
          {renderBadge(home?.badge_url)}
        </div>
      </div>

      <div className="flex flex-col items-center justify-center px-2 md:px-4 min-w-[80px] md:min-w-[100px]">
        <div className="flex items-center gap-1.5 md:gap-2 bg-slate-950 px-2.5 md:px-3 py-1 md:py-1.5 rounded-lg border border-slate-800 font-mono text-sm md:text-base font-bold text-slate-100 shadow-inner group-hover:border-slate-700">
          <span className={isFinished ? "text-emerald-400" : "text-slate-100"}>
            {match.home_score !== null ? match.home_score : "-"}
          </span>
          <span className="text-slate-600 text-xs">:</span>
          <span className={isFinished ? "text-emerald-400" : "text-slate-100"}>
            {match.away_score !== null ? match.away_score : "-"}
          </span>
        </div>
        <span className={`text-[10px] font-extrabold uppercase tracking-wider mt-1.5 px-2 py-0.5 rounded border ${
          isFinished 
            ? "text-emerald-400 bg-emerald-950/40 border-emerald-900/50" 
            : "text-slate-400 bg-slate-800/60 border-slate-700"
        }`}>
          {getStatusLabel(match.status)}
        </span>
      </div>

      <div className="flex items-center justify-start gap-2 md:gap-3 md:flex-1 md:text-left">
        <div className="w-7 h-7 md:w-10 md:h-10 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700 flex-shrink-0 overflow-hidden">
          {renderBadge(away?.badge_url)}
        </div>
        <span className="text-xs md:text-sm font-bold text-slate-200 truncate max-w-[90px] md:max-w-[140px] group-hover:text-emerald-400 transition-colors">
          {awayName}
        </span>
      </div>
    </div>
  );
}
