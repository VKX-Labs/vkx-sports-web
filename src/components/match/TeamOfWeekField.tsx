"use client";

import React, { useMemo } from "react";
import { Trophy, Star } from "lucide-react";
import { POSITION_LABELS } from "@/types/player";
import type { PlayerPosition } from "@/types/player";

export interface TeamOfWeekPlayer {
  player_id: string;
  player_name: string;
  team_name: string;
  position: PlayerPosition | null;
  photo_url: string | null;
  rating: number;
}

export interface TeamOfWeek {
  formation: string;
  lineup: TeamOfWeekPlayer[];
  bench: TeamOfWeekPlayer[];
  star_player: TeamOfWeekPlayer | null;
  highlights: string;
}

const LINE_ATT: PlayerPosition[] = ["PONTA_DIREITA", "PONTA_ESQUERDA", "SEGUNDO_ATACANTE", "CENTROAVANTE"];
const LINE_MID: PlayerPosition[] = ["VOLANTE", "MEIA_CENTRAL", "MEIA_ATACANTE"];
const LINE_DEF: PlayerPosition[] = ["ZAGUEIRO", "LATERAL_DIREITO", "LATERAL_ESQUERDO"];

function positionLabel(position: PlayerPosition | null): string {
  if (!position) return "—";
  return POSITION_LABELS[position] ?? position;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function PlayerCell({
  player,
  isStar,
}: {
  player: TeamOfWeekPlayer;
  isStar?: boolean;
}) {
  return (
    <div
      className={`relative flex flex-col items-center gap-1.5 rounded-xl px-2 py-2.5 shadow-lg shadow-black/40 border ${
        isStar
          ? "bg-amber-500/10 border-amber-400/40"
          : "bg-zinc-900/90 border-zinc-600/50"
      }`}
    >
      <div
        className={`relative w-12 h-12 md:w-16 md:h-16 rounded-full overflow-hidden flex items-center justify-center border-2 bg-zinc-950 shrink-0 ${
          isStar ? "border-amber-400" : "border-zinc-600"
        }`}
      >
        {isStar && (
          <Trophy className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-4 h-4 text-amber-400 drop-shadow" />
        )}
        {player.photo_url ? (
          <img
            src={player.photo_url}
            alt={player.player_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-xs md:text-sm font-bold text-zinc-300">
            {initials(player.player_name)}
          </span>
        )}
        <span className="absolute -bottom-1.5 -right-1 text-[10px] md:text-[11px] font-bold text-amber-400 bg-zinc-950 rounded px-1.5 border border-amber-400/50 leading-tight">
          {player.rating.toFixed(1)}
        </span>
      </div>
      <span className="text-[10px] md:text-xs font-semibold text-zinc-100 text-center truncate w-full">
        {player.player_name}
      </span>
      <span className="text-[9px] md:text-[10px] text-zinc-400 text-center truncate w-full">
        {positionLabel(player.position)}
      </span>
    </div>
  );
}

export default function TeamOfWeekField({
  teamOfWeek,
  roundName,
}: {
  teamOfWeek: TeamOfWeek;
  roundName?: string;
}) {
  const { attack, midfield, defense, goalkeeper } = useMemo(() => {
    const attack = teamOfWeek.lineup.filter((p) => p.position && LINE_ATT.includes(p.position));
    const defense = teamOfWeek.lineup.filter((p) => p.position && LINE_DEF.includes(p.position));
    const goalkeeper = teamOfWeek.lineup.filter((p) => p.position === "GOLEIRO");
    const midfield = teamOfWeek.lineup.filter((p) => p.position && LINE_MID.includes(p.position));

    // Jogadores sem posição cadastrada (NULL/desconhecida) são alocados
    // no meio-campo (linha genérica) para nunca sumirem do campo.
    const positionless = teamOfWeek.lineup.filter((p) => !p.position);
    midfield.push(...positionless);

    return { attack, midfield, defense, goalkeeper };
  }, [teamOfWeek.lineup]);

  const starPlayer = teamOfWeek.star_player;

  return (
    <div className="w-full bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-400" />
          <h3 className="text-sm md:text-base font-bold text-white tracking-tight">
            Seleção da Rodada
          </h3>
        </div>
        {roundName && (
          <span className="text-[10px] md:text-xs font-semibold text-zinc-400 bg-zinc-800 rounded-full px-3 py-1">
            {roundName}
          </span>
        )}
        <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1">
          {teamOfWeek.formation}
        </span>
      </div>

      <div className="relative overflow-x-auto scroller-smooth w-full">
        <div className="relative min-w-[340px] aspect-[4/5] md:aspect-[16/10] rounded-xl bg-gradient-to-b from-emerald-950/70 via-emerald-900/40 to-emerald-950/80 border border-zinc-800 overflow-hidden">
          <div className="absolute inset-y-0 left-1/2 w-px bg-emerald-400/15 -translate-x-1/2" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-full border border-emerald-400/15" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full border border-emerald-400/10" />

          <div className="absolute inset-0 grid grid-rows-4 gap-1 px-1.5 py-2.5 md:px-3 md:py-4">
            <div className="flex items-center justify-center gap-2 md:gap-5 min-h-0">
              {attack.length > 0
                ? attack.map((p) => (
                    <PlayerCell
                      key={p.player_id}
                      player={p}
                      isStar={starPlayer?.player_id === p.player_id}
                    />
                  ))
                : <span className="text-[10px] md:text-xs font-medium text-emerald-300/50">Atacantes</span>}
            </div>

            <div className="flex items-center justify-center gap-2 md:gap-5 min-h-0">
              {midfield.length > 0
                ? midfield.map((p) => (
                    <PlayerCell
                      key={p.player_id}
                      player={p}
                      isStar={starPlayer?.player_id === p.player_id}
                    />
                  ))
                : <span className="text-[10px] md:text-xs font-medium text-emerald-300/50">Meio-campo</span>}
            </div>

            <div className="flex items-center justify-center gap-2 md:gap-4 min-h-0">
              {defense.length > 0
                ? defense.map((p) => (
                    <PlayerCell
                      key={p.player_id}
                      player={p}
                      isStar={starPlayer?.player_id === p.player_id}
                    />
                  ))
                : <span className="text-[10px] md:text-xs font-medium text-emerald-300/50">Defesa</span>}
            </div>

            <div className="flex items-center justify-center min-h-0">
              {goalkeeper.length > 0
                ? goalkeeper.map((p) => (
                    <PlayerCell
                      key={p.player_id}
                      player={p}
                      isStar={starPlayer?.player_id === p.player_id}
                    />
                  ))
                : <span className="text-[10px] md:text-xs font-medium text-emerald-300/50">Goleiro</span>}
            </div>
          </div>
        </div>
      </div>

      {teamOfWeek.bench.length > 0 && (
        <div className="flex items-start gap-2 flex-wrap">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mt-1.5">
            Reservas:
          </span>
          {teamOfWeek.bench.map((p) => (
            <span
              key={p.player_id}
              className="inline-flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-full px-2.5 py-1"
            >
              <span className="w-5 h-5 rounded-full overflow-hidden bg-zinc-800 flex items-center justify-center shrink-0">
                {p.photo_url ? (
                  <img src={p.photo_url} alt={p.player_name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[8px] font-bold text-zinc-400">
                    {initials(p.player_name)}
                  </span>
                )}
              </span>
              <span className="text-[10px] font-semibold text-zinc-300 truncate max-w-[120px]">
                {p.player_name}
              </span>
              <span className="text-[10px] font-bold text-amber-400">
                {p.rating.toFixed(1)}
              </span>
            </span>
          ))}
        </div>
      )}

      {starPlayer && (
        <div className="flex items-center gap-3 bg-amber-500/5 border border-amber-500/20 rounded-xl px-3.5 py-3">
          <Trophy className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-zinc-400">
              Craque da Rodada:{" "}
              <span className="font-bold text-white">
                {starPlayer.player_name}
              </span>
              <span className="text-zinc-500"> · {starPlayer.team_name}</span>
            </p>
            {teamOfWeek.highlights && (
              <p className="text-[11px] text-zinc-500 mt-0.5 line-clamp-2">
                {teamOfWeek.highlights}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
