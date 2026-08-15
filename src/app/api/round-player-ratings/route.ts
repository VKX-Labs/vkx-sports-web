import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { z } from "zod";
import { createServerClient } from "@supabase/ssr";
import { PLAYER_POSITIONS } from "@/types/player";
import type { PlayerPosition } from "@/types/player";

function isMissingTableError(err: any): boolean {
  const message = `${err?.message || ""} ${err?.error_description || ""}`.toLowerCase();
  return (
    message.includes("could not find the table") ||
    message.includes("does not exist") ||
    message.includes("relation") ||
    message.includes("not found")
  );
}

// ------------------------------------------------------------------
// Contrato de entrada/saída (docs/03 §2.2)
// ------------------------------------------------------------------
interface RoundPlayerRatingsRequest {
  championshipId: string;
  championshipName?: string;
  seasonId: string;
  roundNumber: number;
  roundName: string;
  matches: Array<{
    matchId: string;
    home_team?: { name?: string; badge_url?: string };
    away_team?: { name?: string; badge_url?: string };
    home_score?: number;
    away_score?: number;
    events?: Array<Record<string, any>>;
    squads?: Array<{ player_id: string; name?: string; position?: string; photo_url?: string; team_name?: string }>;
  }>;
}

interface RatingRow {
  player_id: string;
  player_name: string;
  team_name: string;
  position: PlayerPosition | null;
  photo_url: string | null;
  rating: number;
}

interface TeamOfWeekPlayer {
  player_id: string;
  player_name: string;
  team_name: string;
  position: PlayerPosition | null;
  photo_url: string | null;
  rating: number;
}

interface TeamOfWeek {
  formation: string;
  lineup: TeamOfWeekPlayer[];
  bench: TeamOfWeekPlayer[];
  star_player: TeamOfWeekPlayer | null;
  highlights: string;
}

// Schema da resposta da IA (docs/03 §2.3) — validado em runtime.
const aiRatingSchema = z.object({
  player_id: z.string().min(1),
  rating: z.number().min(0).max(10),
  justification: z.string().optional(),
});

const aiResponseSchema = z.object({
  ratings: z.array(aiRatingSchema),
  team_of_the_week: z.object({
    formation: z.string().optional(),
    lineup: z.array(
      z.object({ player_id: z.string().min(1), position: z.string().optional() })
    ),
    bench: z.array(
      z.object({ player_id: z.string().min(1), position: z.string().optional() })
    ),
    star_player: z.object({ player_id: z.string().min(1) }),
    highlights: z.string().default(""),
  }),
});

// Linhas do campo (docs/03 §3)
const POSITION_LINES: Record<string, PlayerPosition[]> = {
  GK: ["GOLEIRO"],
  DEF: ["ZAGUEIRO", "LATERAL_DIREITO", "LATERAL_ESQUERDO"],
  MID: ["VOLANTE", "MEIA_ATACANTE"],
  ATT: ["PONTA_DIREITA", "PONTA_ESQUERDA", "CENTROAVANTE"],
};

const LINE_SLOTS: Record<string, number> = { GK: 1, DEF: 4, MID: 3, ATT: 3 };

// Sinônimos comuns de posição (cadastros genéricos, nomes curtos, termos
// do jogo) normalizados para as posições oficiais do app.
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
  MEI: "MEIA_ATACANTE",
  MEIA: "MEIA_ATACANTE",
  MEIO: "MEIA_ATACANTE",
  MEIA_ATACANTE: "MEIA_ATACANTE",
  MID: "MEIA_ATACANTE",
  CM: "MEIA_ATACANTE",
  PONTA_DIREITA: "PONTA_DIREITA",
  PD: "PONTA_DIREITA",
  PONTA_ESQUERDA: "PONTA_ESQUERDA",
  PE: "PONTA_ESQUERDA",
  ATT: "CENTROAVANTE",
  ATA: "CENTROAVANTE",
  ATACANTE: "CENTROAVANTE",
  CA: "CENTROAVANTE",
  ST: "CENTROAVANTE",
  CENTROAVANTE: "CENTROAVANTE",
};

