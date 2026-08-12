import * as z from "zod";
import { PLAYER_POSITIONS } from "@/types/player";

export { PLAYER_POSITIONS };
export type { PlayerPosition } from "@/types/player";

export const playerSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  team_id: z.string().nullable().default(null),
  position: z.enum(PLAYER_POSITIONS).nullable().default(null),
  number: z
    .union([
      z.number().int().min(1, "Número mínimo: 1").max(99, "Número máximo: 99"),
      z.null(),
    ])
    .optional(),
});

export type PlayerFormValues = z.infer<typeof playerSchema>;
