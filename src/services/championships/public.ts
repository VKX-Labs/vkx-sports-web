import { findChampionshipBySlug } from "@/repositories";
import type { Championship } from "@/types/championship";

export interface PublicChampionshipData {
  championship: Championship;
  seasonId: string | null;
}

export async function getPublicChampionship(
  slug: string
): Promise<PublicChampionshipData | null> {
  const championship = await findChampionshipBySlug(slug);

  if (!championship) return null;

  const seasonId = championship.seasons?.[0]?.id ?? null;

  return { championship, seasonId };
}
