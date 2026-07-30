import React from "react";
import Image from "next/image";
import { PlayerStat } from "@/services/StatisticsService";

interface LeaderboardCardProps {
  title: string;
  icon: React.ReactNode;
  data?: PlayerStat[];
  stats?: PlayerStat[];
  metricLabel: string;
  loading?: boolean;
}

export function LeaderboardCard({
  title,
  icon,
  data = [],
  stats,
  metricLabel,
  loading = false,
}: LeaderboardCardProps) {
  const rawList = stats ?? data;
  const list = Array.isArray(rawList) ? rawList : [];

  return (
    <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
          <span className="text-emerald-400 text-xl">{icon}</span>
          <h3 className="font-bold text-white text-base md:text-lg">{title}</h3>
        </div>

        {loading ? (
          <div className="space-y-3 py-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-12 w-full bg-slate-900/50 rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="text-center py-6 text-slate-500 text-sm">
            Nenhum registro ainda.
          </div>
        ) : (
          <div className="space-y-3">
            {list.map((player, index) => (
              <div
                key={player.player_id || index}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-900/50 hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`font-black text-sm w-5 text-center ${
                      index === 0
                        ? "text-yellow-400 text-base"
                        : index === 1
                        ? "text-slate-300"
                        : index === 2
                        ? "text-amber-600"
                        : "text-slate-500"
                    }`}
                  >
                    {index + 1}º
                  </span>

                  <div className="w-9 h-9 rounded-full bg-slate-800 overflow-hidden relative flex-shrink-0 border border-slate-700">
                    {player.player_photo ? (
                      <Image
                        src={player.player_photo}
                        alt={player.player_name || "Atleta"}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-400">
                        {(player.player_name || "N/A")
                          .substring(0, 2)
                          .toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white truncate">
                      {player.player_name || "Jogador sem nome"}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {player.team_name || "Sem time"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 pl-2 flex-shrink-0">
                  <span className="font-black text-base text-emerald-400">
                    {player.count ?? 0}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-slate-500">
                    {metricLabel}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}