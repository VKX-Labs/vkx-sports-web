import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { groqChatCompletion } from "@/lib/groq";
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
// Schema da resposta da IA — validado em runtime.
// ------------------------------------------------------------------
const aiRatingSchema = z.object({
  player_id: z.string().min(1),
  rating: z.number().min(0).max(10),
  justification: z.string().optional(),
});

const teamOfTheWeekSchema = z.object({
  formation: z.string().optional(),
  lineup: z
    .array(
      z.object({ player_id: z.string().min(1), position: z.string().optional() })
    )
    .optional()
    .default([]),
  bench: z
    .array(
      z.object({ player_id: z.string().min(1), position: z.string().optional() })
    )
    .optional()
    .default([]),
  star_player: z.object({ player_id: z.string().min(1) }).optional(),
  highlights: z.string().optional().default(""),
});

const aiResponseSchema = z.object({
  ratings: z.array(aiRatingSchema),
  team_of_the_week: teamOfTheWeekSchema.optional().default({
    formation: undefined,
    lineup: [],
    bench: [],
    star_player: undefined,
    highlights: "",
  }),
});

// Linhas do campo.
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
    .replace(/[^A-Z]/g, "");
  return POSITION_ALIASES[key] ?? null;
}

// ------------------------------------------------------------------
// Montagem do input estruturado + prompt para a IA
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
export function buildRoundInput(matches: RatingMatchInput[]): string {
  return matches
    .map((m, idx) => {
      const homeTeam = m.home_team?.name || `Mandante ${idx + 1}`;
      const awayTeam = m.away_team?.name || `Visitante ${idx + 1}`;
      const events = (m.events || [])
        .map((e) => {
          const qty = Number(e.quantity) || 1;
          const qtyLabel = qty > 1 ? ` (x${qty})` : "";
          const playerName = e.player_name || (e.player as { name?: string } | null)?.name || "Jogador";
          const teamName = e.team_name || (e.team as { name?: string } | null)?.name || homeTeam;
          return `- [${e.type}] ${playerName} (${teamName})${qtyLabel}${e.minute ? ` aos ${e.minute}min` : ""}`;
        })
        .join("\n");
      const squads = (m.squads || [])
        .map(
          (s) =>
            `- ${s.name || s.player_id} | ${s.position || "SEM_POSICAO"} | ${s.team_name || homeTeam}`
        )
        .join("\n");

      return `
📌 Jogo ${idx + 1}: ${homeTeam} ${m.home_score ?? 0} x ${m.away_score ?? 0} ${awayTeam}
ELENCOS (TODOS OS JOGADORES DOS DOIS TIMES):
${squads || "- (time sem jogadores cadastrados)"}
EVENTOS:
${events || "- (sem eventos)"}
`;
    })
    .join("\n---\n");
}

