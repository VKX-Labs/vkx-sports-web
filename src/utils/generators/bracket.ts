export interface KnockoutBracketMatch {
  phase: string;
  bracket_position: number;
  home_team_id: string | null;
  away_team_id: string | null;
  next_match_index: number;
}

export interface BracketRound {
  phase: string;
  matchCount: number;
}

function nextPowerOf2(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

function getStandardPhases(bracketSize: number): string[] {
  const phases: string[] = [];
  if (bracketSize >= 32) phases.push("16_AVOS");
  if (bracketSize >= 16) phases.push("OITAVAS");
  if (bracketSize >= 8) phases.push("QUARTAS");
  if (bracketSize >= 4) phases.push("SEMI");
  phases.push("FINAL");
  return phases;
}

export function getBracketStructure(numTeams: number): BracketRound[] {
  const bracketSize = nextPowerOf2(Math.max(numTeams, 2));
  const needsPrePlayoff = numTeams !== bracketSize;
  const firstRoundSize = needsPrePlayoff ? bracketSize / 2 : bracketSize;

  const rounds: BracketRound[] = [];
  if (needsPrePlayoff) {
    rounds.push({ phase: "PRE_PLAYOFF", matchCount: numTeams - firstRoundSize });
  }

  let matchCount = firstRoundSize / 2;
  for (const phase of getStandardPhases(firstRoundSize)) {
    rounds.push({ phase, matchCount });
    matchCount /= 2;
  }

  return rounds;
}

function shuffleTeams<T extends { id: string }>(teams: T[]): T[] {
  const shuffled = [...teams];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function generateKnockoutBracket(
  teams: { id: string }[],
  shuffle: boolean = false
): KnockoutBracketMatch[] {
  if (teams.length < 2) {
    throw new Error("É necessário pelo menos 2 times para gerar o chaveamento.");
  }

  const orderedTeams = shuffle ? shuffleTeams(teams) : teams;
  const numTeams = orderedTeams.length;
  const bracketSize = nextPowerOf2(numTeams);
  const needsPrePlayoff = numTeams !== bracketSize;
  const firstRoundSize = needsPrePlayoff ? bracketSize / 2 : bracketSize;

  const rounds = getBracketStructure(numTeams);

  const matches: KnockoutBracketMatch[] = [];
  const roundStarts: number[] = [];

  for (const round of rounds) {
    roundStarts.push(matches.length);
    for (let i = 0; i < round.matchCount; i++) {
      matches.push({
        phase: round.phase,
        bracket_position: i,
        home_team_id: null,
        away_team_id: null,
        next_match_index: -1,
      });
    }
  }

  const standardStart = needsPrePlayoff ? 1 : 0;
  for (let r = standardStart; r < rounds.length - 1; r++) {
    const start = roundStarts[r];
    const count = rounds[r].matchCount;
    const nextStart = roundStarts[r + 1];
    for (let i = 0; i < count; i++) {
      matches[start + i].next_match_index = nextStart + Math.floor(i / 2);
    }
  }

  const firstStart = roundStarts[0];

  if (needsPrePlayoff) {
    const preCount = rounds[0].matchCount;
    const teamsInPrePlayoff = preCount * 2;
    const nextStart = roundStarts[1];
    const nextMatchCount = rounds[1].matchCount;
    const totalSlots = nextMatchCount * 2;

    for (let i = 0; i < preCount; i++) {
      matches[firstStart + i].home_team_id = orderedTeams[i * 2].id;
      matches[firstStart + i].away_team_id = orderedTeams[i * 2 + 1].id;
    }

    const byeTeams = orderedTeams.slice(teamsInPrePlayoff);
    const slots: ({ kind: "pre"; idx: number } | { kind: "bye"; teamId: string })[] = [];

    let pi = 0;
    let bi = 0;
    while (slots.length < totalSlots) {
      if (pi < preCount) {
        slots.push({ kind: "pre", idx: pi });
        pi++;
      }
      if (bi < byeTeams.length && slots.length < totalSlots) {
        slots.push({ kind: "bye", teamId: byeTeams[bi].id });
        bi++;
      }
    }

    for (let s = 0; s < totalSlots; s++) {
      const slot = slots[s];
      if (slot.kind === "bye") {
        const matchIdx = Math.floor(s / 2);
        if (s % 2 === 0) {
          matches[nextStart + matchIdx].home_team_id = slot.teamId;
        } else {
          matches[nextStart + matchIdx].away_team_id = slot.teamId;
        }
      }
    }

    for (let s = 0; s < totalSlots; s++) {
      const slot = slots[s];
      if (slot.kind === "pre") {
        const matchIdx = Math.floor(s / 2);
        matches[firstStart + slot.idx].next_match_index = nextStart + matchIdx;
      }
    }
  } else {
    const firstMatchCount = rounds[0].matchCount;
    for (let i = 0; i < firstMatchCount; i++) {
      matches[firstStart + i].home_team_id = orderedTeams[i * 2]?.id ?? null;
      matches[firstStart + i].away_team_id = orderedTeams[i * 2 + 1]?.id ?? null;
    }
  }

  return matches;
}
