import { z } from "zod";
import { AlertDefinitionSchema } from "./alert";

export const OverlayEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("NEW_ALERT"),
    data: AlertDefinitionSchema,
  }),
  z.object({
    type: z.literal("CONFIG_UPDATED"),
    data: z.object({
      theme: z.string(),
      volume: z.number(),
    }),
  }),
]);

export type OverlayEvent = z.infer<typeof OverlayEventSchema>;
