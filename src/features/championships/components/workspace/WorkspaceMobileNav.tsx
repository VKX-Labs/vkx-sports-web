"use client";

import { useParams, usePathname } from "next/navigation";
import Link from "next/link";

import type { Championship } from "@/types/championship";
import { championshipMenu } from "@/constants/championship-menu";

interface WorkspaceMobileNavProps {
  championship: Championship;
}

export default function WorkspaceMobileNav({ championship }: WorkspaceMobileNavProps) {
  const { id } = useParams();
  const pathname = usePathname();

  return (
    <nav className="md:hidden bg-[#0b0f19] border-b border-slate-800/80 shrink-0">
      <div className="flex items-center gap-2 px-4 pt-3 pb-1">
        <span className="text-xs font-bold text-white truncate">{championship.name}</span>
      </div>
      <div className="overflow-x-auto whitespace-nowrap flex scrollbar-none px-3 pb-2 gap-1"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {championshipMenu.map((item) => {
          const targetHref = item.path
            ? `/dashboard/campeonatos/${id}/${item.path}`
            : `/dashboard/campeonatos/${id}`;

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
