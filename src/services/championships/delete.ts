import { deleteChampionshipById } from "@/repositories";
import { getAuthenticatedUserId } from "@/services/auth.service";
import { supabase } from "@/lib/supabase";

export async function deleteChampionship(id: string): Promise<boolean> {
  const userId = await getAuthenticatedUserId();

  const { data: championship } = await supabase
    .from("championships")
    .select("user_id")
    .eq("id", id)
    .single();

  if (!championship) {
    throw new Error("Campeonato não encontrado.");
  }

  if (championship.user_id !== userId) {
    throw new Error("Você não tem permissão para excluir este campeonato.");
  }

  return deleteChampionshipById(id);
}
