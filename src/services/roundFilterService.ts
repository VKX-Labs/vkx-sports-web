import {
  TournamentType,
  RoundFilterOption,
  PHASE_NAMES,
  getPhaseRoundName,
} from "@/types/tournament";
import { getBracketStructure } from "@/utils/generators/bracket";

export class RoundFilterService {
  static getFilterOptions(
    type: TournamentType,
    totalTeams: number = 16,
    hasTwoLegs: boolean = false
  ): RoundFilterOption[] {
    switch (type) {
      case "MATA_MATA":
      case "COPA":
        return this.getKnockoutPhaseOptions(totalTeams, hasTwoLegs);

      case "GRUPOS_MATA_MATA":
        return [
          { label: "Grupo - 1ª Rodada", value: "GROUP_R1", category: "GROUP" },
          { label: "Grupo - 2ª Rodada", value: "GROUP_R2", category: "GROUP" },
          { label: "Grupo - 3ª Rodada", value: "GROUP_R3", category: "GROUP" },
          ...this.getKnockoutPhaseOptions(totalTeams, hasTwoLegs),
        ];

      case "ELIMINATORIA_DUPLA":
        return [
          { label: "Upper Bracket - Rodada 1", value: "UPPER_R1", category: "KNOCKOUT" },
          { label: "Upper Bracket - Semifinal", value: "UPPER_SEMI", category: "KNOCKOUT" },
          { label: "Lower Bracket - Rodada 1", value: "LOWER_R1", category: "KNOCKOUT" },
          { label: "Lower Bracket - Semifinal", value: "LOWER_SEMI", category: "KNOCKOUT" },
          { label: "Final Upper vs Lower", value: "FINAL", category: "KNOCKOUT" },
        ];

      case "PONTOS_CORRIDOS":
      default:
        const totalRounds = (totalTeams - 1) * (hasTwoLegs ? 2 : 1);
        return Array.from({ length: totalRounds }, (_, i) => ({
          label: `${i + 1}ª Rodada`,
          value: `ROUND_${i + 1}`,
          category: "GROUP" as const,
        }));
    }
  }

  static getKnockoutBracketSizes(totalTeams: number): Record<string, number> {
    return Object.fromEntries(
      getBracketStructure(totalTeams).map((round) => [
        round.phase,
        round.matchCount,
      ])
    );
  }

  private static getKnockoutPhaseOptions(
    totalTeams: number,
    hasTwoLegs: boolean
  ): RoundFilterOption[] {
    const base = this.getKnockoutPhases(totalTeams);

    if (!hasTwoLegs) {
      return base.map((phase) => ({
        label: PHASE_NAMES[phase] || phase,
        value: phase,
        category: "KNOCKOUT",
      }));
    }

    return base.flatMap((phase) => [
      {
        label: getPhaseRoundName(phase, "IDA"),
        value: phase,
        category: "SPLIT" as const,
        leg: "IDA" as const,
      },
      {
        label: getPhaseRoundName(phase, "VOLTA"),
        value: phase,
        category: "SPLIT" as const,
        leg: "VOLTA" as const,
      },
    ]);
  }

  private static getKnockoutPhases(totalTeams: number): string[] {
    const phases: string[] = [];
    for (const round of getBracketStructure(totalTeams)) {
      phases.push(round.phase);
    }
    phases.push("THIRD_PLACE", "FINAL");
    return Array.from(new Set(phases));
  }
}
