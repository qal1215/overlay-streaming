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
  assets: z.record(z.any()).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type OverlayDefinition = z.infer<typeof OverlayDefinitionSchema>;

import { AlertEventSchema } from "./alert";

export const OverlayRuntimeMessageSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("overlay:init"),
    overlay: OverlayDefinitionSchema,
  }),
  z.object({
    type: z.literal("overlay:update"),
    overlay: OverlayDefinitionSchema,
  }),
  z.object({
    type: z.literal("overlay:activate"),
    overlayId: z.string(),
  }),
  z.object({
    type: z.literal("overlay:deactivate"),
    overlayId: z.string(),
  }),
  z.object({
    type: z.literal("alert:event"),
    event: AlertEventSchema,
  }),
  z.object({
    type: z.literal("error"),
    message: z.string(),
  }),
]);

export type OverlayRuntimeMessage = z.infer<typeof OverlayRuntimeMessageSchema>;
