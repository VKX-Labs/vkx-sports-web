import { supabase } from "@/lib/supabase";
import type {
  ChampionshipMember,
  ChampionshipMemberRole,
} from "@/types/championship-member";

export async function findChampionshipMembers(
  championshipId: string
): Promise<ChampionshipMember[]> {
  const { data, error } = await supabase
    .from("championship_members")
    .select("id, championship_id, user_id, role, created_at")
    .eq("championship_id", championshipId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const members = (data ?? []) as ChampionshipMember[];

  if (members.length === 0) return [];

  const userIds = members.map((member) => member.user_id);

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, email, full_name, avatar_url")
    .in("id", userIds);

  if (profilesError) {
    return members;
  }

  const profileMap = new Map(
    (profiles ?? []).map((profile: Record<string, unknown>) => [
      profile.id as string,
      profile,
    ])
  );

  return members.map((member) => ({
    ...member,
    profile: profileMap.get(member.user_id) ?? null,
  }));
}

export async function findMyMembership(
  championshipId: string,
  userId: string
): Promise<ChampionshipMember | null> {
  const { data, error } = await supabase
    .from("championship_members")
    .select("id, championship_id, user_id, role, created_at")
    .eq("championship_id", championshipId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as ChampionshipMember | null) ?? null;
}

export async function insertFollower(
  championshipId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase.from("championship_members").insert({
    championship_id: championshipId,
    user_id: userId,
    role: "FOLLOWER",
  });

  if (error) throw new Error(error.message);
}

export async function updateMembershipRole(
  championshipId: string,
  userId: string,
  role: ChampionshipMemberRole
): Promise<void> {
  const { error } = await supabase
    .from("championship_members")
    .update({ role })
    .eq("championship_id", championshipId)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
}

export async function deleteMembership(
  championshipId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from("championship_members")
    .delete()
    .eq("championship_id", championshipId)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
}
