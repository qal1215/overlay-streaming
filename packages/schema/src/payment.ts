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
