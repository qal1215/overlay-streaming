import { z } from "zod";

export const AssetDefinitionSchema = z.object({
  id: z.string(),
  creatorId: z.string(),
  type: z.enum(["image", "audio", "video", "font"]),
  key: z.string(),
  mimeType: z.string(),
  size: z.number(),
  url: z.string(),
  createdAt: z.number(),
});

export type AssetDefinition = z.infer<typeof AssetDefinitionSchema>;
