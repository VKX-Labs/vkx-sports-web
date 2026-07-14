import { deleteChampionshipById } from "@/repositories";

export async function deleteChampionship(id: string): Promise<boolean> {
  return deleteChampionshipById(id);
}
