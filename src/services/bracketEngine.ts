import { supabase } from "@/lib/supabase";

const NEXT_PHASE_MAP: Record<string, string> = {
  PRE_PLAYOFF: "OITAVAS",
  "16_AVOS": "OITAVAS",
  OITAVAS: "QUARTAS",
  QUARTAS: "SEMI",
  QUARTAS_DE_FINAL: "SEMI",
  SEMI: "FINAL",
  SEMIFINAL: "FINAL",
  SEMIFINAIS: "FINAL",
};

export interface MatchAdvancePayload {
  id: string;
  season_id: string;
  phase: string;
  bracket_position: number;
  home_team_id: string | null;
  away_team_id: string | null;
  home_score: number | null;
  away_score: number | null;
  home_score_leg2?: number | null;
  away_score_leg2?: number | null;
  penalties_home?: number | null;
  penalties_away?: number | null;
  next_match_id?: string | null;
  status: string;
}


export async function advanceWinnerIfPhaseFinished(
  match: MatchAdvancePayload,
  isTwoLegs: boolean = false
) {
  try {
    if (!match.home_team_id || !match.away_team_id) {
      console.warn("Partida sem times definidos para apuração de vencedor.");
      return;
    }

    let homeTotal = match.home_score ?? 0;
    let awayTotal = match.away_score ?? 0;

    if (isTwoLegs) {
      homeTotal += match.home_score_leg2 ?? 0;
      awayTotal += match.away_score_leg2 ?? 0;
    }

    let winnerId: string | null = null;

    if (homeTotal > awayTotal) {
      winnerId = match.home_team_id;
    } else if (awayTotal > homeTotal) {
      winnerId = match.away_team_id;
    } else {
      if ((match.penalties_home ?? 0) > (match.penalties_away ?? 0)) {
        winnerId = match.home_team_id;
      } else if ((match.penalties_away ?? 0) > (match.penalties_home ?? 0)) {
        winnerId = match.away_team_id;
      }
    }

    if (!winnerId) {
      console.warn("Confronto empatado sem vencedor definido nos pênaltis.");
      return;
    }

    const { error: winnerErr } = await supabase
      .from("matches")
      .update({ winner_id: winnerId })
      .eq("id", match.id);

    if (winnerErr) {
      console.error("Erro ao gravar winner_id na partida atual:", winnerErr);
    }

    const currentPos = match.bracket_position ?? 1;
    const isHomeSlot = currentPos % 2 !== 0;

    let targetMatchId: string | null = match.next_match_id || null;

    if (!targetMatchId) {
      const normalizedPhase = (match.phase || "").trim().toUpperCase();
      const nextPhase = NEXT_PHASE_MAP[normalizedPhase];

      if (!nextPhase) {
        console.log(`Fase final (${normalizedPhase}) atingida ou próxima fase não configurada.`);
        return;
      }

      const nextBracketPos = Math.ceil(currentPos / 2);

      let { data: targetMatch, error: findError } = await supabase
        .from("matches")
        .select("id")
        .eq("season_id", match.season_id)
        .ilike("phase", `%${nextPhase}%`)
        .eq("bracket_position", nextBracketPos)
        .maybeSingle();

      if (findError) {
        console.error("Erro ao buscar próxima partida por posição:", findError);
      }

      if (!targetMatch && nextPhase === "FINAL") {
        const { data: finalMatch } = await supabase
          .from("matches")
          .select("id")
          .eq("season_id", match.season_id)
          .ilike("phase", "%FINAL%")
          .maybeSingle();

        targetMatch = finalMatch;
      }

      if (targetMatch) {
        targetMatchId = targetMatch.id;
      }
    }

    if (!targetMatchId) {
      console.warn("Partida de destino não encontrada para propagar o vencedor.");
      return;
    }

    const updatePayload = isHomeSlot
      ? { home_team_id: winnerId }
      : { away_team_id: winnerId };

    const { error: updateErr } = await supabase
      .from("matches")
      .update(updatePayload)
      .eq("id", targetMatchId);

    if (updateErr) {
      console.error("Erro ao inserir vencedor na próxima partida:", updateErr);
    } else {
      console.log(
        `[BracketEngine] Sucesso! Time ${winnerId} inserido no slot ${
          isHomeSlot ? "MANDANTE (home)" : "VISITANTE (away)"
        } da partida ${targetMatchId}`
      );
    }
  } catch (err) {
    console.error("Erro inesperado no motor de chaveamento:", err);
  }
}