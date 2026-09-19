import type { SupabaseClient } from "@supabase/supabase-js";
import { isMissingTableError } from "@/lib/rating-engine";

export async function resolveSeasonIdByChampionship(
  supabase: SupabaseClient,
  championshipId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("seasons")
    .select("id")
    .eq("championship_id", championshipId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data?.id || null;
}

export async function loadChampionshipName(
  supabase: SupabaseClient,
  championshipId: string
): Promise<string> {
  const { data, error } = await supabase
    .from("championships")
    .select("name")
    .eq("id", championshipId)
    .maybeSingle();

  if (error) {
    if (isMissingTableError(error)) {
      throw new Error("Tabela championships não encontrada. Rode as migrações do Supabase.");
    }
    throw error;
  }
  if (!data) throw new Error("Campeonato não encontrado.");
  return String(data.name || "Campeonato");
}

export async function assertCanManageRatings(
  supabase: SupabaseClient,
  championshipId: string
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Usuário não autenticado.");
  }

  const { data: championship, error: championshipError } = await supabase
    .from("championships")
    .select("user_id")
    .eq("id", championshipId)
    .maybeSingle();

  if (championshipError) throw championshipError;
  if (!championship) throw new Error("Campeonato não encontrado.");

  if (championship.user_id === user.id) return;

  const { data: adminRow, error: adminError } = await supabase
    .from("championship_members")
    .select("id")
    .eq("championship_id", championshipId)
    .eq("user_id", user.id)
    .eq("role", "ADMIN")
    .maybeSingle();

  if (adminError && !isMissingTableError(adminError)) throw adminError;
  if (adminRow) return;

  throw new Error("Somente o ADMIN/criador do campeonato pode gerenciar notas.");
}