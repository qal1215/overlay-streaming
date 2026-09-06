import { SePayWebhookPayloadSchema } from "@overlay/schema";
import { DonationEvent } from "../../types/donation";
import { SepaySignatureService } from "./sepay-signature-service";
import { SepayAdapter } from "./sepay-adapter";

export class SepayWebhookService {
  constructor(private webhookSecret: string) {}

  async processRequest(
    creatorId: string,
    rawBody: string, 
    timestampStr: string, 
    signatureHeader: string,
    expectedAccountNumber: string
  ): Promise<DonationEvent> {
    const signatureService = new SepaySignatureService(this.webhookSecret);
    const isValid = await signatureService.validateSignature(rawBody, timestampStr, signatureHeader);
    
    if (!isValid) {
      throw new Error("Invalid signature or expired timestamp");
    }

    let body;
    try {
      body = JSON.parse(rawBody);
    } catch (e) {
      throw new Error("Invalid JSON");
    }

    const payloadResult = SePayWebhookPayloadSchema.safeParse(body);
    if (!payloadResult.success) {
      throw new Error("Malformed payload");
    }

    if (payloadResult.data.accountNumber !== expectedAccountNumber) {
      throw new Error("Destination account mismatch");
    }

    const adapter = new SepayAdapter();
    return adapter.normalize(creatorId, payloadResult.data);
  }
}
