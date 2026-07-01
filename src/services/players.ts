import { supabase } from "@/lib/supabase";

export async function getPlayers() {
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getPlayersCount() {
  const { count, error } = await supabase
    .from("players")
    .select("*", { count: "exact", head: true });

  if (error) throw error;
  return count ?? 0;
}
