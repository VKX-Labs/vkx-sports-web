import { TournamentType, RoundFilterOption } from "@/types/tournament";

export class RoundFilterService {
  static getFilterOptions(
    type: TournamentType,
    totalTeams: number = 16,
    hasTwoLegs: boolean = false
  ): RoundFilterOption[] {
    switch (type) {
      case "MATA_MATA":
        return [
          { label: "Oitavas de Final", value: "OITAVAS", category: "KNOCKOUT" },
          { label: "Quartas de Final", value: "QUARTAS", category: "KNOCKOUT" },
          { label: "Semifinal", value: "SEMI", category: "KNOCKOUT" },
          { label: "Disputa de 3º Lugar", value: "TERCEIRO_LUGAR", category: "KNOCKOUT" },
          { label: "Final", value: "FINAL", category: "KNOCKOUT" },
        ];

      case "COPA":
      case "GRUPOS_MATA_MATA":
        return [
          { label: "Grupo - 1ª Rodada", value: "GROUP_R1", category: "GROUP" },
          { label: "Grupo - 2ª Rodada", value: "GROUP_R2", category: "GROUP" },
          { label: "Grupo - 3ª Rodada", value: "GROUP_R3", category: "GROUP" },
          { label: "Playoffs / Pré-Libertadores", value: "PRE_PLAYOFF", category: "KNOCKOUT" },
          { label: "Oitavas de Final", value: "OITAVAS", category: "KNOCKOUT" },
          { label: "Quartas de Final", value: "QUARTAS", category: "KNOCKOUT" },
          { label: "Semifinal", value: "SEMI", category: "KNOCKOUT" },
          { label: "Final", value: "FINAL", category: "KNOCKOUT" },
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
}