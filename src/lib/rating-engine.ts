import type { SupabaseClient } from "@supabase/supabase-js";
import { PLAYER_POSITIONS } from "@/types/player";
import type { PlayerPosition } from "@/types/player";

export function isMissingTableError(err: unknown): boolean {
  const message = `${err instanceof Error ? err.message : ""} ${(err as { error_description?: string })?.error_description || ""}`.toLowerCase();
  return (
    message.includes("could not find the table") ||
    message.includes("does not exist") ||
    message.includes("relation") ||
    message.includes("not found")
  );
}

const FINISHED_STATUSES = new Set(["finished", "finalizado", "FINISHED", "FINALIZADO"]);

export function isFinishedMatchStatus(status: unknown): boolean {
  return typeof status === "string" && FINISHED_STATUSES.has(status.trim());
}

export interface RatingEntry {
  player_id: string;
  player_name: string;
  team_name: string;
  position: PlayerPosition | null;
  photo_url: string | null;
  rating: number;
}

export interface TeamOfWeekEntry extends RatingEntry {}

export interface TeamOfWeek {
  formation: string;
  lineup: TeamOfWeekEntry[];
  bench: TeamOfWeekEntry[];
  star_player: TeamOfWeekEntry | null;
  highlights: string;
}

export interface RatingSquadPlayer {
  player_id?: string;
  name?: string;
  position?: string | null;
  photo_url?: string | null;
  team_name?: string;
  team_id?: string | null;
}

export interface RatingMatchInput {
  id?: string;
  matchId?: string;
  home_team_id?: string | null;
  away_team_id?: string | null;
  home_team?: { name?: string; badge_url?: string | null } | null;
  away_team?: { name?: string; badge_url?: string | null } | null;
  home_score?: number | null;
  away_score?: number | null;
  status?: string | null;
  events?: Array<Record<string, unknown>>;
  squads?: RatingSquadPlayer[];
}

export type RatingAuditStatus = "SUCCESS" | "WARNING" | "ERROR";

// ------------------------------------------------------------------
// Normalização de posições
// ------------------------------------------------------------------
const POSITION_LINES: Record<string, PlayerPosition[]> = {
  GK: ["GOLEIRO"],
  DEF: ["ZAGUEIRO", "LATERAL_DIREITO", "LATERAL_ESQUERDO"],
  MID: ["VOLANTE", "MEIA_DE_LIGACAO", "MEIA_ATACANTE"],
  ATT: ["PONTA_DIREITA", "PONTA_ESQUERDA", "SEGUNDO_ATACANTE", "CENTROAVANTE"],
};

const LINE_SLOTS: Record<string, number> = { GK: 1, DEF: 4, MID: 3, ATT: 3 };

const POSITION_ALIASES: Record<string, PlayerPosition> = {
  GK: "GOLEIRO",
  GOL: "GOLEIRO",
  GOLEIRO: "GOLEIRO",
  DEF: "ZAGUEIRO",
  DEFENSOR: "ZAGUEIRO",
  DEFESA: "ZAGUEIRO",
  ZAG: "ZAGUEIRO",
  ZAGUEIRO: "ZAGUEIRO",
  LB: "LATERAL_ESQUERDO",
  LE: "LATERAL_ESQUERDO",
  LATERAL_ESQUERDO: "LATERAL_ESQUERDO",
  RB: "LATERAL_DIREITO",
  LD: "LATERAL_DIREITO",
  LATERAL_DIREITO: "LATERAL_DIREITO",
  LATERAL: "LATERAL_DIREITO",
  VOL: "VOLANTE",
  VOLANTE: "VOLANTE",
  MC: "MEIA_DE_LIGACAO",
  MEC: "MEIA_DE_LIGACAO",
  MEIA_CENTRAL: "MEIA_DE_LIGACAO",
  MEIA_DE_LIGACAO: "MEIA_DE_LIGACAO",
  MEI: "MEIA_ATACANTE",
  MEIA: "MEIA_ATACANTE",
  MEIO: "MEIA_ATACANTE",
  MEIA_ATACANTE: "MEIA_ATACANTE",
  MCO: "MEIA_ATACANTE",
  MID: "MEIA_ATACANTE",
  CM: "MEIA_ATACANTE",
  PONTA_DIREITA: "PONTA_DIREITA",
  PD: "PONTA_DIREITA",
  PONTA_ESQUERDA: "PONTA_ESQUERDA",
  PE: "PONTA_ESQUERDA",
  SS: "SEGUNDO_ATACANTE",
  SA: "SEGUNDO_ATACANTE",
  "9": "SEGUNDO_ATACANTE",
  SEGUNDO_ATACANTE: "SEGUNDO_ATACANTE",
  ATT: "CENTROAVANTE",
  ATA: "CENTROAVANTE",
  ATACANTE: "CENTROAVANTE",
  CA: "CENTROAVANTE",
  ST: "CENTROAVANTE",
  CENTROAVANTE: "CENTROAVANTE",
};

export function normalizePositionInput(value?: string | null): PlayerPosition | null {
  if (!value) return null;
  const key = value
    .toUpperCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z_]/g, "");
  return POSITION_ALIASES[key] ?? null;
}

// ------------------------------------------------------------------
// Montagem do input estruturado (apenas dados, sem IA)
// ------------------------------------------------------------------
export function dedupeMatches(matches: RatingMatchInput[]): RatingMatchInput[] {
  const seen = new Set<string>();
  const result: RatingMatchInput[] = [];

  for (const m of matches) {
    const key = m.matchId || m.id;
    if (!key) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(m);
  }
  return result;
}

// Filtro estrito: partidas finalizadas + sem duplicatas.
// A REGRA DE NEGÓCIO NÃO usa escalação/titulares: os atletas vêm do elenco
// (tabela players) dos dois times que jogaram a partida.
export function normalizeRoundMatches(matches: RatingMatchInput[]): RatingMatchInput[] {
  const filtered = matches.filter((m) => isFinishedMatchStatus(m.status));
  return dedupeMatches(filtered);
}

// Hidrata as partidas direto do banco: busca o ELENCO COMPLETO dos dois
// times (todos os players de home_team_id/away_team_id) + match_events.
// O campo `squads` recebido do cliente é IGNORADO — a fonte da verdade é o DB.
interface RosterPlayer {
  id: string;
  name: string;
  position: string | null;
  photo_url: string | null;
  team_id: string | null;
}

