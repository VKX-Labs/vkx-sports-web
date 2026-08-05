"use client";

import { useParams, usePathname } from "next/navigation";
import Link from "next/link";

import { championshipMenu } from "@/constants/championship-menu";
import { routes } from "@/lib/routes";
import { useWorkspace } from "./WorkspaceProvider";
import FollowButton from "@/features/championships/components/FollowButton";

export default function WorkspaceMobileNav() {
  const { id } = useParams();
  const pathname = usePathname();
  const championshipId = id as string;
  const { championship, isOwner, canEdit, myRole } = useWorkspace();

  const visibleMenu = canEdit
    ? championshipMenu
    : championshipMenu.filter((item) => item.path !== "configuracoes");

  return (
    <nav className="md:hidden bg-[#0b0f19] border-b border-slate-800/80 shrink-0">
      <div className="flex items-center justify-between gap-2 px-4 pt-3 pb-1">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-bold text-white truncate">{championship.name}</span>
          {isOwner ? (
            <span className="shrink-0 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-400">
              Criador
            </span>
          ) : canEdit ? (
            <span className="shrink-0 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-400">
              {myRole === "ADMIN" ? "Co-organizador" : "Editor"}
            </span>
          ) : (
            <span className="shrink-0 rounded-full border border-slate-800 bg-slate-900 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-400">
              Leitura
            </span>
          )}
        </div>

        {!isOwner && (
          <FollowButton
            championshipId={championship.id}
            championshipOwnerId={championship.user_id}
            compact
          />
        )}
      </div>
      <div className="overflow-x-auto whitespace-nowrap flex scrollbar-none px-3 pb-2 gap-1"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {visibleMenu.map((item) => {
          const targetHref = item.path
            ? routes.dashboard.section(championshipId, item.path)
            : routes.dashboard.championship(championshipId);

          const isActive = pathname === targetHref;

          return (
            <Link
              key={item.label}
              href={targetHref}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 transition ${
                isActive
                  ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/10"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <item.icon className="w-3.5 h-3.5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
