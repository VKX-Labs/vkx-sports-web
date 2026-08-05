export type ChampionshipMemberRole = "FOLLOWER" | "EDITOR" | "ADMIN";

export interface ChampionshipMemberProfile {
  id?: string;
  email?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
}

export interface ChampionshipMember {
  id: string;
  championship_id: string;
  user_id: string;
  role: ChampionshipMemberRole;
  created_at?: string;
  profile?: ChampionshipMemberProfile | null;
}

export const MEMBER_ROLE_LABELS: Record<ChampionshipMemberRole, string> = {
  FOLLOWER: "Seguidor",
  EDITOR: "Editor",
  ADMIN: "Co-organizador",
};
