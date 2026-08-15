import type { ChampionshipMemberRole } from "@/types/championship-member";

export interface CanEditChampionshipParams {
  userId?: string | null;
  ownerId?: string | null;
  myRole?: ChampionshipMemberRole | null;
}

export function canEditChampionship({
  userId,
  ownerId,
  myRole,
}: CanEditChampionshipParams): boolean {
  const isOwner = Boolean(userId && ownerId && userId === ownerId);
  return isOwner || myRole === "EDITOR" || myRole === "ADMIN";
}
