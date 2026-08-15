"use client";

import { useState } from "react";
import {
  Crown,
  Loader2,
  Shield,
  Trash2,
  UserCog,
  Users,
  UserX,
} from "lucide-react";

import { useWorkspace } from "@/features/championships/components/workspace/WorkspaceProvider";
import { useChampionshipMembers } from "@/hooks/useChampionshipMembers";
import {
  removeChampionshipMember,
  setChampionshipMemberRole,
} from "@/services/championship-members";
import { MEMBER_ROLE_LABELS } from "@/types/championship-member";
import type { ChampionshipMember } from "@/types/championship-member";

export default function ConfiguracoesPage() {
  const { championship, user, isOwner, canEdit } = useWorkspace();
  const { members, loading, refresh } = useChampionshipMembers(championship.id);
  const [busyMemberId, setBusyMemberId] = useState<string | null>(null);

  const handleGiveEditAccess = async (member: ChampionshipMember) => {
    if (
      !confirm(
        `Dar acesso de edição a "${member.profile?.full_name || member.profile?.email || "este usuário"}"? Ela poderá editar dados e lançar súmulas.`
      )
    ) {
      return;
    }

    await runOwnerAction(async () => {
      await setChampionshipMemberRole(championship.id, member.user_id, "EDITOR");
    }, member.id);
  };

  const handleRevokeEditAccess = async (member: ChampionshipMember) => {
    if (
      !confirm(
        `Revogar o acesso de edição de "${member.profile?.full_name || member.profile?.email || "este usuário"}"? Ela voltará a ser apenas seguidora.`
      )
    ) {
      return;
    }

    await runOwnerAction(async () => {
      await setChampionshipMemberRole(championship.id, member.user_id, "FOLLOWER");
    }, member.id);
  };

  const handleRemove = async (member: ChampionshipMember) => {
    if (
      !confirm(
        `Remover "${member.profile?.full_name || member.profile?.email || "este usuário"}" deste campeonato? Ela deixará de seguir.`
      )
    ) {
      return;
    }

    await runOwnerAction(async () => {
      await removeChampionshipMember(championship.id, member.user_id);
    }, member.id);
  };

  const runOwnerAction = async (
    action: () => Promise<void>,
    memberId: string
  ) => {
    setBusyMemberId(memberId);
    try {
      await action();
      await refresh();
    } catch (err) {
      console.error("Erro ao gerenciar membro:", err);
      alert(
        "Não foi possível concluir esta ação. Verifique se você é o criador do campeonato."
      );
    } finally {
      setBusyMemberId(null);
    }
  };

  const displayName = (member: ChampionshipMember): string => {
    return (
      member.profile?.full_name ||
      member.profile?.email ||
      "Usuário VKX Sports"
    );
  };

  const displayEmail = (member: ChampionshipMember): string | null => {
    return member.profile?.email ?? null;
  };

  const memberInitials = (member: ChampionshipMember): string => {
    const name = displayName(member);
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-bold text-white">Configurações</h2>
        <p className="text-sm text-slate-400 mt-0.5">
          Gerencie as preferências e os colaboradores do campeonato.
        </p>
      </div>

      {canEdit ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Modo de Edição
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Você pode alterar configurações, times, jogadores, jogos e
                lançar súmulas. As opções sensíveis abaixo ficam restritas ao
                criador do campeonato.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <p className="text-sm text-slate-400">
            Você está em modo de leitura. Apenas o criador do campeonato e
            co-organizadores com papel de Editor podem alterar as configurações.
          </p>
        </div>
      )}

      {canEdit && (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                Gestores e Seguidores
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {isOwner
                  ? "Controle quem segue o campeonato e quem pode editar junto com você."
                  : "Veja quem segue e colabora com o campeonato. A gestão fica restrita ao criador."}
              </p>
            </div>
            <span className="rounded-full border border-slate-800 bg-slate-900 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {members.length} seguidor{members.length === 1 ? "" : "es"}
            </span>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-800/80">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                <Crown className="w-4 h-4 text-amber-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-white truncate">
                  {championship.user_id === user?.id
                    ? "Você"
                    : "Criador do campeonato"}
                </p>
                <p className="text-[11px] text-amber-400 font-semibold">
                  Criador (acesso total)
                </p>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center gap-2 px-4 py-8 text-xs text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                Carregando seguidores...
              </div>
            ) : members.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-slate-500">
                Nenhum seguidor ainda. Compartilhe a página pública do
                campeonato para atrair seguidores.
              </div>
            ) : (
              <ul className="divide-y divide-slate-800/70">
                {members.map((member) => (
                  <li
                    key={member.id}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-black text-emerald-400 shrink-0 overflow-hidden">
                      {member.profile?.avatar_url ? (
                        <img
                          src={member.profile.avatar_url}
                          alt={displayName(member)}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        memberInitials(member)
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-white truncate">
                        {displayName(member)}
                      </p>
                      {displayEmail(member) && (
                        <p className="text-[11px] text-slate-500 truncate">
                          {displayEmail(member)}
                        </p>
                      )}
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border ${
                        member.role === "ADMIN"
                          ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                          : member.role === "EDITOR"
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                            : "border-slate-700 bg-slate-900 text-slate-400"
                      }`}
                    >
                      {MEMBER_ROLE_LABELS[member.role]}
                    </span>

                    {isOwner && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        {member.role === "FOLLOWER" && (
                          <button
                            onClick={() => handleGiveEditAccess(member)}
                            disabled={busyMemberId === member.id}
                            title="Dar acesso de edição"
                            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold transition disabled:opacity-50 cursor-pointer"
                          >
                            {busyMemberId === member.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <UserCog className="w-3 h-3" />
                            )}
                            <span className="hidden sm:inline">Dar Acesso de Edição</span>
                          </button>
                        )}

                        {member.role === "EDITOR" && (
                          <button
                            onClick={() => handleRevokeEditAccess(member)}
                            disabled={busyMemberId === member.id}
                            title="Revogar acesso de edição"
                            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-[10px] font-bold transition disabled:opacity-50 cursor-pointer"
                          >
                            {busyMemberId === member.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <UserX className="w-3 h-3" />
                            )}
                            <span className="hidden sm:inline">Revogar Acesso</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleRemove(member)}
                          disabled={busyMemberId === member.id}
                          title="Remover seguidor"
                          className="flex items-center gap-1 rounded-lg p-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 transition disabled:opacity-50 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
