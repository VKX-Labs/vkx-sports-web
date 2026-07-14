import { z } from "zod";

export const createTeamSchema = z.object({
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres"),
  initials: z
    .string()
    .max(3, "Máximo de 3 letras")
    .toUpperCase()
    .optional(),
  city: z.string().optional(),
  state: z.string().max(2).toUpperCase().optional(),
  manager_name: z.string().optional(),
  manager_phone: z.string().optional(),
  kit_primary: z.string(),
  kit_secondary: z.string(),
});

export type CreateTeamFormData = z.infer<typeof createTeamSchema>;
