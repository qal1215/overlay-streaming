import { SePayWebhookPayload } from "@overlay/schema";
import { DonationEvent } from "../../types/donation";

export class SepayAdapter {
  normalize(creatorId: string, payload: SePayWebhookPayload): DonationEvent {
    return {
      id: crypto.randomUUID(), // Internal event ID
      creatorId,
      provider: "sepay",
      providerTransactionId: payload.id.toString(),
      amount: payload.transferAmount,
      currency: "VND", // SePay primarily operates in VND
      paymentReference: payload.referenceCode, // To correlate with pending donations
      donorName: "Anonymous", // Can be derived if SePay provides it, but usually not in standard bank transfer unless parsed from content
      message: payload.content,
      occurredAt: payload.transactionDate,
    };
  }
}
