import { getAuthenticatedUserId } from "@/services/auth.service";
import {
  findChampionshipMembers,
  findMyMembership,
  insertFollower,
  updateMembershipRole,
  deleteMembership,
} from "@/repositories/championship-member.repository";
import type {
  ChampionshipMember,
  ChampionshipMemberRole,
} from "@/types/championship-member";

export async function getChampionshipMembers(
  championshipId: string
): Promise<ChampionshipMember[]> {
  return findChampionshipMembers(championshipId);
}

export async function getMyChampionshipMembership(
  championshipId: string
): Promise<ChampionshipMember | null> {
  const userId = await getAuthenticatedUserId();
  return findMyMembership(championshipId, userId);
}

export async function followChampionship(championshipId: string): Promise<void> {
  const userId = await getAuthenticatedUserId();
  await insertFollower(championshipId, userId);
}

export async function unfollowChampionship(championshipId: string): Promise<void> {
  const userId = await getAuthenticatedUserId();
  await deleteMembership(championshipId, userId);
}

export async function setChampionshipMemberRole(
  championshipId: string,
  userId: string,
  role: ChampionshipMemberRole
): Promise<void> {
  await updateMembershipRole(championshipId, userId, role);
}

export async function removeChampionshipMember(
  championshipId: string,
  userId: string
): Promise<void> {
  await deleteMembership(championshipId, userId);
}
