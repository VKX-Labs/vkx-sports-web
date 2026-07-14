import { getAuthenticatedUserId } from "@/services/auth.service";
import {
  insertChampionship,
  insertSeason,
  deleteChampionshipByIdSafe,
} from "@/repositories";
import { generateSlug } from "@/utils";

export interface CreateChampionshipInput {
  name: string;
  description?: string;
  modality: string;
  city: string;
  state: string;
  tournament_type:
    | "PONTOS_CORRIDOS"
    | "MATA_MATA"
    | "GRUPOS_MATA_MATA"
    | "ELIMINATORIA_DUPLA"
    | "COPA"
    | "LIGA";
  max_teams?: number;
  start_date?: string;
  end_date?: string;
}

const INITIAL_SEASON_NAME = "Temporada 2026";

export async function createChampionshipWithSeason(
  input: CreateChampionshipInput
) {
  const userId = await getAuthenticatedUserId();

  let championship: Record<string, unknown>;
  try {
    championship = await insertChampionship({
      user_id: userId,
      name: input.name,
      slug: generateSlug(input.name),
      description: input.description,
    });
  } catch (err: unknown) {
    const error = err as { code?: string; message: string };
    if (error.code === "23505") {
      throw new Error(
        "Você já possui um campeonato cadastrado com este nome."
      );
    }
    throw new Error(error.message);
  }

  try {
    const season = await insertSeason({
      championship_id: championship.id,
      name: INITIAL_SEASON_NAME,
      status: "CONFIGURACAO",
      modality: input.modality,
      city: input.city,
      state: input.state.toUpperCase(),
      tournament_type: input.tournament_type,
      max_teams: input.max_teams ?? null,
      start_date: input.start_date ?? null,
      end_date: input.end_date ?? null,
    });

    return { championship, season };
  } catch (err: unknown) {
    await deleteChampionshipByIdSafe(championship.id as string);
    const error = err as { message: string };
    throw new Error(error.message);
  }
}
