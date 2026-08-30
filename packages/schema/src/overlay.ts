import { z } from "zod";

export const ComponentPositionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export const ComponentSizeSchema = z.object({
  width: z.number(),
  height: z.number(),
});

export const OverlayComponentSchema = z.object({
  id: z.string(),
  type: z.enum(["alert", "text", "image", "video", "goal", "custom"]),
  position: ComponentPositionSchema,
  size: ComponentSizeSchema,
  zIndex: z.number().default(0),
  config: z.record(z.unknown()), // Depending on component type
});

export type OverlayComponent = z.infer<typeof OverlayComponentSchema>;

export const OverlayDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  resolution: z.object({
    width: z.number(),
    height: z.number(),
  }),
  components: z.array(OverlayComponentSchema),
  updatedAt: z.number(),
});

export type OverlayDefinition = z.infer<typeof OverlayDefinitionSchema>;
