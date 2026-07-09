"use client";

import { Loader2, Search } from "lucide-react";

import { useDashboard } from "@/hooks/useDashboard";
import Sidebar from "./Sidebar";
import UserMenu from "./UserMenu";

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useDashboard();

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070a13] text-white flex flex-col">
      <header className="h-14 bg-brand-dark border-b border-slate-800 flex items-center justify-between px-4 shrink-0">
        <span className="text-sm font-black tracking-widest text-white md:hidden">
          VKX<span className="text-brand-accent">SPORTS</span>
        </span>

        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 w-64 text-slate-500 text-sm">
          <Search className="w-4 h-4" />
          <span>Buscar...</span>
        </div>

        <div className="flex items-center gap-3">
          <UserMenu />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 p-8 bg-[#0B0F19] bg-gradient-to-br from-[#0B0F19] to-[#070a13] overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
