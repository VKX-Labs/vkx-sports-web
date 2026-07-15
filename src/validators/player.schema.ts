import * as z from "zod";

export const playerSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  team_id: z.string().nullable().default(null),
});

export type PlayerFormValues = z.infer<typeof playerSchema>;