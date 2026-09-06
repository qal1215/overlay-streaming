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
    
    const actualSignatureHex = signatureHeader.replace(/^sha256=/, '');
    
    // Convert hex signature to Uint8Array for crypto.subtle.verify
    if (actualSignatureHex.length !== 64) return false;
    const signatureBytes = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      signatureBytes[i] = parseInt(actualSignatureHex.substring(i * 2, i * 2 + 2), 16);
    }
    
    try {
      // Use native constant-time verification
      return await crypto.subtle.verify("HMAC", key, signatureBytes, bodyData);
    } catch (e) {
      return false;
    }
  }
}