export async function hydrateMatchRosters(
  supabase: SupabaseClient,
  seasonId: string,
  matches: RatingMatchInput[]
): Promise<RatingMatchInput[]> {
  const matchIds = matches
    .map((m) => m.matchId ?? m.id)
    .filter((id): id is string => typeof id === "string" && id.length > 0);
  const teamIds = new Set<string>();
  for (const m of matches) {
    if (m.home_team_id) teamIds.add(m.home_team_id);
    if (m.away_team_id) teamIds.add(m.away_team_id);
  }

  // Teams (nomes para enriquecimento).
  const teamsMap = new Map<string, { name: string; badge_url: string | null }>();
  if (teamIds.size > 0) {
    const { data: teamsData, error: teamsError } = await supabase
      .from("teams")
      .select("id, name, badge_url")
      .in("id", Array.from(teamIds));

    if (teamsError && !isMissingTableError(teamsError)) {
      console.error("[rating-engine] Erro ao carregar times:", teamsError);
    }

    for (const t of (teamsData as Array<Record<string, unknown>>) || []) {
      teamsMap.set(String(t.id), {
        name: String(t.name || "Time"),
        badge_url: (t.badge_url as string | null) || null,
      });
    }
  }

  // Elenco completo dos dois times (TODOS os jogadores, sem escalação).
  const playersByTeam = new Map<string, RatingSquadPlayer[]>();
  const playersById = new Map<string, RosterPlayer>();
  if (teamIds.size > 0) {
    const { data: playersData, error: playersError } = await supabase
      .from("players")
      .select("id, name, position, photo_url, team_id")
      .eq("season_id", seasonId)
      .in("team_id", Array.from(teamIds));

    if (playersError && !isMissingTableError(playersError)) {
      console.error("[rating-engine] Erro ao carregar elenco dos times:", playersError);
    }

    for (const p of (playersData as Array<Record<string, unknown>>) || []) {
      const teamId = p.team_id ? String(p.team_id) : null;
      const team = teamId ? teamsMap.get(teamId) : null;
      const squad: RatingSquadPlayer = {
        player_id: String(p.id),
        name: String(p.name || "Jogador"),
        position: p.position ? String(p.position) : null,
        photo_url: (p.photo_url as string | null) || null,
        team_name: team?.name || "Time",
        team_id: teamId,
      };

      playersById.set(String(p.id), {
        id: String(p.id),
        name: squad.name!,
        position: squad.position ?? null,
        photo_url: squad.photo_url ?? null,
        team_id: teamId,
      });

      if (teamId) {
        const list = playersByTeam.get(teamId) || [];
        list.push(squad);
        playersByTeam.set(teamId, list);
      }
    }
  }

  // Eventos oficiais por partida.
  const eventsByMatch = new Map<string, Array<Record<string, unknown>>>();
  if (matchIds.length > 0) {
    const { data: eventsData, error: eventsError } = await supabase
      .from("match_events")
      .select("match_id, player_id, assist_player_id, team_id, type, quantity, minute")
      .in("match_id", matchIds);

    if (eventsError && !isMissingTableError(eventsError)) {
      console.error("[rating-engine] Erro ao carregar eventos das partidas:", eventsError);
    }

    for (const e of (eventsData as Array<Record<string, unknown>>) || []) {
      const matchId = String(e.match_id);
      const playerId = e.player_id ? String(e.player_id) : null;
      const teamId = e.team_id ? String(e.team_id) : null;
      const player = playerId ? playersById.get(playerId) : null;
      const team = teamId ? teamsMap.get(teamId) : null;

      const list = eventsByMatch.get(matchId) || [];
      list.push({
        match_id: matchId,
        player_id: playerId,
        assist_player_id: e.assist_player_id ? String(e.assist_player_id) : null,
        team_id: teamId,
        type: e.type || "",
        quantity: e.quantity ?? 1,
        minute: e.minute ?? null,
        player_name: player?.name || String((e as { player_name?: unknown }).player_name || "Jogador"),
        team_name: team?.name || String((e as { team_name?: unknown }).team_name || "Time"),
      });
      eventsByMatch.set(matchId, list);
    }
  }

  // Monta o payload: elenco dos dois times + todos os atletas com eventos.
  return matches.map((m) => {
    const matchId = m.matchId ?? m.id;
    if (!matchId) return m;

    const homeTeamId = m.home_team_id || null;
    const awayTeamId = m.away_team_id || null;

    const squads: RatingSquadPlayer[] = [
      ...(homeTeamId ? playersByTeam.get(homeTeamId) || [] : []),
      ...(awayTeamId ? playersByTeam.get(awayTeamId) || [] : []),
    ];

    const squadById = new Map<string, RatingSquadPlayer>();
    for (const s of squads) if (s.player_id) squadById.set(s.player_id, s);

    // Garante inclusão de atleta que tenha evento mas esteja fora do elenco por algum motivo.
    for (const e of eventsByMatch.get(matchId) || []) {
      for (const pid of [String(e.player_id || ""), String(e.assist_player_id || "")]) {
        if (!pid || squadById.has(pid)) continue;
        const player = playersById.get(pid);
        squadById.set(pid, {
          player_id: pid,
          name: player?.name || String(e.player_name || "Jogador"),
          position: player?.position || null,
          photo_url: player?.photo_url || null,
          team_name: String(e.team_name || "Time"),
          team_id: e.team_id ? String(e.team_id) : null,
        });
      }
    }

    return {
      ...m,
      squads: Array.from(squadById.values()),
      events: eventsByMatch.get(matchId) || [],
    };
  });
}

// ------------------------------------------------------------------
// MOTOR 100% DETERMINÍSTICO — VKX V2 (SISTEMA NATIVO)
//
// Cálculo de nota por atleta sem qualquer chamada externa (IA/Groq).
// Regras de negócio fixas da V2 (pesos por posição + tetos + retornos
// decrescentes):
//   - Nota base: 6.50
//   - Resultado: Vitória +0.30 | Empate +0.00 | Derrota -0.30
//   - Gols: peso por posição, com TETO +2.40 (não soma "gols do time").
//   - Assistências: peso por posição, com TETO +1.50.
//   - Índice Defensivo Coletivo (desarmes do time / média do campeonato)
//     com teto por posição.
//   - Goleiro: defesas com tabela progressiva (retornos decrescentes),
//     teto +0.80.
//   - Gols sofridos: penalidade por posição, teto -0.50.
//   - Cartões: amarelo -0.15; vermelho direto -1.00 / 2º amarelo -0.80.
//   - Gol contra: -0.80 (não contemplado nos tetos de ataque).
//   - Clamp final: 3.0 a 10.0, uma casa decimal.
// ------------------------------------------------------------------
const BASE_RATING = 6.5;
const WIN_BONUS = 0.3;
const DRAW_BONUS = 0.0;
const LOSS_PENALTY = -0.3;
const MIN_RATING = 3.0;
const MAX_RATING = 10.0;

// --- Gols (peso por posição) — teto total de +2.40 por atleta ---
const GOAL_BONUS_CAP = 2.4;
const GOAL_BONUS_BY_POSITION: Record<PlayerPosition, number> = {
  GOLEIRO: 1.2,
  ZAGUEIRO: 0.9,
  LATERAL_DIREITO: 0.75,
  LATERAL_ESQUERDO: 0.75,
  VOLANTE: 0.7,
  MEIA_DE_LIGACAO: 0.7,
  MEIA_ATACANTE: 0.7,
  PONTA_DIREITA: 0.8,
  PONTA_ESQUERDA: 0.8,
  SEGUNDO_ATACANTE: 0.8,
  CENTROAVANTE: 0.8,
};

// --- Assistências (peso por posição) — teto total de +1.50 por atleta ---
const ASSIST_BONUS_CAP = 1.5;
const ASSIST_BONUS_BY_POSITION: Record<PlayerPosition, number> = {
  GOLEIRO: 0.9,
  ZAGUEIRO: 0.65,
  LATERAL_DIREITO: 0.65,
  LATERAL_ESQUERDO: 0.65,
  VOLANTE: 0.6,
  MEIA_DE_LIGACAO: 0.75,
  MEIA_ATACANTE: 0.75,
  PONTA_DIREITA: 0.75,
  PONTA_ESQUERDA: 0.75,
  SEGUNDO_ATACANTE: 0.65,
  CENTROAVANTE: 0.65,
};

