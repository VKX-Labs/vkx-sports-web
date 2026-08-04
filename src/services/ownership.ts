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

async function resolveSeasonOwnerId(seasonId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("seasons")
    .select("championship_id")
    .eq("id", seasonId)
    .maybeSingle();

  if (error || !data?.championship_id) return null;
  return resolveChampionshipOwnerId(data.championship_id as string);
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
