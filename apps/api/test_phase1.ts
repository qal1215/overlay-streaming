import { SecretEncryptionService } from './src/services/SecretEncryptionService';
import { generateSepayWebhookId, getSepayWebhookUrl } from './src/utils/webhook-utils';

async function runTests() {
  console.log("Running Phase 1 Tests...");
  let passed = true;

  // Test 3: Generate webhookId
  const webhookId = generateSepayWebhookId();
  if (!webhookId.startsWith("wh_") || webhookId.length < 10) {
    console.error("Test 3 Failed: webhookId is not opaque or invalid:", webhookId);
    passed = false;
  } else {
    console.log("Test 3 Passed: webhookId generated correctly:", webhookId);
  }

  // Test 4: Webhook URL
  const url = getSepayWebhookUrl("https://api.example.com", webhookId);
  if (url !== `https://api.example.com/api/webhooks/sepay/${webhookId}`) {
    console.error("Test 4 Failed: Webhook URL format is incorrect:", url);
    passed = false;
  } else {
    console.log("Test 4 Passed: Webhook URL is correct.");
  }

  // Test 6: Secret encryption/decryption
  // Generate a mock 32-byte key (64 hex chars)
  const mockKeyHex = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  const encryptor = new SecretEncryptionService(mockKeyHex);
  const plaintextSecret = "sepay_secret_token_12345";
  
  const ciphertext = await encryptor.encrypt(plaintextSecret);
  if (ciphertext === plaintextSecret || !ciphertext.startsWith("v1:")) {
    console.error("Test 6 Failed: Ciphertext is not encrypted properly:", ciphertext);
    passed = false;
  }
  
  const decrypted = await encryptor.decrypt(ciphertext);
  if (decrypted !== plaintextSecret) {
    console.error("Test 6 Failed: Decrypted text does not match plaintext.");
    passed = false;
  } else {
    console.log("Test 6 Passed: Encryption/Decryption works flawlessly.");
  }

  if (passed) {
    console.log("ALL PHASE 1 LOCAL TESTS PASSED!");
  } else {
    console.error("SOME PHASE 1 TESTS FAILED.");
    process.exit(1);
  }
}

runTests().catch(console.error);
