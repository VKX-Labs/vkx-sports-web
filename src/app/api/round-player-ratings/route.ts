import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@supabase/ssr";
import {
  generateRoundRatings,
  isMissingTableError,
  writeRatingAuditLog,
  type RatingMatchInput,
} from "@/lib/rating-engine";

const requestSchema = z.object({
  championshipId: z.string().min(1),
  championshipName: z.string().optional(),
  seasonId: z.string().min(1),
  roundNumber: z.number().int().positive(),
  roundName: z.string().min(1),
  matches: z
    .array(
      z.object({
        id: z.string().optional(),
        matchId: z.string().optional(),
        home_team_id: z.string().nullable().optional(),
        away_team_id: z.string().nullable().optional(),
        home_team: z
          .object({ name: z.string().optional(), badge_url: z.string().optional() })
          .nullable()
          .optional(),
        away_team: z
          .object({ name: z.string().optional(), badge_url: z.string().optional() })
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
      })
    )
    .min(1),
});

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "A chave GROQ_API_KEY não está configurada no arquivo .env.local." },
        { status: 500 }
      );
    }

    const parsedBody = requestSchema.safeParse(await req.json());
    if (!parsedBody.success) {
      const message = parsedBody.error.issues[0]?.message || "Payload inválido.";
      const field = parsedBody.error.issues[0]?.path?.join(".") || "body";
      return NextResponse.json({ error: `${field}: ${message}` }, { status: 400 });
    }

    const { championshipId, championshipName, seasonId, roundNumber, roundName, matches } =
      parsedBody.data;

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

    const { data: currentUser } = await supabase.auth.getUser();
    const createdBy = currentUser?.user?.id || null;

    try {
      const { ratings, teamOfTheWeek } = await generateRoundRatings({
        supabase,
        apiKey,
        championshipId,
        championshipName,
        seasonId,
        roundNumber,
        roundName,
        matches: matches as RatingMatchInput[],
        createdBy,
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
        seasonId,
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
              : "Erro interno ao processar notas com Groq.",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Erro na API de notas da rodada:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro interno ao processar notas." },
      { status: 500 }
    );
  }
}