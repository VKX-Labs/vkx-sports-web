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

  const isFinished = match.status === "finished" || match.status === "FINALIZADO";
  const isLive =
    match.status === "EM_ANDAMENTO" ||
    match.status === "in_progress" ||
    match.status === "AO_VIVO";
  const isPostponed = match.status === "ADIADO";
  const isCancelled = match.status === "CANCELADO";

  let statusLabel: string;
  let badgeClass: string;

  if (isLive) {
    statusLabel = "Ao Vivo";
    badgeClass = "bg-red-500/10 text-red-400 border border-red-500/30";
  } else if (isFinished) {
    statusLabel = "Encerrado";
    badgeClass = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
  } else if (isPostponed) {
    statusLabel = "Adiado";
    badgeClass = "bg-amber-500/10 text-amber-400 border border-amber-500/30";
  } else if (isCancelled) {
    statusLabel = "Cancelado";
    badgeClass = "bg-red-500/10 text-red-400 border border-red-500/30";
  } else {
    statusLabel = "Agendado";
    badgeClass = "bg-zinc-800 text-zinc-400";
  }

  const renderBadge = (url: string | null | undefined) => {
    if (url) {
      return (
        <img
          src={url}
          alt="Escudo"
          className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
        />
      );
    }
    return (
      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
        <Shield className="w-5 h-5 text-zinc-500 opacity-60" />
      </div>
    );
  };

  const formatScheduledTime = (value?: string | null): string | null => {
    if (!value) return null;
    const date = new Date(value);
    if (isNaN(date.getTime())) return null;
    const time = date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const day = date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    });
    return `${day} • ${time}`;
  };

  const handleCardClick = () => {
    if (championshipId && match.id) {
      router.push(routes.dashboard.match(championshipId as string, match.id));
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="relative w-full bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 shadow-md hover:border-emerald-500/50 hover:bg-zinc-800/80 transition-all cursor-pointer group"
    >
      {/* Status da Partida */}
      <span
        className={`mx-auto w-fit px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${badgeClass}`}
      >
        {statusLabel}
      </span>

      {/* Corpo do Confronto */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 mt-3">
        {/* Coluna Mandante */}
        <div className="flex flex-col items-center text-center">
          {renderBadge(home?.badge_url)}
          <span className="text-xs font-medium text-zinc-200 mt-1.5 line-clamp-2 max-w-[100px] group-hover:text-emerald-300 transition-colors">
            {homeName}
          </span>
        </div>

        {/* Coluna Central (Placar / Versus) */}
        <div className="flex items-center justify-center gap-2 px-2">
          {isLive || isFinished ? (
            <span className="text-2xl font-black text-white">
              {match.home_score ?? 0}
              <span className="text-zinc-500 mx-1 text-xl font-bold">x</span>
              {match.away_score ?? 0}
            </span>
          ) : (
            <span className="text-lg font-bold text-zinc-400">
              {formatScheduledTime(match.date) ?? "- : -"}
            </span>
          )}
        </div>

        {/* Coluna Visitante */}
        <div className="flex flex-col items-center text-center">
          {renderBadge(away?.badge_url)}
          <span className="text-xs font-medium text-zinc-200 mt-1.5 line-clamp-2 max-w-[100px] group-hover:text-emerald-300 transition-colors">
            {awayName}
          </span>
        </div>
      </div>

      {/* Botões de Ação (Admin) */}
      {(onEdit || onDelete) && (
        <div className="absolute top-3 right-3 flex items-center gap-1">
          {onEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(match);
              }}
              title="Editar partida"
              className="p-1.5 rounded-lg bg-zinc-950/90 border border-zinc-700 text-zinc-400 hover:text-emerald-400 hover:border-emerald-500/50 transition cursor-pointer opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(match.id);
              }}
              title="Excluir partida"
              className="p-1.5 rounded-lg bg-zinc-950/90 border border-zinc-700 text-zinc-400 hover:text-red-400 hover:border-red-500/50 transition cursor-pointer opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
