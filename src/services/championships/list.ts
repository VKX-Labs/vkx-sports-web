import {
  findAllChampionships,
  countAllChampionships,
  findMyChampionships,
} from "@/repositories";

export async function getChampionships() {
  return findAllChampionships();
}

export async function getChampionshipsCount(): Promise<number> {
  return countAllChampionships();
}

export async function getMyChampionships() {
  return findMyChampionships();
}
