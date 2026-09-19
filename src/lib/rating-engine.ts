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
// MOTOR 100% DETERMINÍSTICO (SISTEMA NATIVO)
//
// Cálculo de nota por atleta sem qualquer chamada externa (IA/Groq).
// Regras de negócio fixas:
//   - Nota base: 6.0
//   - Resultado: Vitória +0.5 | Empate +0.0 | Derrota -0.3
//   - Gol: +0.8 (Meia/Atacante) / +1.2 (Defensor/Goleiro)
//   - Assistência: +0.5
//   - Cartão amarelo: -0.5 (por cartão)
//   - Cartão vermelho: nota final travada em 2.0
//   - Gol contra: -1.2
//   - Defesa de pênalti (Goleiro): +1.5
//   - Clamp final: 1.0 a 10.0, uma casa decimal.
// ------------------------------------------------------------------
const BASE_RATING = 6.0;
const WIN_BONUS = 0.5;
const DRAW_BONUS = 0.0;
const LOSS_PENALTY = -0.3;
const GOAL_BONUS_OFFENSIVE = 0.8;
const GOAL_BONUS_DEFENSIVE = 1.2;
const ASSIST_BONUS = 0.5;
const YELLOW_CARD_PENALTY = -0.5;
const RED_CARD_FINAL_RATING = 2.0;
const OWN_GOAL_PENALTY = -1.2;
const PENALTY_SAVE_BONUS = 1.5;
const MIN_RATING = 1.0;
const MAX_RATING = 10.0;

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

// Posição defensiva: Goleiro + defensores recebem o bônus maior de gol.
function isDefensivePosition(position: PlayerPosition | null): boolean {
  return (
    position === "GOLEIRO" ||
    position === "ZAGUEIRO" ||
    position === "LATERAL_DIREITO" ||
    position === "LATERAL_ESQUERDO"
  );
}

function clampRating(value: number): number {
  return Math.min(MAX_RATING, Math.max(MIN_RATING, Math.round(value * 10) / 10));
}

// Nota determinística nativa de UM atleta da partida. Não depende de rede,
// IA ou serviços externos: é pura função dos dados (resultado + eventos).
export function computeNativeRating(
  squad: RatingSquadPlayer,
  match: RatingMatchInput,
  events: Array<Record<string, unknown>>
): number {
  let rating = BASE_RATING;

  const homeScore = Number(match.home_score) || 0;
  const awayScore = Number(match.away_score) || 0;
  const isHome = Boolean(squad.team_id && squad.team_id === match.home_team_id);
  const teamScore = isHome ? homeScore : awayScore;
  const oppScore = isHome ? awayScore : homeScore;

  if (teamScore > oppScore) rating += WIN_BONUS;
  else if (teamScore === oppScore) rating += DRAW_BONUS;
  else rating += LOSS_PENALTY;

  const position = normalizePositionInput(squad.position);
  const isGk = position === "GOLEIRO";
  const goalBonus = isDefensivePosition(position) ? GOAL_BONUS_DEFENSIVE : GOAL_BONUS_OFFENSIVE;

  const playerId = squad.player_id || "";
  let redCard = false;

  for (const e of events) {
    const eventPlayerId = e.player_id ? String(e.player_id) : "";
    const assistPlayerId = e.assist_player_id ? String(e.assist_player_id) : "";
    const type = normalizeEventType(String(e.type || ""));
    const qty = Math.max(1, Number(e.quantity) || 1);
    const isForPlayer = eventPlayerId === playerId;
    const isAssister = type === "ASSIST"
      ? isForPlayer
      : assistPlayerId === playerId && (type === "GOAL" || type === "PENALTY");

    if (!isForPlayer && !isAssister) continue;

    if (type === "RED_CARD" && isForPlayer) {
      redCard = true;
      continue;
    }
    if (type === "YELLOW_CARD" && isForPlayer) {
      rating += YELLOW_CARD_PENALTY * qty;
    }
    if (type === "GOAL" && isForPlayer) {
      rating += goalBonus * qty;
    }
    if (type === "PENALTY" && isForPlayer) {
      rating += goalBonus * qty;
    }
    if (type === "OWN_GOAL" && isForPlayer) {
      rating += OWN_GOAL_PENALTY * qty;
    }
    if (isAssister) {
      rating += ASSIST_BONUS;
    }
    if (type === "SAVE" && isForPlayer && isGk) {
      rating += PENALTY_SAVE_BONUS * qty;
    }
  }

  if (redCard) return clampRating(RED_CARD_FINAL_RATING);
  return clampRating(rating);
}

// Calcula a nota nativa de TODOS os atletas do elenco de uma partida.
export function computeNativeMatchRatings(match: RatingMatchInput): Map<string, number> {
  const ratings = new Map<string, number>();
  const events = match.events || [];
  for (const squad of match.squads || []) {
    if (!squad.player_id) continue;
    ratings.set(squad.player_id, computeNativeRating(squad, match, events));
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
      rating: Math.min(10, Math.max(1, Math.round(rating * 10) / 10)),
    };
  }

  const ratings: RatingEntry[] = [];
  const usedIds = new Set<string>();

  // GARANTIA de cobertura: percorre TODOS os atletas dos elencos hidratados.
  // Usa a nota nativa computada quando existir; caso contrário aplica o motor
  // determinístico (6.0 base + resultado + eventos).
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
    createdBy,
  } = input;
  const matchId = hydratedMatch.matchId ?? hydratedMatch.id ?? "";

  try {
    // 100% determinístico: calcula a nota nativa de TODOS os atletas do elenco.
    const nativeRatings = computeNativeMatchRatings(hydratedMatch);

    // Metadados confiáveis do banco + posições normalizadas.
    const { ratings } = await buildRatingRows(
      supabase,
      seasonId,
      [hydratedMatch],
      new Map([[matchId, nativeRatings]])
    );

    const upsertRows = ratings.map((r) => ({
      match_id: matchId,
      player_id: r.player_id,
      rating: r.rating,
    }));

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

  const persisted = await persistMatchRatings({ ...input, hydratedMatch });

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