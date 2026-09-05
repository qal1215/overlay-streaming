import * as assert from 'assert';
import { SecretEncryptionService } from './src/services/SecretEncryptionService';

async function runTests() {
  console.log("Running Encryption Tests...");
  
  // 32-byte hex key
  const validKey = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
  const encryptor = new SecretEncryptionService(validKey);

  // 1. Encrypt / Decrypt round trip
  const plaintext = "my_super_secret_sepay_webhook_key_123!";
  const ciphertext1 = await encryptor.encrypt(plaintext);
  
  const decrypted = await encryptor.decrypt(ciphertext1);
  assert.strictEqual(decrypted, plaintext, "Decrypted text should match original plaintext");

  // 2. Different IV each encryption
  const ciphertext2 = await encryptor.encrypt(plaintext);
  assert.notStrictEqual(ciphertext1, ciphertext2, "Ciphertexts must be different (random IVs)");

  // 3. Invalid ciphertext
  try {
    await encryptor.decrypt("invalid:format");
    assert.fail("Should throw on invalid format");
  } catch (e: any) {
    assert.match(e.message, /Invalid encrypted format/);
  }

  // 4. Wrong key
  const wrongKey = "fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210";
  const wrongEncryptor = new SecretEncryptionService(wrongKey);
  try {
    await wrongEncryptor.decrypt(ciphertext1);
    assert.fail("Should throw on wrong key");
  } catch (e: any) {
    assert.ok(e, "Threw error on wrong key");
  }

  // 5. Missing key / invalid key size
  try {
    new SecretEncryptionService(undefined);
    assert.fail("Should throw if key is undefined");
  } catch (e: any) {
    assert.match(e.message, /required but not provided/);
  }

  try {
    const invalidEncryptor = new SecretEncryptionService("tooshort");
    await invalidEncryptor.encrypt("test");
    assert.fail("Should throw on invalid length key");
  } catch (e: any) {
    assert.match(e.message, /PLATFORM_ENCRYPTION_KEY must be exactly 32 bytes/);
  }

  console.log("All Encryption tests passed!");
}

runTests().catch(console.error);
