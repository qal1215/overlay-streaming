import { PaymentEvent } from "@overlay/schema";

// SePay webhook payload schema (based on SePay docs)
export interface SePayWebhookPayload {
  id: number;
  gateway: string;
  transactionDate: string;
  accountNumber: string;
  code: string | null;
  content: string;
  transferType: "in" | "out";
  transferAmount: number;
  accumulated: number;
  subAccountCode: string | null;
  referenceCode: string;
  description: string;
}

export class SePayAdapter {
  constructor(private webhookSecret: string) {}

  // Basic signature validation based on SePay documentation
  // They use HMAC-SHA256 of the raw body payload with the configured secret
  // Note: for Cloudflare Workers, we need to use the Web Crypto API
  async validateSignature(rawBody: string, signatureHeader: string): Promise<boolean> {
    if (!this.webhookSecret || !signatureHeader) return false;
    
    // Convert secret string to key
    const encoder = new TextEncoder();
    const keyData = encoder.encode(this.webhookSecret);
    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"]
    );
    
    // Generate signature for body
    const bodyData = encoder.encode(rawBody);
    const signatureBuffer = await crypto.subtle.sign(
      "HMAC",
      key,
      bodyData
    );
    
    // Convert signature buffer to hex string
    const signatureArray = Array.from(new Uint8Array(signatureBuffer));
    const signatureHex = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Timing safe comparison could be implemented here, but simple equality for MVP
    return signatureHex === signatureHeader;
  }

  normalize(payload: SePayWebhookPayload): PaymentEvent {
    // We expect the payment reference to be exactly the referenceCode 
    // parsed by SePay (e.g., DONATE-QAL-8F32KD)
    
    return {
      provider: "sepay",
      providerEventId: `sepay:${payload.id}`,
      transactionId: payload.id.toString(),
      referenceCode: payload.referenceCode,
      amount: payload.transferAmount,
      currency: "VND", // SePay primarily operates in VND
      transferType: payload.transferType,
      occurredAt: payload.transactionDate,
    };
  }
}
