import { useParams, usePathname } from "next/navigation";
import Link from "next/link";

import { Championship } from "@/types/championship";
import { championshipMenu } from "@/constants/championship-menu";
import WorkspaceChampionshipCard from "./ChampionshipCard";

interface SidebarProps {
  championship: Championship;
}

export default function WorkspaceSidebar({ championship }: SidebarProps) {
  const { id } = useParams();
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-slate-800/80 bg-[#0b0f19] p-4 flex flex-col hidden md:flex shrink-0">
      <div className="space-y-6">
        <WorkspaceChampionshipCard championship={championship} />

        <nav className="space-y-1">
          {championshipMenu.map((item) => {
            const targetHref = item.path 
              ? `/dashboard/campeonatos/${id}/${item.path}` 
              : `/dashboard/campeonatos/${id}`;
              
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