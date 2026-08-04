"use client";

import React from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Trophy,
  BarChart3,
  Users,
  Shield,
} from "lucide-react";
import { routes } from "@/lib/routes";
import {
  PublicChampionshipProvider,
  usePublicChampionshipContext,
} from "./championship-context";

const NAV_ITEMS = [
  { label: "Resumo", path: "", icon: LayoutDashboard },
  { label: "Jogos", path: "jogos", icon: Calendar },
  { label: "Classificação", path: "classificacao", icon: Trophy },
  { label: "Estatísticas", path: "estatisticas", icon: BarChart3 },
  { label: "Equipes", path: "equipes", icon: Users },
] as const;

type PublicNavPath = (typeof NAV_ITEMS)[number]["path"];

export default function PublicChampionshipLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const slug = (params?.championshipSlug as string) || "";

  return (
    <PublicChampionshipProvider slug={slug}>
      <PublicChampionshipShell>{children}</PublicChampionshipShell>
    </PublicChampionshipProvider>
  );
}

function PublicChampionshipShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { championship, loading, notFound } = usePublicChampionshipContext();
  const pathname = usePathname();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 bg-[#090d16] text-zinc-500">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-emerald-500" />
        <span className="text-xs font-mono tracking-wide">
          Carregando campeonato...
        </span>
      </div>
    );
  }

  if (notFound || !championship) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 bg-[#090d16] text-zinc-400 px-6 text-center">
        <Shield className="w-10 h-10 text-zinc-600" />
        <h1 className="text-lg font-bold text-white">Campeonato não encontrado</h1>
        <p className="text-sm max-w-sm">
          O endereço informado não corresponde a nenhum campeonato público.
        </p>
        <Link
          href={routes.public.home()}
          className="text-sm font-semibold text-emerald-400 transition hover:underline"
        >
          Voltar para o início
        </Link>
      </div>
    );
  }

  const mainSeason = championship.seasons?.[0];

  const isActive = (itemPath: PublicNavPath): boolean => {
    if (itemPath === "") {
      return pathname === routes.public.championship(championship.slug);
    }
    return pathname.startsWith(routes.public.section(championship.slug, itemPath));
  };

  const hrefFor = (itemPath: PublicNavPath): string =>
    itemPath === ""
      ? routes.public.championship(championship.slug)
      : routes.public.section(championship.slug, itemPath);

  return (
    <div className="min-h-screen bg-[#090d16] text-white">
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#0b0f19]/95 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between gap-3">
          <Link
            href={routes.public.championship(championship.slug)}
            className="flex items-center gap-3 min-w-0"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
              {championship.logo_url ? (
                <img
                  src={championship.logo_url}
                  alt={championship.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Shield className="w-5 h-5 text-emerald-400" />
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-sm md:text-base font-bold truncate">
                {championship.name}
              </h1>
              <p className="text-[10px] md:text-[11px] text-emerald-400 font-semibold truncate">
                {mainSeason?.name || "Campeonato público"}
              </p>
            </div>
          </Link>
        </div>

        <nav className="overflow-x-auto whitespace-nowrap scrollbar-none px-3 pb-2 flex gap-1 max-w-6xl mx-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.label}
                href={hrefFor(item.path)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 transition ${
                  active
                    ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/10"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {children}
      </main>
    </div>
  );
}
