import { createChampionshipWithSeason } from "./create";
import type { CreateChampionshipInput } from "./create";
import { deleteChampionship } from "./delete";
import { getChampionship } from "./find";
import {
  getChampionships,
  getChampionshipsCount,
  getMyChampionships,
} from "./list";

export {
  createChampionshipWithSeason,
  deleteChampionship,
  getChampionship,
  getChampionships,
  getChampionshipsCount,
  getMyChampionships,
};

export type { CreateChampionshipInput };
