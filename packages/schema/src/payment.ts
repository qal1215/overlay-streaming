import { z } from "zod";

export const PaymentEventSchema = z.object({
  provider: z.string(),
  providerEventId: z.string(),
  transactionId: z.string(),
  referenceCode: z.string(),
  amount: z.number().int().positive(),
  currency: z.string(),
  transferType: z.enum(["in", "out"]),
  occurredAt: z.string(),
});

export type PaymentEvent = z.infer<typeof PaymentEventSchema>;

export const SePayWebhookPayloadSchema = z.object({
  id: z.number().int(),
  gateway: z.string(),
  transactionDate: z.string(),
  accountNumber: z.string(),
  code: z.string().nullable(),
  content: z.string(),
  transferType: z.enum(["in", "out"]),
  transferAmount: z.number().int(),
  accumulated: z.number().int(),
  subAccountCode: z.string().nullable(),
  referenceCode: z.string(),
  description: z.string(),
});

export type SePayWebhookPayload = z.infer<typeof SePayWebhookPayloadSchema>;
