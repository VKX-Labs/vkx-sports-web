import { z } from "zod";

export const createChampionshipSchema = z.object({
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres"),
  description: z.string().optional(),
  modality: z.string().min(1, "Selecione uma modalidade"),
  city: z.string().min(1, "Informe a cidade"),
  state: z.string().length(2, "UF deve ter 2 caracteres").toUpperCase(),
  tournament_type: z.enum([
    "PONTOS_CORRIDOS",
    "MATA_MATA",
    "GRUPOS_MATA_MATA",
    "COPA",
  ]),
  max_teams: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

export type CreateChampionshipFormData = z.infer<typeof createChampionshipSchema>;