function normalizePositionInput(value?: string | null): PlayerPosition | null {
  if (!value) return null;
  const key = value
    .toUpperCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z]/g, "");
  return POSITION_ALIASES[key] ?? null;
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "A chave GROQ_API_KEY não está configurada no arquivo .env.local." },
        { status: 500 }
      );
    }

    const body = (await req.json()) as RoundPlayerRatingsRequest;
    const { championshipId, championshipName, seasonId, roundNumber, roundName, matches } = body;

    if (!championshipId || !seasonId || !roundNumber || !roundName) {
      return NextResponse.json(
        { error: "championshipId, seasonId, roundNumber e roundName são obrigatórios." },
        { status: 400 }
      );
    }

    if (!matches || !Array.isArray(matches) || matches.length === 0) {
      return NextResponse.json(
        { error: "Nenhuma partida encontrada nesta rodada para avaliar." },
        { status: 400 }
      );
    }

    // ------------------------------------------------------------------
    // 1. Montar input estruturado da rodada para a IA
    // ------------------------------------------------------------------
    const roundInput = matches
      .map((m, idx) => {
        const homeTeam = m.home_team?.name || `Mandante ${idx + 1}`;
        const awayTeam = m.away_team?.name || `Visitante ${idx + 1}`;
        const events = (m.events || [])
          .map(
            (e: any) =>
              `- [${e.type}] ${e.player_name || e.player?.name || "Jogador"} (${e.team_name || e.team?.name || homeTeam})${e.minute ? ` aos ${e.minute}min` : ""}`
          )
          .join("\n");
        const squads = (m.squads || [])
          .map(
            (s) =>
              `- ${s.name || s.player_id} | ${s.position || "SEM_POSICAO"} | ${s.team_name || homeTeam}`
          )
          .join("\n");

        return `
📌 Jogo ${idx + 1}: ${homeTeam} ${m.home_score ?? 0} x ${m.away_score ?? 0} ${awayTeam}
ESCALAÇÕES:
${squads || "- (sem escalações informadas)"}
EVENTOS:
${events || "- (sem eventos)"}
`;
      })
      .join("\n---\n");

    const prompt = `
Você é um analista técnico de futebol especialista em avaliação de desempenho.
Campeonato: "${championshipName || "desconhecido"}".
Você recebe os dados OFICIAIS de uma rodada (placares, eventos e escalações com posições).

DADOS OFICIAIS DA RODADA (${roundName}):
${roundInput}

TAREFAS:
1. ATRIBUIR nota de 0.0 a 10.0 (UMA casa decimal) para CADA atleta listado nas escalações, baseado em:
   - Gols, assistências, defesas e desarmes (eventos oficiais, incl. [TACKLE]);
   - Importância dos eventos (gol que decide, defesa em momento crítico, desarme decisivo);
   - Impacto no resultado;
   - Critérios por posição: GOLEIRO/DEFENSORES valorizam defesas e desarmes; VOLANTES/MEIAS valorizam desarmes e assistências; ATACANTES valorizam gols;
   - Manter a meta limpa (0 gols sofridos) valoriza goleiros e defensores;
   - Nota-base razoável (6.0) para quem apenas cumpriu o esperado;
   - NUNCA inventar eventos, gols ou atletas que não constem nos dados.

2. SELECIONAR o "11 Ideal da Rodada" (Seleção da Rodada):
   - Escalação tática balanceada (4-3-3 ou 4-4-2), respeitando as posições reais informadas;
   - 1 GOLEIRO, 4 defensores (ZAGUEIRO/LATERAIS), 3 meias (VOLANTE/MEIA_ATACANTE) e 3 atacantes (PONTA/CENTROAVANTE);
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

    const groq = new Groq({ apiKey });
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "Você é um analista técnico de futebol especialista em avaliação de desempenho e análises táticas. Responda SOMENTE com JSON válido, sem texto fora do JSON.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content || "";

    // ------------------------------------------------------------------
    // 2. Parse + validação do JSON (zod)
    // ------------------------------------------------------------------
    let aiParsed: z.infer<typeof aiResponseSchema>;
    try {
      const jsonText = content.slice(content.indexOf("{"), content.lastIndexOf("}") + 1);
      aiParsed = aiResponseSchema.parse(JSON.parse(jsonText));
    } catch (err) {
      console.error("JSON inválido retornado pela IA:", err);
      return NextResponse.json(
        { error: "A IA retornou um JSON inválido. Tente novamente." },
        { status: 502 }
      );
    }

    // ------------------------------------------------------------------
    // 3. Enriquecer com metadados confiáveis do banco (nunca confiar na IA)
    //    para nome, foto, time e posição. Usar a requisição para saber em
    //    qual partida cada atleta atuou (persistência do rating).
    // ------------------------------------------------------------------
    const matchByPlayer = new Map<string, string>();
    for (const m of matches) {
      for (const s of m.squads || []) {
        if (s.player_id) matchByPlayer.set(s.player_id, m.matchId);
      }
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return req.cookies.getAll();
          },
          setAll() {},
        },
      }
    );

    const { data: players, error: playersError } = await supabase
      .from("players")
      .select("id, name, position, photo_url, teams(name)")
      .eq("season_id", seasonId);

    if (playersError && !isMissingTableError(playersError)) {
      console.error("Erro ao buscar atletas para enriquecimento:", playersError);
    }

    const metaById = new Map<
      string,
      { name: string; position: PlayerPosition | null; photo_url: string | null; team_name: string }
    >();

    for (const p of (players as any[]) || []) {
      const teamName =
        (p.teams && (p.teams as any).name) ||
        (Array.isArray(p.teams) ? (p.teams[0] as any)?.name : undefined) ||
        "";
      metaById.set(String(p.id), {
        name: p.name || "Atleta",
        position: PLAYER_POSITIONS.includes(p.position) ? (p.position as PlayerPosition) : null,
        photo_url: p.photo_url || null,
        team_name: teamName,
      });
    }

    const positionFromSquads = new Map<string, PlayerPosition>();
    for (const m of matches) {
      for (const s of m.squads || []) {
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

    function buildRow(
      playerId: string,
      rating: number,
      aiPosition?: string
    ): RatingRow | null {
      const meta = metaById.get(playerId);
      if (!meta) return null;
      return {
        player_id: playerId,
        player_name: meta.name,
        team_name: meta.team_name || "Sem equipe",
        position: resolvePosition(playerId, aiPosition),
        photo_url: meta.photo_url,
        rating: Math.min(10, Math.max(0, Math.round(rating * 10) / 10)),
      };
    }

    const ratings: RatingRow[] = [];
    const usedIds = new Set<string>();
    for (const r of aiParsed.ratings) {
      const row = buildRow(r.player_id, r.rating);
      if (row && !usedIds.has(row.player_id)) {
        usedIds.add(row.player_id);
        ratings.push(row);
      }
    }

    // ------------------------------------------------------------------
    // 4. Seleção determinística do 11 ideal (docs/03 §3)
    // ------------------------------------------------------------------
    const teamOfTheWeek = selectTeamOfWeek(
      ratings,
      aiParsed.team_of_the_week,
      resolvePosition
    );

    // ------------------------------------------------------------------
    // 5. Persistir notas em match_player_stats (trigger recalcula
    //    players.average_rating)
    // ------------------------------------------------------------------
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
        console.error("Erro ao salvar notas em match_player_stats:", upsertError);
      }
    }

    // ------------------------------------------------------------------
    // 6. Persistir a Seleção da Rodada (11 Ideal) em round_summaries,
    //    preservando o content (boletim) já existente, se houver.
    // ------------------------------------------------------------------
    if (teamOfTheWeek.lineup.length > 0) {
      const summaryPayload = {
        championship_id: championshipId,
        round_number: roundNumber,
        round_name: roundName,
        team_of_week: teamOfTheWeek as unknown as object,
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
            console.error("Erro ao atualizar seleção da rodada:", updateError);
          }
        } else {
          const { error: insertError } = await supabase
            .from("round_summaries")
            .insert({ ...summaryPayload, content: "" });

          if (insertError && !isMissingTableError(insertError)) {
            console.error("Erro ao salvar seleção da rodada:", insertError);
          }
        }
      } catch (saveError) {
        console.error("Erro ao persistir seleção da rodada:", saveError);
      }
    }

    return NextResponse.json({
      round: { roundNumber, roundName },
      ratings,
      team_of_the_week: teamOfTheWeek,
    });
  } catch (error: any) {
    console.error("Erro na API de notas da rodada:", error);
    return NextResponse.json(
      { error: error?.message || "Erro interno ao processar notas com Groq." },
      { status: 500 }
    );
  }
}

// ------------------------------------------------------------------
// Seleção determinística do 11 ideal (docs/03 §3)
// ------------------------------------------------------------------
function selectTeamOfWeek(
  ratings: RatingRow[],
  ai: z.infer<typeof aiResponseSchema>["team_of_the_week"],
  resolvePosition: (playerId: string, aiPosition?: string) => PlayerPosition | null
): TeamOfWeek {
  const sorted = [...ratings].sort((a, b) => b.rating - a.rating);

  const byLine = (line: PlayerPosition[]) => sorted.filter((p) => p.position && line.includes(p.position));

  const pickByLine = (
    line: PlayerPosition[],
    count: number,
    ensure?: PlayerPosition
  ): RatingRow[] => {
    const pool = byLine(line);
    const picked: RatingRow[] = [];
    if (ensure) {
      const idx = pool.findIndex((p) => p.position === ensure);
      if (idx >= 0) picked.push(pool.splice(idx, 1)[0]);
    }
    picked.push(...pool.sort((a, b) => b.rating - a.rating).slice(0, count - picked.length));
    return picked;
  };

  let lineup: RatingRow[] = [];
  lineup.push(...pickByLine(POSITION_LINES.GK, LINE_SLOTS.GK, "GOLEIRO"));
  lineup.push(...pickByLine(POSITION_LINES.DEF, LINE_SLOTS.DEF));
  lineup.push(...pickByLine(POSITION_LINES.MID, LINE_SLOTS.MID));
  lineup.push(...pickByLine(POSITION_LINES.ATT, LINE_SLOTS.ATT, "CENTROAVANTE"));

  const lineupIds = new Set(lineup.map((p) => p.player_id));

  // Completar o 11 com os melhores restantes, se faltar posições preenchidas.
  if (lineup.length < 11) {
    const missing = 11 - lineup.length;
    const rest = sorted.filter((p) => !lineupIds.has(p.player_id)).slice(0, missing);
    lineup.push(...rest);
    for (const p of rest) lineupIds.add(p.player_id);
  }

  const starPlayer = lineup.length > 0 ? [...lineup].sort((a, b) => b.rating - a.rating)[0] : null;

  // Reservas: melhores fora do 11, garantindo ao menos um por linha.
  const outside = sorted.filter((p) => !lineupIds.has(p.player_id));
  const bench: RatingRow[] = [];
  const benchLines = ["GK", "DEF", "MID", "ATT"] as const;

  for (const lineKey of benchLines) {
    const linePositions = POSITION_LINES[lineKey];
    const candidate = outside.find(
      (p) => p.position && linePositions.includes(p.position) && !bench.some((b) => b.player_id === p.player_id)
    );
    if (candidate) {
      bench.push(candidate);
    }
  }
  const benchIds = new Set(bench.map((b) => b.player_id));
  bench.push(...outside.filter((p) => !benchIds.has(p.player_id)).slice(0, 5 - bench.length));

  // Fallback de posições da IA para exibição (nome/foto vêm do banco).
  const toPlayer = (row: RatingRow): TeamOfWeekPlayer => ({
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