// --- Índice Defensivo Coletivo — teto do bônus por posição ---
const DEFENSIVE_INDEX_MAX_BY_POSITION: Record<PlayerPosition, number> = {
  GOLEIRO: 0.0,
  ZAGUEIRO: 0.2,
  LATERAL_DIREITO: 0.15,
  LATERAL_ESQUERDO: 0.15,
  VOLANTE: 0.2,
  MEIA_DE_LIGACAO: 0.1,
  MEIA_ATACANTE: 0.1,
  PONTA_DIREITA: 0.05,
  PONTA_ESQUERDA: 0.05,
  SEGUNDO_ATACANTE: 0.03,
  CENTROAVANTE: 0.03,
};

// --- Gols sofridos — penalidade por posição (magnitude), teto -0.50 ---
const GOALS_CONCEDED_PENALTY_CAP = 0.5;
const GOALS_CONCEDED_BY_POSITION: Record<PlayerPosition, number> = {
  GOLEIRO: 0.1,
  ZAGUEIRO: 0.07,
  LATERAL_DIREITO: 0.05,
  LATERAL_ESQUERDO: 0.05,
  VOLANTE: 0.03,
  MEIA_DE_LIGACAO: 0.02,
  MEIA_ATACANTE: 0.02,
  PONTA_DIREITA: 0.03,
  PONTA_ESQUERDA: 0.03,
  SEGUNDO_ATACANTE: 0.03,
  CENTROAVANTE: 0.03,
};

// --- Cartões ---
const YELLOW_CARD_PENALTY = -0.15;
const RED_DIRECT_PENALTY = -1.0;
const SECOND_YELLOW_PENALTY = -0.8;

// --- Gol contra ---
const OWN_GOAL_PENALTY = -0.8;

// --- Goleiro: defesas com retornos decrescentes (teto +0.80) ---
const SAVES_BONUS_CAP = 0.8;
const SAVES_BRACKETS = [
  { until: 3, value: 0.05 },
  { until: 6, value: 0.07 },
  { until: Number.MAX_SAFE_INTEGER, value: 0.08 },
];

function computeSavesBonus(totalSaves: number): number {
  let bonus = 0;
  if (totalSaves <= 0) return 0;
  let last = 0;
  for (const bracket of SAVES_BRACKETS) {
    const countInBracket = Math.min(Math.max(totalSaves - last, 0), bracket.until - last);
    bonus += countInBracket * bracket.value;
    last = bracket.until;
    if (totalSaves <= bracket.until) break;
  }
  return Math.min(bonus, SAVES_BONUS_CAP);
}

// Normaliza variações comuns de tipo de evento (inclui gol contra, que não
// possui tipo próprio na tabela match_events) para o formato canônico.
const EVENT_TYPE_ALIASES: Record<string, string> = {
  GOAL: "GOAL",
  GOL: "GOAL",
  GOLS: "GOAL",
  PENALTY: "PENALTY",
  PENALTI: "PENALTY",
  PENALTY_GOAL: "PENALTY",
  ASSIST: "ASSIST",
  ASSISTENCIA: "ASSIST",
  YELLOW_CARD: "YELLOW_CARD",
  YELLOW: "YELLOW_CARD",
  AMARELO: "YELLOW_CARD",
  CARTAO_AMARELO: "YELLOW_CARD",
  RED_CARD: "RED_CARD",
  RED: "RED_CARD",
  VERMELHO: "RED_CARD",
  CARTAO_VERMELHO: "RED_CARD",
  SAVE: "SAVE",
  DEFESA: "SAVE",
  PENALTY_SAVE: "SAVE",
  OWN_GOAL: "OWN_GOAL",
  GOL_CONTRA: "OWN_GOAL",
  AUTO_GOAL: "OWN_GOAL",
  OG: "OWN_GOAL",
  TACKLE: "TACKLE",
  DESARME: "TACKLE",
};

export function normalizeEventType(value: string): string {
  if (!value) return "";
  const key = value
    .toUpperCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z_]/g, "");
  return EVENT_TYPE_ALIASES[key] ?? value.toUpperCase().trim();
}

function clampRating(value: number): number {
  return Math.min(MAX_RATING, Math.max(MIN_RATING, Math.round(value * 10) / 10));
}

export interface RatingComputationOptions {
  /** Média de desarmes do campeonato (por lado de time / partida). */
  averageTacklesPerMatch?: number;
}

export interface RatingBreakdown {
  base: number;
  result: number;
  goals: number;
  goals_bonus: number;
  assists: number;
  assists_bonus: number;
  g_a: number;
  goals_conceded: number;
  goals_conceded_penalty: number;
  saves: number;
  saves_bonus: number;
  tackles: number;
  team_tackles: number;
  defensive_index: number;
  defensive_index_bonus: number;
  yellow_cards: number;
  yellow_card_penalty: number;
  red_cards: number;
  red_penalty: number;
  own_goals: number;
  own_goal_penalty: number;
  rating: number;
}

export interface ComputedMatchRating {
  rating: number;
  breakdown: RatingBreakdown;
}

function keyForPosition(position: PlayerPosition | null): PlayerPosition {
  return position ?? "MEIA_DE_LIGACAO";
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}

// Nota determinística nativa (VKX V2) de UM atleta da partida. Não depende de
// rede, IA ou serviços externos: é pura função dos dados (resultado + eventos
// + índice defensivo coletivo). A métrica G+A (gols + assistências) é calculada
// apenas para exibição e NÃO soma na nota final as componentes em dobro.
export function computeNativeRatingDetailed(
  squad: RatingSquadPlayer,
  match: RatingMatchInput,
  events: Array<Record<string, unknown>>,
  options?: RatingComputationOptions
): ComputedMatchRating {
  const position = normalizePositionInput(squad.position);
  const positionKey = keyForPosition(position);
  const isGk = position === "GOLEIRO";

  const homeScore = Number(match.home_score) || 0;
  const awayScore = Number(match.away_score) || 0;
  const isHome = Boolean(squad.team_id && squad.team_id === match.home_team_id);
  const teamScore = isHome ? homeScore : awayScore;
  const oppScore = isHome ? awayScore : homeScore;

  let result = DRAW_BONUS;
  if (teamScore > oppScore) result = WIN_BONUS;
  else if (teamScore < oppScore) result = LOSS_PENALTY;

  const playerId = squad.player_id || "";
  const teamId = squad.team_id ? String(squad.team_id) : null;

  let goals = 0;
  let assists = 0;
  let saves = 0;
  let tackles = 0;
  let yellowCards = 0;
  let redCards = 0;
  let ownGoals = 0;
  let teamTackles = 0;

  for (const e of events) {
    const eventPlayerId = e.player_id ? String(e.player_id) : "";
    const assistPlayerId = e.assist_player_id ? String(e.assist_player_id) : "";
    const type = normalizeEventType(String(e.type || ""));
    const qty = Math.max(1, Number(e.quantity) || 1);
    const eventTeamId = e.team_id ? String(e.team_id) : "";
    const isForPlayer = eventPlayerId === playerId;

    if (type === "TACKLE") {
      if (teamId && eventTeamId === teamId) teamTackles += qty;
      if (isForPlayer) tackles += qty;
      continue;
    }

    const isAssistEvent =
      type === "ASSIST"
        ? isForPlayer
        : assistPlayerId === playerId && (type === "GOAL" || type === "PENALTY");

    if (!isForPlayer && !isAssistEvent) continue;

    if (isForPlayer) {
      if (type === "GOAL" || type === "PENALTY") goals += qty;
      else if (type === "OWN_GOAL") ownGoals += qty;
      else if (type === "YELLOW_CARD") yellowCards += qty;
      else if (type === "RED_CARD") redCards += qty;
      else if (type === "SAVE" && isGk) saves += qty;
    }
    if (isAssistEvent) assists += qty;
  }

  const goalsBonus = Math.min(GOAL_BONUS_CAP, goals * GOAL_BONUS_BY_POSITION[positionKey]);
  const assistsBonus = Math.min(
    ASSIST_BONUS_CAP,
    assists * ASSIST_BONUS_BY_POSITION[positionKey]
  );

  const savesBonus = isGk ? computeSavesBonus(saves) : 0;

  const concededPerGoal = GOALS_CONCEDED_BY_POSITION[positionKey];
  const concededPenalty = Math.min(GOALS_CONCEDED_PENALTY_CAP, oppScore * concededPerGoal);

  const avg = options?.averageTacklesPerMatch;
  const defensiveIndex = avg && avg > 0 ? Math.min(1, teamTackles / avg) : 0;
  const defensiveBonus =
    DEFENSIVE_INDEX_MAX_BY_POSITION[positionKey] * defensiveIndex;

  const yellowCardPenalty = YELLOW_CARD_PENALTY * yellowCards;
  const redPenalty =
    redCards > 0 ? (yellowCards > 0 ? SECOND_YELLOW_PENALTY : RED_DIRECT_PENALTY) : 0;
  const ownGoalPenalty = OWN_GOAL_PENALTY * ownGoals;

  const raw =
    BASE_RATING +
    result +
    goalsBonus +
    assistsBonus +
    savesBonus +
    defensiveBonus -
    concededPenalty +
    yellowCardPenalty +
    redPenalty +
    ownGoalPenalty;

  const rating = clampRating(raw);

  return {
    rating,
    breakdown: {
      base: BASE_RATING,
      result,
      goals,
      goals_bonus: round2(goalsBonus),
      assists,
      assists_bonus: round2(assistsBonus),
      g_a: goals + assists,
      goals_conceded: oppScore,
      goals_conceded_penalty: -round2(concededPenalty),
      saves,
      saves_bonus: round2(savesBonus),
      tackles,
      team_tackles: teamTackles,
      defensive_index: round3(defensiveIndex),
      defensive_index_bonus: round2(defensiveBonus),
      yellow_cards: yellowCards,
      yellow_card_penalty: round2(yellowCardPenalty),
      red_cards: redCards,
      red_penalty: round2(redPenalty),
      own_goals: ownGoals,
      own_goal_penalty: round2(ownGoalPenalty),
      rating,
    },
  };
}

