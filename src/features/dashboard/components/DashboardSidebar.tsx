"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Trophy,
  Users,
  UserSquare2,
  Globe,
  CreditCard,
} from "lucide-react";

const MENU_ITEMS = [
  { id: "dashboard", label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { id: "campeonatos", label: "Campeonatos", href: "/dashboard/campeonatos", icon: Trophy },
  { id: "equipes", label: "Equipes", href: "/dashboard/equipes", icon: Users },
  { id: "jogadores", label: "Jogadores", href: "/dashboard/jogadores", icon: UserSquare2 },
  { id: "organizador", label: "Organizador", href: "/dashboard/organizador", icon: Globe },
  { id: "assinatura", label: "Assinatura", href: "/dashboard/assinatura", icon: CreditCard },
];

interface DashboardSidebarProps {
  onNavigate?: () => void;
}

export default function DashboardSidebar({ onNavigate }: DashboardSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-full bg-brand-dark flex flex-col justify-between shrink-0">
      <div>
        <div className="p-5 border-b border-slate-800/60 hidden md:block">
          <Link href="/dashboard" className="text-lg font-black tracking-widest text-white">
            VKX<span className="text-brand-accent">SPORTS</span>
          </Link>
        </div>

        <nav className="p-3 space-y-1">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={onNavigate}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                  isActive
                    ? "bg-brand-accent text-slate-950 font-bold shadow-lg shadow-brand-accent/10"
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-slate-950" : "text-slate-400"}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-800/60 text-center">
        <span className="text-xs font-black tracking-widest text-slate-600">
          VKX<span className="text-brand-accent/40">SPORTS</span>
        </span>
      </div>
    </aside>
  );
}
