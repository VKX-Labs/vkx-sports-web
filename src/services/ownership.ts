import { supabase } from "@/lib/supabase";
import { getAuthenticatedUserId } from "@/services/auth.service";

export class OwnershipError extends Error {
  constructor() {
    super("Você não tem permissão para modificar este campeonato.");
    this.name = "OwnershipError";
  }
}

async function resolveChampionshipOwnerId(championshipId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("championships")
    .select("user_id")
    .eq("id", championshipId)
    .maybeSingle();

  if (error || !data) return null;
  return data.user_id as string | null;
}

export async function resolveSeasonChampionshipId(seasonId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("seasons")
    .select("championship_id")
    .eq("id", seasonId)
    .maybeSingle();

  if (error || !data?.championship_id) return null;
  return data.championship_id as string | null;
}

async function resolveSeasonOwnerId(seasonId: string): Promise<string | null> {
  const championshipId = await resolveSeasonChampionshipId(seasonId);
  if (!championshipId) return null;
  return resolveChampionshipOwnerId(championshipId);
}

async function hasEditorRole(
  championshipId: string,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("championship_members")
    .select("id")
    .eq("championship_id", championshipId)
    .eq("user_id", userId)
    .in("role", ["EDITOR", "ADMIN"])
    .maybeSingle();

  return !error && Boolean(data);
}

async function hasSquadEditorRole(
  championshipId: string,
  userId: string
): Promise<boolean> {
  const ownerId = await resolveChampionshipOwnerId(championshipId);
  if (ownerId === userId) return true;

  const { data, error } = await supabase
    .from("championship_members")
    .select("id")
    .eq("championship_id", championshipId)
    .eq("user_id", userId)
    .in("role", ["EDITOR", "ADMIN", "SQUAD_EDITOR"])
    .maybeSingle();

  return !error && Boolean(data);
}

/**
 * Verifica se o usuário tem permissão de SQUAD_EDITOR (ou superior)
 * para gerenciar jogadores de um campeonato.
 * Checa ownership + papel na championship_members.
 */
export async function assertPlayerSquadEditor(
  championshipId: string
): Promise<void> {
  const userId = await getAuthenticatedUserId();
  const hasAccess = await hasSquadEditorRole(championshipId, userId);

  if (!hasAccess) {
    throw new OwnershipError();
  }
}

/**
 * Verificação defensiva (client-side) de propriedade de um campeonato.
 * Lança um erro amigável caso o usuário autenticado não seja o dono.
 * Deve ser chamada ANTES de qualquer mutação (INSERT/UPDATE/DELETE).
 */
export async function assertChampionshipOwner(
  championshipId: string
): Promise<void> {
  const userId = await getAuthenticatedUserId();
  const ownerId = await resolveChampionshipOwnerId(championshipId);

  if (!ownerId) {
    throw new Error("Campeonato não encontrado.");
  }

  if (ownerId !== userId) {
    throw new OwnershipError();
  }
}

export async function assertSeasonOwner(seasonId: string): Promise<void> {
  const userId = await getAuthenticatedUserId();
  const ownerId = await resolveSeasonOwnerId(seasonId);

  if (!ownerId) {
    throw new Error("Temporada não encontrada.");
  }

  if (ownerId !== userId) {
    throw new OwnershipError();
  }
}

export async function assertTeamOwner(teamId: string): Promise<void> {
  const userId = await getAuthenticatedUserId();

  const { data: team, error } = await supabase
    .from("teams")
    .select("season_id")
    .eq("id", teamId)
    .maybeSingle();

  if (error || !team?.season_id) {
    throw new Error("Equipe não encontrada.");
  }

  const ownerId = await resolveSeasonOwnerId(team.season_id as string);

  if (ownerId !== userId) {
    throw new OwnershipError();
  }
}

export async function assertPlayerOwner(playerId: string): Promise<void> {
  const userId = await getAuthenticatedUserId();

  const { data: player } = await supabase
    .from("players")
    .select("season_id")
    .eq("id", playerId)
    .maybeSingle();

  if (!player?.season_id) {
    throw new Error("Jogador não encontrado.");
  }

  const ownerId = await resolveSeasonOwnerId(player.season_id as string);

  if (ownerId !== userId) {
    throw new OwnershipError();
  }
}

