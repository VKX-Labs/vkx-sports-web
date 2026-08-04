import { supabase } from "@/lib/supabase";
import type { Championship } from "@/types/championship";
import { assertChampionshipOwner } from "@/services/ownership";

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

export async function findMyChampionships() {
  const { data, error } = await supabase
    .from("championships")
    .select(`
      id,
      name,
      slug,
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
    `)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
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
