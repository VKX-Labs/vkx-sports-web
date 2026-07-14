"use client";

import React from "react";
import { useParams } from "next/navigation";

import { useChampionship } from "@/hooks/useChampionship";
import WorkspaceSidebar from "@/features/championships/components/workspace/WorkspaceSidebar";
import WorkspaceLoading from "@/features/championships/components/workspace/WorkspaceLoading";

export default function ChampionshipWorkspaceLayout({ children }: { children: React.ReactNode }) {
  const { id } = useParams();
  const { championship, loading } = useChampionship(id as string);

  if (loading) {
    return <WorkspaceLoading />;
  }

  if (!championship) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#090d16] text-sm text-slate-400">
        Não foi possível carregar este campeonato.
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#090d16] text-white">
      <WorkspaceSidebar championship={championship} />

      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