export async function assertMatchOwner(matchId: string): Promise<void> {
  const userId = await getAuthenticatedUserId();

  const { data: match } = await supabase
    .from("matches")
    .select("season_id")
    .eq("id", matchId)
    .maybeSingle();

  if (!match?.season_id) {
    throw new Error("Partida não encontrada.");
  }

  const ownerId = await resolveSeasonOwnerId(match.season_id as string);

  if (ownerId !== userId) {
    throw new OwnershipError();
  }
}

export async function assertRoundOwner(roundId: string): Promise<void> {
  const userId = await getAuthenticatedUserId();

  const { data: round } = await supabase
    .from("rounds")
    .select("season_id")
    .eq("id", roundId)
    .maybeSingle();

  if (!round?.season_id) {
    throw new Error("Rodada não encontrada.");
  }

  const ownerId = await resolveSeasonOwnerId(round.season_id as string);

  if (ownerId !== userId) {
    throw new OwnershipError();
  }
}

// =============================================================
// VARIAÇÕES "EDITOR": permitem mutações para donos e membros
// com papel EDITOR/ADMIN no campeonato vinculado.
// =============================================================

export async function assertChampionshipEditor(
  championshipId: string
): Promise<void> {
  const userId = await getAuthenticatedUserId();
  const ownerId = await resolveChampionshipOwnerId(championshipId);

  if (!ownerId) {
    throw new Error("Campeonato não encontrado.");
  }

  if (ownerId === userId) return;

  const isEditor = await hasEditorRole(championshipId, userId);
  if (!isEditor) {
    throw new OwnershipError();
  }
}

export async function assertSeasonEditor(seasonId: string): Promise<void> {
  const userId = await getAuthenticatedUserId();
  const championshipId = await resolveSeasonChampionshipId(seasonId);

  if (!championshipId) {
    throw new Error("Temporada não encontrada.");
  }

  const ownerId = await resolveChampionshipOwnerId(championshipId);

  if (!ownerId) {
    throw new Error("Temporada não encontrada.");
  }

  if (ownerId === userId) return;

  const isEditor = await hasEditorRole(championshipId, userId);
  if (!isEditor) {
    throw new OwnershipError();
  }
}

export async function assertTeamEditor(teamId: string): Promise<void> {
  const { data: team, error } = await supabase
    .from("teams")
    .select("season_id")
    .eq("id", teamId)
    .maybeSingle();

  if (error || !team?.season_id) {
    throw new Error("Equipe não encontrada.");
  }

  await assertSeasonEditor(team.season_id as string);
}

export async function assertPlayerEditor(playerId: string): Promise<void> {
  const { data: player, error } = await supabase
    .from("players")
    .select("season_id")
    .eq("id", playerId)
    .maybeSingle();

  if (error || !player?.season_id) {
    throw new Error("Jogador não encontrado.");
  }

  const userId = await getAuthenticatedUserId();
  const championshipId = await resolveSeasonChampionshipId(player.season_id as string);

  if (!championshipId) {
    throw new Error("Campeonato não encontrado.");
  }

  const ownerId = await resolveChampionshipOwnerId(championshipId);

  if (ownerId === userId) return;

  const hasAccess = await hasSquadEditorRole(championshipId, userId);
  if (!hasAccess) {
    throw new OwnershipError();
  }
}

export async function assertMatchEditor(matchId: string): Promise<void> {
  const { data: match, error } = await supabase
    .from("matches")
    .select("season_id")
    .eq("id", matchId)
    .maybeSingle();

  if (error || !match?.season_id) {
    throw new Error("Partida não encontrada.");
  }

  await assertSeasonEditor(match.season_id as string);
}

export async function assertRoundEditor(roundId: string): Promise<void> {
  const { data: round, error } = await supabase
    .from("rounds")
    .select("season_id")
    .eq("id", roundId)
    .maybeSingle();

  if (error || !round?.season_id) {
    throw new Error("Rodada não encontrada.");
  }

  await assertSeasonEditor(round.season_id as string);
}
