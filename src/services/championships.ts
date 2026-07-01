import { supabase } from "@/lib/supabase";

export async function getChampionships() {
  const { data, error } = await supabase
    .from("championships")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getChampionshipsCount() {
  const { count, error } = await supabase
    .from("championships")
    .select("*", { count: "exact", head: true });

  if (error) throw error;
  return count ?? 0;
}