export function computeNativeRating(
  squad: RatingSquadPlayer,
  match: RatingMatchInput,
  events: Array<Record<string, unknown>>,
  options?: RatingComputationOptions
): number {
  return computeNativeRatingDetailed(squad, match, events, options).rating;
}

// Calcula a nota/breakdown nativos (VKX V2) de TODOS os atletas do elenco de uma partida.
export function computeNativeMatchRatingsDetailed(
  match: RatingMatchInput,
  options?: RatingComputationOptions
): Map<string, ComputedMatchRating> {
  const ratings = new Map<string, ComputedMatchRating>();
  const events = match.events || [];
  for (const squad of match.squads || []) {
    if (!squad.player_id) continue;
    ratings.set(squad.player_id, computeNativeRatingDetailed(squad, match, events, options));
  }
  return ratings;
}

// Calcula a nota nativa de TODOS os atletas do elenco de uma partida.
export function computeNativeMatchRatings(
  match: RatingMatchInput,
  options?: RatingComputationOptions
): Map<string, number> {
  const ratings = new Map<string, number>();
  for (const [playerId, computed] of computeNativeMatchRatingsDetailed(match, options)) {
    ratings.set(playerId, computed.rating);
  }
  return ratings;
}

// ------------------------------------------------------------------
// Seleção determinística do 11 ideal (derivada apenas das notas).
// ------------------------------------------------------------------
function selectTeamOfWeek(
  ratings: RatingEntry[],
  resolvePosition: (playerId: string, aiPosition?: string) => PlayerPosition | null
): TeamOfWeek {
  const sorted = [...ratings].sort((a, b) => b.rating - a.rating);

  const byLine = (line: PlayerPosition[]) =>
    sorted.filter((p) => p.position && line.includes(p.position));

  const pickByLine = (
    line: PlayerPosition[],
    count: number,
    ensure?: PlayerPosition
  ): RatingEntry[] => {
    const pool = byLine(line);
    const picked: RatingEntry[] = [];
    if (ensure) {
      const idx = pool.findIndex((p) => p.position === ensure);
      if (idx >= 0) picked.push(pool.splice(idx, 1)[0]);
    }
    picked.push(...pool.sort((a, b) => b.rating - a.rating).slice(0, count - picked.length));
    return picked;
  };

  let lineup: RatingEntry[] = [];
  lineup.push(...pickByLine(POSITION_LINES.GK, LINE_SLOTS.GK, "GOLEIRO"));
  lineup.push(...pickByLine(POSITION_LINES.DEF, LINE_SLOTS.DEF));
  lineup.push(...pickByLine(POSITION_LINES.MID, LINE_SLOTS.MID));
  lineup.push(...pickByLine(POSITION_LINES.ATT, LINE_SLOTS.ATT, "CENTROAVANTE"));

  const lineupIds = new Set(lineup.map((p) => p.player_id));

  if (lineup.length < 11) {
    const missing = 11 - lineup.length;
    const rest = sorted.filter((p) => !lineupIds.has(p.player_id)).slice(0, missing);
    lineup.push(...rest);
    for (const p of rest) lineupIds.add(p.player_id);
  }

  const starPlayer = lineup.length > 0 ? [...lineup].sort((a, b) => b.rating - a.rating)[0] : null;

  const outside = sorted.filter((p) => !lineupIds.has(p.player_id));
  const bench: RatingEntry[] = [];
  const benchLines = ["GK", "DEF", "MID", "ATT"] as const;

  for (const lineKey of benchLines) {
    const linePositions = POSITION_LINES[lineKey];
    const candidate = outside.find(
      (p) =>
        p.position &&
        linePositions.includes(p.position) &&
        !bench.some((b) => b.player_id === p.player_id)
    );
    if (candidate) {
      bench.push(candidate);
    }
  }
  const benchIds = new Set(bench.map((b) => b.player_id));
  bench.push(...outside.filter((p) => !benchIds.has(p.player_id)).slice(0, 5 - bench.length));

  const toPlayer = (row: RatingEntry): TeamOfWeekEntry => ({
    player_id: row.player_id,
    player_name: row.player_name,
    team_name: row.team_name,
    position: row.position,
    photo_url: row.photo_url,
    rating: row.rating,
  });

  return {
    formation: "4-3-3",
    lineup: lineup.map(toPlayer),
    bench: bench.map(toPlayer),
    star_player: starPlayer ? toPlayer(starPlayer) : null,
    highlights: "",
  };
}

// ------------------------------------------------------------------
// Persistência dos logs de auditoria em rating_audit_logs
// ------------------------------------------------------------------
export interface RatingAuditLogPayload {
  match_ids: string[];
  players: Array<{
    player_id: string;
    player_name: string;
    rating: number;
    new_average_rating: number;
  }>;
  error?: string;
  mode?: "NATIVE_ENGINE";
  groq_mode?: "json" | "text" | "NATIVE_ENGINE";
  ratings_count?: number;
  matches_count?: number;
}

export interface RatingAuditLogInput {
  supabase: SupabaseClient;
  championshipId: string;
  seasonId: string;
  roundNumber: number;
  roundName: string;
  status: RatingAuditStatus;
  payload: RatingAuditLogPayload;
  createdBy?: string | null;
}

