import { z } from "zod";

export const CreatorConfigSchema = z.object({
  id: z.string(),
  theme: z.string().default("cyberpunk"),
  volume: z.number().min(0).max(1).default(0.8),
});

export type CreatorConfig = z.infer<typeof CreatorConfigSchema>;
