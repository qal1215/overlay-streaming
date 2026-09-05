import { z } from "zod";

export const DonationStatusSchema = z.enum([
  "PENDING",
  "PROCESSING",
  "PAID",
  "FAILED",
  "EXPIRED",
  "CANCELLED",
  "REFUNDED",
]);

export type DonationStatus = z.infer<typeof DonationStatusSchema>;

export const CreateDonationRequestSchema = z.object({
  amount: z.number().int().positive(),
  donorName: z.string().optional(),
  message: z.string().optional(),
});

export type CreateDonationRequest = z.infer<typeof CreateDonationRequestSchema>;

export const DonationResponseSchema = z.object({
  id: z.string(),
  amount: z.number().int(),
  currency: z.string(),
  status: DonationStatusSchema,
  paymentReference: z.string().optional(),
  payment: z.object({
    provider: z.string(),
    qrUrl: z.string().optional(),
    accountNumber: z.string().optional(),
    accountName: z.string().optional(),
    bank: z.string().optional(),
    content: z.string().optional(),
  }).optional(),
});

export type DonationResponse = z.infer<typeof DonationResponseSchema>;