export async function writeRatingAuditLog(input: RatingAuditLogInput): Promise<void> {
  const { supabase, championshipId, seasonId, roundNumber, roundName, status, payload, createdBy } =
    input;

  try {
    const { error } = await supabase.from("rating_audit_logs").insert({
      championship_id: championshipId,
      season_id: seasonId,
      round_number: roundNumber,
      round_name: roundName,
      status,
      payload,
      created_by: createdBy || null,
    });

    if (error && !isMissingTableError(error)) {
      console.error("[rating-engine] Erro ao registrar log de auditoria:", error);
    }
  } catch (err) {
    console.error("[rating-engine] Falha ao gravar log de auditoria:", err);
  }
}

// ------------------------------------------------------------------
// Idempotência: partidas que já possuem notas NÃO são reprocessadas.
// ------------------------------------------------------------------
export async function listRatedMatchIds(
  supabase: SupabaseClient,
  matchIds: string[]
): Promise<Set<string>> {
  const rated = new Set<string>();
  if (matchIds.length === 0) return rated;

  const { data, error } = await supabase
    .from("match_player_stats")
    .select("match_id")
    .in("match_id", matchIds)
    .not("rating", "is", null);

  if (error && !isMissingTableError(error)) {
    console.error("[rating-engine] Erro ao listar partidas já avaliadas:", error);
  }

  for (const row of (data as Array<{ match_id: string }>) || []) {
    rated.add(row.match_id);
  }
  return rated;
}

export async function fetchExistingRatings(
  supabase: SupabaseClient,
  matchIds: string[]
): Promise<Map<string, Map<string, number>>> {
  const byMatch = new Map<string, Map<string, number>>();
  if (matchIds.length === 0) return byMatch;

  const { data, error } = await supabase
    .from("match_player_stats")
    .select("match_id, player_id, rating")
    .in("match_id", matchIds)
    .not("rating", "is", null);

  if (error && !isMissingTableError(error)) {
    console.error("[rating-engine] Erro ao carregar notas existentes:", error);
  }

  for (const row of (data as Array<{ match_id: string; player_id: string; rating: number }>) || []) {
    const matchMap = byMatch.get(row.match_id) || new Map<string, number>();
    matchMap.set(row.player_id, Number(row.rating));
    byMatch.set(row.match_id, matchMap);
  }
  return byMatch;
}

// ------------------------------------------------------------------
// Montagem das linhas finais (metadados confiáveis do banco) + posições
// ------------------------------------------------------------------
interface BuiltRatings {
  ratings: RatingEntry[];
  resolvePosition: (playerId: string, aiPosition?: string) => PlayerPosition | null;
}

async function buildRatingRows(
  supabase: SupabaseClient,
  seasonId: string,
  hydratedMatches: RatingMatchInput[],
  ratingsByMatch: Map<string, Map<string, number>>
): Promise<BuiltRatings> {
  const { data: players, error: playersError } = await supabase
    .from("players")
    .select("id, name, position, photo_url, teams(name)")
    .eq("season_id", seasonId);

  if (playersError && !isMissingTableError(playersError)) {
    console.error("[rating-engine] Erro ao buscar atletas para enriquecimento:", playersError);
  }

  const metaById = new Map<
    string,
    { name: string; position: PlayerPosition | null; photo_url: string | null; team_name: string }
  >();

  for (const p of (players as Array<Record<string, unknown>>) || []) {
    const teamName =
      ((p.teams as { name?: string } | null)?.name) ||
      (Array.isArray(p.teams) ? ((p.teams as Array<{ name?: string }>)[0]?.name) : undefined) ||
      "";
    metaById.set(String(p.id), {
      name: (p.name as string) || "Atleta",
      position: PLAYER_POSITIONS.includes(p.position as PlayerPosition)
        ? (p.position as PlayerPosition)
        : null,
      photo_url: (p.photo_url as string) || null,
      team_name: teamName,
    });
  }

  // Fallback: usar dados confiáveis do elenco hidratado do banco (redunda o
  // risco de atleta ficar sem metadados quando o SELECT acima não cobre).
  const positionFromSquads = new Map<string, PlayerPosition>();
  for (const m of hydratedMatches) {
    for (const s of m.squads || []) {
      if (s.player_id && !metaById.has(s.player_id)) {
        metaById.set(s.player_id, {
          name: s.name || "Atleta",
          position: normalizePositionInput(s.position),
          photo_url: s.photo_url || null,
          team_name: s.team_name || "",
        });
      }
      const position = normalizePositionInput(s.position);
      if (s.player_id && position) {
        positionFromSquads.set(s.player_id, position);
      }
    }
  }

  function resolvePosition(playerId: string, aiPosition?: string): PlayerPosition | null {
    const db = metaById.get(playerId)?.position;
    if (db) return db;
    const squad = positionFromSquads.get(playerId);
    if (squad) return squad;
    const ai = normalizePositionInput(aiPosition);
    if (ai) return ai;
    return null;
  }

  function buildRow(playerId: string, rating: number): RatingEntry | null {
    const meta = metaById.get(playerId);
    if (!meta) return null;
    return {
      player_id: playerId,
      player_name: meta.name,
      team_name: meta.team_name || "Sem equipe",
      position: resolvePosition(playerId),
      photo_url: meta.photo_url,
      rating: Math.min(MAX_RATING, Math.max(MIN_RATING, Math.round(rating * 10) / 10)),
    };
  }

  const ratings: RatingEntry[] = [];
  const usedIds = new Set<string>();

  // GARANTIA de cobertura: percorre TODOS os atletas dos elencos hidratados.
  // Usa a nota nativa computada quando existir; caso contrário aplica o motor
  // determinístico (6.5 base + resultado + eventos).
  for (const m of hydratedMatches) {
    const matchId = m.matchId ?? m.id;
    if (!matchId) continue;
    const matchRatings = ratingsByMatch.get(matchId) || new Map<string, number>();
    const matchEvents = m.events || [];

    for (const s of m.squads || []) {
      if (!s.player_id || usedIds.has(s.player_id)) continue;
      const playerId = s.player_id;
      const nativeRating = matchRatings.get(playerId);
      const rating =
        nativeRating !== undefined
          ? nativeRating
          : computeNativeRating(s, m, matchEvents);

      const row = buildRow(playerId, rating);
      if (row) {
        usedIds.add(playerId);
        ratings.push(row);
      }
    }
  }

  return { ratings, resolvePosition };
}

// ------------------------------------------------------------------
// Persistência do motor NATIVO para UMA partida hidratada:
// cálculo determinístico + upsert em match_player_stats (que dispara o
// trigger de sincronização de players.average_rating) + log de auditoria.
// ------------------------------------------------------------------
interface PersistMatchRatingsInput {
  supabase: SupabaseClient;
  championshipId: string;
  seasonId: string;
  roundNumber: number;
  roundName: string;
  hydratedMatch: RatingMatchInput;
  options?: RatingComputationOptions;
  createdBy?: string | null;
}

