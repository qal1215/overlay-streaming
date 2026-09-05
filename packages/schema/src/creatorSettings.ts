import { z } from "zod";

export const DonationSettingsSchema = z.object({
  enabled: z.boolean().default(false),
  minAmount: z.number().int().min(1000).default(10000),
  presetAmounts: z.array(z.number().int().min(1000)).default([20000, 50000, 100000, 200000]),
  allowMessage: z.boolean().default(true),
  allowAnonymous: z.boolean().default(true),
});

export type DonationSettings = z.infer<typeof DonationSettingsSchema>;

export const PaymentAccountSchema = z.object({
  provider: z.enum(["sepay", "payos", "stripe", "crypto"]).default("sepay"),
  bank: z.string().optional(),
  accountNumber: z.string().optional(),
  accountName: z.string().optional(),
});

export type PaymentAccount = z.infer<typeof PaymentAccountSchema>;

export const CreatorDonationSettingsResponseSchema = z.object({
  creatorId: z.string(),
  donationSettings: DonationSettingsSchema,
  paymentAccount: PaymentAccountSchema,
  sepayWebhookConfigured: z.boolean().default(false),
  sepayWebhookUrl: z.string().optional(),
});

export type CreatorDonationSettingsResponse = z.infer<typeof CreatorDonationSettingsResponseSchema>;

export const UpdateCreatorDonationSettingsSchema = z.object({
  creatorId: z.string(),
  donationSettings: DonationSettingsSchema,
  paymentAccount: PaymentAccountSchema,
  sepayWebhookSecret: z.string().min(32).max(256).optional(),
});

export type UpdateCreatorDonationSettings = z.infer<typeof UpdateCreatorDonationSettingsSchema>;

// Public settings for the donor page (secrets removed)
export const PublicDonationSettingsSchema = z.object({
  creator: z.object({
    username: z.string(),
    displayName: z.string(),
    avatarUrl: z.string().optional(),
  }),
  donation: z.object({
    enabled: z.boolean(),
    minAmount: z.number().int(),
    presetAmounts: z.array(z.number().int()),
    allowMessage: z.boolean(),
    allowAnonymous: z.boolean(),
    currency: z.string(),
  })
});

export type PublicDonationSettings = z.infer<typeof PublicDonationSettingsSchema>;
