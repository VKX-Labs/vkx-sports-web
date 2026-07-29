import {
  PlayoffPhase,
  PHASE_ORDER,
  PHASE_NAMES,
  KnockoutRules,
  PhaseKnockoutRules,
  getPhaseRules,
  isPhaseTwoLegged,
  PlayoffMatch,
} from "@/types/tournament";

export const KnockoutService = {
  getActivePhases(phases: string[]): string[] {
    return PHASE_ORDER.filter((p) => phases.includes(p));
  },

  getPhaseName(phase: string): string {
    return PHASE_NAMES[phase] || phase;
  },

  getPhaseRules(rules: KnockoutRules, phase: PlayoffPhase): PhaseKnockoutRules {
    return getPhaseRules(rules, phase);
  },

  isPhaseTwoLegged(rules: KnockoutRules, phase: PlayoffPhase): boolean {
    return isPhaseTwoLegged(rules, phase);
  },

  calculateAggregate(match: PlayoffMatch): { home: number; away: number } {
    const h1 = match.home_score ?? 0;
    const a1 = match.away_score ?? 0;
    const h2 = match.home_score_leg2 ?? 0;
    const a2 = match.away_score_leg2 ?? 0;
    return {
      home: h1 + (match.home_score_leg2 != null ? a2 : 0),
      away: a1 + (match.away_score_leg2 != null ? h2 : 0),
    };
  },

  getAggregateDisplay(
    match: PlayoffMatch,
    phase: PlayoffPhase,
    rules: KnockoutRules
  ): { homeTotal: number; awayTotal: number } | null {
    const phaseRules = getPhaseRules(rules, phase);
    if (!phaseRules.two_legged) return null;
    if (match.home_score_leg2 == null && match.away_score_leg2 == null) return null;

    const agg = this.calculateAggregate(match);
    return { homeTotal: agg.home, awayTotal: agg.away };
  },

  determineWinnerId(
    match: PlayoffMatch,
    phase: PlayoffPhase,
    rules: KnockoutRules
  ): string | null {
    if (match.winner_id) return match.winner_id;

    const phaseRules = getPhaseRules(rules, phase);

    if (!phaseRules.two_legged) {
      if (
        match.home_score != null &&
        match.away_score != null
      ) {
        if (match.home_score > match.away_score) return match.home_team?.id ?? null;
        if (match.away_score > match.home_score) return match.away_team?.id ?? null;

        if (match.penalties_home != null && match.penalties_away != null) {
          if (match.penalties_home > match.penalties_away) return match.home_team?.id ?? null;
          if (match.penalties_away > match.penalties_home) return match.away_team?.id ?? null;
        }
      }
      return null;
    }

    if (
      match.home_score == null || match.away_score == null ||
      match.home_score_leg2 == null || match.away_score_leg2 == null
    ) {
      return null;
    }

    const h1 = match.home_score;
    const a1 = match.away_score;
    const h2 = match.home_score_leg2;
    const a2 = match.away_score_leg2;

    const homeId = match.home_team?.id;
    const awayId = match.away_team?.id;
    if (!homeId || !awayId) return null;

    const totalHome = h1 + a2;
    const totalAway = a1 + h2;

    if (totalHome > totalAway) return homeId;
    if (totalAway > totalHome) return awayId;

    if (phaseRules.away_goals_rule) {
      const awayGoalsHome = a2;
      const awayGoalsAway = a1;
      if (awayGoalsHome > awayGoalsAway) return homeId;
      if (awayGoalsAway > awayGoalsHome) return awayId;
    }

    if (match.penalties_home != null && match.penalties_away != null) {
      if (match.penalties_home > match.penalties_away) return homeId;
      if (match.penalties_away > match.penalties_home) return awayId;
    }

    return null;
  },

  createLegPairs(
    matches: { phase: string; bracket_position: number }[]
  ): { leg1: number; leg2?: number }[] {
    const pairs: { leg1: number; leg2?: number }[] = [];
    const used = new Set<number>();

    for (let i = 0; i < matches.length; i++) {
      if (used.has(i)) continue;
      used.add(i);

      const m1 = matches[i];
      const twin = matches.findIndex(
        (m, j) =>
          !used.has(j) &&
          m.phase === m1.phase &&
          m.bracket_position === m1.bracket_position
      );

      if (twin >= 0) {
        used.add(twin);
        pairs.push({ leg1: i, leg2: twin });
      } else {
        pairs.push({ leg1: i });
      }
    }

    return pairs;
  },
};
