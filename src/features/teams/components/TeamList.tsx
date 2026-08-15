"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { Shield, Plus, Search, Loader2 } from "lucide-react";

import { useTeams } from "@/hooks/useTeams";
import TeamCard from "@/features/teams/components/TeamCard";
import TeamForm from "@/components/forms/TeamForm";
import EditTeamModal from "@/components/forms/EditTeamModal";
import DeleteTeamModal from "@/components/forms/DeleteTeamModal";
import type { Team } from "@/types/team";
import { useWorkspace } from "@/features/championships/components/workspace/WorkspaceProvider";

export default function TeamList() {
  const { id } = useParams();
  const { canEdit } = useWorkspace();
  const { teams, loading, refresh } = useTeams(id as string);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deletingTeam, setDeletingTeam] = useState<Team | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const filteredTeams = teams.filter(
    (team) =>
      team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (team.city && team.city.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleOpenEdit = (team: Team) => {
    setEditingTeam(team);
    setIsEditModalOpen(true);
  };

  const handleOpenDelete = (team: Team) => {
    setDeletingTeam(team);
    setIsDeleteModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/60 pb-5">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-500" />
            Inscrição de Equipes
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Gerencie os clubes que disputarão esta temporada.
          </p>
        </div>

        {canEdit && (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs transition cursor-pointer shadow-lg shadow-emerald-500/5"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Nova Equipe
          </button>
        )}
      </div>

      <div className="w-full max-w-md relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Pesquisar clube por nome ou cidade..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#111827]/40 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition"
        />
      </div>

      {loading ? (
        <div className="flex py-20 items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
          <span className="text-sm text-slate-400 font-medium">
            Sincronizando equipes...
          </span>
        </div>
      ) : filteredTeams.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 p-12 text-center max-w-xl mx-auto mt-6">
          <Shield className="w-8 h-8 text-slate-700 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-300">
            Nenhuma equipe localizada
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchTerm
              ? "Nenhum resultado corresponde à sua busca por filtros."
              : canEdit
                ? "Comece inserindo a primeira equipe da competição usando o botão superior."
                : "Nenhuma equipe cadastrada neste campeonato."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTeams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              championshipId={id as string}
              onEdit={handleOpenEdit}
              onDelete={canEdit ? handleOpenDelete : undefined}
              canEdit={canEdit}
            />
          ))}
        </div>
      )}

      {canEdit && (
        <TeamForm
          championshipId={id as string}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={refresh}
        />
      )}

      {canEdit && (
        <EditTeamModal
          team={editingTeam}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingTeam(null);
          }}
          onSuccess={refresh}
        />
      )}

      {canEdit && (
        <DeleteTeamModal
          team={deletingTeam}
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setDeletingTeam(null);
          }}
          onSuccess={refresh}
        />
      )}
    </div>
  );
}