import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import {
  isMissingTableError,
  recalculateMatchRatings,
  type RecalculatedMatch,
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

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      championshipId?: string;
      seasonId?: string;
      roundNumber?: number;
      matchId?: string;
      force?: boolean;
    };
    const championshipId = body?.championshipId?.trim();
    const seasonId = body?.seasonId?.trim() || undefined;
    const targetRound = typeof body?.roundNumber === "number" ? body.roundNumber : undefined;
    const matchId = body?.matchId?.trim() || undefined;
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
    if (!seasonIdResolved) {
      const { data: firstSeason, error: seasonError } = await supabase
        .from("seasons")
        .select("id")
        .eq("championship_id", championshipId)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (seasonError && !isMissingTableError(seasonError)) {
        return NextResponse.json(
          { error: "Erro ao resolver temporada do campeonato." },
          { status: 500 }
        );
      }
      seasonIdResolved = firstSeason?.id || null;
    } else {
      const { data: checkSeason, error: seasonError } = await supabase
        .from("seasons")
        .select("id")
        .eq("id", seasonIdResolved)
        .eq("championship_id", championshipId)
        .maybeSingle();

      if (seasonError && !isMissingTableError(seasonError)) {
        return NextResponse.json(
          { error: "Erro ao resolver temporada do campeonato." },
          { status: 500 }
        );
      }
      if (!checkSeason) {
        return NextResponse.json(
          { error: "A temporada informada não pertence a este campeonato." },
          { status: 400 }
        );
      }
    }

    if (!seasonIdResolved) {
      return NextResponse.json(
        { error: "Nenhuma temporada encontrada para este campeonato." },
        { status: 404 }
      );
    }

    // ----- Validação da partida em específico -----
    if (matchId) {
      const { data: matchCheck } = await supabase
        .from("matches")
        .select("id, status")
        .eq("id", matchId)
        .maybeSingle();

      if (!matchCheck) {
        return NextResponse.json(
          { error: "Partida não encontrada." },
          { status: 404 }
        );
      }
      if (!isFinishedStatus(matchCheck.status)) {
        return NextResponse.json(
          { error: "A partida informada precisa estar finalizada para ter notas recalculadas." },
          { status: 400 }
        );
      }
    }

    // ----- Validação da rodada em específico -----
    if (targetRound !== undefined && !matchId) {
      const { data: roundCheck } = await supabase
        .from("rounds")
        .select("id")
        .eq("season_id", seasonIdResolved)
        .eq("round_number", targetRound)
        .maybeSingle();

      if (!roundCheck) {
        return NextResponse.json(
          { error: `Rodada ${targetRound} não encontrada na temporada.` },
          { status: 404 }
        );
      }
    }

    // ----- Recálculo VKX V2 (função canônica do motor) -----
    let result;
    try {
      result = await recalculateMatchRatings(supabase, {
        championshipId,
        seasonId: seasonIdResolved,
        matchId,
        roundNumber: targetRound,
        force,
        createdBy: userId,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro interno ao recalcular notas.";
      if (errorMessage.includes("Nenhuma partida finalizada")) {
        return NextResponse.json(
          { error: "Nenhuma partida finalizada encontrada nas rodadas desta temporada." },
          { status: 404 }
        );
      }
      if (errorMessage.includes("Partida não encontrada") || errorMessage.includes("finalizada para ter notas")) {
        return NextResponse.json({ error: errorMessage }, { status: 400 });
      }
      throw err;
    }

    if (result.recalculated.length === 0) {
      return NextResponse.json({
        message: "Todas as partidas finalizadas já possuem notas. Nada a recalcular.",
        championshipId,
        seasonId: seasonIdResolved,
        processedRounds: [],
      });
    }

    // ----- Agrupamento por rodada para o relatório -----
    const roundsMap = new Map<number, BackfillRoundResult>();

    for (const recalculated of result.recalculated as RecalculatedMatch[]) {
      const existing = roundsMap.get(recalculated.roundNumber);
      if (existing) {
        existing.matchesProcessed += 1;
        existing.playersRated += recalculated.playersRated;
      } else {
        roundsMap.set(recalculated.roundNumber, {
          roundNumber: recalculated.roundNumber,
          roundName: recalculated.roundName,
          status: "SUCCESS",
          matchesProcessed: 1,
          playersRated: recalculated.playersRated,
        });
      }
    }

    return NextResponse.json({
      championshipId,
      seasonId: seasonIdResolved,
      force,
      playersRated: result.playersRated,
      processedRounds: Array.from(roundsMap.values()),
    });
  } catch (error) {
    console.error("Erro no recálculo histórico de notas:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro interno ao recalcular notas." },
      { status: 500 }
    );
  }
}