function buildPrompt(
  championshipName: string | undefined,
  roundName: string,
  roundInput: string
): string {
  return `
Você é um analista técnico de futebol especialista em avaliação de desempenho.
Campeonato: "${championshipName || "desconhecido"}".
Você recebe os dados OFICIAIS de uma rodada (placares, eventos e os ELENCOS
COMPLETOS dos dois times de cada partida).

DADOS OFICIAIS DA RODADA (${roundName}):
${roundInput}

TAREFAS:
1. ATRIBUIR A NOTA DE PARTIDA (entre 1.0 e 10.0, UMA casa decimal) para CADA
   atleta listado nos ELENCOS dos dois times de CADA partida (todos os atletas
   da lista "ELENCOS..."), seguindo RIGOROSAMENTE o motor de cálculo abaixo
   (estilo Sofascore), na ordem em que as etapas aparecem.

   MOTOR DE CÁLCULO:

   A) NOTA BASE: todo atleta do elenco começa com 6.0.

   B) AJUSTE PELO RESULTADO DO JOGO da equipe do atleta:
      - Vitória: +0.5
      - Empate: 0.0
      - Derrota: -0.3

   C) AJUSTE POR POSIÇÃO (use o campo posição de cada atleta do elenco):

      GOLEIRO:
        - 1 defesa registrada (evento SAVE): +0.3
        - 1 gol sofrido: -0.4
        - Clean sheet (vitória OU empate sem sofrer gols): +1.0

      DEFENSORES (ZAGUEIRO, LATERAL_DIREITO, LATERAL_ESQUERDO, VOLANTE):
        - 1 desarme (evento TACKLE): +0.2
        - 1 gol marcado: +1.0
        - 1 assistência (evento ASSIST): +0.7
        - Clean sheet (equipe não sofreu gols no jogo): +0.5

      MEIAS E ATACANTES (MEIA_DE_LIGACAO, MEIA_ATACANTE, PONTA_DIREITA,
      PONTA_ESQUERDA, SEGUNDO_ATACANTE, CENTROAVANTE):
        - 1 gol marcado: +1.0
        - 1 assistência (evento ASSIST): +0.6
        - 1 desarme (evento TACKLE): +0.1

      JOGADORES SEM POSIÇÃO DEFINIDA (posição NULL ou não mapeada acima):
        - Usar apenas: 6.0 (base) + resultado do jogo + gol (+1.0) +
          assistência (+0.6) + desarmes (+0.1) - cartões (etapa D).

   D) REGRAS DISCIPLINARES (aplicar em TODOS os casos):
      - 1 cartão amarelo (evento YELLOW_CARD): -0.5 por cartão.
      - Cartão vermelho (evento RED_CARD, direto ou por 2º amarelo):
        define a NOTA FINAL da partida em 2.0 (equivale a -3.5 sobre a nota
        acumulada). NUNCA deixe acima de 2.0 nesse caso.

   E) LIMITES FINAIS:
      - Arredonde a nota final para UMA casa decimal.
      - Garanta o intervalo mínimo 1.0 e máximo 10.0 (clamp final).

   IMPORTANTE:
   - Vocẽ DEVE atribuir uma nota para TODOS os atletas dos elencos dos dois
     times em CADA partida, inclusive os que não possuem eventos — para esses,
     a nota equivale a 6.0 + resultado do jogo + disciplina (se houver).
   - Respeite a quantidade dos eventos quando indicada, ex.: "(x3)" = 3 ocorrências.
   - NUNCA inventar eventos, gols, defesas, desarmes, cartões ou atletas que
     não constem nos dados oficiais.
   - Não conte a mesma ocorrência mais de uma vez.

2. SELECIONAR o "11 Ideal da Rodada" (Seleção da Rodada):
   - Formação tática: 4-3-3, 4-2-3-1 ou 4-4-2 (escolha a mais equilibrada com os disponíveis);
   - 1 GOLEIRO;
   - 4 defensores: ZAGUEIRO + LATERAL_DIREITO + LATERAL_ESQUERDO + 1 ZAGUEIRO ou LATERAL;
   - 3 a 4 meio-campistas: VOLANTE, MEIA_DE_LIGACAO, MEIA_ATACANTE (quantidade varia conforme formação);
   - 2 a 3 atacantes: PONTA_DIREITA, PONTA_ESQUERDA, SEGUNDO_ATACANTE, CENTROAVANTE;
   - Priorizar as maiores notas, garantindo pelo menos uma posição por linha do campo;
   - IMPORTANTE: se a rodada tiver MENOS de 11 atletas com ações registradas (ex: campeonato society/amador), monte uma ESCALAÇÃO PARCIAL com TODOS os atletas disponíveis, distribuídos por suas linhas — nunca inventar atletas ou posições;
   - O melhor jogador da rodada vira o "Craque da Rodada";
   - Montar banco de reservas (até 5) com os próximos melhores.

3. RESPONDER SOMENTE EM JSON válido, seguindo EXATAMENTE este schema (sem texto fora do JSON):
{
  "ratings": [
    { "player_id": "string", "rating": 8.7, "justification": "string curta" }
  ],
  "team_of_the_week": {
    "formation": "4-3-3",
    "lineup": [ { "player_id": "string", "position": "PONTA_DIREITA" } ],
    "bench": [ { "player_id": "string", "position": "MEIA_ATACANTE" } ],
    "star_player": { "player_id": "string" },
    "highlights": "narrativa curta destacando a atuação do Craque da Rodada"
  }
}
`;
}

