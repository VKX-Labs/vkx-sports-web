import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import type { Championship } from "@/types/championship";
import { routes } from "@/lib/routes";

interface ChampionshipCardProps {
  championship: Championship;
}

export default function WorkspaceChampionshipCard({ championship }: ChampionshipCardProps) {
  const mainSeason = championship.seasons?.[0] || {};

  return (
    <div className="space-y-4">
      <Link
        href={routes.dashboard.championships()}
        className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition group"
      >
        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition" />
        Voltar para Campeonatos
      </Link>

      <div className="p-3.5 bg-[#111827]/60 rounded-xl border border-slate-800/80">
        <h2 className="text-sm font-bold text-white truncate">{championship.name}</h2>
        <p className="text-[11px] text-emerald-400 font-semibold mt-0.5">{mainSeason.name}</p>
        <div className="mt-2.5 flex items-center justify-between gap-2">
          <span className="text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
            {mainSeason.status}
          </span>
          <span className="text-[10px] text-slate-500 font-medium truncate">{mainSeason.modality}</span>
        </div>
      </div>
    </div>
  );
}
