// Run with `npx tsx test_sepay.ts` (if tsx is available) or we can compile and run.

import * as assert from 'assert';
import { SePayAdapter } from './src/services/adapters/SePayAdapter';

async function runTests() {
  console.log("Running SePay Tests...");
  
  const adapter = new SePayAdapter("secret123");
  
  // 1. Validate signature
  console.log("Test: Validate Signature");
  const payloadStr = JSON.stringify({ test: "data" });
  
  // We mock crypto for Node since this is using web crypto, but in Node 20+ global crypto has subtle.
  // We'll skip HMAC signature test if crypto.subtle is not globally available in this node version.
  if (typeof crypto !== 'undefined' && crypto.subtle) {
      const encoder = new TextEncoder();
      const keyData = encoder.encode("secret123");
      const key = await crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
      const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(payloadStr));
      const signatureHex = Array.from(new Uint8Array(signatureBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
      
      const isValid = await adapter.validateSignature(payloadStr, signatureHex);
      assert.ok(isValid, "Signature should be valid");
      
      const isInvalid = await adapter.validateSignature(payloadStr, "wronghex");
      assert.ok(!isInvalid, "Wrong signature should be invalid");
  }

  // 2. Normalization
  console.log("Test: Normalize SePay Payload");
  const payload = {
    id: 92704,
    gateway: "MBBank",
    transactionDate: "2024-01-01 12:00:00",
    accountNumber: "123456789",
    code: null,
    content: "DONATE-QAL-8F32KD",
    transferType: "in" as const,
    transferAmount: 100000,
    accumulated: 500000,
    subAccountCode: null,
    referenceCode: "DONATE-QAL-8F32KD",
    description: "Donate to QAL"
  };

  const paymentEvent = adapter.normalize(payload);
  assert.strictEqual(paymentEvent.provider, "sepay");
  assert.strictEqual(paymentEvent.amount, 100000);
  assert.strictEqual(paymentEvent.referenceCode, "DONATE-QAL-8F32KD");
  assert.strictEqual(paymentEvent.transferType, "in");
  assert.strictEqual(paymentEvent.providerEventId, "sepay:92704");

  console.log("All SePay Adapter tests passed!");
}

runTests().catch(console.error);
