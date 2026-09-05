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

  // Robust signature validation based on SePay documentation
  async validateSignature(rawBody: string, timestampStr: string, signatureHeader: string): Promise<boolean> {
    if (!this.webhookSecret || !signatureHeader || !timestampStr) return false;
    
    // Replay protection (5 minutes tolerance)
    const timestampMs = parseInt(timestampStr, 10) * 1000;
    if (isNaN(timestampMs)) return false;
    
    const now = Date.now();
    const toleranceMs = 5 * 60 * 1000;
    if (Math.abs(now - timestampMs) > toleranceMs) {
      console.log(`[SePay] Webhook replay protection triggered. TS: ${timestampMs}, Now: ${now}`);
      return false;
    }

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
    
    // SePay HMAC is usually timestamp + rawBody, but some docs might say just rawBody. 
    // The user prompt says: HMAC-SHA256( secret, `${timestamp}.${rawBody}` )
    // We will use `${timestampStr}.${rawBody}` or just follow standard SePay format.
    // Wait, the user explicitly said: HMAC-SHA256( secret, `${timestamp}.${rawBody}` )
    const payloadToSign = `${timestampStr}.${rawBody}`;
    const bodyData = encoder.encode(payloadToSign);
    
    // We expect signatureHeader to be hex. Sometimes they have 'sha256=' prefix.
    const actualSignature = signatureHeader.replace(/^sha256=/, '');
    
    // We can use crypto.subtle.verify for constant time comparison if we convert the hex back to ArrayBuffer,
    // or we can sign and manually compare constant-time.
    // Let's sign and use a simple constant-time compare function.
    const signatureBuffer = await crypto.subtle.sign(
      "HMAC",
      key,
      bodyData
    );
    
    const expectedSignatureHex = Array.from(new Uint8Array(signatureBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    
    return this.timingSafeEqual(actualSignature, expectedSignatureHex);
  }

  // Basic constant-time string comparison
  private timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
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
