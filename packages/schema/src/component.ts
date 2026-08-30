import { z } from "zod";

export const ComponentPositionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export const ComponentSizeSchema = z.object({
  width: z.number(),
  height: z.number(),
});

export const BaseComponentSchema = z.object({
  id: z.string(),
  position: ComponentPositionSchema,
  size: ComponentSizeSchema,
  zIndex: z.number().default(0),
});

export const ImageComponentSchema = BaseComponentSchema.extend({
  type: z.literal("image"),
  assetId: z.string().optional(), // Used to lookup AssetDefinition from D1
});

export const VideoComponentSchema = BaseComponentSchema.extend({
  type: z.literal("video"),
  assetId: z.string().optional(),
  loop: z.boolean().default(true),
});

export const OverlayComponentSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("alert"), id: z.string(), position: ComponentPositionSchema, size: ComponentSizeSchema, zIndex: z.number().default(0), config: z.record(z.unknown()) }),
  z.object({ type: z.literal("text"), id: z.string(), position: ComponentPositionSchema, size: ComponentSizeSchema, zIndex: z.number().default(0), config: z.record(z.unknown()) }),
  ImageComponentSchema,
  VideoComponentSchema,
  z.object({ type: z.literal("goal"), id: z.string(), position: ComponentPositionSchema, size: ComponentSizeSchema, zIndex: z.number().default(0), config: z.record(z.unknown()) }),
  z.object({ type: z.literal("custom"), id: z.string(), position: ComponentPositionSchema, size: ComponentSizeSchema, zIndex: z.number().default(0), config: z.record(z.unknown()) }),
]);

export type OverlayComponent = z.infer<typeof OverlayComponentSchema>;
