"use client";

import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import type { User } from "@supabase/supabase-js";

import type { Championship } from "@/types/championship";
import { useAuth } from "@/providers/auth-provider";

interface WorkspaceContextValue {
  championship: Championship;
  user: User | null;
  isOwner: boolean;
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

  const isOwner = Boolean(user?.id && championship.user_id === user.id);

  return (
    <WorkspaceContext.Provider value={{ championship, user, isOwner }}>
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
