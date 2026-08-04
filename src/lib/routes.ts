/**
 * Central de rotas do VKX Sports.
 *
 * Todos os caminhos do sistema devem ser gerados por estes helpers
 * para evitar strings duplicadas e facilitar futuras mudanças de URL.
 *
 * Uso:
 *   import { routes } from "@/lib/routes";
 *
 *   routes.dashboard.matches(championshipId)
 *   routes.public.championship(slug)
 */

export type ChampionshipSection =
  | "equipes"
  | "jogadores"
  | "jogos"
  | "classificacao"
  | "estatisticas"
  | "configuracoes";

export type PublicSection = "jogos" | "classificacao" | "estatisticas" | "equipes";

const dashboard = {
  home: (): string => "/dashboard",
  organizers: (): string => "/dashboard/organizador",
  subscription: (): string => "/dashboard/assinatura",

  championships: (): string => "/dashboard/campeonatos",
  championship: (id: string): string => `/dashboard/campeonatos/${id}`,
  section: (id: string, section: ChampionshipSection): string =>
    `/dashboard/campeonatos/${id}/${section}`,

  matches: (id: string): string => `/dashboard/campeonatos/${id}/jogos`,
  match: (id: string, matchId: string): string =>
    `/dashboard/campeonatos/${id}/jogos/${matchId}`,

  teams: (id: string): string => `/dashboard/campeonatos/${id}/equipes`,
  team: (id: string, teamId: string): string =>
    `/dashboard/campeonatos/${id}/equipes/${teamId}`,

  players: (id: string): string => `/dashboard/campeonatos/${id}/jogadores`,
  player: (id: string, playerId: string): string =>
    `/dashboard/campeonatos/${id}/jogadores/${playerId}`,

  standings: (id: string): string => `/dashboard/campeonatos/${id}/classificacao`,
  stats: (id: string): string => `/dashboard/campeonatos/${id}/estatisticas`,
  settings: (id: string): string => `/dashboard/campeonatos/${id}/configuracoes`,
};

const publicRoutes = {
  home: (): string => "/",
  login: (redirect?: string): string =>
    redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : "/login",
  register: (): string => "/register",

  championship: (slug: string): string => `/${slug}`,
  section: (slug: string, section: PublicSection): string => `/${slug}/${section}`,

  matches: (slug: string): string => `/${slug}/jogos`,
  match: (slug: string, matchId: string): string => `/${slug}/jogos/${matchId}`,

  teams: (slug: string): string => `/${slug}/equipes`,
  team: (slug: string, teamSlug: string): string =>
    `/${slug}/equipes/${teamSlug}`,

  standings: (slug: string): string => `/${slug}/classificacao`,
  stats: (slug: string): string => `/${slug}/estatisticas`,
};

export const routes = {
  dashboard,
  public: publicRoutes,
} as const;
