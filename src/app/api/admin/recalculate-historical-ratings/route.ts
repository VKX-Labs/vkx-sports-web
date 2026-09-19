import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import {
  generateRoundRatings,
  isMissingTableError,
  writeRatingAuditLog,
  type RatingMatchInput,
} from "@/lib/rating-engine";

const FINISHED_STATUSES = ["finished", "finalizado", "FINISHED", "FINALIZADO"];

interface BackfillRoundResult {
  roundNumber: number;
  roundName: string;
  status: "SUCCESS" | "WARNING" | "ERROR";
  matchesProcessed: number;
  playersRated: number;
  error?: string;
}

function isFinishedStatus(status: unknown): boolean {
  return typeof status === "string" && FINISHED_STATUSES.includes(status.trim());
}

async function loadEventNames(
  event: Record<string, unknown>,
  playersMap: Map<string, string>,
  teamsMap: Map<string, { name: string; badge_url: string | null }>,
  fallbackTeam: string
): Promise<Record<string, unknown>> {
  const playerId = typeof event.player_id === "string" ? event.player_id : null;
  const teamId = typeof event.team_id === "string" ? event.team_id : null;
  return {
    ...event,
    player_name: playerId && playersMap.has(playerId) ? playersMap.get(playerId)! : "Jogador",
    team_name: teamId && teamsMap.has(teamId) ? teamsMap.get(teamId)!.name : fallbackTeam,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      championshipId?: string;
      seasonId?: string;
      roundNumber?: number;
      force?: boolean;
    };
    const championshipId = body?.championshipId?.trim();
    const seasonId = body?.seasonId?.trim() || null;
    const targetRound = typeof body?.roundNumber === "number" ? body.roundNumber : null;
    const force = Boolean(body?.force);

    if (!championshipId) {
      return NextResponse.json(
        { error: "championshipId é obrigatório." },
        { status: 400 }
      );
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

    const {
      data: { user },
    } = await supabase.auth.getUser();
    const userId = user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: "Usuário não autenticado." },
        { status: 401 }
      );
    }

    // ----- Verificação administrativa (dono OU papel ADMIN) -----
    const { data: championshipData, error: championshipError } = await supabase
      .from("championships")
      .select("user_id, name")
      .eq("id", championshipId)
      .maybeSingle();

    if (championshipError) {
      if (isMissingTableError(championshipError)) {
        return NextResponse.json(
          { error: "Tabela championships não encontrada. Rode as migrações do Supabase." },
          { status: 500 }
        );
      }
      return NextResponse.json(
        { error: "Erro ao carregar campeonato." },
        { status: 500 }
      );
    }

    if (!championshipData) {
      return NextResponse.json(
        { error: "Campeonato não encontrado." },
        { status: 404 }
      );
    }

    const isOwner = championshipData.user_id === userId;
    let isAdminMember = false;

    if (!isOwner) {
      const { data: adminRow } = await supabase
        .from("championship_members")
        .select("id")
        .eq("championship_id", championshipId)
        .eq("user_id", userId)
        .eq("role", "ADMIN")
        .maybeSingle();

      isAdminMember = Boolean(adminRow);
    }

    if (!isOwner && !isAdminMember) {
      return NextResponse.json(
        { error: "Somente o administrador do campeonato pode recalcular notas." },
        { status: 403 }
      );
    }

    // ----- Resolver temporada -----
    let seasonIdResolved = seasonId;
    let seasonQueryError: { message?: string } | null = null;

    if (!seasonIdResolved) {
      const { data: firstSeason, error: seasonError } = await supabase
        .from("seasons")
        .select("id")
        .eq("championship_id", championshipId)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (seasonError) seasonQueryError = seasonError;
      seasonIdResolved = firstSeason?.id || null;
    } else {
      const { data: checkSeason, error: seasonError } = await supabase
        .from("seasons")
        .select("id")
        .eq("id", seasonIdResolved)
        .eq("championship_id", championshipId)
        .maybeSingle();

      if (seasonError) seasonQueryError = seasonError;
      if (!checkSeason) {
        return NextResponse.json(
          { error: "A temporada informada não pertence a este campeonato." },
          { status: 400 }
        );
      }
    }

    if (seasonQueryError && !isMissingTableError(seasonQueryError)) {
      return NextResponse.json(
        { error: "Erro ao resolver temporada do campeonato." },
        { status: 500 }
      );
    }

    if (!seasonIdResolved) {
      return NextResponse.json(
        { error: "Nenhuma temporada encontrada para este campeonato." },
        { status: 404 }
      );
    }

    // ----- Carregar rodadas e partidas finalizadas -----
    const { data: roundsData, error: roundsError } = await supabase
      .from("rounds")
      .select("id, name, round_number")
      .eq("season_id", seasonIdResolved)
      .order("round_number", { ascending: true });

    if (roundsError) {
      if (isMissingTableError(roundsError)) {
        return NextResponse.json(
          { error: "Tabela rounds não encontrada. Rode as migrações do Supabase." },
          { status: 500 }
        );
      }
      return NextResponse.json(
        { error: "Erro ao carregar rodadas." },
        { status: 500 }
      );
    }

    const usableRounds = (roundsData || []).filter(
      (r) => Number.isInteger(r.round_number) && r.round_number > 0
    );

    if (targetRound !== null) {
      const foundIndex = usableRounds.findIndex((r) => r.round_number === targetRound);
      if (foundIndex < 0) {
        return NextResponse.json(
          { error: `Rodada ${targetRound} não encontrada na temporada.` },
          { status: 404 }
        );
      }
    }

    const roundIds = usableRounds.map((r) => r.id);
    const matchIdsByRound = new Map<string, string[]>();

    for (const r of usableRounds) {
      if (targetRound !== null && r.round_number !== targetRound) continue;

      const { data: matchesData, error: matchesError } = await supabase
        .from("matches")
        .select("id, home_team_id, away_team_id, home_score, away_score, status")
        .eq("round_id", r.id);

      if (matchesError) {
        if (isMissingTableError(matchesError)) {
          return NextResponse.json(
            { error: "Tabela matches não encontrada. Rode as migrações do Supabase." },
            { status: 500 }
          );
        }
        console.error("Erro ao carregar partidas da rodada:", matchesError);
        continue;
      }

      const finishedMatches = (matchesData || []).filter((m) => isFinishedStatus(m.status));
      matchIdsByRound.set(r.id, finishedMatches.map((m) => m.id));
    }

    // ----- Conjunto de partidas finalizadas -----
    const allMatchIds = Array.from(matchIdsByRound.values()).flat();

    if (allMatchIds.length === 0) {
      return NextResponse.json(
        { error: "Nenhuma partida finalizada encontrada nas rodadas desta temporada." },
        { status: 404 }
      );
    }

    // ----- Descobrir quais partidas já possuem notas (backfill pula) -----
    const alreadyRatedMatchIds = new Set<string>();
    if (!force) {
      const { data: existingStats } = await supabase
        .from("match_player_stats")
        .select("match_id")
        .in("match_id", allMatchIds)
        .not("rating", "is", null);

      for (const row of (existingStats as Array<{ match_id: string }>) || []) {
        alreadyRatedMatchIds.add(row.match_id);
      }
    }

    const matchesToProcess = allMatchIds.filter(
      (matchId) => !alreadyRatedMatchIds.has(matchId)
    );

    if (matchesToProcess.length === 0) {
      return NextResponse.json({
        message: "Todas as partidas finalizadas já possuem notas. Nada a recalcular.",
        championshipId,
        seasonId: seasonIdResolved,
        processedRounds: [],
      });
    }

    // ----- Carregar times, jogadores e eventos das partidas pendentes -----
    const { data: teamsData, error: teamsError } = await supabase
      .from("teams")
      .select("id, name, badge_url")
      .eq("season_id", seasonIdResolved);

    if (teamsError && !isMissingTableError(teamsError)) {
      console.error("Erro ao carregar times:", teamsError);
    }

    const teamsMap = new Map<string, { name: string; badge_url: string | null }>();
    for (const t of (teamsData as Array<{ id: string; name: string; badge_url: string | null }>) || []) {
      teamsMap.set(t.id, { name: t.name, badge_url: t.badge_url });
    }

    const { data: playersData, error: playersError } = await supabase
      .from("players")
      .select("id, name, team_id, position, photo_url")
      .eq("season_id", seasonIdResolved);

    if (playersError && !isMissingTableError(playersError)) {
      console.error("Erro ao carregar jogadores:", playersError);
    }

    const playersMap = new Map<string, string>();
    const playersByTeam = new Map<string, Array<Record<string, unknown>>>();

    for (const p of (playersData as Array<Record<string, unknown>>) || []) {
      const playerId = String(p.id);
      playersMap.set(playerId, String(p.name || "Jogador"));
      const teamId = p.team_id ? String(p.team_id) : null;
      if (teamId) {
        const squad = playersByTeam.get(teamId) || [];
        squad.push({
          player_id: playerId,
          name: String(p.name || "Jogador"),
          position: p.position || null,
          photo_url: p.photo_url || null,
          team_name: teamsMap.get(teamId)?.name || "Time",
        });
        playersByTeam.set(teamId, squad);
      }
    }

    const { data: eventsData, error: eventsError } = await supabase
      .from("match_events")
      .select(
        "match_id, player_id, team_id, type, quantity, minute, assist_player_id, player_name, team_name"
      )
      .in("match_id", matchesToProcess.length > 0 ? matchesToProcess : ["__none__"]);

    if (eventsError && !isMissingTableError(eventsError)) {
      console.error("Erro ao carregar eventos:", eventsError);
    }

    const eventsByMatch = new Map<string, Array<Record<string, unknown>>>();
    for (const e of (eventsData as Array<Record<string, unknown>>) || []) {
      const matchId = String(e.match_id);
      const list = eventsByMatch.get(matchId) || [];
      const enriched = await loadEventNames(
        e,
        playersMap,
        teamsMap,
        "Time"
      );
      list.push(enriched);
      eventsByMatch.set(matchId, list);
    }

    // ----- Processar rodada por rodada -----
    const results: BackfillRoundResult[] = [];

    for (const r of usableRounds) {
      if (targetRound !== null && r.round_number !== targetRound) continue;

      const matchIds = matchIdsByRound.get(r.id) || [];
      const pendingMatchIds = matchIds.filter((m) => !alreadyRatedMatchIds.has(m));

      if (pendingMatchIds.length === 0) {
        results.push({
          roundNumber: r.round_number,
          roundName: r.name,
          status: "SUCCESS",
          matchesProcessed: 0,
          playersRated: 0,
        });
        continue;
      }

      const { data: matchesData, error: matchesError } = await supabase
        .from("matches")
        .select("id, home_team_id, away_team_id, home_score, away_score, status")
        .in("id", pendingMatchIds);

      if (matchesError) {
        console.error("Erro ao carregar partidas para processar:", matchesError);
        continue;
      }

      const payloadMatches: RatingMatchInput[] = [];

      for (const m of (matchesData as Array<Record<string, unknown>>) || []) {
        const matchId = String(m.id);
        const homeTeamId = m.home_team_id ? String(m.home_team_id) : null;
        const awayTeamId = m.away_team_id ? String(m.away_team_id) : null;

        const homeTeam = homeTeamId ? teamsMap.get(homeTeamId) : null;
        const awayTeam = awayTeamId ? teamsMap.get(awayTeamId) : null;

        payloadMatches.push({
          id: matchId,
          matchId,
          home_team_id: homeTeamId,
          away_team_id: awayTeamId,
          home_score: typeof m.home_score === "number" ? m.home_score : null,
          away_score: typeof m.away_score === "number" ? m.away_score : null,
          status: typeof m.status === "string" ? m.status : null,
          home_team: homeTeam
            ? { name: homeTeam.name, badge_url: homeTeam.badge_url }
            : { name: `Mandante ${r.round_number}`, badge_url: null },
          away_team: awayTeam
            ? { name: awayTeam.name, badge_url: awayTeam.badge_url }
            : { name: `Visitante ${r.round_number}`, badge_url: null },
          events: eventsByMatch.get(matchId) || [],
          squads: [
            ...(homeTeamId ? playersByTeam.get(homeTeamId) || [] : []),
            ...(awayTeamId ? playersByTeam.get(awayTeamId) || [] : []),
          ],
        });
      }

      const roundName = r.name || `${r.round_number}ª Rodada`;

      try {
        const { ratings } = await generateRoundRatings({
          supabase,
          championshipId,
          seasonId: seasonIdResolved,
          roundNumber: r.round_number,
          roundName,
          matches: payloadMatches,
          createdBy: userId,
          force: Boolean(force),
        });

        results.push({
          roundNumber: r.round_number,
          roundName,
          status: "SUCCESS",
          matchesProcessed: payloadMatches.length,
          playersRated: ratings.length,
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Erro ao gerar notas da rodada.";
        console.error(`Erro na rodada ${r.round_number}:`, err);

        await writeRatingAuditLog({
          supabase,
          championshipId,
          seasonId: seasonIdResolved,
          roundNumber: r.round_number,
          roundName,
          status: "ERROR",
          payload: {
            match_ids: pendingMatchIds,
            players: [],
            error: errorMessage,
          },
          createdBy: userId,
        }).catch(() => undefined);

        results.push({
          roundNumber: r.round_number,
          roundName,
          status: "ERROR",
          matchesProcessed: payloadMatches.length,
          playersRated: 0,
          error: errorMessage,
        });
      }
    }

    // ----- Forçar recálculo da média de TODOS os atletas (consistência) -----
    try {
      await supabase.rpc("recalculate_all_average_ratings");
    } catch (rpcError) {
      console.error("Erro ao recalcular médias via RPC:", rpcError);
    }

    return NextResponse.json({
      championshipId,
      seasonId: seasonIdResolved,
      force: Boolean(force),
      processedRounds: results,
    });
  } catch (error) {
    console.error("Erro no recálculo histórico de notas:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro interno ao recalcular notas." },
      { status: 500 }
    );
  }
}