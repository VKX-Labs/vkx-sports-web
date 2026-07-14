import { supabase } from "@/lib/supabase";

export async function findSeasonByChampionshipId(
  championshipId: string
): Promise<{ id: string } | null> {
  const { data, error } = await supabase
    .from("seasons")
    .select("id")
    .eq("championship_id", championshipId)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function insertSeason(
  seasonData: Record<string, unknown>
) {
  const { data, error } = await supabase
    .from("seasons")
    .insert(seasonData)
    .select()
    .single();

  if (error) throw error;
  return data;
}
