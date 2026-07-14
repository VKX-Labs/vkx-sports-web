"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Shield, Loader2 } from "lucide-react";
import { Team } from "@/types/team";
import { getTeams } from "@/services/teams/team-service";

export default function EquipeDetalhePage() {
  const { id, teamId } = useParams();
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTeam() {
      try {
        setLoading(true);
        const teams = await getTeams(id as string);
        const found = teams.find((t) => t.id === teamId);
        setTeam(found ?? null);
      } catch (err) {
        console.error("Erro ao carregar equipe:", err);
      } finally {
        setLoading(false);
      }
    }

    if (id && teamId) loadTeam();
  }, [id, teamId]);

  if (loading) {
    return (
      <div className="flex py-20 items-center justify-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
        <span className="text-sm text-slate-400 font-medium">Carregando equipe...</span>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-800 p-12 text-center max-w-xl mx-auto mt-6">
        <Shield className="w-8 h-8 text-slate-700 mx-auto mb-3" />
        <h3 className="text-sm font-bold text-slate-300">Equipe não encontrada</h3>
        <p className="text-xs text-slate-500 mt-1">
          Esta equipe não existe ou foi removida.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-white flex items-center gap-2">
        <Shield className="w-5 h-5 text-emerald-500" />
        {team.name}
      </h2>
      <p className="text-sm text-slate-400">
        Detalhes da equipe e elenco de jogadores.
      </p>
    </div>
  );
}
