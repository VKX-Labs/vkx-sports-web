import { z } from "zod";

export const createTeamSchema = z.object({
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres"),
  short_name: z.string().max(5, "Máximo de 5 caracteres").optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  manager: z.string().optional().or(z.literal("")),
});

export type CreateTeamFormData = z.infer<typeof createTeamSchema>;