async function persistMatchRatings(input: PersistMatchRatingsInput): Promise<RatingEntry[]> {
  const {
    supabase,
    championshipId,
    seasonId,
    roundNumber,
    roundName,
    hydratedMatch,
    options,
    createdBy,
  } = input;
  const matchId = hydratedMatch.matchId ?? hydratedMatch.id ?? "";

  try {
    // 100% determinístico: calcula a nota nativa (VKX V2) de TODOS os atletas
    // do elenco, junto com o detalhamento de cada componente (breakdown).
    const detailed = computeNativeMatchRatingsDetailed(hydratedMatch, options);
    const nativeRatings = new Map<string, number>();
    for (const [playerId, computed] of detailed) {
      nativeRatings.set(playerId, computed.rating);
    }

    // Metadados confiáveis do banco + posições normalizadas.
    const { ratings } = await buildRatingRows(
      supabase,
      seasonId,
      [hydratedMatch],
      new Map([[matchId, nativeRatings]])
    );

    // team_id por atleta (para preencher a coluna de match_player_stats).
    const teamById = new Map<string, string>();
    for (const s of hydratedMatch.squads || []) {
      if (s.player_id && s.team_id) teamById.set(s.player_id, String(s.team_id));
    }

    const upsertRows = ratings.map((r) => {
      const computed = detailed.get(r.player_id);
      const breakdown = computed?.breakdown;
      return {
        match_id: matchId,
        player_id: r.player_id,
        team_id: teamById.get(r.player_id) ?? null,
        rating: r.rating,
        goals: breakdown?.goals ?? 0,
        assists: breakdown?.assists ?? 0,
        yellow_cards: breakdown?.yellow_cards ?? 0,
        red_cards: breakdown?.red_cards ?? 0,
        saves: breakdown?.saves ?? 0,
        tackles: breakdown?.tackles ?? 0,
        rating_breakdown: breakdown ?? null,
      };
    });

    // Persistência direta em match_player_stats. O upsert dispara o trigger
    // trg_sync_player_average_rating (INSERT/UPDATE OF rating), que mantém
    // players.average_rating consistente para cada atleta.
    if (upsertRows.length > 0 && matchId) {
      const { error: upsertError } = await supabase
        .from("match_player_stats")
        .upsert(upsertRows, { onConflict: "match_id,player_id" });

      if (upsertError && !isMissingTableError(upsertError)) {
        console.error("[rating-engine] Erro ao salvar notas em match_player_stats:", upsertError);
      }
    }

    const newAverages = await fetchNewAverageRatings(
      supabase,
      ratings.map((r) => r.player_id)
    );

    await writeRatingAuditLog({
      supabase,
      championshipId,
      seasonId,
      roundNumber,
      roundName,
      status: "SUCCESS",
      payload: {
        match_ids: matchId ? [matchId] : [],
        players: ratings.map((r) => ({
          player_id: r.player_id,
          player_name: r.player_name,
          rating: r.rating,
          new_average_rating: newAverages.get(r.player_id) ?? 0,
        })),
        mode: "NATIVE_ENGINE",
        groq_mode: "NATIVE_ENGINE",
        ratings_count: ratings.length,
        matches_count: 1,
      },
      createdBy,
    });

    return ratings;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Erro ao gerar notas da partida.";
    console.error(`[rating-engine] Erro na partida ${matchId}:`, err);

    await writeRatingAuditLog({
      supabase,
      championshipId,
      seasonId,
      roundNumber,
      roundName,
      status: "ERROR",
      payload: {
        match_ids: matchId ? [matchId] : [],
        players: [],
        error: errorMessage,
      },
      createdBy,
    }).catch(() => undefined);

    throw err;
  }
}

// ------------------------------------------------------------------
// Cálculo por partida individual (recalcula SEMPRE, é um pedido explícito)
// ------------------------------------------------------------------
export interface GenerateMatchRatingsInput {
  supabase: SupabaseClient;
  championshipId: string;
  seasonId: string;
  roundNumber: number;
  roundName: string;
  match: RatingMatchInput;
  createdBy?: string | null;
}

export interface GenerateMatchRatingsResult {
  ratings: RatingEntry[];
}

export async function generateMatchRatings(
  input: GenerateMatchRatingsInput
): Promise<GenerateMatchRatingsResult> {
  const normalizedMatches = normalizeRoundMatches([input.match]);

  if (normalizedMatches.length === 0) {
    throw new Error(
      "Partida não finalizada (status FINISHED/FINALIZADO) encontrada para avaliar."
    );
  }

  const [hydratedMatch] = await hydrateMatchRosters(
    input.supabase,
    input.seasonId,
    normalizedMatches
  );
  const matchId = hydratedMatch.matchId ?? hydratedMatch.id ?? "";

  // Média de desarmes do campeonato (para o índice defensivo coletivo).
  const options: RatingComputationOptions = {
    averageTacklesPerMatch: await fetchLeagueTackleAverage(input.supabase, input.seasonId),
  };

  const persisted = await persistMatchRatings({ ...input, hydratedMatch, options });

  // Reconstrói as linhas a partir do que foi persistido (carbura nas posições
  // e metadados finais) sem refazer o cálculo.
  const { ratings } = await buildRatingRows(
    input.supabase,
    input.seasonId,
    [hydratedMatch],
    new Map([[matchId, new Map(persisted.map((r) => [r.player_id, r.rating]))]])
  );

  return { ratings };
}

// ------------------------------------------------------------------
// Orquestração principal: gera as notas de uma rodada completa.
// O cálculo é 100% nativo e determinístico (sem IA); partidas já avaliadas
// em match_player_stats são congeladas (não reprocessadas a menos que force).
// ------------------------------------------------------------------
export interface GenerateRoundRatingsInput {
  supabase: SupabaseClient;
  championshipId: string;
  seasonId: string;
  roundNumber: number;
  roundName: string;
  matches: RatingMatchInput[];
  createdBy?: string | null;
  force?: boolean;
}

export interface GenerateRoundRatingsResult {
  ratings: RatingEntry[];
  teamOfTheWeek: TeamOfWeek;
}

