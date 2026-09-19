import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@supabase/ssr";
import {
  assertCanManageRatings,
  resolveSeasonIdByChampionship,
} from "@/lib/rating-route-helpers";

const requestSchema = z.object({
  championshipId: z.string().min(1),
  roundNumber: z.number().int().positive(),
  roundName: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const parsedBody = requestSchema.safeParse(await req.json());
    if (!parsedBody.success) {
      const message = parsedBody.error.issues[0]?.message || "Payload inválido.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const { championshipId, roundNumber, roundName } = parsedBody.data;

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

    // Somente ADMIN (ou dono) pode finalizar uma rodada.
    await assertCanManageRatings(supabase, championshipId);

    const seasonId = await resolveSeasonIdByChampionship(supabase, championshipId);
    if (!seasonId) {
      return NextResponse.json(
        { error: "Nenhuma temporada encontrada para este campeonato." },
        { status: 404 }
      );
    }

    // "Finalizar Rodada" é APENAS uma mudança de estado: avança a rodada ativa
    // exibida por padrão no campeonato. NÃO dispara cálculo de notas — essas
    // são geradas sob demanda pelas opções de auditoria/notas.
    const { data: nextRoundNumber, error: advanceError } = await supabase.rpc(
      "advance_season_current_round",
      { season_id: seasonId, next_round_number: roundNumber + 1 }
    );

    if (advanceError) {
      console.error("[finalize-round] Erro ao avançar rodada:", advanceError);
      return NextResponse.json(
        { error: "Erro ao avançar a rodada. Tente novamente." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: `Rodada ${roundNumber} finalizada. O campeonato agora exibe a próxima rodada por padrão.`,
      round: { roundNumber, roundName },
      advancedTo: nextRoundNumber,
    });
  } catch (error) {
    console.error("Erro ao finalizar rodada:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro interno ao finalizar rodada." },
      { status: 500 }
    );
  }
}