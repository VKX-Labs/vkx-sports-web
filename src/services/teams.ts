import { supabase } from "@/lib/supabase";

export async function getTeams() {
  const { data, error } = await supabase
    .from("teams")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getTeamsCount() {
  const { count, error } = await supabase
    .from("teams")
    .select("*", { count: "exact", head: true });

  if (error) throw error;
  return count ?? 0;
}
