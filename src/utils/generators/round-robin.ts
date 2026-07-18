export interface GenerationTeam {
  id: string;
  name: string;
}

export interface GeneratedMatch {
  home_team_id: string | null;
  away_team_id: string | null;
  home_team_name: string;
  away_team_name: string;
}

export interface GeneratedRound {
  number: number;
  matches: GeneratedMatch[];
}

export function generateRoundRobin(
  teams: GenerationTeam[],
  options: { shuffle?: boolean; doubleRound?: boolean } = {}
): GeneratedRound[] {
  const list = [...teams];

  if (options.shuffle) {
    list.sort(() => Math.random() - 0.5);
  }

  if (list.length % 2 !== 0) {
    list.push({ id: "bye", name: "Folga" });
  }

  const totalTeams = list.length;
  const totalRounds = totalTeams - 1;
  const matchesPerRound = totalTeams / 2;

  const rounds: GeneratedRound[] = [];

  for (let round = 0; round < totalRounds; round++) {
    const matches: GeneratedMatch[] = [];

    for (let match = 0; match < matchesPerRound; match++) {
      const homeIndex = (round + match) % (totalTeams - 1);
      const awayIndex =
        match === 0
          ? totalTeams - 1
          : (totalRounds - match + round) % (totalTeams - 1);

      const home = list[homeIndex];
      const away = list[awayIndex];

      matches.push({
        home_team_id: home.id === "bye" ? null : home.id,
        away_team_id: away.id === "bye" ? null : away.id,
        home_team_name: home.name,
        away_team_name: away.name,
      });
    }

    rounds.push({
      number: round + 1,
      matches,
    });
  }

  if (!options.doubleRound) {
    return rounds;
  }

  const returnRounds: GeneratedRound[] = rounds.map((round) => ({
    number: round.number + totalRounds,
    matches: round.matches.map((match) => ({
      home_team_id: match.away_team_id,
      away_team_id: match.home_team_id,
      home_team_name: match.away_team_name,
      away_team_name: match.home_team_name,
    })),
  }));

  return [...rounds, ...returnRounds];
}