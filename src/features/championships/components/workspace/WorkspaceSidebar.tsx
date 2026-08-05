"use client";

import { useParams, usePathname } from "next/navigation";
import Link from "next/link";

import { championshipMenu } from "@/constants/championship-menu";
import { routes } from "@/lib/routes";
import WorkspaceChampionshipCard from "./ChampionshipCard";
import { useWorkspace } from "./WorkspaceProvider";
import FollowButton from "@/features/championships/components/FollowButton";

export default function WorkspaceSidebar() {
  const { id } = useParams();
  const pathname = usePathname();
  const championshipId = id as string;
  const { championship, isOwner, canEdit, myRole } = useWorkspace();

  const visibleMenu = canEdit
    ? championshipMenu
    : championshipMenu.filter((item) => item.path !== "configuracoes");

  return (
    <aside className="w-64 border-r border-slate-800/80 bg-[#0b0f19] p-4 flex flex-col hidden md:flex shrink-0">
      <div className="space-y-6">
        <WorkspaceChampionshipCard championship={championship} />

        <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-900/40 p-3">
          <div className="flex items-center gap-2 min-w-0">
            {isOwner ? (
              <span className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 truncate">
                  Criador do Campeonato
                </span>
              </span>
            ) : canEdit ? (
              <span className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 truncate">
                  {myRole === "ADMIN" ? "Co-organizador" : "Editor"}
                </span>
              </span>
            ) : (
              <span className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full bg-slate-500 shrink-0" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">
                  Modo de Leitura / Visitante
                </span>
              </span>
            )}
          </div>

          {!isOwner && (
            <FollowButton
              championshipId={championship.id}
              championshipOwnerId={championship.user_id}
              compact
              className="w-full"
            />
          )}
        </div>

        <nav className="space-y-1">
          {visibleMenu.map((item) => {
            const targetHref = item.path
              ? routes.dashboard.section(championshipId, item.path)
              : routes.dashboard.championship(championshipId);

            const isActive = pathname === targetHref;

            return (
              <Link
                key={item.label}
                href={targetHref}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                  isActive
                    ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/10"
                    : "text-slate-400 hover:text-white hover:bg-slate-900/50"
                }`}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
