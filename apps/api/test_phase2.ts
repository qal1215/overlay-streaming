import { SepayWebhookService } from './src/services/sepay/sepay-webhook-service';
import { SecretEncryptionService } from './src/services/SecretEncryptionService';

async function runTests() {
  console.log("Running Phase 2 Webhook Auth Tests...");
  let passed = true;

  const mockSecret = "sepay_super_secret_12345";
  const mockWebhookId = "wh_123456789";
  const mockCreatorId = "creator_123";
  const mockAccountNumber = "999999999";
  
  const webhookService = new SepayWebhookService(mockSecret);
  
  // Create a valid payload
  const validPayload = {
    id: 1234,
    gateway: "VietQR",
    transactionDate: "2024-01-01 12:00:00",
    accountNumber: mockAccountNumber,
    subAccountCode: null,
    code: null,
    content: "Donation from Alice",
    transferType: "in",
    transferAmount: 50000,
    accumulated: 100000,
    referenceCode: "REF123",
    description: "Thank you"
  };
  const rawBodyA = JSON.stringify(validPayload);
  const rawBodyB = JSON.stringify(validPayload, null, 2); // Whitespace formatting difference
  
  const nowStr = Math.floor(Date.now() / 1000).toString();
  
  // Helper to sign data
  async function signPayload(timestamp: string, body: string, secret: string) {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const key = await crypto.subtle.importKey(
      "raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
    );
    const dataToSign = `${timestamp}.${body}`;
    const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(dataToSign));
    return "sha256=" + Array.from(new Uint8Array(signatureBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  const validSignature = await signPayload(nowStr, rawBodyA, mockSecret);

  // Test A - Valid signature
  try {
    await webhookService.processRequest(mockCreatorId, rawBodyA, nowStr, validSignature, mockAccountNumber);
    console.log("Test A Passed: Valid signature processed successfully.");
  } catch (e: any) {
    console.error("Test A Failed:", e.message);
    passed = false;
  }

  // Test B - Invalid signature
  try {
    await webhookService.processRequest(mockCreatorId, rawBodyA, nowStr, "sha256=invalidhash", mockAccountNumber);
    console.error("Test B Failed: Processed request with invalid signature.");
    passed = false;
  } catch (e: any) {
    if (e.message !== "Invalid signature or expired timestamp") {
      console.error("Test B Failed: Wrong error message:", e.message);
      passed = false;
    } else {
      console.log("Test B Passed: Rejected invalid signature.");
    }
  }

  // Test C - Missing authentication (no signature)
  try {
    await webhookService.processRequest(mockCreatorId, rawBodyA, nowStr, "", mockAccountNumber);
    console.error("Test C Failed: Processed request with missing signature.");
    passed = false;
  } catch (e: any) {
    if (e.message !== "Invalid signature or expired timestamp") {
      console.error("Test C Failed: Wrong error message:", e.message);
      passed = false;
    } else {
      console.log("Test C Passed: Rejected missing signature.");
    }
  }

  // Test E - Modified body
  const modifiedPayload = { ...validPayload, transferAmount: 100000 };
  const modifiedBody = JSON.stringify(modifiedPayload);
  try {
    await webhookService.processRequest(mockCreatorId, modifiedBody, nowStr, validSignature, mockAccountNumber);
    console.error("Test E Failed: Processed request with modified body but original signature.");
    passed = false;
  } catch (e: any) {
    if (e.message !== "Invalid signature or expired timestamp") {
      console.error("Test E Failed: Wrong error message:", e.message);
      passed = false;
    } else {
      console.log("Test E Passed: Rejected modified body with valid signature.");
    }
  }

  // Test F - Whitespace preservation (raw body mismatch)
  try {
    await webhookService.processRequest(mockCreatorId, rawBodyB, nowStr, validSignature, mockAccountNumber);
    console.error("Test F Failed: Processed request despite whitespace modifications to raw body.");
    passed = false;
  } catch (e: any) {
    if (e.message !== "Invalid signature or expired timestamp") {
      console.error("Test F Failed: Wrong error message:", e.message);
      passed = false;
    } else {
      console.log("Test F Passed: Rejected body that changed formatting (signature is bound to EXACT raw body bytes).");
    }
  }

  // Test H - Replay/Timestamp
  const oldTimestamp = (Math.floor(Date.now() / 1000) - 10 * 60).toString(); // 10 minutes ago
  const oldSignature = await signPayload(oldTimestamp, rawBodyA, mockSecret);
  try {
    await webhookService.processRequest(mockCreatorId, rawBodyA, oldTimestamp, oldSignature, mockAccountNumber);
    console.error("Test H Failed: Processed expired webhook.");
    passed = false;
  } catch (e: any) {
    if (e.message !== "Invalid signature or expired timestamp") {
      console.error("Test H Failed: Wrong error message:", e.message);
      passed = false;
    } else {
      console.log("Test H Passed: Rejected webhook with timestamp > 5 minutes old (Replay mitigation).");
    }
  }

  if (passed) {
    console.log("ALL PHASE 2 LOCAL TESTS PASSED!");
  } else {
    console.error("SOME PHASE 2 TESTS FAILED.");
    process.exit(1);
  }
}

runTests().catch(console.error);