export async function generateRoundRatings(
  input: GenerateRoundRatingsInput
): Promise<GenerateRoundRatingsResult> {
  const {
    supabase,
    championshipId,
    seasonId,
    roundNumber,
    roundName,
    matches,
    createdBy,
    force = false,
  } = input;

  // ----- Filtro estrito: só partidas FINALIZADAS, sem duplicatas -----
  const normalizedMatches = normalizeRoundMatches(matches);

  if (normalizedMatches.length === 0) {
    throw new Error(
      "Nenhuma partida finalizada (status FINISHED/FINALIZADO) encontrada nesta rodada para avaliar."
    );
  }

  // ----- Hidratação direto do banco: elencos completos + eventos oficiais -----
  const hydratedMatches = await hydrateMatchRosters(supabase, seasonId, normalizedMatches);

  // Média de desarmes do campeonato (índice defensivo coletivo da V2) —
  // computada uma única vez para toda a rodada.
  const options: RatingComputationOptions = {
    averageTacklesPerMatch: await fetchLeagueTackleAverage(supabase, seasonId),
  };

  const matchIds = hydratedMatches
    .map((m) => m.matchId ?? m.id)
    .filter((id): id is string => typeof id === "string" && id.length > 0);

  // ----- Congelamento: notas já gravadas em match_player_stats NÃO são
  // reprocessadas (a menos que force=true — re-geração explícita). -----
  const ratedMatchIds = force ? new Set<string>() : await listRatedMatchIds(supabase, matchIds);
  const pendingMatches = hydratedMatches.filter((m) => {
    const id = m.matchId ?? m.id;
    return !id || !ratedMatchIds.has(id);
  });
  const alreadyRatedMatches = hydratedMatches.filter((m) => {
    const id = m.matchId ?? m.id;
    return Boolean(id && ratedMatchIds.has(id));
  });

  const ratingsByMatch = new Map<string, Map<string, number>>();

  // 1) Partidas pendentes: cálculo nativo determinístico + persistência.
  for (const hydrated of pendingMatches) {
    const matchId = hydrated.matchId ?? hydrated.id ?? "";
    const entries = await persistMatchRatings({
      supabase,
      championshipId,
      seasonId,
      roundNumber,
      roundName,
      hydratedMatch: hydrated,
      options,
      createdBy,
    });
    ratingsByMatch.set(matchId, new Map(entries.map((r) => [r.player_id, r.rating])));
  }

  // 2) Partidas já avaliadas: lê do banco (zero recálculo).
  const existingById = await fetchExistingRatings(supabase, alreadyRatedMatches.map((m) => (m.matchId ?? m.id) as string));
  for (const [matchId, playerRatings] of existingById) {
    ratingsByMatch.set(matchId, playerRatings);
  }

  // ----- Reconstrói todas as linhas (metadados + posições do banco) -----
  const { ratings, resolvePosition } = await buildRatingRows(
    supabase,
    seasonId,
    hydratedMatches,
    ratingsByMatch
  );

  // ----- Seleção da Rodada (determinística a partir das notas) -----
  const teamOfTheWeek = selectTeamOfWeek(ratings, resolvePosition);

  // ----- Persistir a Seleção da Rodada em round_summaries -----
  if (teamOfTheWeek.lineup.length > 0) {
    const summaryPayload = {
      championship_id: championshipId,
      round_number: roundNumber,
      round_name: roundName,
      team_of_week: teamOfTheWeek as unknown as Record<string, unknown>,
    };

    try {
      const { data: existingSummary } = await supabase
        .from("round_summaries")
        .select("id")
        .eq("championship_id", championshipId)
        .eq("round_number", roundNumber)
        .maybeSingle();

      if (existingSummary) {
        const { error: updateError } = await supabase
          .from("round_summaries")
          .update(summaryPayload)
          .eq("id", existingSummary.id);

        if (updateError && !isMissingTableError(updateError)) {
          console.error("[rating-engine] Erro ao atualizar seleção da rodada:", updateError);
        }
      } else {
        const { error: insertError } = await supabase
          .from("round_summaries")
          .insert({ ...summaryPayload, content: "" });

        if (insertError && !isMissingTableError(insertError)) {
          console.error("[rating-engine] Erro ao salvar seleção da rodada:", insertError);
        }
      }
    } catch (saveError) {
      console.error("[rating-engine] Erro ao persistir seleção da rodada:", saveError);
    }
  }

  return { ratings, teamOfTheWeek };
}

// ------------------------------------------------------------------
// Índice defensivo coletivo: média de DESARMES do campeonato.
// Definida como o total de eventos TACKLE da temporada dividido por
// (número de partidas finalizadas × 2 lados de time). Usado na V2 para
// calcular o bônus defensivo de cada atleta comparando os desarmes do
// seu time em cada partida com a média geral.
// ------------------------------------------------------------------
export async function fetchLeagueTackleAverage(
  supabase: SupabaseClient,
  seasonId: string
): Promise<number> {
  if (!seasonId) return 0;

  try {
    const { data: rounds, error: roundsError } = await supabase
      .from("rounds")
      .select("id")
      .eq("season_id", seasonId);

    if (roundsError && !isMissingTableError(roundsError)) {
      console.error("[rating-engine] Erro ao carregar rodadas p/ média de desarmes:", roundsError);
    }

    const roundIds = (rounds || []).map((r) => r.id);

    let matchesQuery = supabase
      .from("matches")
      .select("id")
      .in("status", ["finished", "finalizado", "FINISHED", "FINALIZADO"]);

    if (roundIds.length > 0) {
      matchesQuery = matchesQuery.or(
        `season_id.eq.${seasonId},round_id.in.(${roundIds.join(",")})`
      );
    } else {
      matchesQuery = matchesQuery.eq("season_id", seasonId);
    }

    const { data: matches, error: matchesError } = await matchesQuery;
    if (matchesError || !matches || matches.length === 0) return 0;

    const matchIds = matches.map((m) => m.id);
    const { data: events, error: eventsError } = await supabase
      .from("match_events")
      .select("type, quantity")
      .in("match_id", matchIds)
      .eq("type", "TACKLE");

    if (eventsError && !isMissingTableError(eventsError)) {
      console.error("[rating-engine] Erro ao carregar desarmes do campeonato:", eventsError);
    }

    const totalTackles = (events || []).reduce(
      (sum, e) => sum + (Number(e.quantity) || 1),
      0
    );

    // Média por lado de time (2 times por partida).
    return (totalTackles || 0) / (matches.length * 2);
  } catch (err) {
    console.error("[rating-engine] Falha ao calcular média de desarmes:", err);
    return 0;
  }
}

// ------------------------------------------------------------------
// RECÁLCULO GERAL (VKX V2)
//
// recalculateMatchRatings(matchId?, championshipId?) reprocessa TODOS os
// eventos cadastrados das partidas finalizadas e regrava a nota de cada
// atleta com a fórmula V2. Aceita:
//   - matchId: recalcula somente uma partida específica;
//   - championshipId: recalcula todas as partidas finalizadas da temporada;
//   - roundNumber (opcional): filtra a recálculo para uma rodada específica.
// A função sempre re-gera as notas (force), sobrescrevendo as congeladas.
// ------------------------------------------------------------------
export interface RecalculateMatchRatingsInput {
  matchId?: string;
  championshipId: string;
  seasonId?: string;
  roundNumber?: number | null;
  force?: boolean;
  createdBy?: string | null;
}

export interface RecalculatedMatch {
  matchId: string;
  roundNumber: number;
  roundName: string;
  playersRated: number;
}

export interface RecalculateMatchRatingsResult {
  championshipId: string;
  seasonId: string;
  recalculated: RecalculatedMatch[];
  playersRated: number;
}

interface LoadedFinishedMatch {
  matchId: string;
  roundNumber: number;
  roundName: string;
  home_team_id: string | null;
  away_team_id: string | null;
  home_score: number | null;
  away_score: number | null;
  status: string | null;
}