// ------------------------------------------------------------------
// Seleção determinística do 11 ideal
// ------------------------------------------------------------------
function selectTeamOfWeek(
  ratings: RatingEntry[],
  ai: z.infer<typeof aiResponseSchema>["team_of_the_week"],
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
    formation: ai.formation && ai.formation.length <= 10 ? ai.formation : "4-3-3",
    lineup: lineup.map(toPlayer),
    bench: bench.map(toPlayer),
    star_player: starPlayer ? toPlayer(starPlayer) : null,
    highlights: ai.highlights || "",
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
  groq_mode?: "json" | "text";
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
// Nota determinística de segurança: garante que NENHUM atleta do elenco fique
// sem nota (nunca 0.0), mesmo que a IA omita alguém da resposta.
// ------------------------------------------------------------------
function computeDeterministicRating(
  squad: RatingSquadPlayer,
  match: RatingMatchInput,
  events: Array<Record<string, unknown>>
): number {
  let rating = 6.0;

  const homeScore = Number(match.home_score) || 0;
  const awayScore = Number(match.away_score) || 0;
  const isHome = squad.team_id === match.home_team_id;
  const teamScore = isHome ? homeScore : awayScore;
  const oppScore = isHome ? awayScore : homeScore;
  const cleanSheet = oppScore === 0;

  if (teamScore > oppScore) rating += 0.5;
  else if (teamScore < oppScore) rating -= 0.3;

  const position = normalizePositionInput(squad.position);
  const isGk = position === "GOLEIRO";
  const isDef =
    position === "ZAGUEIRO" ||
    position === "LATERAL_DIREITO" ||
    position === "LATERAL_ESQUERDO" ||
    position === "VOLANTE";
  const isMidAtt =
    position === "MEIA_DE_LIGACAO" ||
    position === "MEIA_ATACANTE" ||
    position === "PONTA_DIREITA" ||
    position === "PONTA_ESQUERDA" ||
    position === "SEGUNDO_ATACANTE" ||
    position === "CENTROAVANTE";

  const playerId = squad.player_id || "";
  let redCard = false;

  for (const e of events) {
    const eventPlayerId = e.player_id ? String(e.player_id) : "";
    const assistPlayerId = e.assist_player_id ? String(e.assist_player_id) : "";
    const type = String(e.type || "");
    const qty = Number(e.quantity) || 1;

    const isScorer = eventPlayerId === playerId;
    const isAssister = assistPlayerId === playerId || type === "ASSIST" && eventPlayerId === playerId;

    if (type === "YELLOW_CARD" && eventPlayerId === playerId) {
      rating -= 0.5 * qty;
    }
    if (type === "RED_CARD" && eventPlayerId === playerId) {
      redCard = true;
    }

    if (isScorer && (type === "GOAL" || type === "PENALTY")) {
      rating += isDef ? 1.0 : 1.0; // gol vale +1.0 para qualquer posição
    }
    if (isAssister && (type === "ASSIST" || type === "GOAL" || type === "PENALTY")) {
      rating += isDef ? 0.7 : 0.6;
    }
    if (type === "TACKLE" && eventPlayerId === playerId) {
      rating += isDef ? 0.2 : isGk ? 0 : 0.1;
    }
    if (type === "SAVE" && eventPlayerId === playerId && isGk) {
      rating += 0.3 * qty;
    }
  }

  if (isGk) {
    rating -= 0.4 * (teamScore === oppScore ? 0 : oppScore);
    if (cleanSheet && teamScore >= oppScore) rating += 1.0;
  }
  if (isDef && cleanSheet) rating += 0.5;

  if (redCard) rating = 2.0;

  return Math.min(10, Math.max(1, Math.round(rating * 10) / 10));
}

// ------------------------------------------------------------------
// Orquestração principal: gera as notas de uma rodada completa
// ------------------------------------------------------------------
export interface GenerateRoundRatingsInput {
  supabase: SupabaseClient;
  apiKey: string;
  championshipId: string;
  championshipName?: string;
  seasonId: string;
  roundNumber: number;
  roundName: string;
  matches: RatingMatchInput[];
  createdBy?: string | null;
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
    apiKey,
    championshipId,
    championshipName,
    seasonId,
    roundNumber,
    roundName,
    matches,
    createdBy,
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

  const roundInput = buildRoundInput(hydratedMatches);
  const prompt = buildPrompt(championshipName, roundName, roundInput);

  // ----- Chamada à Groq com retry sem response_format (evita 400 json_validate_failed) -----
  const messages = [
    {
      role: "system" as const,
      content:
        "Você é um analista técnico de futebol especialista em avaliação de desempenho e análises táticas. Siga rigorosamente o motor de cálculo de notas informado, sem opiniões subjetivas. Responda SOMENTE com JSON válido, sem texto fora do JSON.",
    },
    { role: "user" as const, content: prompt },
  ];

  let content = "";
  let groqModeUsed: "json" | "text" = "json";

  try {
    const response = await groqChatCompletion({
      apiKey,
      messages,
      temperature: 0.1,
      response_format: { type: "json_object" },
    });
    content = response.choices[0]?.message?.content || "";
  } catch (firstError) {
    console.warn(
      "[rating-engine] JSON mode falhou (400 json_validate_failed?) — tentando sem response_format.",
      firstError
    );
    groqModeUsed = "text";

    const response = await groqChatCompletion({
      apiKey,
      messages,
      temperature: 0.1,
    });
    content = response.choices[0]?.message?.content || "";
  }

  let aiParsed: z.infer<typeof aiResponseSchema>;
  try {
    const jsonText = content.slice(content.indexOf("{"), content.lastIndexOf("}") + 1);
    aiParsed = aiResponseSchema.parse(JSON.parse(jsonText));
  } catch (err) {
    console.error("JSON inválido retornado pela IA:", err);
    throw new Error("A IA retornou um JSON inválido. Tente novamente.");
  }

  if (!Array.isArray(aiParsed.ratings) || aiParsed.ratings.length === 0) {
    console.error("IA retornou lista de notas vazia:", content);
    throw new Error("A IA não retornou nenhuma nota de atleta para esta rodada.");
  }

  // ----- Enriquecimento com metadados confiáveis do banco -----
  const matchByPlayer = new Map<string, string>();
  const playerEventsByMatch = new Map<string, Array<Record<string, unknown>>>();
  for (const m of hydratedMatches) {
    const matchId = m.matchId ?? m.id;
    if (!matchId) continue;
    playerEventsByMatch.set(matchId, m.events || []);
    for (const s of m.squads || []) {
      if (s.player_id) {
        matchByPlayer.set(s.player_id, matchId);
      }
    }
  }

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
  const aiRatingsByPlayer = new Map<string, number>();
  for (const r of aiParsed.ratings) {
    aiRatingsByPlayer.set(r.player_id, r.rating);
  }

  // GARANTIA de cobertura: percorre TODOS os atletas dos elencos hidratados.
  // Usa a nota da IA quando existir; caso contrário aplica a nota determinística
  // (6.0 base + resultado + eventos), para que NENHUM atleta fique sem nota (0.0).
  for (const m of hydratedMatches) {
    const matchId = m.matchId ?? m.id;
    if (!matchId) continue;
    const matchEvents = playerEventsByMatch.get(matchId) || [];

    for (const s of m.squads || []) {
      if (!s.player_id || usedIds.has(s.player_id)) continue;
      const playerId = s.player_id;
      const aiRating = aiRatingsByPlayer.get(playerId);
      const rating =
        aiRating !== undefined
          ? aiRating
          : computeDeterministicRating(s, m, matchEvents);

      const row = buildRow(playerId, rating);
      if (row) {
        usedIds.add(playerId);
        ratings.push(row);
      }
    }
  }

  const teamOfTheWeek = selectTeamOfWeek(ratings, aiParsed.team_of_the_week, resolvePosition);

  // ----- Persistir notas em match_player_stats (trigger recalcula average_rating) -----
  const upsertRows = ratings
    .filter((r) => matchByPlayer.has(r.player_id))
    .map((r) => ({
      match_id: matchByPlayer.get(r.player_id)!,
      player_id: r.player_id,
      rating: r.rating,
    }));

  if (upsertRows.length > 0) {
    const { error: upsertError } = await supabase
      .from("match_player_stats")
      .upsert(upsertRows, { onConflict: "match_id,player_id" });

    if (upsertError && !isMissingTableError(upsertError)) {
      console.error("[rating-engine] Erro ao salvar notas em match_player_stats:", upsertError);
    }
  }

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

  // ----- Registrar log de auditoria com as novas médias -----
  const newAverages = await fetchNewAverageRatings(
    supabase,
    ratings.map((r) => r.player_id)
  );

  // match_ids DISTINTOS (Set) — antes contávamos atletas como "partidas".
  const distinctMatchIds = Array.from(new Set(matchByPlayer.values()));

  await writeRatingAuditLog({
    supabase,
    championshipId,
    seasonId,
    roundNumber,
    roundName,
    status: "SUCCESS",
    payload: {
      match_ids: distinctMatchIds,
      players: ratings.map((r) => ({
        player_id: r.player_id,
        player_name: r.player_name,
        rating: r.rating,
        new_average_rating: newAverages.get(r.player_id) ?? 0,
      })),
      groq_mode: groqModeUsed,
      ratings_count: ratings.length,
      matches_count: distinctMatchIds.length,
    },
    createdBy,
  });

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