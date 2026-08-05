import { supabase } from "@/lib/supabase";
import type { Championship } from "@/types/championship";
import { assertChampionshipOwner } from "@/services/ownership";
import { getAuthenticatedUserId } from "@/services/auth.service";

export async function findChampionshipById(id: string): Promise<Championship> {
  const { data, error } = await supabase
    .from("championships")
    .select(`
      id, name, slug, description, logo_url, banner_url, user_id,
      seasons (
        id, name, status, modality, city, state, tournament_type, max_teams
      )
    `)
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Campeonato não encontrado.");

  return data as unknown as Championship;
}

export async function findChampionshipBySlug(slug: string): Promise<Championship | null> {
  const { data, error } = await supabase
    .from("championships")
    .select(`
      id, name, slug, description, logo_url, banner_url, user_id,
      seasons (
        id, name, status, modality, city, state, tournament_type, max_teams
      )
    `)
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as unknown as Championship) ?? null;
}

export async function findAllChampionships() {
  const { data, error } = await supabase
    .from("championships")
    .select(`
      *,
      seasons (
        id,
        status,
        tournament_type,
        modality
      )
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function countAllChampionships(): Promise<number> {
  const { count, error } = await supabase
    .from("championships")
    .select("*", { count: "exact", head: true });

  if (error) throw error;
  return count ?? 0;
}

const MY_CHAMPIONSHIPS_SELECT = `
  id,
  name,
  slug,
  user_id,
  created_at,
  seasons (
    id,
    name,
    status,
    modality,
    city,
    state,
    tournament_type,
    max_teams
  )
`;

export async function findMyChampionships(): Promise<Championship[]> {
  const userId = await getAuthenticatedUserId();

  const { data: owned, error: ownedError } = await supabase
    .from("championships")
    .select(MY_CHAMPIONSHIPS_SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (ownedError) throw new Error(ownedError.message);

  const { data: memberships, error: membershipsError } = await supabase
    .from("championship_members")
    .select("championship_id")
    .eq("user_id", userId);

  if (membershipsError) throw new Error(membershipsError.message);

  const memberIds = Array.from(
    new Set(
      (memberships ?? []).map(
        (membership) => membership.championship_id as string
      )
    )
  );

  let memberChampionships: Championship[] = [];

  if (memberIds.length > 0) {
    const { data, error } = await supabase
      .from("championships")
      .select(MY_CHAMPIONSHIPS_SELECT)
      .in("id", memberIds)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    memberChampionships = (data ?? []) as Championship[];
  }

  const ownedChampionships = (owned ?? []) as Championship[];
  const byId = new Map<string, Championship>();

  for (const championship of [...memberChampionships, ...ownedChampionships]) {
    byId.set(championship.id, championship);
  }

  return Array.from(byId.values()).sort(
    (a, b) =>
      new Date(b.created_at ?? 0).getTime() -
      new Date(a.created_at ?? 0).getTime()
  );
}

export async function insertChampionship(
  championshipData: Record<string, unknown>
) {
  const { data, error } = await supabase
    .from("championships")
    .insert(championshipData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteChampionshipById(id: string): Promise<boolean> {
  await assertChampionshipOwner(id);

  const { error } = await supabase
    .from("championships")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
  return true;
}

export async function deleteChampionshipByIdSafe(id: string): Promise<void> {
  await supabase.from("championships").delete().eq("id", id);
}
