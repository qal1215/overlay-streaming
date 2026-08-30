import { z } from "zod";

export const AssetDefinitionSchema = z.object({
  id: z.string(),
  creatorId: z.string(),
  name: z.string(),
  type: z.enum(["image", "gif", "video", "font"]),
  mimeType: z.string(),
  storageKey: z.string(),
  url: z.string(),
  size: z.number(),
  width: z.number().optional(),
  height: z.number().optional(),
  duration: z.number().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export type AssetDefinition = z.infer<typeof AssetDefinitionSchema>;
