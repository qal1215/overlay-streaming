import { z } from "zod";

export const AudioDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(),
  volume: z.number().min(0).max(1).default(1),
  categoryId: z.string().optional(),
});

export type AudioDefinition = z.infer<typeof AudioDefinitionSchema>;
