"use client";

import React from "react";
import { Shield, Users, MapPin, Settings2 } from "lucide-react";
import Link from "next/link";
import type { Team } from "@/types/team";

interface TeamCardProps {
  team: Team;
  championshipId: string;
  onEdit: (team: Team) => void;
}

export default function TeamCard({ team, championshipId, onEdit }: TeamCardProps) {
  const playerLength = team._count?.players || 0;

  return (
    <div className="bg-[#111827]/40 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between transition hover:border-slate-700 hover:bg-[#111827]/70 group">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 overflow-hidden relative">
          {team.badge_url ? (
            <img
              src={team.badge_url}
              alt={`Escudo do ${team.name}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <Shield className="w-6 h-6 text-slate-600" />
          )}
        </div>

        <div className="space-y-1 truncate">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-white text-base truncate group-hover:text-emerald-400 transition">
              {team.name}
            </h3>
            {team.short_name && (
              <span className="text-[10px] bg-slate-800 text-slate-400 font-bold px-1.5 py-0.5 rounded">
                {team.short_name}
              </span>
            )}
          </div>

          <p className="text-xs text-slate-400 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-slate-500" />
            {team.city || "Não informada"}
          </p>

          <p className="text-xs text-slate-400 flex items-center gap-1 pt-1">
            <Users className="w-3.5 h-3.5 text-emerald-500" />
            <span className="font-semibold text-slate-300">{playerLength}</span>{" "}
            {playerLength === 1 ? "jogador" : "jogadores"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-5 pt-4 border-t border-slate-800/60">
        <button
          type="button"
          onClick={() => onEdit(team)}
          className="py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-xs transition border border-slate-800 cursor-pointer"
        >
          Editar
        </button>

        <Link
          href={`/dashboard/campeonatos/${championshipId}/equipes/${team.id}`}
          className="py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500 hover:text-slate-950 text-emerald-400 font-bold text-xs transition text-center flex items-center justify-center gap-1.5 border border-emerald-500/20 hover:border-transparent"
        >
          <Settings2 className="w-3.5 h-3.5" />
          Gerenciar
        </Link>
      </div>
    </div>
  );
}