async function loadSeasonFinishedMatches(
  supabase: SupabaseClient,
  seasonId: string,
  roundNumber?: number | null
): Promise<LoadedFinishedMatch[]> {
  let roundFilter: { id: string; round_number: number; name: string }[] | null = null;

  if (typeof roundNumber === "number" && roundNumber > 0) {
    const { data, error } = await supabase
      .from("rounds")
      .select("id, round_number, name")
      .eq("season_id", seasonId)
      .eq("round_number", roundNumber);

    if (error && !isMissingTableError(error)) {
      console.error("[rating-engine] Erro ao carregar rodada p/ recálculo:", error);
    }
    roundFilter = (data || []).map((r) => ({
      id: r.id,
      round_number: r.round_number,
      name: r.name || "",
    }));
  }

  if (roundNumber && (!roundFilter || roundFilter.length === 0)) return [];

  const { data: roundsForSeason, error: roundsError } = await supabase
    .from("rounds")
    .select("id, round_number, name")
    .eq("season_id", seasonId);

  if (roundsError && !isMissingTableError(roundsError)) {
    console.error("[rating-engine] Erro ao carregar rodadas p/ recálculo:", roundsError);
  }

  const roundMeta = new Map<string, { round_number: number; name: string }>();
  for (const r of (roundsForSeason || []) as Array<{
    id: string;
    round_number: number;
    name: string;
  }>) {
    roundMeta.set(r.id, { round_number: r.round_number, name: r.name || "" });
  }

  const allRoundIds = roundMeta.size > 0 ? Array.from(roundMeta.keys()) : [];
  let allowedRoundIds: string[] | null = null;
  if (roundFilter) {
    allowedRoundIds = roundFilter.map((r) => r.id);
  }

  let query = supabase
    .from("matches")
    .select("id, home_team_id, away_team_id, home_score, away_score, status, round_id")
    .in("status", ["finished", "finalizado", "FINISHED", "FINALIZADO"]);

  if (allowedRoundIds && allowedRoundIds.length > 0) {
    query = query.in("round_id", allowedRoundIds);
  } else if (allRoundIds.length > 0) {
    query = query.or(`season_id.eq.${seasonId},round_id.in.(${allRoundIds.join(",")})`);
  } else {
    query = query.eq("season_id", seasonId);
  }

  const { data, error } = await query;

  if (error && !isMissingTableError(error)) {
    console.error("[rating-engine] Erro ao carregar partidas p/ recálculo:", error);
  }

  const matches: LoadedFinishedMatch[] = [];
  for (const m of (data || []) as Array<{
    id: string;
    home_team_id: string | null;
    away_team_id: string | null;
    home_score: number | null;
    away_score: number | null;
    status: string | null;
    round_id: string | null;
  }>) {
    const meta = m.round_id ? roundMeta.get(m.round_id) : null;
    matches.push({
      matchId: String(m.id),
      roundNumber: meta?.round_number ?? 1,
      roundName:
        meta?.name || (meta?.round_number != null ? `${meta.round_number}ª Rodada` : "Rodada"),
      home_team_id: m.home_team_id ?? null,
      away_team_id: m.away_team_id ?? null,
      home_score: typeof m.home_score === "number" ? m.home_score : null,
      away_score: typeof m.away_score === "number" ? m.away_score : null,
      status: m.status ?? null,
    });
  }

  return matches;
}

export async function recalculateMatchRatings(
  supabase: SupabaseClient,
  input: RecalculateMatchRatingsInput
): Promise<RecalculateMatchRatingsResult> {
  const { matchId, championshipId, createdBy, force = true } = input;

  const seasonId =
    input.seasonId ||
    (await (async () => {
      const { data: firstSeason, error } = await supabase
        .from("seasons")
        .select("id")
        .eq("championship_id", championshipId)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (error && !isMissingTableError(error)) {
        console.error("[rating-engine] Erro ao resolver temporada p/ recálculo:", error);
      }
      return firstSeason?.id || null;
    })());

  if (!seasonId) {
    throw new Error("Nenhuma temporada encontrada para este campeonato.");
  }

  let loadedMatches: LoadedFinishedMatch[] = [];

  if (matchId) {
    const { data: match, error } = await supabase
      .from("matches")
      .select("id, home_team_id, away_team_id, home_score, away_score, status, round_id")
      .eq("id", matchId)
      .maybeSingle();

    if (error && !isMissingTableError(error)) {
      throw new Error(`Erro ao carregar a partida: ${error.message}`);
    }

    if (!match) {
      throw new Error("Partida não encontrada.");
    }
    if (!isFinishedMatchStatus(match.status)) {
      throw new Error("A partida informada precisa estar finalizada para ter notas recalculadas.");
    }

    let roundMeta: { round_number: number; name: string } | null = null;
    if (match.round_id) {
      const { data: round, error: roundError } = await supabase
        .from("rounds")
        .select("round_number, name")
        .eq("id", match.round_id)
        .maybeSingle();

      if (roundError && !isMissingTableError(roundError)) {
        console.error("[rating-engine] Erro ao carregar rodada da partida:", roundError);
      }
      roundMeta = round
        ? { round_number: round.round_number, name: round.name || "" }
        : null;
    }

    loadedMatches.push({
      matchId: String(match.id),
      roundNumber: roundMeta?.round_number ?? 1,
      roundName:
        roundMeta?.name ||
        (roundMeta?.round_number != null ? `${roundMeta.round_number}ª Rodada` : "Rodada"),
      home_team_id: match.home_team_id ?? null,
      away_team_id: match.away_team_id ?? null,
      home_score: typeof match.home_score === "number" ? match.home_score : null,
      away_score: typeof match.away_score === "number" ? match.away_score : null,
      status: typeof match.status === "string" ? match.status : null,
    });
  } else {
    loadedMatches = await loadSeasonFinishedMatches(supabase, seasonId, input.roundNumber);
  }

  if (loadedMatches.length === 0) {
    throw new Error("Nenhuma partida finalizada encontrada para recalcular notas.");
  }

  // Conegelamento opcional: com force=false, partidas já avaliadas são puladas.
  if (!force) {
    const ratedMatchIds = await listRatedMatchIds(
      supabase,
      loadedMatches.map((m) => m.matchId)
    );
    const pending = loadedMatches.filter((m) => !ratedMatchIds.has(m.matchId));

    if (pending.length === 0) {
      return {
        championshipId,
        seasonId,
        recalculated: [],
        playersRated: 0,
      };
    }
    loadedMatches = pending;
  }

  const rewardInputs: RatingMatchInput[] = loadedMatches.map((m) => ({
    id: m.matchId,
    matchId: m.matchId,
    home_team_id: m.home_team_id,
    away_team_id: m.away_team_id,
    home_score: m.home_score,
    away_score: m.away_score,
    status: m.status,
  }));

  // Hidratação direto do banco: elencos completos + eventos oficiais.
  const hydratedMatches = await hydrateMatchRosters(supabase, seasonId, rewardInputs);

  const options: RatingComputationOptions = {
    averageTacklesPerMatch: await fetchLeagueTackleAverage(supabase, seasonId),
  };

  const recalculated: RecalculatedMatch[] = [];
  let playersRated = 0;

  for (const hydrated of hydratedMatches) {
    const loaded = loadedMatches.find(
      (m) => m.matchId === (hydrated.matchId ?? hydrated.id)
    );
    const matchIdResolved = hydrated.matchId ?? hydrated.id ?? "";
    if (!matchIdResolved) continue;

    const entries = await persistMatchRatings({
      supabase,
      championshipId,
      seasonId,
      roundNumber: loaded?.roundNumber ?? 1,
      roundName: loaded?.roundName ?? "Rodada",
      hydratedMatch: hydrated,
      options,
      createdBy,
    });

    recalculated.push({
      matchId: matchIdResolved,
      roundNumber: loaded?.roundNumber ?? 1,
      roundName: loaded?.roundName ?? "Rodada",
      playersRated: entries.length,
    });
    playersRated += entries.length;
  }

  // Consistência final das médias de TODOS os atletas.
  try {
    await supabase.rpc("recalculate_all_average_ratings");
  } catch (rpcError) {
    console.error("[rating-engine] Erro ao recalcular médias via RPC:", rpcError);
  }

  return {
    championshipId,
    seasonId,
    recalculated,
    playersRated,
  };
}

async function fetchNewAverageRatings(
  supabase: SupabaseClient,
  playerIds: string[]
): Promise<Map<string, number>> {
  const result = new Map<string, number>();
  if (playerIds.length === 0) return result;

  const { data, error } = await supabase
    .from("players")
    .select("id, average_rating")
    .in("id", playerIds);

  if (error) return result;

  for (const p of (data as Array<{ id: string; average_rating: number | null }>) || []) {
    result.set(p.id, Number(p.average_rating) || 0);
  }

  return result;
}