export class SecretEncryptionService {
  private keyStr: string;

  constructor(keyStr: string | undefined) {
    if (!keyStr) {
      throw new Error("PLATFORM_ENCRYPTION_KEY is required but not provided.");
    }
    // We expect the key to be exactly 32 bytes when decoded
    this.keyStr = keyStr;
  }

  private async getCryptoKey(): Promise<CryptoKey> {
    const keyBuffer = this.decodeKey(this.keyStr);
    if (keyBuffer.byteLength !== 32) {
      throw new Error("PLATFORM_ENCRYPTION_KEY must be exactly 32 bytes for AES-256-GCM.");
    }
    
    return crypto.subtle.importKey(
      "raw",
      keyBuffer,
      { name: "AES-GCM" },
      false,
      ["encrypt", "decrypt"]
    );
  }

  private decodeKey(keyStr: string): Uint8Array {
    // Attempt hex decode first. If not hex, try base64. 
    // Usually standard to just support hex or base64. We will support hex.
    if (/^[0-9a-fA-F]{64}$/.test(keyStr)) {
      const bytes = new Uint8Array(32);
      for (let i = 0; i < 32; i++) {
        bytes[i] = parseInt(keyStr.substring(i * 2, i * 2 + 2), 16);
      }
      return bytes;
    }
    // Try base64
    try {
      const binaryString = atob(keyStr);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
    } catch (e) {
      throw new Error("Failed to decode PLATFORM_ENCRYPTION_KEY. It must be valid hex or base64.");
    }
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  async encrypt(plaintext: string): Promise<string> {
    const key = await this.getCryptoKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(plaintext);

    const ciphertext = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      encoded
    );

    const version = "v1";
    const ivBase64 = this.arrayBufferToBase64(iv.buffer);
    const ciphertextBase64 = this.arrayBufferToBase64(ciphertext);

    return `${version}:${ivBase64}:${ciphertextBase64}`;
  }

  async decrypt(encryptedData: string): Promise<string> {
    const parts = encryptedData.split(":");
    if (parts.length !== 3) {
      throw new Error("Invalid encrypted format. Expected version:iv:ciphertext");
    }

    const [version, ivBase64, ciphertextBase64] = parts;

    if (version !== "v1") {
      throw new Error(`Unsupported encryption version: ${version}`);
    }

    const key = await this.getCryptoKey();
    const iv = this.base64ToArrayBuffer(ivBase64);
    const ciphertext = this.base64ToArrayBuffer(ciphertextBase64);

    const decrypted = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: new Uint8Array(iv),
      },
      key,
      ciphertext
    );

    return new TextDecoder().decode(decrypted);
  }
}
