import { z } from "zod";
import { OverlayComponentSchema } from "./component";

export const OverlayDefinitionSchema = z.object({
  id: z.string(),
  creatorId: z.string(),
  name: z.string(),
  description: z.string().optional().nullable(),
  width: z.number(),
  height: z.number(),
  enabled: z.boolean(),
  components: z.array(OverlayComponentSchema),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type OverlayDefinition = z.infer<typeof OverlayDefinitionSchema>;
