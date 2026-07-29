"use client";

import { useState, useCallback, useEffect } from "react";
import { Loader2, Search, Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";

import { useDashboard } from "@/hooks/useDashboard";
import DashboardSidebar from "./DashboardSidebar";
import DashboardUserMenu from "./DashboardUserMenu";

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useDashboard();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    closeSidebar();
  }, [pathname, closeSidebar]);

  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070a13] text-white flex flex-col">
      <header className="h-14 bg-brand-dark border-b border-slate-800 flex items-center justify-between px-4 shrink-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden flex items-center justify-center h-11 w-11 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition"
            aria-label="Abrir menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-sm font-black tracking-widest text-white md:hidden">
            VKX<span className="text-brand-accent">SPORTS</span>
          </span>
        </div>

        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 w-64 text-slate-500 text-sm">
          <Search className="w-4 h-4" />
          <span>Buscar...</span>
        </div>

        <div className="flex items-center gap-3">
          <DashboardUserMenu />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="hidden md:block">
          <DashboardSidebar />
        </div>

        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={closeSidebar}
          />
        )}

        <div
          className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-brand-dark border-r border-slate-800 transition-transform duration-200 ease-in-out md:hidden overflow-y-auto ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between p-4 border-b border-slate-800/60">
            <span className="text-lg font-black tracking-widest text-white">
              VKX<span className="text-brand-accent">SPORTS</span>
            </span>
            <button
              onClick={closeSidebar}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition"
              aria-label="Fechar menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <DashboardSidebar onNavigate={closeSidebar} />
        </div>

        <main className="flex-1 p-4 sm:p-6 md:p-8 bg-[#0B0F19] bg-gradient-to-br from-[#0B0F19] to-[#070a13] overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
