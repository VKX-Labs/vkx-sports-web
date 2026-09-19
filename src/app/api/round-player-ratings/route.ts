import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@supabase/ssr";
import {
  generateMatchRatings,
  generateRoundRatings,
  isMissingTableError,
  writeRatingAuditLog,
  type RatingMatchInput,
} from "@/lib/rating-engine";
import {
  assertCanManageRatings,
  resolveSeasonIdByChampionship,
} from "@/lib/rating-route-helpers";

const matchSchema = z.object({
  id: z.string().optional(),
  matchId: z.string().optional(),
  home_team_id: z.string().nullable().optional(),
  away_team_id: z.string().nullable().optional(),
  home_team: z
    .object({
      name: z.string().optional(),
      badge_url: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
  away_team: z
    .object({
      name: z.string().optional(),
      badge_url: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
  home_score: z.number().nullable().optional(),
  away_score: z.number().nullable().optional(),
  status: z.string().nullable().optional(),
  events: z.array(z.record(z.string(), z.unknown())).optional(),
  squads: z
    .array(
      z.object({
        player_id: z.string().optional(),
        name: z.string().optional(),
        position: z.string().nullable().optional(),
        photo_url: z.string().nullable().optional(),
        team_name: z.string().optional(),
      })
    )
    .optional(),
});

const requestSchema = z.object({
  championshipId: z.string().min(1),
  championshipName: z.string().optional(),
  seasonId: z.string().optional(),
  roundNumber: z.number().int().positive(),
  roundName: z.string().min(1),
  scope: z.enum(["ROUND", "MATCH"]).optional().default("ROUND"),
  force: z.boolean().optional().default(false),
  matches: z.array(matchSchema).min(1),
});

export async function POST(req: NextRequest) {
  try {
    const parsedBody = requestSchema.safeParse(await req.json());
    if (!parsedBody.success) {
      const message = parsedBody.error.issues[0]?.message || "Payload inválido.";
      const field = parsedBody.error.issues[0]?.path?.join(".") || "body";
      return NextResponse.json({ error: `${field}: ${message}` }, { status: 400 });
    }

    const {
      championshipId,
      seasonId,
      roundNumber,
      roundName,
      scope,
      force,
      matches,
    } = parsedBody.data;

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

    // Somente ADMIN (ou dono) pode gerar/regenerar notas.
    await assertCanManageRatings(supabase, championshipId);

    const { data: currentUser } = await supabase.auth.getUser();
    const createdBy = currentUser?.user?.id || null;

    const resolvedSeasonId = seasonId || (await resolveSeasonIdByChampionship(supabase, championshipId));
    if (!resolvedSeasonId) {
      return NextResponse.json(
        { error: "Nenhuma temporada encontrada para este campeonato." },
        { status: 404 }
      );
    }

    if (scope === "MATCH") {
      if (matches.length !== 1) {
        return NextResponse.json(
          { error: "Para calcular a nota de uma partida, envie exatamente 1 partida." },
          { status: 400 }
        );
      }

      try {
        const { ratings } = await generateMatchRatings({
          supabase,
          championshipId,
          seasonId: resolvedSeasonId,
          roundNumber,
          roundName,
          match: matches[0] as RatingMatchInput,
          createdBy,
        });

        return NextResponse.json({
          match: { matchId: matches[0].matchId ?? matches[0].id, roundNumber, roundName },
          ratings,
          regenerated: true,
        });
      } catch (engineError) {
        console.error("Erro na API de nota por partida:", engineError);
        return NextResponse.json(
          {
            error:
              engineError instanceof Error
                ? engineError.message
                : "Erro interno ao processar nota da partida.",
          },
          { status: 500 }
        );
      }
    }

    // ----- scope = RODADA: calcula apenas partidas pendentes -----
    try {
      const { ratings, teamOfTheWeek } = await generateRoundRatings({
        supabase,
        championshipId,
        seasonId: resolvedSeasonId,
        roundNumber,
        roundName,
        matches: matches as RatingMatchInput[],
        createdBy,
        force,
      });

      return NextResponse.json({
        round: { roundNumber, roundName },
        ratings,
        team_of_the_week: teamOfTheWeek,
      });
    } catch (engineError) {
      console.error("Erro na API de notas da rodada:", engineError);
      await writeRatingAuditLog({
        supabase,
        championshipId,
        seasonId: resolvedSeasonId,
        roundNumber,
        roundName,
        status: "ERROR",
        payload: {
          match_ids: matches.map((m) => m.id ?? m.matchId!).filter(Boolean),
          players: [],
          error:
            engineError instanceof Error ? engineError.message : "Erro interno ao gerar notas.",
        },
        createdBy,
      }).catch((logErr: unknown) => {
        if (!isMissingTableError(logErr)) {
          console.error("Falha ao registrar log de erro de auditoria:", logErr);
        }
      });

      return NextResponse.json(
        {
          error:
            engineError instanceof Error
              ? engineError.message
              : "Erro interno ao processar notas.",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Erro na API de notas:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro interno ao processar notas." },
      { status: 500 }
    );
  }
}