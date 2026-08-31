import { z } from "zod";

export const AlertThemeSchema = z.enum([
  "cyberpunk",
  "minimal",
  "modern-glass",
  "gaming",
  "anime",
  "retro",
  "classic",
  "neon",
  "holographic",
  "comic",
  "luxury",
  "glitch",
  "scifi",
  "3d",
  "memes"
]);

export type AlertTheme = z.infer<typeof AlertThemeSchema>;

export const AlertTimelineEventSchema = z.object({
  at: z.number(),
  type: z.enum(["enter", "impact", "tts", "exit"]),
  sound: z.string().optional(),
});

export type AlertTimelineEvent = z.infer<typeof AlertTimelineEventSchema>;

export const AlertTimelineSchema = z.object({
  duration: z.number(),
  events: z.array(AlertTimelineEventSchema),
});

export type AlertTimeline = z.infer<typeof AlertTimelineSchema>;

export const AlertPresetSchema = z.object({
  theme: AlertThemeSchema,
  visual: z.object({
    primaryColor: z.string().optional(),
    secondaryColor: z.string().optional(),
    fontFamily: z.string().optional(),
    layout: z.enum(["centered", "side", "banner"]).default("centered"),
  }).default({ layout: "centered" }),
  animation: z.object({
    enterStyle: z.enum(["fade", "slide", "bounce", "zoom", "glitch"]).default("fade"),
    exitStyle: z.enum(["fade", "slide", "bounce", "zoom", "glitch"]).default("fade"),
  }).default({ enterStyle: "fade", exitStyle: "fade" }),
  audio: z.object({
    volume: z.number().min(0).max(1).default(0.8),
  }).default({ volume: 0.8 }),
  tts: z.object({
    enabled: z.boolean().default(false),
    voice: z.string().default("default"),
    volume: z.number().min(0).max(1).default(0.8),
    template: z.string().default("{name} donated {amount}! {message}"),
  }).default({ enabled: false, voice: "default", volume: 0.8, template: "{name} donated {amount}! {message}" }),
});

export type AlertPreset = z.infer<typeof AlertPresetSchema>;

export const AlertDataSchema = z.object({
  donorName: z.string(),
  amount: z.string(),
  message: z.string().optional(),
  imageUrl: z.string().optional(),
});

export const AlertDefinitionSchema = z.object({
  id: z.string(),
  preset: AlertPresetSchema,
  data: AlertDataSchema,
  timeline: AlertTimelineSchema,
});

export type AlertDefinition = z.infer<typeof AlertDefinitionSchema>;

export const AlertEventSchema = z.object({
  id: z.string(),
  type: z.enum(["donation", "follow", "subscription", "raid", "custom"]),
  timestamp: z.number(),
  actor: z.object({
    name: z.string(),
    amount: z.string().optional(),
    currency: z.string().optional(),
  }).optional(),
  message: z.string().optional(),
  alert: z.object({
    presetId: z.string().optional(),
    duration: z.number().optional(),
  }).optional(),
});

export type AlertEvent = z.infer<typeof AlertEventSchema>;
