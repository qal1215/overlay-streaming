export class SepaySignatureService {
  constructor(private webhookSecret: string) {}

  async validateSignature(rawBody: string, timestampStr: string, signatureHeader: string): Promise<boolean> {
    if (!this.webhookSecret || !signatureHeader || !timestampStr) return false;
    
    const timestampMs = parseInt(timestampStr, 10) * 1000;
    if (isNaN(timestampMs)) return false;
    
    const now = Date.now();
    const toleranceMs = 5 * 60 * 1000;
    if (Math.abs(now - timestampMs) > toleranceMs) {
      return false;
    }

    const encoder = new TextEncoder();
    const keyData = encoder.encode(this.webhookSecret);
    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"]
    );
    
    // SePay standard formatting doesn't actually use timestamp. SePay usually just signs the body?
    // Wait, let's use the implementation from the original SePayAdapter: 
    // \`\${timestampStr}.\${rawBody}\` or whatever SePay docs say. We'll use the original logic.
    const payloadToSign = `${timestampStr}.${rawBody}`;
    const bodyData = encoder.encode(payloadToSign);
    
    const actualSignature = signatureHeader.replace(/^sha256=/, '');
    
    const signatureBuffer = await crypto.subtle.sign("HMAC", key, bodyData);
    
    const expectedSignatureHex = Array.from(new Uint8Array(signatureBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    
    return this.timingSafeEqual(actualSignature, expectedSignatureHex);
  }

  private timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
  }
}
