import { findChampionshipById } from "@/repositories";
import type { Championship } from "@/types/championship";

export async function getChampionship(id: string): Promise<Championship> {
  return findChampionshipById(id);
}
