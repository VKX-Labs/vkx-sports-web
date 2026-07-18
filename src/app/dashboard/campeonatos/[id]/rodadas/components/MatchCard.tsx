"use client";

import React from "react";
import { Shield } from "lucide-react";

interface Team {
  id: string;
  name: string;
  badge_url: string | null;
}

interface MatchCardProps {
  match: {
    id: string;
    home_score: number | null;
    away_score: number | null;
    status: string;
    home_team?: Team;
    away_team?: Team;
    homeTeam?: Team;
    awayTeam?: Team;
  };
}

export function MatchCard({ match }: MatchCardProps) {
  const home = match.home_team || match.homeTeam;
  const away = match.away_team || match.awayTeam;

  const homeName = home?.name || "TBD";
  const awayName = away?.name || "TBD";

  const renderBadge = (url: string | null | undefined) => {
    if (url) {
      return <img src={url} alt="Escudo do time" className="w-8 h-8 object-contain" />;
    }
    return <Shield className="w-8 h-8 text-slate-500 opacity-60" />;
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-md hover:border-slate-700 transition-all">
      <div className="flex items-center gap-3 flex-1 justify-end text-right">
        <span className="text-sm font-bold text-slate-200 truncate max-w-[140px]">
          {homeName}
        </span>
        <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700 flex-shrink-0">
          {renderBadge(home?.badge_url)}
        </div>
      </div>

      <div className="flex flex-col items-center justify-center px-4 min-w-[100px]">
        <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 font-mono text-base font-bold text-slate-100 shadow-inner">
          <span>{match.home_score !== null ? match.home_score : "-"}</span>
          <span className="text-slate-600 text-xs">:</span>
          <span>{match.away_score !== null ? match.away_score : "-"}</span>
        </div>
        <span className="text-[10px] font-extrabold uppercase tracking-wider mt-1.5 text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/50">
          {match.status === "scheduled" || match.status === "AGENDADO" ? "Agendado" : match.status}
        </span>
      </div>

      <div className="flex items-center gap-3 flex-1 justify-start text-left">
        <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700 flex-shrink-0">
          {renderBadge(away?.badge_url)}
        </div>
        <span className="text-sm font-bold text-slate-200 truncate max-w-[140px]">
          {awayName}
        </span>
      </div>
    </div>
  );
}