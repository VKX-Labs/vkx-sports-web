"use client";

import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import type { User } from "@supabase/supabase-js";

import type { Championship } from "@/types/championship";
import type {
  ChampionshipMember,
  ChampionshipMemberRole,
} from "@/types/championship-member";
import { useAuth } from "@/providers/auth-provider";
import { useChampionshipMembers } from "@/hooks/useChampionshipMembers";
import { canEditChampionship, canEditPlayers, canEditTeams } from "@/utils/permissions";

interface WorkspaceContextValue {
  championship: Championship;
  user: User | null;
  isOwner: boolean;
  canEdit: boolean;
  canEditPlayers: boolean;
  canEditTeams: boolean;
  myRole: ChampionshipMemberRole | null;
  members: ChampionshipMember[];
  loadingMembers: boolean;
  refreshMembers: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

interface WorkspaceProviderProps {
  championship: Championship;
  children: ReactNode;
}

export function WorkspaceProvider({
  championship,
  children,
}: WorkspaceProviderProps) {
  const { user } = useAuth();
  const { members, loading: loadingMembers, refresh: refreshMembers } =
    useChampionshipMembers(championship.id);

  const isOwner = Boolean(user?.id && championship.user_id === user.id);
  const myRole =
    members.find((member) => member.user_id === user?.id)?.role ?? null;
  const canEdit = canEditChampionship({
    userId: user?.id,
    ownerId: championship.user_id,
    myRole,
  });
  const canEditPlayersFlag = canEditPlayers({
    userId: user?.id,
    ownerId: championship.user_id,
    myRole,
  });
  const canEditTeamsFlag = canEditTeams({
    userId: user?.id,
    ownerId: championship.user_id,
    myRole,
  });

  return (
    <WorkspaceContext.Provider
      value={{
        championship,
        user,
        isOwner,
        canEdit,
        canEditPlayers: canEditPlayersFlag,
        canEditTeams: canEditTeamsFlag,
        myRole,
        members,
        loadingMembers,
        refreshMembers,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error(
      "useWorkspace deve ser usado dentro de um WorkspaceProvider."
    );
  }
  return ctx;
}
